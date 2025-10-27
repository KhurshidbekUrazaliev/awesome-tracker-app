import { create } from 'zustand';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

interface ChatStore {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeConversation: string | null;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setActiveConversation: (id: string | null) => void;
  markAsRead: (conversationId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  messages: {},
  activeConversation: null,

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),

  addMessage: (message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [message.conversationId]: [
          ...(state.messages[message.conversationId] || []),
          message,
        ],
      },
    })),

  setActiveConversation: (id) => set({ activeConversation: id }),

  markAsRead: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ),
    })),
}));
