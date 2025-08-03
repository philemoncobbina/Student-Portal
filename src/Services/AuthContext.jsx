import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getCurrentUser, checkSession } from '../Services/Login';

// Create Auth Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        if (isAuthenticated()) {
          const user = await getCurrentUser();
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Failed to verify session:", error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const value = useMemo(() => ({
    isAuthenticated,
    currentUser,
    isLoading
  }), [currentUser, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Regular RequireAuth component (for any authenticated user)
export const RequireAuth = ({ children }) => {
  const location = useLocation();
  const { currentUser, isLoading } = useAuth();
  
  console.log('RequireAuth - Authentication check:', { 
    isLoading, 
    isAuthenticated: isAuthenticated(), 
    currentUser: currentUser?.email 
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated() || !currentUser) {
    console.log('RequireAuth - User not logged in. Redirecting to login.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('RequireAuth - User is authenticated, rendering children');
  return children;
};

// Student-specific RequireStudentAuth component
export const RequireStudentAuth = ({ children }) => {
  const location = useLocation();
  const { currentUser, isLoading } = useAuth();
  
  console.log('RequireStudentAuth - Auth check:', { 
    isLoading, 
    isAuthenticated: isAuthenticated(), 
    currentUser: currentUser?.email,
    role: currentUser?.role 
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated() || !currentUser) {
    console.log('RequireStudentAuth - User not logged in. Redirecting to login.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentUser.role !== 'student') {
    console.log('RequireStudentAuth - User is not a student. Current role:', currentUser.role);
    return <Navigate to="/" replace />;
  }

  console.log('RequireStudentAuth - Student is authenticated, rendering children');
  return children;
};