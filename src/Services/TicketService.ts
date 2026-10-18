import axios from 'axios';
// CHANGED: shared cookie/CSRF layer. Adjust the path if http.ts lives somewhere else.
import { API_URL as BASE_URL, setupHttp } from './http';

// CHANGED: the base URL comes from VITE_API_URL (through http.ts) instead of being hardcoded.
const API_URL = `${BASE_URL}tickets/`;

// CHANGED: make sure the default axios has the cookie + CSRF interceptors. If a logged-in user
// submits a ticket, their cookie is sent with the request, and the server then expects the
// X-CSRFToken header too (the interceptor adds it). setupHttp ignores instances it has already
// set up, so this is safe even if initAuth() ran first.
setupHttp();

export interface TicketData {
    full_name: string;
    email: string;
    phone_number: string;
    section: string;
    severity: string;
    description: string;
    screenshot?: File;
}

export const submitTicket = async (ticketData: TicketData) => {
    const formData = new FormData();
    formData.append('full_name', ticketData.full_name);
    formData.append('email', ticketData.email);
    formData.append('phone_number', ticketData.phone_number);
    formData.append('section', ticketData.section);
    formData.append('severity', ticketData.severity);
    formData.append('description', ticketData.description);

    if (ticketData.screenshot) {
        formData.append('screenshot', ticketData.screenshot);
    }

    try {
        const response = await axios.post(API_URL, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            // CHANGED: this form is open to visitors too, so a failed session refresh must
            // never send them to the login page.
            skipAuthRedirect: true,
        });
        return response.data;
    } catch (error) {
        console.error('Error submitting ticket:', error);
        throw error;
    }
};