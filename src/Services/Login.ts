// Login.ts (regular and Google sign-in)

import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { API_URL } from './http';

// Endpoint paths, relative to API_URL. They must match the URL names in authapp/urls.py
// (session-check/ lives in the admin_auth app but accepts any logged-in user).
// CHANGED: logout is now 'logout/' (the old 'logout-auth/' is not in authapp/urls.py).
const ENDPOINTS = {
  login: 'login/',
  googleSignIn: 'google-signin/',
  sessionCheck: 'session-check/',
  logout: 'logout/',
} as const;

const endpoint = (path: string) => `${API_URL}${path}`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthUser {
  id: number;
  email: string;
  role?: string;
  first_name?: string;
  last_name?: string;
}

// While the backend still has AUTH_RETURN_TOKENS_IN_BODY=True the tokens also appear in the
// response body. They are ignored: the HttpOnly cookies are the credentials.
interface LoginResponse {
  user: AuthUser;
  access_token?: string;
  refresh_token?: string;
}

interface GoogleLoginResponse {
  success: boolean;
  email: string;
  created: boolean;
  first_name?: string;
  last_name?: string;
  error?: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

interface SessionCheckResponse {
  authenticated: boolean;
  user: AuthUser;
}

// ---------------------------------------------------------------------------
// Client-side state: a UI hint only. The cookies are the real credentials.
// ---------------------------------------------------------------------------

const USER_KEY = 'user_data';
const AUTH_METHOD_KEY = 'auth_method';
const LEGACY_KEYS = ['access_token', 'refresh_token']; // from the old token-in-localStorage version

const readStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const storeUser = (user: AuthUser, method: 'regular' | 'google'): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_METHOD_KEY, method);
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
};

const clearLocalSession = (): void => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(AUTH_METHOD_KEY);
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
};

/** For code that ends the session itself, for example after a password change. */
export const endLocalSession = clearLocalSession;

/** @deprecated Cookies carry the credentials now. Kept so existing `headers: getAuthHeaders()` calls still work. */
export const getAuthHeaders = (): Record<string, string> => ({});

export const getCurrentUser = (): AuthUser | null => readStoredUser();

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export const login = async (email: string, password: string): Promise<LoginResult> => {
  try {
    const { data } = await axios.post<LoginResponse>(endpoint(ENDPOINTS.login), {
      email,
      password,
    });

    storeUser(data.user, 'regular');
    return { success: true, user: data.user };
  } catch (error: any) {
    const errorMessage = error.response
      ? error.response.data?.error || error.response.data?.message || 'Login failed'
      : 'Unable to reach the server. Check your connection.';

    return { success: false, error: errorMessage };
  }
};

// ---------------------------------------------------------------------------
// Google Sign-In
// ---------------------------------------------------------------------------

export const googleSignIn = async (access_token: string): Promise<LoginResult> => {
  try {
    const { data } = await axios.post<GoogleLoginResponse>(endpoint(ENDPOINTS.googleSignIn), {
      access_token,
    });

    if (!data.success) {
      return { success: false, error: data.error || 'Google Sign-In failed' };
    }

    // The Google response has no id or role, so read the real user from the new session.
    // This also proves the cookies were actually stored before we say "signed in".
    let user: AuthUser = {
      id: 0,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
    };

    try {
      const { data: check } = await axios.get<SessionCheckResponse>(
        endpoint(ENDPOINTS.sessionCheck),
        { skipAuthRedirect: true }
      );
      if (!check.authenticated) throw new Error('No session');
      user = { ...user, ...check.user };
    } catch {
      clearLocalSession();
      return {
        success: false,
        error:
          'Signed in with Google, but the session could not be started. ' +
          'Please make sure cookies are enabled and try again.',
      };
    }

    storeUser(user, 'google');
    return { success: true, user };
  } catch (error: any) {
    return {
      success: false,
      error: error.response
        ? error.response.data?.error || 'Google Sign-In failed. Please try again.'
        : 'Unable to reach the server. Check your connection.',
    };
  }
};

export const useGoogleSignInHandler = (
  onSuccess: () => void,
  onError: (error: string) => void
) => {
  return useGoogleLogin({
    onSuccess: async (codeResponse) => {
      if (!codeResponse.access_token) {
        onError('Access token not found');
        return;
      }

      try {
        const result = await googleSignIn(codeResponse.access_token);

        if (result.success) {
          setTimeout(onSuccess, 100);
        } else {
          onError(result.error || 'Google Sign-In failed');
        }
      } catch {
        onError('An unexpected error occurred');
      }
    },
    onError: () => {
      onError('Google Sign-In error. Please try again.');
    },
  });
};

// ---------------------------------------------------------------------------
// Session check
// ---------------------------------------------------------------------------

export const isLoggedIn = async (): Promise<{ loggedIn: boolean; user?: AuthUser }> => {
  // Visitors who never logged in cost no requests at all.
  const stored = readStoredUser();
  if (!stored) {
    return { loggedIn: false };
  }

  try {
    // A 401 here triggers one silent refresh (see http.ts) before this call gives up.
    const { data } = await axios.get<SessionCheckResponse>(endpoint(ENDPOINTS.sessionCheck), {
      skipAuthRedirect: true,
    });

    if (data.authenticated) {
      // session-check returns id, email and role; keep the names we already have for the same account.
      const sameAccount = !stored.id || stored.id === data.user.id;
      const user: AuthUser = { ...(sameAccount ? stored : {}), ...data.user };

      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { loggedIn: true, user };
    }
  } catch (error: any) {
    if (axios.isAxiosError(error) && !error.response) {
      // Server unreachable: keep showing the cached user. API calls will still fail.
      console.warn('Offline fallback: using cached user data');
      return { loggedIn: true, user: stored };
    }

    if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
      clearLocalSession();
    } else {
      console.error('Session validation failed:', error.response?.data || error.message);
    }
  }

  return { loggedIn: false };
};

/** Synchronous UI hint. Use isLoggedIn() when the answer matters. */
export const isAuthenticated = (): boolean => !!readStoredUser();

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export const logout = async (navigate: ReturnType<typeof useNavigate>): Promise<void> => {
  try {
    await axios.post(endpoint(ENDPOINTS.logout), {}, { skipAuthRedirect: true });
  } catch (error: any) {
    console.error('Logout API call failed:', error.response?.data || error.message);
  } finally {
    clearLocalSession();
    navigate('/');
  }
};

// ---------------------------------------------------------------------------
// Generic authenticated fetch helper
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