import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { loginSchema, LoginInput } from '../validation/authSchema';
import { useAuth } from '../hooks/useAuth';

export default function LoginForm() {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setError('');
      await login(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View className="space-y-4">
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email"
            placeholder="Enter your email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Password"
            placeholder="Enter your password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            secureTextEntry
          />
        )}
      />

      {error && (
        <View className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
          <Text className="text-red-600 dark:text-red-400 text-sm">{error}</Text>
        </View>
      )}

      <Button
        title="Login"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        fullWidth
      />
    </View>
  );
}
