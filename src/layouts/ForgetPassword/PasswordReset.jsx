import React, { useState } from 'react';
import { ArrowLeft, Mail, Shield, Key, CheckCircle, X, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { requestVerificationCode, verifyResetCode, resetPassword } from '../../Services/PasswordService';

const PasswordReset = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleBackToLogin = () => {
        navigate('/');
    };

    const closeErrorAlert = () => {
        setError('');
    };

    const closeSuccessAlert = () => {
        setSuccessMessage('');
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await requestVerificationCode(email);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || 'Server error');
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await verifyResetCode(email, verificationCode);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || 'Server error');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
            return;
        }
        setLoading(true);
        try {
            await resetPassword(email, verificationCode, newPassword);
            setSuccessMessage('Password reset successful!');
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Server error');
        } finally {
            setLoading(false);
        }
    };

    const getStepContent = () => {
        switch (step) {
            case 1:
                return {
                    title: "Reset Your Password",
                    subtitle: "Enter your email address to receive a verification code",
                    icon: Mail,
                    form: (
                        <form onSubmit={handleEmailSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-white/90 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-white/50 text-white"
                                    placeholder="Enter your email address"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-4 focus:ring-blue-300/50 ${
                                    loading ? 'opacity-70 cursor-not-allowed' : 'shadow-lg hover:shadow-xl hover:scale-105'
                                }`}
                            >
                                {loading ? (
                                    <div className="flex justify-center items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Sending...</span>
                                    </div>
                                ) : (
                                    'Send Verification Code'
                                )}
                            </button>
                        </form>
                    )
                };
            case 2:
                return {
                    title: "Enter Verification Code",
                    subtitle: "Check your email for the verification code we sent you",
                    icon: Shield,
                    form: (
                        <form onSubmit={handleCodeSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-white/90 mb-2">
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-white/50 text-white text-center text-lg tracking-widest"
                                    placeholder="Enter verification code"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-4 focus:ring-blue-300/50 ${
                                    loading ? 'opacity-70 cursor-not-allowed' : 'shadow-lg hover:shadow-xl hover:scale-105'
                                }`}
                            >
                                {loading ? (
                                    <div className="flex justify-center items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Verifying...</span>
                                    </div>
                                ) : (
                                    'Verify Code'
                                )}
                            </button>
                        </form>
                    )
                };
            case 3:
                return {
                    title: "Set New Password",
                    subtitle: "Create a strong password for your account",
                    icon: Key,
                    form: (
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-white/90 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => {
                                            setNewPassword(e.target.value);
                                            if (e.target.value.length < 8) {
                                                setPasswordError('Password must be at least 8 characters long');
                                            } else {
                                                setPasswordError('');
                                            }
                                        }}
                                        className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 pr-12 transition-all placeholder-white/50 text-white ${
                                            passwordError ? 'border-red-400/50 focus:ring-red-400' : 'border-white/20'
                                        }`}
                                        placeholder="Enter new password"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute inset-y-0 right-4 flex items-center text-white/60 hover:text-white/80 transition-colors"
                                        disabled={loading}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {passwordError && (
                                    <div className="mt-2 text-red-400 text-sm flex items-center gap-2">
                                        <X size={16} />
                                        {passwordError}
                                    </div>
                                )}
                                {newPassword.length >= 8 && (
                                    <div className="mt-2 text-green-400 text-sm flex items-center gap-2">
                                        <CheckCircle size={16} />
                                        Password strength: Good
                                    </div>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={loading || passwordError}
                                className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-4 focus:ring-blue-300/50 ${
                                    (loading || passwordError) ? 'opacity-70 cursor-not-allowed' : 'shadow-lg hover:shadow-xl hover:scale-105'
                                }`}
                            >
                                {loading ? (
                                    <div className="flex justify-center items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Resetting...</span>
                                    </div>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </form>
                    )
                };
            default:
                return null;
        }
    };

    const stepContent = getStepContent();
    const StepIcon = stepContent?.icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
            </div>

            {/* Navigation Header */}
            <nav className="fixed top-0 left-0 right-0 z-50 py-4">
                <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                            <GraduationCap className="text-white" size={24} />
                        </div>
                        <span className="text-white text-xl font-bold">EduPortal</span>
                    </div>
                    <button
                        onClick={handleBackToLogin}
                        className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Home</span>
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="min-h-screen flex items-center justify-center relative z-10 px-6 py-20">
                <div className="w-full max-w-md">
                    {/* Alerts */}
                    {error && (
                        <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-100 px-4 py-3 rounded-xl mb-6 flex items-center shadow-lg">
                            <span className="flex-grow text-sm">{error}</span>
                            <button onClick={closeErrorAlert} className="ml-4 hover:bg-red-400/20 p-1 rounded-lg transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/30 text-green-100 px-4 py-3 rounded-xl mb-6 flex items-center shadow-lg">
                            <CheckCircle size={16} className="mr-2 text-green-400" />
                            <span className="flex-grow text-sm">{successMessage}</span>
                            <button onClick={closeSuccessAlert} className="ml-4 hover:bg-green-400/20 p-1 rounded-lg transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Reset Form Card */}
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8">
                        {/* Header with Icon */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                {StepIcon && <StepIcon className="text-white" size={32} />}
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">{stepContent?.title}</h2>
                            <p className="text-white/70">{stepContent?.subtitle}</p>
                        </div>

                        {/* Progress Indicator */}
                        <div className="flex items-center justify-center mb-8 space-x-4">
                            {[1, 2, 3].map((stepNum) => (
                                <div key={stepNum} className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                                        step >= stepNum 
                                            ? 'bg-gradient-to-r from-blue-400 to-purple-500 text-white' 
                                            : 'bg-white/20 text-white/60'
                                    }`}>
                                        {step > stepNum ? <CheckCircle size={16} /> : stepNum}
                                    </div>
                                    {stepNum < 3 && (
                                        <div className={`w-12 h-0.5 mx-2 transition-all ${
                                            step > stepNum ? 'bg-gradient-to-r from-blue-400 to-purple-500' : 'bg-white/20'
                                        }`}></div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Form Content */}
                        {stepContent?.form}
                    </div>

                    {/* Help Text */}
                    <div className="text-center mt-6">
                        <p className="text-sm text-white/70">
                            Need help? 
                            <span className="ml-2 text-blue-300 hover:text-blue-200 transition-colors cursor-pointer underline">
                                Contact Support
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordReset;