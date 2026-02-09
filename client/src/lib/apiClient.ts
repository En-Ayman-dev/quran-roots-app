import { API_BASE_URL } from '../config/api';
import { AppError, NetworkError, ServerError, AuthenticationError, NotFoundError } from './errors';

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

class ApiClient {
    private baseUrl: string;
    private defaultHeaders: Record<string, string>;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'x-app-source': 'quran-roots-client-v1', // Security Header
        };
    }

    async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    async post<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    private async request<T>(endpoint: string, options: RequestOptions): Promise<T> {
        const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        const headers = { ...this.defaultHeaders, ...options.headers };

        try {
            const response = await fetch(url, { ...options, headers });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || errorData.error || `HTTP Error: ${response.status}`;

                if (response.status === 404) {
                    throw new NotFoundError(errorMessage);
                }
                if (response.status === 403 || response.status === 401) {
                    throw new AuthenticationError(errorMessage);
                }
                if (response.status >= 500) {
                    throw new ServerError(response.status, errorMessage);
                }

                throw new AppError(errorMessage);
            }

            return response.json();
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new NetworkError('يبدو أنك غير متصل بالإنترنت');
            }
            throw new AppError(error instanceof Error ? error.message : 'An unexpected error occurred');
        }
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
