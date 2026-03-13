import api from '../services/api';

export const PaymentController = {
    // Create a new TriPay transaction (authenticated)
    createPayment: async (planId: string, method: string): Promise<any> => {
        const response = await api.post('/finance/payment/create', { plan_id: planId, method });
        return response.data;
    },

    // Get full payment details by UUID (authenticated, for internal use)
    getPayment: async (id: string): Promise<any> => {
        const response = await api.get(`/finance/payment/${id}`);
        return response.data;
    },

    // Poll payment status by TriPay reference (public, no auth needed)
    // Returns: { id, reference, status, paid_at, expired_at }
    getPaymentStatus: async (reference: string): Promise<any> => {
        const response = await api.get(`/payment/status/${reference}`);
        return response.data;
    },
};
