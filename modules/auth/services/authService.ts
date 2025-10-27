import apiClient from '@/services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginInput, SignupInput } from '../validation/authSchema';
import { User } from '@/store/useUserStore';

interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  async login(credentials: LoginInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    await AsyncStorage.setItem('authToken', response.data.token);
    return response.data;
  }

  async signup(data: SignupInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/signup', data);
    await AsyncStorage.setItem('authToken', response.data.token);
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    await AsyncStorage.removeItem('authToken');
  }

  async refreshToken(): Promise<string> {
    const response = await apiClient.post<{ token: string }>('/auth/refresh');
    await AsyncStorage.setItem('authToken', response.data.token);
    return response.data.token;
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  }
}

export default new AuthService();
