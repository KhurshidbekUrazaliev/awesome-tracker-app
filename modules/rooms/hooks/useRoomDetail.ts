import { useCallback, useEffect, useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useRoomsStore, type Room } from '../store/useRoomsStore';
import roomsService, { type CreateRoomItemInput } from '../services/roomsService';

export function useRoomDetail(roomId: string) {
  const { user } = useUserStore();
  const { itemsByRoom, setItems, addItem, updateItemInStore, removeItem } = useRoomsStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = !!(room && user && room.ownerId === user.id);
  const items = itemsByRoom[roomId] || [];

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [roomData, itemsData] = await Promise.all([roomsService.getRoom(roomId), roomsService.getItems(roomId)]);
      setRoom(roomData);
      setItems(roomId, itemsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load room');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const createItem = async (data: CreateRoomItemInput) => {
    const item = await roomsService.createItem(roomId, data);
    addItem(item);
    return item;
  };

  const toggleChecklistEntry = async (item: (typeof items)[number], index: number) => {
    const checklist = (item.checklist || []).map((entry, i) => (i === index ? { ...entry, done: !entry.done } : entry));
    const updated = await roomsService.updateItem(roomId, item.id, { checklist });
    updateItemInStore(updated);
  };

  const deleteItem = async (itemId: string) => {
    await roomsService.deleteItem(roomId, itemId);
    removeItem(roomId, itemId);
  };

  return {
    room,
    isOwner,
    items,
    isLoading,
    error,
    createItem,
    toggleChecklistEntry,
    deleteItem,
    refresh: load,
  };
}
