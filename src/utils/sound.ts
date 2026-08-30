// Audio Synthesizer for Token Chimes and Notifications using Web Audio API

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a temple/airport style queue chime (e.g. Ding-Dong)
 */
export function playQueueChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // First tone (G4 - 392Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.8);

    // Second tone (E5 - 659Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.25); // E5
    gain2.gain.setValueAtTime(0, now + 0.25);
    gain2.gain.linearRampToValueAtTime(0.35, now + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.25);
    osc2.stop(now + 1.2);
  } catch (e) {
    console.warn('Audio playback not permitted yet:', e);
  }
}

/**
 * Play success booking sound
 */
export function playSuccessSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + index * 0.08;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
}

export interface SpeakOptions {
  speaker?: 'priya' | 'arvind' | 'roopa' | 'shubh' | 'amartya';
  pace?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

// Global active audio object tracking
let currentAudioInstance: HTMLAudioElement | null = null;

/**
 * Stop any current speech playback
 */
export function stopSpeaking(): void {
  if (currentAudioInstance) {
    currentAudioInstance.pause();
    currentAudioInstance = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function playBase64Audio(base64Data: string, onStart?: () => void, onEnd?: () => void): void {
  try {
    const audio = new Audio(`data:audio/wav;base64,${base64Data}`);
    currentAudioInstance = audio;

    audio.onplay = () => {
      if (onStart) onStart();
    };

    audio.onended = () => {
      currentAudioInstance = null;
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      currentAudioInstance = null;
      if (onEnd) onEnd();
    };

    audio.play().catch(e => {
      console.warn('Audio playback error:', e);
      if (onEnd) onEnd();
    });
  } catch (err) {
    if (onEnd) onEnd();
  }
}

function fallbackWebSpeech(text: string, lang: 'en' | 'te' | 'hi', options: SpeakOptions): void {
  const { pace = 0.95, pitch = 1.0, onStart, onEnd } = options;

  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser');
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = pace;
  utterance.pitch = pitch || 1.0;

  const targetLang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
  utterance.lang = targetLang;

  // Smart natural voice selector for Hindi/Telugu/English
  const voices = window.speechSynthesis.getVoices();
  const matchingVoice = voices.find(v => 
    v.lang.toLowerCase().includes(targetLang.toLowerCase()) || 
    (lang === 'hi' && (v.name.includes('Hindi') || v.name.includes('हिन्दी') || v.name.includes('Hemant') || v.name.includes('Kalpana'))) ||
    (lang === 'te' && (v.name.includes('Telugu') || v.name.includes('తెలుగు')))
  );

  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}
