import api from '../services/api';

export const PaymentController = {
    createPayment: async (planId: string, method: string): Promise<any> => {
        const response = await api.post('/finance/payment/create', { plan_id: planId, method });
        return response.data;
    },

    getPayment: async (id: string): Promise<any> => {
        const response = await api.get(`/finance/payment/${id}`);
        return response.data;
    }
};
