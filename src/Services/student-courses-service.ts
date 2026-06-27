import axios from 'axios';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single course assignment returned by the backend */
export const CourseItem = null; // This is just for type reference in JSDoc

/** Shape of the envelope the backend wraps courses in */
export const CoursesResponse = null; // This is just for type reference in JSDoc

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Retrieve the stored auth token exactly the same way the rest of the app does */
function getAuthHeaders() {
  const token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('access_token') ||
    '';

  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Base URL — reads from Vite env var if present, falls back to relative path */
const BASE_URL = 'https://api.cobbina.uk/api';

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
  async getCurrentCourses(params = {}) {
    const query = new URLSearchParams();
    if (params.term) query.set('term', params.term);

    const url = `${BASE_URL}/my-courses/${query.toString() ? `?${query}` : ''}`;

    const { data } = await axios.get(url, {
      headers: getAuthHeaders(),
    });

    return data;
  },

  /**
   * Fetch courses for a previous class + term the student was enrolled in.
   *
   * GET /api/my-courses/previous/?class_name=&term=
   */
  async getPreviousCourses(params) {
    const query = new URLSearchParams({
      class_name: params.class_name,
      term: params.term,
    });

    const url = `${BASE_URL}/my-courses/previous/?${query}`;

    const { data } = await axios.get(url, {
      headers: getAuthHeaders(),
    });

    return data;
  },

  /**
   * Generic lookup — useful for staff / principal views or when you already
   * have an explicit class_name + term in hand.
   *
   * GET /api/my-courses/by_class_and_term/?class_name=&term=
   */
  async getCoursesByClassAndTerm(class_name, term) {
    const query = new URLSearchParams({ class_name, term });
    const url = `${BASE_URL}/my-courses/by_class_and_term/?${query}`;

    const { data } = await axios.get(url, {
      headers: getAuthHeaders(),
    });

    return data;
  },
};