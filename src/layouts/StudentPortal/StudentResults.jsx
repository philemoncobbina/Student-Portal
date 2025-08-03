import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Calendar, BookOpen, User, Clock, CheckCircle, FileText, Trophy, 
  Users, CalendarDays, GraduationCap, MessageSquare, AlertTriangle, Download, Eye, ExternalLink
} from 'lucide-react';
import { studentResultsService } from '../../Services/student-results-service';
import { getCurrentUser } from '../../Services/studentApi';

const TERMS = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' }
];

const CLASSES = [
  'Creche', 'Nursery', 'KG 1', 'KG 2', 'Class 1', 'Class 2', 'Class 3', 
  'Class 4', 'Class 5', 'Class 6', 'JHS 1', 'JHS 2', 'JHS 3'
].map(cls => ({ value: cls, label: cls }));

const StudentResults = () => {
  const [activeTab, setActiveTab] = useState('current');
  const [results, setResults] = useState({ current: [], previous: [] });
  const [loading, setLoading] = useState({ current: false, previous: false });
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({ class_name: '' });
  const [filters, setFilters] = useState({
    currentTerm: '',
    previousClass: '',
    previousTerm: ''
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    
    getCurrentUser()
      .then(user => user && setUserData({ class_name: user.class_name || '' }))
      .catch(err => {
        console.error('Error fetching user data:', err);
        setError('Failed to fetch user data');
      });
  }, []);

  const fetchResults = async (type, params) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    setError(null);
    
    try {
      const method = type === 'current' ? 'getCurrentClassResults' : 'getPreviousClassResults';
      const data = await studentResultsService[method](params);
      setResults(prev => ({ ...prev, [type]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      setError(`Failed to fetch ${type} class results`);
      console.error(`Error fetching ${type} results:`, err);
      setResults(prev => ({ ...prev, [type]: [] }));
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  useEffect(() => {
    if (filters.currentTerm && userData.class_name) {
      fetchResults('current', { 
        class_name: userData.class_name,
        term: filters.currentTerm
      });
    }
  }, [filters.currentTerm, userData.class_name]);

  useEffect(() => {
    if (filters.previousClass && filters.previousTerm) {
      fetchResults('previous', {
        class_name: filters.previousClass,
        term: filters.previousTerm,
      });
    }
  }, [filters.previousClass, filters.previousTerm]);

  const updateFilter = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      if (key === 'previousClass') {
        newFilters.previousTerm = '';
        setResults(prev => ({ ...prev, previous: [] }));
      }
      return newFilters;
    });
  };

  const getSubjectName = (course) => 
    course?.class_course?.course?.name || 
    course?.class_course?.name || 
    course?.subject_name || 
    course?.course_name || 
    'Unknown Subject';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusDetails = (status) => {
    const statusMap = {
      'PUBLISHED': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
      'SCHEDULED': { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
      'DRAFT': { color: 'bg-slate-50 text-slate-700 border-slate-200', icon: FileText }
    };
    return statusMap[status?.toUpperCase()] || statusMap['DRAFT'];
  };

  const getTotalStudents = (result) => {
    if (result.position_context) {
      const match = result.position_context.match(/\/(\d+)$/);
      if (match) return parseInt(match[1], 10);
    }
    return result.total_students_in_class || 0;
  };

  const formatPosition = (result) => 
    result.position_context || 
    (result.overall_position && result.total_students_in_class ? 
     `${result.overall_position}/${result.total_students_in_class}` : 
     result.overall_position || 'N/A');

  const getGradeColor = (grade) => {
    const gradeColors = {
      'A+': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'A': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'B+': 'bg-blue-100 text-blue-800 border-blue-300',
      'B': 'bg-blue-100 text-blue-800 border-blue-300',
      'C+': 'bg-amber-100 text-amber-800 border-amber-300',
      'C': 'bg-amber-100 text-amber-800 border-amber-300',
      'D': 'bg-orange-100 text-orange-800 border-orange-300',
      'F': 'bg-red-100 text-red-800 border-red-300'
    };
    return gradeColors[grade] || 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, bgColor = 'bg-slate-50' }) => (
    <div className={`${bgColor} rounded-xl p-4`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Icon className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <div className="text-sm font-medium text-slate-600">{title}</div>
          <div className="text-lg font-bold text-slate-900 mt-1">{value}</div>
        </div>
      </div>
      {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
    </div>
  );

  const ResultCard = ({ result }) => {
    const statusDetails = getStatusDetails(result.status);
    const StatusIcon = statusDetails.icon;
    const totalStudents = getTotalStudents(result);
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="sm:hidden">
                <div className="flex flex-col space-y-2 mb-4">
                  <h2 className="text-xl font-bold leading-tight">{result.student_name}</h2>
                  <div className="flex items-center gap-3 text-indigo-100 text-sm">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      {result.class_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {result.term?.charAt(0).toUpperCase() + result.term?.slice(1)} Term
                    </span>
                  </div>
                </div>
                <div className="text-center bg-black bg-opacity-10 rounded-lg py-3 px-4">
                  <div className="text-2xl font-bold mb-1">{result.average_score || 0}%</div>
                  <div className="text-sm text-indigo-100">Average Score</div>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{result.student_name}</h2>
                  <div className="flex items-center gap-4 text-indigo-100">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      {result.class_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {result.term?.charAt(0).toUpperCase() + result.term?.slice(1)} Term
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold mb-1">{result.average_score || 0}%</div>
                  <div className="text-sm text-indigo-100">Average Score</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
              <StatCard 
                icon={StatusIcon} 
                title="Status" 
                value={<Badge className={`${statusDetails.color} text-xs font-medium px-2 py-1`}>{result.status}</Badge>}
                subtitle={result.published_date && `Published: ${formatDate(result.published_date)}`}
              />
              <StatCard 
                icon={Trophy} 
                title="Position" 
                value={formatPosition(result)}
                subtitle={`Total Score: ${result.total_score || 0}`}
              />
              <StatCard 
                icon={CalendarDays} 
                title="Attendance" 
                value={`${result.attendance_percentage || 0}%`}
                subtitle={(result.days_present || result.days_absent) && `${result.days_present || 0} present, ${result.days_absent || 0} absent`}
              />
              <StatCard 
                icon={Users} 
                title="Class Size" 
                value={totalStudents}
                subtitle={`Academic Year: ${result.academic_year || '2023-2024'}`}
              />
            </div>

            {result.report_card_pdf && (
              <div className="flex flex-wrap gap-3 mb-6">
                <a 
                  href={`https://docs.google.com/viewer?url=${encodeURIComponent(result.report_card_pdf)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors duration-200 text-slate-700 font-medium text-sm"
                  onClick={(e) => {
                    const isChromeMobile = /Android.*Chrome\/[.0-9]* Mobile/i.test(navigator.userAgent);
                    if (!isChromeMobile) {
                      e.preventDefault();
                      window.open(result.report_card_pdf, '_blank');
                    }
                  }}
                >
                  {isMobile ? (
                    <>
                      <Download className="h-4 w-4" />
                      Download Report Card
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      View Report Card
                    </>
                  )}
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </div>
            )}

            <div className="space-y-4">
              {result.class_teacher_remarks && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4" />
                    Teacher's Remarks
                  </h3>
                  <p className="text-sm text-blue-800 italic">
                    "{result.class_teacher_remarks}"
                  </p>
                </div>
              )}

              {(result.promoted_to || result.next_term_begins) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.promoted_to && (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                      <h3 className="font-semibold text-emerald-900 flex items-center gap-2 mb-2">
                        <GraduationCap className="h-4 w-4" />
                        Promotion Status
                      </h3>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                        Promoted to {result.promoted_to}
                      </Badge>
                    </div>
                  )}
                  {result.next_term_begins && (
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4" />
                        Next Term
                      </h3>
                      <div className="text-sm text-amber-800">
                        Begins: {formatDate(result.next_term_begins)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {result.course_results?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                Subject Performance
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-4 sm:px-6 py-4 text-sm font-semibold text-slate-700">Subject</th>
                    <th className="text-center px-2 sm:px-4 py-4 text-sm font-semibold text-slate-700">Class Score (40) </th>
                    <th className="text-center px-2 sm:px-4 py-4 text-sm font-semibold text-slate-700">Exam Score (60)</th>
                    <th className="text-center px-2 sm:px-4 py-4 text-sm font-semibold text-slate-700">Total (100)</th>
                    <th className="text-center px-2 sm:px-4 py-4 text-sm font-semibold text-slate-700">Grade</th>
                    <th className="text-center px-2 sm:px-4 py-4 text-sm font-semibold text-slate-700">Position</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-sm font-semibold text-slate-700">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {result.course_results.map((course, index) => (
                    <tr key={course.id || index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          <span className="text-sm font-medium text-slate-900">
                            {getSubjectName(course)}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-4 text-center">
                        <div className="text-sm font-medium text-slate-900">
                          {course.class_score || 0}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-4 text-center">
                        <div className="text-sm font-medium text-slate-900">
                          {course.exam_score || 0}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-4 text-center">
                        <div className="text-lg font-bold text-indigo-700">
                          {course.total_score || 0}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-4 text-center">
                        <Badge className={`${getGradeColor(course.grade)} font-semibold text-sm px-3 py-1`}>
                          {course.grade || 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-2 sm:px-4 py-4 text-center">
                        <Badge className="bg-slate-100 text-slate-700 border-slate-300 font-medium text-sm px-3 py-1">
                          {course.position_context || course.position || 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="max-w-xs">
                          {course.remarks ? (
                            <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                              {course.remarks}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">No remarks</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 bg-indigo-400" />
              <Skeleton className="h-4 w-32 bg-indigo-400" />
            </div>
            <Skeleton className="h-10 w-16 bg-indigo-400" />
          </div>
        </div>
        <div className="p-4 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const EmptyState = ({ type }) => {
    const isCurrentTab = type === 'current';
    const Icon = isCurrentTab ? Trophy : Calendar;
    const title = isCurrentTab ? 'No Results Found' : 'No Historical Results';
    const hasRequiredFilters = isCurrentTab ? filters.currentTerm : filters.previousClass && filters.previousTerm;
    const message = isCurrentTab 
      ? (filters.currentTerm ? 'No results available for your current class in this term.' : 'Please select a term to view results.')
      : (hasRequiredFilters ? 'No results found for this class and term.' : 'Please select both class and term to view results.');

    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <Icon className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 max-w-sm mx-auto">{message}</p>
      </div>
    );
  };

  const TabContent = ({ type }) => {
    const isCurrentTab = type === 'current';
    const data = results[type];
    const isLoading = loading[type];

    const renderFilters = () => {
      if (isCurrentTab) {
        return (
          <Select value={filters.currentTerm} onValueChange={(v) => updateFilter('currentTerm', v)}>
            <SelectTrigger className="w-full sm:w-48 bg-white border-slate-300">
              <SelectValue placeholder="Select Term" />
            </SelectTrigger>
            <SelectContent className='bg-white'>
              {TERMS.map((term) => (
                <SelectItem key={term.value} value={term.value}>
                  {term.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      return (
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={filters.previousClass} onValueChange={(v) => updateFilter('previousClass', v)}>
            <SelectTrigger className="w-full sm:w-48 bg-white border-slate-300">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent className='bg-white'>
              {CLASSES.map((cls) => (
                <SelectItem key={cls.value} value={cls.value}>
                  {cls.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={filters.previousTerm} 
            onValueChange={(v) => updateFilter('previousTerm', v)}
            disabled={!filters.previousClass}
          >
            <SelectTrigger className="w-full sm:w-48 bg-white border-slate-300">
              <SelectValue placeholder="Select Term" />
            </SelectTrigger>
            <SelectContent className='bg-white'>
              {TERMS.map((term) => (
                <SelectItem key={term.value} value={term.value}>
                  {term.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {isCurrentTab ? 'Current Class Results' : 'Previous Class Results'}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {isCurrentTab 
                ? `View results for ${userData.class_name || 'your current class'}`
                : 'View your historical academic performance'
              }
            </p>
          </div>
          {renderFilters()}
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : data?.length > 0 ? (
          <div className="space-y-8">
            {data.map((result, index) => (
              <ResultCard key={result.id || index} result={result} />
            ))}
          </div>
        ) : (
          <EmptyState type={type} />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Academic Results</h1>
              <p className="text-slate-600 mt-2">Track your academic progress and performance</p>
            </div>
            {userData.class_name && (
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 px-4 py-2 text-sm font-medium">
                Current Class: {userData.class_name}
              </Badge>
            )}
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-gray-100 p-1 rounded-lg h-auto">
            <TabsTrigger 
              value="current" 
              className="flex items-center justify-center gap-1 sm:gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-xs sm:text-sm py-2 px-1 sm:px-2"
            >
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="break-words text-center leading-tight">Current Results</span>
            </TabsTrigger>
            <TabsTrigger 
              value="previous" 
              className="flex items-center justify-center gap-1 sm:gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-xs sm:text-sm py-2 px-1 sm:px-2"
            >
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="break-words text-center leading-tight">Previous Results</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            <TabContent type="current" />
          </TabsContent>
          <TabsContent value="previous">
            <TabContent type="previous" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentResults;