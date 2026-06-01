import React, { useState } from 'react';
import { useVoice } from '../context/VoiceContext';
import VoiceWaveVisualizer from '../components/VoiceWaveVisualizer';
import { 
  Mic, 
  Send, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  HelpCircle, 
  Square, 
  Volume2, 
  VolumeX, 
  Compass, 
  ShieldAlert, 
  Zap, 
  Clock, 
  CheckCircle,
  EyeOff
} from 'lucide-react';

export default function VoiceAssistant() {
  const { 
    isListening, 
    isSpeaking, 
    logs, 
    loading, 
    startListening, 
    stopSpeaking, 
    sendTextCommand, 
    clearLogs,
    isHandsFreeMode,
    setIsHandsFreeMode
  } = useVoice();
  
  const [textCommand, setTextCommand] = useState('');

  const suggestions = [
    { text: 'Check battery status', command: 'check battery status' },
    { text: 'How much range left?', command: 'how much range do I have left' },
    { text: 'Open Navigation Map', command: 'open navigation' },
    { text: 'Navigate to Chennai Airport', command: 'navigate to Chennai Airport' },
    { text: 'Navigate to closest station', command: 'navigate to the closest one' },
    { text: 'Filter DC fast chargers', command: 'find DC fast chargers' },
    { text: 'Open Cost Optimizer', command: 'open cost optimizer' },
    { text: 'Open Weather Alerts', command: 'open weather alerts' },
    { text: 'Trigger emergency SOS', command: 'send SOS' }
  ];

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textCommand.trim()) return;
    sendTextCommand(textCommand);
    setTextCommand('');
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">AI Voice Assistant</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Hands-free speech commands & vehicle operations copilot
          </p>
        </div>
        <button
          onClick={clearLogs}
          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
          title="Clear Command Logs"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* EV Copilot Suggestions Panel */}
      <div className="glass-panel bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3">
        <Zap className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
        <div>
          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">EV Copilot Recommendations</h4>
          <ul className="text-xs text-emerald-700 font-semibold space-y-1 mt-1.5 list-disc list-inside">
            <li>Optimal Cruising: Cruise below 80 km/h to prevent high wind drag and save range.</li>
            <li>Protect Battery Health: Keep target charge limits under 80% to extend long-term cell life.</li>
            <li>Regenerative Braking: Utilize strong regen levels to capture decelerating kinetic energy.</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Speech stage & waveform */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Panel A: Speech Mic Visualizer Stage */}
          <div className="glass-panel-neon p-6 rounded-3xl border border-sky-200/50 flex flex-col items-center justify-center text-center space-y-6">
            

            {isHandsFreeMode && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                <span>AI WAKE WORD MONITORING ACTIVE</span>
              </span>
            )}

            <div className="w-full">
              <VoiceWaveVisualizer isListening={isListening || loading} />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-800 leading-none">
                {isListening ? (isHandsFreeMode ? 'Continuous Listening Active' : 'Listening to voice...') : loading ? 'AI Copilot is processing...' : 'Speech Telemetry Ready'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                {isListening ? (isHandsFreeMode ? 'Say "Hey EV Assistant" followed by a command...' : 'Speak naturally. Processing phonetic triggers...') : loading ? 'Analyzing neural EV diagnostics telemetry...' : 'Click the mic or speak the wake word to start.'}
              </p>
            </div>

            {/* Mic & Stop buttons container */}
            <div className="flex gap-4 items-center justify-center">
              <button
                onClick={startListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 ${
                  isListening
                    ? isHandsFreeMode
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30'
                      : 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-rose-500/30'
                    : 'bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 shadow-indigo-500/30'
                }`}
                title={isListening ? "Stop Listening" : "Start Listening"}
              >
                <Mic className={`w-8 h-8 ${isListening && (isHandsFreeMode ? 'animate-pulse' : 'animate-ping')}`} />
              </button>

              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all duration-300"
                  title="Stop Speaking"
                >
                  <Square className="w-6 h-6 fill-white" />
                </button>
              )}
            </div>

            {/* Low-profile Hands-Free Toggle */}
            <div className="flex items-center gap-2.5 pt-4 border-t border-slate-100/50 w-full justify-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isHandsFreeMode} 
                  onChange={(e) => {
                    setIsHandsFreeMode(e.target.checked);
                    if (e.target.checked) {
                      const SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;
                      if ('speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                        const u = new SpeechSynthesisUtterance("Hands free wake mode active.");
                        window.speechSynthesis.speak(u);
                      }
                    }
                  }}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          {/* Panel B: Typing Command console */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-200/50">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <Send className="w-4 h-4 text-indigo-500" />
              <span>Keyboard Command Console</span>
            </h3>
            
            <form onSubmit={handleTextSubmit} className="flex gap-2">
              <input
                type="text"
                value={textCommand}
                onChange={(e) => setTextCommand(e.target.value)}
                placeholder="Type command (e.g. navigate to Chennai Airport)"
                className="flex-1 px-4 py-2.5 bg-white/50 border border-slate-200/80 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-colors shadow-md"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Logs & Suggestion Chips */}
        <div className="space-y-6">
          
          {/* Panel C: Suggested Command Chips */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 text-left space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>Safety Suggestions List</span>
            </h4>
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              {suggestions.map((item) => (
                <button
                  key={item.text}
                  onClick={() => sendTextCommand(item.command)}
                  className="w-full p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/40 rounded-xl text-left text-xs font-semibold text-slate-700 transition-colors flex items-center justify-between group"
                >
                  <span>{item.text}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Panel D: Live Speech Logs Board */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 text-left">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Command Logs Feed</h4>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {logs.map((log, index) => {
                const isAssistant = log.sender === 'assistant';
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed ${
                      isAssistant
                        ? 'bg-slate-100/80 text-slate-700 border border-slate-200/30'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-100/50 ml-6'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[8px] uppercase tracking-wider font-extrabold ${isAssistant ? 'text-slate-400' : 'text-indigo-400'}`}>
                        {isAssistant ? 'AI Copilot' : 'User Driver'}
                      </span>
                      <span className="text-[8px] text-slate-400 font-medium">
                        {log.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p>{log.text}</p>
                  </div>
                );
              })}
              {loading && (
                <div className="p-3 rounded-2xl text-xs font-semibold leading-relaxed bg-slate-100/80 text-slate-700 border border-slate-200/30 flex items-center gap-2">
                  <div className="flex space-x-1 items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">AI Copilot is processing...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
