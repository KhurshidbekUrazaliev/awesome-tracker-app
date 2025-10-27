import { useEffect, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import chatService from '../services/chatService';

export function useChat(conversationId?: string) {
  const {
    conversations,
    messages,
    setConversations,
    setMessages,
    addMessage,
    markAsRead,
  } = useChatStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
      chatService.markAsRead(conversationId);
      markAsRead(conversationId);
    }
  }, [conversationId]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      setIsLoading(true);
      const data = await chatService.getMessages(convId);
      setMessages(convId, data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!conversationId) return;
    
    try {
      const message = await chatService.sendMessage(conversationId, content);
      addMessage(message);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const conversationMessages = conversationId ? messages[conversationId] || [] : [];

  return {
    conversations,
    messages: conversationMessages,
    isLoading,
    error,
    sendMessage,
    refresh: loadConversations,
  };
}
