import React from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useChat } from '@/modules/chat/hooks/useChat';
import MessageBubble from '@/modules/chat/components/MessageBubble';
import ChatInput from '@/modules/chat/components/ChatInput';
import Loader from '@/components/Loader';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { messages, isLoading, sendMessage } = useChat(id);

  const handleSend = async (content: string) => {
    await sendMessage(content);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Conversation', headerShown: true }} />
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        {isLoading && messages.length === 0 ? (
          <Loader fullScreen text="Loading messages..." />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerClassName="px-4 py-4"
            inverted={false}
          />
        )}
        
        <ChatInput onSend={handleSend} />
      </KeyboardAvoidingView>
    </>
  );
}
