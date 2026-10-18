import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { MessageSquarePlus, MoreVertical, Search, TextSearch, Users, X } from 'lucide-react';
import { db } from '@/db/db';
import type { Channel } from '@/db/types';
import { useContacts } from '@/db/crm';
import { relativeTime } from '@/lib/time';
import {
  clearChannelHistory,
  deleteChannel,
  markChannelRead,
  setChannelUnread,
  setChannelArchived,
} from '@/lib/chat-store';
import { ChannelAvatar, GroupIconAvatar } from './ChannelAvatar';
import { ChannelActionsMenu } from './ChannelActionsMenu';
import { ThemeSwitcher } from './ThemeSwitcher';

interface DirectoryProps {
  activeChannelId: string | null;
  onSelect: (id: string, messageId?: string) => void;
  onNewChat: () => void;
}

interface MessageHit {
  messageId: string;
  channelId: string;
  snippet: string;
  at: number;
}

export function ConversationDirectory({ activeChannelId, onSelect, onNewChat }: DirectoryProps) {
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [menuChannelId, setMenuChannelId] = useState<string | null>(null);
  const contacts = useContacts();

  const channels = useLiveQuery(async () => {
    const all = await db.channels.filter((c) => !c.isDeleted).toArray();
    return all.sort((a, b) => (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt));
  }, []);

  const q = query.trim().toLowerCase();
  const messageHits = useLiveQuery(async () => {
    if (q.length < 2) return [];
    const msgs = await db.messages.filter((m) => !m.isDeleted && m.content.toLowerCase().includes(q)).toArray();
    const chById = new Map((channels ?? []).map((c) => [c.id, c]));
    return msgs
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 8)
      .map<MessageHit>((m) => ({
        messageId: m.id,
        channelId: m.channelId,
        snippet: m.content.length > 80 ? `${m.content.slice(0, 80)}…` : m.content,
        at: m.createdAt,
      }))
      .filter((h) => chById.has(h.channelId));
  }, [q, channels], []);

  const visible = useMemo(() => {
    if (!channels) return [];
    return channels.filter((c) => {
      if (c.isArchived !== showArchived) return false;
      if (!q) return true;
      if (c.name.toLowerCase().includes(q) || (c.topic ?? '').toLowerCase().includes(q)) return true;
      return c.participantIds.some((pid) => {
        const contact = contacts.find((x) => x.externalId === pid);
        return contact ? contact.name.toLowerCase().includes(q) : false;
      });
    });
  }, [channels, q, showArchived, contacts]);

  const archivedCount = channels?.filter((c) => c.isArchived).length ?? 0;
  const menuChannel = menuChannelId ? channels?.find((c) => c.id === menuChannelId) ?? null : null;

  const act = {
    toggleRead: (c: Channel) =>
      void (c.unreadCount > 0 ? markChannelRead(c.id) : setChannelUnread(c.id)),
    toggleArchive: (c: Channel) => void setChannelArchived(c.id, !c.isArchived),
    clearHistory: (c: Channel) => {
      if (window.confirm(`Clear all messages in "${c.name}"? This cannot be undone.`)) {
        void clearChannelHistory(c.id);
      }
    },
    deleteChat: (c: Channel) => {
      if (window.confirm(`Delete "${c.name}" and all its messages? This cannot be undone.`)) {
        void deleteChannel(c.id);
        setMenuChannelId(null);
      }
    },
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <div className="flex items-center justify-between pb-3">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Chats</h1>
          <ThemeSwitcher />
        </div>
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats, people, messages"
            aria-label="Search conversations and message history"
            className="h-12 w-full rounded-2xl border-0 bg-slate-100 pl-11 pr-10 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2 pt-3">
          <FilterChip active={!showArchived} onClick={() => setShowArchived(false)} label="All" />
          <FilterChip
            active={showArchived}
            onClick={() => setShowArchived(true)}
            label={`Archived${archivedCount > 0 ? ` (${archivedCount})` : ''}`}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-28">
        {q.length >= 2 && messageHits && messageHits.length > 0 && (
          <div className="px-2 pb-2 pt-1">
            <p className="flex items-center gap-1.5 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              <TextSearch size={12} />
              Messages · {messageHits.length}
            </p>
            <ul className="space-y-1">
              {messageHits.map((hit) => {
                const ch = channels?.find((c) => c.id === hit.channelId);
                if (!ch) return null;
                return (
                  <li key={hit.messageId}>
                    <button
                      onClick={() => onSelect(hit.channelId, hit.messageId)}
                      className="flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/70"
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
                        <TextSearch size={13} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                            {ch.name}
                          </span>
                          <span className="shrink-0 text-[11px] text-slate-400">
                            {relativeTime(hit.at)}
                          </span>
                        </span>
                        <span className="line-clamp-2 block text-xs leading-snug text-slate-500 dark:text-slate-400">
                          {hit.snippet}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {channels === undefined ? (
          <div className="space-y-2 px-2 pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
              <Users size={24} />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {query ? 'No chats or messages match' : showArchived ? 'No archived chats' : 'No chats yet'}
            </p>
            {!query && !showArchived && (
              <p className="text-[13px] text-slate-400 dark:text-slate-500">
                Tap + to start your first conversation.
              </p>
            )}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {q.length >= 2 && (messageHits?.length ?? 0) > 0 && visible.length > 0 && (
              <li className="px-2 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Chats
              </li>
            )}
            {visible.map((channel) => (
              <li key={channel.id} className="relative">
                <div
                  className={`flex w-full items-center rounded-2xl transition-colors md:rounded-xl ${
                    activeChannelId === channel.id
                      ? 'bg-primary-50 dark:bg-primary-950/60'
                      : 'hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/70 dark:active:bg-slate-800'
                  }`}
                >
                  <button
                    onClick={() => onSelect(channel.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left"
                  >
                    {channel.type === 'group' ? (
                      <GroupIconAvatar />
                    ) : (
                      <ChannelAvatar id={channel.id} name={channel.name} avatarUrl={channel.avatarUrl} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-semibold text-slate-900 dark:text-white">
                          {channel.name}
                        </span>
                        <span
                          className={`shrink-0 text-xs ${
                            channel.unreadCount > 0
                              ? 'font-semibold text-accent-600 dark:text-accent-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {relativeTime(channel.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span
                          className={`truncate text-[13px] ${
                            channel.unreadCount > 0
                              ? 'font-medium text-slate-700 dark:text-slate-200'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {channel.lastMessageSnippet ?? 'No messages yet'}
                        </span>
                        {channel.unreadCount > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 px-1.5 text-[11px] font-bold text-white shadow-sm">
                            {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setMenuChannelId(menuChannelId === channel.id ? null : channel.id)}
                    aria-label={`Actions for ${channel.name}`}
                    aria-expanded={menuChannelId === channel.id}
                    className="icon-btn mr-2 h-12 w-12 shrink-0"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
                {menuChannelId === channel.id && menuChannel && (
                  <div className="absolute right-2 top-14 z-30">
                    <ChannelActionsMenu
                      channel={menuChannel}
                      onClose={() => setMenuChannelId(null)}
                      onToggleRead={() => act.toggleRead(menuChannel)}
                      onToggleArchive={() => act.toggleArchive(menuChannel)}
                      onClearHistory={() => act.clearHistory(menuChannel)}
                      onDelete={() => act.deleteChat(menuChannel)}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={onNewChat}
        aria-label="New chat"
        title="New chat"
        className="absolute bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30 transition-transform hover:scale-105 hover:bg-primary-700 active:scale-95"
      >
        <MessageSquarePlus size={24} strokeWidth={2.2} />
      </button>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-9 rounded-full px-3.5 text-[13px] font-medium transition-colors ${
        active
          ? 'bg-primary-600 text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );
}
