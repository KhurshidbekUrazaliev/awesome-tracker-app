import { Router } from 'express';
import { randomUUID as uuid } from 'node:crypto';
import { z } from 'zod';
import {
  addMember,
  canViewRoom,
  createItem,
  createRoom,
  deleteItem,
  deleteRoom,
  findItemRowById,
  findRoomRowById,
  getRoomById,
  listItems,
  listMembers,
  listPublicRooms,
  listRoomsByOwner,
  removeMember,
  ROOM_ITEM_TYPES,
  ROOM_VISIBILITIES,
  updateItem,
  updateRoom,
} from '../db/roomsRepo';
import { listBlockedIds } from '../db/safetyRepo';
import { findUserByEmail } from '../db/usersRepo';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(requireAuth);

const visibilitySchema = z.enum(ROOM_VISIBILITIES);
const itemTypeSchema = z.enum(ROOM_ITEM_TYPES);

const createRoomSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(2000).optional(),
  visibility: visibilitySchema,
});
const updateRoomSchema = createRoomSchema.partial();

const checklistEntrySchema = z.object({ text: z.string().trim().min(1).max(200), done: z.boolean() });

const createItemSchema = z.object({
  type: itemTypeSchema,
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().max(4000).optional(),
  url: z.string().url().optional(),
  media: z.array(z.string().url()).max(10).optional(),
  dueAt: z.string().datetime().optional(),
  checklist: z.array(checklistEntrySchema).max(50).optional(),
});
const updateItemSchema = createItemSchema.partial().omit({ type: true });

async function assertOwner(roomId: string, userId: string, res: import('express').Response): Promise<Awaited<ReturnType<typeof findRoomRowById>> | null> {
  const room = await findRoomRowById(roomId);
  if (!room) {
    res.status(404).json({ message: 'Room not found' });
    return null;
  }
  if (room.ownerId !== userId) {
    res.status(403).json({ message: 'Only the room owner can do this' });
    return null;
  }
  return room;
}

router.get(
  '/mine',
  asyncHandler(async (req, res) => {
    res.json(await listRoomsByOwner(req.userId!));
  })
);

router.get(
  '/discover',
  asyncHandler(async (req, res) => {
    const excludeOwnerIds = await listBlockedIds(req.userId!);
    res.json(await listPublicRooms(excludeOwnerIds));
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createRoomSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }
    const room = await createRoom({ id: uuid(), ownerId: req.userId!, ...parsed.data });
    res.status(201).json(room);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await findRoomRowById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Room not found' });
    if (!(await canViewRoom(row, req.userId!))) {
      return res.status(403).json({ message: 'You do not have access to this room' });
    }
    res.json(await getRoomById(req.params.id));
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!(await assertOwner(req.params.id, req.userId!, res))) return;
    const parsed = updateRoomSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }
    res.json(await updateRoom(req.params.id, parsed.data));
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!(await assertOwner(req.params.id, req.userId!, res))) return;
    await deleteRoom(req.params.id);
    res.status(204).send();
  })
);

router.get(
  '/:id/members',
  asyncHandler(async (req, res) => {
    if (!(await assertOwner(req.params.id, req.userId!, res))) return;
    res.json(await listMembers(req.params.id));
  })
);

router.post(
  '/:id/members',
  asyncHandler(async (req, res) => {
    const room = await assertOwner(req.params.id, req.userId!, res);
    if (!room) return;
    if (room.visibility !== 'shared') {
      return res.status(400).json({ message: 'Only shared rooms can have members added' });
    }
    const parsed = z.object({ email: z.string().email() }).safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }
    const user = await findUserByEmail(parsed.data.email);
    if (!user) return res.status(404).json({ message: 'No user found with that email' });

    await addMember(req.params.id, user.id);
    res.status(201).json({ message: 'Member added' });
  })
);

router.delete(
  '/:id/members/:userId',
  asyncHandler(async (req, res) => {
    if (!(await assertOwner(req.params.id, req.userId!, res))) return;
    await removeMember(req.params.id, req.params.userId);
    res.status(204).send();
  })
);

router.get(
  '/:id/items',
  asyncHandler(async (req, res) => {
    const room = await findRoomRowById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (!(await canViewRoom(room, req.userId!))) {
      return res.status(403).json({ message: 'You do not have access to this room' });
    }
    res.json(await listItems(req.params.id));
  })
);

router.post(
  '/:id/items',
  asyncHandler(async (req, res) => {
    if (!(await assertOwner(req.params.id, req.userId!, res))) return;
    const parsed = createItemSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }
    const { type, dueAt, ...rest } = parsed.data;
    if (type === 'link' && !rest.url) {
      return res.status(400).json({ message: 'url is required for link items' });
    }
    if ((type === 'reminder' || type === 'event') && !dueAt) {
      return res.status(400).json({ message: 'dueAt is required for reminder/event items' });
    }

    const item = await createItem({
      id: uuid(),
      roomId: req.params.id,
      type,
      ...rest,
      dueAt: dueAt ? new Date(dueAt) : undefined,
    });
    res.status(201).json(item);
  })
);

router.patch(
  '/:id/items/:itemId',
  asyncHandler(async (req, res) => {
    if (!(await assertOwner(req.params.id, req.userId!, res))) return;
    const item = await findItemRowById(req.params.itemId);
    if (!item || item.roomId !== req.params.id) return res.status(404).json({ message: 'Item not found' });

    const parsed = updateItemSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }
    const { dueAt, ...rest } = parsed.data;
    res.json(await updateItem(req.params.itemId, { ...rest, dueAt: dueAt ? new Date(dueAt) : undefined }));
  })
);

router.delete(
  '/:id/items/:itemId',
  asyncHandler(async (req, res) => {
    if (!(await assertOwner(req.params.id, req.userId!, res))) return;
    const item = await findItemRowById(req.params.itemId);
    if (!item || item.roomId !== req.params.id) return res.status(404).json({ message: 'Item not found' });
    await deleteItem(req.params.itemId);
    res.status(204).send();
  })
);

export default router;
