import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        if (error.response?.status === 403 && error.response?.data?.code === 'TRIAL_EXPIRED') {
            window.location.href = '/pricing';
        }
        return Promise.reject(error);
    }
);

export const getStorageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
    const baseURL = apiUrl.replace('/api/v1', '');
    return `${baseURL}${path}`;
};

export default api;
