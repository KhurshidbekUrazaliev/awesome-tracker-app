import { and, desc, eq, gt, inArray, ne, sql } from 'drizzle-orm';
import { db } from './client';
import { conversationParticipants, conversations, messages } from './schema';

export interface PublicMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read?: true;
}

export interface PublicConversation {
  id: string;
  participants: string[];
  lastMessage?: PublicMessage;
  unreadCount: number;
  updatedAt: string;
}

function toPublicMessage(row: typeof messages.$inferSelect, viewerId: string): PublicMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    read: row.senderId === viewerId ? true : undefined,
  };
}

export async function listConversationsForUser(userId: string): Promise<PublicConversation[]> {
  const memberships = await db
    .select({ id: conversations.id, updatedAt: conversations.updatedAt })
    .from(conversations)
    .innerJoin(
      conversationParticipants,
      and(eq(conversationParticipants.conversationId, conversations.id), eq(conversationParticipants.userId, userId))
    )
    .orderBy(desc(conversations.updatedAt));

  if (memberships.length === 0) return [];
  const conversationIds = memberships.map((m) => m.id);

  const [participantRows, lastMessages, unreadRows] = await Promise.all([
    db
      .select({ conversationId: conversationParticipants.conversationId, userId: conversationParticipants.userId })
      .from(conversationParticipants)
      .where(inArray(conversationParticipants.conversationId, conversationIds)),

    db
      .selectDistinctOn([messages.conversationId])
      .from(messages)
      .where(inArray(messages.conversationId, conversationIds))
      .orderBy(messages.conversationId, desc(messages.createdAt)),

    db
      .select({ conversationId: messages.conversationId, count: sql<number>`count(*)::int` })
      .from(messages)
      .innerJoin(
        conversationParticipants,
        and(eq(conversationParticipants.conversationId, messages.conversationId), eq(conversationParticipants.userId, userId))
      )
      .where(
        and(
          inArray(messages.conversationId, conversationIds),
          ne(messages.senderId, userId),
          gt(messages.createdAt, conversationParticipants.lastReadAt)
        )
      )
      .groupBy(messages.conversationId),
  ]);

  const participantsByConv = new Map<string, string[]>();
  for (const row of participantRows) {
    const list = participantsByConv.get(row.conversationId) ?? [];
    list.push(row.userId);
    participantsByConv.set(row.conversationId, list);
  }

  const lastMessageByConv = new Map(lastMessages.map((m) => [m.conversationId, m]));

  const unreadByConv = new Map(unreadRows.map((r) => [r.conversationId, r.count]));

  return memberships.map((m) => {
    const lastMessage = lastMessageByConv.get(m.id);
    return {
      id: m.id,
      participants: participantsByConv.get(m.id) ?? [],
      lastMessage: lastMessage ? toPublicMessage(lastMessage, userId) : undefined,
      unreadCount: unreadByConv.get(m.id) ?? 0,
      updatedAt: m.updatedAt.toISOString(),
    };
  });
}

export async function isParticipant(conversationId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, userId)))
    .limit(1);
  return !!row;
}

export async function conversationExists(conversationId: string): Promise<boolean> {
  const [row] = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  return !!row;
}

export async function createConversation(id: string, participantIds: string[]): Promise<PublicConversation> {
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(conversations).values({ id, updatedAt: now });
    await tx.insert(conversationParticipants).values(
      participantIds.map((userId) => ({ conversationId: id, userId, lastReadAt: now }))
    );
  });
  return { id, participants: participantIds, unreadCount: 0, updatedAt: now.toISOString() };
}

export async function listMessages(conversationId: string, viewerId: string): Promise<PublicMessage[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
  return rows.map((r) => toPublicMessage(r, viewerId));
}

export async function createMessage(
  id: string,
  conversationId: string,
  senderId: string,
  content: string
): Promise<PublicMessage> {
  const now = new Date();
  const [row] = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(messages)
      .values({ id, conversationId, senderId, content, createdAt: now })
      .returning();
    await tx.update(conversations).set({ updatedAt: now }).where(eq(conversations.id, conversationId));
    await tx
      .update(conversationParticipants)
      .set({ lastReadAt: now })
      .where(and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, senderId)));
    return inserted;
  });
  return toPublicMessage(row, senderId);
}

export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  await db
    .update(conversationParticipants)
    .set({ lastReadAt: new Date() })
    .where(and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, userId)));
}

export async function findMessageById(id: string) {
  const [row] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  return row;
}

export async function deleteMessage(id: string): Promise<void> {
  await db.delete(messages).where(eq(messages.id, id));
}
