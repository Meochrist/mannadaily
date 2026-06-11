let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSuccess() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = "sine";
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  
  // do-mi-sol (C4, E4, G4)
  const notes = [261.63, 329.63, 392.00];
  osc.frequency.setValueAtTime(notes[0], now);
  osc.frequency.setValueAtTime(notes[1], now + 0.12);
  osc.frequency.setValueAtTime(notes[2], now + 0.24);
  
  osc.start(now);
  osc.stop(now + 0.5);
}

export function playStreakSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = "triangle";
  
  // Crépitement / flamme modulée
  osc.frequency.setValueAtTime(440, now);
  for (let i = 0; i < 15; i++) {
    const time = now + i * 0.03;
    const freq = 440 + Math.sin(i * 1.5) * 80;
    osc.frequency.setValueAtTime(freq, time);
  }
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  
  osc.start(now);
  osc.stop(now + 0.45);
}

export function playLevelUp() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  
  const playBrass = (freq: number, startDelay: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, now + startDelay);
    
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, now + startDelay);
    filter.frequency.exponentialRampToValueAtTime(200, now + startDelay + duration);
    
    gain.gain.setValueAtTime(0, now + startDelay);
    gain.gain.linearRampToValueAtTime(0.12, now + startDelay + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + startDelay + duration);
    
    osc.start(now + startDelay);
    osc.stop(now + startDelay + duration);
  };
  
  // Fanfare triomphante
  playBrass(261.63, 0, 0.15);     // C4
  playBrass(329.63, 0.1, 0.15);   // E4
  playBrass(392.00, 0.2, 0.15);   // G4
  playBrass(523.25, 0.3, 0.45);   // C5
  playBrass(659.25, 0.35, 0.45);  // E5
}

export function playXPGain() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = "sine";
  osc.frequency.setValueAtTime(987.77, now); // B5 (cristallin)
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  
  osc.start(now);
  osc.stop(now + 0.25);
}

export function playAbandonWarning() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = "sawtooth";
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(800, now);
  
  // Glissando descendant triste
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.linearRampToValueAtTime(160, now + 0.5);
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  
  osc.start(now);
  osc.stop(now + 0.5);
}

export function playSessionStart() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  
  const playNote = (freq: number, startDelay: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + startDelay);
    
    gain.gain.setValueAtTime(0, now + startDelay);
    gain.gain.linearRampToValueAtTime(0.08, now + startDelay + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + startDelay + duration);
    
    osc.start(now + startDelay);
    osc.stop(now + startDelay + duration);
  };
  
  // Carillon lent et doux
  playNote(261.63, 0, 0.8);   // C4
  playNote(392.00, 0.1, 0.7); // G4
  playNote(523.25, 0.2, 0.6); // C5
}
