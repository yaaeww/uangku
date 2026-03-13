import api from '../services/api';

export const NotificationController = {
    getNotifications: async (): Promise<any[]> => {
        const response = await api.get('/finance/notifications');
        return response.data;
    },
    markAsRead: async (id: string): Promise<void> => {
        await api.put(`/finance/notifications/${id}/read`);
    }
};
