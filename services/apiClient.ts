import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('authToken');
          // Navigate to login
        }
        return Promise.reject(error);
      }
    );
  }

  public get<T>(url: string, config = {}) {
    return this.client.get<T>(url, config);
  }

  public post<T>(url: string, data?: any, config = {}) {
    return this.client.post<T>(url, data, config);
  }

  public put<T>(url: string, data?: any, config = {}) {
    return this.client.put<T>(url, data, config);
  }

  public patch<T>(url: string, data?: any, config = {}) {
    return this.client.patch<T>(url, data, config);
  }

  public delete<T>(url: string, config = {}) {
    return this.client.delete<T>(url, config);
  }
}

export default new ApiClient();
