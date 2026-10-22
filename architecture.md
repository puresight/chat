# Chat Application Architecture Specification

## 0. Status: Done vs. TODO

### Done (Prompted & Architected)

- **Local-First Core & Storage Engine:**
- Client-side relational persistence defined in Dexie.js (`AppChatDB`) with tables for `channels` and `messages`.
- Conflict-free UUID primary keys (`crypto.randomUUID()`) paired with `workspaceId`, `createdAt`, `updatedAt`, `isDeleted` (soft-delete tombstones), and `synced` flags.
- Autonomous, offline-ready operation without external authentication dependencies.
- Initial seed dataset populated with 1:1 direct messages, a multi-participant group channel, and an attachment placeholder thread.

- **PWA Scaffolding & Installability:**
- Progressive Web App manifest (`manifest.webmanifest`) configured with standalone display mode, theme colors, and icon definitions.
- Mobile viewport configuration enforcing `viewport-fit=cover`.
- Service worker caching strategy specified for offline application shell booting.

- **UI/UX & Color System:**
- Responsive dual-layout: Split two-pane directory on desktop (`>= 768px`) and slide-over conversation stream on mobile (`< 768px`) with back-navigation.
- Vibrant triad color system: Deep Indigo primary (`#4f46e5` / `#6366f1`), Zesty Amber accent (`#f59e0b` / `#d97706`), and Emerald presence/delivery indicators (`#10b981`).
- Material 3 surface container elevation tokens (`slate-50` through `slate-950`).
- 3-state unified Theme Provider (Light, Dark, System) with media query listeners.
- Touch target compliance ($48\text{px} \times 48\text{px}$) and safe-area inset protection (`pb-safe`) for mobile virtual keyboards and gesture bars.

- **Messaging & Delivery Semantics:**
- Optimistic message dispatch with immediate append to IndexedDB.
- Multi-stage delivery status progression: `pending` (clock) $\rightarrow$ `sent` (single check) $\rightarrow$ `delivered` (double check) $\rightarrow$ `read` (colored double check).
- Grouped chronological streams with relative date dividers ("Today", "Yesterday").
- Markdown body parsing (bold, italics, code spans, code blocks) and auto-linked URLs.

- **Interactive Channel & Attachment Management:**
- Channel creation modal supporting 1:1 Direct Messages and multi-participant Group Channels.
- Conversation management actions: Mark read/unread, archive channel, clear history, and soft delete.
- Dual-hue fallback gradient avatar generation derived deterministically from initials.
- Client-side media upload handling (JPEG, PNG, WebP) with inline thumbnail previews and lightbox zoom.
- Unified search filtering across channel headers and full message text history.

- **Cross-Suite Entity Embeds:**
- Task card attachment component resolving Kanban stems (`exo-...`) with status pills and action links.
- Event card attachment component embedding Calendar milestone details.

### TODO (Implementation Remaining)

- **Cloudflare Edge Deployment:**
- Cloudflare Worker API router using Hono (`/api/chat/channels`, `/api/chat/messages`, `/api/chat/sync`) to serve assets and handle sync payloads.
- D1 SQLite table creation and database schema migrations.

- **Real-Time Edge Transport (WebSockets / SSE):**
- Integration with Cloudflare Durable Objects or Workers WebSockets for low-latency bidirectional message relay between active clients.

- **Federated Bridge Adapters (Backend Gateway):**
- Edge-based Matrix bridge connector interfacing with homeservers (Synapse, Conduit, Dendrite) via the Matrix Client-Server API.
- Background synchronization daemon running the `/sync` loop and translating `m.room.message` events into local schema records.
- Appservice bridge integration for decentralized bridging into external proprietary networks (WhatsApp, Signal, IRC).

- **Cross-Database Suite Handshakes:**
- Active client-side queries resolving participant contact UUIDs live against the CRM database (`AppCRMDB` / `iLifeCRMDB`).
- Live cross-referencing of attached Kanban cards (`iLifeKanbanDB`) and Calendar milestones (`iLifeCalendarDB`).

- **Web Push Notifications:**
- Service worker push event listener and edge VAPID push service dispatching background notifications when the PWA is inactive.

---

## 1. System Overview

The Chat application is an edge-native, local-first communication tool designed for real-time interpersonal messaging, group collaboration, and automated workflow notifications.

The application adheres strictly to an offline-first model: the browser client operates autonomously, treating IndexedDB via Dexie.js as its immediate datastore. Message authoring and channel updates occur optimistically on the client, with real-time distribution and multi-device persistence managed by an edge-hosted relay engine and remote SQLite storage (Cloudflare D1).

---

## 2. Data Models & Schemas

### Client-Side IndexedDB Schema (TypeScript / Dexie.js)

