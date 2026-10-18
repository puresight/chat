import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureSeeded } from '@/db/db';
import { ensureCrmSeeded } from '@/db/crm';
import { ConversationDirectory } from '@/components/ConversationDirectory';
import { NewChatModal } from '@/components/NewChatModal';
import { ChatHeader } from '@/components/ChatHeader';
import { MessageList } from '@/components/MessageList';
import { Composer } from '@/components/Composer';
import { EmptyState } from '@/components/EmptyState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ThemeProvider } from '@/hooks/use-theme';
import { markChannelRead } from '@/lib/chat-store';
import { fileToAttachment } from '@/lib/media';
import type { PendingAttachment } from '@/db/types';

export default function App() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [inChatQuery, setInChatQuery] = useState('');
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragDepth = useRef(0);

  useEffect(() => {
    Promise.all([ensureSeeded(), ensureCrmSeeded()]).then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  const channel = useLiveQuery(
    async () => {
      if (!activeId) return undefined;
      const c = await db.channels.get(activeId);
      return c && !c.isDeleted ? c : undefined;
    },
    [activeId],
    undefined
  );

  const messages = useLiveQuery(
    async () => {
      if (!activeId) return [];
      return db.messages
        .where('[channelId+createdAt]')
        .between([activeId, 0], [activeId, Infinity])
        .toArray();
    },
    [activeId],
    []
  );

  const filteredMessages = useLiveQuery(
    async () => {
      if (!activeId) return [];
      const q = inChatQuery.trim().toLowerCase();
      if (!q) return [];
      return db.messages
        .where('channelId')
        .equals(activeId)
        .filter((m) => !m.isDeleted && m.content.toLowerCase().includes(q))
        .toArray();
    },
    [activeId, inChatQuery],
    []
  );

  const chatMessages = inChatQuery.trim() && filteredMessages && filteredMessages.length > 0
    ? messages!.filter((m) => filteredMessages.some((f) => f.id === m.id))
    : messages;

  const scrollToMessage = useCallback((messageId: string) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(`msg-${messageId}`);
      const container = scrollRef.current;
      if (el && container) {
        container.scrollTo({
          top: el.offsetTop - container.offsetTop - 80,
          behavior: 'smooth',
        });
      }
      setHighlightMessageId(messageId);
      window.setTimeout(() => setHighlightMessageId(null), 4000);
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages?.length, activeId]);

  const selectChannel = useCallback(
    (id: string, messageId?: string) => {
      setActiveId(id);
      setMobileOpen(true);
      setInChatQuery('');
      void markChannelRead(id);
      if (messageId) {
        window.setTimeout(() => scrollToMessage(messageId), 250);
      }
    },
    [scrollToMessage]
  );

  const addPendingFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    const results = await Promise.allSettled(list.map(fileToAttachment));
    const ok = results
      .filter((r): r is PromiseFulfilledResult<PendingAttachment> => r.status === 'fulfilled')
      .map((r) => r.value);
    if (ok.length > 0) setPending((prev) => [...prev, ...ok]);
  }, []);

  const removePending = useCallback((index: number) => {
    setPending((prev) => (index === -1 ? [] : prev.filter((_, i) => i !== index)));
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setDragOver(false);
      if (!activeId) return;
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) void addPendingFiles(files);
    },
    [activeId, addPendingFiles]
  );

  const back = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const onDeleted = useCallback(() => {
    setActiveId(null);
    setMobileOpen(false);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div
        className="mx-auto flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden bg-slate-50 dark:bg-slate-950"
        onDragEnter={(e) => {
          if (!activeId) return;
          e.preventDefault();
          dragDepth.current += 1;
          if (e.dataTransfer?.types?.includes('Files')) setDragOver(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragOver(false);
        }}
        onDrop={onDrop}
      >
        <OfflineBanner />
        <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 overflow-hidden">
          <aside
            className={`relative h-full w-full shrink-0 border-r border-slate-200/80 dark:border-slate-800 md:block md:w-96 ${
              mobileOpen ? 'hidden' : 'block'
            }`}
          >
            <ConversationDirectory
              activeChannelId={activeId}
              onSelect={selectChannel}
              onNewChat={() => setNewChatOpen(true)}
            />
          </aside>

          <main className={`relative h-full min-w-0 flex-1 flex-col ${mobileOpen ? 'flex' : 'hidden md:flex'}`}>
            {channel && messages ? (
              <>
                <ChatHeader
                  channel={channel}
                  onBack={back}
                  onDeleted={onDeleted}
                  onSearch={setInChatQuery}
                />
                <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {inChatQuery.trim() && filteredMessages ? (
                    <div className="px-3 pt-4 md:px-6">
                      <p className="rounded-xl bg-slate-100 px-3 py-2 text-[13px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {filteredMessages.length === 0
                          ? `No messages match "${inChatQuery.trim()}"`
                          : `${filteredMessages.length} message${filteredMessages.length === 1 ? '' : 's'} match "${inChatQuery.trim()}"`}
                      </p>
                    </div>
                  ) : null}
                  <MessageList
                    messages={chatMessages ?? []}
                    isGroup={channel.type === 'group'}
                    highlightQuery={inChatQuery}
                    highlightMessageId={highlightMessageId}
                  />
                </div>
                <Composer
                  channelId={channel.id}
                  onAttachImage={addPendingFiles}
                  pending={pending}
                  onRemovePending={removePending}
                />
                {dragOver && (
                  <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-primary-950/40 backdrop-blur-sm">
                    <div className="rounded-3xl border-2 border-dashed border-primary-300 bg-white/90 px-8 py-6 text-center shadow-2xl dark:bg-slate-900/90">
                      <p className="text-base font-bold text-primary-700 dark:text-primary-200">
                        Drop images to attach
                      </p>
                      <p className="pt-1 text-[13px] text-slate-500 dark:text-slate-400">
                        JPEG, PNG or WebP · stored locally on your device
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState />
            )}
          </main>
        </div>

        <NewChatModal
          open={newChatOpen}
          onClose={() => setNewChatOpen(false)}
          onCreated={(id) => selectChannel(id)}
        />
      </div>
    </ThemeProvider>
  );
}
