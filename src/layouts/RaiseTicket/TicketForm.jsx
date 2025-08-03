import React, { useState, useEffect } from 'react';
import { submitTicket } from "../../Services/TicketService";
import { X, User, Mail, Phone, Globe, AlertTriangle, MessageSquare, Camera, Send, CheckCircle, GraduationCap, ArrowLeft, HelpCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const TicketForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        section: 'authentication',
        severity: 'low',
        description: '',
        screenshot: null
    });

    const [showModal, setShowModal] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let timer;
        if (showModal) {
            timer = setTimeout(() => {
                setShowModal(false);
            }, 30000); // 30 seconds
        }
        return () => clearTimeout(timer);
    }, [showModal]);

    const handleBackToLogin = () => {
        navigate('/');
    };

    const clearForm = () => {
        setFormData({
            full_name: '',
            email: '',
            phone_number: '',
            section: 'authentication',
            severity: 'low',
            description: '',
            screenshot: null
        });
        // Clear the file input
        const fileInput = document.getElementById('screenshot');
        if (fileInput) fileInput.value = '';
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.phone_number.trim()) newErrors.phone_number = 'Phone number is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.screenshot) newErrors.screenshot = 'Screenshot is required';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const handleFileChange = (e) => {
        setFormData((prevData) => ({
            ...prevData,
            screenshot: e.target.files[0],
        }));
        if (errors.screenshot) {
            setErrors(prev => ({
                ...prev,
                screenshot: undefined
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            setIsSubmitting(true);
            try {
                await submitTicket(formData);
                setShowModal(true);
                clearForm();
            } catch (error) {
                console.error('Error submitting ticket:', error);
                setErrors({ submit: 'Failed to submit ticket. Please try again later.' });
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'low': return 'text-green-400';
            case 'medium': return 'text-yellow-400';
            case 'high': return 'text-orange-400';
            case 'critical': return 'text-red-400';
            default: return 'text-green-400';
        }
    };

    const sections = [
        { value: 'authentication', label: 'Authentication' },
        { value: 'reservation', label: 'Reservation Booking' },
        { value: 'admissions', label: 'Admissions' },
        { value: 'others', label: 'Others' }
    ];

    const severityLevels = [
        { value: 'low', label: 'Low', color: 'text-green-400' },
        { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
        { value: 'high', label: 'High', color: 'text-orange-400' },
        { value: 'critical', label: 'Critical', color: 'text-red-400' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
            </div>

            {/* Custom Success Modal */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 max-w-sm mx-4 relative z-50 shadow-2xl">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-white/60 hover:text-white/80 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mx-auto flex items-center justify-center mb-4">
                                <CheckCircle className="text-white" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Success!</h3>
                            <p className="text-white/80">Your ticket has been submitted successfully. We'll get back to you soon!</p>
                        </div>
                    </div>
                </div>
            )}

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
            <div className="relative z-10 px-6 py-20 min-h-screen flex items-center">
                <div className="max-w-6xl mx-auto w-full">
                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        
                        {/* Left Side - Hero/Image */}
                        <div className="text-white space-y-8">
                            <div className="space-y-6">
                                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
                                    <HelpCircle className="text-blue-400" size={16} />
                                    <span>24/7 Support Available</span>
                                </div>

                                <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                                    Need Help?
                                    <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                        We're Here for You
                                    </span>
                                </h1>

                                <p className="text-xl text-white/80 leading-relaxed">
                                    Submit a support ticket and our team will assist you with any issues you're experiencing. We're committed to providing fast and effective solutions.
                                </p>
                            </div>

                            {/* Support Image */}
                            <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                                <img 
                                    src='https://images.pexels.com/photos/5453808/pexels-photo-5453808.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
                                    alt="Support Team" 
                                    className="w-full h-80 object-cover"
                                />
                            </div>

                            {/* Support Features */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                                    <div className="text-2xl font-bold text-white mb-1"> 24hrs</div>
                                    <div className="text-sm text-white/70">Response Time</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                                    <div className="text-2xl font-bold text-white mb-1">99%</div>
                                    <div className="text-sm text-white/70">Issue Resolution</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Ticket Form */}
                        <div className="w-full">
                            {errors.submit && (
                                <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-100 px-4 py-3 rounded-xl mb-6 flex items-center shadow-lg">
                                    <span className="flex-grow text-sm">{errors.submit}</span>
                                    <button onClick={() => setErrors({})} className="ml-4 hover:bg-red-400/20 p-1 rounded-lg transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare className="text-white" size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Report an Issue</h2>
                                    <p className="text-white/70">Tell us what's wrong and we'll help you fix it</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Full Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-white/90 mb-2">
                                            <User className="inline mr-2" size={16} />
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="full_name"
                                            className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-white/50 text-white ${
                                                errors.full_name ? 'border-red-400/50' : 'border-white/20'
                                            }`}
                                            placeholder="Enter your full name"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                        />
                                        {errors.full_name && (
                                            <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                                                <X size={14} /> {errors.full_name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-semibold text-white/90 mb-2">
                                            <Mail className="inline mr-2" size={16} />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-white/50 text-white ${
                                                errors.email ? 'border-red-400/50' : 'border-white/20'
                                            }`}
                                            placeholder="Enter your email address"
                                            value={formData.email}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                        />
                                        {errors.email && (
                                            <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                                                <X size={14} /> {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <label className="block text-sm font-semibold text-white/90 mb-2">
                                            <Phone className="inline mr-2" size={16} />
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone_number"
                                            className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-white/50 text-white ${
                                                errors.phone_number ? 'border-red-400/50' : 'border-white/20'
                                            }`}
                                            placeholder="Enter your phone number"
                                            value={formData.phone_number}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                        />
                                        {errors.phone_number && (
                                            <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                                                <X size={14} /> {errors.phone_number}
                                            </p>
                                        )}
                                    </div>

                                    {/* Section & Severity - Side by Side */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Section */}
                                        <div>
                                            <label className="block text-sm font-semibold text-white/90 mb-2">
                                                <Globe className="inline mr-2" size={16} />
                                                Section
                                            </label>
                                            <select
                                                name="section"
                                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-white"
                                                value={formData.section}
                                                onChange={handleChange}
                                                disabled={isSubmitting}
                                            >
                                                {sections.map((section) => (
                                                    <option key={section.value} value={section.value} className="bg-gray-800">
                                                        {section.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Severity */}
                                        <div>
                                            <label className="block text-sm font-semibold text-white/90 mb-2">
                                                <AlertTriangle className="inline mr-2" size={16} />
                                                Severity
                                            </label>
                                            <select
                                                name="severity"
                                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-white"
                                                value={formData.severity}
                                                onChange={handleChange}
                                                disabled={isSubmitting}
                                            >
                                                {severityLevels.map((level) => (
                                                    <option key={level.value} value={level.value} className="bg-gray-800">
                                                        {level.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="flex items-center mt-1 text-xs">
                                                <span className="text-white/60 mr-2">Current:</span>
                                                <span className={getSeverityColor(formData.severity)}>
                                                    {severityLevels.find(l => l.value === formData.severity)?.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-semibold text-white/90 mb-2">
                                            <MessageSquare className="inline mr-2" size={16} />
                                            Describe the Issue
                                        </label>
                                        <textarea
                                            name="description"
                                            className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-white/50 text-white resize-none ${
                                                errors.description ? 'border-red-400/50' : 'border-white/20'
                                            }`}
                                            placeholder="Please describe the issue you're experiencing in detail..."
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows="4"
                                            disabled={isSubmitting}
                                        />
                                        {errors.description && (
                                            <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                                                <X size={14} /> {errors.description}
                                            </p>
                                        )}
                                        <div className="text-xs text-white/50 mt-1">
                                            {formData.description.length}/500 characters
                                        </div>
                                    </div>

                                    {/* Screenshot Upload */}
                                    <div>
                                        <label className="block text-sm font-semibold text-white/90 mb-2">
                                            <Camera className="inline mr-2" size={16} />
                                            Attach Screenshot
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="screenshot"
                                                name="screenshot"
                                                accept="image/*"
                                                className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 ${
                                                    errors.screenshot ? 'border-red-400/50' : 'border-white/20'
                                                }`}
                                                onChange={handleFileChange}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        {errors.screenshot && (
                                            <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                                                <X size={14} /> {errors.screenshot}
                                            </p>
                                        )}
                                        {formData.screenshot && (
                                            <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
                                                <CheckCircle size={14} /> File selected: {formData.screenshot.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-4 focus:ring-blue-300/50 ${
                                            isSubmitting ? 'opacity-70 cursor-not-allowed' : 'shadow-lg hover:shadow-xl hover:scale-105'
                                        }`}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex justify-center items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Submitting...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2">
                                                <Send size={18} />
                                                <span>Submit Ticket</span>
                                            </div>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketForm;