import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import LoginPage from './Pages/LoginPage';
import ChangePasswordPage from './Pages/ChangePasswordPage';
import ForgetPassword from './Pages/ForgetPassword';
import SchoolDashboardPage from './Pages/SchoolDashboardPage';
import RaiseTicketPage from './Pages/RaiseTicketPage';
import BookListPage from './Pages/BookListPage';
import ResultsPage from './Pages/ResultsPage';

// Import general auth components
import { AuthProvider, RequireAuth, AuthModalWrapper } from './Services/RequireAuth';

// Import student-specific auth components
import { StudentAuthProvider, RequireStudentAuth } from './Services/StudentAuth';

const router = createBrowserRouter([
  
 
  
  {
    path: '/student-portal',
    element: (
      <RequireStudentAuth>
        <SchoolDashboardPage />
      </RequireStudentAuth>
    ),
  },
  {
    path: '/student-portal/results',
    element: (
      <RequireStudentAuth>
        <ResultsPage />
      </RequireStudentAuth>
    ),
  },
  {
    path: '/student-portal/booklist',
    element: (
      <RequireStudentAuth>
        <BookListPage />
      </RequireStudentAuth>
    ),
  },
  
  
  {
    path: '/',
    element: <LoginPage />,
  },

  {
    path: '/changepassword',
    element: <ChangePasswordPage />,
  },
  {
    path: '/forgetpassword',
    element: <ForgetPassword />,
  },
  {
    path: '/support',
    element: <RaiseTicketPage />,
  },
  
  
  
  
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      {/* Wrap with both auth providers - general auth first, then student auth */}
      <AuthProvider>
        <StudentAuthProvider>
          <RouterProvider router={router} />
          <AuthModalWrapper />
        </StudentAuthProvider>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);