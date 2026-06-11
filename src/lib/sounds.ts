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
  
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.15, now);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  masterGain.connect(ctx.destination);
  
  // Simulation de réverbération douce via DelayNode
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.12;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.35;
  
  delay.connect(feedback);
  feedback.connect(delay); // feedback loop
  delay.connect(masterGain);
  
  const notes = [523.25, 659.25, 783.99]; // Do5-Mi5-Sol5 (C5-E5-G5)
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + idx * 0.08); // Montent rapidement
    
    const startTime = now + idx * 0.08;
    const noteDuration = 0.4;
    
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.6, startTime + 0.05);
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);
    
    osc.connect(noteGain);
    noteGain.connect(masterGain);
    noteGain.connect(delay); // Réverbération
    
    osc.start(startTime);
    osc.stop(startTime + noteDuration);
  });
}

export function playXPGain() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.1, now);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  masterGain.connect(ctx.destination);
  
  const notes = [880, 1100]; // "ding-ding"
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + idx * 0.08); // Montantes
    
    const startTime = now + idx * 0.08;
    const noteDuration = 0.2;
    
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.8, startTime + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);
    
    osc.connect(noteGain);
    noteGain.connect(masterGain);
    
    osc.start(startTime);
    osc.stop(startTime + noteDuration);
  });
}

export function playLevelUp() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.12, now);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  masterGain.connect(ctx.destination);
  
  const notes = [261.63, 293.66, 329.63, 392.00, 523.25]; // Do4-Ré4-Mi4-Sol4-Do5 (C4-D4-E4-G4-C5)
  notes.forEach((freq, idx) => {
    const startTime = now + idx * 0.12;
    const noteDuration = idx === notes.length - 1 ? 0.55 : 0.25;
    
    // Oscillateur principal (triangle chaleureux)
    const osc1 = ctx.createOscillator();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(freq, startTime);
    
    // Oscillateur secondaire légèrement désaccordé (+8 cents) pour de la richesse
    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq, startTime);
    osc2.detune.setValueAtTime(8, startTime);
    
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.5, startTime + 0.03);
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);
    
    osc1.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(masterGain);
    
    osc1.start(startTime);
    osc1.stop(startTime + noteDuration);
    osc2.start(startTime);
    osc2.stop(startTime + noteDuration);
  });
}

export function playStreakSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  
  // LFO pour vibrato rapide (15 Hz)
  const lfo = ctx.createOscillator();
  lfo.frequency.setValueAtTime(15, now);
  
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(35, now); // modulation +/- 35 Hz
  
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  
  // Fréquence centrale qui monte et descend rapidement
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.linearRampToValueAtTime(580, now + 0.2);
  osc.frequency.linearRampToValueAtTime(250, now + 0.5);
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  lfo.start(now);
  lfo.stop(now + 0.5);
  osc.start(now);
  osc.stop(now + 0.5);
}

export function playAbandonWarning() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.1, now);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  masterGain.connect(ctx.destination);
  
  const notes = [392.00, 311.13]; // Sol4-Mib4 (triste, ton mineur)
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + idx * 0.2);
    
    const startTime = now + idx * 0.2;
    const noteDuration = idx === 0 ? 0.25 : 0.3;
    
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.8, startTime + 0.05);
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);
    
    osc.connect(noteGain);
    noteGain.connect(masterGain);
    
    osc.start(startTime);
    osc.stop(startTime + noteDuration);
  });
}

export function playSessionStart() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.08, now);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
  masterGain.connect(ctx.destination);
  
  const notes = [659.25, 783.99, 987.77]; // Mi5-Sol5-Si5 (E5-G5-B5)
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + idx * 0.15); // Espacées de 0.15s
    
    const startTime = now + idx * 0.15;
    const noteDuration = 0.45;
    
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.6, startTime + 0.08); // Fondu entrant doux
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);
    
    osc.connect(noteGain);
    noteGain.connect(masterGain);
    
    osc.start(startTime);
    osc.stop(startTime + noteDuration);
  });
}

export function playCorrect() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = "sine";
  osc.frequency.setValueAtTime(1047, now); // Do6
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2); // Durée 0.2s
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.2);
}

export function playStepComplete() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.1, now);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  masterGain.connect(ctx.destination);
  
  const notes = [392.00, 523.25]; // Sol4-Do5
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + idx * 0.12);
    
    const startTime = now + idx * 0.12;
    const noteDuration = 0.22;
    
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.7, startTime + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);
    
    osc.connect(noteGain);
    noteGain.connect(masterGain);
    
    osc.start(startTime);
    osc.stop(startTime + noteDuration);
  });
}
