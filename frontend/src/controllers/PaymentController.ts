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

    // Get latest pending payment for a plan
    getLatestPending: async (planId: string): Promise<any> => {
        const response = await api.get(`/finance/payment/latest-pending?plan_id=${planId}`);
        return response.data;
    },

    // Poll payment status by TriPay reference (public, no auth needed)
    // Returns: { id, reference, status, paid_at, expired_at }
    getPaymentStatus: async (reference: string): Promise<any> => {
        const response = await api.get(`/payment/status/${reference}`);
        return response.data;
    },

    // Get active payment channels for public checkout (public, no auth needed)
    getActiveChannels: async (): Promise<any[]> => {
        const response = await api.get('/public/payment-channels');
        return response.data;
    },
    // Delete a payment record (authenticated)
    deletePayment: async (id: string): Promise<any> => {
        const response = await api.delete(`/finance/payments/${id}`);
        return response.data;
    },

    // Upload proof for manual payment
    uploadProof: async (paymentId: string, file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('image', file);
        const response = await api.post(`/finance/payment/${paymentId}/upload-proof`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};
