import { useCallback, useEffect, useState } from 'react';
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

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [setConversations]);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      setIsLoading(true);
      const data = await chatService.getMessages(convId);
      setMessages(convId, data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [setMessages]);

  useEffect(() => {
    // loadConversations sets isLoading synchronously before its first await —
    // a standard fetch-on-mount pattern, not a cascading-render risk here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (conversationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadMessages(conversationId);
      chatService.markAsRead(conversationId);
      markAsRead(conversationId);
    }
  }, [conversationId, loadMessages, markAsRead]);

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
