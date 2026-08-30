import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, HelpCircle, Sparkles, Subtitles, Settings, VolumeX, Radio, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { speakText, stopSpeaking, playVoiceStartChime, playVoiceSuccessChime } from '../utils/sound';
import { processVoiceIntent } from '../utils/voiceAssistantEngine';

export const VoiceAssistant: React.FC = () => {
  const {
    activeToken,
    announcements,
    centres,
    farmer,
    bookToken,
    setActiveTab,
    setSearchQuery,
    setSelectedCrop,
    setSelectedDistrict,
    detectUserLocation,
    setBookingCentre
  } = useApp();

  const { lang, setLang } = useLanguage();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);

  // Voice AI Configuration
  const [speakerVoice, setSpeakerVoice] = useState<'priya' | 'arvind' | 'roopa' | 'shubh'>('priya');
  const [speechPace, setSpeechPace] = useState<number>(0.95);

  // MediaRecorder state for Sarvam AI STT Fallback
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Subtitle state for Hindi & English translation
  const [hindiSubtitle, setHindiSubtitle] = useState<string>('किसान मदद AI से बात करने के लिए माइक दबाएं...');
  const [englishSubtitle, setEnglishSubtitle] = useState<string>('Press mic button to speak with Kisan Madad AI...');
  const [activeActionTag, setActiveActionTag] = useState<string | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = lang === 'te' ? 'te-IN' : lang === 'en' ? 'en-IN' : 'hi-IN';

      rec.onstart = () => {
        setIsListening(true);
        playVoiceStartChime();
        setSpeechText('सुन रहा हूँ... बोलिए (Listening...)');
        setHindiSubtitle('किसान मदद: आपकी आवाज़ सुन रहा हूँ... बोलिए।');
        setEnglishSubtitle('Kisan Madad: Listening to your voice... speak now.');
      };

      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        playVoiceSuccessChime();
        setSpeechText(text);
        executeCommand(text);
      };

      rec.onerror = (e: any) => {
        console.warn('Browser Speech recognition error/fallback triggered:', e);
        // Fallback to Sarvam STT MediaRecorder
        startSarvamMediaRecorder();
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [lang, activeToken, announcements, centres]);

  // Fallback MediaRecorder for Sarvam STT
  const startSarvamMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setIsListening(false);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            const res = await fetch('/api/sarvam/stt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64Audio, language_code: lang === 'te' ? 'te-IN' : 'hi-IN' })
            });
            const json = await res.json();
            if (json.success && json.transcript) {
              playVoiceSuccessChime();
              setSpeechText(json.transcript);
              executeCommand(json.transcript);
            } else {
              setSpeechText('सुनने में समस्या। कृपया दोबारा बोलें।');
            }
          } catch (err) {
            setSpeechText('माइक्रोफ़ोन त्रुटि। फिर प्रयास करें।');
          }
        };
        // Stop audio tracks
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsListening(true);
      playVoiceStartChime();
      setSpeechText('रिकॉर्डिंग शुरू (Sarvam AI STT)... बोलिए');

      // Auto stop after 5 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 5000);
    } catch (e) {
      console.error('MediaRecorder not allowed or error:', e);
      setIsListening(false);
      setSpeechText('माइक्रोफ़ोन अनुमति आवश्यक है।');
    }
  };

  const startListening = () => {
    stopSpeaking();
    if (isListening) {
      if (recognition) recognition.stop();
      if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
      setIsListening(false);
      return;
    }

    if (recognition) {
      try {
        recognition.start();
      } catch (err) {
        startSarvamMediaRecorder();
      }
    } else {
      startSarvamMediaRecorder();
    }
  };

  const executeCommand = async (commandText: string) => {
    const result = await processVoiceIntent({
      command: commandText,
      lang: lang as 'en' | 'te' | 'hi',
      activeToken,
      announcements,
      centres,
      farmer,
      setActiveTab,
      setSearchQuery,
      setSelectedCrop,
      setSelectedDistrict,
      setLanguage: (newLang) => setLang(newLang),
      detectUserLocation,
      openBookingModal: (centre) => {
        setBookingCentre(centre || centres[0] || null);
      },
      directBookToken: (tokenData) => bookToken(tokenData)
    });

    setHindiSubtitle(result.speechTextHi);
    setEnglishSubtitle(result.speechTextEn);
    setActiveActionTag(result.actionTaken);

    speakText(result.spokenMessage, lang as 'en' | 'te' | 'hi', {
      speaker: speakerVoice,
      pace: speechPace,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false)
    });
  };

  const handleQuickCommand = (cmd: string) => {
    setSpeechText(cmd);
    executeCommand(cmd);
  };

  return (
    <div className="bg-[#FFFDF8] border border-slate-200/90 rounded-3xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 space-y-4 paper-bg-texture glow-hover relative overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black font-mono text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600 animate-pulse" />
              Sarvam Indic Voice Engine v2
            </span>
            <span className="text-[9px] text-purple-900 bg-purple-100/80 font-extrabold font-mono px-1.5 py-0.5 rounded uppercase">
              {speakerVoice} • {speechPace}x
            </span>
          </div>
          <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2 pt-0.5">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-sm transition-all duration-300 ${
              isSpeaking
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 scale-110 shadow-emerald-500/30'
                : isListening
                ? 'bg-gradient-to-r from-red-600 to-rose-500 scale-110 animate-bounce'
                : 'bg-gradient-to-tr from-purple-700 to-indigo-600'
            }`}>
              <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
            </div>
            किसान मदद Voice AI
          </h3>
        </div>

        {/* Action Controls Header */}
        <div className="flex items-center gap-1">
          {isSpeaking && (
            <button
              onClick={() => { stopSpeaking(); setIsSpeaking(false); }}
              className="p-1.5 rounded-xl bg-red-100 border border-red-200 text-red-600 hover:bg-red-200 transition cursor-pointer flex items-center gap-1 text-[10px] font-mono font-bold"
              title="Stop Audio"
            >
              <VolumeX className="w-3.5 h-3.5" />
              Stop
            </button>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              showSettings
                ? 'bg-purple-100 border-purple-300 text-purple-900'
                : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700'
            }`}
            title="Voice AI Speaker & Pace Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={`p-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              showSubtitles
                ? 'bg-purple-100 border-purple-300 text-purple-900 shadow-xs'
                : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
            title="Toggle Subtitles (CC)"
          >
            <Subtitles className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            title="Voice Commands List"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice Settings Panel Dropdown */}
      {showSettings && (
        <div className="bg-purple-950 text-white rounded-2xl p-3 border border-purple-500/30 text-xs space-y-2 animate-fadeIn shadow-lg">
          <div className="flex items-center justify-between border-b border-purple-800 pb-1.5">
            <span className="font-extrabold text-[10px] font-mono text-purple-300 uppercase tracking-widest flex items-center gap-1">
              <Radio className="w-3 h-3 text-purple-400" /> Sarvam Indic Voice Synthesizer
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <label className="text-[9px] text-purple-300 font-bold block mb-1 uppercase">Voice Speaker:</label>
              <select
                value={speakerVoice}
                onChange={(e) => setSpeakerVoice(e.target.value as any)}
                className="w-full bg-purple-900 border border-purple-700 rounded-lg px-2 py-1 text-white font-bold text-xs focus:outline-none"
              >
                <option value="priya">👩 Priya (Natural Female)</option>
                <option value="arvind">👨 Arvind (Deep Male)</option>
                <option value="roopa">👩 Roopa (Clear Female)</option>
                <option value="shubh">👨 Shubh (Young Male)</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] text-purple-300 font-bold block mb-1 uppercase">Speech Speed:</label>
              <select
                value={speechPace}
                onChange={(e) => setSpeechPace(parseFloat(e.target.value))}
                className="w-full bg-purple-900 border border-purple-700 rounded-lg px-2 py-1 text-white font-bold text-xs focus:outline-none"
              >
                <option value={0.85}>0.85x (Slow - Clear Rural)</option>
                <option value={0.95}>0.95x (Standard Indic)</option>
                <option value={1.1}>1.10x (Fast)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Mic Trigger & Dynamic Audio Equalizer */}
      <div className="flex items-center gap-3 bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200/80 relative">
        <button
          onClick={startListening}
          className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-300 btn-active-press cursor-pointer flex-shrink-0 relative z-10 ${
            isListening
              ? 'bg-red-500 text-white animate-mic-pulse ring-4 ring-red-300 shadow-lg shadow-red-500/30'
              : isSpeaking
              ? 'bg-emerald-600 text-white ring-4 ring-emerald-300 shadow-lg shadow-emerald-600/30 animate-pulse'
              : 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white shadow-md shadow-purple-700/20 scale-[1.02]'
          }`}
          title={isListening ? 'Stop Listening' : 'Click & speak to Kisan Madad AI'}
        >
          {isListening ? (
            <MicOff className="w-6 h-6 animate-pulse" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-purple-800 font-extrabold uppercase tracking-widest block font-mono">
              {isListening
                ? '🎙️ किसान मदद (सुन रहा है...)'
                : isSpeaking
                ? '🔊 किसान मदद बोल रहा है...'
                : 'किसान मदद AI Assistant'}
            </span>
            {activeActionTag && (
              <span className="text-[8px] font-mono bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-extrabold border border-purple-200">
                {activeActionTag}
              </span>
            )}
          </div>

          <p className="text-xs font-black text-slate-900 truncate">
            {speechText || 'बोलने के लिए माइक दबाएं (e.g. "टोकन बुक करो" / "गेहूं का भाव")'}
          </p>

          {/* Sound wave animated equalizer */}
          {(isListening || isSpeaking) && (
            <div className="flex items-center gap-1 pt-1">
              <div className="w-1 h-3 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1 h-5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1 h-4 bg-emerald-500 rounded-full animate-bounce"></div>
              <div className="w-1 h-6 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
              <div className="w-1 h-3 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.4s]"></div>
              <span className="text-[9px] font-mono font-bold text-slate-500 ml-1">
                {isSpeaking ? 'Sarvam Audio Playing...' : 'Recording Audio...'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Voice Command Chips */}
      <div className="space-y-1.5">
        <span className="text-[9px] font-mono font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-500" /> त्वरित वॉइस कमांड (Quick Voice Actions):
        </span>
        <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
          <button
            onClick={() => handleQuickCommand('टोकन बुक करो')}
            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1"
          >
            🎫 "टोकन बुक करो"
          </button>
          <button
            onClick={() => handleQuickCommand('मेरा टोकन बताओ')}
            className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1"
          >
            📋 "मेरा टोकन बताओ"
          </button>
          <button
            onClick={() => handleQuickCommand('गेहूं का भाव बताओ')}
            className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1"
          >
            🌾 "गेहूं का भाव"
          </button>
          <button
            onClick={() => handleQuickCommand('नवीनतम नोटिस सुनाओ')}
            className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1"
          >
            📢 "नवीनतम नोटिस"
          </button>
          <button
            onClick={() => handleQuickCommand('मौसम और कृषि सलाह')}
            className="bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1"
          >
            🌤️ "मौसम सलाह"
          </button>
        </div>
      </div>

      {/* Voice Assistant Help Guide */}
      {showHelp && (
        <div className="bg-slate-100/90 border border-slate-200 rounded-2xl p-3 text-[10px] text-slate-700 leading-relaxed space-y-1.5 font-bold animate-fadeIn">
          <p className="font-extrabold text-slate-900 uppercase tracking-wider text-[9px]">अन्य समर्थित वॉइस निर्देश (Voice Commands):</p>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[9.5px]">
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 text-slate-800">"गोरखपुर मंडी दिखाओ"</div>
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 text-slate-800">"धान क्रय केंद्र"</div>
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 text-slate-800">"पास की मंडी ढूँढो"</div>
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 text-slate-800">"नक्शा खोलें"</div>
          </div>
        </div>
      )}

      {/* Live Bilingual Subtitles Container */}
      {showSubtitles && (
        <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 border border-purple-500/30 rounded-2xl p-3 shadow-md space-y-1.5 text-white animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-1">
            <span className="text-[9px] font-mono uppercase tracking-widest text-purple-300 font-extrabold flex items-center gap-1">
              <Subtitles className="w-3 h-3 text-purple-400" />
              Live Bilingual Subtitles (उपशीर्षक)
            </span>
            <span className="text-[8px] bg-purple-500/20 text-purple-200 border border-purple-400/30 px-1.5 py-0.5 rounded font-mono font-bold">
              HI ➔ EN Realtime
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            {/* Hindi Subtitle */}
            <div className="flex items-start gap-2">
              <span className="text-[9px] font-mono text-emerald-400 font-extrabold bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">HI</span>
              <p className="font-semibold text-slate-100 text-[11px] leading-snug">
                {hindiSubtitle}
              </p>
            </div>

            {/* English Subtitle */}
            <div className="flex items-start gap-2">
              <span className="text-[9px] font-mono text-cyan-400 font-extrabold bg-cyan-950/80 border border-cyan-500/30 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">EN</span>
              <p className="font-semibold text-cyan-200 text-[11px] leading-snug italic">
                {englishSubtitle}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;
