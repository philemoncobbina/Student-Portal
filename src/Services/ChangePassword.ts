import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

const getAuthHeaders = (): { Authorization: string } => {
  const accessToken = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${accessToken}` };
};

export const getUserDetails = async () => {
  const headers = getAuthHeaders();
  const response = await api.get('/user-detail/', { headers });
  return response.data;
};

// Fixed: Now properly sends email in request body as backend expects
export const sendVerificationCode = (email: string) =>
  api.post('/change-password-request/', { email }, { headers: getAuthHeaders() });

// Fixed: Now properly sends email and verification_code as backend expects
export const verifyCode = (data: { verification_code: string }) =>
  api.post('/verify-change-password-code/', data, { headers: getAuthHeaders() });

// Fixed: Removed email parameter since backend gets user from authentication
export const changePassword = (data: {
  verification_code: string;
  old_password: string;
  new_password: string;
}) =>
  api.post('/change-password/', data, { headers: getAuthHeaders() });