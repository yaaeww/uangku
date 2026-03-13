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
    },

    getSettings: async () => {
        const response = await api.get('/admin/settings');
        return response.data;
    },

    updateSetting: async (key: string, value: string) => {
        const response = await api.put(`/admin/settings/${key}`, { value });
        return response.data;
    },

    getPlans: async () => {
        const response = await api.get('/admin/plans');
        return response.data;
    },

    getPlanByID: async (id: string) => {
        const response = await api.get(`/public/plans/${id}`);
        return response.data;
    },

    createPlan: async (plan: any) => {
        const response = await api.post('/admin/plans', plan);
        return response.data;
    },

    updatePlan: async (plan: any) => {
        const response = await api.put(`/admin/plans`, plan);
        return response.data;
    },

    deletePlan: async (id: string) => {
        const response = await api.delete(`/admin/plans/${id}`);
        return response.data;
    },

    deleteFamily: async (id: string) => {
        const response = await api.delete(`/admin/families/${id}`);
        return response.data;
    },

    getUsers: async (page: number = 1, limit: number = 10, search: string = '', status: string = '') => {
        const response = await api.get(`/admin/users?page=${page}&limit=${limit}&search=${search}&status=${status}`);
        return response.data;
    },

    updateUser: async (user: any) => {
        const response = await api.put(`/admin/users`, user);
        return response.data;
    },

    toggleUserBlock: async (id: string) => {
        const response = await api.post(`/admin/users/${id}/toggle-block`);
        return response.data;
    }
};
