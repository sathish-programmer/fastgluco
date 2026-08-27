import React, { useState, useEffect, useRef } from 'react';
import {
  X, Mic, Send, Bot, CheckCircle2,
  Upload, RefreshCw, ArrowRight, Pencil, Check,
  Volume2, VolumeX, Sparkles, Flame, Trophy, Bell, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { scheduleDailyCheckinReminder, triggerTestNotification } from '../utils/notificationScheduler';

interface WorkflowStep {
  stepId: string;
  title: string;
  questionPrompt: string;
  inputType: 'YES_NO' | 'OPTIONS' | 'NUMBER' | 'TEXT' | 'FILE';
  options?: string[];
  order: number;
  isEnabled: boolean;
}

interface Workflow {
  _id?: string;
  name: string;
  targetMode: string;
  steps: WorkflowStep[];
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  title?: string;
  isLoggedBadge?: boolean;
  loggedValue?: string;
  timestamp: string;
  inputType?: 'YES_NO' | 'OPTIONS' | 'NUMBER' | 'TEXT' | 'FILE';
  options?: string[];
  stepId?: string;
  isMultiHabitSummary?: boolean;
  multiHabitsList?: { name: string; value: string }[];
}

interface DailyLoggingChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiUrl: string;
  token: string | null;
  userMode?: 'PREVENTION' | 'TREATMENT' | 'SECONDARY_PREVENTION';
  onRefreshDashboard?: () => void;
}

