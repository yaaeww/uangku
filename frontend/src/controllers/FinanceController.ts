import api from '../services/api';
import { Transaction } from '../models';

export const FinanceController = {
    getMonthlyTransactions: async (month: number, year: number, week: number = 0, page: number = 1, limit: number = 25): Promise<{ data: Transaction[], total: number, totalIncome: number, totalExpense: number }> => {
        const response = await api.get('/finance/transactions', { params: { month, year, week, page, limit } });
        const { data, total, total_income, total_expense } = response.data;
        return {
            total,
            totalIncome: total_income || 0,
            totalExpense: total_expense || 0,
            data: data.map((tx: any) => ({
                id: tx.id,
                familyId: tx.family_id,
                userId: tx.user_id,
                walletId: tx.wallet_id,
                toWalletId: tx.to_wallet_id,
                savingId: tx.saving_id,
                goalId: tx.goal_id,
                type: tx.type,
                amount: tx.amount,
                category: tx.category,
                date: tx.date,
                description: tx.description,
                user: tx.user ? { fullName: tx.user.full_name } : undefined
            }))
        };
    },

    getTransactionsByRange: async (startDate: string, endDate: string, page: number = 1, limit: number = 25): Promise<{ data: Transaction[], total: number }> => {
        const response = await api.get('/finance/transactions', { params: { start_date: startDate, end_date: endDate, page, limit } });
        const { data, total } = response.data;
        return {
            total,
            data: data.map((tx: any) => ({
                id: tx.id,
                familyId: tx.family_id,
                userId: tx.user_id,
                walletId: tx.wallet_id,
                toWalletId: tx.to_wallet_id,
                savingId: tx.saving_id,
                goalId: tx.goal_id,
                type: tx.type,
                amount: tx.amount,
                category: tx.category,
                date: tx.date,
                description: tx.description,
                user: tx.user ? { fullName: tx.user.full_name } : undefined
            }))
        };
    },

    getDashboardSummary: async (month: number, year: number): Promise<any> => {
        const response = await api.get('/finance/summary', { params: { month, year } });
        const s = response.data;
        return {
            totalIncome: s.total_income,
            totalExpense: s.total_expense,
            totalBalance: s.total_balance,
            trendIncome: s.trend_income,
            trendExpense: s.trend_expense,
            trendBalance: s.trend_balance,
            monthlySavings: s.monthly_savings,
            incomeByCategory: s.income_by_category,
            expenseByCategory: s.expense_by_category,
            comparison: s.comparison,
            dailyActivity: s.daily_activity,
            family: s.family,
            memberCount: s.member_count,
            invitationCount: s.invitation_count,
            userBudget: s.user_budget,
            totalFamilyBudget: s.total_family_budget,
            memberSpent: s.member_spent,
            memberBudgets: s.member_budgets,
            plan: s.plan
        };
    },

    updateMemberBudget: async (amount: number, targetUserId?: string, month?: number, year?: number): Promise<any> => {
        const response = await api.put('/finance/budget/member', { amount, target_user_id: targetUserId, month, year });
        return response.data;
    },

    applyDefaultAllocation: async (targetUserId?: string, month?: number, year?: number): Promise<any> => {
        const response = await api.post('/finance/budget/member/default', { 
            target_user_id: targetUserId,
            month,
            year
        });
        return response.data;
    },

    createTransaction: async (tx: any): Promise<Transaction> => {
        const payload = {
            description: tx.description,
            wallet_id: tx.walletId,
            to_wallet_id: tx.toWalletId || null,
            saving_id: tx.savingId || null,
            goal_id: tx.goalId || null,
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
            goalId: newTx.goal_id,
            type: newTx.type,
            amount: newTx.amount,
            category: newTx.category,
            date: newTx.date,
            description: newTx.description,
            user: newTx.user ? { fullName: newTx.user.full_name } : undefined
        };
    },

    createBulkTransactions: async (txs: any[]): Promise<any> => {
        const payload = txs.map(tx => ({
            description: tx.description,
            wallet_id: tx.walletId,
            to_wallet_id: tx.toWalletId || null,
            saving_id: tx.savingId || null,
            goal_id: tx.goalId || null,
            amount: tx.amount,
            category: tx.category,
            type: tx.type,
            date: tx.date,
            fee: tx.fee || 0
        }));
        const response = await api.post('/finance/transactions/bulk', payload);
        return response.data;
    },

    updateTransaction: async (id: string, tx: any, originalDate?: string): Promise<Transaction> => {
        const payload = {
            description: tx.description,
            wallet_id: tx.walletId,
            to_wallet_id: tx.toWalletId || null,
            saving_id: tx.savingId || null,
            goal_id: tx.goalId || null,
            amount: tx.amount,
            fee: tx.fee,
            category: tx.category,
            type: tx.type,
            date: tx.date
        };
        const response = await api.put(`/finance/transactions/${id}`, payload, { 
            params: { date: originalDate } 
        });
        const updatedTx = response.data;
        return {
            id: updatedTx.id,
            familyId: updatedTx.family_id,
            userId: updatedTx.user_id,
            walletId: updatedTx.wallet_id,
            toWalletId: updatedTx.to_wallet_id,
            savingId: updatedTx.saving_id,
            goalId: updatedTx.goal_id,
            type: updatedTx.type,
            amount: updatedTx.amount,
            category: updatedTx.category,
            date: updatedTx.date,
            description: updatedTx.description,
            user: updatedTx.user ? { fullName: updatedTx.user.full_name } : undefined
        };
    },

    deleteTransaction: async (id: string, date?: string): Promise<any> => {
        const response = await api.delete(`/finance/transactions/${id}`, { 
            params: { date } 
        });
        return response.data;
    },

    getWallets: async (): Promise<any[]> => {
        const response = await api.get('/finance/wallets');
        // Map back to camelCase for frontend
        return response.data.map((w: any) => ({
            id: w.id,
            familyId: w.family_id,
            userId: w.user_id,
            name: w.name,
            walletType: w.wallet_type,
            accountNumber: w.account_number,
            balance: w.balance,
            createdAt: w.created_at,
            user: w.user ? { fullName: w.user.full_name } : undefined
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
    getSavings: async (month?: number, year?: number): Promise<any[]> => {
        const response = await api.get('/finance/savings', { params: { month, year } });
        return response.data.map((s: any) => ({
            id: s.id,
            familyId: s.family_id,
            userId: s.user_id,
            name: s.name,
            targetAmount: s.target_amount,
            currentBalance: s.current_balance,
            category: s.category,
            budgetCategoryId: s.budget_category_id,
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
            budget_category_id: saving.budgetCategoryId,
            emoji: saving.emoji,
            due_date: saving.dueDate,
            target_user_id: saving.targetUserId || null,
            month: saving.month,
            year: saving.year
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
            budget_category_id: saving.budgetCategoryId,
            emoji: saving.emoji,
            due_date: saving.dueDate,
            target_user_id: saving.targetUserId || null,
            month: saving.month,
            year: saving.year
        };
        const response = await api.put('/finance/savings', payload);
        return response.data;
    },

    deleteSaving: async (id: string): Promise<any> => {
        const response = await api.delete(`/finance/savings/${id}`);
        return response.data;
    },

    getDebts: async (): Promise<any[]> => {
        const response = await api.get('/finance/debts');
        return response.data.map((d: any) => ({
            id: d.id,
            familyId: d.family_id,
            name: d.name,
            description: d.description,
            totalAmount: d.total_amount,
            paidAmount: d.paid_amount,
            remainingAmount: d.remaining_amount,
            status: d.status,
            dueDate: d.due_date,
            installmentIntervalMonths: d.installment_interval_months,
            installmentAmount: d.installment_amount,
            penaltyAmount: d.penalty_amount,
            nextInstallmentDueDate: d.next_installment_due_date,
            paidThisMonth: d.paid_this_month,
            createdBy: d.created_by,
            createdAt: d.created_at
        }));
    },

    createDebt: async (debt: any): Promise<any> => {
        const payload = {
            name: debt.name,
            description: debt.description,
            total_amount: Number(debt.totalAmount || debt.total_amount) || 0,
            due_date: new Date(debt.dueDate || debt.due_date).toISOString(),
            installment_interval_months: Number(debt.installmentIntervalMonths || debt.installment_interval_months) || 0,
            installment_amount: Number(debt.installmentAmount || debt.installment_amount) || 0,
            penalty_amount: Number(debt.penaltyAmount || debt.penalty_amount) || 0,
            next_installment_due_date: (debt.nextInstallmentDueDate || debt.next_installment_due_date) ? 
                new Date(debt.nextInstallmentDueDate || debt.next_installment_due_date).toISOString() : null
        };
        const response = await api.post('/finance/debts', payload);
        return response.data;
    },

    updateDebt: async (debt: any): Promise<any> => {
        const payload = {
            name: debt.name,
            description: debt.description,
            total_amount: Number(debt.totalAmount || debt.total_amount) || 0,
            due_date: new Date(debt.dueDate || debt.due_date).toISOString(),
            installment_interval_months: Number(debt.installmentIntervalMonths || debt.installment_interval_months) || 0,
            installment_amount: Number(debt.installmentAmount || debt.installment_amount) || 0,
            penalty_amount: Number(debt.penaltyAmount || debt.penalty_amount) || 0,
            next_installment_due_date: (debt.nextInstallmentDueDate || debt.next_installment_due_date) ? 
                new Date(debt.nextInstallmentDueDate || debt.next_installment_due_date).toISOString() : null
        };
        const response = await api.put(`/finance/debts/${debt.id}`, payload);
        return response.data;
    },

    recordDebtPayment: async (payment: any): Promise<any> => {
        const payload = {
            debt_id: payment.debtId,
            wallet_id: payment.walletId,
            amount: payment.amount,
            description: payment.description,
            date: new Date(payment.paymentDate || new Date()).toISOString()
        };
        const response = await api.post('/finance/debts/payment', payload);
        return response.data;
    },

    getDebtHistory: async (id: string): Promise<any[]> => {
        const response = await api.get(`/finance/debts/${id}/history`);
        return response.data.map((h: any) => ({
            id: h.id,
            type: h.type,
            isLate: h.isLate,
            debtId: h.debt_id,
            walletId: h.wallet_id,
            amount: h.amount,
            date: h.date,
            description: h.description,
            userName: h.userName,
            createdAt: h.created_at
        }));
    },

    deleteDebt: async (id: string): Promise<any> => {
        const response = await api.delete(`/finance/debts/${id}`);
        return response.data;
    },

    getBehaviorSummary: async (period?: string): Promise<any> => {
        const response = await api.get('/finance/behavior', { params: { period } });
        return response.data;
    },

    joinChallenge: async (challenge: any): Promise<any> => {
        const response = await api.post('/finance/behavior/challenges/join', challenge);
        return response.data;
    },

    getCoachAnalysis: async (month?: number, year?: number): Promise<any> => {
        const response = await api.get('/finance/coach-analysis', { params: { month, year } });
        return response.data;
    },

    getMembers: async (): Promise<any[]> => {
        const response = await api.get('/finance/members');
        return response.data.map((m: any) => ({
            id: m.id,
            familyId: m.family_id,
            userId: m.user_id,
            role: m.role,
            fullName: m.user?.full_name || m.full_name,
            email: m.user?.email || m.email,
            isVerified: m.is_verified,
            joinedAt: m.joined_at,
            monthly_budget: m.monthly_budget
        }));
    },

    updateMemberRole: async (id: string, role: string): Promise<any> => {
        const response = await api.put(`/finance/members/${id}/role`, { role });
        return response.data;
    },

    removeMember: async (id: string): Promise<any> => {
        const response = await api.delete(`/finance/members/${id}`);
        return response.data;
    },

    inviteMember: async (email: string, role: string): Promise<any> => {
        const response = await api.post('/finance/members/invite', { email, role });
        return response.data;
    },

    getInvitations: async (): Promise<any[]> => {
        const response = await api.get('/finance/members/invitations');
        return response.data;
    },

    cancelInvitation: async (id: string): Promise<any> => {
        // We reuse RemoveMember if the backend handles both, but let's check
        // Actually, let's add a dedicated delete route if needed, 
        // but for now we'll just implement the getter.
        const response = await api.delete(`/finance/members/invitations/${id}`);
        return response.data;
    },

    updateFamilyBudget: async (amount: number): Promise<any> => {
        const response = await api.put('/finance/budget', { amount });
        return response.data;
    },

    // Payments
    getPayments: async (): Promise<any[]> => {
        const response = await api.get('/finance/payments');
        return response.data;
    },

    deletePayment: async (id: string): Promise<any> => {
        const response = await api.delete(`/finance/payments/${id}`);
        return response.data;
    },

    // Assets
    getAssets: async (): Promise<any[]> => {
        const response = await api.get('/finance/assets');
        return response.data.map((a: any) => ({
            id: a.id,
            userId: a.user_id,
            name: a.name,
            type: a.type,
            value: a.value,
            description: a.description,
            acquiredDate: a.acquired_date,
            goalId: a.goal_id,
            createdAt: a.created_at,
            ownerName: a.user?.full_name
        }));
    },

    createAsset: async (asset: any): Promise<any> => {
        const payload = {
            name: asset.name,
            type: asset.type,
            value: asset.value,
            description: asset.description,
            acquired_date: asset.acquiredDate
        };
        const response = await api.post('/finance/assets', payload);
        return response.data;
    },

    updateAsset: async (asset: any): Promise<any> => {
        const payload = {
            id: asset.id,
            name: asset.name,
            type: asset.type,
            value: asset.value,
            description: asset.description,
            acquired_date: asset.acquiredDate
        };
        const response = await api.put('/finance/assets', payload);
        return response.data;
    },

    deleteAsset: async (id: string): Promise<any> => {
        const response = await api.delete(`/finance/assets/${id}`);
        return response.data;
    },

    // Goals
    getGoals: async (): Promise<any[]> => {
        const response = await api.get('/finance/goals');
        return response.data.map((g: any) => ({
            id: g.id,
            userId: g.user_id,
            name: g.name,
            targetAmount: g.target_amount,
            currentBalance: g.current_balance,
            status: g.status,
            category: g.category,
            emoji: g.emoji,
            createdAt: g.created_at
        }));
    },

    createGoal: async (goal: any): Promise<any> => {
        const payload = {
            name: goal.name,
            target_amount: goal.targetAmount,
            category: goal.category,
            emoji: goal.emoji
        };
        const response = await api.post('/finance/goals', payload);
        return response.data;
    },

    updateGoal: async (goal: any): Promise<any> => {
        const payload = {
            id: goal.id,
            name: goal.name,
            target_amount: goal.targetAmount,
            current_balance: goal.currentBalance,
            status: goal.status,
            category: goal.category,
            emoji: goal.emoji
        };
        const response = await api.put('/finance/goals', payload);
        return response.data;
    },

    convertToAsset: async (goalId: string, assetType: string): Promise<any> => {
        const response = await api.post('/finance/goals/convert', { 
            goal_id: goalId, 
            asset_type: assetType 
        });
        return response.data;
    },

    deleteGoal: async (id: string): Promise<any> => {
        const response = await api.delete(`/finance/goals/${id}`);
        return response.data;
    },

    fundGoal: async (fund: { goalId: string; walletId: string; amount: number; description: string }): Promise<any> => {
        const payload = {
            goal_id: fund.goalId,
            wallet_id: fund.walletId,
            amount: fund.amount,
            description: fund.description
        };
        const response = await api.post('/finance/goals/fund', payload);
        return response.data;
    },

    getGoalHistory: async (id: string): Promise<any[]> => {
        const response = await api.get(`/finance/goals/${id}/history`);
        return response.data;
    },

    getBlogs: async (status?: string, category?: string): Promise<any[]> => {
        const response = await api.get('/blog', { params: { status, category } });
        return response.data;
    }
};
