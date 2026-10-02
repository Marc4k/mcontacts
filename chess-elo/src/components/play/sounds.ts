"use client";

// Synthesized with Web Audio, so there are no sound files to load.
let ctx: AudioContext | null = null;
let muted = false;
const MUTE_KEY = "checkmate.muted";

try {
  muted = typeof localStorage !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
} catch {}

export function isMuted() {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {}
}

/**
 * Must run inside a tap at least once: iOS only lets audio start from a user gesture.
 */
export function unlockAudio() {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function audio() {
  if (muted || !ctx || ctx.state !== "running") return null;
  return ctx;
}

/** A soft, wooden "tock" like a mechanical clock button. */
export function playClick() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;

  const len = Math.floor(ac.sampleRate * 0.04);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1800;
  band.Q.value = 1.2;
  const noiseGain = ac.createGain();
  noiseGain.gain.value = 0.35;
  noise.connect(band).connect(noiseGain).connect(ac.destination);
  noise.start(t);

  const body = ac.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(420, t);
  body.frequency.exponentialRampToValueAtTime(180, t + 0.05);
  const bodyGain = ac.createGain();
  bodyGain.gain.setValueAtTime(0.0001, t);
  bodyGain.gain.exponentialRampToValueAtTime(0.25, t + 0.004);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  body.connect(bodyGain).connect(ac.destination);
  body.start(t);
  body.stop(t + 0.08);
}

function beep(freq: number, start: number, duration: number, volume: number) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.setValueAtTime(volume, t + duration - 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

/** Short tick for each of the last 10 seconds. */
export function playLowTime() {
  beep(1046, 0, 0.07, 0.12);
}

/** Time's up. */
export function playFlag() {
  beep(784, 0, 0.18, 0.25);
  beep(784, 0.25, 0.18, 0.25);
  beep(523, 0.5, 0.45, 0.25);
}
