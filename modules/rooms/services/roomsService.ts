import apiClient from '@/services/apiClient';
import type { ChecklistEntry, Room, RoomItem, RoomItemType, RoomVisibility } from '../store/useRoomsStore';

export interface CreateRoomInput {
  name: string;
  description?: string;
  visibility: RoomVisibility;
}

export interface CreateRoomItemInput {
  type: RoomItemType;
  title: string;
  content?: string;
  url?: string;
  media?: string[];
  dueAt?: string;
  checklist?: ChecklistEntry[];
}

class RoomsService {
  async getMyRooms(): Promise<Room[]> {
    const response = await apiClient.get<Room[]>('/rooms/mine');
    return response.data;
  }

  async getDiscoverRooms(): Promise<Room[]> {
    const response = await apiClient.get<Room[]>('/rooms/discover');
    return response.data;
  }

  async getRoom(id: string): Promise<Room> {
    const response = await apiClient.get<Room>(`/rooms/${id}`);
    return response.data;
  }

  async createRoom(data: CreateRoomInput): Promise<Room> {
    const response = await apiClient.post<Room>('/rooms', data);
    return response.data;
  }

  async deleteRoom(id: string): Promise<void> {
    await apiClient.delete(`/rooms/${id}`);
  }

  async addMember(roomId: string, email: string): Promise<void> {
    await apiClient.post(`/rooms/${roomId}/members`, { email });
  }

  async removeMember(roomId: string, userId: string): Promise<void> {
    await apiClient.delete(`/rooms/${roomId}/members/${userId}`);
  }

  async getItems(roomId: string): Promise<RoomItem[]> {
    const response = await apiClient.get<RoomItem[]>(`/rooms/${roomId}/items`);
    return response.data;
  }

  async createItem(roomId: string, data: CreateRoomItemInput): Promise<RoomItem> {
    const response = await apiClient.post<RoomItem>(`/rooms/${roomId}/items`, data);
    return response.data;
  }

  async updateItem(roomId: string, itemId: string, data: Partial<CreateRoomItemInput>): Promise<RoomItem> {
    const response = await apiClient.patch<RoomItem>(`/rooms/${roomId}/items/${itemId}`, data);
    return response.data;
  }

  async deleteItem(roomId: string, itemId: string): Promise<void> {
    await apiClient.delete(`/rooms/${roomId}/items/${itemId}`);
  }
}

export default new RoomsService();
