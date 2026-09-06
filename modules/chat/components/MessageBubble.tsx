import React from 'react';
import { View } from 'react-native';
import Text from '@/components/Text';
import { Message } from '../store/useChatStore';
import { formatDate } from '@/utils/formatDate';
import { useUserStore } from '@/store/useUserStore';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useUserStore();
  const isOwnMessage = message.senderId === user?.id;

  return (
    <View className={`flex-row mb-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <View
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isOwnMessage ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-200 dark:bg-navy-800'
        }`}
      >
        <Text className={`text-base ${isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
          {message.content}
        </Text>
        <Text
          className={`text-xs mt-1 ${
            isOwnMessage ? 'text-primary-100' : 'text-gray-500 dark:text-navy-300'
          }`}
        >
          {formatDate(message.createdAt, 'time')}
        </Text>
      </View>
    </View>
  );
}
