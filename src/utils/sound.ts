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

/**
 * Play voice start listening chime
 */
export function playVoiceStartChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now); // A4
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    // Ignore audio context errors
  }
}

/**
 * Play voice recognition success chime
 */
export function playVoiceSuccessChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(880, now + 0.1); // A5
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    // Ignore audio context errors
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

/**
 * Text-To-Speech Narration for Kisan Madad powered by Sarvam AI Indic Bulbul engine (with Web Speech fallback)
 */
export async function speakText(
  text: string,
  lang: 'en' | 'te' | 'hi' = 'hi',
  options: SpeakOptions = {}
): Promise<void> {
  const { speaker = 'priya', pace = 0.95, pitch = 0, onStart, onEnd } = options;
  stopSpeaking();

  // Attempt natural Indic speech generation via backend Sarvam AI Bulbul TTS
  try {
    const target_language_code = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    const res = await fetch('/api/sarvam/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        target_language_code,
        speaker,
        pace,
        pitch
      })
    });

    const json = await res.json();
    if (json.success && json.audioBase64) {
      const audio = new Audio(`data:audio/wav;base64,${json.audioBase64}`);
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
        fallbackWebSpeech(text, lang, options);
      };

      await audio.play();
      return;
    }
  } catch (e) {
    console.warn('Kisan Madad Sarvam TTS fallback to browser Web Speech API:', e);
  }

  // Fallback to browser SpeechSynthesis API
  fallbackWebSpeech(text, lang, options);
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

