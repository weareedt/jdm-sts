import axios from 'axios';

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

// Create axios instance with custom config
const api = axios.create({
    baseURL: 'http://localhost:3001',
    headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*'
    }
});

export const sendMessage = async (data: MessageRequest): Promise<MessageResponse> => {
    try {
        console.log('Sending request with data:', data);
        const response = await api.post('/api/forward_message', data);
        console.log('Received response:', response.data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('API Error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });
        } else {
            console.error('Unexpected error:', error);
        }
        throw error;
    }
};

export default api;
