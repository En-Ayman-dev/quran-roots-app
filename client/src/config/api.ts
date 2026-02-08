export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002') + '/api';

if (import.meta.env.DEV) {
    console.log('🔌 API Connected to:', API_BASE_URL);
}
