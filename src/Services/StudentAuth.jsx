import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from './studentApi';

// Create Student Auth Context
const StudentAuthContext = createContext(null);

export const StudentAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStudentAuth, setIsStudentAuth] = useState(false);

  // Check student session on mount
  useEffect(() => {
    const verifySession = async () => {
      try {
        console.log("StudentAuth - Starting session verification...");
        
        // First check if user is authenticated
        if (!isAuthenticated()) {
          console.log("StudentAuth - No authentication token found");
          setCurrentUser(null);
          setIsStudentAuth(false);
          setIsLoading(false);
          return;
        }

        // Get current user details
        const user = await getCurrentUser();
        console.log("StudentAuth - User fetched:", user);

        if (user) {
          console.log("StudentAuth - User authenticated");
          setCurrentUser(user);
          setIsStudentAuth(true);
        } else {
          console.log("StudentAuth - No user data available");
          setCurrentUser(null);
          setIsStudentAuth(false);
        }
      } catch (error) {
        console.error("StudentAuth - Failed to verify session:", error);
        setCurrentUser(null);
        setIsStudentAuth(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  // Context value with memoization to prevent unnecessary re-renders
  const value = useMemo(() => ({
    isStudentAuthenticated: () => isAuthenticated() && isStudentAuth,
    currentUser,
    isLoading,
    isStudentAuth
  }), [currentUser, isLoading, isStudentAuth]);

  return (
    <StudentAuthContext.Provider value={value}>
      {children}
    </StudentAuthContext.Provider>
  );
};

// Custom hook to use the Student Auth Context
export const useStudentAuth = () => {
  const context = useContext(StudentAuthContext);
  if (context === undefined) {
    throw new Error('useStudentAuth must be used within a StudentAuthProvider');
  }
  return context;
};

// Student-specific auth component
export const RequireStudentAuth = ({ children }) => {
  const location = useLocation();
  const { isStudentAuth, isLoading, currentUser } = useStudentAuth();

  console.log('RequireStudentAuth - Auth check:', { 
    isLoading, 
    isStudentAuth, 
    currentUser,
    isAuthenticated: isAuthenticated()
  });

  if (isLoading) {
    console.log('RequireStudentAuth - Still loading...');
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check if user is not authenticated at all
  if (!isAuthenticated()) {
    console.log('RequireStudentAuth - User not logged in. Redirecting to login.');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if we couldn't get user data
  if (!currentUser) {
    console.log('RequireStudentAuth - No user data available. Redirecting to login.');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  console.log('RequireStudentAuth - User is authenticated, rendering children');
  return children;
};

// Optional login modal component
export const StudentLoginModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md mx-4 rounded-xl shadow-2xl border border-gray-200">
        <div className="p-8 text-center">
          <div className="mb-6 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-blue-600 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21v-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2zm0 0H8a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h4"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Portal Access</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Please log in to access the portal.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-300 font-medium"
            >
              Cancel
            </button>
            <a
              href="/"
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 font-semibold"
            >
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};