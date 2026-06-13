import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from './VehicleContext';
import { useTelemetry } from './TelemetryContext';
import api from '../services/api';

const VoiceContext = createContext(null);

export const VoiceProvider = ({ children }) => {
  const navigate = useNavigate();
  const { activeVehicle, overrideActiveVehicleRange, updateBatteryTelemetry } = useVehicles();
  const { socket } = useTelemetry();

  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [awaitingBatteryInput, setAwaitingBatteryInput] = useState(false);
  const [logs, setLogs] = useState([
    { sender: 'assistant', text: 'Hello! I am your AI EV Copilot. How can I help you today?', time: new Date() }
  ]);
  const [recognition, setRecognition] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Advanced Voice States
  const [isHandsFreeMode, setIsHandsFreeMode] = useState(false);
  const [lastFoundStations, setLastFoundStations] = useState([]);
  const [pendingVoiceAction, setPendingVoiceAction] = useState(null);

  const isHandsFreeModeRef = useRef(isHandsFreeMode);
  const lastFoundStationsRef = useRef(lastFoundStations);

  useEffect(() => {
    isHandsFreeModeRef.current = isHandsFreeMode;
  }, [isHandsFreeMode]);

  useEffect(() => {
    lastFoundStationsRef.current = lastFoundStations;
  }, [lastFoundStations]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = isHandsFreeMode;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const resultIndex = event.resultIndex;
        const text = event.results[resultIndex][0].transcript;
        console.log('🎙️ [Speech Recognition Result]:', text);

        if (isHandsFreeModeRef.current) {
          const lowerText = text.toLowerCase().trim();
          const wakeWords = ['hey ev assistant', 'hello assistant', 'smart ev assistant'];
          let matchedWake = wakeWords.find(w => lowerText.includes(w));
          
          if (matchedWake) {
            const wakeIdx = lowerText.indexOf(matchedWake);
            const cmdPart = text.slice(wakeIdx + matchedWake.length).trim();
            
            if (cmdPart) {
              sendTextCommand(cmdPart);
            } else {
              speak("Yes? How can I help you, driver?");
              setLogs(prev => [...prev, { sender: 'assistant', text: "Yes? How can I help you, driver?", time: new Date() }]);
            }
          }
        } else {
          sendTextCommand(text);
        }
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        if (e.error === 'not-allowed') {
          setIsListening(false);
          setIsHandsFreeMode(false);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        // Auto restart for continuous hands-free monitoring
        if (isHandsFreeModeRef.current) {
          setTimeout(() => {
            try {
              rec.start();
            } catch (err) {
              console.warn('Could not restart voice recognition context:', err.message);
            }
          }, 300);
        }
      };

      setRecognition(rec);

      if (isHandsFreeMode) {
        try {
          rec.start();
        } catch (e) {
          console.warn('Automatic continuous start error:', e);
        }
      }

      return () => {
        rec.abort();
      };
    }
  }, [activeVehicle, isHandsFreeMode]);

  // Fetch past conversation logs on mount
  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('ev_token');
      if (!token || token.startsWith('mock_jwt_token')) return;
      try {
        const res = await api.get('/voice/history');
        if (res.data.success && res.data.history && res.data.history.length > 0) {
          const mappedLogs = res.data.history.map(log => ({
            ...log,
            time: new Date(log.createdAt)
          }));
          setLogs(mappedLogs);
        }
      } catch (err) {
        console.error('❌ [VoiceContext] Failed to fetch voice history:', err.message);
      }
    };

    fetchHistory();
  }, [socket]);

  // Handle Socket.IO responses
  useEffect(() => {
    if (!socket) return;

    const handleTyping = (data) => {
      setLoading(data.isProcessing);
    };

    const handleResponse = (data) => {
      const reply = data.text;
      const { intent, action, targetPage, params } = data;

      setLogs(prev => [...prev, { sender: 'assistant', text: reply, time: new Date() }]);
      setLoading(false);
      speak(reply);

      // Handle custom broker actions
      handleBrokerAction(intent, action, targetPage, params, reply);
    };

    socket.on('assistant:typing', handleTyping);
    socket.on('assistant:response', handleResponse);

    return () => {
      socket.off('assistant:typing', handleTyping);
      socket.off('assistant:response', handleResponse);
    };
  }, [socket]);

  const handleBrokerAction = (intent, action, targetPage, params, reply) => {
    if (action === 'find_nearby_stations' && params && params.stations) {
      setLastFoundStations(params.stations);
    }

    if (action === 'navigate_closest_station') {
      if (lastFoundStationsRef.current && lastFoundStationsRef.current.length > 0) {
        const closest = lastFoundStationsRef.current[0];
        speak(`Navigating to the closest station, which is ${closest.name}.`);
        
        setPendingVoiceAction({ action: 'plan_route', destination: closest.name });
        sessionStorage.setItem('pending_voice_action', JSON.stringify({ action: 'plan_route', destination: closest.name }));
        navigate('/navigation');

        setTimeout(() => {
          const event = new CustomEvent('voice-action', {
            detail: { action: 'plan_route', params: { destination: closest.name }, targetPage: '/navigation' }
          });
          window.dispatchEvent(event);
        }, 100);
      } else {
        speak("No charging stations were loaded in context. Please ask to locate nearby charging stations first.");
      }
      return;
    }

    if (targetPage) {
      if (action === 'plan_route' && params && params.destination) {
        setPendingVoiceAction({ action: 'plan_route', destination: params.destination });
        sessionStorage.setItem('pending_voice_action', JSON.stringify({ action: 'plan_route', destination: params.destination }));
      } else if (action === 'trigger_sos') {
        setPendingVoiceAction({ action: 'trigger_sos' });
        sessionStorage.setItem('pending_voice_action', JSON.stringify({ action: 'trigger_sos' }));
      }
      navigate(targetPage);
    }

    if (intent === 'route_navigation' || intent === 'emergency_sos' || intent === 'station_query') {
      setTimeout(() => {
        const event = new CustomEvent('voice-action', {
          detail: { action, params, targetPage }
        });
        window.dispatchEvent(event);
      }, 150);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const speak = (text) => {
    if (!text) {
      stopSpeaking();
      return;
    }
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        if (enVoice) {
          utterance.voice = enVoice;
        }
        
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        
        utterance.onstart = () => {
          setIsSpeaking(true);
        };
        utterance.onend = () => {
          setIsSpeaking(false);
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
        };
        
        window.speechSynthesis.speak(utterance);
      }, 150);
    } catch (e) {
      console.warn('Speech synthesis execution failed:', e);
      setIsSpeaking(false);
    }
  };

  // Local client telemetry calculations
  const checkClientActions = (text) => {
    const cmd = text.toLowerCase().trim();

    if (awaitingBatteryInput) {
      const numMatch = cmd.match(/(\d+)/);
      if (numMatch) {
        const newPercent = parseInt(numMatch[1], 10);
        if (newPercent >= 0 && newPercent <= 100) {
          updateBatteryTelemetry(newPercent);
          setAwaitingBatteryInput(false);
        }
      } else {
        setAwaitingBatteryInput(false);
      }
    }

    const setBatteryMatch = cmd.match(/(?:set|update|change|is)\s+(?:my\s+)?(?:current\s+)?(?:battery|charge|percentage|soc)(?:\s+(?:battery|charge|percentage|soc))*\s+(?:to|as)\s+(\d+)/i) ||
                            ((cmd.includes('battery') || cmd.includes('charge') || cmd.includes('soc')) && cmd.match(/(\d+)\s*(?:percent|%)/i));
    if (setBatteryMatch) {
      const newPercent = parseInt(setBatteryMatch[1], 10);
      if (newPercent >= 0 && newPercent <= 100) {
        updateBatteryTelemetry(newPercent);
      }
    }

    if (cmd.includes('set battery') || cmd.includes('update battery') || cmd.includes('change battery') || cmd.includes('set charge') || cmd.includes('update charge')) {
      setAwaitingBatteryInput(true);
    }

    // Speed telemetry override
    const distanceMatch = cmd.match(/(\d+)\s*(?:km|kilometer|k\.m\.)/i);
    const speedMatch = cmd.match(/(\d+)\s*(?:km\/h|kmh|kmph|speed|km\/hr|kmhr|k\.m\.h)/i) || cmd.match(/(?:speed of|at)\s*(\d+)/i);

    if (distanceMatch || (speedMatch && (cmd.includes('range') || cmd.includes('go') || cmd.includes('travel') || cmd.includes('reach')))) {
      const charge = activeVehicle ? activeVehicle.currentCharge_percent : 45;
      const capacity = activeVehicle ? activeVehicle.batteryCapacity_kWh : 40.5;
      const speedVal = speedMatch ? parseInt(speedMatch[1], 10) : 80;

      let speedMultiplier = 1.0;
      if (speedVal > 80) {
        speedMultiplier = Math.max(0.5, 1.0 - (speedVal - 80) * 0.015);
      } else if (speedVal < 40) {
        speedMultiplier = 0.92;
      }

      const standardRange = Math.round(capacity * 6.5 * (charge / 100));
      const calculatedRange = Math.round(standardRange * speedMultiplier);

      if (overrideActiveVehicleRange) {
        overrideActiveVehicleRange(calculatedRange);
      }
    }
  };

  const startListening = () => {
    stopSpeaking();
    if (recognition) {
      try {
        recognition.start();
      } catch (err) {
        recognition.stop();
      }
    } else {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        const prompts = [
          "Check battery status",
          "Find nearest station",
          "Trigger emergency SOS",
          "Book a slot"
        ];
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
        sendTextCommand(randomPrompt);
      }, 3000);
    }
  };

  const sendTextCommand = async (text) => {
    stopSpeaking();
    const userText = text.trim();
    if (!userText) return;

    setLogs(prev => [...prev, { sender: 'user', text: userText, time: new Date() }]);
    
    checkClientActions(userText);

    if (socket && socket.connected) {
      setLoading(true);
      socket.emit('voice:command', { command: userText });
    } else {
      setLoading(true);
      try {
        const res = await api.post('/voice/command', { command: userText });
        if (res.data.success) {
          const reply = res.data.reply;
          const { intent, action, targetPage, params } = res.data;

          setLogs(prev => [...prev, { sender: 'assistant', text: reply, time: new Date() }]);
          speak(reply);

          handleBrokerAction(intent, action, targetPage, params, reply);
        }
      } catch (err) {
        console.error('❌ [VoiceContext] POST command failed:', err.message);
        const errorReply = 'Sorry, I encountered a system diagnostic error while processing your request.';
        setLogs(prev => [...prev, { sender: 'assistant', text: errorReply, time: new Date() }]);
        speak(errorReply);
      } finally {
        setLoading(false);
      }
    }
  };

  const clearLogs = () => {
    setLogs([{ sender: 'assistant', text: 'Logs cleared. How can I help you?', time: new Date() }]);
  };

  return (
    <VoiceContext.Provider value={{
      isListening,
      isSpeaking,
      logs,
      loading,
      startListening,
      stopSpeaking,
      sendTextCommand,
      clearLogs,
      speak,
      isHandsFreeMode,
      setIsHandsFreeMode,
      lastFoundStations,
      setLastFoundStations,
      pendingVoiceAction,
      setPendingVoiceAction
    }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => useContext(VoiceContext);
export default VoiceContext;
