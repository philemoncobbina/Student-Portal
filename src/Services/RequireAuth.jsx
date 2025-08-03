import React, { createContext, useState, useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn } from './Login';
import { Lock } from 'lucide-react';

// Create Authentication Context
const AuthContext = createContext({
  isAuthenticated: false,
  showAuthModal: false,
  setShowAuthModal: () => {},
  checkAuthStatus: () => {}
});

// Authentication Provider Component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [attemptedProtectedRoute, setAttemptedProtectedRoute] = useState(false);

  const checkAuthStatus = async () => {
    try {
      const result = await isLoggedIn();
      setIsAuthenticated(result.loggedIn);
      setIsLoading(false);
    } catch (error) {
      console.error('Auth check failed', error);
      setIsLoading(false);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    // Reset modal state when authentication status changes.
    if (isAuthenticated) {
      setShowAuthModal(false);
      setAttemptedProtectedRoute(false);  // Reset after successful login
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      showAuthModal,
      setShowAuthModal,
      checkAuthStatus,
      isLoading,
      attemptedProtectedRoute,
      setAttemptedProtectedRoute
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Authentication Modal Component
export const AuthModal = () => {
  const { setShowAuthModal } = useContext(AuthContext);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md mx-4 rounded-xl shadow-2xl border border-gray-200 transform transition-all duration-300 ease-in-out hover:shadow-3xl">
        <div className="p-8 text-center">
          <div className="mb-6 flex justify-center">
            <Lock className="w-16 h-16 text-blue-600 opacity-80" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Secure Access</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            To protect your account and maintain confidentiality, please log in to proceed. 
            This ensures only authorized personnel can access the system.
          </p>
          <div className="flex space-x-4">
            <button 
              onClick={() => setShowAuthModal(false)}  
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-300 font-medium"
            >
              Cancel
            </button>
            <a 
              href="/" 
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 font-semibold"
            >
              Log In
            </a>
          </div>
        </div>
      </div>
    </div>

  );
};

// Modified RequireAuth Component
export const RequireAuth = ({ children }) => {
  const { 
    isAuthenticated, 
    isLoading, 
    setShowAuthModal, 
    setAttemptedProtectedRoute 
  } = useContext(AuthContext);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      setAttemptedProtectedRoute(true);
      setShowAuthModal(true);  // Show the modal only if not logged in
    }
  }, [isAuthenticated, isLoading, setShowAuthModal, setAttemptedProtectedRoute]);

  if (isLoading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log('RequireAuth - User not logged in. Redirecting to homepage.');
    return <Navigate to="/" />;
  }

  console.log('RequireAuth - User logged in. Rendering component.');
  return <>{children}</>;
};

// Hook to use Authentication Context
export const useAuth = () => useContext(AuthContext);

// Wrapper Component to Render Modal
export const AuthModalWrapper = () => {
  const { showAuthModal, attemptedProtectedRoute, isAuthenticated } = useContext(AuthContext);

  // Prevent modal from showing if the user is already authenticated
  if (!showAuthModal || isAuthenticated || !attemptedProtectedRoute) return null;

  return <AuthModal />;
};
