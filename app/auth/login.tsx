import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import LoginForm from '@/modules/auth/components/LoginForm';

export default function LoginScreen() {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 py-12">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</Text>
        <Text className="text-base text-gray-600 mb-8">Sign in to your account</Text>
        
        <LoginForm />
        
        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-600">Don't have an account? </Text>
          <Link href="/auth/signup" asChild>
            <TouchableOpacity>
              <Text className="text-primary-600 font-medium">Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
