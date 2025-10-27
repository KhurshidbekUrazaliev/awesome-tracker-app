import { Conversation } from '../store/useChatStore';

export function getConversationTitle(conversation: Conversation, currentUserId: string): string {
  // In a real app, you'd fetch participant names
  return `Conversation ${conversation.id.slice(0, 8)}`;
}

export function getTotalUnreadCount(conversations: Conversation[]): number {
  return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
}

export function sortConversationsByDate(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime();
    const dateB = new Date(b.updatedAt).getTime();
    return dateB - dateA;
  });
}
