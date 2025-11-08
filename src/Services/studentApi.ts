//studentApi.ts

import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Base URL for all API requests
const API_BASE_URL = 'https://api.plvcmonline.uk/api';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
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

// Detailed user interface based on CustomUser model
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
  verification_code: string | null;
}

// Student login function
export const loginStudent = async (credentials: LoginRequest): Promise<LoginResult> => {
  try {
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/student-login/`, credentials);
    const { access_token, refresh_token, user } = response.data;

    // Store only authentication tokens in localStorage
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);

    return { success: true, user };
  } catch (error: any) {
    let errorMessage = 'An unknown error occurred';
    if (error.response && error.response.data) {
      errorMessage = error.response.data.error;
    }

    return { success: false, error: errorMessage };
  }
};

// Get authentication headers for API requests
export const getAuthHeaders = (): { Authorization: string } => {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    throw new Error('No access token found');
  }
  return { Authorization: `Bearer ${accessToken}` };
};

// Check if user is authenticated (has valid token)
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('access_token');
};

// Get the current logged-in user from API
export const getCurrentUser = async (): Promise<UserDetails | null> => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get<UserDetails>(`${API_BASE_URL}/user-detail/`, { headers });
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch current user:', error.response?.data || error.message);
    return null;
  }
};

// Check if user is logged in as a student (via API)
export const isStudentLoggedIn = async (): Promise<boolean> => {
  try {
    if (!isAuthenticated()) {
      return false;
    }
    
    const user = await getCurrentUser();
    return user?.role === 'student';
  } catch (error) {
    console.error('Failed to check student login status:', error);
    return false;
  }
};

// Session check to verify if user is still logged in with role information
export const checkSession = async (): Promise<{ 
  loggedIn: boolean; 
  isStudent?: boolean;
  user?: UserDetails;
}> => {
  try {
    if (!isAuthenticated()) {
      return { loggedIn: false };
    }

    const user = await getCurrentUser();
    if (user) {
      return { 
        loggedIn: true, 
        isStudent: user.role === 'student',
        user 
      };
    }
  } catch (error: any) {
    console.error('Session check failed:', error.response?.data || error.message);
    // If there's an auth error, clear the tokens
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  return { loggedIn: false };
};

// Get detailed user information (alias for getCurrentUser for consistency)
export const getUserDetails = async (): Promise<UserDetails | null> => {
  return await getCurrentUser();
};

// Logout function
export const logout = async (navigate: ReturnType<typeof useNavigate>): Promise<void> => {
  try {
    const headers = getAuthHeaders();
    await axios.post(`${API_BASE_URL}/logout/`, {}, { headers });
  } catch (error: any) {
    console.error('Logout failed:', error.response?.data || error.message);
  } finally {
    // Clear all stored data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/');
  }
};

// Generic function to fetch data with authentication
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

// Generic function to post data with authentication
export const postData = async (url: string, data: any) => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error: any) {
    console.error('Failed to post data:', error.response?.data || error.message);
    throw error;
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
};