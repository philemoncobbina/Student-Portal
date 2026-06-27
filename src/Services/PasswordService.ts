import axios from 'axios';

const API_URL = 'https://api.cobbina.uk/api/api/api'; // Base URL for Django backend

// Function to request a verification code
export const requestVerificationCode = (email) => {
    return axios.post(`${API_URL}/student/password-reset/`, { email });
};

// Function to verify the verification code
export const verifyResetCode = (email, verificationCode) => {
    return axios.post(`${API_URL}/verify-reset-code/`, { email, verification_code: verificationCode });
};

// Function to reset the password
export const resetPassword = (email, verificationCode, newPassword) => {
    return axios.post(`${API_URL}/password-reset-confirm/`, { email, verification_code: verificationCode, new_password: newPassword });
};

export default { requestVerificationCode, verifyResetCode, resetPassword };
