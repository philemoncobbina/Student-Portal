import axios from 'axios';
import { isLoggedIn } from "../Services/Login";

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface SignUpData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

interface SignUpResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

const getErrorMessage = (error: any): string => {
  if (error.response?.data) {
    if (typeof error.response.data === 'string') {
      return error.response.data;
    } else if (typeof error.response.data === 'object' && error.response.data.error) {
      return error.response.data.error;
    } else {
      return JSON.stringify(error.response.data);
    }
  }
  return error.message || 'Something went wrong';
};

export const signUp = async (data: SignUpData): Promise<SignUpResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/signup/`, data);
    const successMessage = response.data.message || 'Sign up successful!';
    return { success: true, message: successMessage, data: response.data };
  } catch (error) {
    console.error('Sign up error:', error);
    const errorMessage = getErrorMessage(error);
    return { success: false, error: errorMessage };
  }
};

export const googleSignIn = async (access_token: string): Promise<SignUpResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/google-signin/`, { access_token });
    
    if (response.data.success) {
      // Store access token in localStorage
      localStorage.setItem('access_token', response.data.access);
      
      // Call isLoggedIn after successful Google Sign-In
      const sessionCheck = await isLoggedIn();
      
      return {
        success: true,
        message: 'Google sign-in successful',
        data: {
          ...response.data,
          user: sessionCheck.user
        }
      };
    } 
    
    return {
      success: false,
      error: response.data.error || 'Google sign-in failed'
    };
  } catch (error) {
    console.error('Google sign-in error:', error);
    const errorMessage = getErrorMessage(error);
    
    return {
      success: false,
      error: errorMessage || 'Something went wrong during Google sign-in'
    };
  }
};