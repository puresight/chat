export type TaskStatus = 'ready' | 'doing' | 'review' | 'done' | 'blocked';

export interface SuiteTask {
  id: string;
  title: string;
  status: TaskStatus;
  due?: string;
}

export interface SuiteEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
}

export const SUITE_TASKS: SuiteTask[] = [
  {
    id: 'exo-01jk7sh2-task-9f3a',
    title: 'Wire composer attachment menu',
    status: 'doing',
    due: 'Oct 21',
  },
  {
    id: 'exo-01jk7sh2-task-4c8d',
    title: 'Regression checklist for conflict cases',
    status: 'review',
    due: 'Oct 19',
  },
  {
    id: 'exo-01jk7sh2-task-71be',
    title: 'Wire UI synced flag to batched updates',
    status: 'ready',
    due: 'Oct 24',
  },
  {
    id: 'exo-01jk7sh2-task-aa02',
    title: 'Onboarding flow progress indicator',
    status: 'done',
    due: 'Oct 10',
  },
  {
    id: 'exo-01jk7sh2-task-e5f9',
    title: 'Reconcile seeded avatars with directory',
    status: 'blocked',
    due: 'Oct 27',
  },
];

export const SUITE_EVENTS: SuiteEvent[] = [
  {
    id: 'evt-01jk7sh2-standup-1020',
    title: 'Dev Team Standup',
    start: '2026-10-20T09:30:00',
    end: '2026-10-20T09:50:00',
    location: 'Huddle Room 2 / Video link',
  },
  {
    id: 'evt-01jk7sh2-demo-1024',
    title: 'Sync Engine Milestone Demo',
    start: '2026-10-24T14:00:00',
    end: '2026-10-24T15:00:00',
    location: 'Main Auditorium',
  },
  {
    id: 'evt-01jk7sh2-qa-1021',
    title: 'QA Sign-off Session',
    start: '2026-10-21T11:00:00',
    end: '2026-10-21T12:30:00',
    location: 'Video link',
  },
];

export function findTask(id: string): SuiteTask | undefined {
  return SUITE_TASKS.find((t) => t.id === id);
}

export function findEvent(id: string): SuiteEvent | undefined {
  return SUITE_EVENTS.find((e) => e.id === id);
}

export const TASK_STATUS_STYLES: Record<TaskStatus, { label: string; cls: string }> = {
  ready: {
    label: 'Ready',
    cls: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  },
  doing: {
    label: 'Doing',
    cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  },
  review: {
    label: 'Review',
    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  done: {
    label: 'Done',
    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  blocked: {
    label: 'Blocked',
    cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  },
};
