import React from 'react';
import { View, Text } from 'react-native';
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
          isOwnMessage ? 'bg-primary-600' : 'bg-gray-200'
        }`}
      >
        <Text className={`text-base ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
          {message.content}
        </Text>
        <Text
          className={`text-xs mt-1 ${
            isOwnMessage ? 'text-primary-100' : 'text-gray-500'
          }`}
        >
          {formatDate(message.createdAt, 'time')}
        </Text>
      </View>
    </View>
  );
}
