import React, { useState, useEffect } from 'react';
import Alert from './Alert';
import { sendVerificationCode, verifyCode, changePassword, getUserDetails } from '../../Services/ChangePassword';
import { isLoggedIn, logout } from '../../Services/Login'; // Corrected import statement

const PasswordChangeComponent = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userDetails = await getUserDetails();
        setEmail(userDetails.email);
      } catch (error) {
        setErrorMessage('Failed to load user details');
      }
    };

    fetchUserDetails();
  }, []);

  const handleNextStep = () => setStep(step + 1);
  const handleError = (message) => setErrorMessage(message);
  const handleSuccess = (message) => setSuccessMessage(message);

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendVerificationCode(email);
      handleNextStep();
    } catch (error) {
      handleError(error.response?.data?.error || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVerificationCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyCode(email, verificationCode);
      handleNextStep();
    } catch (error) {
      handleError(error.response?.data?.error || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await changePassword({
        email,
        verification_code: verificationCode,
        old_password: oldPassword,
        new_password: newPassword,
      });
      handleSuccess('Password changed successfully.');
      // Perform logout operation here
      logout();
    } catch (error) {
      handleError(error.response?.data?.error || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        {errorMessage && (
          <Alert
            message={errorMessage}
            type="error"
            onClose={() => setErrorMessage('')}
          />
        )}
        {successMessage && (
          <Alert
            message={successMessage}
            type="success"
            onClose={() => setSuccessMessage('')}
          />
        )}
        {step === 1 && (
          <form onSubmit={handleSubmitEmail}>
            <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="border rounded w-full py-2 px-3 text-gray-700 mb-3 focus:outline-none focus:shadow-outline bg-gray-200"
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleSubmitVerificationCode}>
            <label className="block mb-2 text-sm font-medium text-gray-700">Verification Code</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              className="border rounded w-full py-2 px-3 text-gray-700 mb-3 focus:outline-none focus:shadow-outline"
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}
        {step === 3 && (
          <form onSubmit={handleChangePassword}>
            <label className="block mb-2 text-sm font-medium text-gray-700">Old Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="border rounded w-full py-2 px-3 text-gray-700 mb-3 focus:outline-none focus:shadow-outline"
            />
            <label className="block mb-2 text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="border rounded w-full py-2 px-3 text-gray-700 mb-3 focus:outline-none focus:shadow-outline"
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PasswordChangeComponent;
