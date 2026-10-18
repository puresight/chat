export type ChannelType = 'direct' | 'group';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read';

export interface MessageAttachment {
  type: 'image';
  data: string;
  name: string;
  size: number;
}

export interface PendingAttachment {
  data: string;
  name: string;
  size: number;
}

export interface Channel {
  id: string;
  workspaceId: string;
  type: ChannelType;
  name: string;
  avatarUrl: string | null;
  topic?: string | null;
  participantIds: string[];
  lastMessageSnippet: string | null;
  lastMessageAt: number | null;
  unreadCount: number;
  isArchived: boolean;
  isDeleted: boolean;
  synced: 0 | 1;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  status: MessageStatus;
  attachment?: MessageAttachment;
  linkedTaskId: string | null;
  linkedEventId: string | null;
  isDeleted: boolean;
  synced: 0 | 1;
  createdAt: number;
  updatedAt: number;
}

export interface Participant {
  id: string;
  name: string;
  role: string;
}
