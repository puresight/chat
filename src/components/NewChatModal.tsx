import { useMemo, useState } from 'react';
import { Check, MessageSquare, Users, X } from 'lucide-react';
import { SELF_ID } from '@/db/seed';
import { useContacts } from '@/db/crm';
import { db } from '@/db/db';
import type { ChannelType } from '@/db/types';
import { ACCENT_OPTIONS, avatarHues, createChannel } from '@/lib/chat-store';
import { ChannelAvatar } from './ChannelAvatar';

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (channelId: string) => void;
}

export function NewChatModal({ open, onClose, onCreated }: NewChatModalProps) {
  const [mode, setMode] = useState<ChannelType>('direct');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [topic, setTopic] = useState('');
  const [accent, setAccent] = useState<string>(ACCENT_OPTIONS[0]);
  const [busy, setBusy] = useState(false);
  const contacts = useContacts();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q)
    );
  }, [query, contacts]);

  if (!open) return null;

  const toggle = (externalId: string) => {
    setSelected((prev) => {
      if (mode === 'direct') return prev.includes(externalId) ? [] : [externalId];
      return prev.includes(externalId) ? prev.filter((x) => x !== externalId) : [...prev, externalId];
    });
  };

  const canSubmit =
    !busy &&
    (mode === 'direct'
      ? selected.length === 1
      : selected.length >= 1 && groupName.trim().length > 0);

  const close = () => {
    setSelected([]);
    setGroupName('');
    setTopic('');
    setQuery('');
    setAccent(ACCENT_OPTIONS[0]);
    onClose();
  };

  const findExistingDm = async (externalId: string): Promise<string | null> => {
    const channels = await db.channels.filter((c) => !c.isDeleted && c.type === 'direct').toArray();
    const match = channels.find((c) => c.participantIds.includes(externalId));
    return match?.id ?? null;
  };

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      if (mode === 'direct') {
        const person = contacts.find((c) => c.externalId === selected[0])!;
        const existing = await findExistingDm(person.externalId);
        if (existing) {
          close();
          onCreated(existing);
          return;
        }
        const channel = await createChannel({
          type: 'direct',
          name: person.name,
          participantIds: [SELF_ID, person.externalId],
        });
        close();
        onCreated(channel.id);
      } else {
        const channel = await createChannel({
          type: 'group',
          name: groupName.trim(),
          participantIds: [SELF_ID, ...selected],
          accent,
          topic,
        });
        close();
        onCreated(channel.id);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm animate-fade-in sm:items-center"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Start a new chat"
    >
      <div
        className="flex max-h-[85dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl animate-slide-up dark:bg-slate-900 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">New chat</h2>
          <button onClick={close} aria-label="Close" className="icon-btn h-12 w-12">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 px-5 pt-4">
          <TypeCard
            active={mode === 'direct'}
            onClick={() => {
              setMode('direct');
              setSelected([]);
            }}
            icon={<MessageSquare size={18} />}
            title="Direct Message"
            subtitle="One person"
          />
          <TypeCard
            active={mode === 'group'}
            onClick={() => {
              setMode('group');
              setSelected([]);
            }}
            icon={<Users size={18} />}
            title="Group Channel"
            subtitle="Multiple people"
          />
        </div>

        {mode === 'group' && (
          <div className="space-y-3 px-5 pt-4">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              aria-label="Group name"
              className="h-12 w-full rounded-2xl border-0 bg-slate-100 px-4 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
            />
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic or description (optional)"
              aria-label="Group topic"
              className="h-12 w-full rounded-2xl border-0 bg-slate-100 px-4 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
            />
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                Avatar color
              </span>
              <div className="flex gap-2">
                {ACCENT_OPTIONS.map((key) => {
                  const [from, to] = avatarHues(`accent:${key}`);
                  return (
                    <button
                      key={key}
                      onClick={() => setAccent(key)}
                      aria-label={`Accent ${key}`}
                      aria-pressed={accent === key}
                      className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${from} ${to} transition-transform ${
                        accent === key
                          ? 'scale-110 ring-2 ring-primary-600 ring-offset-2 dark:ring-offset-slate-900'
                          : 'hover:scale-105'
                      }`}
                    >
                      {accent === key && <Check size={16} strokeWidth={3} className="text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="px-5 pt-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts"
            aria-label="Search contacts"
            className="h-12 w-full rounded-xl border-0 bg-slate-100 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">No contacts found.</p>
          ) : (
            <ul>
              {filtered.map((p) => {
                const isSel = selected.includes(p.externalId);
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => toggle(p.externalId)}
                      className={`flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                        isSel ? 'bg-primary-50 dark:bg-primary-950/60' : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <ChannelAvatar id={p.externalId} name={p.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900 dark:text-white">{p.name}</p>
                        <p className="truncate text-[13px] text-slate-400 dark:text-slate-500">{p.role}</p>
                      </div>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          isSel
                            ? 'border-primary-600 bg-primary-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSel && <Check size={14} strokeWidth={3} />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-slate-100 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 dark:border-slate-800">
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="h-12 w-full rounded-2xl bg-primary-600 font-semibold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy
              ? 'Creating…'
              : mode === 'direct'
                ? 'Start chat'
                : `Create group${selected.length > 0 ? ` (${selected.length + 1})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function TypeCard({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
        active
          ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/60'
          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          active ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
        <span className="block text-xs text-slate-400 dark:text-slate-500">{subtitle}</span>
      </span>
    </button>
  );
}
