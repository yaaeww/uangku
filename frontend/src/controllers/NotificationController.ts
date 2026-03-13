import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001/api/v1',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add interceptor to include token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const NotificationController = {
    getNotifications: async (): Promise<any[]> => {
        const response = await api.get('/finance/notifications');
        return response.data;
    },
    markAsRead: async (id: string): Promise<void> => {
        await api.put(`/finance/notifications/${id}/read`);
    }
};
