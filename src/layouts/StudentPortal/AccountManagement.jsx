import { useState, useEffect } from 'react';
import { Book, User, Mail, Hash, Shield, CheckCircle, XCircle, Eye, EyeOff, AlertCircle, Settings, Lock, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../Services/studentApi';
import { sendVerificationCode, verifyCode, changePassword } from '../../Services/ChangePassword';

const capitalizeFirstAndLast = (name) => name ? name.trim().charAt(0).toUpperCase() + name.trim().slice(1) : '';

const PasswordInput = ({ value, onChange, show, setShow, placeholder }) => (
  <div className="relative">
    <input
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      placeholder={placeholder}
    />
    <button
      type="button"
      onClick={() => setShow(!show)}
      className="absolute inset-y-0 right-0 pr-3 flex items-center"
    >
      {show ? <EyeOff size={16} className="text-gray-400" /> : <Eye size={16} className="text-gray-400" />}
    </button>
  </div>
);

const AlertMessage = ({ type, message, icon: Icon }) => (
  <div className={`mb-4 p-3 bg-${type}-50 border border-${type}-200 rounded-lg flex items-start`}>
    <Icon size={16} className={`text-${type}-600 mr-2 mt-0.5 flex-shrink-0`} />
    <span className={`text-${type}-700 text-sm`}>{message}</span>
  </div>
);

const ProgressBar = ({ step }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-gray-500">Progress</span>
      <span className="text-xs font-medium text-gray-500">{step}/3</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
    </div>
    <div className="flex justify-between mt-2 text-xs text-gray-500">
      {['Send Code', 'Verify Code', 'Change Password'].map((label, i) => (
        <span key={i} className={step >= i + 1 ? 'text-indigo-600 font-medium' : ''}>{label}</span>
      ))}
    </div>
  </div>
);

const PasswordChangeSection = ({ userData }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ verificationCode: '', oldPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const resetForm = () => {
    setStep(1);
    setForm({ verificationCode: '', oldPassword: '', newPassword: '', confirmPassword: '' });
    setMessage({ type: '', text: '' });
  };

  const handleAction = async (action) => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (action === 'sendCode') {
        await sendVerificationCode(userData.email);
        setStep(2);
        setMessage({ type: 'success', text: 'Verification code sent to your email' });
      } else if (action === 'verifyCode') {
        await verifyCode({ verification_code: form.verificationCode });
        setStep(3);
        setMessage({ type: 'success', text: 'Code verified successfully. Now enter your passwords.' });
      } else if (action === 'changePassword') {
        if (form.newPassword !== form.confirmPassword) throw new Error('New passwords do not match');
        if (form.newPassword.length < 8) throw new Error('New password must be at least 8 characters long');
        if (form.newPassword === form.oldPassword) throw new Error('New password must be different from current password');

        await changePassword({
          verification_code: form.verificationCode,
          old_password: form.oldPassword,
          new_password: form.newPassword
        });

        setMessage({ type: 'success', text: 'Password changed successfully! You will be logged out in 3 seconds...' });
        setTimeout(() => logout(navigate).catch(() => navigate('/')), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.response?.data?.message || error.message || 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Lock size={20} className="mr-2 text-indigo-600" />
        Change Password
      </h3>

      <ProgressBar step={step} />
      {message.text && <AlertMessage type={message.type} message={message.text} icon={message.type === 'success' ? CheckCircle : AlertCircle} />}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 flex items-center">
              <Mail size={16} className="mr-2 text-gray-400 flex-shrink-0" />
              <span className="truncate">{userData.email || 'No email provided'}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Verification code will be sent to this email address</p>
          </div>
          <button
            onClick={() => handleAction('sendCode')}
            disabled={isLoading || !userData.email}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <><Loader2 size={16} className="mr-2 animate-spin" />Sending Code...</> : <><Send size={16} className="mr-2" />Send Verification Code</>}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
            <input
              type="text"
              value={form.verificationCode}
              onChange={(e) => setForm({...form, verificationCode: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter the code sent to your email"
              maxLength={6}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">Back</button>
            <button
              onClick={() => handleAction('verifyCode')}
              disabled={isLoading || !form.verificationCode}
              className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <><Loader2 size={16} className="mr-2 animate-spin" />Verifying...</> : <><CheckCircle size={16} className="mr-2" />Verify Code</>}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <PasswordInput value={form.oldPassword} onChange={(e) => setForm({...form, oldPassword: e.target.value})} 
              show={show.old} setShow={() => setShow({...show, old: !show.old})} placeholder="Enter your current password" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <PasswordInput value={form.newPassword} onChange={(e) => setForm({...form, newPassword: e.target.value})} 
              show={show.new} setShow={() => setShow({...show, new: !show.new})} placeholder="Enter your new password" />
            <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long and different from current password</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <PasswordInput value={form.confirmPassword} onChange={(e) => setForm({...form, confirmPassword: e.target.value})} 
              show={show.confirm} setShow={() => setShow({...show, confirm: !show.confirm})} placeholder="Confirm your new password" />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => setStep(2)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors" disabled={isLoading}>Back</button>
            <button onClick={resetForm} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors" disabled={isLoading}>Cancel</button>
            <button
              onClick={() => handleAction('changePassword')}
              disabled={isLoading || !form.oldPassword || !form.newPassword || !form.confirmPassword}
              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <><Loader2 size={16} className="mr-2 animate-spin" />Changing Password...</> : <><Lock size={16} className="mr-2" />Change Password</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AccountManagement = ({ userData }) => (
  <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 p-4 sm:p-6">
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Account Management</h2>
        <div className="flex items-start sm:items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle size={16} className="text-blue-600 mr-2 mt-0.5 sm:mt-0 flex-shrink-0" />
          <span className="text-xs sm:text-sm text-blue-800">Contact administrator to update profile details</span>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold mx-auto sm:mx-0">
          {(userData.first_name?.[0] || 'U').toUpperCase()}
        </div>
        <div className="text-center sm:text-left">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
            {capitalizeFirstAndLast(userData.first_name)} {capitalizeFirstAndLast(userData.last_name)}
          </h3>
          <p className="text-gray-500 text-sm sm:text-base">{userData.class_name || 'No class assigned'}</p>
          <div className="flex items-center justify-center sm:justify-start mt-1">
            {userData.is_active ? (
              <div className="flex items-center text-green-600">
                <CheckCircle size={16} className="mr-1" />
                <span className="text-sm">Active Account</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <XCircle size={16} className="mr-1" />
                <span className="text-sm">Inactive Account</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <User size={20} className="mr-2 text-indigo-600" />
        Personal Information
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[
          { label: 'First Name', value: capitalizeFirstAndLast(userData.first_name) || 'Not provided' },
          { label: 'Last Name', value: capitalizeFirstAndLast(userData.last_name) || 'Not provided' },
          { label: 'Username', value: userData.username || 'Not provided' },
          { label: 'Index Number', value: userData.index_number || 'Not assigned', icon: Hash }
        ].map((field, i) => (
          <div key={i}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 flex items-center">
              {field.icon && <field.icon size={16} className="mr-2 text-gray-400 flex-shrink-0" />}
              <span className="truncate">{field.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Mail size={20} className="mr-2 text-indigo-600" />
        Contact Information
      </h3>
      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 flex items-center">
        <Mail size={16} className="mr-2 text-gray-400 flex-shrink-0" />
        <span className="truncate">{userData.email || 'Not provided'}</span>
      </div>
    </div>

    {!userData.is_google_account ? (
      <PasswordChangeSection userData={userData} />
    ) : (
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Settings size={20} className="mr-2 text-indigo-600" />
          Password & Security
        </h3>
        <div className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle size={20} className="text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">Google Account</p>
            <p className="text-xs text-blue-600">Password is managed through your Google account</p>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default function UserProfilePage() {
  const [userData, setUserData] = useState({ 
    id: 0, email: '', username: '', first_name: '', last_name: '',
    is_active: true, role: '', is_google_account: false, index_number: '', class_name: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) throw new Error('No user data found');
        setUserData({
          id: user.id || 0, email: user.email || '', username: user.username || '',
          first_name: user.first_name || '', last_name: user.last_name || '',
          is_active: user.is_active !== undefined ? user.is_active : true,
          role: user.role || '', is_google_account: user.is_google_account || false,
          index_number: user.index_number || '', class_name: user.class_name || null
        });
      } catch (error) {
        setError(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to load user data');
        if (error.response?.status === 401) navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="flex items-center space-x-2">
        <Loader2 size={24} className="animate-spin text-indigo-600" />
        <span className="text-gray-600">Loading user profile...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <AlertCircle size={24} className="text-red-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Error Loading Profile</h2>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AccountManagement userData={userData} />
    </div>
  );
}