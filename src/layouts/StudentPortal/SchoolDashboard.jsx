import { useState, useEffect } from 'react';
import { Book, Calendar, FileText, Compass, Bell, Search, User, LogOut, Menu, X, Settings, Mail, Hash, Shield, CheckCircle, XCircle, Eye, EyeOff, Edit3, Save, AlertCircle, CreditCard } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../Services/studentApi';
import { studentResultsService } from '../../Services/student-results-service';
import { BookListService } from '../../Services/BookListService';
import BookList from './BookList';
import AccountManagement from './AccountManagement';
import StudentResults from './StudentResults';
import StudentBillsPortal from './StudentBillsPortal'; // Import the Bills component

export default function SchoolDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userData, setUserData] = useState({ first_name: '', class_name: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const navigate = useNavigate();

  const tools = [
    { id: 'results', name: 'Results', icon: <FileText size={20} />, color: 'bg-indigo-500' },
    { id: 'booklist', name: 'Book List', icon: <Book size={20} />, color: 'bg-emerald-500' },
    { id: 'timetable', name: 'Time Table', icon: <Calendar size={20} />, color: 'bg-amber-500' },
    { id: 'materials', name: 'Learning Materials', icon: <Compass size={20} />, color: 'bg-rose-500' },
    { id: 'bills', name: 'Bills', icon: <CreditCard size={20} />, color: 'bg-blue-500' }, // Added Bills tab
    { id: 'account', name: 'Manage Account', icon: <Settings size={20} />, color: 'bg-purple-500' }
  ];

  // Helper function to calculate time ago
  const getTimeAgo = (publishedDate) => {
    const now = new Date();
    const published = new Date(publishedDate);
    const diffInMs = now - published;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return diffInHours === 0 ? 'Just now' : `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  // Check for recent notifications
  const checkRecentNotifications = async () => {
    try {
      const recentNotifications = [];
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

      // Check for recent results
      try {
        const results = await studentResultsService.getCurrentClassResults();
        results.forEach(result => {
          if (result.published_date) {
            const publishedDate = new Date(result.published_date);
            if (publishedDate >= sevenDaysAgo) {
              recentNotifications.push({
                id: `result-${result.id}`,
                title: 'New Results Published',
                description: `${result.class_name} - ${result.term} term results are now available`,
                time: getTimeAgo(result.published_date),
                icon: <FileText size={16} className="text-indigo-500" />,
                type: 'result'
              });
            }
          }
        });
      } catch (error) {
        console.error('Error fetching results for notifications:', error);
      }

      // Check for recent booklists
      try {
        const booklistsResponse = await BookListService.getCurrentClassBooklists();
        const booklists = booklistsResponse.data;
        
        if (booklists && Array.isArray(booklists)) {
          booklists.forEach(booklist => {
            if (booklist.publish_date) {
              const publishedDate = new Date(booklist.publish_date);
              if (publishedDate >= sevenDaysAgo && publishedDate <= now) {
                recentNotifications.push({
                  id: `booklist-${booklist.id}`,
                  title: 'New Book List Published',
                  description: `${booklist.title} for ${booklist.class_name_display || booklist.class_name}`,
                  time: getTimeAgo(booklist.publish_date),
                  icon: <Book size={16} className="text-emerald-500" />,
                  type: 'booklist'
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Error fetching booklists for notifications:', error);
        console.error('Full error details:', error.response?.data || error.message);
      }

      // Sort notifications by most recent first
      recentNotifications.sort((a, b) => {
        const timeA = a.time.includes('hour') || a.time === 'Just now' ? 0 : parseInt(a.time);
        const timeB = b.time.includes('hour') || b.time === 'Just now' ? 0 : parseInt(b.time);
        return timeA - timeB;
      });

      setNotifications(recentNotifications);
      setNotificationCount(recentNotifications.length);
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserData({
            first_name: (user.first_name + ' ' + user.last_name) || '',
            class_name: user.class_name || ''
          });
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        navigate('/');
      }
    };

    fetchUserData();
    checkRecentNotifications();

    // Check for notifications every 5 minutes
    const notificationInterval = setInterval(checkRecentNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(notificationInterval);
  }, [navigate]);

  const handleLogout = async () => {
    await logout(navigate);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false); // Close mobile menu when tab changes
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200 flex flex-col
        transition-transform duration-300 ease-in-out
      `}>
        {/* Mobile menu close button */}
        <div className="lg:hidden absolute top-4 right-4">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-indigo-700">Campus Learn</h1>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <button 
                className={`flex items-center w-full p-3 rounded-lg text-left transition-colors ${
                  activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100'
                }`}
                onClick={() => handleTabChange('dashboard')}
              >
                <span className="mr-3 text-lg">🏠</span>
                Dashboard
              </button>
            </li>
            {tools.map(tool => (
              <li key={tool.id}>
                <button 
                  className={`flex items-center w-full p-3 rounded-lg text-left transition-colors ${
                    activeTab === tool.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleTabChange(tool.id)}
                >
                  <span className="mr-3">{tool.icon}</span>
                  {tool.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 mr-3 flex-shrink-0">
                <User size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{userData.first_name || 'Student'}</p>
                <p className="text-xs text-gray-500 truncate">{userData.class_name || 'Loading...'}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0 ml-2"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden mr-3 p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu size={20} />
              </button>
              <h2 className="text-lg font-semibold">Student Dashboard</h2>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search - hidden on very small screens */}
              <div className="relative hidden sm:block">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-32 sm:w-48"
                />
              </div>
              
              {/* Mobile search button */}
              <button className="sm:hidden p-2 rounded-full hover:bg-gray-100">
                <Search size={18} />
              </button>
              
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
        
        {/* Dashboard content */}
        <main className="flex-1 overflow-auto p-3 sm:p-6 bg-gray-50">
          {activeTab === 'dashboard' && (
            <>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                Welcome Back, {userData.first_name || 'Student'}!
              </h2>
              
              {/* Tools Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {tools.map(tool => (
                  <div 
                    key={tool.id}
                    className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleTabChange(tool.id)}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${tool.color} rounded-lg flex items-center justify-center mb-3 sm:mb-4 text-white`}>
                      {tool.icon}
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg mb-1">{tool.name}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm">
                      {tool.id === 'results' && 'View your academic performance'}
                      {tool.id === 'booklist' && 'Access required textbooks'}
                      {tool.id === 'timetable' && 'Check your weekly schedule'}
                      {tool.id === 'materials' && 'Download study resources'}
                      {tool.id === 'bills' && 'View and pay your school bills'}
                      {tool.id === 'account' && 'Manage your account settings'}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
                <h3 className="font-semibold text-base sm:text-lg mb-4">Recent Activity</h3>
                <div className="space-y-3 sm:space-y-4">
                  {notifications.length > 0 ? (
                    notifications.map((notification, index) => (
                      <div key={notification.id} className="flex items-start p-3 hover:bg-gray-50 rounded-lg">
                        <div className="bg-gray-100 rounded-full p-2 mr-3 flex-shrink-0">
                          {notification.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm sm:text-base">{notification.title}</h4>
                          <p className="text-xs sm:text-sm text-gray-500 truncate sm:whitespace-normal">{notification.description}</p>
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0 ml-2">{notification.time}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm sm:text-base">You have no recent activities</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'booklist' && <BookList />}
          {activeTab === 'results' && <StudentResults />}
          {activeTab === 'bills' && <StudentBillsPortal />}
          {activeTab === 'account' && <AccountManagement />}
        </main>
      </div>
    </div>
  );
}