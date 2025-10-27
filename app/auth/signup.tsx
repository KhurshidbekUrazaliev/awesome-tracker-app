import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import SignupForm from '@/modules/auth/components/SignupForm';

export default function SignupScreen() {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 py-12">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Create Account</Text>
        <Text className="text-base text-gray-600 mb-8">Sign up to get started</Text>
        
        <SignupForm />
        
        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-600">Already have an account? </Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity>
              <Text className="text-primary-600 font-medium">Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
