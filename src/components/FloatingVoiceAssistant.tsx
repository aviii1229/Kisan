import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, X, Sparkles, Subtitles, Settings, VolumeX, Zap, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { speakText, stopSpeaking, playVoiceStartChime, playVoiceSuccessChime } from '../utils/sound';
import { processVoiceIntent, InteractiveBookingData } from '../utils/voiceAssistantEngine';
import { InChatBookingCard } from './InChatBookingCard';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  subtextEn?: string;
  time: string;
  bookingForm?: InteractiveBookingData;
}

export const FloatingVoiceAssistant: React.FC<{ onOpenBookingModal?: () => void }> = ({ onOpenBookingModal }) => {
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

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);

  // Configuration
  const [speakerVoice, setSpeakerVoice] = useState<'priya' | 'arvind' | 'roopa' | 'shubh'>('priya');
  const [speechPace, setSpeechPace] = useState<number>(0.95);

  // Subtitles
  const [hindiSubtitle, setHindiSubtitle] = useState<string>('किसान मदद AI से बात करने के लिए माइक दबाएं...');
  const [englishSubtitle, setEnglishSubtitle] = useState<string>('Press mic button to speak with Kisan Madad AI...');

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [voiceHistory, isOpen]);

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
        setSpeechText('सुन रहा हूँ... बोलिए');
        setHindiSubtitle('किसान मदद: आपकी आवाज़ सुन रहा हूँ... बोलिए।');
        setEnglishSubtitle('Kisan Madad: Listening to your voice... speak now.');
      };

      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        playVoiceSuccessChime();
        setSpeechText(text);
        executeCommand(text);
      };

      rec.onerror = () => {
        startSarvamMediaRecorder();
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [lang, activeToken, announcements, centres]);

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
      setSpeechText('रिकॉर्डिंग चालू... बोलिए');

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
    const userMsg: ChatMessage = {
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
        if (onOpenBookingModal) onOpenBookingModal();
      },
      directBookToken: (tokenData) => bookToken(tokenData)
    });

    const primaryText = lang === 'te' ? result.speechTextTe : lang === 'en' ? result.speechTextEn : result.speechTextHi;
    const secondaryText = lang === 'hi' ? result.speechTextEn : result.speechTextHi;

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: primaryText,
      subtextEn: secondaryText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  const handleQuickChip = (cmdText: string) => {
    setSpeechText(cmdText);
    executeCommand(cmdText);
  };

  return (
    <>
      {/* Floating Trigger Mic Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-800 via-indigo-800 to-purple-950 text-white shadow-xl flex items-center justify-center hover:scale-110 transition cursor-pointer border border-purple-400/40 relative group"
            title="Open Voice Assistant"
          >
            <Mic className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 animate-ping"></span>
          </button>
        )}
      </div>

      {/* Floating Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[90vw] bg-white rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/20 rounded-xl border border-purple-400/30">
                <Sparkles className="w-4 h-4 text-purple-300" />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-tight">Kisan Madad Voice AI</h4>
                <p className="text-[9px] text-purple-200/80 font-bold">Sarvam AI Indic Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isSpeaking && (
                <button
                  onClick={() => { stopSpeaking(); setIsSpeaking(false); }}
                  className="p-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-[10px] font-mono font-bold flex items-center gap-1 border border-red-500/30 cursor-pointer"
                >
                  <VolumeX className="w-3 h-3" /> Stop
                </button>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-purple-300 hover:text-white cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => { stopSpeaking(); setIsOpen(false); }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Voice Settings Panel */}
          {showSettings && (
            <div className="bg-purple-950 p-3 border-b border-purple-800 text-white space-y-2 text-xs">
              <span className="text-[9px] font-mono text-purple-300 font-bold uppercase block">Speaker Voice & Speed:</span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={speakerVoice}
                  onChange={(e) => setSpeakerVoice(e.target.value as any)}
                  className="bg-purple-900 border border-purple-700 rounded-lg px-2 py-1 text-white text-xs font-bold"
                >
                  <option value="priya">👩 Priya (Female)</option>
                  <option value="arvind">👨 Arvind (Male)</option>
                  <option value="roopa">👩 Roopa (Clear)</option>
                  <option value="shubh">👨 Shubh (Young)</option>
                </select>

                <select
                  value={speechPace}
                  onChange={(e) => setSpeechPace(parseFloat(e.target.value))}
                  className="bg-purple-900 border border-purple-700 rounded-lg px-2 py-1 text-white text-xs font-bold"
                >
                  <option value={0.85}>0.85x Slow</option>
                  <option value={0.95}>0.95x Normal</option>
                  <option value={1.1}>1.10x Fast</option>
                </select>
              </div>
            </div>
          )}

          {/* Chat Transcript Area */}
          <div className="p-3.5 space-y-3 max-h-60 overflow-y-auto font-sans text-xs bg-slate-50/50">
            {voiceHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-xs space-y-1 ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-800 to-indigo-900 text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                  }`}
                >
                  <p className="font-bold leading-relaxed">{msg.text}</p>
                  {msg.subtextEn && (
                    <p className="text-[10.5px] italic text-purple-200 font-semibold border-t border-white/10 pt-1">
                      {msg.subtextEn}
                    </p>
                  )}

                  {/* Interactive In-Chat Token Booking Card */}
                  {msg.bookingForm && (
                    <InChatBookingCard initialData={msg.bookingForm} />
                  )}

                  <span className={`text-[8px] font-mono block text-right ${msg.sender === 'user' ? 'text-purple-200' : 'text-slate-400'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Live Equalizer bar when listening or speaking */}
          {(isListening || isSpeaking) && (
            <div className="bg-purple-50 p-2 border-t border-purple-100 flex items-center justify-between px-4">
              <span className="text-[10px] font-black text-purple-900 font-mono flex items-center gap-1.5">
                {isListening ? (
                  <>🎙️ सुन रहा हूँ... बोलिए</>
                ) : (
                  <>🔊 Sarvam AI बोल रहा है...</>
                )}
              </span>
              <div className="flex items-center gap-1">
                <div className="w-1 h-3 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1 h-5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1 h-4 bg-emerald-500 rounded-full animate-bounce"></div>
                <div className="w-1 h-6 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
              </div>
            </div>
          )}

          {/* Quick Action Chips */}
          <div className="p-3 bg-white border-t border-slate-200 space-y-2">
            <span className="text-[9px] font-mono font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> त्वरित वॉइस निर्देश (Quick Prompts):
            </span>
            <div className="flex flex-wrap gap-1 text-[10px] font-bold">
              <button
                onClick={() => handleQuickChip('टोकन बुक करो')}
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-lg transition cursor-pointer"
              >
                🎫 टोकन बुक
              </button>
              <button
                onClick={() => handleQuickChip('मेरा टोकन बताओ')}
                className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 px-2 py-0.5 rounded-lg transition cursor-pointer"
              >
                📋 मेरा टोकन
              </button>
              <button
                onClick={() => handleQuickChip('गेहूं का भाव बताओ')}
                className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-lg transition cursor-pointer"
              >
                🌾 गेहूं का भाव
              </button>
              <button
                onClick={() => handleQuickChip('नवीनतम नोटिस सुनाओ')}
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 px-2 py-0.5 rounded-lg transition cursor-pointer"
              >
                📢 नोटिस
              </button>
            </div>
          </div>

          {/* Bottom Controls Bar */}
          <div className="bg-slate-100 p-3 flex items-center gap-2 border-t border-slate-200">
            <button
              onClick={startListening}
              className={`p-2.5 rounded-2xl text-white font-extrabold flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                isListening
                  ? 'bg-red-500 shadow-md shadow-red-500/30 animate-pulse'
                  : 'bg-purple-800 hover:bg-purple-900 shadow-md shadow-purple-800/20'
              }`}
              title="Speak Now"
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
              placeholder="यहाँ टाइप करें या बोलें..."
              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
            />

            <button
              onClick={() => {
                if (speechText.trim()) {
                  executeCommand(speechText);
                  setSpeechText('');
                }
              }}
              className="px-3 py-2 bg-gradient-to-r from-purple-800 to-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer hover:opacity-95"
            >
              भेजें
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingVoiceAssistant;
