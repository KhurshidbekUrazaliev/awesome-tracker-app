import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';

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
    <View className="flex-row items-center px-4 py-3 border-t border-gray-200 bg-white">
      <TextInput
        className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-base"
        placeholder="Type a message..."
        value={message}
        onChangeText={setMessage}
        multiline
        maxLength={500}
        editable={!disabled}
      />
      <TouchableOpacity
        className={`ml-2 px-4 py-2 rounded-full ${
          message.trim() && !disabled ? 'bg-primary-600' : 'bg-gray-300'
        }`}
        onPress={handleSend}
        disabled={!message.trim() || disabled}
      >
        <Text className="text-white font-semibold">Send</Text>
      </TouchableOpacity>
    </View>
  );
}
