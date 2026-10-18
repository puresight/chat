import { useMemo, useState } from 'react';
import { Check, CheckCheck, Clock, Download, Paperclip } from 'lucide-react';
import type { Message, MessageStatus } from '@/db/types';
import { SELF_ID, PARTICIPANTS } from '@/db/seed';
import { timeLabel, dayKey, dayLabel } from '@/lib/time';
import { Markdown } from '@/lib/markdown';
import { EventCard, TaskCard } from './SuiteCards';
import { Lightbox } from './Lightbox';
import { ChannelAvatar } from './ChannelAvatar';

const ATTACHMENT_RE = /\.(zip|pdf|png|jpe?g|gif|csv|docx?|xlsx?|txt)$/i;

function StatusTicks({ status }: { status: MessageStatus }) {
  if (status === 'pending') {
    return (
      <span title="Pending — will send when online">
        <Clock size={13} className="text-primary-200/90" />
      </span>
    );
  }
  if (status === 'sent') {
    return (
      <span title="Sent">
        <Check size={14} className="text-primary-200/90" />
      </span>
    );
  }
  if (status === 'delivered') {
    return (
      <span title="Delivered">
        <CheckCheck size={14} className="text-primary-200/90" />
      </span>
    );
  }
  return (
    <span title="Read">
      <CheckCheck size={14} className="text-accent-300" />
    </span>
  );
}

function HighlightedText({ text, query, own }: { text: string; query: string; own: boolean }) {
  const parts = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return null;
    return [text.slice(0, idx), text.slice(idx, idx + q.length), text.slice(idx + q.length)];
  }, [text, query]);

  if (!parts) return <p className="whitespace-pre-wrap">{text}</p>;
  return (
    <p className="whitespace-pre-wrap">
      {parts[0]}
      <mark className={`rounded px-0.5 ${own ? 'bg-accent-300 text-slate-900' : 'bg-accent-200 text-slate-900 dark:bg-accent-500/70 dark:text-white'}`}>
        {parts[1]}
      </mark>
      {parts[2]}
    </p>
  );
}

interface MessageListProps {
  messages: Message[];
  isGroup: boolean;
  highlightQuery?: string;
  highlightMessageId?: string | null;
}

export function MessageList({ messages, isGroup, highlightQuery = '', highlightMessageId }: MessageListProps) {
  const visible = messages.filter((m) => !m.isDeleted);
  const [lightbox, setLightbox] = useState<Message | null>(null);
  let prevDay = '';

  return (
    <div className="flex flex-col gap-1.5 px-3 py-4 md:px-6">
      {visible.map((msg, i) => {
        const key = dayKey(msg.createdAt);
        const showDay = key !== prevDay;
        prevDay = key;

        const mine = msg.senderId === SELF_ID;
        const variant = mine ? 'own' : 'other';
        const prev = visible[i - 1];
        const grouped =
          !showDay && prev && prev.senderId === msg.senderId && msg.createdAt - prev.createdAt < 5 * 60_000;
        const sender = PARTICIPANTS.find((p) => p.id === msg.senderId);
        const isFileChip = !mine && !msg.attachment && ATTACHMENT_RE.test(msg.content.trim());
        const isHighlighted = highlightMessageId === msg.id;

        return (
          <div key={msg.id} id={`msg-${msg.id}`}>
            {showDay && (
              <div className="flex justify-center py-3">
                <span className="rounded-full bg-slate-200/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {dayLabel(msg.createdAt)}
                </span>
              </div>
            )}
            <div
              className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'} ${grouped ? '' : 'mt-2'} rounded-2xl transition-colors ${
                isHighlighted ? (mine ? 'bg-primary-100/60 dark:bg-primary-950/70' : 'bg-accent-100/50 dark:bg-accent-950/40') : ''
              }`}
            >
              {!mine && isGroup && (
                <div className={grouped ? 'w-10 shrink-0' : 'shrink-0'}>
                  {!grouped && <ChannelAvatar id={msg.senderId} name={sender?.name ?? 'Unknown'} />}
                </div>
              )}
              <div
                className={`max-w-[82%] min-w-[30%] animate-bubble-in md:max-w-[70%] ${grouped ? '' : 'first:mt-0'}`}
              >
                {!mine && isGroup && !grouped && (
                  <p className="pb-1 pl-1 text-xs font-semibold text-primary-600 dark:text-primary-300">
                    {sender?.name ?? 'Unknown'}
                  </p>
                )}
                {msg.attachment ? (
                  <div className="overflow-hidden rounded-2xl bg-slate-100 shadow-sm dark:bg-slate-800">
                    <button
                      onClick={() => setLightbox(msg)}
                      className="block w-full cursor-zoom-in"
                      aria-label={`Zoom image ${msg.attachment.name}`}
                    >
                      <img
                        src={msg.attachment.data}
                        alt={msg.attachment.name}
                        loading="lazy"
                        className="max-h-80 w-full object-cover"
                      />
                    </button>
                    <div
                      className={`flex items-center justify-between gap-2 px-3 py-2 ${
                        mine ? 'bg-primary-600 text-white' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate text-xs font-medium">{msg.attachment.name}</span>
                      <span className="shrink-0 text-[11px] opacity-70">
                        {(msg.attachment.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  </div>
                ) : isFileChip ? (
                  <div className="flex items-center gap-3 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 shadow-sm dark:bg-slate-800">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
                      <Paperclip size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        {msg.content.trim()}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Attachment</p>
                    </div>
                    <button aria-label="Download attachment" className="icon-btn h-9 w-9 text-slate-400">
                      <Download size={17} />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm [&>p]:whitespace-pre-wrap [&_code]:whitespace-pre-wrap [&_pre]:whitespace-pre ${
                      grouped && mine
                        ? 'rounded-tr-md bg-primary-600 text-white'
                        : grouped && !mine
                          ? 'rounded-tl-md bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                          : mine
                            ? 'rounded-br-md bg-primary-600 text-white'
                            : 'rounded-bl-md bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {highlightQuery.trim() ? (
                      <HighlightedText text={msg.content} query={highlightQuery} own={mine} />
                    ) : (
                      <Markdown content={msg.content} variant={variant} />
                    )}
                  </div>
                )}
                {msg.linkedTaskId && <TaskCard taskId={msg.linkedTaskId} />}
                {msg.linkedEventId && <EventCard eventId={msg.linkedEventId} />}
                <div className={`flex items-center gap-1 pt-1 ${mine ? 'justify-end pr-1' : 'pl-1'}`}>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {timeLabel(new Date(msg.createdAt))}
                  </span>
                  {mine && <StatusTicks status={msg.status} />}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {lightbox && (
        <Lightbox
          attachment={lightbox.attachment!}
          senderName={
            lightbox.senderId === SELF_ID ? 'You' : PARTICIPANTS.find((p) => p.id === lightbox.senderId)?.name ?? 'Unknown'
          }
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
