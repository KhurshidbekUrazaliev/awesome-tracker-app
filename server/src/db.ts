import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  avatar?: string;
  createdAt: string;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface ConversationRecord {
  id: string;
  participants: string[];
  updatedAt: string;
  /** Per-user last-read timestamp, used to compute unreadCount. Not exposed to clients. */
  lastReadAt: Record<string, string>;
}

interface DbShape {
  users: UserRecord[];
  conversations: ConversationRecord[];
  messages: MessageRecord[];
}

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function loadDb(): DbShape {
  if (!fs.existsSync(DB_PATH)) {
    return { users: [], conversations: [], messages: [] };
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return raw.trim() ? JSON.parse(raw) : { users: [], conversations: [], messages: [] };
}

const db: DbShape = loadDb();

function persist() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export { db, persist };
