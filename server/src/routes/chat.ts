import { Router } from 'express';
import { randomUUID as uuid } from 'node:crypto';
import { db, persist } from '../db';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { toPublicConversation, toPublicMessage } from '../utils/serializers';

const router = Router();
router.use(requireAuth);

function findConversationOr404(conversationId: string, userId: string, res: import('express').Response) {
  const conversation = db.conversations.find((c) => c.id === conversationId);
  if (!conversation) {
    res.status(404).json({ message: 'Conversation not found' });
    return null;
  }
  if (!conversation.participants.includes(userId)) {
    res.status(403).json({ message: 'You are not a participant in this conversation' });
    return null;
  }
  return conversation;
}

router.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const conversations = db.conversations
      .filter((c) => c.participants.includes(userId))
      .map((c) => toPublicConversation(c, userId))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    res.json(conversations);
  })
);

router.post(
  '/conversations',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const participantIds: unknown = req.body?.participantIds;
    if (!Array.isArray(participantIds) || participantIds.some((id) => typeof id !== 'string')) {
      return res.status(400).json({ message: 'participantIds must be an array of user ids' });
    }

    const participants = Array.from(new Set([userId, ...(participantIds as string[])]));
    const unknownParticipant = participants.find((id) => !db.users.some((u) => u.id === id));
    if (unknownParticipant) {
      return res.status(400).json({ message: `Unknown user: ${unknownParticipant}` });
    }

    const now = new Date().toISOString();
    const conversation = {
      id: uuid(),
      participants,
      updatedAt: now,
      lastReadAt: { [userId]: now },
    };
    db.conversations.push(conversation);
    persist();

    res.status(201).json(toPublicConversation(conversation, userId));
  })
);

router.get(
  '/conversations/:id/messages',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const conversation = findConversationOr404(req.params.id, userId, res);
    if (!conversation) return;

    const messages = db.messages
      .filter((m) => m.conversationId === conversation.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((m) => toPublicMessage(m, userId));
    res.json(messages);
  })
);

router.post(
  '/conversations/:id/messages',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const conversation = findConversationOr404(req.params.id, userId, res);
    if (!conversation) return;

    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = {
      id: uuid(),
      conversationId: conversation.id,
      senderId: userId,
      content,
      createdAt: new Date().toISOString(),
    };
    db.messages.push(message);
    conversation.updatedAt = message.createdAt;
    conversation.lastReadAt[userId] = message.createdAt;
    persist();

    res.status(201).json(toPublicMessage(message, userId));
  })
);

router.post(
  '/conversations/:id/read',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const conversation = findConversationOr404(req.params.id, userId, res);
    if (!conversation) return;

    conversation.lastReadAt[userId] = new Date().toISOString();
    persist();
    res.status(204).send();
  })
);

router.delete(
  '/messages/:id',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const message = db.messages.find((m) => m.id === req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.senderId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    db.messages = db.messages.filter((m) => m.id !== message.id);
    persist();
    res.status(204).send();
  })
);

export default router;
