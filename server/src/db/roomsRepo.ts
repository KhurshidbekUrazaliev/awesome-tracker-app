import { and, desc, eq, inArray, isNotNull, notInArray } from 'drizzle-orm';
import { db } from './client';
import { roomItems, roomMembers, rooms, users } from './schema';
import { toPublicUser, type PublicUser } from './usersRepo';

export const ROOM_VISIBILITIES = ['private', 'shared', 'public'] as const;
export type RoomVisibility = (typeof ROOM_VISIBILITIES)[number];

export const ROOM_ITEM_TYPES = ['note', 'link', 'reminder', 'event', 'wish', 'moment', 'plan'] as const;
export type RoomItemType = (typeof ROOM_ITEM_TYPES)[number];

export interface ChecklistEntry {
  text: string;
  done: boolean;
}

export interface PublicRoom {
  id: string;
  ownerId: string;
  owner?: PublicUser;
  name: string;
  description?: string;
  visibility: RoomVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface PublicRoomItem {
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

function toPublicRoom(row: typeof rooms.$inferSelect, owner?: typeof users.$inferSelect): PublicRoom {
  return {
    id: row.id,
    ownerId: row.ownerId,
    owner: owner ? toPublicUser(owner) : undefined,
    name: row.name,
    description: row.description ?? undefined,
    visibility: row.visibility as RoomVisibility,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPublicRoomItem(row: typeof roomItems.$inferSelect): PublicRoomItem {
  return {
    id: row.id,
    roomId: row.roomId,
    type: row.type as RoomItemType,
    title: row.title,
    content: row.content ?? undefined,
    url: row.url ?? undefined,
    media: row.media,
    dueAt: row.dueAt ? row.dueAt.toISOString() : undefined,
    checklist: (row.checklist as ChecklistEntry[] | null) ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listRoomsByOwner(ownerId: string): Promise<PublicRoom[]> {
  const rows = await db.select().from(rooms).where(eq(rooms.ownerId, ownerId)).orderBy(desc(rooms.updatedAt));
  return rows.map((r) => toPublicRoom(r));
}

export async function listPublicRooms(excludeOwnerIds: string[]): Promise<PublicRoom[]> {
  const conditions = [eq(rooms.visibility, 'public')];
  if (excludeOwnerIds.length) conditions.push(notInArray(rooms.ownerId, excludeOwnerIds));

  const rows = await db
    .select()
    .from(rooms)
    .innerJoin(users, eq(rooms.ownerId, users.id))
    .where(and(...conditions))
    .orderBy(desc(rooms.updatedAt));
  return rows.map((r) => toPublicRoom(r.rooms, r.users));
}

export async function getRoomById(id: string): Promise<PublicRoom | undefined> {
  const [row] = await db
    .select()
    .from(rooms)
    .innerJoin(users, eq(rooms.ownerId, users.id))
    .where(eq(rooms.id, id))
    .limit(1);
  return row ? toPublicRoom(row.rooms, row.users) : undefined;
}

export async function findRoomRowById(id: string) {
  const [row] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
  return row;
}

export interface CreateRoomInput {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  visibility: RoomVisibility;
}

export async function createRoom(input: CreateRoomInput): Promise<PublicRoom> {
  const now = new Date();
  const [row] = await db
    .insert(rooms)
    .values({ ...input, createdAt: now, updatedAt: now })
    .returning();
  return toPublicRoom(row);
}

export interface UpdateRoomInput {
  name?: string;
  description?: string;
  visibility?: RoomVisibility;
}

export async function updateRoom(id: string, updates: UpdateRoomInput): Promise<PublicRoom | undefined> {
  const [row] = await db
    .update(rooms)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(rooms.id, id))
    .returning();
  return row ? toPublicRoom(row) : undefined;
}

export async function deleteRoom(id: string): Promise<void> {
  await db.delete(rooms).where(eq(rooms.id, id));
}

export async function addMember(roomId: string, userId: string): Promise<void> {
  await db.insert(roomMembers).values({ roomId, userId }).onConflictDoNothing();
}

export async function removeMember(roomId: string, userId: string): Promise<void> {
  await db.delete(roomMembers).where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)));
}

export async function isMember(roomId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ roomId: roomMembers.roomId })
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
    .limit(1);
  return !!row;
}

export interface RoomMember {
  user: PublicUser;
  addedAt: string;
}

export async function listMembers(roomId: string): Promise<RoomMember[]> {
  const rows = await db
    .select()
    .from(roomMembers)
    .innerJoin(users, eq(roomMembers.userId, users.id))
    .where(eq(roomMembers.roomId, roomId));
  return rows.map((r) => ({ user: toPublicUser(r.users), addedAt: r.room_members.addedAt.toISOString() }));
}

/** Whether viewerId may view this room's contents — the owner always can. */
export async function canViewRoom(room: { id: string; ownerId: string; visibility: string }, viewerId: string): Promise<boolean> {
  if (room.ownerId === viewerId) return true;
  if (room.visibility === 'public') return true;
  if (room.visibility === 'shared') return isMember(room.id, viewerId);
  return false;
}

export async function listItems(roomId: string): Promise<PublicRoomItem[]> {
  const rows = await db.select().from(roomItems).where(eq(roomItems.roomId, roomId)).orderBy(desc(roomItems.createdAt));
  return rows.map(toPublicRoomItem);
}

export interface CalendarItem extends PublicRoomItem {
  roomName: string;
}

/** Every reminder/event across all rooms the user owns, for the cross-room calendar view. */
export async function listCalendarItemsForOwner(ownerId: string): Promise<CalendarItem[]> {
  const rows = await db
    .select()
    .from(roomItems)
    .innerJoin(rooms, eq(roomItems.roomId, rooms.id))
    .where(and(eq(rooms.ownerId, ownerId), inArray(roomItems.type, ['reminder', 'event']), isNotNull(roomItems.dueAt)))
    .orderBy(roomItems.dueAt);
  return rows.map((r) => ({ ...toPublicRoomItem(r.room_items), roomName: r.rooms.name }));
}

export async function findItemRowById(id: string) {
  const [row] = await db.select().from(roomItems).where(eq(roomItems.id, id)).limit(1);
  return row;
}

export interface CreateRoomItemInput {
  id: string;
  roomId: string;
  type: RoomItemType;
  title: string;
  content?: string;
  url?: string;
  media?: string[];
  dueAt?: Date;
  checklist?: ChecklistEntry[];
}

export async function createItem(input: CreateRoomItemInput): Promise<PublicRoomItem> {
  const now = new Date();
  const [row] = await db
    .insert(roomItems)
    .values({ ...input, media: input.media ?? [], createdAt: now, updatedAt: now })
    .returning();
  return toPublicRoomItem(row);
}

export interface UpdateRoomItemInput {
  title?: string;
  content?: string;
  url?: string;
  media?: string[];
  dueAt?: Date;
  checklist?: ChecklistEntry[];
}

export async function updateItem(id: string, updates: UpdateRoomItemInput): Promise<PublicRoomItem | undefined> {
  const [row] = await db
    .update(roomItems)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(roomItems.id, id))
    .returning();
  return row ? toPublicRoomItem(row) : undefined;
}

export async function deleteItem(id: string): Promise<void> {
  await db.delete(roomItems).where(eq(roomItems.id, id));
}
