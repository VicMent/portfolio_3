import { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/helpers';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

export interface TerminalLine {
  text: string;
  /** Seconds between characters. */
  speed?: number;
  tone?: 'default' | 'accent' | 'muted' | 'success' | 'error';
}

const TONE_CLASS: Record<NonNullable<TerminalLine['tone']>, string> = {
  default: 'text-gray-200',
  accent: 'text-[var(--aero-blue-light)]',
  muted: 'text-gray-500',
  success: 'text-[#7ddc7d]',
  error: 'text-red-300',
};

/**
 * Types out a scripted list of lines.
 *
 * Implemented with a single interval that advances a cursor held in a ref,
 * so progress can never stall the way a self-rescheduling timeout closure does.
 */
export function Terminal({
  className,
  lines,
  prompt = 'C:\\Users\\Vic>',
  speed = 0.018,
  loop = false,
  title = 'Terminal',
}: {
  className?: string;
  lines: TerminalLine[];
  prompt?: string;
  speed?: number;
  loop?: boolean;
  title?: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [cursor, setCursor] = useState(0);
  const [done, setDone] = useState(false);
  const cursorRef = useRef(0);
  const loopRef = useRef(loop);
  loopRef.current = loop;

  useEffect(() => {
    cursorRef.current = 0;
    setCursor(0);
    setDone(false);

    if (prefersReducedMotion) {
      // Show everything at once.
      const total = lines.reduce((sum, l) => sum + l.text.length + 1, 0);
      cursorRef.current = total;
      setCursor(total);
      setDone(true);
      return;
    }

    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      let c = cursorRef.current;

      // Walk the flattened script of "line text" + a newline character.
      while (c < totalChars(lines) && c > 0) {
        // Stop on the boundary between lines so each line commits together.
        const charIndex = charAt(lines, c);
        if (charIndex === -1) break;
        c += 1;
        cursorRef.current = c;
        setCursor(c);
        return;
      }

      if (cursorRef.current >= totalChars(lines)) {
        setDone(true);
        if (loopRef.current) {
          resetTimer = setTimeout(() => {
            cursorRef.current = 0;
            setCursor(0);
            setDone(false);
          }, 2500);
        }
        return;
      }

      cursorRef.current = c + 1;
      setCursor(cursorRef.current);
    };

    const interval = setInterval(tick, prefersReducedMotion ? 0 : speed * 1000);
    return () => {
      clearInterval(interval);
      if (resetTimer) clearTimeout(resetTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, speed, prefersReducedMotion]);

  const { rendered, currentLine, partial } = sliceLines(lines, cursor);

  return (
    <div className={cn('aero-glass overflow-hidden rounded-xl font-mono text-[13px]', className)}>
      <div className="flex items-center gap-2 border-b border-[var(--glass-border)] bg-black/40 px-3 py-1.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e81123]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffb900]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#5cb85c]" />
        </span>
        <span className="ml-1 text-[11px] text-gray-400">{title}</span>
      </div>

      <div
        className="h-56 overflow-y-auto bg-black/55 p-4"
        style={{ fontFamily: "'Cascadia Mono', Consolas, ui-monospace, monospace" }}
      >
        {rendered.map((line, i) => {
          const isLast = i === rendered.length - 1;
          return (
            <div key={i} className="flex gap-2 leading-relaxed">
              <span className="shrink-0 text-[var(--aero-blue)] opacity-60">{prompt}</span>
              <span className={cn('min-w-0 break-words', TONE_CLASS[line.tone ?? 'default'])}>
                {line.text}
                {isLast && !done && (
                  <span className="ml-0.5 animate-pulse text-[var(--aero-blue)]">▊</span>
                )}
              </span>
            </div>
          );
        })}
        {currentLine === null && !done && (
          <div className="flex gap-2">
            <span className="text-[var(--aero-blue)] opacity-60">{prompt}</span>
            <span className="animate-pulse text-[var(--aero-blue)]">▊</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ utils */

function totalChars(lines: TerminalLine[]): number {
  return lines.reduce((sum, l) => sum + l.text.length + 1, 0);
}

/** Index of the character at global position `pos`, or -1 if it is a newline. */
function charAt(lines: TerminalLine[], pos: number): number {
  let p = 0;
  for (const line of lines) {
    if (pos < p + line.text.length) return pos - p;
    if (pos === p + line.text.length) return -1; // newline boundary
    p += line.text.length + 1;
  }
  return -1;
}

function sliceLines(lines: TerminalLine[], cursor: number) {
  const rendered: TerminalLine[] = [];
  let p = 0;
  let currentLine: number | null = null;
  let partial = '';

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (cursor >= p + line.text.length) {
      rendered.push(line);
      p += line.text.length + 1;
      currentLine = null;
    } else if (cursor > p) {
      rendered.push({ ...line, text: line.text.slice(0, cursor - p) });
      currentLine = i;
      partial = line.text.slice(0, cursor - p);
      break;
    } else {
      break;
    }
  }

  return { rendered, currentLine, partial };
}
