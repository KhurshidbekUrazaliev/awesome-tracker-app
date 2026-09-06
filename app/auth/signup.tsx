import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import Text from '@/components/Text';
import { Link } from 'expo-router';
import SignupForm from '@/modules/auth/components/SignupForm';

export default function SignupScreen() {
  return (
    <ScrollView className="flex-1 bg-white dark:bg-navy-950">
      <View className="px-6 py-12">
        <Text className="font-display text-3xl font-semibold text-gray-900 dark:text-white mb-2">Create Account</Text>
        <Text className="text-base text-gray-600 dark:text-navy-300 mb-8">Sign up to get started</Text>

        <SignupForm />

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-600 dark:text-navy-300">Already have an account? </Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity>
              <Text className="text-primary-600 dark:text-primary-400 font-medium">Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
