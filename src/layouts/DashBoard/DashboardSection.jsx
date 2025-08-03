import React, { useState, useEffect } from 'react';
import { getUserDetails } from "../../Services/ChangePassword";
import { CalendarDays, BookOpen, ArrowRight, CheckSquare } from "lucide-react";

const DashboardSection = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const userDetails = await getUserDetails();
        if (userDetails) {
          setUser(userDetails);
        }
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const scrollToAdmissions = () => {
    const teamSection = document.getElementById('admission-section');
    if (teamSection) {
      teamSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 pt-24 pb-12">
      {/* Welcome Section */}
      <div className="mb-8">
        {isLoading ? (
          <div className="h-12 w-64 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              {user?.first_name?.charAt(0) || ""}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Welcome back, {user ? `${user.first_name}` : ''}
              </h1>
              <p className="text-gray-500">
                Let's continue where you left off
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admissions Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <CheckSquare className="text-blue-600 h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Admissions</h2>
              </div>
              <button 
  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
  onClick={scrollToAdmissions}
>
  View All <ArrowRight className="h-4 w-4" />
</button>
            </div>

            <div className="flex flex-col justify-center items-center py-16 px-4">
              <div className="bg-gray-50 rounded-full p-8 mb-6">
                <CheckSquare className="h-12 w-12 text-blue-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">Admission Information</h3>
              <p className="text-gray-500 text-center max-w-sm mb-6">
                Discover our admission process and requirements for enrolling at Ridoana Junior High School.
              </p>
              <a href="/admission/apply" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors inline-block">
  Apply Online
</a>
            </div>
          </div>
        </div>

        {/* About Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full">
            <div className="flex items-center gap-3 p-6 border-b">
              <div className="bg-purple-100 p-2 rounded-lg">
                <BookOpen className="text-purple-600 h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">About Us</h2>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Ridoana</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Ridoana Junior High School is a dedicated educational institution committed to connecting and simplifying the learning journey. Ridoana operates with a vision to nurture young minds.
              </p>
              <a 
                href="/about" 
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium transition-colors"
              >
                Read More <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            
            {/* Blogs Quick Access */}
            <div className="bg-gray-50 p-6 border-t">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CalendarDays className="text-green-600 h-5 w-5" />
                </div>
                <h3 className="font-medium text-gray-800">Latest Blogs</h3>
              </div>
              <p className="text-gray-500 text-sm mb-3">Stay updated with our latest news and articles</p>
              <a 
                href="/blog" 
                className="text-sm text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
              >
                View All Blogs <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSection;