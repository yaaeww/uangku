// TypeScript definitions for Domain Models

export interface User {
    id: string;
    email: string;
    fullName: string;
    familyName: string;
    role: 'super_admin' | 'family_admin' | 'family_member';
}

export interface Wallet {
    id: string;
    familyId: string;
    name: string;
    walletType: string;
    accountNumber: string;
    balance: number;
    createdAt: string;
}

export interface Transaction {
    id: string;
    familyId: string;
    userId: string;
    walletId: string;
    toWalletId: string | null;
    savingId?: string | null;
    type: 'income' | 'expense' | 'transfer' | 'saving';
    amount: number;
    fee?: number;
    category: string | null;
    date: string;
    description: string;
}

export interface Saving {
    id: string;
    familyId: string;
    name: string;
    targetAmount: number;
    currentBalance: number;
    createdAt: string;
}

export interface Debt {
    id: string;
    familyId: string;
    name: string;
    totalAmount: number;
    remainingAmount: number;
    dueDate: string;
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
