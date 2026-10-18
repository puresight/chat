import Dexie, { type Table } from 'dexie';
import type { Channel, Message } from './types';
import { buildSeedData } from './seed';

export class ChatDatabase extends Dexie {
  channels!: Table<Channel, string>;
  messages!: Table<Message, string>;

  constructor() {
    super('AppChatDB');
    this.version(2).stores({
      channels: 'id, workspaceId, type, lastMessageAt, isArchived, isDeleted, *participantIds',
      messages: 'id, channelId, senderId, status, createdAt, isDeleted, [channelId+createdAt]',
    });
  }
}

export const db = new ChatDatabase();

let seedChecked = false;

export async function ensureSeeded(): Promise<void> {
  if (seedChecked) return;
  seedChecked = true;
  const anyChannel = await db.channels.limit(1).toArray();
  if (anyChannel.length === 0) {
    const { channels, messages } = buildSeedData();
    await db.transaction('rw', db.channels, db.messages, async () => {
      await db.channels.bulkPut(channels);
      await db.messages.bulkPut(messages);
    });
  }
}
