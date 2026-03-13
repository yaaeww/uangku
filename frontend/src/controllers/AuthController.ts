import api from '../services/api';

export const AuthController = {
    login: async (email: string, password: string, rememberMe: boolean = false): Promise<any> => {
        const response = await api.post('/auth/login', { email, password, rememberMe });
        return response.data;
    },

    register: async (data: { 
        email: string; 
        phone_number: string;
        password: string; 
        full_name: string; 
        family_name: string; 
        selected_plan: string;
        invitation_id?: string;
    }): Promise<void> => {
        await api.post('/auth/register', data);
    },

    verifyOTP: async (email: string, otp: string): Promise<any> => {
        const response = await api.post('/auth/verify-otp', { email, otp });
        return response.data;
    },

    forgotPassword: async (email: string): Promise<void> => {
        await api.post('/auth/forgot-password', { email });
    },

    resetPassword: async (data: any): Promise<void> => {
        await api.post('/auth/reset-password', data);
    },

    getInvitation: async (id: string): Promise<any> => {
        const response = await api.get(`/auth/invitation/${id}`);
        return response.data;
    },

    updateProfile: async (data: { full_name: string; phone_number: string }): Promise<void> => {
        await api.put('/finance/profile', data);
    },

    updatePassword: async (data: any): Promise<void> => {
        await api.put('/finance/profile/password', data);
    },

    requestResetOTP: async (email: string): Promise<void> => {
        await api.post('/auth/reset-password/request-otp', { email });
    },

    resetWithOTP: async (data: any): Promise<void> => {
        await api.post('/auth/reset-password/verify-otp', data);
    },

    getPublicSettings: async (): Promise<any> => {
        const response = await api.get('/public/settings');
        return response.data;
    },

    getPublicPlans: async (): Promise<any> => {
        const response = await api.get('/public/plans');
        return response.data;
    }
};
