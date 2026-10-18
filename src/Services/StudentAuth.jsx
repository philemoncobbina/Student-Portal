// Services/StudentAuth.jsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// CHANGED: checkSession replaces getCurrentUser here. It returns the user and the role, clears the
// stored "logged in" hint on a 401/403, and keeps the student on the page if the server is
// unreachable. It also never redirects by itself (a background check).
import { isAuthenticated, checkSession } from './studentApi';

// Create Student Auth Context
const StudentAuthContext = createContext(null);

export const StudentAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStudentAuth, setIsStudentAuth] = useState(false);

  // CHANGED: now a reusable function, so a page that just logged in can ask for a fresh check.
  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      // The server is asked only if a login happened in this browser (see studentApi.ts).
      const session = await checkSession();

      if (session.loggedIn && session.isStudent) {
        setCurrentUser(session.user ?? null);
        setIsStudentAuth(true);
      } else {
        setCurrentUser(null);
        setIsStudentAuth(false);
      }
    } catch (error) {
      console.error('StudentAuth - Failed to verify session:', error);
      setCurrentUser(null);
      setIsStudentAuth(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check student session on mount
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Context value with memoization to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      isStudentAuthenticated: () => isAuthenticated() && isStudentAuth,
      currentUser,
      isLoading,
      isStudentAuth,
      refreshSession, // CHANGED: new
    }),
    [currentUser, isLoading, isStudentAuth, refreshSession]
  );

  return (
    <StudentAuthContext.Provider value={value}>
      {children}
    </StudentAuthContext.Provider>
  );
};

// Custom hook to use the Student Auth Context
export const useStudentAuth = () => {
  const context = useContext(StudentAuthContext);
  // CHANGED: the context starts as null, so the old `=== undefined` check never fired.
  if (context === null) {
    throw new Error('useStudentAuth must be used within a StudentAuthProvider');
  }
  return context;
};

// Student-specific auth component
export const RequireStudentAuth = ({ children }) => {
  const location = useLocation();
  const { isStudentAuth, isLoading, refreshSession } = useStudentAuth();
  const triedRef = useRef(false);

  // CHANGED: the old version only looked at the stored "logged in" hint, so an expired session
  // still showed the page until an API call failed. Now the server's answer decides.
  // The provider checked the session when the app loaded, which may be BEFORE this student
  // logged in. If a login has happened since (the hint is set) but the provider hasn't seen it,
  // ask for one fresh check, once.
  const needsCheck = isAuthenticated() && !isStudentAuth && !isLoading;

  useEffect(() => {
    if (needsCheck && !triedRef.current) {
      triedRef.current = true;
      refreshSession();
    }
  }, [needsCheck, refreshSession]);

  if (isLoading || (needsCheck && !triedRef.current)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Not a verified student, or logged out since (the hint is cleared on logout).
  if (!isStudentAuth || !isAuthenticated()) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

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