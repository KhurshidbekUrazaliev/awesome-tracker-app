import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import Text from '@/components/Text';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <View className="flex-row items-center px-4 py-3 border-t border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-900">
      <TextInput
        className="flex-1 bg-gray-100 dark:bg-navy-800 text-gray-900 dark:text-white rounded-full px-4 py-2 text-base"
        placeholder="Type a message..."
        placeholderTextColor="#93A08F"
        value={message}
        onChangeText={setMessage}
        multiline
        maxLength={500}
        editable={!disabled}
      />
      <TouchableOpacity
        className={`ml-2 px-4 py-2 rounded-full ${
          message.trim() && !disabled ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-300 dark:bg-navy-700'
        }`}
        onPress={handleSend}
        disabled={!message.trim() || disabled}
      >
        <Text className="text-white font-semibold">Send</Text>
      </TouchableOpacity>
    </View>
  );
}
