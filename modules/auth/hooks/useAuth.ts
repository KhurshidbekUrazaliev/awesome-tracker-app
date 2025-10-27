import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';
import authService from '../services/authService';
import { LoginInput, SignupInput } from '../validation/authSchema';
import { navigation } from '@/utils/navigation';

export function useAuth() {
  const { setToken, setLoading, setError, logout: clearAuth } = useAuthStore();
  const { setUser, clearUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (credentials: LoginInput) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { token, user } = await authService.login(credentials);
      
      setToken(token);
      setUser(user);
      
      navigation.replace('/');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupInput) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { token, user } = await authService.signup(data);
      
      setToken(token);
      setUser(user);
      
      navigation.replace('/');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Signup failed';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      await clearAuth();
      clearUser();
      navigation.replace('/auth/login');
    } catch (error: any) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.forgotPassword(email);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send reset email';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    signup,
    logout,
    forgotPassword,
    isLoading,
  };
}
