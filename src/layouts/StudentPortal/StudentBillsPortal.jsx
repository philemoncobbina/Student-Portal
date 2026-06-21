import React, { useState, useEffect, useRef } from 'react';
import {
  Eye, CheckCircle, Calendar, CreditCard, FileText, X, Clock,
  AlertTriangle, Receipt, Tag, ChevronDown, ChevronUp, PlusCircle,
  ExternalLink, Share2, Copy, Check, Mail, MessageCircle, Send,
  Upload, Loader2, ArrowLeft, Info, BanknoteIcon, Smartphone,
  Building2, Hash, ChevronRight, RefreshCw, CircleDot, BadgeCheck,
  Sparkles,
} from 'lucide-react';

import {
  StudentBillsService,
  PaymentReceiptRequestService,
  formatCurrency,
  formatDate,
  getTermDisplay,
  getReceiptRequestStatusLabel,
  getReceiptRequestStatusClasses,
} from '../../Services/studentBillsService';

import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuPortal, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PAYMENT_METHODS = [
  { value: 'cash',          label: 'Cash',          icon: BanknoteIcon,  color: 'text-green-600' },
  { value: 'bank_transfer', label: 'Bank Transfer',  icon: Building2,     color: 'text-blue-600'  },
  { value: 'mobile_money',  label: 'Mobile Money',   icon: Smartphone,    color: 'text-purple-600'},
  { value: 'cheque',        label: 'Cheque',         icon: FileText,      color: 'text-orange-600'},
  { value: 'other',         label: 'Other',          icon: Hash,          color: 'text-slate-600' },
];

