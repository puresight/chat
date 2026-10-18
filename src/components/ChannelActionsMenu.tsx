import { useEffect, useRef } from 'react';
import {
  Archive,
  ArchiveRestore,
  CheckCheck,
  MailOpen,
  Trash2,
  Eraser,
} from 'lucide-react';
import type { Channel } from '@/db/types';

interface ChannelActionsMenuProps {
  channel: Channel;
  onClose: () => void;
  onToggleRead: () => void;
  onToggleArchive: () => void;
  onClearHistory: () => void;
  onDelete: () => void;
}

export type ChannelAction =
  | 'toggle-read'
  | 'toggle-archive'
  | 'clear-history'
  | 'delete';

export function ChannelActionsMenu({
  channel,
  onClose,
  onToggleRead,
  onToggleArchive,
  onClearHistory,
  onDelete,
}: ChannelActionsMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [onClose]);

  const items: Array<{
    key: ChannelAction;
    label: string;
    icon: React.ReactNode;
    danger?: boolean;
    action: () => void;
  }> = [
    {
      key: 'toggle-read',
      label: channel.unreadCount > 0 ? 'Mark as Read' : 'Mark as Unread',
      icon:
        channel.unreadCount > 0 ? (
          <MailOpen size={16} />
        ) : (
          <CheckCheck size={16} />
        ),
      action: onToggleRead,
    },
    {
      key: 'toggle-archive',
      label: channel.isArchived ? 'Unarchive Chat' : 'Archive Chat',
      icon: channel.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />,
      action: onToggleArchive,
    },
    {
      key: 'clear-history',
      label: 'Clear History',
      icon: <Eraser size={16} />,
      danger: true,
      action: onClearHistory,
    },
    {
      key: 'delete',
      label: 'Delete Chat',
      icon: <Trash2 size={16} />,
      danger: true,
      action: onDelete,
    },
  ];

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl animate-fade-in dark:border-slate-700 dark:bg-slate-800"
    >
      {items.map((item) => (
        <button
          key={item.key}
          role="menuitem"
          onClick={() => {
            item.action();
            onClose();
          }}
          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors ${
            item.danger
              ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40'
              : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/70'
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
