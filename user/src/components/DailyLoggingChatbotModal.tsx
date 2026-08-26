import React, { useState, useEffect, useRef } from 'react';
import {
  X, Mic, Send, Bot, CheckCircle2,
  Upload, RefreshCw, ArrowRight, Pencil, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  useEffect(() => { activeStepIndexRef.current = activeStepIndex; }, [activeStepIndex]);
  useEffect(() => { workflowRef.current = workflow; }, [workflow]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingMessageId) {
      setTimeout(() => editInputRef.current?.focus(), 100);
    }
  }, [editingMessageId]);

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

  const mapSpokenAnswerToOption = (spokenText: string, options?: string[]): string => {
    if (!spokenText) return '';
    const clean = spokenText.trim().toLowerCase();
    if (!options || options.length === 0) return spokenText;

    const exact = options.find(o => o.toLowerCase() === clean);
    if (exact) return exact;

    const sub = options.find(o => o.toLowerCase().includes(clean) || clean.includes(o.toLowerCase()));
    if (sub) return sub;

    // Positive intents
    if (['yes', 'yeah', 'yep', 'done', 'completed', 'good', 'positive', 'take'].some(w => clean.includes(w))) {
      return options[0];
    }
    // Negative intents
    if (['no', 'nope', 'skipped', 'not today', 'rest', 'none', 'missed'].some(w => clean.includes(w))) {
      const negOpt = options.find(o => 
        o.toLowerCase().includes('no') || 
        o.toLowerCase().includes('not') || 
        o.toLowerCase().includes('skip') || 
        o.toLowerCase().includes('rest')
      );
      return negOpt || options[options.length - 1];
    }
    return spokenText;
  };

  const startListening = async () => {
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
          const curStep = workflowRef.current?.steps[activeStepIndexRef.current];
          const mappedAnswer = mapSpokenAnswerToOption(txt, curStep?.options);
          advanceToNextStep(mappedAnswer, true);
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

      if (activeSteps.length > 0) {
        const todayStr = new Date().toDateString();
        // Filter all habits logged today (both manual and chatbot)
        const todaysHabits = todayHabits.filter(h =>
          new Date(h.timestamp || h.createdAt).toDateString() === todayStr
        );
        const isLogged = (stepId: string): boolean => {
          const s = stepId.toLowerCase();

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
          // Smoking/Alcohol screen → saves type: 'Smoking' or 'Alcohol'
          if (s === 'smoking') return todaysHabits.some(h =>
            h.type === 'Smoking' || h.type === 'Alcohol' ||
            h.type?.toUpperCase().includes('SMOKING') || h.type?.toUpperCase().includes('ALCOHOL')
          );
          // Alcohol check
          if (s === 'alcohol') return todaysHabits.some(h =>
            h.type === 'Alcohol' || h.type?.toUpperCase().includes('ALCOHOL')
          );
          // Antioxidants check
          if (s === 'antioxidants') return todaysHabits.some(h =>
            h.type === 'Antioxidants' || h.type?.toUpperCase().includes('ANTIOXIDANT')
          );
          // Gut & Dental check
          if (s === 'gut_health') return todaysHabits.some(h =>
            h.type === 'Gastritis' || h.type === 'Dental' ||
            h.type?.toUpperCase().includes('GASTRIC') || h.type?.toUpperCase().includes('DENTAL')
          );
          // Genetics & Substances check
          if (s === 'genetics_substances') return todaysHabits.some(h =>
            h.type === 'Genetic' || h.type === 'Substances' ||
            h.type?.toUpperCase().includes('GENETIC') || h.type?.toUpperCase().includes('SUBSTANCE')
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
        } else {
          setIsCompleted(true);
          initialMessages.push({ id: 'all_done', sender: 'bot', text: `🎉 All daily check-ins done! Your data is synced.`, timestamp: ts });
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
      fetchWorkflow().then(() => {
        // Auto-start mic 800ms after modal opens so user can speak their first answer
        setTimeout(() => startListening(), 800);
      });
    } else {
      // Stop mic when modal closes
      if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch {} }
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
      // ── Individual cancer treatment steps matching manual screen types ──
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

      // Ensure option & notes are attached for clear summary rendering next time
      habitValue = {
        ...habitValue,
        option: valueStr,
        notes: valueStr
      };

      await fetch(`${apiUrl}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type: habitType, value: habitValue, source: 'chatbot', timestamp: new Date().toISOString() })
      });
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
    }
  };

  const handleCancelEdit = () => {
    setEditingStepId(null);
    setMessages(prev => prev.filter(m => !m.id.startsWith('relog_')));
  };

  const advanceToNextStep = (userAnswer: string, _isFromVoice = false) => {
    const currentWf = workflowRef.current;
    const currentIndex = activeStepIndexRef.current;
    const currentMsgs = messagesRef.current;
    if (!currentWf?.steps) return;
    const currentStep = currentWf.steps[currentIndex];
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = { id: `user_${Date.now()}`, sender: 'user', text: userAnswer, timestamp: ts, stepId: currentStep?.stepId };
    if (currentStep) saveHabitToBackend(currentStep.stepId, userAnswer);
    setEditingStepId(null);
    const nextIndex = currentIndex + 1;
    const updatedMsgs = [...currentMsgs, userMsg];
    if (nextIndex < currentWf.steps.length) {
      const nextStep = currentWf.steps[nextIndex];
      setActiveStepIndex(nextIndex);
      updatedMsgs.push({ id: `bot_${Date.now()}`, sender: 'bot', text: nextStep.questionPrompt, timestamp: ts, inputType: nextStep.inputType, options: nextStep.options, stepId: nextStep.stepId });
      setMessages(updatedMsgs);
      // Auto-start mic after every bot question (skip for file upload steps)
      if (nextStep.inputType !== 'FILE') {
        setTimeout(() => startListening(), 700);
      }
    } else {
      setIsCompleted(true);
      updatedMsgs.push({ id: 'bot_finish', sender: 'bot', text: `🎉 All check-ins logged! Your dashboard is updated.`, timestamp: ts });
      setMessages(updatedMsgs);
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
                    <span className="flex items-center gap-1 text-[9px] font-black bg-emerald-400/25 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ONLINE
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-blue-100/80 mt-0.5">
                    {userMode === 'TREATMENT' ? 'Oncology Care & Recovery Check-in' : userMode === 'SECONDARY_PREVENTION' ? 'Survivor Recovery Daily Check-in' : 'Cancer Prevention Daily Check-in'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center transition-all cursor-pointer">
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

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
