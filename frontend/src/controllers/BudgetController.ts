import api from '../services/api';

export interface BudgetCategory {
    id: string;
    familyId: string;
    name: string;
    percentage: number;
    description: string;
    icon: string;
    color: string;
    bgColor: string;
    type: 'kebutuhan' | 'keinginan';
    order: number;
    month?: number;
    year?: number;
    items?: any[];
}

export const BudgetController = {
    getCategories: async (month?: number, year?: number, userId?: string): Promise<BudgetCategory[]> => {
        const response = await api.get('/finance/budget/categories', {
            params: { month, year, user_id: userId }
        });
        return response.data.map((c: any) => ({
            id: c.id,
            familyId: c.family_id,
            name: c.name,
            percentage: c.percentage,
            description: c.description,
            icon: c.icon,
            color: c.color,
            bgColor: c.bg_color,
            type: c.type || 'kebutuhan',
            order: c.order,
            items: (c.items || []).map((s: any) => ({
                id: s.id,
                familyId: s.family_id,
                userId: s.user_id,
                name: s.name,
                budgetCategoryId: c.id,
                targetAmount: s.target_amount,
                currentBalance: s.current_balance,
                category: s.category,
                emoji: s.emoji,
                dueDate: s.due_date,
                createdAt: s.created_at
            }))
        }));
    },

    createCategory: async (category: Partial<BudgetCategory>, userId?: string): Promise<BudgetCategory> => {
        const payload = {
            name: category.name,
            percentage: category.percentage,
            description: category.description,
            icon: category.icon,
            color: category.color,
            bg_color: category.bgColor,
            type: category.type,
            order: category.order,
            month: category.month,
            year: category.year,
            user_id: userId
        };
        const response = await api.post('/finance/budget/categories', payload, {
            params: { month: category.month, year: category.year }
        });
        return response.data;
    },

    updateCategory: async (id: string, category: Partial<BudgetCategory>): Promise<BudgetCategory> => {
        const payload = {
            name: category.name,
            percentage: category.percentage,
            description: category.description,
            icon: category.icon,
            color: category.color,
            bg_color: category.bgColor,
            type: category.type,
            order: category.order
        };
        const response = await api.put(`/finance/budget/categories/${id}`, payload);
        return response.data;
    },

    deleteCategory: async (id: string, month?: number, year?: number, userId?: string): Promise<any> => {
        const response = await api.delete(`/finance/budget/categories/${id}`, {
            params: { month, year, user_id: userId }
        });
        return response.data;
    },

    clearCategoryItems: async (id: string, userId?: string): Promise<any> => {
        const response = await api.delete(`/finance/budget/categories/${id}/clear`, {
            params: { user_id: userId }
        });
        return response.data;
    },

    clearAllCategories: async (userId?: string): Promise<any> => {
        const response = await api.delete('/finance/budget/categories', {
            params: { user_id: userId }
        });
        return response.data;
    }
};
