import React from 'react';
import { ScrollView, View } from 'react-native';
import { Stack } from 'expo-router';
import { useProfile } from '@/modules/profile/hooks/useProfile';
import AvatarUpload from '@/modules/profile/components/AvatarUpload';
import ProfileForm from '@/modules/profile/components/ProfileForm';

export default function EditProfileScreen() {
  const { user, updateAvatar, isLoading } = useProfile();

  if (!user) return null;

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Profile', headerShown: true }} />
      <ScrollView className="flex-1 bg-white dark:bg-navy-950">
        <View className="px-6 py-8">
          <AvatarUpload
            uri={user.avatar}
            name={user.name}
            onPress={updateAvatar}
            loading={isLoading}
          />
          
          <View className="mt-8">
            <ProfileForm />
          </View>
        </View>
      </ScrollView>
    </>
  );
}
