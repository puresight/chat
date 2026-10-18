import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MoreVertical, Phone, Search, Video, X } from 'lucide-react';
import type { Channel } from '@/db/types';
import {
  clearChannelHistory,
  deleteChannel,
  markChannelRead,
  setChannelUnread,
  setChannelArchived,
} from '@/lib/chat-store';
import { ChannelAvatar, GroupIconAvatar } from './ChannelAvatar';
import { ChannelActionsMenu } from './ChannelActionsMenu';

interface ChatHeaderProps {
  channel: Channel;
  onBack: () => void;
  onDeleted: () => void;
  onSearch: (query: string) => void;
}

export function ChatHeader({ channel, onBack, onDeleted, onSearch }: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isGroup = channel.type === 'group';

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    setSearchOpen(false);
    setLocalQuery('');
  }, [channel.id]);

  const closeSearch = () => {
    setSearchOpen(false);
    setLocalQuery('');
    onSearch('');
  };

  const toggleRead = () =>
    void (channel.unreadCount > 0 ? markChannelRead(channel.id) : setChannelUnread(channel.id));
  const toggleArchive = () => void setChannelArchived(channel.id, !channel.isArchived);
  const clearHistory = () => {
    if (window.confirm(`Clear all messages in "${channel.name}"? This cannot be undone.`)) {
      void clearChannelHistory(channel.id);
    }
  };
  const deleteChat = () => {
    if (window.confirm(`Delete "${channel.name}" and all its messages? This cannot be undone.`)) {
      void deleteChannel(channel.id).then(onDeleted);
    }
  };

  return (
    <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="flex items-center gap-2 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:gap-3 md:px-5">
        <button onClick={onBack} aria-label="Back to chats" className="icon-btn md:hidden">
          <ArrowLeft size={22} />
        </button>
        {isGroup ? (
          <GroupIconAvatar />
        ) : (
          <ChannelAvatar id={channel.id} name={channel.name} avatarUrl={channel.avatarUrl} />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold leading-tight text-slate-900 dark:text-white">
            {channel.name}
          </h2>
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-positive-500" />
            </span>
            <span className="truncate text-[13px] text-slate-500 dark:text-slate-400">
              {isGroup ? `${channel.participantIds.length} participants` : 'Online'}
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <button
            aria-label={searchOpen ? 'Close search' : 'Search in conversation'}
            aria-expanded={searchOpen}
            onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
            className={`icon-btn ${searchOpen ? 'text-primary-600 dark:text-primary-300' : ''}`}
          >
            <Search size={20} />
          </button>
          <button aria-label="Voice call" className="icon-btn hidden sm:inline-flex">
            <Phone size={20} />
          </button>
          <button aria-label="Video call" className="icon-btn hidden sm:inline-flex">
            <Video size={20} />
          </button>
          <div className="relative">
            <button
              aria-label="Conversation actions"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="icon-btn"
            >
              <MoreVertical size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-30">
                <ChannelActionsMenu
                  channel={channel}
                  onClose={() => setMenuOpen(false)}
                  onToggleRead={toggleRead}
                  onToggleArchive={toggleArchive}
                  onClearHistory={clearHistory}
                  onDelete={deleteChat}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {searchOpen && (
        <div className="flex items-center gap-2 px-3 pb-3 md:px-5">
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={inputRef}
              value={localQuery}
              onChange={(e) => {
                setLocalQuery(e.target.value);
                onSearch(e.target.value);
              }}
              placeholder="Filter messages in this chat"
              aria-label="Filter messages in this chat"
              className="h-12 w-full rounded-2xl border-0 bg-slate-100 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
            {localQuery && (
              <button
                onClick={() => {
                  setLocalQuery('');
                  onSearch('');
                  inputRef.current?.focus();
                }}
                aria-label="Clear filter"
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button onClick={closeSearch} className="h-12 shrink-0 rounded-2xl px-3 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            Done
          </button>
        </div>
      )}
    </div>
  );
}
