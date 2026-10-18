import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemeMode } from '@/hooks/use-theme';

const OPTIONS: Array<{ value: ThemeMode; icon: typeof Sun; label: string }> = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

export function ThemeSwitcher() {
  const { mode, setMode } = useTheme();
  return (
    <div
      className="flex items-center gap-0.5 rounded-full bg-slate-100 p-1 dark:bg-slate-800"
      role="radiogroup"
      aria-label="Theme"
    >
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          role="radio"
          aria-checked={mode === value}
          aria-label={label}
          title={label}
          onClick={() => setMode(value)}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
            mode === value
              ? 'bg-white text-primary-600 shadow-sm dark:bg-slate-600 dark:text-primary-300'
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          <Icon size={16} strokeWidth={2.2} />
        </button>
      ))}
    </div>
  );
}
