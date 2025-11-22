import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  CheckCircle, 
  Calendar, 
  DollarSign,
  FileText,
  X,
  CreditCard,
  Download,
  Clock,
  AlertTriangle,
  Receipt,
  Tag,
  Percent,
  ChevronDown,
  ChevronUp,
  User,
  PlusCircle
} from 'lucide-react';

import { 
  StudentBillsService, 
  formatCurrency,
  formatDate,
  getPaymentStatusColor,
  getTermDisplay,
  getCategoryColor,
  getCustomChargeColor
} from '../../Services/studentBillsService';

const StudentBillsPortal = ({ className = '' }) => {
  const [billsData, setBillsData] = useState(null);
  const [currentClassBills, setCurrentClassBills] = useState([]);
  const [loading, setLoading] = useState({ current: false, all: false });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [selectedBill, setSelectedBill] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedBill, setExpandedBill] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadBillsData();
  }, []);

  const loadBillsData = async () => {
    try {
      setLoading({ current: true, all: true });
      setError(null);

      const [allBills, currentBills] = await Promise.all([
        StudentBillsService.getAllBills(),
        StudentBillsService.getCurrentClassBills(),
      ]);

      setBillsData(allBills);
      setCurrentClassBills(currentBills);
    } catch (err) {
      setError('Failed to load bills. Please try again.');
      console.error('Error loading bills:', err);
    } finally {
      setLoading({ current: false, all: false });
    }
  };

  const getBillsToDisplay = () => {
    const bills = activeTab === 'current' ? currentClassBills : billsData?.bills || [];
    
    if (filterStatus !== 'all') {
      return bills.filter(bill => bill.payment_status === filterStatus);
    }
    
    return bills;
  };

  const getStatusConfig = (status) => {
    const configs = {
      'paid': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
      'partial': { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
      'overdue': { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
      'pending': { bg: 'bg-slate-100', text: 'text-slate-700', icon: Clock }
    };
    return configs[status?.toLowerCase()] || configs['pending'];
  };

  // Compact Bill Card for Mobile
  const CompactBillCard = ({ bill }) => {
    const balanceDue = parseFloat(bill.current_bill_balance || 0);
    const isOverdue = bill.is_overdue && balanceDue > 0;
    const statusConfig = getStatusConfig(bill.payment_status);
    const StatusIcon = statusConfig.icon;
    const isExpanded = expandedBill === bill.id;

    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Compact Header */}
        <div 
          onClick={() => setExpandedBill(isExpanded ? null : bill.id)}
          className="p-4 cursor-pointer active:bg-slate-50"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-sm truncate">
                {bill.bill_number}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {bill.billing_template.class_name} • {getTermDisplay(bill.billing_template.term)}
              </p>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
              <StatusIcon className="w-3 h-3" />
              {bill.payment_status}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs text-slate-500">Total Amount</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {formatCurrency(bill.total_amount_due)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Balance</p>
              <p className={`text-base font-bold mt-0.5 ${
                balanceDue > 0 ? 'text-red-600' : balanceDue < 0 ? 'text-green-600' : 'text-slate-900'
              }`}>
                {formatCurrency(Math.abs(balanceDue))}
              </p>
            </div>
          </div>

          {/* Due Date & Expand Indicator */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Calendar className="w-3.5 h-3.5" />
              <span>Due: {formatDate(bill.due_date)}</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50 space-y-3">
            {/* Payment Info */}
            <div className="pt-3">
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <p className="text-xs text-slate-500">Paid</p>
                <p className="text-sm font-semibold text-green-600 mt-1">
                  {formatCurrency(bill.total_paid)}
                </p>
              </div>
            </div>

            {/* Discount Badge */}
            {parseFloat(bill.discount_amount || 0) > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700">Discount Applied</span>
                  </div>
                  <span className="text-sm font-bold text-green-700">
                    -{formatCurrency(bill.discount_amount)}
                  </span>
                </div>
              </div>
            )}

            {/* Overdue Warning */}
            {isOverdue && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-red-700">Payment Overdue</p>
                  <p className="text-xs text-red-600 mt-0.5">Please settle this bill as soon as possible</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBill(bill);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 active:bg-slate-50"
              >
                <Eye className="h-3.5 w-3.5" />
                Details
              </button>
              {balanceDue > 0 && (
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 rounded-lg text-xs font-medium text-white active:bg-indigo-700"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Pay Now
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Bill Details Modal
  const BillDetailsModal = () => {
    if (!selectedBill) return null;

    const balanceDue = parseFloat(selectedBill.current_bill_balance || 0);
    const hasDiscount = parseFloat(selectedBill.discount_amount || 0) > 0;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
        <div className="bg-white w-full sm:max-w-2xl sm:rounded-xl max-h-[90vh] overflow-hidden flex flex-col rounded-t-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
            <div className="flex-1 min-w-0 mr-4">
              <h2 className="text-lg font-bold text-slate-900 truncate">
                {selectedBill.bill_number}
              </h2>
              <p className="text-sm text-slate-600 truncate">
                {selectedBill.billing_template.class_name}
              </p>
            </div>
            <button
              onClick={() => setSelectedBill(null)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-xs text-blue-600 mb-1">Total Amount</p>
                <p className="text-xl font-bold text-blue-900">
                  {formatCurrency(selectedBill.total_amount_due)}
                </p>
              </div>
              <div className={`rounded-lg p-4 border ${
                balanceDue > 0 
                  ? 'bg-red-50 border-red-100' 
                  : balanceDue < 0 
                    ? 'bg-green-50 border-green-100'
                    : 'bg-slate-50 border-slate-100'
              }`}>
                <p className={`text-xs mb-1 ${
                  balanceDue > 0 ? 'text-red-600' : balanceDue < 0 ? 'text-green-600' : 'text-slate-600'
                }`}>
                  {balanceDue < 0 ? 'Credit' : 'Balance'}
                </p>
                <p className={`text-xl font-bold ${
                  balanceDue > 0 ? 'text-red-900' : balanceDue < 0 ? 'text-green-900' : 'text-slate-900'
                }`}>
                  {formatCurrency(Math.abs(balanceDue))}
                </p>
              </div>
            </div>

            {/* Payment Progress */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600">Payment Progress</span>
                <span className="text-xs font-bold text-slate-900">
                  {formatCurrency(selectedBill.total_paid)} / {formatCurrency(selectedBill.total_amount_due)}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min((selectedBill.total_paid / selectedBill.total_amount_due) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>

            {/* Discount Section */}
            {hasDiscount && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-800">Discount</span>
                  </div>
                  <span className="text-lg font-bold text-green-700">
                    -{formatCurrency(selectedBill.discount_amount)}
                  </span>
                </div>
                {selectedBill.discount_reason && (
                  <p className="text-xs text-green-700 mt-2">
                    {selectedBill.discount_reason}
                  </p>
                )}
              </div>
            )}

            {/* Billing Items */}
            {selectedBill.billing_template.billing_items?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Charges ({selectedBill.billing_template.billing_items.length})
                </h3>
                <div className="space-y-2">
                  {selectedBill.billing_template.billing_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.item_name}</p>
                        <p className="text-xs text-slate-600">{item.category}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-900 flex-shrink-0">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Charges */}
            {selectedBill.custom_charges?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-purple-600" />
                  Additional ({selectedBill.custom_charges.length})
                </h3>
                <div className="space-y-2">
                  {selectedBill.custom_charges.map((charge) => (
                    <div key={charge.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium text-slate-900 truncate">{charge.charge_name}</p>
                        <p className="text-xs text-slate-600">{formatDate(charge.created_date)}</p>
                      </div>
                      <span className="text-sm font-bold text-purple-700 flex-shrink-0">
                        {formatCurrency(charge.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Receipts */}
            {selectedBill.payment_receipts?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-green-600" />
                  Payments ({selectedBill.payment_receipts.length})
                </h3>
                <div className="space-y-2">
                  {selectedBill.payment_receipts.map((receipt) => (
                    <div key={receipt.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium text-slate-900 truncate">{receipt.receipt_number}</p>
                        <p className="text-xs text-slate-600">
                          {receipt.payment_method} • {formatDate(receipt.payment_date)}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-green-700 flex-shrink-0">
                        {formatCurrency(receipt.amount_paid)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 bg-white space-y-2">
            {balanceDue > 0 && (
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 rounded-lg text-white font-medium hover:bg-indigo-700 transition-colors">
                <CreditCard className="w-4 h-4" />
                Pay {formatCurrency(Math.abs(balanceDue))}
              </button>
            )}
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" />
              Download Bill
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Loading State
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
          <div className="h-3 bg-slate-200 rounded w-1/2 mb-4" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 bg-slate-200 rounded" />
            <div className="h-12 bg-slate-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  // Empty State
  const EmptyState = () => (
    <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
      <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
        <FileText className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">No Bills Found</h3>
      <p className="text-xs text-slate-600">No bills match your current filters</p>
    </div>
  );

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-9xl xl:max-w-6xl mx-auto">
          <div className="text-center py-12 bg-white rounded-lg border border-red-200">
            <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Error Loading Bills</h3>
            <p className="text-xs text-slate-600 mb-4">{error}</p>
            <button
              onClick={loadBillsData}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayedBills = getBillsToDisplay();
  const isLoading = loading[activeTab];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-9xl xl:max-w-8xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Bills</h1>
          <p className="text-sm text-slate-600 mt-1">View and manage your payments</p>
        </div>

        {/* Summary Card */}
        {billsData && (
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-5 text-white shadow-lg">
            <p className="text-sm text-indigo-100 mb-1">{billsData.student}</p>
            <p className="text-xs text-indigo-200 mb-4">{billsData.current_class}</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-center">
              <div>
                <p className={`text-2xl font-bold ${
                  billsData.summary.total_outstanding_balance < 0 ? 'text-green-300' : 'text-white'
                }`}>
                  {formatCurrency(Math.abs(billsData.summary.total_outstanding_balance))}
                </p>
                <p className="text-xs text-indigo-200 mt-1">
                  {billsData.summary.total_outstanding_balance < 0 ? 'Credit' : 'Balance'}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-300">
                  {formatCurrency(billsData.summary.total_paid)}
                </p>
                <p className="text-xs text-indigo-200 mt-1">Paid</p>
              </div>
              
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-slate-200 p-1">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab('current')}
              className={`py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                activeTab === 'current'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Current ({currentClassBills.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Bills ({billsData?.bills.length || 0})
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Filter by Status</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Bills List */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : displayedBills.length > 0 ? (
          <div className="space-y-3">
            {displayedBills.map((bill) => (
              <CompactBillCard key={bill.id} bill={bill} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Modal */}
      <BillDetailsModal />
    </div>
  );
};

export default StudentBillsPortal;