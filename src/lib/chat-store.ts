import { db } from '@/db/db';
import { SELF_ID } from '@/db/seed';
import type { Channel, ChannelType, Message, MessageAttachment } from '@/db/types';

const ONLINE = typeof navigator !== 'undefined' ? navigator.onLine : true;

function transition(id: string, status: Message['status'], delay: number, synced: 0 | 1): number {
  return window.setTimeout(
    () => {
      void db.messages.update(id, { status, synced, updatedAt: Date.now() });
    },
    delay
  );
}

export async function sendMessage(
  channelId: string,
  content: string,
  extra?: {
    linkedTaskId?: string | null;
    linkedEventId?: string | null;
    attachment?: MessageAttachment | null;
  }
): Promise<void> {
  const now = Date.now();
  const msg: Message = {
    id: crypto.randomUUID(),
    channelId,
    senderId: SELF_ID,
    content,
    status: 'pending',
    linkedTaskId: extra?.linkedTaskId ?? null,
    linkedEventId: extra?.linkedEventId ?? null,
    attachment: extra?.attachment ?? undefined,
    isDeleted: false,
    synced: 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.transaction('rw', db.messages, db.channels, async () => {
    await db.messages.put(msg);
    await db.channels.update(channelId, {
      lastMessageSnippet: content || (extra?.attachment ? 'Photo' : ''),
      lastMessageAt: now,
      updatedAt: now,
    });
  });

  if (!ONLINE) return;

  transition(msg.id, 'sent', 500, 1);
  transition(msg.id, 'delivered', 1500, 1);
  transition(msg.id, 'read', 3000, 1);
}

export async function markChannelRead(channelId: string): Promise<void> {
  await db.channels.update(channelId, { unreadCount: 0, updatedAt: Date.now() });
}

export async function setChannelUnread(channelId: string): Promise<void> {
  await db.channels.update(channelId, { unreadCount: 1, updatedAt: Date.now() });
}

export async function createChannel(input: {
  type: ChannelType;
  name: string;
  participantIds: string[];
  accent?: string;
  topic?: string;
}): Promise<Channel> {
  const now = Date.now();
  const channel: Channel = {
    id: crypto.randomUUID(),
    workspaceId: 'ws-local',
    type: input.type,
    name: input.name,
    avatarUrl: null,
    topic: input.topic?.trim() || null,
    participantIds: input.participantIds,
    lastMessageSnippet: null,
    lastMessageAt: null,
    unreadCount: 0,
    isArchived: false,
    isDeleted: false,
    synced: 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.channels.put(channel);
  if (input.accent) {
    await setChannelAccent(channel.id, input.accent);
  }
  return channel;
}

export async function setChannelAccent(channelId: string, accent: string): Promise<void> {
  const channel = await db.channels.get(channelId);
  if (!channel) return;
  await db.channels.update(channelId, { avatarUrl: `accent:${accent}`, updatedAt: Date.now() });
}

export async function setChannelArchived(channelId: string, isArchived: boolean): Promise<void> {
  await db.channels.update(channelId, { isArchived, updatedAt: Date.now() });
}

export async function clearChannelHistory(channelId: string): Promise<void> {
  const now = Date.now();
  await db.transaction('rw', db.channels, db.messages, async () => {
    const msgs = await db.messages.where('channelId').equals(channelId).toArray();
    await Promise.all(msgs.map((m) => db.messages.delete(m.id)));
    await db.channels.update(channelId, {
      lastMessageSnippet: null,
      lastMessageAt: null,
      updatedAt: now,
    });
  });
}

export async function deleteChannel(channelId: string): Promise<void> {
  const now = Date.now();
  await db.transaction('rw', db.channels, db.messages, async () => {
    await db.channels.update(channelId, { isDeleted: true, updatedAt: now });
    const msgs = await db.messages.where('channelId').equals(channelId).toArray();
    await Promise.all(msgs.map((m) => db.messages.update(m.id, { isDeleted: true, updatedAt: now })));
  });
}

export function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

const ACCENT_PAIRS: Record<string, [string, string]> = {
  indigo: ['from-indigo-500', 'to-violet-600'],
  amber: ['from-amber-400', 'to-orange-500'],
  teal: ['from-teal-500', 'to-emerald-600'],
  sky: ['from-sky-500', 'to-blue-600'],
  rose: ['from-rose-500', 'to-pink-600'],
  emerald: ['from-emerald-500', 'to-teal-600'],
};

export const ACCENT_OPTIONS = Object.keys(ACCENT_PAIRS);

export function avatarHues(id: string): [string, string] {
  if (id.startsWith('accent:')) {
    const key = id.slice('accent:'.length);
    if (ACCENT_PAIRS[key]) return ACCENT_PAIRS[key];
  }
  const pairs = Object.values(ACCENT_PAIRS);
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return pairs[Math.abs(hash) % pairs.length];
}
