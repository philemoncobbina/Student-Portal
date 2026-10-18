// Services/ChangePassword.ts

import axios from 'axios';
// CHANGED: shared cookie/CSRF layer. Adjust these paths if the files live somewhere else.
import { API_URL, setupHttp } from './http';
import { endLocalSession } from './studentApi';

// CHANGED: the base URL comes from VITE_API_URL (through http.ts) instead of being hardcoded.
// Credentials travel as HttpOnly cookies, so there is no token or Authorization header here.
const api = axios.create({
  baseURL: API_URL,
});

// CHANGED: this instance needs the same interceptors as the default axios (cookies on every
// request, the X-CSRFToken header on POST, one silent refresh on a 401).
// setupHttp ignores instances it has already set up, so calling it again is safe.
setupHttp(api);

// REMOVED: getAuthHeaders() and every `headers: getAuthHeaders()` argument.

export const getUserDetails = async () => {
  const response = await api.get('/user-detail/');
  return response.data;
};

// Sends the verification code to the logged-in user's email.
export const sendVerificationCode = (email: string) =>
  api.post('/change-password-request/', { email });

// Checks the code the user typed in.
export const verifyCode = (data: { verification_code: string }) =>
  api.post('/verify-change-password-code/', data);

// CHANGED: after a successful change the server revokes every session and clears this
// device's cookies, so the local "logged in" hint is cleared here too. The component should
// send the user to the login page once this resolves.
export const changePassword = async (data: {
  verification_code: string;
  old_password: string;
  new_password: string;
}) => {
  const response = await api.post('/change-password/', data);
  endLocalSession();
  return response;
};