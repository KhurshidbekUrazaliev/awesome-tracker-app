import { useCallback, useEffect, useState } from 'react';
import { useRoomsStore } from '../store/useRoomsStore';
import roomsService, { type CreateRoomInput } from '../services/roomsService';

export function useRooms(mode: 'mine' | 'discover') {
  const { myRooms, discoverRooms, setMyRooms, setDiscoverRooms, upsertMyRoom, removeMyRoom } = useRoomsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (mode === 'mine') {
        setMyRooms(await roomsService.getMyRooms());
      } else {
        setDiscoverRooms(await roomsService.getDiscoverRooms());
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const createRoom = async (data: CreateRoomInput) => {
    const room = await roomsService.createRoom(data);
    upsertMyRoom(room);
    return room;
  };

  const deleteRoom = async (id: string) => {
    await roomsService.deleteRoom(id);
    removeMyRoom(id);
  };

  return {
    rooms: mode === 'mine' ? myRooms : discoverRooms,
    isLoading,
    error,
    createRoom,
    deleteRoom,
    refresh: load,
  };
}
