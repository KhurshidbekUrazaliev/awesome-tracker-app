import apiClient from '@/services/apiClient';
import { Conversation, Message } from '../store/useChatStore';

class ChatService {
  async getConversations(): Promise<Conversation[]> {
    const response = await apiClient.get<Conversation[]>('/chat/conversations');
    return response.data;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await apiClient.get<Message[]>(`/chat/conversations/${conversationId}/messages`);
    return response.data;
  }

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await apiClient.post<Message>(`/chat/conversations/${conversationId}/messages`, {
      content,
    });
    return response.data;
  }

  async createConversation(participantIds: string[]): Promise<Conversation> {
    const response = await apiClient.post<Conversation>('/chat/conversations', {
      participantIds,
    });
    return response.data;
  }

  async markAsRead(conversationId: string): Promise<void> {
    await apiClient.post(`/chat/conversations/${conversationId}/read`);
  }

  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`/chat/messages/${messageId}`);
  }
}

export default new ChatService();
