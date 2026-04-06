import api from '../services/api';

export const NotificationController = {
    getNotifications: async (): Promise<any[]> => {
        const response = await api.get('/finance/notifications');
        return response.data;
    },
    markAsRead: async (id: string): Promise<void> => {
        await api.put(`/finance/notifications/${id}/read`);
    },
    markAllAsRead: async (): Promise<void> => {
        await api.put('/finance/notifications/mark-all-read');
    },
    deleteNotification: async (id: string): Promise<void> => {
        await api.delete(`/finance/notifications/${id}`);
    },
    deleteBulkNotifications: async (ids: string[]): Promise<void> => {
        await api.delete('/finance/notifications/bulk', { data: { ids } });
    },
    deleteAllNotifications: async (): Promise<void> => {
        await api.delete('/finance/notifications/all');
    }
};
