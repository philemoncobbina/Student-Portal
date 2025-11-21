import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  Calendar, 
  DollarSign,
  FileText,
  User,
  X,
  ChevronRight,
  CreditCard,
  Download,
  Filter,
  Clock,
  AlertTriangle,
  Trophy,
  ExternalLink,
  PlusCircle,
  Receipt,
  Tag,
  Percent
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
  const [filterTerm, setFilterTerm] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
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
    
    let filteredBills = bills;
    
    if (filterStatus !== 'all') {
      filteredBills = filteredBills.filter(bill => bill.payment_status === filterStatus);
    }
    
    if (activeTab === 'current' && filterTerm !== 'all') {
      filteredBills = filteredBills.filter(bill => bill.billing_template.term === filterTerm);
    }
    
    if (activeTab === 'all' && filterClass !== 'all') {
      filteredBills = filteredBills.filter(bill => bill.billing_template.class_name === filterClass);
    }
    
    return filteredBills;
  };

  const getAvailableTerms = () => {
    const terms = new Set();
    currentClassBills.forEach(bill => {
      if (bill.billing_template.term) {
        terms.add(bill.billing_template.term);
      }
    });
    return Array.from(terms);
  };

  const getAvailableClasses = () => {
    const classes = new Set();
    billsData?.bills.forEach(bill => {
      if (bill.billing_template.class_name) {
        classes.add(bill.billing_template.class_name);
      }
    });
    return Array.from(classes);
  };

  const getStatusDetails = (status) => {
    const statusMap = {
      'paid': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
      'partial': { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
      'overdue': { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
      'pending': { color: 'bg-slate-50 text-slate-700 border-slate-200', icon: Clock }
    };
    return statusMap[status?.toLowerCase()] || statusMap['pending'];
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

  const BillCard = ({ bill }) => {
    // Use current_bill_balance from backend instead of balance_due
    const balanceDue = parseFloat(bill.current_bill_balance || 0);
    const isOverdue = bill.is_overdue && balanceDue > 0;
    const statusDetails = getStatusDetails(bill.payment_status);
    const StatusIcon = statusDetails.icon;
    const hasDiscount = parseFloat(bill.discount_amount || 0) > 0;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="sm:hidden">
                <div className="flex flex-col space-y-2 mb-4">
                  <h2 className="text-xl font-bold leading-tight">{bill.bill_number}</h2>
                  <div className="flex items-center gap-3 text-indigo-100 text-sm">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {bill.billing_template.class_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {getTermDisplay(bill.billing_template.term)}
                    </span>
                  </div>
                </div>
                <div className="text-center bg-black bg-opacity-10 rounded-lg py-3 px-4">
                  <div className="text-2xl font-bold mb-1">{formatCurrency(bill.total_amount_due)}</div>
                  <div className="text-sm text-indigo-100">Total Amount</div>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{bill.bill_number}</h2>
                  <div className="flex items-center gap-4 text-indigo-100">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {bill.billing_template.class_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {getTermDisplay(bill.billing_template.term)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold mb-1">{formatCurrency(bill.total_amount_due)}</div>
                  <div className="text-sm text-indigo-100">Total Amount</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
              <StatCard 
                icon={StatusIcon} 
                title="Payment Status" 
                value={
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusDetails.color}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {bill.payment_status.charAt(0).toUpperCase() + bill.payment_status.slice(1)}
                  </div>
                }
                subtitle={bill.generated_date && `Generated: ${formatDate(bill.generated_date)}`}
              />
              <StatCard 
                icon={DollarSign} 
                title="Amount Paid" 
                value={formatCurrency(bill.total_paid)}
                subtitle={`Balance: ${formatCurrency(Math.abs(balanceDue))}`}
              />
              <StatCard 
                icon={Calendar} 
                title="Due Date" 
                value={formatDate(bill.due_date)}
                subtitle={isOverdue ? 'Overdue' : 'On time'}
                bgColor={isOverdue ? 'bg-red-50' : 'bg-slate-50'}
              />
              <StatCard 
                icon={FileText} 
                title="Billing Items" 
                value={bill.billing_template.billing_items?.length || 0}
                subtitle={`Student: ${bill.first_name} ${bill.last_name}`}
              />
            </div>

            {hasDiscount && (
              <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Tag className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-green-800">Discount Applied</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          <Percent className="h-3 w-3 mr-1" />
                          Savings
                        </span>
                      </div>
                      {bill.discount_reason && (
                        <p className="text-xs text-green-700 mt-1">
                          <span className="font-medium">Reason:</span> {bill.discount_reason}
                        </p>
                      )}
                      {bill.discount_approved_by && (
                        <p className="text-xs text-green-600 mt-1">
                          <span className="font-medium">Approved by:</span> {bill.discount_approved_by}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xl font-bold text-green-700">
                      -{formatCurrency(bill.discount_amount)}
                    </div>
                    <div className="text-xs text-green-600 mt-1">Discount</div>
                  </div>
                </div>
              </div>
            )}

            {bill.custom_charges && bill.custom_charges.length > 0 && (
              <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">Additional Charges Applied</span>
                  </div>
                  <span className="text-sm font-semibold text-purple-700">
                    {bill.custom_charges.length} charge(s)
                  </span>
                </div>
              </div>
            )}

            {bill.payment_receipts && bill.payment_receipts.length > 0 && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Payment Receipts</span>
                  </div>
                  <span className="text-sm font-semibold text-green-700">
                    {bill.payment_receipts.length} receipt(s)
                  </span>
                </div>
              </div>
            )}

            {balanceDue !== 0 && (
              <div className={`mb-6 p-4 rounded-lg border ${
                balanceDue < 0 
                  ? 'bg-green-50 border-green-200' 
                  : isOverdue 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${
                    balanceDue < 0 ? 'text-green-700' : isOverdue ? 'text-red-700' : 'text-amber-700'
                  }`}>
                    {balanceDue < 0 ? 'Credit Balance' : 'Outstanding Balance'}
                  </span>
                  <span className={`text-lg font-semibold ${
                    balanceDue < 0 ? 'text-green-700' : isOverdue ? 'text-red-700' : 'text-amber-700'
                  }`}>
                    {formatCurrency(Math.abs(balanceDue))}
                  </span>
                </div>
                {isOverdue && (
                  <p className="text-sm text-red-600 mt-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    This bill is overdue
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-6">
              <button 
                onClick={() => setSelectedBill(bill)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors duration-200 text-slate-700 font-medium text-sm"
              >
                <Eye className="h-4 w-4" />
                View Details
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors duration-200 text-slate-700 font-medium text-sm">
                <Download className="h-4 w-4" />
                Download Bill
              </button>
              {balanceDue > 0 && (
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 font-medium text-sm">
                  <CreditCard className="h-4 w-4" />
                  Pay Now
                </button>
              )}
            </div>

            {bill.notes && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </h3>
                <p className="text-sm text-blue-800 italic">
                  "{bill.notes}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const BillDetailsModal = () => {
    if (!selectedBill) return null;

    // Use current_bill_balance from backend
    const balanceDue = parseFloat(selectedBill.current_bill_balance || 0);
    const isCredit = balanceDue < 0;
    const isOverdue = selectedBill.is_overdue && balanceDue > 0;
    const hasDiscount = parseFloat(selectedBill.discount_amount || 0) > 0;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedBill.bill_number}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedBill.billing_template.class_name} • {getTermDisplay(selectedBill.billing_template.term)}
              </p>
            </div>
            <button
              onClick={() => setSelectedBill(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-sm text-blue-600 mb-1">Total Amount</p>
                <p className="text-lg font-semibold text-blue-900">
                  {formatCurrency(selectedBill.total_amount_due)}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <p className="text-sm text-green-600 mb-1">Amount Paid</p>
                <p className="text-lg font-semibold text-green-900">
                  {formatCurrency(selectedBill.total_paid)}
                </p>
              </div>
            </div>

            {balanceDue !== 0 && (
              <div className={`mb-6 p-4 rounded-lg border ${
                isCredit 
                  ? 'bg-green-50 border-green-200' 
                  : isOverdue 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${
                    isCredit ? 'text-green-700' : isOverdue ? 'text-red-700' : 'text-amber-700'
                  }`}>
                    {isCredit ? 'Credit Balance' : 'Outstanding Balance'}
                  </span>
                  <span className={`text-lg font-semibold ${
                    isCredit ? 'text-green-700' : isOverdue ? 'text-red-700' : 'text-amber-700'
                  }`}>
                    {formatCurrency(Math.abs(balanceDue))}
                  </span>
                </div>
              </div>
            )}

            {hasDiscount && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Tag className="w-4 h-4 mr-2 text-green-600" />
                  Discount Information
                  <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                    Active
                  </span>
                </h3>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-medium text-green-900">Discount Amount</p>
                      <p className="text-2xl font-bold text-green-700 mt-1">
                        -{formatCurrency(selectedBill.discount_amount)}
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-green-100 rounded-full">
                      <Percent className="h-4 w-4 text-green-700" />
                    </div>
                  </div>
                  
                  {selectedBill.discount_reason && (
                    <div className="mb-3 p-3 bg-white rounded-md border border-green-100">
                      <p className="text-xs font-medium text-gray-700 mb-1">Reason for Discount</p>
                      <p className="text-sm text-gray-900">{selectedBill.discount_reason}</p>
                    </div>
                  )}
                  
                  {selectedBill.discount_approved_by && (
                    <div className="flex items-center text-xs text-green-700">
                      <User className="h-3 w-3 mr-1" />
                      <span className="font-medium">Approved by:</span>
                      <span className="ml-1">{selectedBill.discount_approved_by}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedBill.billing_template.billing_items && selectedBill.billing_template.billing_items.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Billing Items
                  <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {selectedBill.billing_template.billing_items.length} items
                  </span>
                </h3>
                <div className="space-y-2">
                  {selectedBill.billing_template.billing_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{item.item_name}</h4>
                        <p className="text-xs text-gray-600 mt-1">{item.category}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900 ml-4">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedBill.custom_charges && selectedBill.custom_charges.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <PlusCircle className="w-4 h-4 mr-2 text-purple-600" />
                  Additional Charges
                  <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                    {selectedBill.custom_charges.length} charges
                  </span>
                </h3>
                <div className="space-y-2">
                  {selectedBill.custom_charges.map((charge) => (
                    <div key={charge.id} className="flex justify-between items-start p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{charge.charge_name}</h4>
                        {charge.description && (
                          <p className="text-xs text-gray-600 mt-1">{charge.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Added: {formatDate(charge.created_date)}
                        </p>
                      </div>
                      <span className="font-semibold text-purple-700 ml-4">
                        {formatCurrency(charge.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedBill.payment_receipts && selectedBill.payment_receipts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Receipt className="w-4 h-4 mr-2 text-green-600" />
                  Payment Receipts
                  <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                    {selectedBill.payment_receipts.length} receipts
                  </span>
                </h3>
                <div className="space-y-2">
                  {selectedBill.payment_receipts.map((receipt) => (
                    <div key={receipt.id} className="flex justify-between items-start p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{receipt.receipt_number}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          Method: {receipt.payment_method.charAt(0).toUpperCase() + receipt.payment_method.slice(1)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Date: {formatDate(receipt.payment_date)}
                        </p>
                        {receipt.notes && (
                          <p className="text-xs text-gray-500 mt-1 italic">"{receipt.notes}"</p>
                        )}
                      </div>
                      <span className="font-semibold text-green-700 ml-4">
                        {formatCurrency(receipt.amount_paid)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Bill Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Previous Arrears:</span>
                  <span className="font-medium">{formatCurrency(selectedBill.previous_arrears)}</span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-green-600">-{formatCurrency(selectedBill.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Total Amount Due:</span>
                  <span className="font-bold text-lg text-blue-600">{formatCurrency(selectedBill.total_amount_due)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Paid:</span>
                  <span className="font-medium text-green-600">{formatCurrency(selectedBill.total_paid)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Balance Due:</span>
                  <span className={`font-bold text-lg ${
                    balanceDue < 0 ? 'text-green-600' : balanceDue > 0 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatCurrency(Math.abs(balanceDue))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50">
            <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 mr-2">
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
            {balanceDue > 0 && (
              <button className="flex items-center px-4 py-2 bg-blue-600 border border-blue-700 rounded-lg text-white hover:bg-blue-700">
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Now
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-indigo-400 rounded animate-pulse" />
              <div className="h-4 w-32 bg-indigo-400 rounded animate-pulse" />
            </div>
            <div className="h-10 w-16 bg-indigo-400 rounded animate-pulse" />
          </div>
        </div>
        <div className="p-4 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 bg-gray-300 rounded-lg animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-gray-300 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-gray-300 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-3 w-20 bg-gray-300 rounded animate-pulse" />
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
    const title = isCurrentTab ? 'No Bills Found' : 'No Historical Bills';
    const message = isCurrentTab 
      ? 'No bills available for your current class.'
      : 'You have no bills at this time.';

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
    const data = getBillsToDisplay();
    const isLoading = loading[type];

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {isCurrentTab ? 'Current Class Bills' : 'All Bills'}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {isCurrentTab 
                ? `View bills for your current class`
                : 'View all your billing history'
              }
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600 whitespace-nowrap">Status:</span>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {isCurrentTab && getAvailableTerms().length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600 whitespace-nowrap">Term:</span>
                <select 
                  value={filterTerm}
                  onChange={(e) => setFilterTerm(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="all">All Terms</option>
                  {getAvailableTerms().map(term => (
                    <option key={term} value={term}>
                      {getTermDisplay(term)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!isCurrentTab && getAvailableClasses().length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600 whitespace-nowrap">Class:</span>
                <select 
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="all">All Classes</option>
                  {getAvailableClasses().map(className => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : data?.length > 0 ? (
          <div className="space-y-8">
            {data.map((bill, index) => (
              <BillCard key={bill.id || index} bill={bill} />
            ))}
          </div>
        ) : (
          <EmptyState type={type} />
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Bills</h3>
            <p className="text-slate-600 max-w-sm mx-auto mb-4">{error}</p>
            <button
              onClick={loadBillsData}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Bills & Payments</h1>
              <p className="text-slate-600 mt-2">Track your billing history and payment status</p>
            </div>
          </div>
        </div>

        {billsData && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-gray-200 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <p className="font-medium text-gray-900 text-lg">{billsData.student}</p>
                <p className="text-sm text-gray-600">{billsData.current_class}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className={`text-2xl font-bold ${
                  billsData.summary.total_outstanding_balance < 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(Math.abs(billsData.summary.total_outstanding_balance))}
                </p>
                <p className="text-sm text-gray-600">
                  {billsData.summary.total_outstanding_balance < 0 ? 'Credit Balance' : 'Outstanding'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(billsData.summary.total_paid)}
                </p>
                <p className="text-sm text-gray-600">Total Paid</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {billsData.summary.total_bills}
                </p>
                <p className="text-sm text-gray-600">Total Bills</p>
              </div>
            </div>
          </div>
        )}

        <div className="w-full mb-4 sm:mb-6">
          <div className="grid grid-cols-2 bg-gray-100 p-1 rounded-lg h-auto">
            {[
              { id: 'current', label: 'Current Bills', count: currentClassBills.length },
              { id: 'all', label: 'All Bills', count: billsData?.bills.length || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-1 sm:gap-2 rounded-md py-2 px-1 sm:px-2 text-xs sm:text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="break-words text-center leading-tight">{tab.label}</span>
                <span className="ml-1 bg-gray-200 text-gray-700 py-1 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'current' ? (
          <TabContent type="current" />
        ) : (
          <TabContent type="all" />
        )}

        <BillDetailsModal />
      </div>
    </div>
  );
};

export default StudentBillsPortal;