import { Users } from 'lucide-react';
import { avatarHues, initial } from '@/lib/chat-store';

interface AvatarProps {
  id: string;
  name: string;
  avatarUrl?: string | null;
  size?: 'md' | 'lg';
}

export function ChannelAvatar({ id, name, avatarUrl, size = 'md' }: AvatarProps) {
  const [from, to] = avatarHues(id);
  const dims = size === 'lg' ? 'h-14 w-14 text-xl' : 'h-12 w-12 text-base';
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${dims} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${dims} flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br ${from} ${to} font-semibold text-white shadow-sm`}
      aria-hidden
    >
      {name.length > 0 && name.split(/\s+/).length > 1
        ? name
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w.charAt(0).toUpperCase())
            .join('')
        : initial(name)}
    </div>
  );
}

export function GroupIconAvatar({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'h-14 w-14' : 'h-12 w-12';
  return (
    <div
      className={`${dims} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-sm`}
      aria-hidden
    >
      <Users size={size === 'lg' ? 24 : 20} strokeWidth={2.2} />
    </div>
  );
}
