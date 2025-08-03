import axios from 'axios';

const API_BASE_URL = 'https://api.plvcmonline.uk/api/api/';

export interface JobPost {
  id: number;
  reference_number: string | null;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary_range: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  created_by: number | null;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
  scheduled_date: string | null;
  published_date: string | null;
}

export interface JobApplication {
  id: number;
  job_post: number;
  resume: string;
  status: string;
  applied_at: string;
  updated_at: string;
  job_title: string;
  job_reference_number: string;
  first_name: string;
  last_name: string;
  email: string;
  educational_level: 'HIGH_SCHOOL' | 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'PHD';
}

type ApplicationFormData = {
  first_name: string;
  last_name: string;
  email: string;
  educational_level: string;
  resume: File;
}

export const fetchPublishedJobs = async (): Promise<JobPost[]> => {
  const { data } = await axios.get<JobPost[]>(`${API_BASE_URL}jobposts/list_published_posts/`);
  return data;
};

export const fetchJobDetails = async (jobId: number): Promise<JobPost> => {
  const { data } = await axios.get<JobPost>(`${API_BASE_URL}jobposts/${jobId}/get_published_post/`);
  return data;
};

interface ApiResponse {
  success: boolean;
  message: string;
  application?: JobApplication;
  error?: string;
  error_code?: string;
  errors?: string[];
}

export const applyToJob = async (jobId: number, formData: ApplicationFormData): Promise<ApiResponse> => {
  const data = new FormData();
  data.append('job_post', jobId.toString());
  Object.entries(formData).forEach(([key, value]) => data.append(key, value));

  try {
    const { data: responseData } = await axios.post<ApiResponse>(
      `https://api.plvcmonline.uk/api/job-applications/apply/`,
      data,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    // Handle successful response
    if (responseData.success) {
      console.log('Success:', {
        message: responseData.message,
        application: responseData.application
      });
    }

    return responseData;

  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as ApiResponse;
       {
        console.error('API Error:', {
          message: errorData.message,
          error: errorData.error
        });
      }     
      throw errorData;
    }
    
    // Handle unexpected errors
    console.error('Unexpected Error:', error);
    throw error;
  }
};

