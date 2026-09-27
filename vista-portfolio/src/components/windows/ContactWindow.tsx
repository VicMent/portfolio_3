import { useState } from 'react';
import { useWindowStore } from '../../stores/windowStore';
import { portfolioData } from '../../data/portfolio';
import { DialogWindow } from './AppWindow';
import { AuroraText } from '../magicui/AuroraText';
import { BorderBeam } from '../magicui/BorderBeam';
import { Github, Linkedin } from '../vista/BrandIcons';
import { Gamepad2, Mail, FileText, Copy, Check, ArrowUpRight } from 'lucide-react';
import { playClickSound, playNotifySound } from '../../utils/sound';

export function ContactWindow({ window: win, onClose }: { window: any; onClose: () => void }) {
  const openWindow = useWindowStore((s) => s.openWindow);
  const { personal, contact } = portfolioData;
  const [copied, setCopied] = useState<string | null>(null);

  const email = personal.email;

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard API unavailable (http origin) — fall back to a temp selection.
      const el = document.createElement('textarea');
      el.value = value;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand('copy');
      } catch {
        /* nothing else to try */
      }
      document.body.removeChild(el);
    }
    playNotifySound();
    setCopied(label);
    setTimeout(() => setCopied(null), 1800);
  };

  const links = [
    { label: 'LinkedIn', href: personal.links.linkedin, Icon: Linkedin, tint: '#0a66c2' },
    { label: 'GitHub', href: personal.links.github, Icon: Github, tint: '#e6edf3' },
    { label: 'itch.io', href: personal.links.itch, Icon: Gamepad2, tint: '#fa5c5c' },
    { label: 'Email', href: `mailto:${email}`, Icon: Mail, tint: '#ea4335' },
    { label: 'Résumé', href: personal.links.cv, Icon: FileText, tint: '#00b4b4', action: 'resume' as const },
  ];

  return (
    <DialogWindow onClose={onClose}>
      <div className="flex h-full flex-col">
        <header className="relative shrink-0 border-b border-[var(--glass-border)] bg-white/5 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl aero-surface">
              <Mail size={24} className="text-[var(--aero-blue)]" />
              <BorderBeam size={2} duration={4} />
            </div>
            <div className="min-w-0">
              <AuroraText className="block text-xl font-bold">{contact.headline}</AuroraText>
              <p className="mt-1 text-sm text-gray-400">{contact.subtext}</p>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-sm space-y-5">
            <a
              href={`mailto:${email}`}
              className="aero-surface block rounded-xl px-5 py-4 text-center transition-colors hover:border-[var(--aero-blue)]"
            >
              <Mail size={22} className="mx-auto text-[var(--aero-blue)]" />
              <p className="mt-2 text-sm font-medium text-white">{email}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-400">
                Open your mail app <ArrowUpRight size={11} />
              </p>
            </a>

            <button
              type="button"
              onClick={() => copy(email, 'email')}
              className="w-full rounded-lg aero-button flex items-center justify-center gap-2"
            >
              {copied === 'email' ? <Check size={15} className="text-[#7ddc7d]" /> : <Copy size={15} />}
              {copied === 'email' ? 'Copied to clipboard' : 'Copy email address'}
            </button>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Elsewhere
              </p>
              <div className="grid grid-cols-2 gap-2">
                {links.map(({ label, href, Icon, tint, action }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      if (action === 'resume') openWindow('resume');
                      else window.open(href, '_blank', 'noopener,noreferrer');
                    }}
                    className="aero-surface flex flex-col items-center gap-2 rounded-xl px-3 py-4 transition-colors hover:border-[var(--aero-blue)]"
                  >
                    <Icon size={20} style={{ color: tint }} />
                    <span className="text-xs font-medium text-white">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="aero-surface rounded-xl px-4 py-3 text-xs text-gray-400">
              <p className="mb-1 font-semibold text-gray-300">What I&apos;m looking for</p>
              Junior gameplay programming, generalist IT or QA / playtest roles — ideally on a
              small team where I can keep learning fast.
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t border-[var(--glass-border)] px-6 py-3 text-center text-[11px] text-gray-500">
          {contact.footer}
        </footer>
      </div>
    </DialogWindow>
  );
}
