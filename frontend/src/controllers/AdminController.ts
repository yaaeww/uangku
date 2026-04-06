import api from '../services/api';

export const AdminController = {
    getStats: async (chartDays?: number) => {
        const params = chartDays ? `?chart_days=${chartDays}` : '';
        const response = await api.get(`/admin/stats${params}`);
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

    getFamilies: async (page: number = 1, limit: number = 10, search: string = '', status: string = '') => {
        const response = await api.get(`/admin/families?page=${page}&limit=${limit}&search=${search}&status=${status}`);
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

    getPublicSettings: async () => {
        const response = await api.get('/public/settings');
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

    toggleFamilyBlock: async (id: string) => {
        const response = await api.post(`/admin/families/${id}/toggle-block`);
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
    },

    createUser: async (user: any) => {
        const response = await api.post(`/admin/users`, {
            full_name: user.full_name,
            email: user.email,
            password: user.password,
            role: user.role,
            family_name: user.family_name
        });
        return response.data;
    },

    updateUserAdmin: async (id: string, user: any) => {
        const response = await api.put(`/admin/users/${id}`, user);
        return response.data;
    },

    deleteUserAdmin: async (id: string) => {
        const response = await api.delete(`/admin/users/${id}`);
        return response.data;
    },

    getSuperAdmins: async () => {
        const response = await api.get(`/admin/superadmins`);
        return response.data;
    },

    createSuperAdmin: async (admin: any) => {
        const response = await api.post(`/admin/superadmins`, admin);
        return response.data;
    },

    updateSuperAdmin: async (id: string, admin: any) => {
        const response = await api.put(`/admin/superadmins/${id}`, admin);
        return response.data;
    },

    deleteSuperAdmin: async (id: string) => {
        const response = await api.delete(`/admin/superadmins/${id}`);
        return response.data;
    },

    getTransactions: async (page: number = 1, limit: number = 10, search: string = '', status: string = '', period: string = '') => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        if (period) params.append('period', period);
        const response = await api.get(`/admin/transactions?${params.toString()}`);
        return response.data;
    },

    getFinancialSummary: async (period: string = 'month', date?: string) => {
        const params = new URLSearchParams();
        params.append('period', period);
        if (date) params.append('date', date);
        const response = await api.get(`/admin/reports/financial?${params.toString()}`);
        return response.data;
    },

    addPlatformExpense: async (expense: any) => {
        const response = await api.post('/admin/reports/expenses', expense);
        return response.data;
    },

    updatePlatformExpense: async (id: string, expense: any) => {
        const response = await api.put(`/admin/reports/expenses/${id}`, expense);
        return response.data;
    },

    deletePlatformExpense: async (id: string) => {
        const response = await api.delete(`/admin/reports/expenses/${id}`);
        return response.data;
    },

    uploadLogo: async (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        const response = await api.post('/admin/upload-logo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.url;
    },

    getSupportTickets: async () => {
        const response = await api.get('/admin/support/tickets');
        return response.data;
    },

    replyTicket: async (id: string, reply: string) => {
        const response = await api.post(`/admin/support/tickets/${id}/reply`, { reply });
        return response.data;
    },

    // Category Management
    getCategories: async () => {
        const response = await api.get('/admin/reports/categories');
        return response.data;
    },

    addCategory: async (cat: any) => {
        const response = await api.post('/admin/reports/categories', cat);
        return response.data;
    },

    updateCategory: async (cat: any) => {
        const response = await api.put('/admin/reports/categories', cat);
        return response.data;
    },

    deleteCategory: async (id: string) => {
        const response = await api.delete(`/admin/reports/categories/${id}`);
        return response.data;
    },

    transferPlatformBudget: async (transferData: any) => {
        const response = await api.post('/admin/reports/transfers', transferData);
        return response.data;
    },

    updatePlatformBudgetTransfer: async (id: string, transferData: any) => {
        const response = await api.put(`/admin/reports/transfers/${id}`, transferData);
        return response.data;
    },

    deletePlatformBudgetTransfer: async (id: string) => {
        const response = await api.delete(`/admin/reports/transfers/${id}`);
        return response.data;
    },

    getPaymentChannels: async () => {
        const response = await api.get('/admin/payment-channels');
        return response.data;
    },

    syncPaymentChannels: async () => {
        const response = await api.post('/admin/payment-channels/sync');
        return response.data;
    },

    updatePaymentChannel: async (channel: any) => {
        const response = await api.put('/admin/payment-channels', channel);
        return response.data;
    },

    createPaymentChannel: async (channel: any) => {
        const payload = { ...channel };
        if (!payload.id) delete payload.id;
        const response = await api.post('/admin/payment-channels', payload);
        return response.data;
    },

    deletePaymentChannel: async (id: string) => {
        const response = await api.delete(`/admin/payment-channels/${id}`);
        return response.data;
    },

    verifyManualPayment: async (data: { id: string, status: string, notes?: string }) => {
        const response = await api.post('/admin/payments/manual/status', data);
        return response.data;
    }
};
