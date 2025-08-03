import Home from '@/layouts/Login/Home';
import { GoogleOAuthProvider } from '@react-oauth/google';

const LoginPage = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Home />
    </GoogleOAuthProvider>
  );
};

export default LoginPage;
