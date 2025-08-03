import { useState, useEffect } from 'react';
import { Eye, EyeOff, X, GraduationCap, Mail, Hash, BookOpen, Users, Calendar, Award, ChevronRight, Star, Shield, Globe, LogOut, User, Menu } from 'lucide-react';
import { loginStudent, checkSession, logout } from '../../Services/studentApi';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [studentLoginMethod, setStudentLoginMethod] = useState('email');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    indexNumber: '',
    password: ''
  });

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const sessionData = await checkSession();
        if (sessionData.loggedIn && sessionData.isStudent) {
          setIsLoggedIn(true);
          setCurrentUser(sessionData.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const closeErrorAlert = () => {
    setError('');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const scrollToLogin = (e) => {
    e.preventDefault();
    const loginSection = document.querySelector('.login-form-section');
    if (loginSection) {
      const navbarHeight = 80;
      const elementPosition = loginSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    closeMobileMenu();
  };

  const scrollToFeatures = (e) => {
    e.preventDefault();
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      const navbarHeight = 80;
      const elementPosition = featuresSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    closeMobileMenu();
  };

  const handleForgotPassword = () => {
    navigate('/forgetpassword');
  };

  const handleGoToPortal = () => {
    navigate('/student-portal');
  };

  const handleLogout = async () => {
    try {
      await logout(navigate);
      setIsLoggedIn(false);
      setCurrentUser(null);
      closeMobileMenu();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const credentials = {
        password: formData.password
      };

      if (studentLoginMethod === 'email') {
        credentials.email = formData.email;
      } else {
        credentials.index_number = formData.indexNumber;
      }

      const result = await loginStudent(credentials);
      if (result.success) {
        navigate('/student-portal');
      } else {
        setError(result.error || 'Student login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    if (!formData.password.trim()) return false;
    return studentLoginMethod === 'email'
      ? formData.email.trim() !== ''
      : formData.indexNumber.trim() !== '';
  };

  const features = [
    {
      icon: BookOpen,
      title: "Course Management",
      description: "Access your courses, assignments, and study materials"
    },
    {
      icon: Calendar,
      title: "Academic Calendar",
      description: "Stay updated with important dates and events"
    },
    {
      icon: Award,
      title: "Grades & Results",
      description: "View your academic performance and transcripts"
    },
    {
      icon: Users,
      title: "Campus Community",
      description: "Connect with classmates and faculty members"
    }
  ];

  const stats = [
    { number: "50,000+", label: "Active Students" },
    { number: "500+", label: "Courses Available" },
    { number: "98%", label: "Success Rate" },
    { number: "24/7", label: "Support Available" }
  ];

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">

      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Navigation Header - Fixed at the top */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-4 bg-black/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <a 
              href="https://plvcmonline.uk" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <GraduationCap className="text-white" size={24} />
            </a>
            <span className="text-white text-xl font-bold">Student Portal</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 text-white/80">
            <button onClick={scrollToFeatures} className="hover:text-white transition-colors">Features</button>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="/support" className="hover:text-white transition-colors">Support</a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 mx-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
            <div className="p-4 space-y-4">
              <button 
                onClick={scrollToFeatures} 
                className="w-full text-left px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center space-x-3"
              >
                <BookOpen size={18} />
                <span>Features</span>
              </button>
              
              <a 
                href="#about" 
                onClick={closeMobileMenu}
                className="block w-full text-left px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center space-x-3"
              >
                <Users size={18} />
                <span>About</span>
              </a>
              
              <a 
                href="/support" 
                onClick={closeMobileMenu}
                className="block w-full text-left px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center space-x-3"
              >
                <Shield size={18} />
                <span>Support</span>
              </a>
              
              {/* Mobile Login/Portal Button - Only show relevant button */}
              {!isLoggedIn ? (
                <button 
                  onClick={scrollToLogin}
                  className="w-full text-left px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center space-x-3"
                >
                  <User size={18} />
                  <span>Login</span>
                </button>
              ) : (
                <button 
                  onClick={() => {
                    handleGoToPortal();
                    closeMobileMenu();
                  }}
                  className="w-full text-left px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center space-x-3"
                >
                  <GraduationCap size={18} />
                  <span>Go to Portal</span>
                </button>
              )}
              
              {/* Mobile Logout - Only show when logged in */}
              {isLoggedIn && (
                <>
                  <div className="border-t border-white/20 my-2"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-xl transition-colors flex items-center space-x-3"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Overlay to close mobile menu when clicking outside */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={closeMobileMenu}
        ></div>
      )}

      {/* Main Content */}
      <div className="relative z-10 px-6 py-12 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left Side - Hero */}
            <div className="text-white space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
                  <Star className="text-yellow-400" size={16} />
                  <span>Trusted by thousands of students</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Your Gateway to
                  <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Academic Success
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-lg">
                  Access your courses, track your progress, connect with peers, and unlock your full potential with our comprehensive student portal.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-white">{stat.number}</div>
                    <div className="text-xs md:text-sm text-white/60">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex items-center space-x-2">
                  <Shield className="text-green-400" size={20} />
                  <span className="text-sm text-white/80">Secure & Private</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="text-blue-400" size={20} />
                  <span className="text-sm text-white/80">Available 24/7</span>
                </div>
              </div>
            </div>

            {/* Right Side - Conditional Content */}
            <div className="w-full max-w-md mx-auto lg:mx-0 login-form-section">
              {error && (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-100 px-4 py-3 rounded-xl mb-6 flex items-center shadow-lg">
                  <span className="flex-grow text-sm">{error}</span>
                  <button onClick={closeErrorAlert} className="ml-4 hover:bg-red-400/20 p-1 rounded-lg transition-colors">
                    <X size={16} />
                  </button>
                </div>
              )}

              {isLoggedIn ? (
                // Welcome Screen for Logged In Users
                <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="text-white" size={32} />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                      Welcome Back, {currentUser?.first_name || 'Student'}!
                    </h2>
                    <p className="text-sm md:text-base text-white/70">
                      You're already signed in. Ready to continue your academic journey?
                    </p>
                  </div>

                  {currentUser && (
                    <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Name:</span>
                        <span className="text-white">{currentUser.first_name} {currentUser.last_name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Email:</span>
                        <span className="text-white truncate ml-2">{currentUser.email}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Index Number:</span>
                        <span className="text-white">{currentUser.index_number}</span>
                      </div>
                      {currentUser.class_name && (
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Class:</span>
                          <span className="text-white">{currentUser.class_name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
                    <button
                      onClick={handleGoToPortal}
                      className="w-full py-3 px-4 rounded-xl text-white font-semibold transition-all duration-200 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 focus:ring-4 focus:ring-green-300/50 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>Enter Student Portal</span>
                        <ChevronRight size={18} />
                      </div>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full py-2 px-4 rounded-xl text-white/80 font-medium transition-all duration-200 bg-white/10 hover:bg-white/20 border border-white/20"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                // Login Form for Non-Logged In Users
                <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Welcome Back</h2>
                    <p className="text-sm md:text-base text-white/70">Sign in to access your dashboard</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <div className="flex gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setStudentLoginMethod('email')}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            studentLoginMethod === 'email'
                              ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          <Mail size={14} /> Email
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentLoginMethod('index')}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            studentLoginMethod === 'index'
                              ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          <Hash size={14} /> Index Number
                        </button>
                      </div>

                      <label className="block text-sm font-semibold text-white/90 mb-2">
                        {studentLoginMethod === 'email' ? 'Email Address' : 'Index Number'}
                      </label>

                      <input
                        type={studentLoginMethod === 'email' ? 'email' : 'text'}
                        name={studentLoginMethod === 'email' ? 'email' : 'indexNumber'}
                        value={studentLoginMethod === 'email' ? formData.email : formData.indexNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-white/50 text-white"
                        placeholder={studentLoginMethod === 'email' ? 'Enter your email address' : 'Enter your index number'}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white/90 mb-2">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 pr-12 transition-all placeholder-white/50 text-white"
                          placeholder="Enter your password"
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute inset-y-0 right-4 flex items-center text-white/60 hover:text-white/80 transition-colors"
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !isFormValid()}
                      className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-4 focus:ring-blue-300/50 ${
                        (isLoading || !isFormValid()) ? 'opacity-70 cursor-not-allowed' : 'shadow-lg hover:shadow-xl hover:scale-105'
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex justify-center items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>Access Your Portal</span>
                          <ChevronRight size={18} />
                        </div>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button 
                      onClick={handleForgotPassword}
                      className="text-sm text-blue-300 hover:text-blue-200 transition-colors underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Features Section */}
          <div id="features" className="mt-24 scroll-mt-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything You Need</h2>
              <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
                Discover powerful tools designed to enhance your learning experience and academic journey.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="text-white" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/70 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 mt-24 px-6 py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/60 text-sm">
            © 2025 EduPortal. All rights reserved. | 
            <span className="ml-2">Empowering students worldwide</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;