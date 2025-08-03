import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Calendar, BookOpen, TrendingUp, Award, AlertTriangle, FileText, Book, 
  DollarSign, Check, X, Layers, ShoppingCart, Package, Users, 
  GraduationCap, Download, Eye, Star, Hash
} from 'lucide-react';
import { BookListService } from '../../Services/BookListService';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error in component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-8 sm:py-16 bg-white rounded-2xl border border-slate-200 shadow-sm mx-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h3>
          <p className="text-slate-600 max-w-sm mx-auto mb-4 px-4">
            We couldn't load your book lists at this time. Please try again later.
          </p>
          <Button 
            onClick={() => this.setState({ hasError: false })}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

const BookListViewer = () => {
  // State management
  const [activeTab, setActiveTab] = useState('current');
  const [currentBooklists, setCurrentBooklists] = useState([]);
  const [previousClassBooklists, setPreviousClassBooklists] = useState([]);
  const [loading, setLoading] = useState({
    current: false,
    previous: false,
  });
  const [error, setError] = useState(null);

  // Load data on component mount
  useEffect(() => {
    fetchCurrentBooklists();
    fetchPreviousClassBooklists();
  }, []);

  // Fetch current class booklists
  const fetchCurrentBooklists = async () => {
    setLoading(prev => ({ ...prev, current: true }));
    setError(null);
    
    try {
      const response = await BookListService.getCurrentClassBooklists();
      setCurrentBooklists(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Failed to fetch current class book lists');
      console.error('Error fetching current booklists:', err);
      setCurrentBooklists([]);
    } finally {
      setLoading(prev => ({ ...prev, current: false }));
    }
  };

  // Fetch previous class booklists
  const fetchPreviousClassBooklists = async () => {
    setLoading(prev => ({ ...prev, previous: true }));
    setError(null);
    
    try {
      const response = await BookListService.getPreviousClassesBooklists();
      setPreviousClassBooklists(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Failed to fetch previous class book lists');
      console.error('Error fetching previous booklists:', err);
      setPreviousClassBooklists([]);
    } finally {
      setLoading(prev => ({ ...prev, previous: false }));
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Format date
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

  // Calculate overall statistics for Historical Summary
  const calculateOverallStatistics = (booklists) => {
    const totalLists = booklists.length;
    const totalItems = booklists.reduce((sum, list) => sum + (list.items?.length || 0), 0);
    // Only calculate total cost here for the Historical Summary
    const totalCost = booklists.reduce((sum, list) => sum + (list.total_price || 0), 0);
    const requiredItems = booklists.reduce((sum, list) => sum + (list.items?.filter(item => item.is_required).length || 0), 0);
    
    return {
      totalLists,
      totalItems,
      totalCost,
      requiredItems
    };
  };

  // Get item status badge
  const getItemStatusBadge = (isRequired) => {
    return isRequired ? (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-medium">
        Required
      </Badge>
    ) : (
      <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-medium">
        Optional
      </Badge>
    );
  };

  // StatCard component
  const StatCard = ({ icon: Icon, title, value, subtitle, bgColor = 'bg-slate-50' }) => (
    <div className={`${bgColor} rounded-xl p-3 sm:p-4`}>
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-medium text-slate-600 truncate">{title}</div>
          <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 sm:mt-1 truncate">{value}</div>
        </div>
      </div>
      {subtitle && <div className="text-xs text-slate-500 line-clamp-2">{subtitle}</div>}
    </div>
  );

  // Render booklist card
  const renderBooklistCard = (booklist) => {
    if (!booklist) return null;
    
    const stats = {
      totalItems: booklist.items?.length || 0,
      requiredItems: booklist.items?.filter(item => item.is_required).length || 0,
      optionalItems: booklist.items?.filter(item => !item.is_required).length || 0,
      // Use backend calculated total price
      totalCost: booklist.total_price || 0
    };
    
    return (
      <div key={booklist.id} className="space-y-4 sm:space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Hero Section - Responsive Layout */}
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 line-clamp-2">
                  {booklist.title || 'Untitled Booklist'}
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-indigo-100">
                  <span className="flex items-center gap-1.5 text-sm">
                    <GraduationCap className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{booklist.class_name_display || booklist.class_name || 'N/A'}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sm">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{booklist.academic_year || 'Not specified'}</span>
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right flex-shrink-0">
                <div className="text-2xl sm:text-3xl font-bold mb-1">{formatCurrency(stats.totalCost)}</div>
                <div className="text-sm text-indigo-100">Total Cost</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
              <StatCard 
                icon={Package} 
                title="Total Items" 
                value={stats.totalItems}
                subtitle={`${stats.requiredItems} required, ${stats.optionalItems} optional`}
              />
              <StatCard 
                icon={Star} 
                title="Required Items" 
                value={stats.requiredItems}
                subtitle={`${Math.round((stats.requiredItems / stats.totalItems) * 100) || 0}% of total`}
              />
              <div className="col-span-2 lg:col-span-1">
                <StatCard 
                  icon={ShoppingCart} 
                  title="Total Cost" 
                  value={formatCurrency(stats.totalCost)}
                  subtitle={booklist.publish_date && `Published: ${formatDate(booklist.publish_date)}`}
                />
              </div>
              <div className="col-span-2 lg:col-span-1">
                <StatCard 
                  icon={Calendar} 
                  title="Published" 
                  value={formatDate(booklist.publish_date)}
                  subtitle="Release date"
                />
              </div>
            </div>

            {/* Description */}
            {booklist.description && (
              <div className="mb-4 sm:mb-6">
                <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-2 text-sm sm:text-base">
                    <FileText className="h-4 w-4" />
                    Description
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                    {booklist.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Items Table - Responsive */}
        {booklist.items?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-4 sm:h-5 w-4 sm:w-5 text-indigo-600" />
                Book Items ({booklist.items.length})
              </h3>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Item</th>
                    <th className="text-center px-4 py-4 text-sm font-semibold text-slate-700">Price</th>
                    <th className="text-center px-4 py-4 text-sm font-semibold text-slate-700">Quantity</th>
                    <th className="text-center px-4 py-4 text-sm font-semibold text-slate-700">Subtotal</th>
                    <th className="text-center px-4 py-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {booklist.items.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${item.is_required ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                          <span className="text-sm font-medium text-slate-900">
                            {item.name || 'Unnamed Item'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm font-medium text-slate-900">
                          {formatCurrency(item.price || 0)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge className="bg-slate-100 text-slate-700 border-slate-300 font-medium text-sm px-3 py-1">
                          {item.quantity || 0}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-lg font-bold text-indigo-700">
                          {formatCurrency((item.price || 0) * (item.quantity || 0))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {getItemStatusBadge(item.is_required)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          {item.description ? (
                            <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                              {item.description}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">No description</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="lg:hidden">
              <div className="divide-y divide-slate-200">
                {booklist.items.map((item, index) => (
                  <div key={item.id || index} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.is_required ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {item.name || 'Unnamed Item'}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {formatCurrency(item.price || 0)} × {item.quantity || 0}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-base font-bold text-indigo-700">
                          {formatCurrency((item.price || 0) * (item.quantity || 0))}
                        </div>
                        <div className="mt-1">
                          {getItemStatusBadge(item.is_required)}
                        </div>
                      </div>
                    </div>
                    {item.description && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                        {item.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-3/4 sm:w-48 bg-indigo-400" />
              <Skeleton className="h-4 w-1/2 sm:w-32 bg-indigo-400" />
            </div>
            <Skeleton className="h-10 w-20 sm:w-16 bg-indigo-400 self-start sm:self-auto" />
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-slate-50 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg" />
                  <div className="space-y-1 sm:space-y-2 flex-1">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Render empty state
  const renderEmptyState = (type) => {
    const Icon = type === 'current' ? Book : Layers;
    const title = type === 'current' ? 'No Current Book Lists' : 'No Previous Book Lists';
    const message = type === 'current' 
      ? 'No book lists available for your current class.' 
      : 'No book lists found from your previous classes.';

    return (
      <div className="text-center py-8 sm:py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <Icon className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 max-w-sm mx-auto px-4">{message}</p>
      </div>
    );
  };

  // Render statistics summary
  const renderStatisticsSummary = (booklists, isHistorical = false) => {
    if (!booklists || booklists.length === 0) return null;
    
    const stats = calculateOverallStatistics(booklists);
    
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 sm:h-5 w-4 sm:w-5 text-indigo-600" />
          {isHistorical ? "Historical Summary" : "Overview"}
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <StatCard 
            icon={Hash} 
            title="Total Lists" 
            value={stats.totalLists}
            subtitle="Active book lists"
          />
          <StatCard 
            icon={Package} 
            title="Total Items" 
            value={stats.totalItems}
            subtitle="Books & materials"
          />
          <StatCard 
            icon={Star} 
            title="Required Items" 
            value={stats.requiredItems}
            subtitle="Must-have items"
          />
          <StatCard 
            icon={DollarSign} 
            title="Total Cost" 
            value={formatCurrency(stats.totalCost)}
            subtitle="Estimated total"
          />
        </div>
      </div>
    );
  };

  // Tab content component
  const TabContent = ({ type }) => {
    const isCurrentTab = type === 'current';
    const data = isCurrentTab ? currentBooklists : previousClassBooklists;
    const isLoading = loading[type];

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Filter Bar */}
        <div className="flex flex-col gap-4 p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              {isCurrentTab ? 'Current Class Book Lists' : 'Previous Class Book Lists'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {isCurrentTab 
                ? 'View book lists for your current academic class'
                : 'View your historical book lists from previous classes'
              }
            </p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          renderLoadingSkeleton()
        ) : data?.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            {renderStatisticsSummary(data, !isCurrentTab)}
            <div className="space-y-6 sm:space-y-8">
              {data.map((booklist) => renderBooklistCard(booklist))}
            </div>
          </div>
        ) : (
          renderEmptyState(type)
        )}
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Book Lists</h1>
                <p className="text-slate-600 mt-1 sm:mt-2 text-sm sm:text-base">
                  Manage your current and previous class book lists
                </p>
              </div>
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium self-start">
                Academic Resources
              </Badge>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="mb-4 sm:mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-gray-100 p-1 rounded-lg h-auto">
              <TabsTrigger 
                value="current" 
                className="flex items-center justify-center gap-1 sm:gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-xs sm:text-sm py-2 px-2 sm:px-3"
              >
                <Book className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="break-words text-center leading-tight">Current Lists</span>
              </TabsTrigger>
              <TabsTrigger 
                value="previous" 
                className="flex items-center justify-center gap-1 sm:gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-xs sm:text-sm py-2 px-2 sm:px-3"
              >
                <Layers className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="break-words text-center leading-tight">Previous Lists</span>
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
    </ErrorBoundary>
  );
};

export default BookListViewer;