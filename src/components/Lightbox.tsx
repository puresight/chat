import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { MessageAttachment } from '@/db/types';

interface LightboxProps {
  attachment: MessageAttachment;
  senderName: string;
  onClose: () => void;
}

export function Lightbox({ attachment, senderName, onClose }: LightboxProps) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-slate-950/95 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`Image from ${senderName}`}
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="truncate text-sm font-medium text-slate-200">
          {attachment.name} · from {senderName}
        </p>
        <button
          onClick={onClose}
          aria-label="Close image"
          className="flex h-12 w-12 items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-white/10 active:bg-white/20"
        >
          <X size={24} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <img
          src={attachment.data}
          alt={attachment.name}
          className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
