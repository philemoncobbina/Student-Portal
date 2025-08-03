import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

// Base URL for all API requests
const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface GoogleLoginResponse {
  success: boolean;
  email: string;
  created: boolean;
  access: string;
  refresh?: string;
  first_name?: string;
  last_name?: string;
  error?: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  user?: LoginResponse['user'] | { email: string; first_name?: string; last_name?: string };
}

export const login = async (email: string, password: string): Promise<LoginResult> => {
  try {
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/login/`, { email, password });
    const { access_token, refresh_token, user } = response.data;

    // Store tokens
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    
    // Store user data
    localStorage.setItem('user_data', JSON.stringify(user));
    localStorage.setItem('auth_method', 'regular');

    console.log('Regular login successful, tokens stored');

    return { success: true, user };
  } catch (error: any) {
    console.error('Regular login error:', error);
    let errorMessage = 'An unknown error occurred';
    if (error.response && error.response.data) {
      errorMessage = error.response.data.error || error.response.data.message || 'Login failed';
    }

    return { success: false, error: errorMessage };
  }
};

export const googleSignIn = async (access_token: string): Promise<LoginResult> => {
  try {
    console.log('Attempting Google Sign-In with token:', access_token);

    const serverResponse = await axios.post<GoogleLoginResponse>(
      `${API_BASE_URL}/google-signin/`,
      { access_token: access_token },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('Google Sign-In Server Response:', serverResponse.data);

    const { 
      access: serverAccessToken, 
      refresh: serverRefreshToken,
      email, 
      success, 
      error,
      first_name,
      last_name 
    } = serverResponse.data;

    if (!success) {
      return { 
        success: false, 
        error: error || 'Google Sign-In failed' 
      };
    }

    // Validation checks for tokens
    if (!serverAccessToken) {
      console.error('Missing access token in the response');
      return { 
        success: false, 
        error: 'Invalid tokens received from server' 
      };
    }

    // Store tokens in localStorage
    try {
      localStorage.setItem('access_token', serverAccessToken);
      
      // Store refresh token if provided, otherwise use a placeholder
      if (serverRefreshToken) {
        localStorage.setItem('refresh_token', serverRefreshToken);
      } else {
        localStorage.setItem('refresh_token', 'google_refresh_placeholder');
      }
      
      // Store user data
      const userData = {
        email: email,
        first_name: first_name || '',
        last_name: last_name || '',
        id: 0 // Placeholder for Google users
      };
      localStorage.setItem('user_data', JSON.stringify(userData));
      localStorage.setItem('auth_method', 'google');

      console.log('Google tokens and user data successfully stored');
    } catch (storageError) {
      console.error('Failed to store tokens in localStorage:', storageError);
      return { 
        success: false, 
        error: 'Unable to store authentication tokens' 
      };
    }

    return { 
      success: true, 
      user: { 
        email: email,
        first_name: first_name,
        last_name: last_name
      } 
    };
  } catch (error: any) {
    console.error(
      'Google Sign-In Error:',
      'Full Error:', error,
      'Response Data:', error.response?.data,
      'Response Status:', error.response?.status
    );

    return { 
      success: false, 
      error: error.response?.data?.error || 'Google Sign-In failed. Please try again.' 
    };
  }
};

export const logout = async (navigate: ReturnType<typeof useNavigate>): Promise<void> => {
  try {
    const headers = getAuthHeaders();
    await axios.post(`${API_BASE_URL}/logout-auth/`, {}, { headers });
  } catch (error: any) {
    console.error('Logout API call failed:', error.response?.data || error.message);
  } finally {
    // Always clear local storage regardless of API call success
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('auth_method');
    
    navigate('/');
  }
};

export const isLoggedIn = async (): Promise<{ loggedIn: boolean; user?: { id: number; email: string; role?: string } }> => {
  try {
    // First check if we have tokens in localStorage
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!accessToken) {
      console.log('No access token found');
      return { loggedIn: false };
    }

    // For Google users, we might not have a refresh token or it might be a placeholder
    const authMethod = localStorage.getItem('auth_method');
    if (authMethod === 'google' && (!refreshToken || refreshToken === 'google_refresh_placeholder')) {
      // For Google users, just check if we have user data and access token
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('Google user found in localStorage');
        return { loggedIn: true, user };
      }
    }

    // For regular users or when we want to verify with server
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/session-check/`, { headers });

    const { authenticated, user } = response.data;
    if (authenticated) {
      console.log('Session check successful');
      return { loggedIn: true, user };
    }
  } catch (error: any) {
    console.error('Session check failed:', error.response?.data || error.message);
    
    // If API call fails but we have valid tokens, still consider logged in
    const accessToken = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    
    if (accessToken && userData) {
      try {
        const user = JSON.parse(userData);
        console.log('Using cached user data due to API failure');
        return { loggedIn: true, user };
      } catch (parseError) {
        console.error('Failed to parse cached user data');
      }
    }
  }

  return { loggedIn: false };
};

// Simple synchronous check for immediate use
export const isAuthenticated = (): boolean => {
  const accessToken = localStorage.getItem('access_token');
  const userData = localStorage.getItem('user_data');
  
  const isAuth = !!(accessToken && userData);
  console.log('isAuthenticated check:', isAuth, { 
    hasToken: !!accessToken, 
    hasUserData: !!userData 
  });
  
  return isAuth;
};

export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

export const getAuthHeaders = (): { Authorization: string } => {
  const accessToken = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${accessToken}` };
};

export const fetchData = async (url: string) => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch data:', error.response?.data || error.message);
    throw error;
  }
};

export const useGoogleSignInHandler = (onSuccess: () => void, onError: (error: string) => void) => {
  return useGoogleLogin({
    onSuccess: async (codeResponse) => {
      if (!codeResponse.access_token) {
        onError('Access token not found');
        return;
      }

      try {
        const result = await googleSignIn(codeResponse.access_token);
        if (result.success) {
          // Small delay to ensure localStorage is updated
          setTimeout(() => {
            onSuccess();
          }, 100);
        } else {
          onError(result.error || 'Google Sign-In failed');
        }
      } catch (error) {
        console.error('Google sign-in handler error:', error);
        onError('An unexpected error occurred');
      }
    },
    onError: (error) => {
      console.error('Google Login Error:', error);
      onError('Google Sign-In error. Please try again.');
    },
  });
};