import { create } from 'zustand';
import type { User as PublicUser } from '@/store/useUserStore';

export const ROOM_VISIBILITIES = ['private', 'shared', 'public'] as const;
export type RoomVisibility = (typeof ROOM_VISIBILITIES)[number];

export const ROOM_VISIBILITY_LABELS: Record<RoomVisibility, string> = {
  private: 'Private',
  shared: 'Shared',
  public: 'Public',
};

export const ROOM_ITEM_TYPES = ['note', 'link', 'reminder', 'event', 'wish', 'moment', 'plan'] as const;
export type RoomItemType = (typeof ROOM_ITEM_TYPES)[number];

export const ROOM_ITEM_TYPE_LABELS: Record<RoomItemType, string> = {
  note: 'Note',
  link: 'Link',
  reminder: 'Reminder',
  event: 'Event',
  wish: 'Wish',
  moment: 'Moment',
  plan: 'Plan',
};

export interface ChecklistEntry {
  text: string;
  done: boolean;
}

export interface Room {
  id: string;
  ownerId: string;
  owner?: PublicUser;
  name: string;
  description?: string;
  visibility: RoomVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface RoomItem {
  id: string;
  roomId: string;
  type: RoomItemType;
  title: string;
  content?: string;
  url?: string;
  media: string[];
  dueAt?: string;
  checklist?: ChecklistEntry[];
  createdAt: string;
  updatedAt: string;
}

/** A reminder/event item, with its room's name attached — for the cross-room calendar view. */
export interface CalendarItem extends RoomItem {
  roomName: string;
}

interface RoomsStore {
  myRooms: Room[];
  discoverRooms: Room[];
  itemsByRoom: Record<string, RoomItem[]>;
  setMyRooms: (rooms: Room[]) => void;
  setDiscoverRooms: (rooms: Room[]) => void;
  upsertMyRoom: (room: Room) => void;
  removeMyRoom: (id: string) => void;
  setItems: (roomId: string, items: RoomItem[]) => void;
  addItem: (item: RoomItem) => void;
  updateItemInStore: (item: RoomItem) => void;
  removeItem: (roomId: string, itemId: string) => void;
}

export const useRoomsStore = create<RoomsStore>((set) => ({
  myRooms: [],
  discoverRooms: [],
  itemsByRoom: {},

  setMyRooms: (myRooms) => set({ myRooms }),
  setDiscoverRooms: (discoverRooms) => set({ discoverRooms }),

  upsertMyRoom: (room) =>
    set((state) => {
      const exists = state.myRooms.some((r) => r.id === room.id);
      return {
        myRooms: exists ? state.myRooms.map((r) => (r.id === room.id ? room : r)) : [room, ...state.myRooms],
      };
    }),

  removeMyRoom: (id) => set((state) => ({ myRooms: state.myRooms.filter((r) => r.id !== id) })),

  setItems: (roomId, items) => set((state) => ({ itemsByRoom: { ...state.itemsByRoom, [roomId]: items } })),

  addItem: (item) =>
    set((state) => ({
      itemsByRoom: {
        ...state.itemsByRoom,
        [item.roomId]: [item, ...(state.itemsByRoom[item.roomId] || [])],
      },
    })),

  updateItemInStore: (item) =>
    set((state) => ({
      itemsByRoom: {
        ...state.itemsByRoom,
        [item.roomId]: (state.itemsByRoom[item.roomId] || []).map((i) => (i.id === item.id ? item : i)),
      },
    })),

  removeItem: (roomId, itemId) =>
    set((state) => ({
      itemsByRoom: {
        ...state.itemsByRoom,
        [roomId]: (state.itemsByRoom[roomId] || []).filter((i) => i.id !== itemId),
      },
    })),
}));
