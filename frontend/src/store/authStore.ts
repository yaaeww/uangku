import { create } from 'zustand';
import { User } from '../models';

interface AuthState {
    user: User | null;
    token: string | null;
    setAuth: (user: User, token: string) => void;
    setUser: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const validToken = (savedToken && savedToken !== 'null' && savedToken !== 'undefined') ? savedToken : null;
    const validUser = savedUser ? JSON.parse(savedUser) : null;

    return {
        user: validUser,
        token: validToken,
        setAuth: (user, token) => {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            set({ user, token });
        },
        setUser: (user) => {
            localStorage.setItem('user', JSON.stringify(user));
            set({ user });
        },
        logout: () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            set({ user: null, token: null });
        },
    };
});
