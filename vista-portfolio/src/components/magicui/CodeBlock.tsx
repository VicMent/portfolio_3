import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyText } from '../../utils/helpers';
import { cn } from '../../utils/helpers';

export type Language = 'csharp' | 'javascript' | 'typescript' | 'html' | 'css' | 'bash' | 'json';

interface Token {
  text: string;
  kind: 'plain' | 'keyword' | 'string' | 'comment' | 'number' | 'type' | 'function' | 'operator';
}

const KEYWORDS: Record<string, string[]> = {
  csharp: [
    'public', 'private', 'protected', 'internal', 'static', 'class', 'struct', 'void', 'return',
    'if', 'else', 'for', 'foreach', 'while', 'break', 'continue', 'new', 'this', 'true', 'false',
    'null', 'readonly', 'const', 'override', 'virtual', 'abstract', 'interface', 'namespace', 'using',
    'float', 'int', 'bool', 'double', 'var', 'out', 'ref',
  ],
  javascript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'new', 'class',
    'extends', 'import', 'export', 'from', 'default', 'await', 'async', 'try', 'catch', 'throw',
    'true', 'false', 'null', 'undefined', 'typeof', 'of', 'in',
  ],
  typescript: [
    'const', 'let', 'function', 'return', 'if', 'else', 'for', 'while', 'new', 'class', 'extends',
    'import', 'export', 'from', 'default', 'await', 'async', 'try', 'catch', 'throw', 'true', 'false',
    'null', 'undefined', 'typeof', 'interface', 'type', 'enum', 'implements', 'readonly', 'public',
    'private', 'protected', 'string', 'number', 'boolean', 'void', 'any', 'unknown',
  ],
  bash: ['npm', 'cd', 'vite', 'run', 'build', 'npx', 'node', 'sudo', 'export', 'echo'],
  json: ['true', 'false', 'null'],
  html: [],
  css: [],
};

const TYPE_WORDS = new Set([
  'Mathf', 'Vector3', 'Vector2', 'GameObject', 'Transform', 'MonoBehaviour', 'Mesh', 'Chunk',
  'ChunkData', 'List', 'Dictionary', 'String', 'Int32', 'Single', 'Boolean', 'Object', 'Array',
]);

/**
 * Small, dependency-free highlighter.
 *
 * A real parser is overkill here and a syntax-highlighting dependency would
 * outweigh the whole app bundle, so this tokenises just enough structure:
 * comments, strings, numbers, keywords and type-ish identifiers.
 */
function tokenize(code: string, language: Language): Token[] {
  const keywords = new Set(KEYWORDS[language] ?? KEYWORDS.javascript);
  const commentToken = language === 'bash' ? '#' : language === 'json' ? null : '//';
  const tokens: Token[] = [];

  // Order matters: comments and strings must win over everything else.
  const re = new RegExp(
    [
      commentToken ? `(${commentToken}[^\\n]*)` : null,
      `("""[\\s\\S]*?"""|"(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\`)`,
      '\\b(\\d+(?:\\.\\d+)?)\\b',
      '([A-Za-z_][\\w]*)',
    ]
      .filter(Boolean)
      .join('|'),
    'g'
  );

  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) tokens.push({ text: code.slice(last, m.index), kind: 'plain' });
    const [full, comment, str, num, word] = m;

    if (comment) tokens.push({ text: comment, kind: 'comment' });
    else if (str) tokens.push({ text: str, kind: 'string' });
    else if (num) tokens.push({ text: num, kind: 'number' });
    else if (word) {
      const lower = word.toLowerCase();
      if (keywords.has(lower)) tokens.push({ text: word, kind: 'keyword' });
      else if (TYPE_WORDS.has(word)) tokens.push({ text: word, kind: 'type' });
      else if (code[re.lastIndex] === '(') tokens.push({ text: word, kind: 'function' });
      else tokens.push({ text: word, kind: 'plain' });
    }
    last = re.lastIndex;
  }
  if (last < code.length) tokens.push({ text: code.slice(last), kind: 'plain' });
  return tokens;
}

const TOKEN_CLASS: Record<Token['kind'], string> = {
  plain: 'text-gray-200',
  keyword: 'text-[#c792ea]',
  string: 'text-[#c3e88d]',
  comment: 'text-gray-500 italic',
  number: 'text-[#f78c6c]',
  type: 'text-[#82aaff]',
  function: 'text-[#82d9ef]',
  operator: 'text-gray-400',
};

export function CodeBlock({
  code,
  language = 'csharp',
  filename,
  showCopy = true,
  className,
  maxHeight = 340,
}: {
  code: string;
  language?: Language;
  filename?: string;
  showCopy?: boolean;
  className?: string;
  maxHeight?: number;
}) {
  const tokens = useMemo(() => tokenize(code, language), [code, language]);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (await copyText(code)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <figure
      className={cn(
        'overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[#0a1017]',
        className
      )}
    >
      <figcaption className="flex items-center justify-between gap-3 border-b border-white/8 bg-black/40 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="flex gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </span>
          {filename && (
            <span className="truncate font-mono text-[11px] text-gray-400">{filename}</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[10px] uppercase text-gray-400">
            {language}
          </span>
          {showCopy && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? 'Copied' : 'Copy code'}
              className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              {copied ? <Check size={13} className="text-[#7ddc7d]" /> : <Copy size={13} />}
            </button>
          )}
        </div>
      </figcaption>

      <pre
        className="overflow-auto p-4 text-[12.5px] leading-relaxed"
        style={{ maxHeight, fontFamily: "'Cascadia Mono', Consolas, ui-monospace, monospace" }}
      >
        <code>
          {tokens.map((token, i) => (
            <span key={i} className={TOKEN_CLASS[token.kind]}>
              {token.text}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
