import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useChat } from '@/modules/chat/hooks/useChat';
import { formatDate } from '@/utils/formatDate';
import Loader from '@/components/Loader';
import Avatar from '@/components/Avatar';

export default function ChatListScreen() {
  const { conversations, isLoading } = useChat();

  if (isLoading && conversations.length === 0) {
    return <Loader fullScreen text="Loading conversations..." />;
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Messages</Text>
      </View>
      
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row items-center px-6 py-4 border-b border-gray-100"
            onPress={() => router.push(`/chat/conversation?id=${item.id}`)}
          >
            <Avatar name="Chat" size="md" />
            <View className="flex-1 ml-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-semibold text-gray-900">
                  Conversation {item.id.slice(0, 8)}
                </Text>
                <Text className="text-xs text-gray-500">
                  {formatDate(item.updatedAt, 'relative')}
                </Text>
              </View>
              {item.lastMessage && (
                <Text className="text-sm text-gray-600 mt-1" numberOfLines={1}>
                  {item.lastMessage.content}
                </Text>
              )}
            </View>
            {item.unreadCount > 0 && (
              <View className="bg-primary-600 rounded-full w-6 h-6 items-center justify-center ml-2">
                <Text className="text-white text-xs font-bold">{item.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-12">
            <Text className="text-gray-500">No conversations yet</Text>
          </View>
        }
      />
    </View>
  );
}
