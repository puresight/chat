import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  CheckSquare,
  ImagePlus,
  Layers,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { SUITE_EVENTS, SUITE_TASKS } from '@/lib/suite';
import { formatBytes, isImageFile } from '@/lib/media';
import { sendMessage } from '@/lib/chat-store';
import type { PendingAttachment } from '@/db/types';

interface ComposerProps {
  channelId: string;
  onAttachImage: (files: FileList | File[]) => void;
  pending: PendingAttachment[];
  onRemovePending: (index: number) => void;
}

export function Composer({ channelId, onAttachImage, pending, onRemovePending }: ComposerProps) {
  const [text, setText] = useState('');
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);
  const [linkedEventId, setLinkedEventId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText('');
    setLinkedTaskId(null);
    setLinkedEventId(null);
    setError(null);
  }, [channelId]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const autoGrow = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  };

  useEffect(autoGrow, [text]);

  const attachTask = () => {
    setLinkedTaskId(SUITE_TASKS[0].id);
    setMenuOpen(false);
    ref.current?.focus();
  };

  const attachEvent = () => {
    setLinkedEventId(SUITE_EVENTS[0].id);
    setMenuOpen(false);
    ref.current?.focus();
  };

  const promptKanban = () => {
    setMenuOpen(false);
    const id = window.prompt('Enter the Kanban card ID (e.g. exo-01jk…):');
    if (id && id.trim()) {
      setLinkedTaskId(id.trim());
    }
    ref.current?.focus();
  };

  const promptCalendar = () => {
    setMenuOpen(false);
    const title = window.prompt('Enter the calendar event title or ID:');
    if (title && title.trim()) {
      setLinkedEventId(SUITE_EVENTS.some((e) => e.id === title.trim() || e.title === title.trim())
        ? title.trim()
        : SUITE_EVENTS[0].id);
    }
    ref.current?.focus();
  };

  const pickFiles = () => {
    setMenuOpen(false);
    fileRef.current?.click();
  };

  const onFilesChosen = (files: FileList | null) => {
    if (!files) return;
    const bad = Array.from(files).find((f) => !isImageFile(f));
    if (bad) {
      setError(`"${bad.name}" is not a supported image (JPEG, PNG, WebP).`);
    }
    onAttachImage(files);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async () => {
    const hasContent = text.trim().length > 0 || pending.length > 0;
    if (!hasContent || sending) return;
    setSending(true);
    setText('');
    const task = linkedTaskId;
    const event = linkedEventId;
    setLinkedTaskId(null);
    setLinkedEventId(null);
    try {
      if (pending.length > 0) {
        for (const p of pending) {
          await sendMessage(channelId, text.trim() || 'Photo', {
            linkedTaskId: task,
            linkedEventId: event,
            attachment: { type: 'image', data: p.data, name: p.name, size: p.size },
          });
        }
        onRemovePending(-1);
      } else {
        await sendMessage(channelId, text.trim(), { linkedTaskId: task, linkedEventId: event });
      }
    } finally {
      setSending(false);
      ref.current?.focus();
    }
  };

  return (
    <div className="border-t border-slate-200/80 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:px-5">
      {error && (
        <div className="flex items-center justify-between gap-2 pb-2">
          <p className="truncate rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
            {error}
          </p>
          <button onClick={() => setError(null)} aria-label="Dismiss error" className="icon-btn h-8 w-8 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}
      {(linkedTaskId || linkedEventId) && (
        <div className="flex flex-wrap items-center gap-2 pb-2">
          {linkedTaskId && (
            <button
              onClick={() => setLinkedTaskId(null)}
              className="flex items-center gap-1.5 rounded-full bg-primary-100 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-200 dark:bg-primary-950 dark:text-primary-300 dark:hover:bg-primary-900"
              title="Remove Kanban reference"
            >
              <CheckSquare size={13} />
              <span className="max-w-48 truncate">
                {SUITE_TASKS.find((t) => t.id === linkedTaskId)?.title ?? linkedTaskId}
              </span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600/20">
                <Trash2 size={11} />
              </span>
            </button>
          )}
          {linkedEventId && (
            <button
              onClick={() => setLinkedEventId(null)}
              className="flex items-center gap-1.5 rounded-full bg-accent-100 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-accent-700 transition-colors hover:bg-accent-200 dark:bg-accent-950 dark:text-accent-300 dark:hover:bg-accent-900"
              title="Remove calendar reference"
            >
              <CalendarDays size={13} />
              <span className="max-w-48 truncate">
                {SUITE_EVENTS.find((e) => e.id === linkedEventId)?.title ?? linkedEventId}
              </span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-600/20">
                <Trash2 size={11} />
              </span>
            </button>
          )}
        </div>
      )}
      {pending.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {pending.map((p, i) => (
            <div key={`${p.name}-${i}`} className="relative shrink-0">
              <img
                src={p.data}
                alt={p.name}
                className="h-20 w-20 rounded-xl object-cover shadow-sm"
              />
              <button
                onClick={() => onRemovePending(i)}
                aria-label={`Remove ${p.name}`}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white shadow-md"
              >
                <X size={12} strokeWidth={3} />
              </button>
              <p className="pt-0.5 text-center text-[10px] text-slate-400">{formatBytes(p.size)}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Attach"
            aria-expanded={menuOpen}
            className={`icon-btn transition-transform ${menuOpen ? 'rotate-45 text-primary-600 dark:text-primary-300' : ''}`}
          >
            <Plus size={22} />
          </button>
          {menuOpen && (
            <div className="absolute bottom-12 left-0 z-20 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-fade-in dark:border-slate-700 dark:bg-slate-800">
              <MenuItem onClick={pickFiles} icon={<ImagePlus size={17} className="text-positive-600 dark:text-positive-300" />} label="Attach Image" hint="JPEG, PNG, WebP" />
              <MenuItem onClick={promptKanban} icon={<Layers size={17} className="text-primary-600 dark:text-primary-300" />} label="Link Kanban Card" hint="Enter card ID" />
              <MenuItem onClick={attachTask} icon={<CheckSquare size={17} className="text-primary-600 dark:text-primary-300" />} label="Attach Task Reference" hint="From board" />
              <MenuItem onClick={promptCalendar} icon={<CalendarDays size={17} className="text-accent-600 dark:text-accent-300" />} label="Link Calendar Event" hint="Title or ID" bordered />
              <MenuItem onClick={attachEvent} icon={<CalendarDays size={17} className="text-accent-600 dark:text-accent-300" />} label="Attach Calendar Event" hint="From calendar" bordered />
            </div>
          )}
        </div>
        <textarea
          ref={ref}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={pending.length > 0 ? 'Add a caption…' : 'Type a message  ·  **bold**  *italic*  `code`'}
          aria-label="Message"
          className="min-h-12 flex-1 resize-none rounded-2xl border-0 bg-slate-100 px-4 py-3 text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
        />
        <button
          onClick={() => void submit()}
          disabled={!(text.trim() || pending.length > 0)}
          aria-label="Send message"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-40"
        >
          <Send size={19} strokeWidth={2.2} />
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => onFilesChosen(e.target.files)}
      />
    </div>
  );
}

function MenuItem({
  onClick,
  icon,
  label,
  hint,
  bordered,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
  bordered?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/70 ${
        bordered ? 'border-t border-slate-100 dark:border-slate-700' : ''
      }`}
    >
      {icon}
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        <span className="block truncate text-[11px] text-slate-400 dark:text-slate-500">{hint}</span>
      </span>
    </button>
  );
}
