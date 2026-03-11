import api from '../services/api';

export const AuthController = {
    login: async (email: string, password: string, rememberMe: boolean = false): Promise<any> => {
        const response = await api.post('/auth/login', { email, password, rememberMe });
        return response.data;
    },

    register: async (data: any): Promise<void> => {
        await api.post('/auth/register', data);
    },

    verifyOTP: async (email: string, otp: string): Promise<void> => {
        await api.post('/auth/verify-otp', { email, otp });
    },

    forgotPassword: async (email: string): Promise<void> => {
        await api.post('/auth/forgot-password', { email });
    },

    resetPassword: async (data: any): Promise<void> => {
        await api.post('/auth/reset-password', data);
    }
};
