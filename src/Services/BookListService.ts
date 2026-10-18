import axios from 'axios';
// CHANGED: shared cookie/CSRF layer. Adjust the path if http.ts lives somewhere else.
import { API_URL, setupHttp } from './http';

// CHANGED: make sure the default axios has the cookie + CSRF + silent-refresh interceptors.
// setupHttp ignores instances it has already set up, so this is safe even if initAuth() ran first.
setupHttp();

// CHANGED: API_URL now comes from http.ts (VITE_API_URL) and ends with a "/", so the paths
// below no longer start with one. Credentials travel as HttpOnly cookies.
// REMOVED: the hardcoded API_URL and getAuthHeaders() (the "Authorization: Bearer ..." header).

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

// CHANGED: builds the query string from only the filters that were provided.
const filterParams = (academicYear?: string | null, className?: string | null) => {
  const params: Record<string, string> = {};
  if (academicYear) params.academic_year = academicYear;
  if (className) params.class_name = className;
  return params;
};

export const BookListService = {
  /**
   * Get ONLY the booklists for the student's current class in current academic year
   */
  getCurrentClassBooklists: async () => {
    return axios.get<BookList[]>(`${API_URL}booklists/my_class/`);
  },

  /**
   * Get booklists for the student's current class and optionally previous classes
   * Optional filters for academic year and class
   */
  getMyClassBooklists: async (academicYear?: string | null, className?: string | null) => {
    return axios.get<BookList[]>(`${API_URL}booklists/my_class/`, {
      params: filterParams(academicYear, className),
    });
  },

  /**
   * Get booklists specifically from previous classes
   * Optional filters for academic year and class
   */
  getPreviousClassesBooklists: async (academicYear?: string | null, className?: string | null) => {
    return axios.get<BookList[]>(`${API_URL}booklists/previous_classes/`, {
      params: filterParams(academicYear, className),
    });
  },

  /**
   * Get booklists from previous academic years
   */
  getBooklistHistory: async () => {
    return axios.get<BookList[]>(`${API_URL}booklists/history/`);
  },

  /**
   * Get details for a specific booklist
   */
  getBooklistDetails: async (booklistId: number) => {
    return axios.get<BookList>(`${API_URL}booklists/${booklistId}/`);
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