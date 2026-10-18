export function relativeTime(timestamp: number | null | undefined): string {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const MIN = 60_000;
  const HOUR = 3_600_000;
  const DAY = 86_400_000;

  if (diff < MIN) return 'now';
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m ago`;
  const d = new Date(timestamp);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (timestamp >= startOfToday) return timeLabel(d);
  if (timestamp >= startOfToday - DAY) return 'Yesterday';
  if (diff < 7 * DAY) {
    const days = Math.floor(diff / DAY);
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function timeLabel(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function dayLabel(timestamp: number): string {
  const now = new Date();
  const d = new Date(timestamp);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (timestamp >= startOfToday) return 'Today';
  if (timestamp >= startOfToday - 86_400_000) return 'Yesterday';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}
