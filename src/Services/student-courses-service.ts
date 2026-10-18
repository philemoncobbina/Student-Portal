import axios from 'axios';
// CHANGED: shared cookie/CSRF layer. Adjust the path if http.ts lives somewhere else.
import { API_URL, setupHttp } from './http';

// CHANGED: make sure the default axios has the cookie + CSRF + silent-refresh interceptors.
// setupHttp ignores instances it has already set up, so this is safe even if initAuth() ran first.
setupHttp();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single course assignment returned by the backend */
export const CourseItem = null; // This is just for type reference in JSDoc

/** Shape of the envelope the backend wraps courses in */
export const CoursesResponse = null; // This is just for type reference in JSDoc

// CHANGED: typed parameters (the untyped `params.term` did not compile as TypeScript).
export interface CurrentCoursesParams {
  term?: string;
}

export interface PreviousCoursesParams {
  class_name: string;
  term: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// REMOVED: getAuthHeaders(), which read a token from localStorage/sessionStorage, and the
// hardcoded BASE_URL. Credentials travel as HttpOnly cookies, and the base URL is API_URL from
// http.ts (VITE_API_URL). It ends with a "/", so the paths below don't start with one.

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const studentCoursesService = {
  /**
   * Fetch all courses assigned to the student's current class.
   *
   * GET /api/my-courses/
   * Optional query: ?term=first|second|third
   */
  async getCurrentCourses(params: CurrentCoursesParams = {}) {
    const { data } = await axios.get(`${API_URL}my-courses/`, {
      params: params.term ? { term: params.term } : {},
    });

    return data;
  },

  /**
   * Fetch courses for a previous class + term the student was enrolled in.
   *
   * GET /api/my-courses/previous/?class_name=&term=
   */
  async getPreviousCourses(params: PreviousCoursesParams) {
    const { data } = await axios.get(`${API_URL}my-courses/previous/`, {
      params: { class_name: params.class_name, term: params.term },
    });

    return data;
  },

  /**
   * Generic lookup — useful for staff / principal views or when you already
   * have an explicit class_name + term in hand.
   *
   * GET /api/my-courses/by_class_and_term/?class_name=&term=
   */
  async getCoursesByClassAndTerm(class_name: string, term: string) {
    const { data } = await axios.get(`${API_URL}my-courses/by_class_and_term/`, {
      params: { class_name, term },
    });

    return data;
  },
};