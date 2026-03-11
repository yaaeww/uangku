import api from '../services/api';

export const AdminController = {
    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    getApplications: async () => {
        const response = await api.get('/admin/applications');
        return response.data;
    },

    approveApplication: async (id: string) => {
        const response = await api.post(`/admin/applications/${id}/approve`);
        return response.data;
    },

    rejectApplication: async (id: string) => {
        const response = await api.post(`/admin/applications/${id}/reject`);
        return response.data;
    },

    getFamilies: async () => {
        const response = await api.get('/admin/families');
        return response.data;
    }
};
