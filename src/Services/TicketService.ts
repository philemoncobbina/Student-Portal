import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/tickets/'



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
        });
        return response.data;
    } catch (error) {
        console.error('Error submitting ticket:', error);
        throw error;
    }
};
