import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, HelpCircle, Sparkles, Key, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { speakText } from '../utils/sound';

export const VoiceAssistant: React.FC = () => {
  const { setSearchQuery, setActiveTab } = useApp();
  const { lang } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [sarvamApiKey, setSarvamApiKey] = useState<string>(() => localStorage.getItem('kisanh_sarvam_api_key') || '');
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;

      // Default to Hindi (hi-IN) for Sarvam AI Voice Assistant
      rec.lang = lang === 'te' ? 'te-IN' : 'hi-IN';

      rec.onstart = () => {
        setIsListening(true);
        setSpeechText('सुन रहा हूँ... (Sarvam AI Saarika Engine)');
      };

      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setSpeechText(text);
        processSarvamHindiCommand(text);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error', e);
        setSpeechText('सुनने में त्रुटि। फिर से प्रयास करें।');
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [lang]);

  const saveSarvamKey = (key: string) => {
    setSarvamApiKey(key);
    if (key.trim()) {
      localStorage.setItem('kisanh_sarvam_api_key', key.trim());
    } else {
      localStorage.removeItem('kisanh_sarvam_api_key');
    }
    setKeySaved(true);
    setTimeout(() => {
      setKeySaved(false);
      setShowKeyModal(false);
    }, 1200);
  };

  const startListening = () => {
    if (recognition) {
      try {
        recognition.start();
      } catch (err) {
        recognition.abort();
      }
    } else {
      alert('वाक् पहचान इस ब्राउज़र में समर्थित नहीं है।');
    }
  };

  const processSarvamHindiCommand = (command: string) => {
    const clean = command.toLowerCase().trim();

    // Natural Sarvam AI Hindi Assistant command mapping
    if (clean.includes('नक्शा') || clean.includes('मानचित्र') || clean.includes('मैप') || clean.includes('कहाँ')) {
      setActiveTab('map');
      speakText('सर्वम ए आई: मंडियों की नक्शा स्थिति खोल दी गई है।', 'hi');
    } else if (clean.includes('मूल्य') || clean.includes('दाम') || clean.includes('रेट') || clean.includes('एमएसपी') || clean.includes('भाव')) {
      setActiveTab('prices');
      speakText('सर्वम ए आई: न्यूनतम समर्थन मूल्य और बाजार भाव खोल दिए गए हैं।', 'hi');
    } else if (clean.includes('लाइन') || clean.includes('कतार') || clean.includes('पास') || clean.includes('टोकन') || clean.includes('नंबर')) {
      setActiveTab('queue');
      speakText('सर्वम ए आई: लाइव कतार और टोकन स्थिति खोल दी गई है।', 'hi');
    } else if (clean.includes('मंडी') || clean.includes('केंद्र') || clean.includes('सूची') || clean.includes('लिस्ट')) {
      setActiveTab('centres');
      speakText('सर्वम ए आई: क्रय केंद्रों की सूची प्रदर्शित की जा रही है।', 'hi');
    } else {
      setSearchQuery(command);
      speakText(`सर्वम ए आई: ${command} के लिए खोजा जा रहा है।`, 'hi');
    }
  };

  return (
    <div className="bg-[#FFFDF8] border border-slate-200/90 rounded-3xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 space-y-3.5 paper-bg-texture glow-hover">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black font-mono text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600" />
              Sarvam AI Engine
            </span>
            <span className="text-[9px] text-slate-400 font-extrabold font-mono">hi-IN</span>
          </div>
          <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2 pt-1">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Volume2 className="w-4 h-4" />
            </div>
            सर्वम AI हिंदी सहायक
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowKeyModal(!showKeyModal)}
            className={`p-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              sarvamApiKey
                ? 'bg-purple-50 border-purple-300 text-purple-800'
                : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
            title="Configure Sarvam AI API Key"
          >
            <Key className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* API Key Modal Config */}
      {showKeyModal && (
        <div className="bg-purple-50/90 border border-purple-200 rounded-2xl p-3.5 text-xs space-y-2.5 font-semibold text-purple-900 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-[11px] flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-purple-600" />
              Sarvam AI API Key (api.sarvam.ai)
            </span>
            {sarvamApiKey && <span className="text-[9px] bg-purple-200 text-purple-900 font-mono px-1.5 py-0.5 rounded">Key Set</span>}
          </div>
          <p className="text-[10px] text-purple-700 leading-relaxed font-medium">
            Paste your Sarvam AI key to enable live cloud models (Saarika STT & Bulbul TTS).
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={sarvamApiKey}
              onChange={(e) => setSarvamApiKey(e.target.value)}
              placeholder="Enter Sarvam Subscription Key"
              className="flex-1 px-3 py-1.5 rounded-xl border border-purple-300 bg-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => saveSarvamKey(sarvamApiKey)}
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-xl transition text-[11px] flex items-center gap-1 cursor-pointer"
            >
              {keySaved ? <Check className="w-3.5 h-3.5" /> : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Spoken Hindi Suggestions */}
      {showHelp && (
        <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-3 text-[10px] text-slate-600 leading-relaxed space-y-1.5 font-bold">
          <p className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px]">बोले जाने वाले हिंदी निर्देश (Sarvam Prompts):</p>
          <div className="flex flex-wrap gap-1">
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-800 font-mono">"मंडी नक्शा"</span>
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-800 font-mono">"एमएसपी मूल्य"</span>
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-800 font-mono">"लाइव कतार लाइन"</span>
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-800 font-mono">"गोरखपुर मंडी"</span>
          </div>
        </div>
      )}

      {/* Mic Trigger */}
      <div className="flex items-center gap-3 bg-slate-100/60 p-3 rounded-2xl border border-slate-200/70">
        <button
          onClick={startListening}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 btn-active-press cursor-pointer flex-shrink-0 ${
            isListening
              ? 'bg-red-500 text-white animate-mic-pulse ring-4 ring-red-300 shadow-lg shadow-red-500/30'
              : 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white shadow-md shadow-purple-700/20 scale-[1.02]'
          }`}
          title="बोलने के लिए दबाएं (Sarvam Voice)"
        >
          {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
        </button>

        <div className="flex-1 min-w-0">
          <span className="text-[9px] text-purple-800 font-extrabold uppercase tracking-widest block font-mono">
            {isListening ? '🎙️ Sarvam AI (हिंदी सुन रहा है...)' : 'Sarvam AI Voice Assistant'}
          </span>
          <p className="text-xs font-black text-slate-900 truncate mt-0.5">
            {speechText || 'बोलने के लिए माइक बटन दबाएं...'}
          </p>
        </div>
      </div>
    </div>
  );
};
export default VoiceAssistant;
