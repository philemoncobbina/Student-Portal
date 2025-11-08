// Services/studentBillsService.ts
import axios, { AxiosResponse } from 'axios';

// Base API configuration
const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authentication header helper
const getAuthHeaders = () => {
  const accessToken = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${accessToken}` };
};

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// TypeScript interfaces based on your actual API response
export interface BillingItem {
  id: number;
  billing_template: number;
  item_name: string;
  category: string;
  amount: string;
  description: string;
  created_date: string;
  created_by: string;
  logs: any[];
}

export interface BillingTemplate {
  id: number;
  academic_year: string;
  class_name: string;
  term: string;
  created_date: string;
  created_by: string;
  due_date: string;
  billing_items: BillingItem[];
}

export interface CustomCharge {
  id: number;
  charge_name: string;
  description: string;
  amount: string;
  created_date: string;
}

export interface PaymentReceipt {
  id: number;
  // Add receipt fields as needed based on your API
  [key: string]: any;
}

export interface StudentBillLog {
  id: number;
  field_name: string;
  old_value?: string;
  new_value?: string;
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  timestamp: string;
}

export interface StudentBill {
  id: number;
  student: string;
  billing_template: BillingTemplate;
  bill_number: string;
  first_name: string;
  last_name: string;
  previous_arrears: string;
  discount_amount: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue';
  generated_date: string;
  scheduled_date: string | null;
  due_date: string;
  created_date: string;
  created_by: string;
  total_amount_due: string;
  total_paid: string;
  notes: string;
  balance_due: number;
  is_overdue: boolean;
  custom_charges: CustomCharge[];
  payment_receipts: PaymentReceipt[];
  logs: StudentBillLog[];
  current_bill_balance: number;
  total_outstanding: number;
}

export interface StudentBillsResponse {
  student: string;
  current_class: string;
  summary: {
    total_bills: number;
    total_outstanding_balance: number;
    total_paid: number;
    paid_bills: number;
    overdue_bills: number;
  };
  bills: StudentBill[];
}

// API Service Class
export class StudentBillsService {
  /**
   * Get all bills for the authenticated student with summary
   */
  static async getAllBills(): Promise<StudentBillsResponse> {
    const response: AxiosResponse<StudentBillsResponse> = await api.get('/my-bills/', {
      headers: getAuthHeaders()
    });
    return response.data;
  }

  /**
   * Get bills for student's current class only
   */
  static async getCurrentClassBills(): Promise<StudentBill[]> {
    const response: AxiosResponse<StudentBill[]> = await api.get('/my-bills/current-class/', {
      headers: getAuthHeaders()
    });
    return response.data;
  }

  /**
   * Get bills from student's previous classes
   */
  static async getPreviousClassBills(): Promise<StudentBill[]> {
    const response: AxiosResponse<StudentBill[]> = await api.get('/billing/my-bills/previous-classes/', {
      headers: getAuthHeaders()
    });
    return response.data;
  }

  /**
   * Get logs for a specific bill
   */
  static async getBillLogs(billId: number): Promise<StudentBillLog[]> {
    const response: AxiosResponse<StudentBillLog[]> = await api.get(`/billing/bills/${billId}/logs/`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }

  /**
   * Get a specific bill details
   */
  static async getBillDetails(billId: number): Promise<StudentBill> {
    const response: AxiosResponse<StudentBill> = await api.get(`/billing/bills/${billId}/`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }

  /**
   * Download bill as PDF
   */
  static async downloadBillPDF(billId: number): Promise<Blob> {
    const response: AxiosResponse<Blob> = await api.get(`/billing/bills/${billId}/download/`, {
      headers: getAuthHeaders(),
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Make a payment for a bill
   */
  static async makePayment(billId: number, amount: number, paymentMethod: string): Promise<any> {
    const response: AxiosResponse<any> = await api.post(`/billing/bills/${billId}/payment/`, {
      amount,
      payment_method: paymentMethod
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  }

  /**
   * Get custom charges for a specific bill
   */
  static async getCustomCharges(billId: number): Promise<CustomCharge[]> {
    const response: AxiosResponse<CustomCharge[]> = await api.get(`/billing/bills/${billId}/custom-charges/`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }

  /**
   * Add a custom charge to a bill
   */
  static async addCustomCharge(billId: number, chargeData: Omit<CustomCharge, 'id' | 'created_date'>): Promise<CustomCharge> {
    const response: AxiosResponse<CustomCharge> = await api.post(`/billing/bills/${billId}/custom-charges/`, chargeData, {
      headers: getAuthHeaders()
    });
    return response.data;
  }

  /**
   * Update a custom charge
   */
  static async updateCustomCharge(billId: number, chargeId: number, chargeData: Partial<CustomCharge>): Promise<CustomCharge> {
    const response: AxiosResponse<CustomCharge> = await api.patch(`/billing/bills/${billId}/custom-charges/${chargeId}/`, chargeData, {
      headers: getAuthHeaders()
    });
    return response.data;
  }

  /**
   * Delete a custom charge
   */
  static async deleteCustomCharge(billId: number, chargeId: number): Promise<void> {
    await api.delete(`/billing/bills/${billId}/custom-charges/${chargeId}/`, {
      headers: getAuthHeaders()
    });
  }
}

// Utility functions
export const formatCurrency = (amount: string | number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(numAmount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatShortDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getPaymentStatusColor = (status: string): string => {
  switch (status) {
    case 'paid':
      return 'text-emerald-700 bg-emerald-100 border-emerald-200';
    case 'partial':
      return 'text-amber-700 bg-amber-100 border-amber-200';
    case 'overdue':
      return 'text-red-700 bg-red-100 border-red-200';
    default:
      return 'text-slate-700 bg-slate-100 border-slate-200';
  }
};

export const getTermDisplay = (term: string): string => {
  const termMap: { [key: string]: string } = {
    'first': 'First Term',
    'second': 'Second Term',
    'third': 'Third Term',
  };
  return termMap[term] || term;
};

export const getCategoryColor = (category: string): string => {
  const categoryColors: { [key: string]: string } = {
    'TUITION': 'bg-blue-100 text-blue-800 border-blue-200',
    'TUTION': 'bg-blue-100 text-blue-800 border-blue-200',
    'ELECTRIC BILL': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'FACILITIES': 'bg-purple-100 text-purple-800 border-purple-200',
    'ACTIVITIES': 'bg-green-100 text-green-800 border-green-200',
    'LIBRARY': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'TRANSPORT': 'bg-orange-100 text-orange-800 border-orange-200',
    'MEALS': 'bg-pink-100 text-pink-800 border-pink-200',
    'UNIFORM': 'bg-gray-100 text-gray-800 border-gray-200',
    'BOOKS': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  };
  
  return categoryColors[category.toUpperCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const calculateItemsTotal = (items: BillingItem[]): number => {
  if (!items || items.length === 0) return 0;
  return items.reduce((total, item) => total + parseFloat(item.amount), 0);
};

export const calculateCustomChargesTotal = (customCharges: CustomCharge[]): number => {
  if (!customCharges || customCharges.length === 0) return 0;
  return customCharges.reduce((total, charge) => total + parseFloat(charge.amount), 0);
};

export const calculateTotalBillAmount = (billingItems: BillingItem[], customCharges: CustomCharge[], previousArrears: string = "0"): number => {
  const itemsTotal = calculateItemsTotal(billingItems);
  const customChargesTotal = calculateCustomChargesTotal(customCharges);
  const previousArrearsTotal = parseFloat(previousArrears) || 0;
  
  return itemsTotal + customChargesTotal + previousArrearsTotal;
};

export const isRecentBill = (dateString: string): boolean => {
  const billDate = new Date(dateString);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return billDate > thirtyDaysAgo;
};

export const getDaysUntilDue = (dueDateString: string): number => {
  const dueDate = new Date(dueDateString);
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getDueDateStatus = (dueDateString: string): 'overdue' | 'due-soon' | 'upcoming' => {
  const daysUntilDue = getDaysUntilDue(dueDateString);
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 7) return 'due-soon';
  return 'upcoming';
};

export const getCustomChargeColor = (index: number): string => {
  const colors = [
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-cyan-100 text-cyan-800 border-cyan-200',
    'bg-amber-100 text-amber-800 border-amber-200',
  ];
  return colors[index % colors.length];
};

export const formatCustomChargeLog = (log: StudentBillLog): string => {
  if (log.field_name === 'custom_charge_added') {
    return `Added custom charge: ${log.new_value}`;
  } else if (log.field_name === 'custom_charge_updated') {
    return `Updated custom charge: ${log.old_value} → ${log.new_value}`;
  } else if (log.field_name === 'custom_charge_removed') {
    return `Removed custom charge: ${log.old_value}`;
  }
  return `${log.field_name}: ${log.old_value || ''} → ${log.new_value || ''}`;
};

export default StudentBillsService;