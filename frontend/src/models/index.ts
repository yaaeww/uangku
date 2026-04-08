// TypeScript definitions for Domain Models

export interface User {
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    familyName: string;
    role: 'super_admin' | 'family_admin' | 'family_member' | 'content_strategist';
    familyStatus?: 'active' | 'trial' | 'expired';
    trialEndsAt?: string;
}

export interface Wallet {
    id: string;
    familyId: string;
    userId: string;
    name: string;
    walletType: string;
    accountNumber: string;
    balance: number;
    createdAt: string;
    user?: {
        fullName: string;
    };
}

export interface Transaction {
    id: string;
    familyId: string;
    userId: string;
    walletId: string;
    toWalletId: string | null;
    savingId?: string | null;
    goalId?: string | null;
    type: 'income' | 'expense' | 'transfer' | 'saving' | 'goal_allocation' | 'debt_payment';
    amount: number;
    fee?: number;
    category: string | null;
    date: string;
    description: string;
    user?: {
        fullName: string;
    };
}

export interface Saving {
    id: string;
    familyId: string;
    name: string;
    budgetCategoryId?: string;
    targetAmount: number;
    currentBalance: number;
    createdAt: string;
}

export interface Debt {
    id: string;
    familyId: string;
    name: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    startDate: string;
    paymentDay: number;
    installmentIntervalMonths: number;
    nextInstallmentDueDate: string;
    status: string;
    createdAt: string;
}

export interface DebtPayment {
    id: string;
    debtId: string;
    amount: number;
    date: string;
    description: string;
    createdAt: string;
}
