import axios, { AxiosResponse } from 'axios';

// Types based on the backend models
export interface Course {
  id: number;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface ClassCourse {
  id: number;
  course: Course;
  class_name: string;
  term: string;
  is_active: boolean;
}

export interface CourseResult {
  id: number;
  class_course: ClassCourse;
  class_score: string;
  exam_score: string;
  total_score: number;
  grade: string;
  remarks?: string;
}

export interface Result {
  id: number;
  student: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  class_name: string;
  term: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  scheduled_date?: string;
  published_date?: string;
  created_at: string;
  updated_at: string;
  report_card_pdf?: string; // New field for report card URL
  course_results: CourseResult[];
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface ResultsParams {
  term?: string;
  class_name?: string;
}

class StudentResultsService {
  private readonly baseURL: string;
  private readonly apiClient;

  constructor(baseURL: string = 'https://api.plvcmonline.uk/api') {
    this.baseURL = baseURL;
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Authentication header helper
  private getAuthHeaders() {
    const accessToken = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${accessToken}` };
  }

  /**
   * Get current class results for the authenticated student
   */
  async getCurrentClassResults(params: { term?: string } = {}): Promise<Result[]> {
    try {
      const response: AxiosResponse<Result[]> = await this.apiClient.get('/my-results/current_class/', {
        params,
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching current class results:', error);
      throw error;
    }
  }

  /**
   * Get previous classes results for the authenticated student
   */
  async getPreviousClassResults(params: ResultsParams = {}): Promise<Result[]> {
    try {
      const response: AxiosResponse<Result[]> = await this.apiClient.get('/my-results/previous_classes/', {
        params,
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching previous class results:', error);
      throw error;
    }
  }

  /**
   * Get all student results (current and previous classes)
   */
  async getAllStudentResults(params: ResultsParams = {}): Promise<Result[]> {
    try {
      const response: AxiosResponse<Result[]> = await this.apiClient.get('/my-results/', {
        params,
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all student results:', error);
      throw error;
    }
  }

  /**
   * Get available terms from results
   */
  async getAvailableTerms(): Promise<string[]> {
    try {
      const results = await this.getAllStudentResults();
      const terms = [...new Set(results.map(result => result.term))];
      return terms.sort();
    } catch (error) {
      console.error('Error fetching available terms:', error);
      throw error;
    }
  }

  /**
  

  

  /**
   * Format score for display
   */
  formatScore(score: number): string {
    return score.toFixed(1);
  }

  /**
   * Get grade color for styling
   */
  getGradeColor(grade: string): string {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'E': return 'text-red-500';
      case 'F': return 'text-red-700';
      default: return 'text-gray-600';
    }
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'SCHEDULED': return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}

// Create and export a singleton instance
export const studentResultsService = new StudentResultsService();
export default StudentResultsService;