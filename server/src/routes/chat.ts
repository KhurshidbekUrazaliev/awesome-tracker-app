import { Router } from 'express';
import { randomUUID as uuid } from 'node:crypto';
import {
  conversationExists,
  createConversation,
  createMessage,
  deleteMessage,
  findMessageById,
  isParticipant,
  listConversationsForUser,
  listMessages,
  markConversationRead,
} from '../db/chatRepo';
import { userExists } from '../db/usersRepo';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(requireAuth);

/** Resolves a conversation for the current user, or writes the appropriate error response. Returns whether the caller should proceed. */
async function assertMembership(
  conversationId: string,
  userId: string,
  res: import('express').Response
): Promise<boolean> {
  if (!(await conversationExists(conversationId))) {
    res.status(404).json({ message: 'Conversation not found' });
    return false;
  }
  if (!(await isParticipant(conversationId, userId))) {
    res.status(403).json({ message: 'You are not a participant in this conversation' });
    return false;
  }
  return true;
}

router.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    res.json(await listConversationsForUser(req.userId!));
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
    for (const id of participants) {
      if (!(await userExists(id))) {
        return res.status(400).json({ message: `Unknown user: ${id}` });
      }
    }

    const conversation = await createConversation(uuid(), participants);
    res.status(201).json(conversation);
  })
);

router.get(
  '/conversations/:id/messages',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    if (!(await assertMembership(req.params.id, userId, res))) return;
    res.json(await listMessages(req.params.id, userId));
  })
);

router.post(
  '/conversations/:id/messages',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    if (!(await assertMembership(req.params.id, userId, res))) return;

    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = await createMessage(uuid(), req.params.id, userId, content);
    res.status(201).json(message);
  })
);

router.post(
  '/conversations/:id/read',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    if (!(await assertMembership(req.params.id, userId, res))) return;

    await markConversationRead(req.params.id, userId);
    res.status(204).send();
  })
);

router.delete(
  '/messages/:id',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const message = await findMessageById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.senderId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    await deleteMessage(message.id);
    res.status(204).send();
  })
);

export default router;
