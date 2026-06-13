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
  masterGain.connect(ctx.destination);

  const notes = [523.25, 659.25, 783.99, 1046.5]; // do-mi-sol-do octave+1
  const spacing = 0.08;
  const duration = 0.15;

  notes.forEach((freq, idx) => {
    const startTime = now + idx * spacing;
    
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, startTime);

    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq + 2, startTime); // désaccordé +2Hz

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.4, startTime + 0.01); // attaque 0.01s
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // decay exponentiel

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(masterGain);

    osc1.start(startTime);
    osc1.stop(startTime + duration);
    osc2.start(startTime);
    osc2.stop(startTime + duration);
  });
}

export function playXPGain() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.12, now);
  masterGain.connect(ctx.destination);

  // Note 1 (880 Hz)
  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(880, now);

  const gain1 = ctx.createGain();
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.5, now + 0.01);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc1.connect(gain1);
  gain1.connect(masterGain);

  osc1.start(now);
  osc1.stop(now + 0.12);

  // Note 2 (1318 Hz)
  const start2 = now + 0.08;
  const duration2 = 0.17;

  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(1318, start2);

  // Vibrato LFO pour note 2 (±10Hz à 8Hz)
  const lfo = ctx.createOscillator();
  lfo.frequency.setValueAtTime(8, start2);

  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(10, start2);

  lfo.connect(lfoGain);
  lfoGain.connect(osc2.frequency);

  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0, start2);
  gain2.gain.linearRampToValueAtTime(0.5, start2 + 0.01);
  gain2.gain.exponentialRampToValueAtTime(0.001, start2 + duration2);

  osc2.connect(gain2);
  gain2.connect(masterGain);

  lfo.start(start2);
  lfo.stop(start2 + duration2);
  osc2.start(start2);
  osc2.stop(start2 + duration2);
}

export function playLevelUp() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.13, now);
  masterGain.connect(ctx.destination);

  const notes = [523, 659, 783, 1046, 1318]; // do-mi-sol-do-mi
  const spacing = 0.08;
  const noteDuration = 0.58; // Se termine à now + 0.9s

  notes.forEach((freq, idx) => {
    const startTime = now + idx * spacing;
    
    const oscSine = ctx.createOscillator();
    oscSine.type = "sine";
    oscSine.frequency.setValueAtTime(freq, startTime);

    const oscSaw = ctx.createOscillator();
    oscSaw.type = "sawtooth";
    oscSaw.frequency.setValueAtTime(freq, startTime);

    const oscTri = ctx.createOscillator();
    oscTri.type = "triangle";
    oscTri.frequency.setValueAtTime(freq, startTime);

    // Filtre lowpass qui s'ouvre de 400Hz à 2000Hz
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, startTime);
    filter.frequency.exponentialRampToValueAtTime(2000, startTime + 0.3);

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

    oscSine.connect(noteGain);
    oscTri.connect(noteGain);
    
    oscSaw.connect(filter);
    filter.connect(noteGain);

    noteGain.connect(masterGain);

    oscSine.start(startTime);
    oscSine.stop(startTime + noteDuration);
    oscSaw.start(startTime);
    oscSaw.stop(startTime + noteDuration);
    oscTri.start(startTime);
    oscTri.stop(startTime + noteDuration);
  });
}

export function playStreakSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.1, now);
  masterGain.connect(ctx.destination);

  // Oscillateur triangle
  const osc = ctx.createOscillator();
  osc.type = "triangle";

  // LFO 15Hz
  const lfo = ctx.createOscillator();
  lfo.frequency.setValueAtTime(15, now);

  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(20, now);

  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  // Fréquence : 220Hz -> 440Hz en 0.3s -> 180Hz en 0.2s
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.linearRampToValueAtTime(440, now + 0.3);
  osc.frequency.linearRampToValueAtTime(180, now + 0.5);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0, now);
  oscGain.gain.linearRampToValueAtTime(0.6, now + 0.05);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc.connect(oscGain);
  oscGain.connect(masterGain);

  // Bruit blanc filtré en parallèle (simule souffle de flamme)
  const bufferSize = ctx.sampleRate * 0.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(600, now);
  noiseFilter.Q.setValueAtTime(1.5, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(0.15, now + 0.05);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);

  lfo.start(now);
  lfo.stop(now + 0.5);
  osc.start(now);
  osc.stop(now + 0.5);
  noiseSource.start(now);
  noiseSource.stop(now + 0.5);
}

