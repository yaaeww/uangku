import { create } from 'zustand';
import api from '../services/api';

interface SystemSettings {
    website_name: string;
    logo_url_light: string;
    logo_url_dark: string;
    trial_duration_days: string;
    allow_registration: string;
    trial_max_members: string;
}

interface SystemState {
    settings: SystemSettings;
    loading: boolean;
    error: string | null;
    fetchSettings: () => Promise<void>;
}

const defaultSettings: SystemSettings = {
    website_name: 'Uangku',
    logo_url_light: '',
    logo_url_dark: '',
    trial_duration_days: '7',
    allow_registration: 'true',
    trial_max_members: '2'
};

export const useSystemStore = create<SystemState>((set) => ({
    settings: defaultSettings,
    loading: false,
    error: null,
    fetchSettings: async () => {
        set({ loading: true });
        try {
            const response = await api.get('/public/settings');
            set({ 
                settings: { ...defaultSettings, ...response.data }, 
                loading: false,
                error: null
            });
        } catch (error) {
            console.error('Failed to fetch system settings:', error);
            set({ loading: false, error: 'Failed to fetch system settings' });
        }
    }
}));
