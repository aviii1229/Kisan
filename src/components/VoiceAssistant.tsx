import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { speakText } from '../utils/sound';

export const VoiceAssistant: React.FC = () => {
  const { setSearchQuery, setActiveTab, centres, mspCatalog } = useApp();
  const { lang, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;

      if (lang === 'te') {
        rec.lang = 'te-IN';
      } else if (lang === 'hi') {
        rec.lang = 'hi-IN';
      } else {
        rec.lang = 'en-IN';
      }

      rec.onstart = () => {
        setIsListening(true);
        setSpeechText('Listening...');
      };

      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setSpeechText(text);
        processVoiceCommand(text);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error', e);
        setSpeechText('Error listening. Try again.');
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [lang]);

  const startListening = () => {
    if (recognition) {
      try {
        recognition.start();
      } catch (err) {
        recognition.abort();
      }
    } else {
      alert('Speech recognition is not supported in this browser.');
    }
  };

  const processVoiceCommand = (command: string) => {
    const clean = command.toLowerCase().trim();

    // Map commands based on active language
    if (lang === 'te') {
      if (clean.includes('మ్యాప్') || clean.includes('మ్యాపు')) {
        setActiveTab('map');
        speakText('సేకరణ కేంద్రాల మ్యాప్ వీక్షణ తెరవబడింది', 'te');
      } else if (clean.includes('ధరలు') || clean.includes('కార్డు')) {
        setActiveTab('prices');
        speakText('కనీస మద్దతు ధరల పట్టిక తెరవబడింది', 'te');
      } else if (clean.includes('క్యూ') || clean.includes('టోకెన్')) {
        setActiveTab('queue');
        speakText('లైవ్ క్యూ మరియు డెలివరీ పాస్ వీక్షణ తెరవబడింది', 'te');
      } else if (clean.includes('కేంద్రాలు') || clean.includes('మండీ')) {
        setActiveTab('centres');
        speakText('సేకరణ కేంద్రాల జాబితా తెరవబడింది', 'te');
      } else {
        // Assume search query
        setSearchQuery(command);
        speakText(`${command} కోసం వెతుకుతోంది`, 'te');
      }
    } else if (lang === 'hi') {
      if (clean.includes('नक्शा') || clean.includes('मानचित्र')) {
        setActiveTab('map');
        speakText('नक्शा दृश्य खोल दिया गया है।', 'hi');
      } else if (clean.includes('मूल्य') || clean.includes('दाम') || clean.includes('रेट')) {
        setActiveTab('prices');
        speakText('न्यूनतम समर्थन मूल्य सूची खोल दी गई है।', 'hi');
      } else if (clean.includes('लाइन') || clean.includes('टोकन') || clean.includes('पास')) {
        setActiveTab('queue');
        speakText('लाइव कतार और पास स्थिति खोल दी गई है।', 'hi');
      } else if (clean.includes('मंडी') || clean.includes('केंद्र')) {
        setActiveTab('centres');
        speakText('क्रय केंद्रों की सूची खोल दी गई है।', 'hi');
      } else {
        setSearchQuery(command);
        speakText(`${command} के लिए खोजा जा रहा है।`, 'hi');
      }
    } else {
      // English
      if (clean.includes('map') || clean.includes('location')) {
        setActiveTab('map');
        speakText('Opening procurement centres map view', 'en');
      } else if (clean.includes('price') || clean.includes('msp') || clean.includes('rate')) {
        setActiveTab('prices');
        speakText('Opening MSP price catalog board', 'en');
      } else if (clean.includes('queue') || clean.includes('pass') || clean.includes('token')) {
        setActiveTab('queue');
        speakText('Opening live queue progress tracker', 'en');
      } else if (clean.includes('center') || clean.includes('list') || clean.includes('mandi')) {
        setActiveTab('centres');
        speakText('Opening procurement centres list', 'en');
      } else {
        setSearchQuery(command);
        speakText(`Searching for ${command}`, 'en');
      }
    }
  };

  return (
    <div className="bg-[#FFFDF8] border border-slate-200/90 rounded-3xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 space-y-3.5 paper-bg-texture glow-hover">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-agri-100 flex items-center justify-center text-agri-700">
            <Volume2 className="w-4 h-4" />
          </div>
          Voice Assistant
        </h3>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {showHelp && (
        <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-3 text-[10px] text-slate-600 leading-relaxed space-y-1.5 font-bold">
          <p className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px]">Try Spoken Commands:</p>
          <div className="flex flex-wrap gap-1">
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700 font-mono">"Show Map"</span>
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700 font-mono">"మ్యాప్"</span>
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700 font-mono">"MSP Prices"</span>
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700 font-mono">"मूल्य सूची"</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 bg-slate-100/50 p-2.5 rounded-2xl border border-slate-200/60">
        <button
          onClick={startListening}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 btn-active-press cursor-pointer flex-shrink-0 ${
            isListening
              ? 'bg-red-500 text-white animate-mic-pulse ring-4 ring-red-300 shadow-lg shadow-red-500/30'
              : 'bg-gradient-to-r from-agri-700 to-agri-600 hover:from-agri-600 hover:to-teal-600 text-white shadow-md shadow-agri-700/20 scale-[1.02]'
          }`}
          title="Tap to speak"
        >
          {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
        </button>

        <div className="flex-1 min-w-0">
          <span className="text-[9px] text-agri-700 font-extrabold uppercase tracking-widest block font-mono">
            {isListening ? '🎙️ Listening to Voice...' : 'Voice Search / Assist'}
          </span>
          <p className="text-xs font-black text-slate-800 truncate mt-0.5">
            {speechText || 'Tap microphone to speak...'}
          </p>
        </div>
      </div>
    </div>
  );
};
export default VoiceAssistant;
