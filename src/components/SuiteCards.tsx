import { CalendarDays, CheckSquare, ExternalLink, MapPin } from 'lucide-react';
import { findEvent, findTask, TASK_STATUS_STYLES } from '@/lib/suite';

function shortId(id: string): string {
  return id.length > 24 ? `${id.slice(0, 24)}…` : id;
}

function parseEventId(id: string): { title: string; date: string | null } {
  const uuidish = /([0-9]{4})-([0-9]{2})-([0-9]{2})/.exec(id);
  if (uuidish) {
    return { title: shortId(id), date: `${uuidish[2]}/${uuidish[3]}/${uuidish[1]}` };
  }
  return { title: id.length > 32 ? `${id.slice(0, 32)}…` : id, date: null };
}

export function TaskCard({ taskId }: { taskId: string }) {
  const task = findTask(taskId);
  if (!task) {
    return (
      <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-3 px-3.5 pt-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
            <CheckSquare size={17} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[11px] text-slate-400 dark:text-slate-500">{shortId(taskId)}</p>
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">Kanban Card</p>
            <div className="flex items-center gap-2 pt-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TASK_STATUS_STYLES.ready.cls}`}>
                Linked
              </span>
            </div>
          </div>
        </div>
        <button className="mt-2.5 flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-2 text-[13px] font-semibold text-primary-600 transition-colors hover:bg-primary-50 dark:border-slate-800 dark:text-primary-300 dark:hover:bg-primary-950/40">
          View Task
          <ExternalLink size={13} />
        </button>
      </div>
    );
  }
  const status = TASK_STATUS_STYLES[task.status];
  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-3 px-3.5 pt-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
          <CheckSquare size={17} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[11px] text-slate-400 dark:text-slate-500">
            {shortId(task.id)}
          </p>
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {task.title}
          </p>
          <div className="flex items-center gap-2 pt-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.cls}`}>
              {status.label}
            </span>
            {task.due && (
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Due {task.due}
              </span>
            )}
          </div>
        </div>
      </div>
      <button className="mt-2.5 flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-2 text-[13px] font-semibold text-primary-600 transition-colors hover:bg-primary-50 dark:border-slate-800 dark:text-primary-300 dark:hover:bg-primary-950/40">
        View Task
        <ExternalLink size={13} />
      </button>
    </div>
  );
}

export function EventCard({ eventId }: { eventId: string }) {
  const ev = findEvent(eventId);
  if (!ev) {
    const parsed = parseEventId(eventId);
    return (
      <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-3 px-3.5 pt-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600 dark:bg-accent-950 dark:text-accent-300">
            <CalendarDays size={17} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{parsed.title}</p>
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TASK_STATUS_STYLES.ready.cls}`}>
                Linked
              </span>
              {parsed.date && (
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{parsed.date}</span>
              )}
            </div>
          </div>
        </div>
        <button className="mt-2.5 flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-2 text-[13px] font-semibold text-accent-600 transition-colors hover:bg-accent-50 dark:border-slate-800 dark:text-accent-300 dark:hover:bg-accent-950/40">
          View Event
          <ExternalLink size={13} />
        </button>
      </div>
    );
  }
  const start = new Date(ev.start);
  const end = new Date(ev.end);
  const dateBadge = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const timeBadge = `${start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} – ${end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-3 px-3.5 pt-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600 dark:bg-accent-950 dark:text-accent-300">
          <CalendarDays size={17} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{ev.title}</p>
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
            <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-700 dark:bg-accent-950 dark:text-accent-300">
              {dateBadge}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {timeBadge}
            </span>
          </div>
          {ev.location && (
            <p className="flex items-center gap-1 pt-1 text-[11px] text-slate-400 dark:text-slate-500">
              <MapPin size={11} />
              <span className="truncate">{ev.location}</span>
            </p>
          )}
        </div>
      </div>
      <button className="mt-2.5 flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-2 text-[13px] font-semibold text-accent-600 transition-colors hover:bg-accent-50 dark:border-slate-800 dark:text-accent-300 dark:hover:bg-accent-950/40">
        View Event
        <ExternalLink size={13} />
      </button>
    </div>
  );
}
