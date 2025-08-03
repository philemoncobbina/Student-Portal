import axios from 'axios';

// Define base API URL - adjust this to your actual API endpoint
const API_URL = 'https://api.plvcmonline.uk/api';

// Authentication header helper
const getAuthHeaders = () => {
  const accessToken = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${accessToken}` };
};

// Type definitions based on the backend models
export interface BookListItem {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  is_required: boolean;
  book_list: number;
  total_price: number; // Calculated field from backend
}

export interface BookList {
  id: number;
  title: string;
  description: string;
  class_name: string;
  class_name_display: string; // For displaying user-friendly class name
  academic_year: string; // Changed from number to string
  status: 'draft' | 'scheduled' | 'published';
  created_at: string;
  updated_at: string;
  publish_date: string | null;
  scheduled_date: string | null;
  created_by: number;
  calculated_total_price: number; // From backend calculation
  items: BookListItem[];
}

export interface StudentClassHistory {
  id: number;
  student: number;
  student_name: string;
  academic_year: string; // Changed from number to string
  class_name: string;
  class_name_display: string;
}

export const BookListService = {
  /**
   * Get ONLY the booklists for the student's current class in current academic year
   */
  getCurrentClassBooklists: async () => {
    return axios.get<BookList[]>(`${API_URL}/booklists/my_class/`, {
      headers: getAuthHeaders()
    });
  },

  /**
   * Get booklists for the student's current class and optionally previous classes
   * Optional filters for academic year and class
   */
  getMyClassBooklists: async (academicYear?: string | null, className?: string | null) => {
    let url = `${API_URL}/booklists/my_class/`;
    
    const params = new URLSearchParams();
    if (academicYear) params.append('academic_year', academicYear);
    if (className) params.append('class_name', className);
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
    return axios.get<BookList[]>(url, {
      headers: getAuthHeaders()
    });
  },

  /**
   * Get booklists specifically from previous classes
   * Optional filters for academic year and class
   */
  getPreviousClassesBooklists: async (academicYear?: string | null, className?: string | null) => {
    let url = `${API_URL}/booklists/previous_classes/`;
    
    const params = new URLSearchParams();
    if (academicYear) params.append('academic_year', academicYear);
    if (className) params.append('class_name', className);
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
    return axios.get<BookList[]>(url, {
      headers: getAuthHeaders()
    });
  },

  /**
   * Get booklists from previous academic years
   */
  getBooklistHistory: async () => {
    return axios.get<BookList[]>(`${API_URL}/booklists/history/`, {
      headers: getAuthHeaders()
    });
  },

  /**
   * Get details for a specific booklist
   */
  getBooklistDetails: async (booklistId: number) => {
    return axios.get<BookList>(`${API_URL}/booklists/${booklistId}/`, {
      headers: getAuthHeaders()
    });
  },
    
  /**
   * Calculate the total price of all items in a booklist
   * (This is a helper function, not an API call)
   */
  calculateTotalPrice: (items: BookListItem[]): number => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
};

export default {
  BookListService
};