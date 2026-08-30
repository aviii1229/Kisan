import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Subtitles, Settings, VolumeX, Zap, Radio, CheckCircle, ArrowRight, RefreshCw, MessageSquare, ShieldCheck, MapPin, FileText, LineChart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { speakText, stopSpeaking, playVoiceStartChime, playVoiceSuccessChime } from '../utils/sound';
import { processVoiceIntent, InteractiveBookingData } from '../utils/voiceAssistantEngine';
import { InChatBookingCard } from './InChatBookingCard';

interface ChatBubble {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  subtextEn?: string;
  time: string;
  actionTaken?: string;
  bookingForm?: InteractiveBookingData;
}

export const VoiceAssistantPage: React.FC = () => {
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
    setBookingCentre,
    voiceHistory,
    addVoiceMessages,
    clearVoiceHistory
  } = useApp();

  const { lang, setLang } = useLanguage();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);

  // Configuration Settings
  const [speakerVoice, setSpeakerVoice] = useState<'priya' | 'arvind' | 'roopa' | 'shubh'>('priya');
  const [speechPace, setSpeechPace] = useState<number>(0.95);

  // Live Subtitles
  const [hindiSubtitle, setHindiSubtitle] = useState<string>('किसान मदद AI से बात करने के लिए माइक बटन दबाएं या नीचे टाइप करें...');
  const [englishSubtitle, setEnglishSubtitle] = useState<string>('Press mic button or type below to speak with Kisan Madad AI...');
  const [activeActionTag, setActiveActionTag] = useState<string | null>(null);

  // MediaRecorder state for Sarvam STT Fallback
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [voiceHistory]);

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
        console.warn('Browser Speech recognition error, starting Sarvam STT:', e);
        startSarvamMediaRecorder();
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [lang, activeToken, announcements, centres, farmer]);

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
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsListening(true);
      playVoiceStartChime();
      setSpeechText('रिकॉर्डिंग चालू (Sarvam AI STT)... बोलिए');

      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 5000);
    } catch (e) {
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
    const userMsg: ChatBubble = {
      id: Date.now().toString(),
      sender: 'user',
      text: commandText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

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

    const primaryText = lang === 'te' ? result.speechTextTe : lang === 'en' ? result.speechTextEn : result.speechTextHi;
    const secondaryText = lang === 'hi' ? result.speechTextEn : result.speechTextHi;

    const aiMsg: ChatBubble = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: primaryText,
      subtextEn: secondaryText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionTaken: result.actionTaken,
      bookingForm: result.bookingFormPreset
    };

    addVoiceMessages([userMsg, aiMsg]);

    speakText(result.spokenMessage, lang as 'en' | 'te' | 'hi', {
      speaker: speakerVoice,
      pace: speechPace,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false)
    });
  };

  const handleQuickLaunch = (cmd: string) => {
    setSpeechText(cmd);
    executeCommand(cmd);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Hero Header */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-lifted border border-purple-500/40 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-gradient-to-l from-purple-500/15 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-[11px] font-extrabold font-mono uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-spin" />
              Kisan Madad Indic Voice AI Command Hub
            </div>
            <h1 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight leading-tight">
              किसान मदद Voice AI Hub
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed font-semibold">
              Speak naturally in Hindi, Telugu, or English. Book digital tokens for specific mandis, check active queue positions, compare MSP rates, or listen to official announcements—hands free.
            </p>
          </div>

          {/* Engine Status Badges */}
          <div className="flex flex-wrap md:flex-col gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-xs font-bold text-white">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Sarvam AI Bulbul v1 & Saarika v2</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-xs font-bold text-white">
              <ShieldCheck className="w-4 h-4 text-purple-300" />
              <span>Speaker: {speakerVoice} • {speechPace}x Pace</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Voice Mic Console & Conversation Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Voice Control Console */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Microphone Console Card */}
          <div className="bg-[#FFFDF8] border border-purple-200/90 rounded-3xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 space-y-5 paper-bg-texture glow-hover">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md transition-all ${
                  isSpeaking ? 'bg-emerald-600 scale-110 shadow-emerald-500/30' : isListening ? 'bg-red-500 scale-110 animate-bounce' : 'bg-purple-800'
                }`}>
                  <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Voice Assistant Console</h3>
                  <span className="text-[10px] text-purple-700 font-mono font-bold">Tap mic to start listening</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isSpeaking && (
                  <button
                    onClick={() => { stopSpeaking(); setIsSpeaking(false); }}
                    className="px-2.5 py-1 rounded-xl bg-red-100 border border-red-200 text-red-600 hover:bg-red-200 text-xs font-mono font-bold cursor-pointer flex items-center gap-1"
                  >
                    <VolumeX className="w-3.5 h-3.5" /> Stop
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    showSettings ? 'bg-purple-100 border-purple-300 text-purple-900' : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                  title="Configure Speaker Voice"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Voice Settings Expandable Drawer */}
            {showSettings && (
              <div className="bg-purple-950 text-white rounded-2xl p-4 border border-purple-500/40 space-y-3 animate-fadeIn text-xs">
                <span className="font-extrabold text-[10px] font-mono text-purple-300 uppercase tracking-wider block">
                  Sarvam AI Indic Voice Synthesizer Configuration:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-purple-200 font-bold block mb-1">Speaker Voice:</label>
                    <select
                      value={speakerVoice}
                      onChange={(e) => setSpeakerVoice(e.target.value as any)}
                      className="w-full bg-purple-900 border border-purple-700 rounded-xl px-2.5 py-1.5 text-white font-bold text-xs focus:outline-none"
                    >
                      <option value="priya">👩 Priya (Natural Female)</option>
                      <option value="arvind">👨 Arvind (Deep Male)</option>
                      <option value="roopa">👩 Roopa (Clear Female)</option>
                      <option value="shubh">👨 Shubh (Young Male)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-purple-200 font-bold block mb-1">Speech Speed:</label>
                    <select
                      value={speechPace}
                      onChange={(e) => setSpeechPace(parseFloat(e.target.value))}
                      className="w-full bg-purple-900 border border-purple-700 rounded-xl px-2.5 py-1.5 text-white font-bold text-xs focus:outline-none"
                    >
                      <option value={0.85}>0.85x (Slow - Clear Rural)</option>
                      <option value={0.95}>0.95x (Standard Indic)</option>
                      <option value={1.1}>1.10x (Fast)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Mic Center Trigger */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-purple-50/70 to-indigo-50/40 rounded-3xl border border-purple-100 space-y-3 relative">
              <button
                onClick={startListening}
                className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 btn-active-press cursor-pointer relative ${
                  isListening
                    ? 'bg-red-500 ring-8 ring-red-300 scale-110 shadow-red-500/40 animate-pulse'
                    : isSpeaking
                    ? 'bg-emerald-600 ring-8 ring-emerald-300 scale-110 shadow-emerald-600/40 animate-pulse'
                    : 'bg-gradient-to-tr from-purple-700 via-indigo-700 to-purple-900 hover:scale-105 shadow-purple-900/30'
                }`}
                title="Press & Speak"
              >
                {isListening ? (
                  <MicOff className="w-10 h-10 animate-pulse" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>

              <div className="text-center space-y-1">
                <span className="text-xs font-black text-purple-950 block">
                  {isListening ? '🎙️ आपकी आवाज़ सुन रहा हूँ...' : isSpeaking ? '🔊 Sarvam AI उत्तर दे रहा है...' : 'माइक दबाएं और बोलें'}
                </span>
                <p className="text-[11px] font-bold text-slate-500 max-w-xs">
                  {speechText || 'e.g. "गोरखपुर मंडी का टोकन बुक करो" / "गेहूं का भाव क्या है"'}
                </p>
              </div>

              {/* Dynamic Sound Visualizer Wave */}
              {(isListening || isSpeaking) && (
                <div className="flex items-center gap-1.5 pt-2">
                  <div className="w-1.5 h-6 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-10 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-8 bg-emerald-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-12 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
                  <div className="w-1.5 h-5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.4s]"></div>
                </div>
              )}
            </div>

            {/* Quick Action Prompts Bar */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> तुरंत आज़माएं (Quick Prompts):
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  onClick={() => handleQuickLaunch('गोरखपुर मंडी का टोकन बुक करो')}
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-2xl transition cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>🎫 "गोरखपुर मंडी टोकन बुक"</span>
                </button>

                <button
                  onClick={() => handleQuickLaunch('देवरिया मंडी में 50 क्विंटल गेहूं')}
                  className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-2xl transition cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>⚡ "देवरिया 50Q Wheat"</span>
                </button>

                <button
                  onClick={() => handleQuickLaunch('मेरा टोकन बताओ')}
                  className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 rounded-2xl transition cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>📋 "मेरा टोकन बताओ"</span>
                </button>

                <button
                  onClick={() => handleQuickLaunch('गेहूं का भाव क्या है')}
                  className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 rounded-2xl transition cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>🌾 "गेहूं का भाव बताओ"</span>
                </button>
              </div>
            </div>

            {/* Live Bilingual Subtitles Drawer */}
            <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 border border-purple-500/30 rounded-2xl p-4 shadow-md space-y-2 text-white">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300 font-extrabold flex items-center gap-1">
                  <Subtitles className="w-3.5 h-3.5 text-purple-400" />
                  Live Bilingual Subtitles
                </span>
                <span className="text-[8px] bg-purple-500/20 text-purple-200 border border-purple-400/30 px-1.5 py-0.5 rounded font-mono font-bold">
                  Realtime HI ➔ EN
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-[9px] font-mono text-emerald-400 font-extrabold bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">HI</span>
                  <p className="font-semibold text-slate-100 text-xs leading-snug">
                    {hindiSubtitle}
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-[9px] font-mono text-cyan-400 font-extrabold bg-cyan-950/80 border border-cyan-500/30 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">EN</span>
                  <p className="font-semibold text-cyan-200 text-xs leading-snug italic">
                    {englishSubtitle}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Live Conversation Stream & Action Cards */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#FFFDF8] border border-slate-200/90 rounded-3xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col h-[640px] paper-bg-texture glow-hover">
            {/* Header Stream Bar */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-700" />
                <h3 className="text-sm font-black text-slate-900">Conversation & Action Stream</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-lg font-mono font-extrabold">
                  {voiceHistory.length} Messages
                </span>
                <button
                  onClick={clearVoiceHistory}
                  className="text-[10px] bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-lg font-mono font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Clear Chat History"
                >
                  <RefreshCw className="w-3 h-3" /> Clear
                </button>
              </div>
            </div>

            {/* Chat Stream Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {voiceHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-3xl p-4 shadow-xs space-y-1.5 ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-tr-xs'
                        : 'bg-white border border-slate-200/90 text-slate-900 rounded-tl-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
                      <span className={`text-[9px] font-mono font-black uppercase ${msg.sender === 'user' ? 'text-purple-300' : 'text-purple-700'}`}>
                        {msg.sender === 'user' ? '👤 Farmer Voice Prompt' : '🤖 Kisan Madad AI'}
                      </span>
                      {msg.actionTaken && (
                        <span className="text-[8px] font-mono bg-purple-500/20 text-purple-200 px-1.5 py-0.5 rounded font-extrabold border border-purple-400/30">
                          {msg.actionTaken}
                        </span>
                      )}
                    </div>

                    <p className="font-bold text-xs leading-relaxed">{msg.text}</p>
                    
                    {msg.subtextEn && (
                      <p className="text-[11px] italic text-purple-200 font-semibold border-t border-slate-200/40 pt-1.5">
                        {msg.subtextEn}
                      </p>
                    )}

                    {/* Interactive In-Chat Token Booking Card */}
                    {msg.bookingForm && (
                      <InChatBookingCard initialData={msg.bookingForm} />
                    )}

                    <span className={`text-[8px] font-mono block text-right ${msg.sender === 'user' ? 'text-purple-300' : 'text-slate-400'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Form Bar */}
            <div className="pt-4 border-t border-slate-200/80 flex items-center gap-2">
              <button
                onClick={startListening}
                className={`p-3 rounded-2xl text-white font-extrabold flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                  isListening
                    ? 'bg-red-500 shadow-md shadow-red-500/30 animate-pulse'
                    : 'bg-purple-800 hover:bg-purple-900 shadow-md shadow-purple-800/20'
                }`}
                title="Speak Prompt"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={speechText}
                onChange={(e) => setSpeechText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && speechText.trim()) {
                    executeCommand(speechText);
                    setSpeechText('');
                  }
                }}
                placeholder="वॉइस निर्देश टाइप करें (e.g. 'गोरखपुर मंडी का टोकन बुक करो')..."
                className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15"
              />

              <button
                onClick={() => {
                  if (speechText.trim()) {
                    executeCommand(speechText);
                    setSpeechText('');
                  }
                }}
                className="px-5 py-3 bg-gradient-to-r from-purple-800 to-indigo-800 text-white font-extrabold text-xs rounded-2xl shadow-md cursor-pointer hover:opacity-95 flex items-center gap-1.5"
              >
                <span>Execute</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VoiceAssistantPage;
