/**
 * Vista-style system sounds, synthesised with the Web Audio API.
 * No audio files, no network requests, no 404s.
 */

type SoundName =
  | 'startup'
  | 'open'
  | 'close'
  | 'minimize'
  | 'maximize'
  | 'click'
  | 'notify'
  | 'error'
  | 'empty';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let volume = 0.4;
let unlocked = false;

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  if (!ctx) {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
  }
  // Browsers start contexts suspended until a user gesture.
  if (ctx.state === 'suspended' && !unlocked) {
    ctx.resume().catch(() => undefined);
    unlocked = true;
  }
  return ctx;
}

/** Call from a real user gesture so later sounds are allowed to play. */
export function unlockAudio() {
  const c = ensureContext();
  if (c?.state === 'suspended') c.resume().catch(() => undefined);
}

interface ToneOptions {
  freq: number;
  type?: OscillatorType;
  /** Offset from "now", seconds. */
  at?: number;
  duration?: number;
  gain?: number;
  /** Glide to this frequency across the tone. */
  sweepTo?: number;
  attack?: number;
}

function tone({
  freq,
  type = 'sine',
  at = 0,
  duration = 0.12,
  gain = 0.2,
  sweepTo,
  attack = 0.008,
}: ToneOptions) {
  const c = ensureContext();
  if (!c || !master) return;

  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const env = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t0 + duration);

  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(env).connect(master);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

interface NoiseOptions {
  at?: number;
  duration?: number;
  gain?: number;
  from: number;
  to: number;
  q?: number;
}

function noiseSweep({ at = 0, duration = 0.16, gain = 0.09, from, to, q = 6 }: NoiseOptions) {
  const c = ensureContext();
  if (!c || !master) return;

  const t0 = c.currentTime + at;
  const frames = Math.max(1, Math.floor(c.sampleRate * duration));
  const buffer = c.createBuffer(1, frames, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    // Deterministic pseudo-noise keeps the texture consistent.
    const t = i / frames;
    data[i] = (Math.sin(i * 12.9898) * 43758.5453 % 1) * 2 - 1;
    data[i] *= 1 - t;
  }

  const src = c.createBufferSource();
  src.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, t0);
  filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + duration);

  const env = c.createGain();
  env.gain.setValueAtTime(gain, t0);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  src.connect(filter).connect(env).connect(master);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}

export function playSound(name: SoundName, gainScale = 1) {
  if (!enabled || typeof window === 'undefined') return;
  if (master) master.gain.value = volume;

  switch (name) {
    case 'startup':
      // Bright ascending Vista-style welcome chime.
      tone({ freq: 523.25, type: 'triangle', duration: 0.5, gain: 0.16 * gainScale, attack: 0.02 });
      tone({ freq: 659.25, type: 'triangle', at: 0.09, duration: 0.5, gain: 0.15 * gainScale, attack: 0.02 });
      tone({ freq: 783.99, type: 'triangle', at: 0.18, duration: 0.6, gain: 0.14 * gainScale, attack: 0.02 });
      tone({ freq: 1046.5, type: 'sine', at: 0.27, duration: 0.7, gain: 0.1 * gainScale, attack: 0.03 });
      break;
    case 'open':
      tone({ freq: 420, sweepTo: 760, type: 'sine', duration: 0.13, gain: 0.13 * gainScale });
      noiseSweep({ from: 900, to: 2600, duration: 0.1, gain: 0.035 * gainScale });
      break;
    case 'close':
      tone({ freq: 700, sweepTo: 380, type: 'sine', duration: 0.13, gain: 0.12 * gainScale });
      noiseSweep({ from: 2400, to: 800, duration: 0.1, gain: 0.03 * gainScale });
      break;
    case 'minimize':
      tone({ freq: 620, sweepTo: 300, type: 'triangle', duration: 0.16, gain: 0.1 * gainScale });
      break;
    case 'maximize':
      tone({ freq: 300, sweepTo: 640, type: 'triangle', duration: 0.16, gain: 0.1 * gainScale });
      break;
    case 'click':
      tone({ freq: 1500, sweepTo: 900, type: 'square', duration: 0.035, gain: 0.05 * gainScale });
      break;
    case 'notify':
      tone({ freq: 880, type: 'sine', duration: 0.18, gain: 0.13 * gainScale });
      tone({ freq: 1174.66, at: 0.11, type: 'sine', duration: 0.26, gain: 0.12 * gainScale });
      break;
    case 'error':
      tone({ freq: 320, type: 'square', duration: 0.16, gain: 0.1 * gainScale });
      tone({ freq: 240, at: 0.14, type: 'square', duration: 0.22, gain: 0.1 * gainScale });
      break;
    case 'empty':
      tone({ freq: 220, type: 'sine', duration: 0.12, gain: 0.07 * gainScale });
      break;
  }
}

export function setSoundEnabled(next: boolean) {
  enabled = next;
  if (next) unlockAudio();
}

export function setMasterVolume(next: number) {
  volume = Math.max(0, Math.min(1, next));
  if (master) master.gain.value = volume;
}

export function getSoundEnabled() {
  return enabled;
}

export function getMasterVolume() {
  return volume;
}

/* Convenience wrappers used across the app */
export const playStartupSound = () => playSound('startup');
export const playOpenSound = () => playSound('open');
export const playCloseSound = () => playSound('close');
export const playMinimizeSound = () => playSound('minimize');
export const playMaximizeSound = () => playSound('maximize');
export const playClickSound = () => playSound('click', 0.7);
export const playNotifySound = () => playSound('notify');
export const playErrorSound = () => playSound('error');
export const playEmptySound = () => playSound('empty');

/** Old name kept so nothing has to 404 on load. */
export const preloadSounds = unlockAudio;