export const DailyLoggingChatbotModal: React.FC<DailyLoggingChatbotModalProps> = ({
  isOpen,
  onClose,
  apiUrl,
  token,
  userMode = 'PREVENTION',
  onRefreshDashboard
}) => {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [loggedHabits, setLoggedHabits] = useState<any[]>([]);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(() => localStorage.getItem('mito_ai_voice_muted') === 'true');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Edit state
  const [editInputText, setEditInputText] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const capturedTextRef = useRef<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const activeStepIndexRef = useRef(activeStepIndex);
  const workflowRef = useRef(workflow);
  const messagesRef = useRef(messages);
  const isVoiceMutedRef = useRef(isVoiceMuted);

  useEffect(() => { activeStepIndexRef.current = activeStepIndex; }, [activeStepIndex]);
  useEffect(() => { workflowRef.current = workflow; }, [workflow]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { isVoiceMutedRef.current = isVoiceMuted; }, [isVoiceMuted]);

  const [showReminderSettings, setShowReminderSettings] = useState<boolean>(false);
  const [reminderTime, setReminderTime] = useState<string>(() => localStorage.getItem('mito_checkin_reminder_time') || '20:30');
  const [customTimeInput, setCustomTimeInput] = useState<string>(() => localStorage.getItem('mito_checkin_reminder_time') || '20:30');
  const [reminderSaved, setReminderSaved] = useState<boolean>(false);

  const handleSaveReminder = async (time: string) => {
    setReminderTime(time);
    setCustomTimeInput(time);
    setReminderSaved(true);
    await scheduleDailyCheckinReminder(time);
    setTimeout(() => {
      setReminderSaved(false);
      setShowReminderSettings(false);
    }, 1200);
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return '8:30 PM';
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${h12}:${mStr} ${period}`;
  };

  useEffect(() => {
    if (editingMessageId) {
      setTimeout(() => editInputRef.current?.focus(), 100);
    }
  }, [editingMessageId]);

  // Text-To-Speech (Native Android/iOS + Web Speech Synthesis fallback)
  const speakQuestion = async (text: string, onDone?: () => void) => {
    // Immediately stop mic so it doesn't record speaker audio
    stopListening();

    if (isVoiceMutedRef.current) {
      if (onDone) {
        setTimeout(onDone, 300);
      }
      return;
    }

    const clean = text.replace(/[*_#•]/g, '').trim();
    if (!clean) {
      if (onDone) onDone();
      return;
    }

    // ── NATIVE CAPACITOR (Android & iOS) ──
    if (Capacitor.isNativePlatform()) {
      try {
        setIsSpeaking(true);
        try { await TextToSpeech.stop(); } catch {}
        await TextToSpeech.speak({
          text: clean,
          lang: 'en-US',
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient'
        });
      } catch (err) {
        console.warn('Native TTS error:', err);
      } finally {
        setIsSpeaking(false);
        if (onDone) {
          setTimeout(onDone, 400);
        }
      }
      return;
    }

    // ── WEB BROWSER FALLBACK ──
    if (!window.speechSynthesis) {
      if (onDone) onDone();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Pick best English voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoice = voices.find(v => 
          v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Siri') || v.name.includes('Alex'))
        ) || voices.find(v => v.lang.startsWith('en'));
        if (preferredVoice) utterance.voice = preferredVoice;
      }

      let doneFired = false;
      const handleFinish = () => {
        if (doneFired) return;
        doneFired = true;
        setIsSpeaking(false);
        if (onDone) {
          setTimeout(onDone, 400);
        }
      };

      utterance.onend = handleFinish;
      utterance.onerror = handleFinish;

      utterance.onstart = () => {
        setIsSpeaking(true);
        window.speechSynthesis.resume();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
      setIsSpeaking(false);
      if (onDone) onDone();
    }
  };

  const toggleVoiceMute = async () => {
    const next = !isVoiceMuted;
    setIsVoiceMuted(next);
    isVoiceMutedRef.current = next; // Immediately update ref for instant response
    localStorage.setItem('mito_ai_voice_muted', String(next));

    if (next) {
      setIsSpeaking(false);
      if (Capacitor.isNativePlatform()) {
        try { await TextToSpeech.stop(); } catch {}
      } else if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } else {
      if (Capacitor.isNativePlatform()) {
        try { await TextToSpeech.stop(); } catch {}
      } else if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      }
      // When unmuting, immediately speak current active step question or last message
      const currentStep = workflowRef.current?.steps[activeStepIndexRef.current];
      const lastBotMsg = [...(messagesRef.current || [])].reverse().find(m => m.sender === 'bot');
      const textToSpeak = currentStep?.questionPrompt || lastBotMsg?.text || 'All daily check-ins completed. Your data is synced.';
      speakQuestion(textToSpeak);
    }
  };

  const requestMicPermission = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      }
    } catch (e) {
      console.warn('Microphone permission request error:', e);
    }
  };

  const validateAndMapAnswer = (
    inputText: string,
    currentStep?: WorkflowStep
  ): { valid: boolean; mappedValue: string; clarificationMsg?: string } => {
    if (!inputText || !inputText.trim()) {
      return { valid: false, mappedValue: '', clarificationMsg: 'Please provide an answer.' };
    }

    const clean = inputText.trim().toLowerCase();
    if (!currentStep) {
      return { valid: true, mappedValue: inputText.trim() };
    }

    const { inputType, options = [], stepId = '' } = currentStep;
    const s = stepId.toLowerCase();

    // ── 1. NUMBER / SLEEP TYPE ──
    if (inputType === 'NUMBER' || s === 'sleep' || s === 'glucose_check') {
      const match = clean.match(/(\d+(\.\d+)?)/);
      if (match) {
        const numVal = parseFloat(match[1]);
        if (s === 'sleep') {
          if (numVal >= 0 && numVal <= 24) {
            return { valid: true, mappedValue: `${numVal}` };
          } else {
            return { valid: false, mappedValue: '', clarificationMsg: 'Please enter a valid sleep duration between 0 and 24 hours.' };
          }
        }
        return { valid: true, mappedValue: `${numVal}` };
      }
      return { valid: false, mappedValue: '', clarificationMsg: 'Please enter or say a number (e.g., 7 or 8 hours).' };
    }

    // ── 2. OPTIONS / YES_NO TYPES ──
    if (inputType === 'OPTIONS' || inputType === 'YES_NO') {
      if (options.length === 0) {
        return { valid: true, mappedValue: inputText.trim() };
      }

      // Exact match with an option
      const exact = options.find(o => o.toLowerCase() === clean);
      if (exact) return { valid: true, mappedValue: exact };

      // Substring match
      const sub = options.find(o => {
        const oLower = o.toLowerCase();
        const stripped = oLower.replace(/[()]/g, ' ');
        return stripped.includes(clean) || clean.includes(oLower);
      });
      if (sub) return { valid: true, mappedValue: sub };

      // Step-specific smart semantic matching
      // STRESS
      if (s === 'stress' || s === 'caregiver_stress') {
        if (['calm', 'no stress', 'zero', 'peaceful', 'none', 'good', 'fine', 'relaxed', 'normal', 'low stress'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.toLowerCase().includes('calm') || o.toLowerCase().includes('no stress')) || options[0] };
        }
        if (['mild', 'little', 'slightly', 'small'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.toLowerCase().includes('mild')) || options[1] };
        }
        if (['moderate', 'medium', 'average', 'some', 'okay'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.toLowerCase().includes('moderate')) || options[2] || options[1] };
        }
        if (['high', 'severe', 'lot of stress', 'heavy', 'extreme', 'overwhelmed', 'drained', 'very stressed'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.toLowerCase().includes('high')) || options[options.length - 1] };
        }
      }

      // FASTING
      if (s === 'fasting') {
        if (['16', '17', '18', '19', '20', '24', 'omad', 'long fast'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.includes('16+')) || options[0] };
        }
        if (['12', '13', '14', '15'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.includes('12-16')) || options[1] };
        }
        if (['partial', 'less than 12', 'under 12', '8 hours', '10 hours'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.includes('<12') || o.toLowerCase().includes('partial')) || options[2] };
        }
        if (['no', 'skip', 'didn\'t fast', 'ate normal', 'none'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.toLowerCase().includes('skip') || o.toLowerCase().includes('no')) || options[options.length - 1] };
        }
      }

      // MOVEMENT
      if (s === 'movement') {
        if (['30', '40', '45', '60', 'brisk', 'long walk', 'workout', 'gym', 'run'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.includes('30+')) || options[0] };
        }
        if (['yoga', 'stretch', 'stretching', 'pilates', 'mobility'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.toLowerCase().includes('yoga')) || options[1] };
        }
        if (['light', 'short walk', '10 min', '15 min', '<20', 'less than 20'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.includes('<20') || o.toLowerCase().includes('light')) || options[2] };
        }
        if (['bed rest', 'rest only', 'no movement', 'none', 'tired', 'rest'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.toLowerCase().includes('bed') || o.toLowerCase().includes('rest')) || options[options.length - 1] };
        }
      }

      // ALCOHOL
      if (s === 'alcohol') {
        if (['no', 'none', 'clean', 'zero', 'didn\'t drink', 'not today', 'sober'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.toLowerCase().includes('no alcohol') || o.toLowerCase().includes('clean')) || options[0] };
        }
        if (['1', '2', 'one', 'two', 'couple', 'beer', 'glass'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.includes('1-2')) || options[1] };
        }
        if (['3', '4', '5', 'heavy', 'lot', 'many', 'party'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.includes('3+')) || options[options.length - 1] };
        }
      }

      // GUT HEALTH
      if (s === 'gut_health') {
        if (['no', 'healthy', 'fine', 'good', 'neither', 'no issue', 'clean', 'calm'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.toLowerCase().includes('no issues') || o.toLowerCase().includes('healthy')) || options[0] };
        }
        if (['both', 'all'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.toLowerCase().includes('both')) || options[options.length - 1] };
        }
        if (['gastritis', 'acidity', 'gas', 'acid', 'stomach', 'heartburn', 'bloating'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.toLowerCase().includes('gastritis') || o.toLowerCase().includes('acidity')) || options[1] };
        }
        if (['dental', 'tooth', 'teeth', 'gum', 'mouth', 'oral'].some(w => clean.includes(w))) {
          return { valid: true, mappedValue: options.find(o => o.toLowerCase().includes('dental')) || options[2] };
        }
      }

      // GENERAL POSITIVE INTENTS
      if (['yes', 'yeah', 'yep', 'done', 'completed', 'good', 'true', 'taken', 'did', 'practiced', 'safe', 'clean', 'positive'].some(w => clean.includes(w))) {
        const posOpt = options.find(o => 
          o.toLowerCase().startsWith('yes') || 
          o.toLowerCase().includes('consumed') || 
          o.toLowerCase().includes('practiced') || 
          o.toLowerCase().includes('safe') || 
          o.toLowerCase().includes('clean') ||
          (o.toLowerCase().startsWith('no') && (s.startsWith('env_') || s === 'smoking' || s === 'genetics' || s === 'substances'))
        );
        if (posOpt) return { valid: true, mappedValue: posOpt };
        return { valid: true, mappedValue: options[0] };
      }

      // GENERAL NEGATIVE INTENTS
      if (['no', 'nope', 'nah', 'not today', 'none', 'skipped', 'missed', 'never', 'zero', 'negative', 'avoided'].some(w => clean.includes(w))) {
        const negOpt = options.find(o => 
          o.toLowerCase().includes('not today') || 
          o.toLowerCase().includes('skipped') || 
          o.toLowerCase().includes('no family') ||
          o.toLowerCase().includes('no alcohol') ||
          o.toLowerCase().startsWith('no') ||
          (o.toLowerCase().startsWith('yes') && (s.startsWith('env_') || s === 'smoking' || s === 'substances'))
        );
        if (negOpt) return { valid: true, mappedValue: negOpt };
        return { valid: true, mappedValue: options[options.length - 1] };
      }

      // If unrecognized/irrelevant speech:
      return {
        valid: false,
        mappedValue: '',
        clarificationMsg: `I didn't recognize that option. Please tap one of the buttons or say: ${options.slice(0, 3).join(', ')}.`
      };
    }

    return { valid: true, mappedValue: inputText.trim() };
  };

  const startListening = async () => {
    // If device speaker is actively talking, do NOT open mic yet!
    if (window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Try Chrome or Safari.');
      return;
    }

    await requestMicPermission();

    if (recognitionRef.current) {
      try {
        const old = recognitionRef.current;
        old.onstart = null; old.onresult = null; old.onerror = null; old.onend = null;
        old.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    capturedTextRef.current = '';
    setInputText('');
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event: any) => {
        let interim = '', final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t; else interim += t;
        }
        const combined = (final || interim).trim();
        if (combined) {
          capturedTextRef.current = combined;
          setInputText(combined);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        const txt = capturedTextRef.current.trim();
        capturedTextRef.current = '';
        if (txt) {
          setInputText('');
          advanceToNextStep(txt, true);
        }
      };

      recognitionRef.current = recognition;
      try { recognition.start(); } catch {
        setTimeout(() => { try { recognition.start(); } catch { setIsListening(false); } }, 150);
      }
    } catch { setIsListening(false); }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        const old = recognitionRef.current;
        old.onstart = null; old.onresult = null; old.onerror = null; old.onend = null;
        old.stop();
        old.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const fetchWorkflow = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Map user journey mode to backend workflow mode
      let mode = 'STANDARD'; // PREVENTION
      if (userMode === 'TREATMENT') mode = 'CANCER_PATIENT';
      else if (userMode === 'SECONDARY_PREVENTION') mode = 'SECONDARY_PREVENTION';
      const [wfRes, habitsRes, reportsRes] = await Promise.all([
        fetch(`${apiUrl}/daily-logging-workflows/active?mode=${mode}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/habits?type=all&days=2`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/reports`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null)
      ]);

      let activeSteps: WorkflowStep[] = [];
      let wfData: Workflow | null = null;
      if (wfRes.ok) {
        wfData = await wfRes.json();
        activeSteps = (wfData?.steps || []).filter(s => s.isEnabled).sort((a, b) => a.order - b.order);
      }
      let todayHabits: any[] = [];
      if (habitsRes.ok) todayHabits = await habitsRes.json();
      let todayReports: any[] = [];
      if (reportsRes && reportsRes.ok) todayReports = await reportsRes.json();
      setWorkflow(wfData ? { ...wfData, steps: activeSteps } : null);
      setLoggedHabits(todayHabits);

      if (activeSteps.length > 0) {
        const todayStr = new Date().toDateString();
        // Filter all habits logged today (both manual and chatbot)
        const todaysHabits = todayHabits.filter(h =>
          new Date(h.timestamp || h.createdAt).toDateString() === todayStr
        );
        const isLogged = (stepId: string): boolean => {
          const s = stepId.toLowerCase();

          // Direct match by stepId in saved logs
          if (todaysHabits.some(h => h.value?.stepId === stepId || h.value?.stepId === s)) {
            return true;
          }

          // ── Cancer Treatment steps (match exact types saved by manual screens) ──
          // Fasting screen → saves type: 'Fasting'
          if (s === 'fasting') return todaysHabits.some(h =>
            h.type === 'Fasting' || h.type?.toUpperCase() === 'FASTING'
          );
          // Movement screen → saves type: 'Movement'
          if (s === 'movement') return todaysHabits.some(h =>
            h.type === 'Movement' || h.type?.toUpperCase() === 'MOVEMENT'
          );
          // Stillness screen → saves type: 'Stillness'
          if (s === 'stillness') return todaysHabits.some(h =>
            h.type === 'Stillness' || h.type?.toUpperCase() === 'STILLNESS'
          );
          // Joy screen → saves type: 'Joy'
          if (s === 'joy') return todaysHabits.some(h =>
            h.type === 'Joy' || h.type?.toUpperCase() === 'JOY'
          );
          // Stress / StressLog screen → saves type: 'Stress'
          if (s === 'stress' || s === 'caregiver_stress') return todaysHabits.some(h =>
            h.type === 'Stress' || h.type?.toUpperCase() === 'STRESS'
          );

          // ── Cancer Prevention / Secondary Prevention steps ──
          // Sleep screen → saves type: 'Sleep'
          if (s === 'sleep') return todaysHabits.some(h =>
            h.type === 'Sleep' || h.type?.toUpperCase() === 'SLEEP'
          );
          // Smoking screen → saves type: 'Smoking'
          if (s === 'smoking') return todaysHabits.some(h =>
            h.type === 'Smoking' || h.type?.toUpperCase().includes('SMOKING')
          );
          // Alcohol check
          if (s === 'alcohol') return todaysHabits.some(h =>
            h.type === 'Alcohol' || h.type?.toUpperCase().includes('ALCOHOL')
          );
          // Antioxidants check
          if (s === 'antioxidants') return todaysHabits.some(h =>
            h.type === 'Antioxidants' || h.type?.toUpperCase().includes('ANTIOXIDANT')
          );
          // Environmental 4-question checks
          if (s.startsWith('env_') || s === 'environmental') {
            const envHabits = todaysHabits.filter(h => h.type === 'Environmental' || h.type?.toUpperCase() === 'ENVIRONMENTAL' || h.value?.stepId?.startsWith('env_'));
            if (envHabits.length === 0) return false;

            if (s === 'env_air') {
              return envHabits.some(h => h.value?.stepId === 'env_air' || h.value?.answers?.airQ1 !== undefined || (h.value?.option && (h.value.option.toLowerCase().includes('air') || h.value.option.toLowerCase().includes('smog') || h.value.option.toLowerCase().includes('clean'))));
            }
            if (s === 'env_water') {
              return envHabits.some(h => h.value?.stepId === 'env_water' || h.value?.answers?.waterQ1 !== undefined || (h.value?.option && (h.value.option.toLowerCase().includes('water') || h.value.option.toLowerCase().includes('tap') || h.value.option.toLowerCase().includes('filter'))));
            }
            if (s === 'env_pesticides') {
              return envHabits.some(h => h.value?.stepId === 'env_pesticides' || h.value?.answers?.pesticidesQ1 !== undefined || (h.value?.option && (h.value.option.toLowerCase().includes('pesticide') || h.value.option.toLowerCase().includes('organic'))));
            }
            if (s === 'env_microplastics') {
              return envHabits.some(h => h.value?.stepId === 'env_microplastics' || h.value?.answers?.microplasticsQ1 !== undefined || (h.value?.option && (h.value.option.toLowerCase().includes('plastic'))));
            }
            return true;
          }
          // Gut & Dental check
          if (s === 'gut_health') return todaysHabits.some(h =>
            h.type === 'Gastritis' || h.type === 'Dental' ||
            h.type?.toUpperCase().includes('GASTRIC') || h.type?.toUpperCase().includes('DENTAL')
          );
          // Genetics / Family History of Cancer
          if (s === 'genetics' || s === 'genetics_substances') return todaysHabits.some(h =>
            h.type === 'Genetic' || h.type?.toUpperCase().includes('GENETIC')
          );
          // Substances check
          if (s === 'substances') return todaysHabits.some(h =>
            h.type === 'Substances' || h.type?.toUpperCase().includes('SUBSTANCE')
          );
          // Damage Habits → saves type: 'DAMAGE_HABIT'
          if (s === 'damage_habits') return todaysHabits.some(h =>
            h.type === 'DAMAGE_HABIT' || h.type === 'Environmental' || h.type?.toUpperCase().includes('DAMAGE')
          );
          // Repair Habits / Antioxidants → saves type: 'REPAIR_HABIT'
          if (s === 'repair_habits') return todaysHabits.some(h =>
            h.type === 'REPAIR_HABIT' || h.type === 'Antioxidants' || h.type?.toUpperCase().includes('REPAIR')
          );
          // Joy + Stillness combined step
          if (s === 'joy_stillness') return todaysHabits.some(h =>
            h.type === 'Joy' || h.type === 'Stillness' ||
            h.type?.toUpperCase().includes('JOY') || h.type?.toUpperCase().includes('STILLNESS')
          );
          // Screening → saves type: 'Screening'
          if (s === 'screening') return todaysHabits.some(h =>
            h.type === 'Screening' || h.type?.toUpperCase().includes('SCREEN')
          );
          // Report upload → check reports collection
          if (s === 'report_upload') return todayReports.some(r =>
            new Date(r.createdAt || r.uploadDate || Date.now()).toDateString() === todayStr
          );

          return false;
        };


        const getLoggedHabitSummary = (stepId: string, habitsList: any[]): { valText: string; isManual: boolean } => {
          const s = stepId.toLowerCase();
          const habit = habitsList.find(h => {
            const t = (h.type || '').toLowerCase();
            if (s === 'fasting') return t === 'fasting';
            if (s === 'stress' || s === 'caregiver_stress') return t === 'stress';
            if (s === 'sleep') return t === 'sleep';
            if (s === 'movement') return t === 'movement';
            if (s === 'stillness') return t === 'stillness';
            if (s === 'joy') return t === 'joy';
            if (s === 'antioxidants') return t === 'antioxidants';
            if (s.startsWith('env_')) return t === 'environmental';
            if (s === 'genetics') return t === 'genetic';
            if (s === 'substances') return t === 'substances';
            if (s === 'damage_habits') return t.includes('damage') || t === 'smoking' || t === 'alcohol';
            if (s === 'repair_habits') return t.includes('repair') || t === 'antioxidants';
            if (s === 'joy_stillness') return t === 'joy' || t === 'stillness';
            if (s === 'smoking') return t.includes('smoking') || t.includes('alcohol');
            if (s === 'screening') return t.includes('screen');
            if (s === 'report_upload') return t.includes('report');
            return t.includes(s) || s.includes(t);
          });

          if (s === 'report_upload' && todayReports.length > 0) {
            const rep = todayReports[0];
            const repName = rep.originalName || rep.title || 'Lab / CGM Report';
            return { valText: `Uploaded (${repName}) · AI Log`, isManual: false };
          }

          if (!habit) return { valText: 'Logged for Today', isManual: true };

          let valStr = '';
          const v = habit.value;
          if (typeof v === 'string') {
            valStr = v;
          } else if (typeof v === 'number') {
            valStr = `${v}`;
          } else if (v) {
            valStr = v.option || v.notes || v.label || v.level || v.face || v.activity || v.joyActivity || v.fastingHours ||
              (v.hours !== undefined && v.hours > 0 ? `${v.hours} hrs` : '') ||
              (v.minutes !== undefined && v.minutes > 0 ? `${v.minutes} mins` : '') ||
              (v.count !== undefined && v.count > 0 ? `${v.count} sticks` : '') ||
              (v.value !== undefined ? (typeof v.value === 'object' ? '' : `${v.value}`) : '');
          }

          if (s.includes('sleep') && valStr && !isNaN(Number(valStr.trim()))) {
            valStr = `${valStr.trim()} hrs`;
          }

          const isManual = habit.source !== 'chatbot';
          const tag = isManual ? 'Manual Log' : 'AI Log';
          const displayValue = valStr && valStr !== 'true' && valStr !== 'false' ? `${valStr} · ${tag}` : `Logged · ${tag}`;
          return { valText: displayValue, isManual };
        };

        const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const initialMessages: ChatMessage[] = [{
          id: 'welcome', sender: 'bot',
          text: `Hi! I'm your AI Check-in Assistant. Here's your progress for today:`,
          timestamp: ts
        }];

        let firstUnloggedIndex = -1;
        activeSteps.forEach((step, idx) => {
          if (isLogged(step.stepId)) {
            const summary = getLoggedHabitSummary(step.stepId, todaysHabits);
            initialMessages.push({
              id: `logged_${step.stepId}`,
              sender: 'bot',
              title: step.title,
              isLoggedBadge: true,
              stepId: step.stepId,
              loggedValue: summary.valText,
              text: `${step.title} completed`,
              timestamp: ts
            });
          } else if (firstUnloggedIndex === -1) {
            firstUnloggedIndex = idx;
          }
        });

        if (firstUnloggedIndex !== -1) {
          const nextStep = activeSteps[firstUnloggedIndex];
          setActiveStepIndex(firstUnloggedIndex);

          let questionText = nextStep.questionPrompt;
          let questionOptions = nextStep.options;

          if (nextStep.stepId === 'report_upload' && todayReports.length > 0) {
            const existingRep = todayReports[0];
            const fileName = existingRep.originalName || existingRep.title || 'Uploaded Report';
            questionText = `📄 Report already uploaded today (${fileName}). Would you like to keep this report or re-upload a new file?`;
            questionOptions = ['Keep Current Report', 'Re-upload / Update File'];
          }

          initialMessages.push({ id: `step_${firstUnloggedIndex}`, sender: 'bot', text: questionText, timestamp: ts, inputType: nextStep.inputType, options: questionOptions, stepId: nextStep.stepId });
          setMessages(initialMessages);
          speakQuestion(questionText, () => {
            if (nextStep.inputType !== 'FILE') {
              startListening();
            }
          });
        } else {
          setIsCompleted(true);
          initialMessages.push({ id: 'all_done', sender: 'bot', text: 'All daily check-ins completed. Your data is synced.', timestamp: ts });
          setMessages(initialMessages);
        }
      }
    } catch (err) {
      console.error('Error loading workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsCompleted(false);
      fetchWorkflow();
    } else {
      // Stop mic and speech when modal closes
      stopListening();
      if (Capacitor.isNativePlatform()) {
        try { TextToSpeech.stop(); } catch {}
      } else if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsListening(false);
    }
  }, [isOpen]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const saveHabitToBackend = async (stepId: string, valueStr: string) => {
    if (!token) return;
    try {
      const lowerVal = valueStr.toLowerCase();
      const isYes = lowerVal.includes('yes') || lowerVal.includes('completed') || lowerVal.includes('good') || lowerVal.includes('done') || lowerVal.includes('positive');
      let habitType = 'GENERAL', habitValue: any = { value: 1 };

      if (stepId === 'stress' || stepId === 'caregiver_stress') {
        habitType = 'Stress';
        habitValue = { faceId: (lowerVal.includes('high') || lowerVal.includes('strain') || lowerVal.includes('severe') || lowerVal.includes('drained')) ? 'stressed' : 'calm' };
      } else if (stepId === 'sleep') {
        habitType = 'Sleep';
        const h = parseFloat(valueStr) || 7;
        habitValue = { hours: h, quality: h >= 6 ? 'good' : 'poor' };
      } else if (stepId === 'fasting') {
        habitType = 'Fasting';
        habitValue = { completed: isYes, hours: lowerVal.includes('16') ? 16 : lowerVal.includes('12') ? 12 : isYes ? 14 : 0 };
      } else if (stepId === 'movement') {
        // Movement screen saves type: 'Movement', value: { minutes: N }
        habitType = 'Movement';
        const mins = lowerVal.includes('30+') || lowerVal.includes('30 min') ? 30
          : lowerVal.includes('20') ? 20
          : lowerVal.includes('light') ? 15
          : lowerVal.includes('bed') || lowerVal.includes('rest') ? 0 : 20;
        habitValue = { minutes: mins, done: mins >= 20, activity: valueStr };
      } else if (stepId === 'smoking') {
        habitType = 'Smoking';
        habitValue = { count: isYes ? 1 : 0 };
      } else if (stepId === 'damage_habits') {
        habitType = 'DAMAGE_HABIT';
        habitValue = { isExposure: !lowerVal.includes('clean'), score: lowerVal.includes('clean') ? 0 : -1, notes: valueStr };
      } else if (stepId === 'repair_habits') {
        habitType = 'REPAIR_HABIT';
        habitValue = { isCompleted: isYes, score: isYes ? 1 : 0, notes: valueStr };
      } else if (stepId === 'nutrition') {
        habitType = 'REPAIR_HABIT';
        habitValue = { isCompleted: isYes, score: isYes ? 1 : 0, notes: `Nutrition: ${valueStr}` };
      } else if (stepId === 'medication') {
        habitType = 'Medication';
        habitValue = { taken: isYes, notes: valueStr };
      } else if (stepId === 'screening') {
        habitType = 'Screening';
        habitValue = { done: isYes, notes: valueStr };
      } else if (stepId === 'glucose_check') {
        habitType = 'Glucose';
        const gVal = parseFloat(valueStr);
        habitValue = { value: gVal || 0, unit: 'mg/dL' };
      } else if (stepId === 'alcohol') {
        habitType = 'Alcohol';
        habitValue = { drinks: lowerVal.includes('no') ? 0 : 1, option: valueStr };
      } else if (stepId === 'antioxidants') {
        habitType = 'Antioxidants';
        habitValue = { consumed: isYes, option: valueStr };
      } else if (stepId.startsWith('env_')) {
        habitType = 'Environmental';
        // Look up any existing Environmental habit from today to preserve other answers
        const todayStr = new Date().toDateString();
        const existingEnv = loggedHabits.find(h => 
          (h.type === 'Environmental' || h.type?.toUpperCase() === 'ENVIRONMENTAL') &&
          new Date(h.timestamp || h.createdAt).toDateString() === todayStr
        );
        const prevAnswers = existingEnv?.value?.answers || {};
        const updatedAnswers = { ...prevAnswers };

        if (stepId === 'env_air') {
          const isClean = lowerVal.includes('no') || lowerVal.includes('clean');
          updatedAnswers.airQ1 = !isClean;
          updatedAnswers.airQ2 = !isClean;
        } else if (stepId === 'env_water') {
          updatedAnswers.waterQ1 = lowerVal.includes('yes') || lowerVal.includes('safe') || lowerVal.includes('filtered');
        } else if (stepId === 'env_pesticides') {
          const isClean = lowerVal.includes('no') || lowerVal.includes('clean') || lowerVal.includes('organic');
          updatedAnswers.pesticidesQ1 = !isClean;
        } else if (stepId === 'env_microplastics') {
          const isClean = lowerVal.includes('no') || lowerVal.includes('plastic-free') || lowerVal.includes('avoid');
          updatedAnswers.microplasticsQ1 = !isClean;
        }

        let calcScore = 0;
        if (updatedAnswers.airQ1 === true || updatedAnswers.airQ2 === true) calcScore -= 1;
        if (updatedAnswers.waterQ1 === false) calcScore -= 1;
        if (updatedAnswers.pesticidesQ1 === true) calcScore -= 1;
        if (updatedAnswers.microplasticsQ1 === true) calcScore -= 1;

        habitValue = {
          score: calcScore,
          answers: updatedAnswers,
          option: valueStr
        };
      } else if (stepId === 'gut_health') {
        habitType = 'Gastritis';
        habitValue = { gastritis: lowerVal.includes('gastritis') || lowerVal.includes('both'), option: valueStr };
        if (lowerVal.includes('dental') || lowerVal.includes('both')) {
          fetch(`${apiUrl}/habits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ type: 'Dental', value: { sharpTooth: true, tobaccoStain: false, option: valueStr }, source: 'chatbot', timestamp: new Date().toISOString() })
          }).catch(() => {});
        }
      } else if (stepId === 'genetics') {
        habitType = 'Genetic';
        habitValue = { geneticLink: isYes, option: valueStr };
      } else if (stepId === 'substances') {
        habitType = 'Substances';
        habitValue = { used: isYes, option: valueStr };
      } else if (stepId === 'genetics_substances') {
        habitType = 'Genetic';
        habitValue = { geneticLink: lowerVal.includes('family') || lowerVal.includes('both'), option: valueStr };
        if (lowerVal.includes('substance') || lowerVal.includes('both')) {
          fetch(`${apiUrl}/habits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ type: 'Substances', value: { used: true, option: valueStr }, source: 'chatbot', timestamp: new Date().toISOString() })
          }).catch(() => {});
        }
      // ── Individual cancer treatment / prevention steps matching manual screen types ──
      } else if (stepId === 'joy') {
        // Joy / Things You Love screen saves type: 'Joy', value: { done: true/false }
        habitType = 'Joy';
        habitValue = { done: isYes };
      } else if (stepId === 'stillness') {
        // Stillness screen saves type: 'Stillness', value: { sat: true/false }
        habitType = 'Stillness';
        habitValue = { sat: isYes };
      } else if (stepId === 'joy_stillness') {
        // Combined legacy step
        habitType = 'Joy';
        habitValue = { done: isYes };
      }

      // Ensure option & notes & stepId are attached for clear summary rendering next time
      habitValue = {
        ...habitValue,
        stepId,
        option: valueStr,
        notes: valueStr
      };

      await fetch(`${apiUrl}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type: habitType, value: habitValue, source: 'chatbot', timestamp: new Date().toISOString() })
      });

      // Update in-memory state so subsequent checks in the same session immediately know it is logged
      setLoggedHabits(prev => [
        {
          type: habitType,
          value: habitValue,
          source: 'chatbot',
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);
    } catch (e) { console.error('Error saving habit:', e); }
  };

  const handleStartEditLoggedStep = (stepId: string) => {
    if (editingStepId === stepId) return; // Prevent duplicate clicks

    const targetIdx = workflow?.steps.findIndex(s => s.stepId === stepId);
    if (targetIdx !== undefined && targetIdx !== -1 && workflow) {
      const targetStep = workflow.steps[targetIdx];
      setEditingStepId(stepId);
      setActiveStepIndex(targetIdx);
      setIsCompleted(false);
      const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      setMessages(prev => {
        const filtered = prev.filter(m => !m.id.startsWith('relog_'));
        return [
          ...filtered,
          {
            id: `relog_${stepId}`,
            sender: 'bot',
            text: `✏️ Re-logging ${targetStep.title}: ${targetStep.questionPrompt}`,
            timestamp: ts,
            inputType: targetStep.inputType,
            options: targetStep.options,
            stepId: targetStep.stepId
          }
        ];
      });
      speakQuestion(targetStep.questionPrompt);
      if (targetStep.inputType !== 'FILE') {
        setTimeout(() => startListening(), 800);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingStepId(null);
    setMessages(prev => prev.filter(m => !m.id.startsWith('relog_')));
  };

  const parseMultiHabitsFromText = (input: string): { stepId: string; valueStr: string; name: string }[] => {
    const text = input.toLowerCase();
    const detected: { stepId: string; valueStr: string; name: string }[] = [];

    // Sleep
    const sleepMatch = text.match(/(\d+(\.\d+)?)\s*(hours|hrs|hr)?\s*(of\s*)?sleep/) || text.match(/slept\s*(for\s*)?(\d+(\.\d+)?)/);
    if (sleepMatch) {
      const hrs = sleepMatch[1] || sleepMatch[2];
      detected.push({ stepId: 'sleep', valueStr: `${hrs} hrs`, name: `Sleep (${hrs} hrs)` });
    }

    // Movement / Walking
    const walkMatch = text.match(/(\d+)\s*(mins?|minutes?)\s*(walk|run|workout|exercise|jog)/) || text.match(/walk(ed)?\s*(for\s*)?(\d+)?/);
    if (walkMatch || text.includes('yoga') || text.includes('exercise') || text.includes('workout') || text.includes('gym')) {
      const mins = walkMatch?.[1] || walkMatch?.[3] || '30';
      detected.push({ stepId: 'movement', valueStr: `${mins}+ min Walk`, name: `Movement (${mins} mins)` });
    }

    // Fasting
    if (text.includes('16:8') || text.includes('16 hours') || text.includes('fasted') || text.includes('fasting done') || text.includes('completed fast')) {
      detected.push({ stepId: 'fasting', valueStr: 'Yes (16+ hrs)', name: 'Intermittent Fasting' });
    } else if (text.includes('skipped fast') || text.includes('no fast')) {
      detected.push({ stepId: 'fasting', valueStr: 'No (Skipped)', name: 'Fasting (Skipped)' });
    }

    // Stillness / Meditation
    if (text.includes('stillness') || text.includes('meditation') || text.includes('meditated') || text.includes('deep breathing')) {
      detected.push({ stepId: 'stillness', valueStr: 'Yes (10+ min)', name: 'Stillness & Meditation' });
    }

    // Joy / Things you love
    if (text.includes('things i love') || text.includes('hobbies') || text.includes('played music') || text.includes('spent time with family') || text.includes('did things i love')) {
      detected.push({ stepId: 'joy', valueStr: 'Yes (Done)', name: 'Things You Love' });
    }

    // Stress
    if (text.includes('no stress') || text.includes('calm') || text.includes('relaxed') || text.includes('peaceful') || text.includes('felt good')) {
      detected.push({ stepId: 'stress', valueStr: 'No Stress (Calm)', name: 'Stress (Calm / No Stress)' });
    } else if (text.includes('high stress') || text.includes('very stressed') || text.includes('anxious')) {
      detected.push({ stepId: 'stress', valueStr: 'High Stress', name: 'Stress (High Stress)' });
    } else if (text.includes('mild stress') || text.includes('little stress')) {
      detected.push({ stepId: 'stress', valueStr: 'Mild Stress', name: 'Stress (Mild)' });
    }

    // Smoking
    if (text.includes('no smoke') || text.includes('no smoking') || text.includes('didnt smoke') || text.includes('clean day')) {
      detected.push({ stepId: 'smoking', valueStr: 'No (Clean Day)', name: 'Smoking (Clean Day)' });
    } else if (text.includes('smoked') || text.includes('cigarettes')) {
      detected.push({ stepId: 'smoking', valueStr: 'Yes (Smoke / Exposed)', name: 'Smoking (Exposed)' });
    }

    // Alcohol
    if (text.includes('no alcohol') || text.includes('no drink') || text.includes('no beer') || text.includes('no wine') || text.includes('sober')) {
      detected.push({ stepId: 'alcohol', valueStr: 'No Alcohol (Clean Day)', name: 'Alcohol (Clean Day)' });
    } else if (text.includes('had alcohol') || text.includes('1 drink') || text.includes('2 drinks') || text.includes('had a beer')) {
      detected.push({ stepId: 'alcohol', valueStr: '1-2 Drinks', name: 'Alcohol (1-2 Drinks)' });
    }

    // Antioxidants
    if (text.includes('antioxidant') || text.includes('berries') || text.includes('turmeric') || text.includes('green tea') || text.includes('amla')) {
      detected.push({ stepId: 'antioxidants', valueStr: 'Yes (Consumed)', name: 'Antioxidants & Repair Foods' });
    }

    // Environment
    if (text.includes('clean air') || text.includes('no traffic') || text.includes('no pollution')) {
      detected.push({ stepId: 'env_air', valueStr: 'No (Clean Air)', name: 'Air Pollution (Clean)' });
    }
    if (text.includes('filtered water') || text.includes('ro water') || text.includes('safe water') || text.includes('clean drinking water')) {
      detected.push({ stepId: 'env_water', valueStr: 'Yes (Safe Filtered)', name: 'Water Filter (Safe RO)' });
    }
    if (text.includes('no plastic') || text.includes('plastic free') || text.includes('avoided plastic')) {
      detected.push({ stepId: 'env_microplastics', valueStr: 'No (Plastic-Free)', name: 'Microplastics (Clean)' });
    }

    return detected;
  };

  const advanceToNextStep = (userAnswer: string, _isFromVoice = false) => {
    const currentWf = workflowRef.current;
    const currentIndex = activeStepIndexRef.current;
    const currentMsgs = messagesRef.current;
    if (!currentWf?.steps) return;
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Check for multi-habit NLP recognition
    const detectedMulti = parseMultiHabitsFromText(userAnswer);

    if (detectedMulti.length >= 2) {
      // Process all detected habits in parallel
      detectedMulti.forEach(item => {
        saveHabitToBackend(item.stepId, item.valueStr);
      });

      const userMsg: ChatMessage = { id: `user_${Date.now()}`, sender: 'user', text: userAnswer, timestamp: ts };
      const summaryMsg: ChatMessage = {
        id: `multi_${Date.now()}`,
        sender: 'bot',
        text: `✨ Smart Natural Language: Logged ${detectedMulti.length} habits in one shot!`,
        isMultiHabitSummary: true,
        multiHabitsList: detectedMulti.map(d => ({ name: d.name, value: d.valueStr })),
        timestamp: ts
      };

      const updatedMsgs = [...currentMsgs, userMsg, summaryMsg];
      const loggedSet = new Set(detectedMulti.map(d => d.stepId));

      // Find first step that wasn't in the multi-habit detection and wasn't already logged
      const nextUnloggedIndex = currentWf.steps.findIndex((s, idx) => 
        idx > currentIndex && !loggedSet.has(s.stepId)
      );

      if (nextUnloggedIndex !== -1) {
        const nextStep = currentWf.steps[nextUnloggedIndex];
        setActiveStepIndex(nextUnloggedIndex);
        updatedMsgs.push({
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: nextStep.questionPrompt,
          timestamp: ts,
          inputType: nextStep.inputType,
          options: nextStep.options,
          stepId: nextStep.stepId
        });
        setMessages(updatedMsgs);
        speakQuestion(nextStep.questionPrompt, () => {
          if (nextStep.inputType !== 'FILE') {
            startListening();
          }
        });
      } else {
        setIsCompleted(true);
        const finishMsg = 'All daily check-ins logged. Your cellular defense dashboard is updated.';
        updatedMsgs.push({
          id: 'bot_finish',
          sender: 'bot',
          text: finishMsg,
          timestamp: ts
        });
        setMessages(updatedMsgs);
        speakQuestion(finishMsg);
        if (onRefreshDashboard) onRefreshDashboard();
      }
      return;
    }

    const currentStep = currentWf.steps[currentIndex];

    // Validate single-question input against valid options / types
    const validation = validateAndMapAnswer(userAnswer, currentStep);

    if (!validation.valid) {
      const userMsg: ChatMessage = { id: `user_${Date.now()}`, sender: 'user', text: userAnswer, timestamp: ts, stepId: currentStep?.stepId };
      const clarifyMsg: ChatMessage = {
        id: `bot_clarify_${Date.now()}`,
        sender: 'bot',
        text: validation.clarificationMsg || 'Please choose one of the available options below.',
        timestamp: ts,
        inputType: currentStep?.inputType,
        options: currentStep?.options,
        stepId: currentStep?.stepId
      };
      setMessages([...currentMsgs, userMsg, clarifyMsg]);
      speakQuestion(validation.clarificationMsg || 'Please choose one of the options on screen.', () => {
        if (currentStep?.inputType !== 'FILE') {
          startListening();
        }
      });
      return; // Block advancement and do NOT save incorrect answer!
    }

    const validatedAnswer = validation.mappedValue;
    const userMsg: ChatMessage = { id: `user_${Date.now()}`, sender: 'user', text: validatedAnswer, timestamp: ts, stepId: currentStep?.stepId };
    if (currentStep) saveHabitToBackend(currentStep.stepId, validatedAnswer);
    setEditingStepId(null);
    const nextIndex = currentIndex + 1;
    const updatedMsgs = [...currentMsgs, userMsg];

    if (nextIndex < currentWf.steps.length) {
      const nextStep = currentWf.steps[nextIndex];
      setActiveStepIndex(nextIndex);
      updatedMsgs.push({ id: `bot_${Date.now()}`, sender: 'bot', text: nextStep.questionPrompt, timestamp: ts, inputType: nextStep.inputType, options: nextStep.options, stepId: nextStep.stepId });
      setMessages(updatedMsgs);
      speakQuestion(nextStep.questionPrompt, () => {
        if (nextStep.inputType !== 'FILE') {
          startListening();
        }
      });
    } else {
      setIsCompleted(true);
      const finishMsg = 'All check-ins logged. Your cellular defense dashboard is updated.';
      updatedMsgs.push({ id: 'bot_finish', sender: 'bot', text: finishMsg, timestamp: ts });
      setMessages(updatedMsgs);
      speakQuestion(finishMsg);
      if (onRefreshDashboard) onRefreshDashboard();
    }
  };

  const handleSaveEdit = async (msg: ChatMessage) => {
    if (!editInputText.trim() || !msg.stepId) return;
    await saveHabitToBackend(msg.stepId, editInputText);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, text: editInputText } : m));
    setEditingMessageId(null);
    if (onRefreshDashboard) onRefreshDashboard();
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    advanceToNextStep(text);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !token) return;
    const file = e.target.files[0];
    setIsUploading(true);
    const formData = new FormData();
    formData.append('report', file);
    try {
      const res = await fetch(`${apiUrl}/reports/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      await saveHabitToBackend('report_upload', `Uploaded: ${file.name}`);
      advanceToNextStep(res.ok ? `Uploaded: ${file.name}` : `Attempted: ${file.name}`);
    } catch {
      await saveHabitToBackend('report_upload', `Uploaded: ${file.name}`);
      advanceToNextStep(`Uploaded: ${file.name}`);
    }
    finally { setIsUploading(false); }
  };

  if (!isOpen) return null;

  const currentStep = workflow?.steps[activeStepIndex];
  const progress = workflow ? ((activeStepIndex + 1) / workflow.steps.length) * 100 : 0;

  return (
    <AnimatePresence>
      {/* Full-screen overlay */}
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col w-full h-full max-w-lg mx-auto bg-gradient-to-b from-blue-600 via-slate-50 to-slate-50 dark:via-slate-950 dark:to-slate-950 shadow-2xl overflow-hidden"
          style={{ maxHeight: '100dvh' }}
        >
          {/* ── HEADER ── */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3.5 text-white flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-inner">
                  <Bot className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-white tracking-tight">AI Assistant</span>
                    {isSpeaking ? (
                      <span className="flex items-center gap-1.5 text-[9px] font-black bg-amber-400/30 text-amber-200 px-2 py-0.5 rounded-full border border-amber-300/40">
                        <span className="flex items-center gap-0.5">
                          <span className="h-2 w-0.5 bg-amber-300 rounded-full animate-bounce" />
                          <span className="h-3 w-0.5 bg-amber-300 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="h-2 w-0.5 bg-amber-300 rounded-full animate-bounce [animation-delay:300ms]" />
                        </span>
                        SPEAKING
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] font-black bg-emerald-400/25 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ONLINE
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-medium text-blue-100/80 mt-0.5">
                    {userMode === 'TREATMENT' ? 'Oncology Care & Recovery Check-in' : userMode === 'SECONDARY_PREVENTION' ? 'Survivor Recovery Daily Check-in' : 'Cancer Prevention Daily Check-in'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowReminderSettings(prev => !prev)}
                  className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                    showReminderSettings ? 'bg-white text-blue-600 border-white shadow-xs' : 'bg-white/15 hover:bg-white/25 border-white/20 text-white'
                  }`}
                  title="Daily AI Check-in Reminder Time"
                >
                  <Bell className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={toggleVoiceMute}
                  className={`h-8 px-2.5 rounded-full border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSpeaking
                      ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-md shadow-amber-400/30 font-black animate-pulse'
                      : isVoiceMuted
                        ? 'bg-white/10 hover:bg-white/20 border-white/20 text-rose-300'
                        : 'bg-white/15 hover:bg-white/25 border-white/20 text-white'
                  }`}
                  title={isSpeaking ? 'Stop Speaking' : isVoiceMuted ? 'Muted (Tap to Listen)' : 'AI Voice Active (Tap to Mute)'}
                >
                  {isSpeaking ? (
                    <>
                      <Volume2 className="h-3.5 w-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Stop</span>
                    </>
                  ) : isVoiceMuted ? (
                    <>
                      <VolumeX className="h-3.5 w-3.5" />
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Muted</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5" />
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Voice</span>
                    </>
                  )}
                </button>
                <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center transition-all cursor-pointer">
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            {/* Reminder Setting Overlay Dropdown inside Modal */}
            {showReminderSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white/15 backdrop-blur-md rounded-2xl p-3.5 border border-white/25 mb-3 text-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-blue-200" />
                    Daily AI Check-in Reminder Time
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowReminderSettings(false)}
                    className="text-white/70 hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[10.5px] text-blue-100/90 mb-2.5 font-medium">
                  Select a quick time or pick any custom reminder time:
                </p>

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                  {['20:00', '20:30', '21:00', '21:30'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleSaveReminder(t)}
                      className={`py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        reminderTime === t
                          ? 'bg-white text-blue-700 border-white shadow-xs font-black'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                    >
                      {formatDisplayTime(t)}
                    </button>
                  ))}
                </div>

                {/* Custom Time Picker */}
                <div className="flex items-center gap-2 bg-white/20 p-2 rounded-xl border border-white/25">
                  <span className="text-[10px] font-black text-white/80 uppercase tracking-wider shrink-0">Custom Time:</span>
                  <input
                    type="time"
                    value={customTimeInput}
                    onChange={(e) => setCustomTimeInput(e.target.value)}
                    className="flex-1 text-xs font-black text-white bg-transparent border-none focus:outline-none cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveReminder(customTimeInput)}
                    className="px-3 py-1 bg-white hover:bg-blue-50 text-blue-700 text-[10.5px] font-black rounded-lg shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    Set Time
                  </button>
                </div>

                {reminderSaved && (
                  <p className="text-[11px] font-bold text-emerald-300 mt-2 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Reminder scheduled for {formatDisplayTime(reminderTime)}!
                  </p>
                )}

                {/* Test Alert Button */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-2.5">
                  <span className="text-[9.5px] text-blue-100/70 font-medium">
                    {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied' ? (
                      <span className="text-rose-300 font-bold">⚠️ Blocked in browser settings</span>
                    ) : (
                      <span>🔔 System Alarm & Chime</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => triggerTestNotification()}
                    className="text-[10px] font-bold text-white bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer"
                  >
                    <Bell className="h-3 w-3" /> Test Alert Now
                  </button>
                </div>
              </motion.div>
            )}

            {/* Progress bar */}
            {workflow && !isCompleted && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-blue-100/80">
                  <span>{currentStep?.title}</span>
                  <span>{Math.min(activeStepIndex + 1, workflow.steps.length)} / {workflow.steps.length}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── CHAT MESSAGES ── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50 dark:bg-slate-950 overscroll-contain">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="text-xs font-bold">Loading your check-in...</span>
              </div>
            ) : (
              <>
                {messages.map((msg, msgIdx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: msgIdx * 0.03 }}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    {/* ── Already-logged badge with value & Edit button ── */}
                    {msg.isLoggedBadge ? (
                      <div className="w-full p-3 my-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{msg.title}</p>
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {msg.loggedValue || 'Logged for Today'}
                            </p>
                          </div>
                        </div>
                        {msg.stepId && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {editingStepId === msg.stepId ? (
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold rounded-xl border border-rose-300 shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                                <span>Cancel</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartEditLoggedStep(msg.stepId!)}
                                disabled={editingStepId !== null}
                                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-2xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                              >
                                <Pencil className="h-3 w-3" />
                                <span>Edit</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* ── Bot bubble ── */}
                        {msg.sender === 'bot' && (
                          <div className="flex items-start gap-2 max-w-[90%]">
                            <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 mt-0.5">
                              <Bot className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 text-xs font-medium text-slate-800 dark:text-slate-100 leading-relaxed shadow-sm">
                              {msg.text}
                            </div>
                          </div>
                        )}

                        {/* ── Multi-Habit NLP Summary Card ── */}
                        {msg.isMultiHabitSummary && msg.multiHabitsList && (
                          <div className="bg-gradient-to-br from-indigo-50/90 to-blue-50/90 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-3.5 shadow-sm my-2 max-w-[95%]">
                            <div className="flex items-center gap-1.5 text-xs font-black text-indigo-700 dark:text-indigo-300 mb-2">
                              <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                              <span>Auto-Detected {msg.multiHabitsList.length} Habits:</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {msg.multiHabitsList.map((h, i) => (
                                <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  <span className="truncate">{h.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── User bubble ── */}
                        {msg.sender === 'user' && (
                          <div className="flex flex-col items-end gap-1.5 max-w-[90%]">
                            {editingMessageId === msg.id ? (
                              /* ── Inline edit mode ── */
                              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-600 rounded-2xl px-3 py-2 shadow-md w-72">
                                <input
                                  ref={editInputRef}
                                  type="text"
                                  value={editInputText}
                                  onChange={e => setEditInputText(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(msg); if (e.key === 'Escape') setEditingMessageId(null); }}
                                  className="flex-1 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none placeholder-slate-400"
                                  placeholder="Edit your answer..."
                                />
                                <button onClick={() => handleSaveEdit(msg)} className="h-6 w-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center transition-all cursor-pointer shrink-0">
                                  <Check className="h-3 w-3 text-white" />
                                </button>
                                <button onClick={() => setEditingMessageId(null)} className="h-6 w-6 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 flex items-center justify-center transition-all cursor-pointer shrink-0">
                                  <X className="h-3 w-3 text-slate-600 dark:text-slate-300" />
                                </button>
                              </div>
                            ) : (
                              /* ── User answer bubble + visible edit button ── */
                              <div className="flex items-center gap-2">
                                {msg.stepId && (
                                  <button
                                    onClick={() => { setEditingMessageId(msg.id); setEditInputText(msg.text); }}
                                    className="h-7 w-7 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-center transition-all cursor-pointer shadow-xs group"
                                    title="Edit answer"
                                  >
                                    <Pencil className="h-3 w-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                  </button>
                                )}
                                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-xs font-semibold leading-relaxed shadow-md shadow-blue-500/15">
                                  {msg.text}
                                </div>
                              </div>
                            )}
                            <span className="text-[9px] font-bold text-slate-400 mr-1">{msg.timestamp}</span>
                          </div>
                        )}

                        {/* ── Option pills (only for current active step) ── */}
                        {msg.sender === 'bot' && msg.options && msg.options.length > 0 && !isCompleted && msg.stepId === currentStep?.stepId && (
                          <div className="flex flex-wrap gap-2 mt-2.5 pl-8">
                            {msg.options.map((opt, i) => (
                              <motion.button
                                key={i}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => advanceToNextStep(opt)}
                                className="bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:border-blue-600 rounded-2xl px-4 py-2.5 text-xs font-bold shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                              >
                                {opt}
                                <ArrowRight className="h-3 w-3 opacity-50" />
                              </motion.button>
                            ))}
                          </div>
                        )}

                        {/* ── File upload (only for current step) ── */}
                        {msg.sender === 'bot' && msg.inputType === 'FILE' && !isCompleted && msg.stepId === currentStep?.stepId && (
                          <div className="mt-2.5 pl-8">
                            <input ref={fileInputRef} type="file" accept=".pdf,.csv,.png,.jpg" onChange={handleFileUpload} className="hidden" />
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                              className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md hover:opacity-90 transition-all cursor-pointer"
                            >
                              <Upload className="h-4 w-4" />
                              {isUploading ? 'Uploading...' : 'Upload Report (PDF / CSV)'}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                ))}

                {/* ── Celebratory Post-Check-in Health Impact Card ── */}
                {isCompleted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 rounded-3xl p-5 shadow-lg my-4 text-center"
                  >
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 mx-auto mb-3">
                      <Trophy className="h-7 w-7 animate-bounce" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-1.5">
                      <Sparkles className="h-3 w-3 fill-current" />
                      Daily Cellular Defense Updated
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      All Daily Habits Logged
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Your circadian fasting, cellular repair, and risk prevention logs are synced to your live metabolic health dashboard.
                    </p>

                    <div className="grid grid-cols-2 gap-2.5 my-4 text-left">
                      <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                        <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 block mb-0.5">Cellular Defense</span>
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">+8 Balance</span>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-teal-100 dark:border-teal-900/40">
                        <span className="text-[10px] font-extrabold uppercase text-teal-600 dark:text-teal-400 block mb-0.5">Logging Streak</span>
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          <Flame className="h-4 w-4 text-amber-500 fill-amber-500" /> Active
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={onClose}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>View Cellular Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* ── INPUT BAR / DONE BAR ── */}
          {!isCompleted ? (
            <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
              {/* ── Live Listening Visualizer Banner ── */}
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="mx-3 mt-2.5 p-2.5 bg-gradient-to-r from-rose-500/10 via-rose-500/15 to-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex items-center justify-center">
                        <span className="absolute h-7 w-7 rounded-full bg-rose-500/30 animate-ping" />
                        <div className="h-6 w-6 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-xs z-10">
                          <Mic className="h-3.5 w-3.5 animate-bounce" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] font-black text-rose-600 dark:text-rose-400 leading-tight">Listening now...</p>
                          <div className="flex items-end gap-0.5 h-2.5">
                            <span className="w-0.5 bg-rose-500 rounded-full animate-[bounce_0.8s_infinite_100ms]" style={{ height: '60%' }} />
                            <span className="w-0.5 bg-rose-500 rounded-full animate-[bounce_0.8s_infinite_300ms]" style={{ height: '100%' }} />
                            <span className="w-0.5 bg-rose-500 rounded-full animate-[bounce_0.8s_infinite_200ms]" style={{ height: '40%' }} />
                            <span className="w-0.5 bg-rose-500 rounded-full animate-[bounce_0.8s_infinite_400ms]" style={{ height: '80%' }} />
                          </div>
                        </div>
                        <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium">Speak your answer clearly</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={toggleListening}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 text-[9.5px] font-bold rounded-xl border border-rose-200 dark:border-rose-900/40 shadow-2xs hover:bg-rose-50 transition-all cursor-pointer"
                    >
                      Done Speaking
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <form
                onSubmit={handleSendSubmit}
                className="px-3 py-3 flex items-center gap-2.5"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
              >
              {/* Voice button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-95'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={isListening ? 'Listening…' : 'Tap to speak'}
              >
                <Mic className={`h-5 w-5 ${isListening ? 'animate-bounce text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              </button>

              {/* Text input */}
              <input
                type={currentStep?.inputType === 'NUMBER' ? 'number' : 'text'}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={isListening ? '🎙 Listening...' : 'Type or speak your answer…'}
                className="flex-1 min-w-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors"
              />

              {/* Send button */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="h-11 w-11 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
              </form>
            </div>
          ) : (
            <div
              className="flex-shrink-0 px-4 py-4 bg-emerald-50 dark:bg-emerald-950/30 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">All Done!</p>
                  <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500">Dashboard updated</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bg-gradient-to-br from-emerald-600 to-teal-600 hover:opacity-90 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md transition-all cursor-pointer active:scale-95"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
