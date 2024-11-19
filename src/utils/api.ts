import axios, { AxiosInstance } from 'axios';

// Create axios instance with custom config
const api: AxiosInstance = axios.create({
    baseURL: process.env.REACT_APP_AI_SERVER_URL || 'https://aishah.jdn.gov.my/api',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzNDUifQ.E1MDASE64Q_yMqDZNzBX2nGZK78NRXUP8cJE2I8-wns'
    }
});

interface MessageRequest {
    message: string;
    session_id: string;
}

interface MessageResponse {
    response: {
        text: string;
        emotion: string;
    };
}

export const sendMessage = async (data: MessageRequest): Promise<MessageResponse> => {
    try {
        const response = await api.post<MessageResponse>('/forward_message', data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('API Error:', error.response?.data || error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        throw error;
    }
};

export default api;