```typescript
import Dexie, { type Table } from "dexie";

export type MessageStatus = "pending" | "sent" | "delivered" | "read";
export type ChannelType = "direct" | "group";

export interface ChatAttachment {
  id: string;
  type: "image" | "file";
  name: string;
  size: number;
  mimeType: string;
  dataUrl?: string; // Stored inline or in ObjectStore
}

export interface ChatChannel {
  id: string; // UUID
  workspaceId: string; // e.g. "ws-local-default"
  type: ChannelType;
  name?: string; // Omitted for 1:1 direct messages (derived from participant)
  avatarUrl?: string;
  participantIds: string[]; // Contact UUIDs or user identity strings
  lastMessageSnippet?: string;
  lastMessageAt: number;
  unreadCount: number;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
  isDeleted: boolean; // Soft delete tombstone
  synced: number; // 0 = pending sync, 1 = synced
}

export interface ChatMessage {
  id: string; // UUID
  channelId: string;
  senderId: string; // 'self' or Contact UUID
  content: string; // Plain text or Markdown
  status: MessageStatus;

  // Media & Suite Embeds
  attachment?: ChatAttachment | null;
  linkedTaskId?: string; // Kanban card stem (e.g. exo-01jk...)
  linkedEventId?: string; // Calendar event UUID

  createdAt: number;
  updatedAt: number;
  isDeleted: boolean;
  synced: number;
}

export class ChatDatabase extends Dexie {
  channels!: Table<ChatChannel, string>;
  messages!: Table<ChatMessage, string>;

  constructor() {
    super("AppChatDB");
    this.version(1).stores({
      channels:
        "id, workspaceId, type, lastMessageAt, isArchived, isDeleted, synced",
      messages:
        "id, channelId, senderId, createdAt, status, isDeleted, synced, [channelId+createdAt]",
    });
  }
}

export const chatDb = new ChatDatabase();
```

### Relational D1 Schema (Cloudflare SQLite)

```sql
CREATE TABLE chat_channels (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
    name TEXT,
    avatar_url TEXT,
    participant_ids JSON DEFAULT '[]',
    last_message_snippet TEXT,
    last_message_at INTEGER NOT NULL DEFAULT (unixepoch()),
    unread_count INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    is_deleted INTEGER NOT NULL DEFAULT 0,
    synced INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read')),
    attachment JSON,
    linked_task_id TEXT,
    linked_event_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    is_deleted INTEGER NOT NULL DEFAULT 0,
    synced INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_chat_channels_timeline ON chat_channels(workspace_id, is_archived, last_message_at DESC);
CREATE INDEX idx_chat_messages_stream ON chat_messages(channel_id, created_at ASC);
CREATE INDEX idx_chat_messages_sync ON chat_messages(workspace_id, updated_at);

```

---

## 3. UI/UX Architecture & Responsive Layout

### Responsive Shell & Viewport Adaptation

- **Desktop Viewport (`>= 768px`):**
- Persistent two-pane split interface.
- Left pane ($320\text{px} - 380\text{px}$): Sticky header with search, channel filter tabs, conversation list items with avatar initials and unread badges, and primary action controls.
- Right pane (remaining width): Dedicated channel header with presence indicator, chronological message history viewport with auto-scroll lock, and expanding composer bar.

- **Mobile Viewport (`< 768px`):**
- Single-pane progressive disclosure.
- Default screen displays the conversation directory with the bottom navigation bar and floating action button.
- Tapping a conversation performs a smooth horizontal slide transition to the active thread, replacing bottom navigation with a pinned composer and swapping the header for an in-chat navigation bar featuring a back-navigation chevron.

### Interaction & Touch Target Standards

- **Input Composer Ergonomics:** Fixed-position bottom composer utilizes dynamic safe-area insets (`env(safe-area-inset-bottom)`) to prevent occlusion by operating system home bars.
- **Touch Targets:** All interactive triggers, channel items, attachment menus, and send buttons strictly enforce a minimum tap dimension of $48\text{px} \times 48\text{px}$.
- **Optimistic Local Dispatch:** Pressing Enter without Shift initiates an immediate append to `AppChatDB.messages` with status `'pending'`, refreshing the message timeline instantly without awaiting network acknowledgment.

---

## 4. Message Transport, Delivery, & Federation

### Transport & Storage Split

To balance zero-latency local interactions with cross-network synchronization, transport logic is decoupled from local data presentation:

1. **Local Authoring:** The client commits drafts directly to IndexedDB.
2. **Edge Distribution:** Active WebSocket connections or Server-Sent Events (SSE) relay outbound messages to Cloudflare Workers, writing the canonical payload to Cloudflare D1.
3. **Delivery Feedback:** The edge acknowledges receipt, stepping local message state from `'pending'` to `'sent'`. Client read receipts and delivery confirmations advance status to `'delivered'` and `'read'`.

### Federated Matrix Bridge Architecture

External messaging networks (such as WhatsApp, Signal, or decentralized federation) are bridged at the **edge backend level**, isolating the client application from protocol-specific overhead:

- **Backend Matrix Daemon:** An edge service maintains homeserver authentication, long-polling sync loops (`/sync`), and service bridge credentials out-of-band.
- **Payload Normalization:** Matrix room events (`m.room.message`) are ingested by the edge Worker, transformed into standard JSON chat schema records, and written to D1.
- **Client Isolation:** The browser application remains completely protocol-agnostic, interacting solely with its standardized `channels` and `messages` storage layers.

---

## 5. Cross-Suite Integration Contracts

- **CRM Contacts Handshake:**
- Channel `participantIds` map directly to CRM Contact UUIDs (`AppCRMDB`).
- Conversation list items and message headers resolve participant records to display verified contact names, company metadata, and deterministic gradient avatar circles.

- **Kanban Workflow Embeds:**
- Message bodies supporting `linkedTaskId` parse and render interactive task embed cards displaying the card stem ID (`exo-...`), task title, and lane/status pill.
- Tapping an embedded task card opens the card inspection drawer in the Kanban tool.

- **Calendar Milestone Embeds:**
- Messages supporting `linkedEventId` render inline calendar milestone cards highlighting event dates, time blocks, and location details.