const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE_MB = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const statusIcon = (status) => {
  const map = {
    pending:      { Icon: Clock,         cls: 'text-slate-500'  },
    under_review: { Icon: RefreshCw,     cls: 'text-amber-500'  },
    accepted:     { Icon: CheckCircle,   cls: 'text-emerald-500'},
    rejected:     { Icon: X,             cls: 'text-red-500'    },
  };
  return map[status] ?? map.pending;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Small status badge for a receipt request */
const RequestStatusBadge = ({ status }) => {
  const { Icon, cls } = statusIcon(status);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getReceiptRequestStatusClasses(status)}`}>
      <Icon className={`w-3 h-3 ${cls}`} />
      {getReceiptRequestStatusLabel(status)}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Receipt Request Form
// ---------------------------------------------------------------------------
const ReceiptRequestForm = ({ bill, onSuccess, onCancel }) => {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    amount: '',
    payment_method: 'bank_transfer',
    payment_reference: '',
    phone_number: '', // Added phone number field
  });
  const [proofFile, setProofFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const balance = parseFloat(bill.current_bill_balance || bill.balance_due || 0);

  // Derive what the entered amount means relative to balance
  const enteredAmount = parseFloat(form.amount) || 0;
  const willBeCredit = enteredAmount > balance && balance > 0;
  const overpaymentAmount = willBeCredit ? enteredAmount - balance : 0;
  const isFullyPaidAlready = balance <= 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setFieldErrors(prev => ({ ...prev, proof: 'Only JPG, PNG, WebP or PDF files are accepted.' }));
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFieldErrors(prev => ({ ...prev, proof: `File must be smaller than ${MAX_FILE_SIZE_MB} MB.` }));
      return;
    }

    setProofFile(file);
    setFieldErrors(prev => ({ ...prev, proof: null }));

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview('pdf');
    }
  };

  const validate = () => {
    const errs = {};
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount greater than 0.';
    if (!form.payment_reference.trim()) errs.payment_reference = 'Payment reference is required.';
    if (!proofFile) errs.proof = 'Please upload proof of payment.';
    
    // Phone number validation (optional? making it required for better tracking)
    // Adjust regex as needed for your country's format (Ghana example)
    const phoneRegex = /^[0-9]{10,15}$/; // Basic: 10-15 digits
    if (!form.phone_number.trim()) {
      errs.phone_number = 'Phone number is required for payment verification.';
    } else if (!phoneRegex.test(form.phone_number.replace(/[\s\-\(\)\+]/g, ''))) {
      errs.phone_number = 'Enter a valid phone number (10-15 digits).';
    }
    
    return errs;
  };

  const handleSubmit = async () => {
    setError(null);
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setSubmitting(true);
    try {
      const result = await PaymentReceiptRequestService.submitRequest({
        student_bill: bill.id,
        amount: parseFloat(form.amount),
        payment_method: form.payment_method,
        payment_reference: form.payment_reference.trim(),
        phone_number: form.phone_number.trim(), // Added phone number to payload
        proof_of_payment: proofFile,
      });
      onSuccess(result);
    } catch (err) {
      const data = err?.response?.data;
      if (data && typeof data === 'object' && !data.message) {
        const mapped = {};
        Object.entries(data).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : String(v); });
        setFieldErrors(mapped);
      } else {
        setError(data?.message || 'Failed to submit request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
        <button
          onClick={onCancel}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div>
          <h2 className="text-base font-bold text-slate-900">Submit Receipt Request</h2>
          <p className="text-xs text-slate-500">Bill {bill.bill_number}</p>
        </div>
      </div>

      {/* Bill summary strip */}
      <div className="mx-4 mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-500 font-medium">
              {isFullyPaidAlready ? 'Account Status' : 'Balance Due'}
            </p>
            {isFullyPaidAlready ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
                <p className="text-lg font-bold text-emerald-700">Fully Paid</p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-indigo-900 mt-0.5">{formatCurrency(balance)}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-indigo-500">Term</p>
            <p className="text-sm font-semibold text-indigo-800 mt-0.5">
              {getTermDisplay(bill.billing_template.term)}
            </p>
            <p className="text-xs text-indigo-600">{bill.billing_template.academic_year}</p>
          </div>
        </div>

        {/* Overpayment / credit preview */}
        {willBeCredit && (
          <div className="mt-3 flex items-center gap-2 bg-white border border-indigo-200 rounded-lg px-3 py-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <p className="text-xs text-indigo-700">
              <span className="font-semibold">{formatCurrency(overpaymentAmount)}</span> will be added as a credit on your account.
            </p>
          </div>
        )}

        {isFullyPaidAlready && enteredAmount > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-white border border-indigo-200 rounded-lg px-3 py-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <p className="text-xs text-indigo-700">
              The full <span className="font-semibold">{formatCurrency(enteredAmount)}</span> will be added as a credit on your account.
            </p>
          </div>
        )}
      </div>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Global error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* How this works — contextual explainer */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
          <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            You're submitting evidence of a payment you've already made. The finance team will verify it and generate a receipt. <span className="font-semibold">No money is collected here.</span>
          </p>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Amount You Paid <span className="text-red-500">*</span>
          </label>
          {!isFullyPaidAlready && (
            <p className="text-xs text-slate-500 mb-2">
              You can enter more than the balance due — any surplus becomes a credit on your account.
            </p>
          )}
          {isFullyPaidAlready && (
            <p className="text-xs text-slate-500 mb-2">
              This bill is already fully paid. Any amount you enter will be recorded as a credit on your account.
            </p>
          )}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">GHS</span>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              className={`w-full pl-14 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                fieldErrors.amount ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
              }`}
            />
          </div>
          {fieldErrors.amount && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <Info className="w-3 h-3" /> {fieldErrors.amount}
            </p>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Payment Method <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PAYMENT_METHODS.map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                onClick={() => setForm(prev => ({ ...prev, payment_method: value }))}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                  form.payment_method === value
                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-400'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${form.payment_method === value ? 'text-indigo-600' : color}`} />
                <span className={`text-xs font-medium ${form.payment_method === value ? 'text-indigo-800' : 'text-slate-700'}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Reference */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Payment Reference <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="payment_reference"
            value={form.payment_reference}
            onChange={handleChange}
            placeholder={
              form.payment_method === 'mobile_money' ? 'e.g. Transaction ID 1234567890' :
              form.payment_method === 'bank_transfer' ? 'e.g. Bank reference or transfer ID' :
              form.payment_method === 'cheque' ? 'e.g. Cheque number 00123' :
              'Transaction ID, reference number, etc.'
            }
            className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
              fieldErrors.payment_reference ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
            }`}
          />
          {fieldErrors.payment_reference && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <Info className="w-3 h-3" /> {fieldErrors.payment_reference}
            </p>
          )}
        </div>

        {/* Phone Number - New Field */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Smartphone className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="tel"
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              placeholder="e.g. 024XXXXXXX or 055XXXXXXX"
              className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                fieldErrors.phone_number ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
              }`}
            />
          </div>
          {fieldErrors.phone_number && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <Info className="w-3 h-3" /> {fieldErrors.phone_number}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            We'll use this number to contact you if we need clarification about your payment.
          </p>
        </div>

        {/* Proof of Payment */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Proof of Payment <span className="text-red-500">*</span>
          </label>

          {!proofFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 transition-colors ${
                fieldErrors.proof
                  ? 'border-red-400 bg-red-50'
                  : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50'
              }`}
            >
              <Upload className={`w-8 h-8 ${fieldErrors.proof ? 'text-red-400' : 'text-slate-400'}`} />
              <p className="text-sm font-medium text-slate-700">Tap to upload</p>
              <p className="text-xs text-slate-500">JPG, PNG, WebP or PDF · Max {MAX_FILE_SIZE_MB} MB</p>
            </button>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {filePreview === 'pdf' ? (
                <div className="flex items-center gap-3 p-4 bg-slate-50">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{proofFile.name}</p>
                    <p className="text-xs text-slate-500">{(proofFile.size / 1024).toFixed(1)} KB · PDF</p>
                  </div>
                </div>
              ) : (
                <img
                  src={filePreview}
                  alt="Proof of payment"
                  className="w-full max-h-48 object-cover"
                />
              )}
              <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-600 truncate flex-1 mr-2">{proofFile.name}</p>
                <button
                  onClick={() => { setProofFile(null); setFilePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium shrink-0"
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES.join(',')}
            onChange={handleFileChange}
            className="hidden"
          />
          {fieldErrors.proof && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <Info className="w-3 h-3" /> {fieldErrors.proof}
            </p>
          )}
        </div>

        {/* What happens next */}
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Once the finance team verifies your proof of payment, a receipt will be generated and your account balance updated automatically.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl text-white font-semibold text-sm transition-colors"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
          ) : (
            <><Receipt className="w-4 h-4" /> Submit Receipt Request</>
          )}
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Receipt Requests List (student view of their requests)
// ---------------------------------------------------------------------------
const ReceiptRequestsList = ({ onClose }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await PaymentReceiptRequestService.listRequests();
        setRequests(data);
      } catch {
        setError('Failed to load your requests.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = filterStatus === 'all'
    ? requests
    : requests.filter(r => r.status === filterStatus);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-base font-bold text-slate-900">My Receipt Requests</h2>
          <p className="text-xs text-slate-500">{requests.length} total request{requests.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="px-4 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto">
        {['all', 'pending', 'under_review', 'accepted', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filterStatus === s
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s === 'all' ? 'All' : getReceiptRequestStatusLabel(s)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No requests found</p>
            <p className="text-xs text-slate-500 mt-1">Submit a receipt request from one of your bills</p>
          </div>
        ) : (
          filtered.map(req => (
            <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {formatCurrency(req.amount)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">{req.payment_method.replace('_', ' ')}</p>
                </div>
                <RequestStatusBadge status={req.status} />
              </div>

              <div className="space-y-1.5 mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Reference</span>
                  <span className="font-medium text-slate-800 truncate ml-4 max-w-[60%] text-right">
                    {req.payment_reference}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Submitted</span>
                  <span className="text-slate-700">{formatDate(req.submitted_at)}</span>
                </div>
                {/* Display phone number in the list if available */}
                {req.phone_number && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Contact</span>
                    <span className="font-medium text-slate-800 truncate ml-4 max-w-[60%] text-right">
                      {req.phone_number}
                    </span>
                  </div>
                )}
                {req.review_comment && (
                  <div className={`mt-2 p-2.5 rounded-lg text-xs ${
                    req.status === 'rejected'
                      ? 'bg-red-50 text-red-700 border border-red-100'
                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    <span className="font-semibold">Note: </span>{req.review_comment}
                  </div>
                )}
                {req.status === 'accepted' && req.generated_receipt && (
                  <div className="mt-2 p-2.5 rounded-lg text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    Receipt #{req.generated_receipt.receipt_number} generated
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const StudentBillsPortal = ({ className = '' }) => {
  const [billsData, setBillsData] = useState(null);
  const [currentClassBills, setCurrentClassBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [selectedBill, setSelectedBill] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedBill, setExpandedBill] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);

  // Receipt request flow
  const [requestFormBill, setRequestFormBill] = useState(null);
  const [showRequestsList, setShowRequestsList] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  useEffect(() => { loadBillsData(); }, []);

  const loadBillsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allBills, currentBills] = await Promise.all([
        StudentBillsService.getAllBills(),
        StudentBillsService.getCurrentClassBills(),
      ]);
      setBillsData(allBills);
      setCurrentClassBills(currentBills);
    } catch (err) {
      setError('Failed to load bills. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- PDF helpers ---
  const handleOpenPDF = (bill, e) => {
    e?.stopPropagation();
    if (bill.pdf_url) {
      window.open(bill.pdf_url, '_blank', 'noopener,noreferrer');
    } else {
      alert('PDF is being generated. Please try again in a moment.');
    }
  };

  const getShareUrl = (platform, bill) => {
    if (!bill.pdf_url) return null;
    const title = `Bill: ${bill.bill_number}`;
    const text = `${title} - ${bill.billing_template.class_name}`;
    const url = bill.pdf_url;
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    };
    return shareUrls[platform] || url;
  };

  const handleShare = (bill, platform = 'default') => {
    if (!bill.pdf_url) { alert('PDF is not available for sharing yet.'); return; }
    const url = getShareUrl(platform, bill);
    if (!url) return;
    if (platform === 'default') {
      if (navigator.share) {
        navigator.share({ title: `Bill: ${bill.bill_number}`, text: `${bill.bill_number} - ${bill.billing_template.class_name}`, url: bill.pdf_url }).catch(console.error);
      } else {
        navigator.clipboard.writeText(bill.pdf_url).then(() => { setCopiedLink(bill.id); setTimeout(() => setCopiedLink(null), 2000); }).catch(() => alert('Failed to copy to clipboard.'));
      }
    } else if (platform === 'email') {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
    }
  };

  const getDisplayedBills = () => {
    const bills = activeTab === 'current' ? currentClassBills : billsData?.bills || [];
    return filterStatus === 'all' ? bills : bills.filter(b => b.payment_status === filterStatus);
  };

  const getStatusConfig = (status) => {
    const configs = {
      paid:    { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle  },
      partial: { bg: 'bg-amber-100',   text: 'text-amber-700',   icon: Clock        },
      overdue: { bg: 'bg-red-100',     text: 'text-red-700',     icon: AlertTriangle},
      pending: { bg: 'bg-slate-100',   text: 'text-slate-700',   icon: Clock        },
    };
    return configs[status?.toLowerCase()] || configs.pending;
  };

  // --- Receipt request handlers ---
  const handleOpenRequestForm = (bill, e) => {
    e?.stopPropagation();
    setSelectedBill(null);
    setRequestFormBill(bill);
  };

  const handleRequestSuccess = (result) => {
    setRequestFormBill(null);
    setSuccessToast(result.message || 'Receipt request submitted. The finance team will verify it shortly.');
    setTimeout(() => setSuccessToast(null), 6000);
  };

  // --- PDF dropdown ---
  const PDFDropdownMenu = ({ bill }) => {
    const isCopied = copiedLink === bill.id;
    const shareOptions = [
      { platform: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600' },
      { platform: 'telegram', label: 'Telegram', icon: Send,          color: 'text-blue-500'  },
      { platform: 'email',    label: 'Email',    icon: Mail,          color: 'text-red-500'   },
    ];

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!bill.pdf_url}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium ${
              bill.pdf_url
                ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <FileText className="h-3.5 w-3.5" /> PDF <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-white" align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenPDF(bill); }} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50">
              <ExternalLink className="h-4 w-4" /><span>Open PDF</span>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer hover:bg-slate-50">
                <Share2 className="h-4 w-4" /><span>Share via</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="bg-white w-48">
                  {shareOptions.map(({ platform, label, icon: Icon, color }) => (
                    <DropdownMenuItem key={platform} onClick={(e) => { e.stopPropagation(); handleShare(bill, platform); }} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50">
                      <Icon className={`h-4 w-4 ${color}`} /><span>{label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleShare(bill, 'default'); }} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50">
              {isCopied
                ? <><Check className="h-4 w-4 text-green-600" /><span className="text-green-600 font-medium">Copied!</span></>
                : <><Copy className="h-4 w-4" /><span>Copy Link</span></>
              }
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // --- Bill card ---
  const CompactBillCard = ({ bill }) => {
    const balance = parseFloat(bill.current_bill_balance || 0);
    const statusConfig = getStatusConfig(bill.payment_status);
    const StatusIcon = statusConfig.icon;
    const isExpanded = expandedBill === bill.id;

    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div onClick={() => setExpandedBill(isExpanded ? null : bill.id)} className="p-4 cursor-pointer active:bg-slate-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-sm truncate">{bill.bill_number}</h3>
              <p className="text-xs text-slate-600 mt-0.5">{bill.billing_template.class_name} · {getTermDisplay(bill.billing_template.term)}</p>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${statusConfig.bg} ${statusConfig.text}`}>
              <StatusIcon className="w-3 h-3" />{bill.payment_status}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs text-slate-500">Total Amount</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{formatCurrency(bill.total_amount_due)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{balance < 0 ? 'Credit' : 'Balance'}</p>
              <p className={`text-base font-bold mt-0.5 ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-slate-900'}`}>
                {formatCurrency(Math.abs(balance))}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Calendar className="w-3.5 h-3.5" />Due: {formatDate(bill.due_date)}
            </div>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50 space-y-3">
            <div className="pt-3">
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <p className="text-xs text-slate-500">Paid</p>
                <p className="text-sm font-semibold text-green-600 mt-1">{formatCurrency(bill.total_paid)}</p>
              </div>
            </div>

            {parseFloat(bill.discount_amount || 0) > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700">Discount Applied</span>
                  </div>
                  <span className="text-sm font-bold text-green-700">-{formatCurrency(bill.discount_amount)}</span>
                </div>
              </div>
            )}

            {bill.is_overdue && balance > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-red-700">Payment Overdue</p>
                  <p className="text-xs text-red-600 mt-0.5">Please settle this bill as soon as possible</p>
                </div>
              </div>
            )}

            {/* Action buttons — Request Receipt is always visible */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedBill(bill); }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 active:bg-slate-50"
              >
                <Eye className="h-3.5 w-3.5" /> Details
              </button>

              <PDFDropdownMenu bill={bill} />

              <button
                onClick={(e) => handleOpenRequestForm(bill, e)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 rounded-lg text-xs font-medium text-white active:bg-indigo-700"
              >
                <Receipt className="h-3.5 w-3.5" /> Request
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- Bill detail modal ---
  const BillDetailsModal = () => {
    if (!selectedBill) return null;
    const balance = parseFloat(selectedBill.current_bill_balance || 0);
    const hasDiscount = parseFloat(selectedBill.discount_amount || 0) > 0;
    const isCopied = copiedLink === selectedBill.id;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
        <div className="bg-white w-full sm:max-w-2xl sm:rounded-xl max-h-[90vh] overflow-hidden flex flex-col rounded-t-2xl">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
            <div className="flex-1 min-w-0 mr-4">
              <h2 className="text-lg font-bold text-slate-900 truncate">{selectedBill.bill_number}</h2>
              <p className="text-sm text-slate-600 truncate">{selectedBill.billing_template.class_name}</p>
            </div>
            <button onClick={() => setSelectedBill(null)} className="p-2 hover:bg-slate-100 rounded-full">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-xs text-blue-600 mb-1">Total Amount</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(selectedBill.total_amount_due)}</p>
              </div>
              <div className={`rounded-lg p-4 border ${balance > 0 ? 'bg-red-50 border-red-100' : balance < 0 ? 'bg-green-50 border-green-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <p className={`text-xs mb-1 ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-emerald-600'}`}>
                  {balance < 0 ? 'Credit' : balance === 0 ? 'Fully Paid' : 'Balance Due'}
                </p>
                <p className={`text-xl font-bold ${balance > 0 ? 'text-red-900' : balance < 0 ? 'text-green-900' : 'text-emerald-700'}`}>
                  {balance === 0 ? (
                    <span className="flex items-center gap-1.5"><BadgeCheck className="w-5 h-5" /> Cleared</span>
                  ) : formatCurrency(Math.abs(balance))}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600">Payment Progress</span>
                <span className="text-xs font-bold text-slate-900">{formatCurrency(selectedBill.total_paid)} / {formatCurrency(selectedBill.total_amount_due)}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${Math.min((selectedBill.total_paid / selectedBill.total_amount_due) * 100, 100)}%` }} />
              </div>
            </div>

            {hasDiscount && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-green-600" /><span className="text-sm font-semibold text-green-800">Discount</span></div>
                  <span className="text-lg font-bold text-green-700">-{formatCurrency(selectedBill.discount_amount)}</span>
                </div>
                {selectedBill.discount_reason && <p className="text-xs text-green-700 mt-2">{selectedBill.discount_reason}</p>}
              </div>
            )}

            {selectedBill.billing_template.billing_items?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" />Charges ({selectedBill.billing_template.billing_items.length})</h3>
                <div className="space-y-2">
                  {selectedBill.billing_template.billing_items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.item_name}</p>
                        <p className="text-xs text-slate-600">{item.category}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedBill.custom_charges?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-purple-600" />Additional ({selectedBill.custom_charges.length})</h3>
                <div className="space-y-2">
                  {selectedBill.custom_charges.map(charge => (
                    <div key={charge.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium text-slate-900 truncate">{charge.charge_name}</p>
                        <p className="text-xs text-slate-600">{formatDate(charge.created_date)}</p>
                      </div>
                      <span className="text-sm font-bold text-purple-700">{formatCurrency(charge.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedBill.payment_receipts?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2"><Receipt className="w-4 h-4 text-green-600" />Payments ({selectedBill.payment_receipts.length})</h3>
                <div className="space-y-2">
                  {selectedBill.payment_receipts.map(receipt => (
                    <div key={receipt.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium text-slate-900 truncate">{receipt.receipt_number}</p>
                        <p className="text-xs text-slate-600 capitalize">{receipt.payment_method} · {formatDate(receipt.payment_date)}</p>
                      </div>
                      <span className="text-sm font-bold text-green-700">{formatCurrency(receipt.amount_paid)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedBill.pdf_url && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2"><ExternalLink className="w-4 h-4" />Bill Link</h3>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <a href={selectedBill.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 break-all hover:underline block">
                      {selectedBill.pdf_url}
                    </a>
                  </div>
                  <button
                    onClick={() => handleShare(selectedBill, 'default')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium ${isCopied ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'}`}
                  >
                    {isCopied ? <><Check className="h-4 w-4" />Copied</> : <><Copy className="h-4 w-4" />Copy</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal footer — Request Receipt always available */}
          <div className="p-4 border-t border-slate-200 bg-white space-y-2">
            <button
              onClick={() => { setSelectedBill(null); setRequestFormBill(selectedBill); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 rounded-lg text-white font-medium hover:bg-indigo-700"
            >
              <Receipt className="w-4 h-4" /> Submit Receipt Request
            </button>
            <PDFDropdownMenu bill={selectedBill} />
          </div>
        </div>
      </div>
    );
  };

  // --- Slide-over panel wrapper ---
  const SlideOverPanel = ({ open, children }) => (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${open ? 'bg-opacity-50' : 'bg-opacity-0'}`}
        onClick={() => { setRequestFormBill(null); setShowRequestsList(false); }}
      />
      <div className={`absolute inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[440px] bg-white sm:shadow-2xl flex flex-col rounded-t-2xl sm:rounded-none max-h-[92vh] sm:max-h-full transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'}`}>
        {children}
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12 bg-white rounded-lg border border-red-200">
            <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Error Loading Bills</h3>
            <p className="text-xs text-slate-600 mb-4">{error}</p>
            <button onClick={loadBillsData} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  const displayedBills = getDisplayedBills();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-9xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Bills</h1>
            <p className="text-sm text-slate-600 mt-1">View and manage your payments</p>
          </div>
          <button
            onClick={() => setShowRequestsList(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <Receipt className="w-3.5 h-3.5 text-indigo-600" />
            My Requests
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Summary card */}
        {billsData && (
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-5 text-white shadow-lg">
            <p className="text-sm text-indigo-100 mb-1">{billsData.student}</p>
            <p className="text-xs text-indigo-200 mb-4">{billsData.current_class}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className={`text-2xl font-bold ${billsData.summary.total_outstanding_balance < 0 ? 'text-green-300' : 'text-white'}`}>
                  {formatCurrency(Math.abs(billsData.summary.total_outstanding_balance))}
                </p>
                <p className="text-xs text-indigo-200 mt-1">
                  {billsData.summary.total_outstanding_balance < 0 ? 'Credit Balance' : 'Balance Due'}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-300">{formatCurrency(billsData.summary.total_paid)}</p>
                <p className="text-xs text-indigo-200 mt-1">Total Paid</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-slate-200 p-1">
          <div className="grid grid-cols-2 gap-1">
            {['current', 'all'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {tab === 'current' ? `Current (${currentClassBills.length})` : `All Bills (${billsData?.bills.length || 0})`}
              </button>
            ))}
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
              {['all', 'paid', 'pending', 'partial', 'overdue'].map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bill list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-4" />
                <div className="grid grid-cols-2 gap-3"><div className="h-12 bg-slate-200 rounded" /><div className="h-12 bg-slate-200 rounded" /></div>
              </div>
            ))}
          </div>
        ) : displayedBills.length > 0 ? (
          <div className="space-y-3">
            {displayedBills.map(bill => <CompactBillCard key={bill.id} bill={bill} />)}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No Bills Found</h3>
            <p className="text-xs text-slate-600">No bills match your current filters</p>
          </div>
        )}
      </div>

      {/* Bill detail modal */}
      <BillDetailsModal />

      {/* Receipt Request Form slide-over */}
      <SlideOverPanel open={!!requestFormBill}>
        {requestFormBill && (
          <ReceiptRequestForm
            bill={requestFormBill}
            onSuccess={handleRequestSuccess}
            onCancel={() => setRequestFormBill(null)}
          />
        )}
      </SlideOverPanel>

      {/* My Receipt Requests slide-over */}
      <SlideOverPanel open={showRequestsList}>
        <ReceiptRequestsList onClose={() => setShowRequestsList(false)} />
      </SlideOverPanel>

      {/* Success toast */}
      {successToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium max-w-[90vw] text-center animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="ml-1 p-0.5 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentBillsPortal;