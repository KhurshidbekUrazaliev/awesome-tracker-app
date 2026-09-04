import { ConversationRecord, MessageRecord, UserRecord, db } from '../db';

export function toPublicUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
}

export function toPublicMessage(message: MessageRecord, viewerId: string) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    content: message.content,
    createdAt: message.createdAt,
    read: message.senderId === viewerId ? true : undefined,
  };
}

export function unreadCountFor(conversation: ConversationRecord, userId: string): number {
  const lastReadAt = conversation.lastReadAt[userId] ?? '1970-01-01T00:00:00.000Z';
  return db.messages.filter(
    (m) =>
      m.conversationId === conversation.id &&
      m.senderId !== userId &&
      m.createdAt > lastReadAt
  ).length;
}

export function toPublicConversation(conversation: ConversationRecord, viewerId: string) {
  const conversationMessages = db.messages
    .filter((m) => m.conversationId === conversation.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const lastMessage = conversationMessages[conversationMessages.length - 1];

  return {
    id: conversation.id,
    participants: conversation.participants,
    lastMessage: lastMessage ? toPublicMessage(lastMessage, viewerId) : undefined,
    unreadCount: unreadCountFor(conversation, viewerId),
    updatedAt: conversation.updatedAt,
  };
}
