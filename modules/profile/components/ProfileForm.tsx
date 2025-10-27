import React from 'react';
import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useProfile } from '../hooks/useProfile';

interface ProfileFormData {
  name: string;
  email: string;
}

export default function ProfileForm() {
  const { user, updateProfile, isLoading } = useProfile();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    await updateProfile(data);
  };

  return (
    <View className="space-y-4">
      <Controller
        control={control}
        name="name"
        rules={{ required: 'Name is required' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Name"
            placeholder="Enter your name"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        rules={{
          required: 'Email is required',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Invalid email address',
          },
        }}
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

      <Button
        title="Save Changes"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        fullWidth
      />
    </View>
  );
}