export function playAbandonWarning() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.1, now);
  masterGain.connect(ctx.destination);

  // Réverb simulée (delay 0.1s, feedback 0.3)
  const delay = ctx.createDelay();
  delay.delayTime.setValueAtTime(0.1, now);
  const feedback = ctx.createGain();
  feedback.gain.setValueAtTime(0.3, now);

  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(masterGain);

  const notes = [622, 523, 440]; // la-do-mi bémol descendant
  const spacing = 0.15;
  const decay = 0.8;

  notes.forEach((freq, idx) => {
    const startTime = now + idx * spacing;
    
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startTime);

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + decay);

    osc.connect(noteGain);
    noteGain.connect(masterGain);
    noteGain.connect(delay);

    osc.start(startTime);
    osc.stop(startTime + decay);
  });
}

export function playSessionStart() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.08, now);
  masterGain.connect(ctx.destination);

  const notes = [329, 392, 493]; // mi-sol-si
  const spacing = 0.2;
  const decay = 0.6;

  notes.forEach((freq, idx) => {
    const startTime = now + idx * spacing;
    
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startTime);

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.5, startTime + 0.08); // attaque douce 0.08s
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + decay);

    osc.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + decay);
  });
}

export function playCorrect() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1174, now); // 1174 Hz (ré5)

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.12, now + 0.005); // attaque 0.005s
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15); // durée 0.15s

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.15);
}

export function playStepComplete() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.11, now);
  masterGain.connect(ctx.destination);

  const notes = [783, 1046]; // sol-do
  const spacing = 0.12;
  const duration = 0.28; // durée 0.4s au total avec l'espacement

  notes.forEach((freq, idx) => {
    const startTime = now + idx * spacing;
    
    // Fondamentale
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, startTime);

    // Harmonique légère (x2 fréquence, volume x0.3)
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0, startTime);
    gain1.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, startTime);
    gain2.gain.linearRampToValueAtTime(0.15, startTime + 0.01); // 0.5 * 0.3
    gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc1.connect(gain1);
    gain1.connect(masterGain);

    osc2.connect(gain2);
    gain2.connect(masterGain);

    osc1.start(startTime);
    osc1.stop(startTime + duration);
    osc2.start(startTime);
    osc2.stop(startTime + duration);
  });
}

export function playBadgeEarned() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.13, now);
  masterGain.connect(ctx.destination);

  const notes = [523, 587, 659, 783, 880]; // do-ré-mi-sol-la
  const spacing = 0.07;
  const duration = 0.52; // durée 0.8s au total avec l'espacement

  notes.forEach((freq, idx) => {
    const startTime = now + idx * spacing;
    
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, startTime);

    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq + 5, startTime); // shimmer (+5Hz)

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(masterGain);

    osc1.start(startTime);
    osc1.stop(startTime + duration);
    osc2.start(startTime);
    osc2.stop(startTime + duration);
  });
}

export function playStreakMilestone() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.12, now);
  masterGain.connect(ctx.destination);

  const notes = [523, 659, 783, 987]; // do-mi-sol-si (accord majeur 7)
  const decay = 1.2;

  notes.forEach((freq) => {
    const oscMain = ctx.createOscillator();
    oscMain.type = "sine";
    oscMain.frequency.setValueAtTime(freq, now);

    const oscDetuneDown = ctx.createOscillator();
    oscDetuneDown.type = "sine";
    oscDetuneDown.frequency.setValueAtTime(freq - 3, now); // chorus -3Hz

    const oscDetuneUp = ctx.createOscillator();
    oscDetuneUp.type = "sine";
    oscDetuneUp.frequency.setValueAtTime(freq + 3, now); // chorus +3Hz

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(0.3, now + 0.02); // attaque 0.02s
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + decay); // decay 1.2s

    oscMain.connect(noteGain);
    oscDetuneDown.connect(noteGain);
    oscDetuneUp.connect(noteGain);
    noteGain.connect(masterGain);

    oscMain.start(now);
    oscMain.stop(now + decay);
    oscDetuneDown.start(now);
    oscDetuneDown.stop(now + decay);
    oscDetuneUp.start(now);
    oscDetuneUp.stop(now + decay);
  });
}
