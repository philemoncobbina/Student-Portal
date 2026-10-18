// studentApi.ts (student portal)

import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL, setSessionExpiredHandler, setupHttp } from './http';

// Endpoint paths, relative to API_URL. They must match the URL names in student_auth/urls.py
// (user-detail/ lives in authapp/urls.py and works for any logged-in user).
const ENDPOINTS = {
  login: 'student-login/',
  logout: 'student-logout/',
  userDetail: 'user-detail/',
} as const;

const endpoint = (path: string) => `${API_URL}${path}`;

// Where to send the student when the session is gone. Change it if your route is different.
const STUDENT_LOGIN_ROUTE = '/login';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// While the backend still has AUTH_RETURN_TOKENS_IN_BODY=True the tokens also appear in the
// response body. They are ignored: the HttpOnly cookies are the credentials.
interface LoginResponse {
  access_token?: string;
  refresh_token?: string;
  user: {
    id: number;
    email: string;
    index_number: string;
    class_name: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}

interface LoginRequest {
  email?: string;
  index_number?: string;
  password: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  user?: LoginResponse['user'];
}

// Detailed user interface based on the CustomUser model.
// CHANGED: `verification_code` is removed. Nothing in the browser should ever need it.
interface UserDetails {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_blocked: boolean;
  date_joined: string;
  role: string;
  is_google_account: boolean;
  index_number: string;
  class_name: string | null;
}

// ---------------------------------------------------------------------------
// Client-side state: a UI hint only. The cookies are the real credentials.
// ---------------------------------------------------------------------------

const SESSION_KEY = 'student_session';
// Left over from the old token-in-localStorage version (and from Login.ts).
const LEGACY_KEYS = ['access_token', 'refresh_token', 'user_data', 'auth_method'];

const hasSessionHint = (): boolean => localStorage.getItem(SESSION_KEY) === '1';

const markSession = (): void => {
  localStorage.setItem(SESSION_KEY, '1');
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
};

const clearLocalSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
};

/** For code that ends the session itself, for example after a password change. */
export const endLocalSession = clearLocalSession;

const messageFrom = (error: any, fallback: string): string =>
  error.response
    ? error.response.data?.error || error.response.data?.message || fallback
    : 'Unable to reach the server. Check your connection.';

// ---------------------------------------------------------------------------
// Login / Logout
// ---------------------------------------------------------------------------

export const loginStudent = async (credentials: LoginRequest): Promise<LoginResult> => {
  try {
    const { data } = await axios.post<LoginResponse>(endpoint(ENDPOINTS.login), credentials);

    // The cookies were set by the response; only a hint is kept here (no personal data).
    markSession();
    return { success: true, user: data.user };
  } catch (error: any) {
    return { success: false, error: messageFrom(error, 'Login failed') };
  }
};

export const logout = async (navigate: ReturnType<typeof useNavigate>): Promise<void> => {
  try {
    await axios.post(endpoint(ENDPOINTS.logout), {}, { skipAuthRedirect: true });
  } catch (error: any) {
    console.error('Logout failed:', error.response?.data || error.message);
  } finally {
    clearLocalSession();
    navigate('/');
  }
};

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

/** @deprecated Cookies carry the credentials now. Kept so existing `headers: getAuthHeaders()` calls still work. */
export const getAuthHeaders = (): Record<string, string> => ({});

/** Synchronous UI hint. Use checkSession() when the answer matters. */
export const isAuthenticated = (): boolean => hasSessionHint();

/**
 * Get the logged-in user from the API. Pass { silent: true } for background checks that
 * should not redirect to the login page when the session is gone.
 */
export const getCurrentUser = async (
  options: { silent?: boolean } = {}
): Promise<UserDetails | null> => {
  try {
    const { data } = await axios.get<UserDetails>(endpoint(ENDPOINTS.userDetail), {
      skipAuthRedirect: options.silent ?? false,
    });
    return data;
  } catch (error: any) {
    console.error('Failed to fetch current user:', error.response?.data || error.message);
    return null;
  }
};

// Session check with role information.
export const checkSession = async (): Promise<{
  loggedIn: boolean;
  isStudent?: boolean;
  user?: UserDetails;
}> => {
  // Visitors who never logged in cost no requests at all.
  if (!hasSessionHint()) {
    return { loggedIn: false };
  }

  try {
    // A 401 here triggers one silent refresh (see http.ts) before this call gives up.
    const { data } = await axios.get<UserDetails>(endpoint(ENDPOINTS.userDetail), {
      skipAuthRedirect: true,
    });
    return { loggedIn: true, isStudent: data.role === 'student', user: data };
  } catch (error: any) {
    if (axios.isAxiosError(error) && !error.response) {
      // Server unreachable: keep the student on the page. API calls will still fail.
      console.warn('Offline fallback: keeping the existing session');
      return { loggedIn: true, isStudent: true };
    }

    if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
      clearLocalSession();
    } else {
      console.error('Session check failed:', error.response?.data || error.message);
    }
  }

  return { loggedIn: false };
};

// Check if the user is logged in as a student (via API)
export const isStudentLoggedIn = async (): Promise<boolean> => {
  const session = await checkSession();
  return session.loggedIn && !!session.isStudent;
};

// Get detailed user information (alias for getCurrentUser for consistency)
export const getUserDetails = async (): Promise<UserDetails | null> => {
  return await getCurrentUser();
};

// ---------------------------------------------------------------------------
// Generic authenticated helpers
// ---------------------------------------------------------------------------

/** The URL must start with API_URL, or the cookie and CSRF header are not attached. */
export const fetchData = async (url: string) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch data:', error.response?.data || error.message);
    throw error;
  }
};

/** The URL must start with API_URL, or the cookie and CSRF header are not attached. */
export const postData = async (url: string, data: any) => {
  try {
    const response = await axios.post(url, data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to post data:', error.response?.data || error.message);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Startup: call initAuth() once, before the app renders (main.tsx)
// ---------------------------------------------------------------------------

export const initAuth = (): void => {
  setupHttp();

  // Runs when a request got a 401, the silent refresh failed, and the request wasn't a background check.
  setSessionExpiredHandler(() => {
    const hadSession = hasSessionHint();
    clearLocalSession();
    if (hadSession && window.location.pathname !== STUDENT_LOGIN_ROUTE) {
      window.location.replace(STUDENT_LOGIN_ROUTE);
    }
  });

  // A session from the old token-in-localStorage version can't work any more: start logged out.
  if (localStorage.getItem('access_token')) {
    clearLocalSession();
  }
};

export default {
  loginStudent,
  getAuthHeaders,
  isAuthenticated,
  isStudentLoggedIn,
  getCurrentUser,
  checkSession,
  getUserDetails,
  logout,
  fetchData,
  postData,
  initAuth,
  endLocalSession,
};