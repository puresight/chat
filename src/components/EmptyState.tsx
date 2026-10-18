import { MessageCircle } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-50 px-8 text-center dark:bg-slate-950">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-600/25">
        <MessageCircle size={36} strokeWidth={1.8} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Welcome to Chat</h2>
        <p className="max-w-xs pt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Select a conversation from the list, or start a new chat. Everything is stored on your
          device and works fully offline.
        </p>
      </div>
    </div>
  );
}
