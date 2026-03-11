import api from '../services/api';
import { Transaction } from '../models';

export const FinanceController = {
    getMonthlyTransactions: async (month: number, year: number): Promise<Transaction[]> => {
        const response = await api.get('/finance/transactions', { params: { month, year } });
        return response.data.map((tx: any) => ({
            id: tx.id,
            familyId: tx.family_id,
            userId: tx.user_id,
            walletId: tx.wallet_id,
            toWalletId: tx.to_wallet_id,
            savingId: tx.saving_id,
            type: tx.type,
            amount: tx.amount,
            category: tx.category,
            date: tx.date,
            description: tx.description
        }));
    },

    getDashboardSummary: async (month: number, year: number): Promise<any> => {
        const response = await api.get('/finance/summary', { params: { month, year } });
        const s = response.data;
        return {
            totalIncome: s.total_income,
            totalExpense: s.total_expense,
            balance: s.balance,
            monthlySavings: s.monthly_savings,
            incomeByCategory: s.income_by_category,
            expenseByCategory: s.expense_by_category,
            comparison: s.comparison
        };
    },

    createTransaction: async (tx: any): Promise<Transaction> => {
        const payload = {
            description: tx.description,
            wallet_id: tx.walletId,
            to_wallet_id: tx.toWalletId || null,
            saving_id: tx.savingId || null,
            amount: tx.amount,
            fee: tx.fee,
            category: tx.category,
            type: tx.type,
            date: tx.date
        };
        const response = await api.post('/finance/transactions', payload);
        const newTx = response.data;
        return {
            id: newTx.id,
            familyId: newTx.family_id,
            userId: newTx.user_id,
            walletId: newTx.wallet_id,
            toWalletId: newTx.to_wallet_id,
            savingId: newTx.saving_id,
            type: newTx.type,
            amount: newTx.amount,
            category: newTx.category,
            date: newTx.date,
            description: newTx.description
        };
    },

    createBulkTransactions: async (txs: any[]): Promise<any> => {
        const payload = txs.map(tx => ({
            description: tx.description,
            wallet_id: tx.walletId,
            to_wallet_id: tx.toWalletId || null,
            saving_id: tx.savingId || null,
            amount: tx.amount,
            category: tx.category,
            type: tx.type,
            date: tx.date,
            fee: tx.fee || 0
        }));
        const response = await api.post('/finance/transactions/bulk', payload);
        return response.data;
    },

    updateTransaction: async (id: string, tx: any): Promise<Transaction> => {
        const payload = {
            description: tx.description,
            wallet_id: tx.walletId,
            to_wallet_id: tx.toWalletId || null,
            saving_id: tx.savingId || null,
            amount: tx.amount,
            fee: tx.fee,
            category: tx.category,
            type: tx.type,
            date: tx.date
        };
        const response = await api.put(`/finance/transactions/${id}`, payload);
        return response.data;
    },

    deleteTransaction: async (id: string): Promise<any> => {
        const response = await api.delete(`/finance/transactions/${id}`);
        return response.data;
    },

    getWallets: async (): Promise<any[]> => {
        const response = await api.get('/finance/wallets');
        // Map back to camelCase for frontend
        return response.data.map((w: any) => ({
            id: w.id,
            familyId: w.family_id,
            name: w.name,
            walletType: w.wallet_type,
            accountNumber: w.account_number,
            balance: w.balance,
            createdAt: w.created_at
        }));
    },

    createWallet: async (wallet: { name: string; wallet_type: string; account_number?: string; initialBalance: number }): Promise<any> => {
        const payload = {
            name: wallet.name,
            wallet_type: wallet.wallet_type,
            account_number: wallet.account_number,
            initial_balance: wallet.initialBalance
        };
        const response = await api.post('/finance/wallets', payload);
        return response.data;
    },

    updateWallet: async (wallet: any): Promise<any> => {
        const payload = {
            id: wallet.id,
            name: wallet.name,
            wallet_type: wallet.walletType,
            account_number: wallet.accountNumber,
            balance: wallet.balance
        };
        const response = await api.put('/finance/wallets', payload);
        return response.data;
    },

    deleteWallet: async (id: string): Promise<any> => {
        const response = await api.delete(`/finance/wallets/${id}`);
        return response.data;
    },

    // Savings
    getSavings: async (): Promise<any[]> => {
        const response = await api.get('/finance/savings');
        return response.data.map((s: any) => ({
            id: s.id,
            familyId: s.family_id,
            name: s.name,
            targetAmount: s.target_amount,
            currentBalance: s.current_balance,
            category: s.category,
            emoji: s.emoji,
            dueDate: s.due_date,
            createdAt: s.created_at
        }));
    },

    createSaving: async (saving: any): Promise<any> => {
        const payload = {
            name: saving.name,
            target_amount: saving.targetAmount,
            current_balance: saving.currentBalance,
            category: saving.category,
            emoji: saving.emoji,
            due_date: saving.dueDate
        };
        const response = await api.post('/finance/savings', payload);
        return response.data;
    },

    updateSaving: async (saving: any): Promise<any> => {
        const payload = {
            id: saving.id,
            name: saving.name,
            target_amount: saving.targetAmount,
            current_balance: saving.currentBalance,
            category: saving.category,
            emoji: saving.emoji,
            due_date: saving.dueDate
        };
        const response = await api.put('/finance/savings', payload);
        return response.data;
    },

    deleteSaving: async (id: string): Promise<any> => {
        const response = await api.delete(`/finance/savings/${id}`);
        return response.data;
    },

    // Debts
    getDebts: async (): Promise<any[]> => {
        const response = await api.get('/finance/debts');
        return response.data.map((d: any) => ({
            id: d.id,
            familyId: d.family_id,
            name: d.name,
            totalAmount: d.total_amount,
            remainingAmount: d.remaining_amount,
            dueDate: d.due_date,
            createdAt: d.created_at
        }));
    },

    createDebt: async (debt: any): Promise<any> => {
        const payload = {
            name: debt.name,
            total_amount: debt.totalAmount,
            remaining_amount: debt.remainingAmount,
            due_date: debt.dueDate
        };
        const response = await api.post('/finance/debts', payload);
        return response.data;
    },

    recordDebtPayment: async (payment: any): Promise<any> => {
        const response = await api.post('/finance/debts/payment', payment);
        return response.data;
    },

    deleteDebt: async (id: string): Promise<any> => {
        const response = await api.delete(`/finance/debts/${id}`);
        return response.data;
    }
};
