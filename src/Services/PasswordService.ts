// Services/PasswordService.ts

import axios from 'axios';
// CHANGED: API_URL comes from http.ts (VITE_API_URL) instead of being hardcoded. It ends with
// a "/", so the paths below no longer start with one. Adjust the import path if needed.
import { API_URL } from './http';

// These endpoints are public (the student is not logged in), so no cookie or token is needed.
// If initAuth() has run, the default axios also adds the CSRF header, which is harmless here.

// Function to request a verification code
export const requestVerificationCode = (email: string) => {
    return axios.post(`${API_URL}student/password-reset/`, { email });
};

// Function to verify the verification code
export const verifyResetCode = (email: string, verificationCode: string) => {
    return axios.post(`${API_URL}verify-reset-code/`, { email, verification_code: verificationCode });
};

// Function to reset the password
export const resetPassword = (email: string, verificationCode: string, newPassword: string) => {
    return axios.post(`${API_URL}password-reset-confirm/`, { email, verification_code: verificationCode, new_password: newPassword });
};

export default { requestVerificationCode, verifyResetCode, resetPassword };