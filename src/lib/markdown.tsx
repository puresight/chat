import type { ReactNode } from 'react';

export type MarkdownVariant = 'own' | 'other';

const FENCE_RE = /```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g;
const INLINE_RE = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|https?:\/\/[^\s]+)/g;

function inline(text: string, variant: MarkdownVariant): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**') && tok.length > 4) {
      nodes.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith('`') && tok.length > 2) {
      nodes.push(
        <code
          key={key++}
          className={`rounded px-1 py-0.5 font-mono text-[13px] ${
            variant === 'own'
              ? 'bg-white/20'
              : 'bg-slate-200/90 dark:bg-slate-700'
          }`}
        >
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith('*') && tok.length > 2) {
      nodes.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    } else {
      const display = tok.replace(/^https?:\/\//, '');
      const short = display.length > 42 ? `${display.slice(0, 42)}…` : display;
      nodes.push(
        <a
          key={key++}
          href={tok}
          target="_blank"
          rel="noreferrer"
          className={`font-medium underline underline-offset-2 ${
            variant === 'own' ? 'text-white' : 'text-primary-600 dark:text-primary-300'
          }`}
        >
          {short}
        </a>
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function pushTextSegment(seg: string, variant: MarkdownVariant, blocks: ReactNode[]): void {
  const lines = seg.split('\n');
  let buf: string[] = [];
  let bullets: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (buf.length === 0) return;
    blocks.push(
      <p key={`p${key++}`} className="whitespace-pre-wrap">
        {inline(buf.join('\n'), variant)}
      </p>
    );
    buf = [];
  };
  const flushBullets = () => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={`u${key++}`} className="ml-4 list-disc space-y-0.5">
        {bullets.map((b, i) => (
          <li key={i}>{inline(b, variant)}</li>
        ))}
      </ul>
    );
    bullets = [];
  };

  for (const line of lines) {
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      bullets.push(bullet[1]);
    } else {
      flushBullets();
      buf.push(line);
    }
  }
  flushBullets();
  flushParagraph();
}

export function renderMarkdown(content: string, variant: MarkdownVariant): ReactNode[] {
  const blocks: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  FENCE_RE.lastIndex = 0;
  while ((m = FENCE_RE.exec(content)) !== null) {
    if (m.index > last) pushTextSegment(content.slice(last, m.index), variant, blocks);
    const lang = m[1];
    const code = m[2].replace(/\n$/, '');
    blocks.push(
      <div
        key={`c${key++}`}
        className="mt-1 overflow-hidden rounded-xl bg-slate-900 text-slate-100 shadow-inner"
      >
        {lang && (
          <div className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {lang}
          </div>
        )}
        <pre className="overflow-x-auto px-3 pb-2.5 pt-1.5 text-[13px] leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    );
    last = m.index + m[0].length;
  }
  if (last < content.length) pushTextSegment(content.slice(last), variant, blocks);
  return blocks;
}

export function Markdown({
  content,
  variant,
}: {
  content: string;
  variant: MarkdownVariant;
}) {
  return <>{renderMarkdown(content, variant)}</>;
}
