import React, { useState, useEffect, useRef } from 'react';
import {
  X, Send, CheckCircle2,
  Upload, RefreshCw, ArrowRight, Pencil, Check,
  Volume2, VolumeX, Sparkles, Bell, BellOff, Clock,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { scheduleDailyCheckinReminder, cancelDailyCheckinReminder, triggerTestNotification } from '../utils/notificationScheduler';
import { getDeviceLocation } from '../utils/geolocationHelper';
import type { FocusModeType } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { RoboAvatar } from './RoboAvatar';

interface WorkflowStep {
  stepId: string;
  title: string;
  questionPrompt: string;
  inputType: 'YES_NO' | 'OPTIONS' | 'NUMBER' | 'TEXT' | 'FILE';
  options?: string[];
  order: number;
  isEnabled: boolean;
  habitType?: string;
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
  userMode?: FocusModeType;
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
  const { language, currentLanguageOption, t } = useLanguage();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [loggedHabits, setLoggedHabits] = useState<any[]>([]);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(() => localStorage.getItem('mito_ai_voice_muted') === 'true');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showQuickShortcuts, setShowQuickShortcuts] = useState<boolean>(false);

  // Edit state
  const [editInputText, setEditInputText] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(() => localStorage.getItem('mito_checkin_reminder_enabled') !== 'false' && Boolean(localStorage.getItem('mito_checkin_reminder_time')));
  const [reminderTime, setReminderTime] = useState<string>(() => localStorage.getItem('mito_checkin_reminder_time') || '');
  const [customTimeInput, setCustomTimeInput] = useState<string>(() => localStorage.getItem('mito_checkin_reminder_time') || '20:30');
  const [reminderStatusMsg, setReminderStatusMsg] = useState<string>('');

  const [sessionAnswers, setSessionAnswers] = useState<Record<string, string>>({});
  const [sessionSummary, setSessionSummary] = useState<{
    damageScore: number;
    repairScore: number;
    netBalance: number;
    damageHighlights: string[];
    repairHighlights: string[];
    priorityActionHints: string[];
  }>({
    damageScore: 0,
    repairScore: 0,
    netBalance: 0,
    damageHighlights: [],
    repairHighlights: [],
    priorityActionHints: []
  });

  const sessionAnswersRef = useRef(sessionAnswers);
  useEffect(() => { sessionAnswersRef.current = sessionAnswers; }, [sessionAnswers]);

  const computeSessionScoreSummary = (answers: Record<string, string>) => {
    let damageCount = 0;
    let repairCount = 0;
    const damageHighlights: string[] = [];
    const repairHighlights: string[] = [];
    const damageActionHints: string[] = [];
    const repairActionHints: string[] = [];

    // Helper to extract text / values from current session answers or loaded habits
    const getAnswer = (keys: string[]) => {
      // 1. Check current in-memory session answers
      for (const k of keys) {
        if (answers[k] !== undefined && answers[k] !== '') return `${answers[k]}`;
        const foundKey = Object.keys(answers).find(ak =>
          ak.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(ak.toLowerCase())
        );
        if (foundKey && answers[foundKey] !== undefined && answers[foundKey] !== '') {
          return `${answers[foundKey]}`;
        }
      }

      // 2. Check loaded today's / recent habits
      const todayStr = new Date().toDateString();
      const match = loggedHabits.find(h => {
        const isToday = new Date(h.timestamp || (h as any).createdAt || 0).toDateString() === todayStr;
        const typeUpper = (h.type || '').toUpperCase();
        return isToday && keys.some(k => typeUpper.includes(k.toUpperCase()) || k.toUpperCase().includes(typeUpper));
      }) || loggedHabits.find(h => {
        const typeUpper = (h.type || '').toUpperCase();
        return keys.some(k => typeUpper.includes(k.toUpperCase()) || k.toUpperCase().includes(typeUpper));
      });

      if (match) {
        const val = match.value;
        if (val == null) return '';
        if (typeof val === 'object') {
          return (val.option || val.notes || val.faceId || val.activity || (val.hours != null ? `${val.hours}` : '') || (val.minutes != null ? `${val.minutes}` : '') || JSON.stringify(val));
        }
        return `${val}`;
      }
      return '';
    };

    // 1. Stress
    const stressVal = getAnswer(['stress', 'caregiver_stress', 'stress_level']).toLowerCase();
    if (stressVal) {
      if (stressVal.includes('high') || stressVal.includes('tense') || stressVal.includes('stressed') || stressVal.includes('severe') || stressVal.includes('strain') || stressVal.includes('drained') || stressVal.includes('maxed') || stressVal.includes('yes') || stressVal === '3') {
        damageCount += 1;
        damageHighlights.push('High Stress / Cortisol');
        damageActionHints.push('Lower cortisol with 10 minutes of stillness breathwork or meditation.');
      } else if (stressVal.includes('calm') || stressVal.includes('low') || stressVal.includes('none') || stressVal.includes('good') || stressVal.includes('steady') || stressVal.includes('no stress') || stressVal === '1') {
        repairCount += 1;
        repairHighlights.push('Calm Nervous System');
      }
    }

    // 2. Sleep
    const sleepVal = getAnswer(['sleep', 'sleep_duration', 'sleep_hours']).toLowerCase();
    if (sleepVal) {
      const sleepHours = parseFloat(sleepVal);
      if ((sleepHours && sleepHours < 6) || sleepVal.includes('poor') || sleepVal.includes('low') || sleepVal.includes('<6')) {
        damageCount += 1;
        damageHighlights.push('Sleep Debt (<6h)');
        damageActionHints.push('Protect cellular mitochondria by getting at least 7-8 hours of sleep.');
      } else if ((sleepHours && sleepHours >= 6) || sleepVal.includes('good') || sleepVal.includes('restful') || sleepVal.includes('7') || sleepVal.includes('8') || sleepVal.includes('9')) {
        repairCount += 1;
        repairHighlights.push('7+ Hours Restorative Sleep');
      }
    }

    // 3. Smoking & Tobacco Chewing
    const smokingVal = getAnswer(['smoking', 'tobacco', 'chewing', 'gutkha', 'khaini']).toLowerCase();
    if (smokingVal) {
      const numSmk = parseFloat(smokingVal);
      if (smokingVal.includes('yes') || smokingVal.includes('smoke') || smokingVal.includes('chew') || smokingVal.includes('tobacco') || smokingVal.includes('gutkha') || smokingVal.includes('khaini') || (!isNaN(numSmk) && numSmk > 0)) {
        damageCount += 1;
        damageHighlights.push('Tobacco (Smoking / Chewing)');
        damageActionHints.push('Avoid smoking and chewing tobacco triggers tomorrow to prevent oral and systemic oncogenic stress.');
      } else if (smokingVal.includes('no') || smokingVal.includes('clean') || smokingVal === '0' || smokingVal.includes('none')) {
        repairCount += 1;
        repairHighlights.push('Tobacco & Smoke-Free Day');
      }
    }

    // 4. Alcohol
    const alcoholVal = getAnswer(['alcohol', 'drinks']).toLowerCase();
    if (alcoholVal) {
      const numAlc = parseFloat(alcoholVal);
      if (alcoholVal.includes('yes') || alcoholVal.includes('drink') || (!isNaN(numAlc) && numAlc > 0)) {
        damageCount += 1;
        damageHighlights.push('Alcohol Intake');
        damageActionHints.push('Plan an alcohol-free day tomorrow with herbal tea and high hydration.');
      } else if (alcoholVal.includes('no') || alcoholVal.includes('clean') || alcoholVal === '0' || alcoholVal.includes('none')) {
        repairCount += 1;
        repairHighlights.push('Zero Alcohol Exposure');
      }
    }

    // 5. Environmental Toxins
    const envVal = getAnswer(['environmental', 'env_air', 'env_pesticides', 'env_microplastics', 'env_water', 'substances']).toLowerCase();
    if (envVal) {
      if (envVal.includes('exposed') || envVal.includes('plastic') || envVal.includes('chemical') || envVal.includes('smog') || envVal.includes('tap') || envVal.includes('used') || envVal.includes('yes')) {
        damageCount += 1;
        damageHighlights.push('Environmental Toxins');
        damageActionHints.push('Upgrade to Dual Filtration (Activated Carbon + RO) to eliminate heavy metals, pesticides, and PFAS.');
      } else if (envVal.includes('clean') || envVal.includes('filtered') || envVal.includes('organic') || envVal.includes('plastic-free') || envVal.includes('no') || envVal.includes('none')) {
        repairCount += 1;
        repairHighlights.push('Low Toxic Burden');
      }
    }

    // Kitchen Audit
    const kitchenVal = getAnswer(['kitchen', 'kitchen_audit', 'env_kitchen']).toLowerCase();
    if (kitchenVal) {
      if (kitchenVal.includes('plastic') || kitchenVal.includes('teflon') || kitchenVal.includes('non-stick') || kitchenVal.includes('risk') || kitchenVal.includes('no')) {
        damageCount += 1;
        damageHighlights.push('Kitchen Plastic & Cookware Risk');
        damageActionHints.push('Replace plastic water cans and synthetic non-stick pans with stainless steel, glass, or natural cookware.');
      } else if (kitchenVal.includes('yes') || kitchenVal.includes('safe') || kitchenVal.includes('clean') || kitchenVal.includes('non-plastic')) {
        repairCount += 1;
        repairHighlights.push('Safe Plastic-Free Kitchen');
      }
    }

    // 6. Gastritis / Acidity / Dental / Refined Sugar
    const gutVal = getAnswer(['gut_health', 'gastritis', 'dental', 'damage_habits']).toLowerCase();
    if (gutVal) {
      if (gutVal.includes('gastritis') || gutVal.includes('acidity') || gutVal.includes('sugar') || gutVal.includes('junk') || gutVal.includes('discomfort') || gutVal.includes('sharp') || gutVal.includes('yes')) {
        damageCount += 1;
        damageHighlights.push('Gastric Acidity / Refined Food');
        damageActionHints.push('Avoid spicy, fried, or high-sugar foods to soothe your stomach lining.');
      } else if (gutVal.includes('none') || gutVal.includes('healthy') || gutVal.includes('clean') || gutVal.includes('no')) {
        repairCount += 1;
        repairHighlights.push('Healthy Gut & Oral Balance');
      }
    }

    // 7. Fasting (Circadian Repair)
    const fastingVal = getAnswer(['fasting', 'fasting_hours']).toLowerCase();
    if (fastingVal) {
      const numF = parseFloat(fastingVal);
      if (fastingVal.includes('yes') || fastingVal.includes('14') || fastingVal.includes('16') || fastingVal.includes('12') || fastingVal.includes('completed') || (!isNaN(numF) && numF >= 12)) {
        repairCount += 1;
        repairHighlights.push('Circadian Fasting (14h+)');
      } else {
        repairActionHints.push('Complete a 14-hour overnight fasting window to activate cellular autophagy.');
      }
    } else {
      repairActionHints.push('Target a 14-hour overnight fasting window to activate cellular autophagy.');
    }

    // 8. Movement / Physical Activity
    const movementVal = getAnswer(['movement', 'movement_mins', 'exercise']).toLowerCase();
    if (movementVal) {
      const numM = parseFloat(movementVal);
      if (movementVal.includes('yes') || movementVal.includes('walk') || movementVal.includes('run') || movementVal.includes('20') || movementVal.includes('30') || movementVal.includes('exercise') || (!isNaN(numM) && numM >= 20)) {
        repairCount += 1;
        repairHighlights.push('20+ Mins Aerobic Movement');
      } else {
        repairActionHints.push('Take a brisk 20-minute walk or light exercise session tomorrow.');
      }
    } else {
      repairActionHints.push('Take a brisk 20-minute walk or light exercise session tomorrow.');
    }

    // 9. Antioxidants & Phytonutrients
    const antioxVal = getAnswer(['antioxidants', 'repair_habits']).toLowerCase();
    if (antioxVal) {
      if (antioxVal.includes('yes') || antioxVal.includes('consumed') || antioxVal.includes('berries') || antioxVal.includes('vegetables') || antioxVal.includes('greens') || antioxVal.includes('turmeric')) {
        repairCount += 1;
        repairHighlights.push('Antioxidant Cellular Protection');
      } else {
        repairActionHints.push('Add antioxidant-rich berries, dark greens, or turmeric to your meals.');
      }
    } else {
      repairActionHints.push('Add antioxidant-rich berries, dark greens, or turmeric to your meals.');
    }

    // 10. Joy & Stillness / Breath
    const joyVal = getAnswer(['joy', 'stillness', 'loved', 'breath', 'breathing']).toLowerCase();
    if (joyVal) {
      if (joyVal.includes('yes') || joyVal.includes('done') || joyVal.includes('sat') || joyVal.includes('loved') || joyVal.includes('mindful') || joyVal.includes('breath') || joyVal.includes('box')) {
        repairCount += 1;
        repairHighlights.push('Power of Breath & Mindfulness');
      }
    }

    // Dynamic consolidated priority action hints based on user's real answers
    const finalPriorityHints: string[] = [];
    if (damageActionHints.length > 0) {
      finalPriorityHints.push(damageActionHints[0]);
    } else if (damageCount > 0) {
      finalPriorityHints.push('Focus on reducing daily stress and avoiding processed snacks.');
    } else {
      finalPriorityHints.push('Maintain your zero damage streak by protecting against toxic exposures.');
    }

    if (repairActionHints.length > 0) {
      finalPriorityHints.push(repairActionHints[0]);
    } else {
      finalPriorityHints.push('Keep boosting your repair defense with 14-hour intermittent fasting and exercise.');
    }

    return {
      damageScore: damageCount,
      repairScore: repairCount,
      netBalance: repairCount - damageCount,
      damageHighlights,
      repairHighlights,
      priorityActionHints: finalPriorityHints.slice(0, 2)
    };
  };

  const handleSaveReminder = async (time: string) => {
    if (!time) return;
    setReminderTime(time);
    setCustomTimeInput(time);
    setReminderEnabled(true);
    setReminderStatusMsg(`Reminder set for ${formatDisplayTime(time)}`);
    await scheduleDailyCheckinReminder(time);
    setTimeout(() => {
      setReminderStatusMsg('');
      setShowReminderSettings(false);
    }, 1200);
  };

  const handleCancelReminder = async () => {
    await cancelDailyCheckinReminder();
    setReminderEnabled(false);
    setReminderTime('');
    setReminderStatusMsg('Daily reminder turned off');
    setTimeout(() => {
      setReminderStatusMsg('');
      setShowReminderSettings(false);
    }, 1200);
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return 'Off';
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${h12}:${mStr} ${period}`;
  };

  const calcIndianAQI = (pm25: number): number => {
    if (pm25 <= 0) return 0;
    if (pm25 <= 30) return Math.round((50 / 30) * pm25);
    if (pm25 <= 60) return Math.round(50 + (50 / 30) * (pm25 - 30));
    if (pm25 <= 90) return Math.round(100 + (100 / 30) * (pm25 - 60));
    if (pm25 <= 120) return Math.round(200 + (100 / 30) * (pm25 - 90));
    if (pm25 <= 250) return Math.round(300 + (100 / 130) * (pm25 - 120));
    return Math.round(400 + (100 / 100) * (pm25 - 250));
  };

  const fetchAndCacheLiveAQI = async () => {
    try {
      const fetchByCoords = async (lat: number, lon: number, cityName: string, isFallback: boolean) => {
        try {
          const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10&forecast_days=1`);
          if (!res.ok) return;
          const data = await res.json();
          const pm25 = Number((data.current?.pm2_5 || 12).toFixed(1));
          const inAqi = calcIndianAQI(pm25);
          const status = inAqi <= 50 ? 'Good' : inAqi <= 100 ? 'Satisfactory' : inAqi <= 200 ? 'Moderate' : inAqi <= 300 ? 'Poor' : 'Severe';
          localStorage.setItem('mito_live_aqi', JSON.stringify({
            inAqi,
            pm25,
            cityName,
            status,
            isFallback,
            updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
        } catch {}
      };

      const loc = await getDeviceLocation();
      if (loc) {
        try {
          const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${loc.lat}&longitude=${loc.lon}&localityLanguage=en`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const place = geoData.locality || geoData.city || geoData.principalSubdivision || 'Your City';
            await fetchByCoords(loc.lat, loc.lon, place, false);
            return;
          }
        } catch {}
        await fetchByCoords(loc.lat, loc.lon, 'Your City', false);
      } else {
        await fetchByCoords(12.9716, 77.5946, 'Bangalore', true);
      }
    } catch (e) {
      console.warn('Chatbot AQI background fetch error:', e);
    }
  };

  const getLiveAQIInfoString = (): string => {
    try {
      const raw = localStorage.getItem('mito_live_aqi');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.inAqi != null) {
          const loc = parsed.cityName ? ` in ${parsed.cityName}` : '';
          const aqiLabel = language === 'ta' ? 'நேரலை காற்றின் தரம்' : language === 'hi' ? 'लाइव वायु गुणवत्ता' : language === 'kn' ? 'ಲೈವ್ ವಾಯು ಗುಣಮಟ್ಟ' : 'Live Air Quality';
          return `🌫️ ${aqiLabel}: AQI ${parsed.inAqi} (${parsed.status || 'Tracked'})${loc}. `;
        }
      }
    } catch (e) {}
    const defaultAqiLabel = language === 'ta' ? 'நேரலை காற்றின் தரம்' : language === 'hi' ? 'लाइव वायु गुणवत्ता' : language === 'kn' ? 'ಲೈವ್ ವಾಯು ಗುಣಮಟ್ಟ' : 'Live Air Quality';
    return `🌫️ ${defaultAqiLabel}: AQI 65. `;
  };

  const localizeStepTitle = (stepId?: string, fallbackTitle?: string): string => {
    if (!stepId) return fallbackTitle || '';
    const s = stepId.toLowerCase();
    const lang = (language || 'en') as 'en' | 'ta' | 'hi' | 'kn';

    const TITLES_MAP: Record<string, { en: string; ta: string; hi: string; kn: string }> = {
      stress: {
        en: 'Survivor Stress & Emotional Health',
        ta: 'உயிர் பிழைத்தோர் மனநல பரிசோதனை',
        hi: 'सर्वाइवर तनाव एवं भावनात्मक स्वास्थ्य',
        kn: 'ಸರ್ವೈವರ್ ಒತ್ತಡ ಮತ್ತು ಭಾವನಾತ್ಮಕ ಆರೋಗ್ಯ'
      },
      caregiver_stress: {
        en: 'Caregiver Stress Check',
        ta: 'பராமரிப்பாளர் மன அழுத்த சோதனை',
        hi: 'देखभालकर्ता तनाव जांच',
        kn: 'ಆರೈಕೆದಾರರ ಒತ್ತಡ ತಪಾಸಣೆ'
      },
      sleep: {
        en: 'Sleep Duration & Quality',
        ta: 'தூக்கத்தின் அளவு & தரம்',
        hi: 'नींद की अवधि और गुणवत्ता',
        kn: 'ನಿದ್ರೆಯ ಅವಧಿ ಮತ್ತು ಗುಣಮಟ್ಟ'
      },
      fasting: {
        en: 'Circadian Fasting Window',
        ta: 'சர்க்காடியன் விரத நேரம்',
        hi: 'सर्कैडियन उपवास विंडो',
        kn: 'ಸರ್ಕಾಡಿಯನ್ ಉಪವಾಸದ ಸಮಯ'
      },
      movement: {
        en: 'Exercise & Movement',
        ta: 'உடற்பயிற்சி மற்றும் இயக்கம்',
        hi: 'व्यायाम और शारीरिक गतिविधि',
        kn: 'ವ್ಯಾಯಾಮ ಮತ್ತು ಚಲನೆ'
      },
      stillness: {
        en: 'Stillness & Meditation',
        ta: 'அமைதி மற்றும் தியானம்',
        hi: 'शांति और ध्यान',
        kn: 'ಶಾಂತಿ ಮತ್ತು ಧ್ಯಾನ'
      },
      joy: {
        en: 'Things You Love & Joy',
        ta: 'மகிழ்ச்சி மற்றும் பிடித்த செயல்பாடுகள்',
        hi: 'पसंदीदा चीजें और खुशी',
        kn: 'ನಿಮಗೆ ಇಷ್ಟವಾದವುಗಳು ಮತ್ತು ಸಂತೋಷ'
      },
      smoking: {
        en: 'Smoking & Chewing Tobacco',
        ta: 'புகைபிடித்தல் & புகையிலை பயன்பாடு',
        hi: 'धूम्रपान और तंबाकू का सेवन',
        kn: 'ಧೂಮಪಾನ ಮತ್ತು ತಂಬಾಕು ಬಳಕೆ'
      },
      alcohol: {
        en: 'Alcohol Intake Check',
        ta: 'மதுபான உட்கொள்ளல் பரிசோதனை',
        hi: 'शराब सेवन जांच',
        kn: 'ಮದ್ಯಪಾನ ಸೇವನೆ ಪರಿಶೀಲನೆ'
      },
      antioxidants: {
        en: 'Antioxidants & Repair Foods',
        ta: 'ஆன்டிஆக்ஸிடன்ட்கள் & பழுதுபார்க்கும் உணவுகள்',
        hi: 'एंटीऑक्सीडेंट और उपचार खाद्य पदार्थ',
        kn: 'ಆಂಟಿಆಕ್ಸಿಡೆಂಟ್‌ಗಳು ಮತ್ತು ಚೇತರಿಕೆ ಆಹಾರಗಳು'
      },
      repair_habits: {
        en: 'Antioxidant & Repair Nutrition',
        ta: 'ஆன்டிஆக்ஸிடன்ட் & பழுதுபார்க்கும் ஊட்டச்சத்து',
        hi: 'एंटीऑक्सीडेंट और उपचार पोषण',
        kn: 'ಆಂಟಿಆಕ್ಸಿಡೆಂಟ್ ಮತ್ತು ದುರಸ್ತಿ ಪೋಷಣೆ'
      },
      env_air: {
        en: 'Air Pollution & Passive Smoke',
        ta: 'காற்று மாசுபாடு & புகை வெளிப்பாடு',
        hi: 'वायु प्रदूषण और निष्क्रिय धुआं',
        kn: 'ವಾಯು ಮಾಲಿನ್ಯ ಮತ್ತು ಧೂಮಪಾನದ ಹೊಗೆ'
      },
      env_water: {
        en: 'Water Carcinogens Check',
        ta: 'குடிநீர் பாதுகாப்பு பரிசோதனை',
        hi: 'पीने के पानी की सुरक्षा जांच',
        kn: 'ಕುಡಿಯುವ ನೀರಿನ ಸುರಕ್ಷತೆ ಪರಿಶೀಲನೆ'
      },
      env_pesticides: {
        en: 'Pesticides Exposure',
        ta: 'பூச்சிக்கொல்லி ரசாயன வெளிப்பாடு',
        hi: 'कीटनाशक रसायन जोखिम',
        kn: 'ಕೀಟನಾಶಕ ರಾಸಾಯನಿಕಗಳ ಒಡ್ಡಿಕೆ'
      },
      env_microplastics: {
        en: 'Microplastics Exposure',
        ta: 'மைக்ரோபிளாஸ்டிக் நச்சு வெளிப்பாடு',
        hi: 'माइक्रोप्लास्टिक जोखिम',
        kn: 'ಮೈಕ್ರೋಪ್ಲಾಸ್ಟಿಕ್ ಒಡ್ಡಿಕೆ'
      },
      gut_health: {
        en: 'Gut & Oral Health Check',
        ta: 'குடல் & வாய்வழி ஆரோக்கியம்',
        hi: 'आंत और मौखिक स्वास्थ्य जांच',
        kn: 'ಕರಳು ಮತ್ತು ಬಾಯಿಯ ಆರೋಗ್ಯ ತಪಾಸಣೆ'
      },
      genetics: {
        en: 'Family History of Cancer',
        ta: 'குடும்ப புற்றுநோய் வரலாறு',
        hi: 'कैंसर का पारिवारिक इतिहास',
        kn: 'ಕ್ಯಾನ್ಸರ್‌ನ ಕುಟುಂಬ ಇತಿಹಾಸ'
      },
      screening: {
        en: 'Screening & Follow-up Compliance',
        ta: 'புற்றுநோய் பரிசோதனை & பின்தொடர்தல்',
        hi: 'स्क्रीनिंग और फॉलो-अप अनुपालन',
        kn: 'ಸ್ಕ್ರೀನಿಂಗ್ ಮತ್ತು ಫಾಲೋ-ಅಪ್ ಅನುಸರಣೆ'
      },
      kitchen: {
        en: 'Check Your Kitchen Audit',
        ta: 'சமையலறை நச்சு தணிக்கை',
        hi: 'रसोईघर विषैले पदार्थ जांच',
        kn: 'ಅಡುಗೆಮನೆ ವಿಷಕಾರಿ ಪರಿಶೀಲನೆ'
      },
      env_kitchen: {
        en: 'Check Your Kitchen Audit',
        ta: 'சமையலறை நச்சு தணிக்கை',
        hi: 'रसोईघर विषैले पदार्थ जांच',
        kn: 'ಅಡುಗೆಮನೆ ವಿಷಕಾರಿ ಪರಿಶೀಲನೆ'
      },
      substances: {
        en: 'Chemicals & Toxic Substances',
        ta: 'வேதியியல் மற்றும் நச்சுப் பொருட்கள்',
        hi: 'रासायनिक और विषैले पदार्थ',
        kn: 'ರಾಸಾಯನಿಕ ಮತ್ತು ವಿಷಕಾರಿ ಪದಾರ್ಥಗಳು'
      },
      report_upload: {
        en: 'Upload Lab or CGM Report',
        ta: 'மருத்துவ பரிசோதனை அறிக்கை பதிவேற்றம்',
        hi: 'लैब या सीजीएम रिपोर्ट अपलोड',
        kn: 'ಲ್ಯಾಬ್ ಅಥವಾ ಸಿಜಿಎಂ ವರದಿ ಅಪ್‌ಲೋಡ್'
      },
      found_exercise: {
        en: 'Daily Movement',
        ta: 'தினசரி இயக்கம் & உடற்பயிற்சி',
        hi: 'दैनिक व्यायाम',
        kn: 'ದೈನಂದಿನ ಚಲನೆ'
      },
      found_sleep: {
        en: 'Restorative Sleep',
        ta: 'ஆழ்ந்த புத்துணர்ச்சி தூக்கம்',
        hi: 'आरामदायक नींद',
        kn: 'ಆಳವಾದ ನಿದ್ರೆ'
      },
      found_diet: {
        en: 'Whole-Food Diet',
        ta: 'இயற்கை முழு உணவு',
        hi: 'संतुलित आहार',
        kn: 'ಸಂಪೂರ್ಣ ಆಹಾರ'
      },
      found_fasting: {
        en: 'Fasting Window',
        ta: 'விரத நேரம்',
        hi: 'उपवास विंडो',
        kn: 'ಉಪವಾಸದ ಸಮಯ'
      },
      found_antioxidants: {
        en: 'Antioxidant Foods',
        ta: 'ஆன்டிஆக்ஸிடன்ட் உணவுகள்',
        hi: 'एंटीऑक्सीडेंट खाद्य',
        kn: 'ಆಂಟಿಆಕ್ಸಿಡೆಂಟ್ ಆಹಾರಗಳು'
      },
      found_stress: {
        en: 'Stress Level',
        ta: 'மன அழுத்த நிலை',
        hi: 'तनाव का स्तर',
        kn: 'ಒತ್ತಡದ ಮಟ್ಟ'
      }
    };

    for (const key in TITLES_MAP) {
      if (s === key || s.includes(key) || key.includes(s)) {
        return TITLES_MAP[key][lang] || TITLES_MAP[key].en;
      }
    }
    return fallbackTitle || stepId;
  };

  const localizeStepQuestion = (stepId?: string, fallbackPrompt?: string): string => {
    if (!stepId) return fallbackPrompt || '';
    const s = stepId.toLowerCase();
    const lang = (language || 'en') as 'en' | 'ta' | 'hi' | 'kn';

    const QUESTIONS_MAP: Record<string, { en: string; ta: string; hi: string; kn: string }> = {
      stress: {
        en: 'How is your emotional wellbeing today? Post-cancer anxiety, fear of recurrence, or caregiver stress?',
        ta: 'இன்று உங்கள் மனநிலை மற்றும் உணர்ச்சி நல்வாழ்வு எவ்வாறு உள்ளது? புற்றுநோய் பயம், மறுநிகழ்வு பற்றிய கவலை அல்லது பராமரிப்பாளர் அழுத்தமா?',
        hi: 'आज आपकी भावनात्मक स्थिति कैसी है? कैंसर के बाद की चिंता, दोबारा होने का डर या देखभालकर्ता का तनाव?',
        kn: 'ಇಂದು ನಿಮ್ಮ ಭಾವನಾತ್ಮಕ ಆರೋಗ್ಯ ಹೇಗಿದೆ? ಕ್ಯಾನ್ಸರ್ ನಂತರದ ಆತಂಕ, ಮರುಕಳಿಸುವ ಭಯ ಅಥವಾ ಆರೈಕೆದಾರರ ಒತ್ತಡವೇ?'
      },
      caregiver_stress: {
        en: 'How was your emotional wellbeing today? Post-cancer anxiety, fear of recurrence, or caregiver stress?',
        ta: 'இன்று உங்கள் மனநிலை மற்றும் உணர்ச்சி நல்வாழ்வு எவ்வாறு உள்ளது? புற்றுநோய் பயம், மறுநிகழ்வு பற்றிய கவலை அல்லது பராமரிப்பாளர் அழுத்தமா?',
        hi: 'आज आपकी भावनात्मक स्थिति कैसी है? कैंसर के बाद की चिंता, दोबारा होने का डर या देखभालकर्ता का तनाव?',
        kn: 'ಇಂದು ನಿಮ್ಮ ಭಾವನಾತ್ಮಕ ಆರೋಗ್ಯ ಹೇಗಿದೆ? ಕ್ಯಾನ್ಸರ್ ನಂತರದ ಆತಂಕ, ಮರುಕಳಿಸುವ ಭಯ ಅಥವಾ ಆರೈಕೆದಾರರ ಒತ್ತಡವೇ?'
      },
      sleep: {
        en: 'How many hours of quality, restorative sleep did you get last night?',
        ta: 'நேற்றிரவு எத்தனை மணிநேரம் ஆழ்ந்த, புத்துணர்ச்சியூட்டும் தூக்கம் பெற்றீர்கள்? (எண் உள்ளிடவும், எ.கா: 7.5)',
        hi: 'कल रात आपने कितने घंटे की अच्छी और आरामदायक नींद ली? (संख्या दर्ज करें, उदा. 7.5)',
        kn: 'ನಿನ್ನೆ ರಾತ್ರಿ ನೀವು ಎಷ್ಟು ಗಂಟೆಗಳ ಕಾಲ ಆಳವಾದ ವಿಶ್ರಾಂತಿದಾಯಕ ನಿದ್ರೆ ಪಡೆದಿದ್ದೀರಿ? (ಸಂಖ್ಯೆ ನಮೂದಿಸಿ, ಉದಾ: 7.5)'
      },
      fasting: {
        en: 'Did you complete your intermittent circadian fasting window today?',
        ta: 'இன்று உங்கள் சர்க்காடியன் இடைப்பட்ட விரத காலத்தை முடித்தீர்களா?',
        hi: 'क्या आपने आज अपना आंतरायिक सर्कैडियन उपवास पूरा किया?',
        kn: 'ಇಂದು ನಿಮ್ಮ ಸರ್ಕಾಡಿಯನ್ ಮಧ್ಯಂತರ ಉಪವಾಸದ ಸಮಯವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಾ?'
      },
      movement: {
        en: 'What physical activity or movement did you complete today?',
        ta: 'இன்று நீங்கள் என்ன உடற்பயிற்சி அல்லது உடல் இயக்கத்தை முடித்தீர்கள்?',
        hi: 'आज आपने क्या शारीरिक गतिविधि या व्यायाम पूरा किया?',
        kn: 'ಇಂದು ನೀವು ಯಾವ ದೈಹಿಕ ಚಟುವಟಿಕೆ ಅಥವಾ ವ್ಯಾಯಾಮವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಿ?'
      },
      stillness: {
        en: 'Did you practice stillness, quiet meditation, or deep breathing for at least 10 minutes today?',
        ta: 'இன்று குறைந்தது 10 நிமிடங்கள் அமைதியான தியானம் அல்லது ஆழ்ந்த மூச்சுப் பயிற்சி செய்தீர்களா?',
        hi: 'क्या आपने आज कम से कम 10 मिनट शांति, ध्यान या गहरी सांस लेने का अभ्यास किया?',
        kn: 'ಇಂದು ಕನಿಷ್ಠ 10 ನಿಮಿಷಗಳ ಕಾಲ ಶಾಂತತೆ, ಧ್ಯಾನ ಅಥವಾ ಆಳವಾದ ಉಸಿರಾಟವನ್ನು ಅಭ್ಯಾಸ ಮಾಡಿದ್ದೀರಾ?'
      },
      joy: {
        en: 'Did you spend time doing something you love today (hobbies, music, family, art, gratitude)?',
        ta: 'இன்று உங்களுக்குப் பிடித்த காரியங்களைச் செய்ய நேரம் ஒதுக்கினீர்களா (விருப்பங்கள், இசை, குடும்பம், கலை)?',
        hi: 'क्या आपने आज अपनी पसंद की किसी चीज़ (शौक, संगीत, परिवार, कला, आभार) के लिए समय निकाला?',
        kn: 'ಇಂದು ನಿಮಗೆ ಇಷ್ಟವಾದ ಕೆಲಸಗಳನ್ನು ಮಾಡಲು ಸಮಯ ಕಳೆದಿದ್ದೀರಾ (ಹವ್ಯಾಸಗಳು, ಸಂಗೀತ, ಕುಟುಂಬ, ಕಲೆ)?'
      },
      smoking: {
        en: 'Did you smoke cigarettes/bidis or chew tobacco (gutkha, khaini, paan with tobacco) today?',
        ta: 'இன்று நீங்கள் சிகரெட்/பீடி பிடித்தீர்களா அல்லது புகையிலை (குட்கா, கைனி, பான்) மென்றீர்களா?',
        hi: 'क्या आपने आज सिगरेट/बीड़ी पी या तंबाकू (गुटखा, खैनी, पान) चबाया?',
        kn: 'ಇಂದು ನೀವು ಸಿಗರೇಟ್/ಬೀಡಿ ಸೇದಿದ್ದೀರಾ ಅಥವಾ ತಂಬಾಕು (ಗುಟ್ಕಾ, ಖೈನಿ, ಪಾನ್) ಅಗಿದಿದ್ದೀರಾ?'
      },
      alcohol: {
        en: 'Did you consume any alcoholic beverages today?',
        ta: 'இன்று நீங்கள் ஏதேனும் மது அருந்தினீர்களா?',
        hi: 'क्या आपने आज किसी भी प्रकार की शराब का सेवन किया?',
        kn: 'ಇಂದು ನೀವು ಯಾವುದೇ ಆಲ್ಕೊಹಾಲ್ಯುಕ್ತ ಪಾನೀಯವನ್ನು ಸೇವಿಸಿದ್ದೀರಾ?'
      },
      antioxidants: {
        en: 'Did you consume antioxidant-rich foods (berries, greens, amla, turmeric) or repair supplements today?',
        ta: 'இன்று ஆன்டிஆக்ஸிடன்ட் நிறைந்த உணவுகள் (நெல்லிக்காய், மஞ்சள், கீரைகள், பெர்ரி) அல்லது சத்து மருந்துகளை உட்கொண்டீர்களா?',
        hi: 'क्या आपने आज एंटीऑक्सीडेंट युक्त खाद्य पदार्थ (आंवला, हल्दी, हरी सब्जियां, बेरीज) या पूरक आहार लिए?',
        kn: 'ಇಂದು ನೀವು ಆಂಟಿಆಕ್ಸಿಡೆಂಟ್ ಸಮೃದ್ಧ ಆಹಾರಗಳು (ನೆಲ್ಲಿಕಾಯಿ, ಅರಿಶಿನ, ಸೊಪ್ಪು, ಬೆರ್ರಿಗಳು) ಅಥವಾ ಪೂರಕಗಳನ್ನು ಸೇವಿಸಿದ್ದೀರಾ?'
      },
      repair_habits: {
        en: 'Did you include anti-cancer repair foods today (cruciferous vegetables, berries, turmeric, omega-3s)?',
        ta: 'இன்று புற்றுநோய் எதிர்ப்பு உணவுகள் (முட்டைக்கோஸ் குடும்ப காய்கறிகள், பெர்ரி, மஞ்சள், ஒமேகா-3) சேர்த்துக் கொண்டீர்களா?',
        hi: 'क्या आपने आज कैंसर-रोधी आहार (हरी सब्जियां, बेरीज, हल्दी, ओमेगा-3) शामिल किया?',
        kn: 'ಇಂದು ನೀವು ಕ್ಯಾನ್ಸರ್ ವಿರೋಧಿ ಪುನಶ್ಚೇತನ ಆಹಾರಗಳನ್ನು (ತರಕಾರಿಗಳು, ಬೆರ್ರಿಗಳು, ಅರಿಶಿನ, ಒಮೆಗಾ-3) ಸೇವಿಸಿದ್ದೀರಾ?'
      },
      env_air: {
        en: 'Did you commute in heavy traffic (>30 min), encounter passive smoking, or experience indoor smoke/incense exposure today?',
        ta: 'இன்று அதிக போக்குவரத்து புகை (>30 நிமிடம்), பிறர் புகைபிடித்தலின் புகை, அல்லது வீட்டினுள் தூப/சாம்பிராணி புகையை எதிர்கொண்டீர்களா?',
        hi: 'क्या आज आपको भारी ट्रैफिक (>30 मिनट), दूसरों के धूम्रपान के धुएं या घर के अंदर धुएं/अगरबत्ती का सामना करना पड़ा?',
        kn: 'ಇಂದು ನೀವು ಭಾರೀ ಸಂಚಾರದಲ್ಲಿ (>30 ನಿಮಿಷ), ಇತರರ ಧೂಮಪಾನದ ಹೊಗೆ ಅಥವಾ ಒಳಾಂಗಣ ಹೊಗೆ/ಧೂಪದ್ರವ್ಯಕ್ಕೆ ಒಳಗಾಗಿದ್ದೀರಾ?'
      },
      env_water: {
        en: 'Do you use safe filtered drinking water (RO / carbon filtered, free of heavy metals, chlorine byproducts, and PFAS)?',
        ta: 'நீங்கள் பாதுகாப்பான வடிகட்டப்பட்ட குடிநீரைப் பயன்படுத்துகிறீர்களா (RO / கார்பன் வடிகட்டி, கன உலோகங்கள் அற்றது)?',
        hi: 'क्या आप सुरक्षित फिल्टर किए गए पीने के पानी (RO / कार्बन फिल्टर, भारी धातुओं से मुक्त) का उपयोग करते हैं?',
        kn: 'ನೀವು ಸುರಕ್ಷಿತ ಫಿಲ್ಟರ್ ಮಾಡಿದ ಕುಡಿಯುವ ನೀರನ್ನು (RO / ಕಾರ್ಬನ್ ಫಿಲ್ಟರ್, ಭಾರ ಲೋಹಗಳಿಂದ ಮುಕ್ತ) ಬಳಸುತ್ತೀರಾ?'
      },
      env_pesticides: {
        en: 'Did you consume unwashed non-organic high-pesticide produce or use chemical bug sprays today?',
        ta: 'இன்று நீங்கள் பூச்சிக்கொல்லி தெளிக்கப்பட்ட காய்கறிகள்/பழங்களை உட்கொண்டீர்களா அல்லது கொசு/பூச்சி மருந்துகளைப் பயன்படுத்தினீர்களா?',
        hi: 'क्या आपने आज बिना धुले कीटनाशक युक्त फल/सब्जियां खाईं या रासायनिक स्प्रे का उपयोग किया?',
        kn: 'ಇಂದು ನೀವು ತೊಳೆಯದ ಕೀಟನಾಶಕಯುಕ್ತ ತರಕಾರಿ/ಹಣ್ಣುಗಳನ್ನು ಸೇವಿಸಿದ್ದೀರಾ ಅಥವಾ ರಾಸಾಯನಿಕ ಸಿಂಪಡಣೆಗಳನ್ನು ಬಳಸಿದ್ದೀರಾ?'
      },
      env_microplastics: {
        en: 'Did you drink from heated plastic bottles, microwave food in plastic containers, or drink hot beverages from paper/plastic cups today?',
        ta: 'இன்று சூடான பிளாஸ்டிக் பாட்டிலில் குடித்தீர்களா, பிளாஸ்டிக்கில் உணவை சூடாக்கினீர்களா அல்லது பிளாஸ்டிக்/காகித கப்பில் சூடான பானம் அருந்தினீர்களா?',
        hi: 'क्या आपने आज गर्म प्लास्टिक की बोतलों से पानी पिया, प्लास्टिक में खाना गर्म किया या पेपर/प्लास्टिक कप में गर्म पेय पिया?',
        kn: 'ಇಂದು ನೀವು ಬಿಸಿಯಾದ ಪ್ಲಾಸ್ಟಿಕ್ ಬಾಟಲಿಗಳಿಂದ ಕುಡಿದಿದ್ದೀರಾ, ಪ್ಲಾಸ್ಟಿಕ್‌ನಲ್ಲಿ ಆಹಾರ ಬಿಸಿಮಾಡಿದ್ದೀರಾ ಅಥವಾ ಪ್ಲಾಸ್ಟಿಕ್ ಕಪ್‌ಗಳಲ್ಲಿ ಬಿಸಿ ಪಾನೀಯ ಸೇವಿಸಿದ್ದೀರಾ?'
      },
      gut_health: {
        en: 'Did you experience acidity/gastritis or oral/dental discomfort today?',
        ta: 'இன்று உங்களுக்கு அசிடிட்டி/வயிற்று எரிச்சல் அல்லது வாய்/பல் வலி அசௌகரியம் ஏற்பட்டதா?',
        hi: 'क्या आपको आज एसिडिटी/पेट में जलन या मुंह/दांतों में कोई परेशानी महसूस हुई?',
        kn: 'ಇಂದು ನಿಮಗೆ ಅಸಿಡಿಟಿ/ಹೊಟ್ಟೆ ಉರಿ ಅಥವಾ ಬಾಯಿ/ಹಲ್ಲು ನೋವು ಉಂಟಾಗಿದೆಯೇ?'
      },
      genetics: {
        en: 'Do you have anybody in your family with cancer, or a self-diagnosis of cancer?',
        ta: 'உங்கள் குடும்பத்தில் யாருக்காவது புற்றுநோய் வரலாறு உள்ளதா அல்லது உங்களுக்கு புற்றுநோய் கண்டறியப்பட்டுள்ளதா?',
        hi: 'क्या आपके परिवार में किसी को कैंसर का इतिहास है, या आपका खुद का कैंसर निदान हुआ है?',
        kn: 'ನಿಮ್ಮ ಕುಟುಂಬದಲ್ಲಿ ಯಾರಿಗಾದರೂ ಕ್ಯಾನ್ಸರ್ ಇತಿಹಾಸವಿದೆಯೇ ಅಥವಾ ನಿಮಗೆ ಕ್ಯಾನ್ಸರ್ ಇರುವುದು ಪತ್ತೆಯಾಗಿದೆಯೇ?'
      },
      screening: {
        en: 'Did you have any follow-up appointment, imaging, or blood work today? Are your next screenings scheduled?',
        ta: 'இன்று மருத்துவ பரிசோதனை/ஸ்கேன் ஏதேனும் செய்தீர்களா? உங்கள் அடுத்த பரிசோதனை திட்டமிடப்பட்டுள்ளதா?',
        hi: 'क्या आज आपका कोई फॉलो-अप, स्कैन या ब्लड टेस्ट हुआ? क्या आपकी अगली स्क्रीनिंग निर्धारित है?',
        kn: 'ಇಂದು ನೀವು ಯಾವುದೇ ಫಾಲೋ-ಅಪ್ ತಪಾಸಣೆ, ಸ್ಕ್ಯಾನ್ ಅಥವಾ ರಕ್ತ ಪರೀಕ್ಷೆ ಮಾಡಿಸಿಕೊಂಡಿದ್ದೀರಾ? ನಿಮ್ಮ ಮುಂದಿನ ಸ್ಕ್ರೀನಿಂಗ್ ನಿಗದಿಯಾಗಿದೆಯೇ?'
      }
    };

    for (const key in QUESTIONS_MAP) {
      if (s === key || s.includes(key) || key.includes(s)) {
        return QUESTIONS_MAP[key][lang] || QUESTIONS_MAP[key].en;
      }
    }
    return fallbackPrompt || '';
  };

  const localizeOptionText = (opt: string): string => {
    if (!opt) return opt;
    const lower = opt.toLowerCase().trim();
    const lang = (language || 'en') as 'en' | 'ta' | 'hi' | 'kn';

    if (lang === 'en') return opt;

    // Direct basic options
    if (lower === 'yes') return lang === 'ta' ? 'ஆம்' : lang === 'hi' ? 'हाँ' : 'ಹೌದು';
    if (lower === 'no') return lang === 'ta' ? 'இல்லை' : lang === 'hi' ? 'नहीं' : 'ಇಲ್ಲ';
    if (lower === 'skip' || lower === 'skipped') return lang === 'ta' ? 'தவிர்' : lang === 'hi' ? 'छोड़ें' : 'ಬಿಟ್ಟುಬಿಡಿ';

    // Stress & Emotional Options
    if (lower.includes('no stress') || lower.includes('calm')) {
      return lang === 'ta' ? 'அமைதி / அழுத்தம் இல்லை' : lang === 'hi' ? 'शांत / कोई तनाव नहीं' : 'ಶಾಂತ / ಯಾವುದೇ ಒತ್ತಡವಿಲ್ಲ';
    }
    if (lower.includes('mild anxiety') || lower.includes('mild stress')) {
      return lang === 'ta' ? 'லேசான கவலை / அழுத்தம்' : lang === 'hi' ? 'हल्की चिंता / तनाव' : 'ಸೌಮ್ಯ ಆತಂಕ / ಒತ್ತಡ';
    }
    if (lower.includes('fear of recurrence') || lower.includes('recurrence')) {
      return lang === 'ta' ? 'மறுநிகழ்வு பயம்' : lang === 'hi' ? 'दोबारा होने का डर' : 'ಮರುಕಳಿಸುವ ಭಯ';
    }
    if (lower.includes('caregiver stress')) {
      return lang === 'ta' ? 'பராமரிப்பாளர் மன அழுத்தம்' : lang === 'hi' ? 'देखभालकर्ता का तनाव' : 'ಆರೈಕೆದಾರರ ಒತ್ತಡ';
    }
    if (lower.includes('emotionally drained') || lower.includes('drained')) {
      return lang === 'ta' ? 'உணர்ச்சி ரீதியாக சோர்வு' : lang === 'hi' ? 'भावनात्मक रूप से थकावट' : 'ಭಾವನಾತ್ಮಕವಾಗಿ ದಣಿದಿದೆ';
    }
    if (lower.includes('moderate stress')) {
      return lang === 'ta' ? 'மிதமான அழுத்தம்' : lang === 'hi' ? 'मध्यम तनाव' : 'ಮಧ್ಯಮ ಒತ್ತಡ';
    }
    if (lower.includes('high stress')) {
      return lang === 'ta' ? 'அதிக அழுத்தம்' : lang === 'hi' ? 'अत्यधिक तनाव' : 'ಹೆಚ್ಚಿನ ಒತ್ತಡ';
    }

    // Fasting Options
    if (lower.includes('16+ hrs') || lower.includes('16+ hours')) {
      return lang === 'ta' ? 'ஆம் (16+ மணி நேரம்)' : lang === 'hi' ? 'हाँ (16+ घंटे)' : 'ಹೌದು (16+ ಗಂಟೆ)';
    }
    if (lower.includes('12-16 hrs') || lower.includes('12-16 hours')) {
      return lang === 'ta' ? 'ஆம் (12-16 மணி நேரம்)' : lang === 'hi' ? 'हाँ (12-16 घंटे)' : 'ಹೌದು (12-16 ಗಂಟೆ)';
    }
    if (lower.includes('partial') || lower.includes('<12 hrs') || lower.includes('<12 hours')) {
      return lang === 'ta' ? 'பகுதி (<12 மணி நேரம்)' : lang === 'hi' ? 'आंशिक (<12 घंटे)' : 'ಭಾಗಶಃ (<12 ಗಂಟೆ)';
    }
    if (lower.includes('skipped') || lower.includes('no fasting')) {
      return lang === 'ta' ? 'இல்லை (தவிர்க்கப்பட்டது)' : lang === 'hi' ? 'नहीं (छोड़ दिया)' : 'ಇಲ್ಲ (ಬಿಡಲಾಗಿದೆ)';
    }

    // Movement Options
    if (lower.includes('30+ min walk') || lower.includes('walk / run') || lower.includes('walk / jog') || lower.includes('walking')) {
      return lang === 'ta' ? '30+ நிமிடம் நடை / ஓட்டம்' : lang === 'hi' ? '30+ मिनट वॉक / दौड़' : '30+ ನಿಮಿಷ ನಡಿಗೆ / ಓಟ';
    }
    if (lower.includes('yoga') || lower.includes('tai chi') || lower.includes('stretching')) {
      return lang === 'ta' ? 'யோகா / நீட்சிப் பயிற்சி' : lang === 'hi' ? 'योग / स्ट्रेचिंग' : 'ಯೋಗ / ಸ್ಟ್ರೆಚಿಂಗ್';
    }
    if (lower.includes('strength training') || lower.includes('weights') || lower.includes('gym')) {
      return lang === 'ta' ? 'வலிமை உடற்பயிற்சி' : lang === 'hi' ? 'स्ट्रेंथ ट्रेनिंग' : 'ಸ್ಟ್ರೆಂತ್ ಟ್ರೈನಿಂಗ್';
    }
    if (lower.includes('swimming') || lower.includes('cycling')) {
      return lang === 'ta' ? 'நீச்சல் / சைக்கிள்' : lang === 'hi' ? 'तैराकी / साइकिलिंग' : 'ಈಜು / ಸೈಕ್ಲಿಂಗ್';
    }
    if (lower.includes('light activity') || lower.includes('light stretching') || lower.includes('gentle')) {
      return lang === 'ta' ? 'லேசான உடற்பயிற்சி (<20 நிமிடம்)' : lang === 'hi' ? 'हल्की गतिविधि' : 'ಲಘು ಚಟುವಟಿಕೆ';
    }
    if (lower.includes('no movement') || lower.includes('rest day') || lower.includes('no exercise')) {
      return lang === 'ta' ? 'இன்று உடற்பயிற்சி இல்லை / ஓய்வு' : lang === 'hi' ? 'आज विश्राम / कोई व्यायाम नहीं' : 'ಇಂದು ವಿಶ್ರಾಂತಿ / ಯಾವುದೇ ಚಲನೆ ಇಲ್ಲ';
    }

    // Stillness & Joy Options
    if (lower.includes('10+ min') || lower.includes('practiced') || lower.includes('meditation')) {
      return lang === 'ta' ? 'ஆம் (10+ நிமிடம் தியானம்)' : lang === 'hi' ? 'हाँ (10+ मिनट ध्यान)' : 'ಹೌದು (10+ ನಿಮಿಷ ಧ್ಯಾನ)';
    }
    if (lower.includes('yes (done)') || lower.includes('completed')) {
      return lang === 'ta' ? 'ஆம் (செய்தேன்)' : lang === 'hi' ? 'हाँ (किया)' : 'ಹೌದು (ಮಾಡಿದ್ದೇನೆ)';
    }
    if (lower.includes('not today') || lower.includes('no, did not')) {
      return lang === 'ta' ? 'இன்று இல்லை' : lang === 'hi' ? 'आज नहीं' : 'ಇಂದಲ್ಲ';
    }

    // Smoking / Tobacco / Alcohol
    if (lower.includes('no (clean day)') || lower.includes('no alcohol') || lower.includes('no smoking') || lower.includes('clean day')) {
      return lang === 'ta' ? 'இல்லை (சுத்தமான நாள்)' : lang === 'hi' ? 'नहीं (स्वच्छ दिन)' : 'ಇಲ್ಲ (ಸ್ವಚ್ಛ ದಿನ)';
    }
    if (lower.includes('smoked') || lower.includes('chewed tobacco') || lower.includes('tobacco')) {
      return lang === 'ta' ? 'ஆம் (புகை/புகையிலை உட்கொள்ளப்பட்டது)' : lang === 'hi' ? 'हाँ (धूम्रपान / तंबाकू लिया)' : 'ಹೌದು (ಧೂಮಪಾನ / ತಂಬಾಕು)';
    }
    if (lower.includes('1-2 drinks') || lower.includes('1-2')) {
      return lang === 'ta' ? '1-2 பானங்கள்' : lang === 'hi' ? '1-2 ड्रिंक्स' : '1-2 ಪಾನೀಯಗಳು';
    }
    if (lower.includes('3+ drinks') || lower.includes('3+')) {
      return lang === 'ta' ? '3+ பானங்கள் (அதிகம்)' : lang === 'hi' ? '3+ ड्रिंक्स (अधिक)' : '3+ ಪಾನೀಯಗಳು (ಹೆಚ್ಚು)';
    }

    // Nutrition & Environment
    if (lower.includes('consumed') || lower.includes('anti-cancer meal') || lower.includes('whole-food') || lower.includes('healthy food')) {
      return lang === 'ta' ? 'ஆம் (ஆரோக்கிய உணவு)' : lang === 'hi' ? 'हाँ (स्वस्थ आहार)' : 'ಹೌದು (ಆರೋಗ್ಯಕರ ಆಹಾರ)';
    }
    if (lower.includes('clean air') || lower.includes('fresh air')) {
      return lang === 'ta' ? 'இல்லை (சுத்தமான காற்று)' : lang === 'hi' ? 'नहीं (स्वच्छ हवा)' : 'ಇಲ್ಲ (ಸ್ವಚ್ಛ ಗಾಳಿ)';
    }
    if (lower.includes('smog') || lower.includes('passive smoke') || lower.includes('air pollution')) {
      return lang === 'ta' ? 'ஆம் (புகை / காற்று மாசுபாடு)' : lang === 'hi' ? 'हाँ (धुआं / प्रदूषण)' : 'ಹೌದು (ಹೊಗೆ / ಮಾಲಿನ್ಯ)';
    }
    if (lower.includes('safe filtered') || lower.includes('filtered water')) {
      return lang === 'ta' ? 'ஆம் (வடிகட்டிய பாதுகாப்பான நீர்)' : lang === 'hi' ? 'हाँ (सुरक्षित फिल्टर पानी)' : 'ಹೌದು (சுರಕ್ಷಿತ ಫಿಲ್ಟರ್ ನೀರು)';
    }
    if (lower.includes('unfiltered tap') || lower.includes('tap water')) {
      return lang === 'ta' ? 'இல்லை / வடிகட்டாத நீர்' : lang === 'hi' ? 'नहीं / बिना फिल्टर नल' : 'ಇಲ್ಲ / ಫಿಲ್ಟರ್ ಮಾಡದ ನೀರು';
    }
    if (lower.includes('clean / organic') || lower.includes('organic')) {
      return lang === 'ta' ? 'இல்லை (இயற்கை / சுத்தமான உணவு)' : lang === 'hi' ? 'नहीं (जैविक / स्वच्छ)' : 'ಇಲ್ಲ (ಸಾವಯವ / ಸ್ವಚ್ಛ)';
    }
    if (lower.includes('pesticide exposure') || lower.includes('pesticide')) {
      return lang === 'ta' ? 'ஆம் (பூச்சிக்கொல்லி வெளிப்பாடு)' : lang === 'hi' ? 'हाँ (कीटनाशक का सामना)' : 'ಹೌದು (ಕೀಟನಾಶಕ ಒಡ್ಡಿಕೆ)';
    }
    if (lower.includes('plastic-free') || lower.includes('no plastic')) {
      return lang === 'ta' ? 'இல்லை (பிளாஸ்டிக் தவிர்த்தேன்)' : lang === 'hi' ? 'नहीं (प्लास्टिक मुक्त)' : 'ಇಲ್ಲ (ಪ್ಲಾಸ್ಟಿಕ್ ಮುಕ್ತ)';
    }
    if (lower.includes('plastic / hot cup') || lower.includes('plastic container')) {
      return lang === 'ta' ? 'ஆம் (பிளாஸ்டிக் / சூடான கப்)' : lang === 'hi' ? 'हाँ (प्लास्टिक / गर्म कप)' : 'ಹೌದು (ಪ್ಲಾಸ್ಟಿಕ್ / ಬಿಸಿ ಕಪ್)';
    }

    // Health / Symptoms
    if (lower.includes('no issues') || lower.includes('no symptoms') || lower.includes('healthy')) {
      return lang === 'ta' ? 'பிரச்சனை இல்லை (ஆரோக்கியம்)' : lang === 'hi' ? 'कोई समस्या नहीं (स्वस्थ)' : 'ಯಾವುದೇ ಸಮಸ್ಯೆಯಿಲ್ಲ (ಆರೋಗ್ಯಕರ)';
    }
    if (lower.includes('gastritis') || lower.includes('acidity') || lower.includes('heartburn')) {
      return lang === 'ta' ? 'அசிடிட்டி / நெஞ்செரிச்சல்' : lang === 'hi' ? 'एसिडिटी / गैस' : 'ಅಸಿಡಿಟಿ / ಗ್ಯಾಸ್ಟ್ರಿಟಿಸ್';
    }
    if (lower.includes('dental discomfort') || lower.includes('toothache') || lower.includes('dental')) {
      return lang === 'ta' ? 'பல் / வாய் வலி' : lang === 'hi' ? 'दांतों में तकलीफ' : 'ಹಲ್ಲು ನೋವು';
    }
    if (lower === 'both') {
      return lang === 'ta' ? 'இரண்டும்' : lang === 'hi' ? 'दोनों' : 'ಎರಡೂ';
    }
    if (lower.includes('no family history')) {
      return lang === 'ta' ? 'குடும்ப வரலாறு இல்லை' : lang === 'hi' ? 'कोई पारिवारिक इतिहास नहीं' : 'ಯಾವುದೇ ಕುಟುಂಬ ಇತಿಹಾಸವಿಲ್ಲ';
    }
    if (lower.includes('family history of cancer') || lower.includes('family history')) {
      return lang === 'ta' ? 'ஆம் (குடும்ப புற்றுநோய் வரலாறு)' : lang === 'hi' ? 'हाँ (परिवार में कैंसर इतिहास)' : 'ಹೌದು (ಕುಟುಂಬದಲ್ಲಿ ಕ್ಯಾನ್ಸರ್ ಇತಿಹಾಸ)';
    }
    if (lower.includes('appointment today') || lower.includes('(done)')) {
      return lang === 'ta' ? 'இன்றைய பரிசோதனை (முடிந்தது)' : lang === 'hi' ? 'आज की अपॉइंटमेंट (पूर्ण)' : 'ಇಂದಿನ ತಪಾಸಣೆ (ಮುಗಿದಿದೆ)';
    }
    if (lower.includes('upcoming scheduled') || lower.includes('scheduled')) {
      return lang === 'ta' ? 'அடுத்து திட்டமிடப்பட்டுள்ளது' : lang === 'hi' ? 'आगामी निर्धारित है' : 'ಮುಂಬರುವ ದಿನ ನಿಗದಿಯಾಗಿದೆ';
    }
    if (lower.includes('need to schedule') || lower.includes('not scheduled')) {
      return lang === 'ta' ? 'திட்டமிட வேண்டும்' : lang === 'hi' ? 'समय निर्धारित करना है' : 'ದಿನ ನಿಗದಿಪಡಿಸಬೇಕು';
    }
    if (lower.includes('no follow-up') || lower.includes('not needed')) {
      return lang === 'ta' ? 'பரிசோதனை தேவையில்லை' : lang === 'hi' ? 'फॉलो-अप की आवश्यकता नहीं' : 'ಯಾವುದೇ ಫಾಲೋ-ಅಪ್ ಅಗತ್ಯವಿಲ್ಲ';
    }

    // Try i18n lookup if available
    const translated = t(opt);
    if (translated && translated !== opt) return translated;

    return opt;
  };

  const formatQuestionPromptWithAQI = (stepId: string, prompt: string): string => {
    if (!prompt) return prompt;
    const s = (stepId || '').toLowerCase();
    const pLower = prompt.toLowerCase();
    if (s === 'env_air' || s.includes('air') || pLower.includes('air pollution') || pLower.includes('smog') || pLower.includes('traffic') || pLower.includes('incense')) {
      const aqiPrefix = getLiveAQIInfoString();
      if (!prompt.includes('Live Air Quality') && !prompt.includes('AQI') && !prompt.includes('காற்றின் தரம்') && !prompt.includes('वायु गुणवत्ता')) {
        return `${aqiPrefix}${prompt}`;
      }
    }
    return prompt;
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
      setIsSpeaking(false);
      if (onDone) {
        setTimeout(onDone, 300);
      }
      return;
    }

    setIsSpeaking(true);

    const clean = text.replace(/[*_#•]/g, '').trim();
    if (!clean) {
      setIsSpeaking(false);
      if (onDone) onDone();
      return;
    }

    const ttsLocale = currentLanguageOption?.localeTag || (language === 'ta' ? 'ta-IN' : language === 'kn' ? 'kn-IN' : language === 'hi' ? 'hi-IN' : 'en-US');

    // ── NATIVE CAPACITOR (Android & iOS) ──
    if (Capacitor.isNativePlatform()) {
      try {
        setIsSpeaking(true);
        try { await TextToSpeech.stop(); } catch {}
        await TextToSpeech.speak({
          text: clean,
          lang: ttsLocale,
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
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = ttsLocale;

      // Pick best matching voice for current language
      const voices = window.speechSynthesis.getVoices();
      const langCode = (language || 'en').toLowerCase();
      const targetPrefix = ttsLocale.toLowerCase().split('-')[0];

      if (voices.length > 0) {
        const matchedVoice = voices.find(v => {
          const vLang = v.lang.toLowerCase().replace('_', '-');
          const vName = v.name.toLowerCase();
          if (langCode === 'ta') return vLang.startsWith('ta') || vName.includes('tamil');
          if (langCode === 'hi') return vLang.startsWith('hi') || vName.includes('hindi');
          if (langCode === 'kn') return vLang.startsWith('kn') || vName.includes('kannada');
          if (langCode === 'en') return vLang.startsWith('en');
          return vLang.startsWith(targetPrefix);
        });

        if (matchedVoice) {
          utterance.voice = matchedVoice;
        } else if (langCode === 'en') {
          const enVoice = voices.find(v => 
            v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Siri') || v.name.includes('Alex'))
          ) || voices[0];
          if (enVoice) utterance.voice = enVoice;
        }
        // If not English and no voice matches the list, we deliberately do NOT set utterance.voice to an English voice.
        // Leaving utterance.voice unset lets the browser and OS handle utterance.lang properly without English corruption.
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
      const textToSpeak = (currentStep ? formatQuestionPromptWithAQI(currentStep.stepId, localizeStepQuestion(currentStep.stepId, currentStep.questionPrompt)) : null) || lastBotMsg?.text || (language === 'ta' ? 'அனைத்து தினசரி சரிபார்ப்புகளும் முடிவடைந்தன.' : language === 'hi' ? 'सभी दैनिक चेक-इन पूरे हो गए।' : language === 'kn' ? 'ಎಲ್ಲಾ ದೈನಂದಿನ ಚೆಕ್-ಇನ್‌ಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ.' : 'All daily check-ins completed. Your data is synced.');
      speakQuestion(textToSpeak);
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
  };


  const getConditionWorkflow = (targetMode: string): Workflow | null => {
    if (targetMode === 'AGEING') {
      return {
        name: 'Healthy Ageing & Longevity Protocol',
        targetMode: 'AGEING',
        steps: [
          {
            stepId: 'found_exercise',
            title: 'Daily Movement',
            questionPrompt: 'Did you get in some exercise or resistance movement today?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 1,
            isEnabled: true
          },
          {
            stepId: 'found_sleep',
            title: '8 Hours Sleep',
            questionPrompt: 'Did you get 8 hours of restorative sleep last night?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 2,
            isEnabled: true
          },
          {
            stepId: 'found_diet',
            title: 'Whole-Food Diet',
            questionPrompt: 'Did you eat a balanced, whole-food diet with minimal processed foods today?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 3,
            isEnabled: true
          },
          {
            stepId: 'found_fasting',
            title: 'Fasting Window',
            questionPrompt: 'Did you adhere to your intermittent circadian fasting window today?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 4,
            isEnabled: true
          },
          {
            stepId: 'found_antioxidants',
            title: 'Antioxidant Foods',
            questionPrompt: 'Did you include antioxidant-rich vegetables, berries, or greens today?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 5,
            isEnabled: true
          },
          {
            stepId: 'found_stress',
            title: 'Stress Level',
            questionPrompt: 'On a scale from 1 (Calm) to 10 (High), what was your stress level today?',
            inputType: 'NUMBER',
            order: 6,
            isEnabled: true
          }
        ]
      };
    }
    if (targetMode === 'PCOD') {
      return {
        name: 'PCOD & Hormonal Balance Protocol',
        targetMode: 'PCOD',
        steps: [
          {
            stepId: 'pcod_exercise',
            title: '20 Min Exercise',
            questionPrompt: 'Did you complete 20 minutes of exercise or strength movement today?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 1,
            isEnabled: true
          },
          {
            stepId: 'pcod_junk',
            title: 'Junk / Processed Food',
            questionPrompt: 'Did you consume any junk food, refined sugar, or ultra-processed snacks today?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 2,
            isEnabled: true
          },
          {
            stepId: 'pcod_sleep',
            title: '8 Hours Sleep',
            questionPrompt: 'Did you get 8 hours of restorative sleep?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 3,
            isEnabled: true
          },
          {
            stepId: 'pcod_stress',
            title: 'Stress Scale',
            questionPrompt: 'On a scale from 1 to 10, how stressed did you feel today?',
            inputType: 'NUMBER',
            order: 4,
            isEnabled: true
          },
          {
            stepId: 'pcod_hirsutism',
            title: 'Symptom Check-in',
            questionPrompt: 'Are you noticing any excess facial/body hair growth (hirsutism) or hormonal breakouts?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 5,
            isEnabled: true
          }
        ]
      };
    }
    if (targetMode === 'DIABETES') {
      return {
        name: 'Diabetes & Glycemic Protocol',
        targetMode: 'DIABETES',
        steps: [
          {
            stepId: 'diab_exercise',
            title: '20 Min Exercise',
            questionPrompt: 'Did you get in at least 20 minutes of exercise or walking today to activate glucose uptake?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 1,
            isEnabled: true
          },
          {
            stepId: 'diab_alcohol',
            title: 'Alcohol Intake',
            questionPrompt: 'Did you have any alcoholic beverages today?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 2,
            isEnabled: true
          },
          {
            stepId: 'diab_junk',
            title: 'High-Carb / Sugar Foods',
            questionPrompt: 'Did you eat high-carb, sugary, or refined junk food today?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 3,
            isEnabled: true
          },
          {
            stepId: 'diab_sleep',
            title: '8 Hours Sleep',
            questionPrompt: 'Did you sleep 8 hours last night to maintain healthy insulin sensitivity?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 4,
            isEnabled: true
          },
          {
            stepId: 'diab_stress',
            title: 'Stress Level',
            questionPrompt: 'On a scale from 1 (Calm) to 10 (High), what was your stress level today?',
            inputType: 'NUMBER',
            order: 5,
            isEnabled: true
          }
        ]
      };
    }
    if (targetMode === 'HYPERTENSION') {
      return {
        name: 'Hypertension & Blood Pressure Protocol',
        targetMode: 'HYPERTENSION',
        steps: [
          {
            stepId: 'htn_exercise',
            title: '20 Min Exercise',
            questionPrompt: 'Did you get in at least 20 minutes of cardiovascular exercise or walking today?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 1,
            isEnabled: true
          },
          {
            stepId: 'htn_meditated',
            title: 'Meditation & Breathwork',
            questionPrompt: 'Did you meditate or practice 10 minutes of deep slow breathing today?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 2,
            isEnabled: true
          },
          {
            stepId: 'htn_lowsalt',
            title: 'Low-Salt DASH Diet',
            questionPrompt: 'Did you stick to a low-salt, DASH-friendly whole food diet today?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 3,
            isEnabled: true
          },
          {
            stepId: 'htn_sleep',
            title: '8 Hours Sleep',
            questionPrompt: 'Did you get 8 hours of sleep last night?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 4,
            isEnabled: true
          },
          {
            stepId: 'htn_stress',
            title: 'Stress Level',
            questionPrompt: 'On a scale from 1 to 10, how was your stress and vascular tension today?',
            inputType: 'NUMBER',
            order: 5,
            isEnabled: true
          }
        ]
      };
    }
    if (targetMode === 'PARKINSON') {
      return {
        name: "Parkinson's Motor & Dopamine Protocol",
        targetMode: 'PARKINSON',
        steps: [
          {
            stepId: 'pd_tremor',
            title: 'Tremor Severity',
            questionPrompt: 'On a scale from 1 (Minimal) to 10 (Severe), how is your tremor today?',
            inputType: 'NUMBER',
            order: 1,
            isEnabled: true
          },
          {
            stepId: 'pd_rigidity',
            title: 'Muscle Rigidity',
            questionPrompt: 'On a scale from 1 (Loose) to 10 (Very Stiff), rate your muscle stiffness today:',
            inputType: 'NUMBER',
            order: 2,
            isEnabled: true
          },
          {
            stepId: 'pd_bradykinesia',
            title: 'Movement Slowness',
            questionPrompt: 'On a scale from 1 to 10, rate any slowness of movement (bradykinesia) today:',
            inputType: 'NUMBER',
            order: 3,
            isEnabled: true
          },
          {
            stepId: 'pd_sleep',
            title: '8 Hours Sleep',
            questionPrompt: 'Did you get 8 hours of restful sleep last night?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 4,
            isEnabled: true
          },
          {
            stepId: 'pd_loved',
            title: 'Dopamine Booster',
            questionPrompt: 'Did you engage in an activity you love, spend time in sunlight, or enjoy dark chocolate today?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 5,
            isEnabled: true
          }
        ]
      };
    }
    if (targetMode === 'CARDIAC') {
      return {
        name: 'Cardiovascular Health Protocol',
        targetMode: 'CARDIAC',
        steps: [
          {
            stepId: 'cardiac_exercise',
            title: 'Cardiovascular Movement',
            questionPrompt: 'Did you complete 20 minutes of cardio or light movement today?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 1,
            isEnabled: true
          },
          {
            stepId: 'cardiac_lowsalt',
            title: 'Low-Salt Meals',
            questionPrompt: 'Did you eat low-salt meals to protect arterial pressure today?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 2,
            isEnabled: true
          },
          {
            stepId: 'cardiac_lowjunk',
            title: 'Low-Sugar / Low-Fat',
            questionPrompt: 'Did you eat low-sugar and low-fat whole foods today?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 3,
            isEnabled: true
          },
          {
            stepId: 'cardiac_alcohol',
            title: 'Alcohol Intake',
            questionPrompt: 'Did you drink any alcohol today?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 4,
            isEnabled: true
          },
          {
            stepId: 'cardiac_sleep',
            title: '8 Hours Sleep',
            questionPrompt: 'Did you sleep 8 hours last night?',
            inputType: 'YES_NO',
            options: ['Yes', 'No'],
            order: 5,
            isEnabled: true
          },
          {
            stepId: 'cardiac_stress',
            title: 'Stress Level',
            questionPrompt: 'On a scale from 1 (Calm) to 10 (High), what was your stress level today?',
            inputType: 'NUMBER',
            order: 6,
            isEnabled: true
          }
        ]
      };
    }
    return null;
  };

  const fetchWorkflow = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const customWf = getConditionWorkflow(userMode);

      // Map user journey mode to backend workflow mode
      let mode = 'STANDARD'; // PREVENTION
      if (userMode === 'TREATMENT') mode = 'CANCER_PATIENT';
      else if (userMode === 'SECONDARY_PREVENTION') mode = 'SECONDARY_PREVENTION';
      const [wfRes, habitsRes, reportsRes] = await Promise.all([
        customWf ? Promise.resolve({ ok: false } as any) : fetch(`${apiUrl}/daily-logging-workflows/active?mode=${mode}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/habits?type=all&days=2`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/reports`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null)
      ]);

      let activeSteps: WorkflowStep[] = [];
      let wfData: Workflow | null = null;

      if (customWf) {
        wfData = customWf;
        activeSteps = customWf.steps;
      } else if (wfRes.ok) {
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
              return envHabits.some(h => h.value?.stepId === 'env_air' || h.value?.answers?.airQ1 !== undefined || h.value?.answers?.airQ3 !== undefined || (h.value?.option && (h.value.option.toLowerCase().includes('air') || h.value.option.toLowerCase().includes('smog') || h.value.option.toLowerCase().includes('smoke') || h.value.option.toLowerCase().includes('clean'))));
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
          // Check Your Kitchen Audit
          if (s === 'kitchen' || s === 'env_kitchen') return todaysHabits.some(h =>
            h.type === 'Kitchen' || h.type?.toUpperCase().includes('KITCHEN')
          );
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
            if (s === 'kitchen' || s === 'env_kitchen') return t.includes('kitchen');
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

          const isManual = habit ? habit.source !== 'chatbot' : true;
          const tag = isManual ? (language === 'ta' ? 'கையேடு பதிவு' : language === 'hi' ? 'मैन्युअल लॉग' : language === 'kn' ? 'ಹಸ್ತಚಾಲಿತ ಲಾಗ್' : 'Manual Log') : (language === 'ta' ? 'AI பதிவு' : language === 'hi' ? 'AI लॉग' : language === 'kn' ? 'AI ಲಾಗ್' : 'AI Log');
          const loggedPrefix = language === 'ta' ? 'பதிவு செய்யப்பட்டது' : language === 'hi' ? 'लॉग किया गया' : language === 'kn' ? 'ದಾಖಲಿಸಲಾಗಿದೆ' : 'Logged';
          const displayValue = valStr && valStr !== 'true' && valStr !== 'false' ? `${valStr} · ${tag}` : `${loggedPrefix} · ${tag}`;
          return { valText: displayValue, isManual };
        };

        const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const initialMessages: ChatMessage[] = [{
          id: 'welcome', sender: 'bot',
          text: t('chatbot.greetingProgress', "Hi! I'm your AI Check-in Assistant. Here's your progress for today:"),
          timestamp: ts
        }];

        let firstUnloggedIndex = -1;
        activeSteps.forEach((step, idx) => {
          if (isLogged(step.stepId)) {
            const summary = getLoggedHabitSummary(step.stepId, todaysHabits);
            const locTitle = localizeStepTitle(step.stepId, step.title);
            initialMessages.push({
              id: `logged_${step.stepId}`,
              sender: 'bot',
              title: locTitle,
              isLoggedBadge: true,
              stepId: step.stepId,
              loggedValue: summary.valText,
              text: `${locTitle} ${t('chatbot.completed', 'completed')}`,
              timestamp: ts
            });
          } else if (firstUnloggedIndex === -1) {
            firstUnloggedIndex = idx;
          }
        });

        if (firstUnloggedIndex !== -1) {
          const nextStep = activeSteps[firstUnloggedIndex];
          setActiveStepIndex(firstUnloggedIndex);

          let questionText = formatQuestionPromptWithAQI(nextStep.stepId, localizeStepQuestion(nextStep.stepId, nextStep.questionPrompt));
          let questionOptions = nextStep.options;

          if (nextStep.stepId === 'report_upload' && todayReports.length > 0) {
            const existingRep = todayReports[0];
            const fileName = existingRep.originalName || existingRep.title || 'Uploaded Report';
            questionText = `📄 Report already uploaded today (${fileName}). Would you like to keep this report or re-upload a new file?`;
            questionOptions = ['Keep Current Report', 'Re-upload / Update File'];
          }

          initialMessages.push({ id: `step_${firstUnloggedIndex}`, sender: 'bot', text: questionText, timestamp: ts, inputType: nextStep.inputType, options: questionOptions, stepId: nextStep.stepId });
          setMessages(initialMessages);
          speakQuestion(questionText);
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
      fetchAndCacheLiveAQI();
      fetchWorkflow();
    } else {
      // Stop mic and speech when modal closes
      stopListening();
      if (Capacitor.isNativePlatform()) {
        try { TextToSpeech.stop(); } catch {}
      }
    }
  }, [isOpen]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const saveHabitToBackend = async (stepId: string, valueStr: string) => {
    setSessionAnswers(prev => ({ ...prev, [stepId]: valueStr }));
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
        const isClean = lowerVal.includes('no') || lowerVal.includes('clean');
        habitValue = { 
          count: isClean ? 0 : 1,
          cigarettesCount: isClean ? 0 : (lowerVal.includes('chew') || lowerVal.includes('gutkha') || lowerVal.includes('khaini') ? 0 : 1),
          chewingCount: (lowerVal.includes('chew') || lowerVal.includes('gutkha') || lowerVal.includes('khaini')) ? 1 : 0,
          option: valueStr 
        };
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
          updatedAnswers.airQ3 = !isClean;
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
        if (updatedAnswers.airQ1 === true || updatedAnswers.airQ2 === true || updatedAnswers.airQ3 === true) calcScore -= 1;
        if (updatedAnswers.waterQ1 === false) calcScore -= 1;
        if (updatedAnswers.pesticidesQ1 === true) calcScore -= 1;
        if (updatedAnswers.microplasticsQ1 === true) calcScore -= 1;

        habitValue = {
          score: calcScore,
          answers: updatedAnswers,
          option: valueStr
        };
      } else if (stepId === 'kitchen' || stepId === 'env_kitchen') {
        habitType = 'Kitchen';
        const isSafe = isYes || lowerVal.includes('safe') || lowerVal.includes('no plastic') || lowerVal.includes('clean');
        habitValue = {
          score: isSafe ? 0 : -1,
          answers: {
            kitchenQ1: isSafe,
            kitchenQ2: isSafe,
            kitchenQ3: isSafe
          },
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
      // ── Condition-specific steps sync to localStorage and backend ──
      } else if (stepId.startsWith('found_')) {
        habitType = stepId === 'found_exercise' ? 'Movement' : stepId === 'found_sleep' ? 'Sleep' : stepId === 'found_fasting' ? 'Fasting' : stepId === 'found_antioxidants' ? 'Antioxidants' : stepId === 'found_stress' ? 'Stress' : 'Food';
        habitValue = { value: isYes ? 1 : 0 };
        try {
          const stored = JSON.parse(localStorage.getItem('mito_ageing_factors') || '{}');
          stored[stepId] = isYes || (!isNaN(Number(valueStr)) && Number(valueStr) <= 5);
          localStorage.setItem('mito_ageing_factors', JSON.stringify(stored));
        } catch {}
      } else if (stepId.startsWith('pcod_')) {
        habitType = stepId === 'pcod_exercise' ? 'Movement' : stepId === 'pcod_sleep' ? 'Sleep' : stepId === 'pcod_stress' ? 'Stress' : 'Food';
        habitValue = { value: isYes ? 1 : 0 };
        if (stepId === 'pcod_exercise') localStorage.setItem('mito_pcod_exercised', String(isYes));
        else if (stepId === 'pcod_junk') localStorage.setItem('mito_pcod_junk', String(isYes));
        else if (stepId === 'pcod_sleep') localStorage.setItem('mito_pcod_slept8', String(isYes));
        else if (stepId === 'pcod_stress') localStorage.setItem('mito_pcod_stress', String(parseFloat(valueStr) || 5));
        else if (stepId === 'pcod_hirsutism') localStorage.setItem('mito_pcod_hirsutism', String(isYes));
      } else if (stepId.startsWith('diab_')) {
        habitType = stepId === 'diab_exercise' ? 'Movement' : stepId === 'diab_alcohol' ? 'Alcohol' : stepId === 'diab_sleep' ? 'Sleep' : stepId === 'diab_stress' ? 'Stress' : 'Food';
        habitValue = { value: isYes ? 1 : 0 };
        if (stepId === 'diab_exercise') localStorage.setItem('mito_diab_exercised', String(isYes));
        else if (stepId === 'diab_alcohol') localStorage.setItem('mito_diab_alcohol', String(isYes));
        else if (stepId === 'diab_junk') localStorage.setItem('mito_diab_junk', String(isYes));
        else if (stepId === 'diab_sleep') localStorage.setItem('mito_diab_slept8', String(isYes));
        else if (stepId === 'diab_stress') localStorage.setItem('mito_diab_stress', String(parseFloat(valueStr) || 5));
      } else if (stepId.startsWith('htn_')) {
        habitType = stepId === 'htn_exercise' ? 'Movement' : stepId === 'htn_meditated' ? 'Stillness' : stepId === 'htn_sleep' ? 'Sleep' : stepId === 'htn_stress' ? 'Stress' : 'Food';
        habitValue = { value: isYes ? 1 : 0 };
        if (stepId === 'htn_exercise') localStorage.setItem('mito_htn_exercised', String(isYes));
        else if (stepId === 'htn_meditated') localStorage.setItem('mito_htn_meditated', String(isYes));
        else if (stepId === 'htn_lowsalt') localStorage.setItem('mito_htn_lowsalt', String(isYes));
        else if (stepId === 'htn_sleep') localStorage.setItem('mito_htn_slept8', String(isYes));
        else if (stepId === 'htn_stress') localStorage.setItem('mito_htn_stress', String(parseFloat(valueStr) || 5));
      } else if (stepId.startsWith('pd_')) {
        habitType = stepId === 'pd_sleep' ? 'Sleep' : stepId === 'pd_loved' ? 'Joy' : 'Symptoms';
        habitValue = { value: isYes ? 1 : 0 };
        if (stepId === 'pd_sleep') localStorage.setItem('mito_pd_slept8', String(isYes));
        else if (stepId === 'pd_loved') localStorage.setItem('mito_pd_loved', String(isYes));
        else {
          try {
            const stored = JSON.parse(localStorage.getItem('mito_pd_symptom_scores') || '{}');
            const sympKey = stepId.replace('pd_', '');
            stored['9:00 AM'] = { ...(stored['9:00 AM'] || {}), [sympKey]: parseFloat(valueStr) || 1 };
            localStorage.setItem('mito_pd_symptom_scores', JSON.stringify(stored));
          } catch {}
        }
      } else if (stepId.startsWith('cardiac_')) {
        habitType = stepId === 'cardiac_exercise' ? 'Movement' : stepId === 'cardiac_alcohol' ? 'Alcohol' : stepId === 'cardiac_sleep' ? 'Sleep' : stepId === 'cardiac_stress' ? 'Stress' : 'Food';
        habitValue = { value: isYes ? 1 : 0 };
        if (stepId === 'cardiac_exercise') localStorage.setItem('mito_cardiac_exercised', String(isYes));
        else if (stepId === 'cardiac_lowsalt') localStorage.setItem('mito_cardiac_lowsalt', String(isYes));
        else if (stepId === 'cardiac_lowjunk') localStorage.setItem('mito_cardiac_lowjunk', String(isYes));
        else if (stepId === 'cardiac_alcohol') localStorage.setItem('mito_cardiac_alcohol', String(isYes));
        else if (stepId === 'cardiac_sleep') localStorage.setItem('mito_cardiac_slept8', String(isYes));
        else if (stepId === 'cardiac_stress') localStorage.setItem('mito_cardiac_stress', String(parseFloat(valueStr) || 5));
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
      
      const promptWithAQI = formatQuestionPromptWithAQI(targetStep.stepId, targetStep.questionPrompt);
      setMessages(prev => {
        const filtered = prev.filter(m => !m.id.startsWith('relog_'));
        return [
          ...filtered,
          {
            id: `relog_${stepId}`,
            sender: 'bot',
            text: `✏️ Re-logging ${targetStep.title}: ${promptWithAQI}`,
            timestamp: ts,
            inputType: targetStep.inputType,
            options: targetStep.options,
            stepId: targetStep.stepId
          }
        ];
      });
      speakQuestion(promptWithAQI);
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

    // Smoking & Chewing Tobacco
    if (text.includes('no smoke') || text.includes('no smoking') || text.includes('didnt smoke') || text.includes('no tobacco') || text.includes('no gutkha') || text.includes('clean day')) {
      detected.push({ stepId: 'smoking', valueStr: 'No (Clean Day)', name: 'Tobacco (Clean Day)' });
    } else if (text.includes('smoked') || text.includes('cigarettes') || text.includes('chewed') || text.includes('gutkha') || text.includes('khaini') || text.includes('tobacco')) {
      detected.push({ stepId: 'smoking', valueStr: 'Yes (Smoked / Chewed Tobacco)', name: 'Tobacco (Exposed)' });
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
    if (text.includes('kitchen') || text.includes('utensils') || text.includes('water container') || text.includes('iron pan') || text.includes('brass pan')) {
      detected.push({ stepId: 'kitchen', valueStr: 'Yes (Plastic-Free Safe Kitchen)', name: 'Check Your Kitchen (Safe)' });
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
        text: `Logged ${detectedMulti.length} habits:`,
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
        const promptWithAQI = formatQuestionPromptWithAQI(nextStep.stepId, localizeStepQuestion(nextStep.stepId, nextStep.questionPrompt));
        updatedMsgs.push({
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: promptWithAQI,
          timestamp: ts,
          inputType: nextStep.inputType,
          options: nextStep.options,
          stepId: nextStep.stepId
        });
        setMessages(updatedMsgs);
        speakQuestion(promptWithAQI);
      } else {
        const multiMap: Record<string, string> = {};
        detectedMulti.forEach(d => {
          multiMap[d.stepId] = d.valueStr;
          saveHabitToBackend(d.stepId, d.valueStr);
        });
        sessionAnswersRef.current = { ...sessionAnswersRef.current, ...multiMap };
        setSessionAnswers(prev => ({ ...prev, ...multiMap }));

        const finalAnswers = { ...sessionAnswersRef.current, ...multiMap };
        const summary = computeSessionScoreSummary(finalAnswers);
        setSessionSummary(summary);
        setIsCompleted(true);

        const todayStr = new Date().toDateString();
        localStorage.setItem('mito_last_habit_log_date', todayStr);
        if (finalAnswers['fasting']) localStorage.setItem('mito_fasting_logged_today', todayStr);
        if (finalAnswers['stillness']) localStorage.setItem('mito_stillness_logged_today', todayStr);

        const finishVoice = language === 'ta'
          ? `அனைத்து தினசரி சரிபார்ப்புகளும் முடிவடைந்தன. இன்று உங்கள் சேத மதிப்பீடு ${summary.damageScore}, மற்றும் பழுதுபார்ப்பு மதிப்பீடு ${summary.repairScore}.`
          : language === 'hi'
          ? `सभी दैनिक चेक-इन पूरे हो गए। आज आपका डैमेज स्कोर ${summary.damageScore} है, और रिपेयर स्कोर ${summary.repairScore} है।`
          : language === 'kn'
          ? `ಎಲ್ಲಾ ದೈನಂದಿನ ಚೆಕ್-ಇನ್‌ಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ. ಇಂದು ನಿಮ್ಮ ಡ್ಯಾಮೇಜ್ ಸ್ಕೋರ್ ${summary.damageScore}, ಮತ್ತು ರಿಪೇರ್ ಸ್ಕೋರ್ ${summary.repairScore}.`
          : `All daily check-ins complete. Today your Damage score is ${summary.damageScore}, and Repair score is ${summary.repairScore}. Tomorrow, focus on reducing your damage score by ${summary.priorityActionHints[0] || 'avoiding stress and processed foods'}, and improve your repair score with ${summary.priorityActionHints[1] || 'intermittent fasting and 20 minutes of daily exercise'}.`;

        const finishCardText = language === 'ta'
          ? `தினசரி சரிபார்ப்பு முடிந்தது\n\nசேத சுமை: -${summary.damageScore}\nபழுதுபார்ப்பு பாதுகாப்பு: +${summary.repairScore}\n\nநாளைய முன்னுரிமை நடவடிக்கைகள்:\n1. ${summary.priorityActionHints[0] || 'மன அழுத்தத்தைக் குறைக்கவும்'}\n2. ${summary.priorityActionHints[1] || '14 மணி நேர உண்ணாநோன்பு மற்றும் உடற்பயிற்சி'}`
          : language === 'hi'
          ? `दैनिक चेक-इन पूर्ण\n\nडैमेज लोड: -${summary.damageScore}\nरिपेयर डिफेंस: +${summary.repairScore}\n\nकल के लिए प्राथमिकता कार्य:\n1. ${summary.priorityActionHints[0] || 'दैनिक तनाव कम करें'}\n2. ${summary.priorityActionHints[1] || '14 घंटे का उपवास और व्यायाम'}`
          : language === 'kn'
          ? `ದೈನಂದಿನ ಚೆಕ್-ಇನ್ ಪೂರ್ಣಗೊಂಡಿದೆ\n\nಡ್ಯಾಮೇಜ್ ಲೋಡ್: -${summary.damageScore}\nರಿಪೇರ್ ಡಿಫೆನ್ಸ್: +${summary.repairScore}\n\nನಾಳೆಯ ಆದ್ಯತಾ ಕ್ರಿಯೆಗಳು:\n1. ${summary.priorityActionHints[0] || 'ಒತ್ತಡವನ್ನು ಕಡಿಮೆ ಮಾಡಿ'}\n2. ${summary.priorityActionHints[1] || '14 ಗಂಟೆ ಉಪವಾಸ ಮತ್ತು ವ್ಯಾಯಾಮ'}`
          : `Daily Check-in Complete\n\nDamage Load: -${summary.damageScore}\nRepair Defense: +${summary.repairScore}\n\nPriority Actions for Tomorrow:\n1. ${summary.priorityActionHints[0] || 'Reduce daily stress and avoid late-night eating'}\n2. ${summary.priorityActionHints[1] || 'Boost cellular repair with 14-hour fasting and exercise'}`;

        updatedMsgs.push({
          id: 'bot_finish',
          sender: 'bot',
          text: finishCardText,
          timestamp: ts
        });
        setMessages(updatedMsgs);
        speakQuestion(finishVoice);
        if (onRefreshDashboard) onRefreshDashboard();
      }
      return;
    }

    const currentStep = currentWf.steps[currentIndex];

    // Validate single-question input against valid options / types
    const validation = validateAndMapAnswer(userAnswer, currentStep);

    if (!validation.valid) {
      const defaultClarify = language === 'ta'
        ? 'திரையில் உள்ள விருப்பங்களில் ஒன்றைத் தேர்ந்தெடுக்கவும்.'
        : language === 'hi'
        ? 'कृपया स्क्रीन पर दिए गए विकल्पों में से एक चुनें।'
        : language === 'kn'
        ? 'ದಯವಿಟ್ಟು ಪರದೆಯ ಮೇಲಿನ ಆಯ್ಕೆಗಳಲ್ಲಿ ಒಂದನ್ನು ಆರಿಸಿ.'
        : 'Please choose one of the available options below.';
      const clarifyText = validation.clarificationMsg || defaultClarify;
      const userMsg: ChatMessage = { id: `user_${Date.now()}`, sender: 'user', text: userAnswer, timestamp: ts, stepId: currentStep?.stepId };
      const clarifyMsg: ChatMessage = {
        id: `bot_clarify_${Date.now()}`,
        sender: 'bot',
        text: clarifyText,
        timestamp: ts,
        inputType: currentStep?.inputType,
        options: currentStep?.options,
        stepId: currentStep?.stepId
      };
      setMessages([...currentMsgs, userMsg, clarifyMsg]);
      speakQuestion(clarifyText);
      return; // Block advancement and do NOT save incorrect answer!
    }

    const validatedAnswer = validation.mappedValue;
    const userMsg: ChatMessage = { id: `user_${Date.now()}`, sender: 'user', text: validatedAnswer, timestamp: ts, stepId: currentStep?.stepId };
    if (currentStep) {
      sessionAnswersRef.current = { ...sessionAnswersRef.current, [currentStep.stepId]: validatedAnswer };
      setSessionAnswers(prev => ({ ...prev, [currentStep.stepId]: validatedAnswer }));
      saveHabitToBackend(currentStep.stepId, validatedAnswer);
    }
    setEditingStepId(null);
    const nextIndex = currentIndex + 1;
    const updatedMsgs = [...currentMsgs, userMsg];

    if (nextIndex < currentWf.steps.length) {
      const nextStep = currentWf.steps[nextIndex];
      setActiveStepIndex(nextIndex);
      const promptWithAQI = formatQuestionPromptWithAQI(nextStep.stepId, localizeStepQuestion(nextStep.stepId, nextStep.questionPrompt));
      updatedMsgs.push({ id: `bot_${Date.now()}`, sender: 'bot', text: promptWithAQI, timestamp: ts, inputType: nextStep.inputType, options: nextStep.options, stepId: nextStep.stepId });
      setMessages(updatedMsgs);
      speakQuestion(promptWithAQI);
    } else {
      const finalAnswers = { ...sessionAnswersRef.current, ...(currentStep ? { [currentStep.stepId]: validatedAnswer } : {}) };
      const summary = computeSessionScoreSummary(finalAnswers);
      setSessionSummary(summary);
      setIsCompleted(true);

      const todayStr = new Date().toDateString();
      localStorage.setItem('mito_last_habit_log_date', todayStr);
      if (finalAnswers['fasting']) localStorage.setItem('mito_fasting_logged_today', todayStr);
      if (finalAnswers['stillness']) localStorage.setItem('mito_stillness_logged_today', todayStr);

      const finishVoice = language === 'ta'
        ? `அனைத்து தினசரி சரிபார்ப்புகளும் முடிவடைந்தன. இன்று உங்கள் சேத மதிப்பீடு ${summary.damageScore}, மற்றும் பழுதுபார்ப்பு மதிப்பீடு ${summary.repairScore}.`
        : language === 'hi'
        ? `सभी दैनिक चेक-इन पूरे हो गए। आज आपका डैमेज स्कोर ${summary.damageScore} है, और रिपेयर स्कोर ${summary.repairScore} है।`
        : language === 'kn'
        ? `ಎಲ್ಲಾ ದೈನಂದಿನ ಚೆಕ್-ಇನ್‌ಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ. ಇಂದು ನಿಮ್ಮ ಡ್ಯಾಮೇಜ್ ಸ್ಕೋರ್ ${summary.damageScore}, ಮತ್ತು ರಿಪೇರ್ ಸ್ಕೋರ್ ${summary.repairScore}.`
        : `All daily check-ins complete. Today your Damage score is ${summary.damageScore}, and Repair score is ${summary.repairScore}. Tomorrow, focus on reducing your damage score by ${summary.priorityActionHints[0] || 'avoiding stress and processed foods'}, and improve your repair score with ${summary.priorityActionHints[1] || 'intermittent fasting and 20 minutes of daily exercise'}.`;

      const finishCardText = language === 'ta'
        ? `தினசரி சரிபார்ப்பு முடிந்தது\n\nசேத சுமை: -${summary.damageScore}\nபழுதுபார்ப்பு பாதுகாப்பு: +${summary.repairScore}\n\nநாளைய முன்னுரிமை நடவடிக்கைகள்:\n1. ${summary.priorityActionHints[0] || 'மன அழுத்தத்தைக் குறைக்கவும்'}\n2. ${summary.priorityActionHints[1] || '14 மணி நேர உண்ணாநோன்பு மற்றும் உடற்பயிற்சி'}`
        : language === 'hi'
        ? `दैनिक चेक-इन पूर्ण\n\nडैमेज लोड: -${summary.damageScore}\nरिपेयर डिफेंस: +${summary.repairScore}\n\nकल के लिए प्राथमिकता कार्य:\n1. ${summary.priorityActionHints[0] || 'दैनिक तनाव कम करें'}\n2. ${summary.priorityActionHints[1] || '14 घंटे का उपवास और व्यायाम'}`
        : language === 'kn'
        ? `ದೈನಂದಿನ ಚೆಕ್-ಇನ್ ಪೂರ್ಣಗೊಂಡಿದೆ\n\nಡ್ಯಾಮೇಜ್ ಲೋಡ್: -${summary.damageScore}\nರಿಪೇರ್ ಡಿಫೆನ್ಸ್: +${summary.repairScore}\n\nನಾಳೆಯ ಆದ್ಯತಾ ಕ್ರಿಯೆಗಳು:\n1. ${summary.priorityActionHints[0] || 'ಒತ್ತಡವನ್ನು ಕಡಿಮೆ ಮಾಡಿ'}\n2. ${summary.priorityActionHints[1] || '14 ಗಂಟೆ ಉಪವಾಸ ಮತ್ತು ವ್ಯಾಯಾಮ'}`
        : `Daily Check-in Complete\n\nDamage Load: -${summary.damageScore}\nRepair Defense: +${summary.repairScore}\n\nPriority Actions for Tomorrow:\n1. ${summary.priorityActionHints[0] || 'Reduce daily stress and avoid late-night eating'}\n2. ${summary.priorityActionHints[1] || 'Boost cellular repair with 14-hour fasting and exercise'}`;

      updatedMsgs.push({ id: 'bot_finish', sender: 'bot', text: finishCardText, timestamp: ts });
      setMessages(updatedMsgs);
      speakQuestion(finishVoice);
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
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-3.5 sm:px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 text-white flex-shrink-0">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-inner overflow-hidden p-0.5 shrink-0">
                  <RoboAvatar isSpeaking={isSpeaking} size={32} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-xs sm:text-sm text-white tracking-tight">{t('chatbot.aiAssistant', 'AI Assistant')}</span>
                    {isSpeaking ? (
                      <span className="inline-flex items-center gap-1 text-[8.5px] font-black bg-amber-400/30 text-amber-200 px-1.5 py-0.5 rounded-full border border-amber-300/40">
                        <span className="flex items-center gap-0.5">
                          <span className="h-2 w-0.5 bg-amber-300 rounded-full animate-bounce" />
                          <span className="h-2.5 w-0.5 bg-amber-300 rounded-full animate-bounce [animation-delay:150ms]" />
                        </span>
                        {t('chatbot.speaking', 'SPEAKING')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[8.5px] font-black bg-emerald-400/25 text-emerald-200 px-1.5 py-0.5 rounded-full border border-emerald-400/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {t('chatbot.online', 'ONLINE')}
                      </span>
                    )}
                  </div>
                  <p className="text-[9.5px] sm:text-[10px] font-medium text-blue-100/80 truncate mt-0.5">
                    {userMode === 'TREATMENT' ? t('chatbot.cancerTreatmentCheckin', 'Cancer Treatment Daily Check-in') : userMode === 'SECONDARY_PREVENTION' ? t('chatbot.cancerPreventionCheckin', 'Survivor Recovery Daily Check-in') : t('chatbot.cancerPreventionCheckin', 'Cancer Prevention Daily Check-in')}
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowReminderSettings(prev => !prev)}
                  className={`h-8 px-2 sm:px-2.5 rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
                    showReminderSettings
                      ? 'bg-white text-blue-600 border-white shadow-xs font-black'
                      : reminderEnabled && reminderTime
                        ? 'bg-white/20 hover:bg-white/30 border-white/30 text-white font-bold'
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-white/70'
                  }`}
                  title={t('checkinReminderTime')}
                >
                  {reminderEnabled && reminderTime ? (
                    <>
                      <Bell className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                      <span className="text-[8.5px] sm:text-[9px] uppercase tracking-wider font-black whitespace-nowrap">
                        {formatDisplayTime(reminderTime)}
                      </span>
                    </>
                  ) : (
                    <>
                      <BellOff className="h-3.5 w-3.5 opacity-80 shrink-0" />
                      <span className="text-[8.5px] sm:text-[9px] uppercase tracking-wider font-bold opacity-80">Off</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleVoiceMute}
                  className={`h-8 px-2 sm:px-2.5 rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
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
                      <Volume2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider">Stop</span>
                    </>
                  ) : isVoiceMuted ? (
                    <>
                      <VolumeX className="h-3.5 w-3.5 shrink-0 text-rose-300" />
                      <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider opacity-90 hidden min-[360px]:inline">{t('chatbot.muted', 'Muted')}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider opacity-90 hidden min-[360px]:inline">{t('chatbot.unmuted', 'Voice')}</span>
                    </>
                  )}
                </button>

                <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center transition-all cursor-pointer shrink-0" aria-label={t('common.close')}>
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
                    Daily AI Check-in Reminder
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
                  Select a reminder time or turn off alerts completely:
                </p>

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                  {['20:00', '20:30', '21:00', '21:30'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleSaveReminder(t)}
                      className={`py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        reminderEnabled && reminderTime === t
                          ? 'bg-white text-blue-700 border-white shadow-xs font-black'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                    >
                      {formatDisplayTime(t)}
                    </button>
                  ))}
                </div>

                {/* Custom Time Picker */}
                <div className="flex items-center gap-2 bg-white/20 p-2 rounded-xl border border-white/25 mb-2.5">
                  <span className="text-[10px] font-black text-white/80 uppercase tracking-wider shrink-0">{t('chatModal.customTime', 'Custom Time:')}</span>
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

                {/* Turn Off / Disable Option */}
                {reminderEnabled && (
                  <button
                    type="button"
                    onClick={handleCancelReminder}
                    className="w-full py-1.5 bg-rose-500/30 hover:bg-rose-500/40 border border-rose-400/40 text-rose-100 rounded-xl text-[10.5px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mb-2"
                  >
                    <BellOff className="h-3.5 w-3.5" />
                    Turn Off Daily Reminder
                  </button>
                )}

                {reminderStatusMsg && (
                  <p className="text-[11px] font-bold text-emerald-300 mb-2 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> {reminderStatusMsg}
                  </p>
                )}

                {/* Test Alert Button */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-[9.5px] text-blue-100/70 font-medium">
                    {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied' ? (
                      <span className="text-rose-300 font-bold">{t('chatModal.blockedInBrowser', 'Blocked in browser settings')}</span>
                    ) : (
                      <span className="flex items-center gap-1"><Bell className="h-3 w-3 inline text-blue-200" /> {reminderEnabled ? 'Active Alert Channel' : 'Alerts Disabled'}</span>
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
                  <span>{localizeStepTitle(currentStep?.stepId, currentStep?.title)}</span>
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
                <span className="text-xs font-bold">{t('chatModal.loadingCheckIn', 'Loading your check-in...')}</span>
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
                            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{localizeStepTitle(msg.stepId, msg.title)}</p>
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {msg.loggedValue || (language === 'ta' ? 'பதிவு செய்யப்பட்டது · கையேடு பதிவு' : language === 'hi' ? 'दर्ज किया गया · मैन्युअल प्रविष्टि' : language === 'kn' ? 'ದಾಖಲಿಸಲಾಗಿದೆ · ಕೈಪಿಡಿ ನಮೂದು' : 'Logged · Manual Entry')}
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
                                <span>{t('common.cancel', 'Cancel')}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartEditLoggedStep(msg.stepId!)}
                                disabled={editingStepId !== null}
                                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-2xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                              >
                                <Pencil className="h-3 w-3" />
                                <span>{t('chatbot.edit', 'Edit')}</span>
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
                            <div className="shrink-0 mt-0.5">
                              <RoboAvatar isSpeaking={isSpeaking && msgIdx === messages.length - 1} size={28} />
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
                                  placeholder={t('chatbot.inputPlaceholder', 'Edit your answer...')}
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
                            {msg.options.map((opt, i) => {
                              const displayOpt = localizeOptionText(opt);
                              return (
                                <motion.button
                                  key={i}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => advanceToNextStep(opt)}
                                  className="bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:border-blue-600 rounded-2xl px-4 py-2.5 text-xs font-bold shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                                >
                                  {displayOpt}
                                  <ArrowRight className="h-3 w-3 opacity-50" />
                                </motion.button>
                              );
                            })}
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
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-lg my-4 text-center"
                  >
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40 mx-auto mb-3">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider mb-1.5">
                      Daily Health Summary
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      Check-in Logged Successfully
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Your circadian fasting, cellular repair, and risk prevention logs are updated on your dashboard.
                    </p>

                    {/* Live Scorecard Metrics */}
                    <div className="grid grid-cols-2 gap-2.5 my-4 text-left">
                      <div className="bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-2xl border border-rose-200/60 dark:border-rose-900/40">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">{t('chatModal.damageLoad', 'Damage Load')}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">{t('chatModal.reduce', 'Reduce')}</span>
                        </div>
                        <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                          -{sessionSummary.damageScore}
                        </span>
                      </div>
                      <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{t('chatModal.repairDefense', 'Repair Defense')}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">{t('chatModal.build', 'Build')}</span>
                        </div>
                        <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          +{sessionSummary.repairScore}
                        </span>
                      </div>
                    </div>

                    {/* Priority Action Hints for Tomorrow */}
                    <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-3.5 border border-slate-200/70 dark:border-slate-800 text-left mb-4">
                      <span className="text-[10.5px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                        Priority Action Plan for Tomorrow:
                      </span>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                          <span className="h-5 w-5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-black flex items-center justify-center text-[10px] shrink-0">1</span>
                          <div>
                            <strong className="block text-[11px] font-bold text-slate-900 dark:text-slate-100">{t('chatModal.reduceDamage', 'Reduce Damage')}</strong>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">{sessionSummary.priorityActionHints[0] || 'Avoid evening stress, limit junk food, and get 7+ hours of sleep.'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                          <span className="h-5 w-5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center text-[10px] shrink-0">2</span>
                          <div>
                            <strong className="block text-[11px] font-bold text-slate-900 dark:text-slate-100">{t('chatModal.boostRepair', 'Boost Repair')}</strong>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">{sessionSummary.priorityActionHints[1] || 'Target a 14-hour intermittent fast and 20 minutes of aerobic exercise.'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={onClose}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>{t('viewCellularDashboardTitle')}</span>
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
              {/* Quick Shortcuts Bar (toggled or shown on tap) */}
              <AnimatePresence>
                {showQuickShortcuts && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-3 pt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs border-b border-slate-100 dark:border-slate-800/60 pb-2"
                  >
                    <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                      <Zap className="h-3 w-3 text-amber-500" /> Fast Answer:
                    </span>
                    {currentStep?.inputType === 'YES_NO' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => { advanceToNextStep('Yes'); setShowQuickShortcuts(false); }}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                        >
                          👍 {localizeOptionText('Yes')}
                        </button>
                        <button
                          type="button"
                          onClick={() => { advanceToNextStep('No'); setShowQuickShortcuts(false); }}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                        >
                          👎 {localizeOptionText('No')}
                        </button>
                        <button
                          type="button"
                          onClick={() => { advanceToNextStep('Skipped'); setShowQuickShortcuts(false); }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                        >
                          ⏭️ {localizeOptionText('Skip')}
                        </button>
                      </>
                    ) : (currentStep?.options || []).length > 0 ? (
                      (currentStep?.options || []).map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { advanceToNextStep(opt); setShowQuickShortcuts(false); }}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                        >
                          {localizeOptionText(opt)}
                        </button>
                      ))
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => { setInputText('7 hours'); setShowQuickShortcuts(false); }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                        >
                          {language === 'ta' ? '7 மணிநேரம்' : language === 'hi' ? '7 घंटे' : language === 'kn' ? '7 ಗಂಟೆಗಳು' : '7 hours'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setInputText('8 hours'); setShowQuickShortcuts(false); }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                        >
                          {language === 'ta' ? '8 மணிநேரம்' : language === 'hi' ? '8 घंटे' : language === 'kn' ? '8 ಗಂಟೆಗಳು' : '8 hours'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { advanceToNextStep('Skipped'); setShowQuickShortcuts(false); }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                        >
                          {localizeOptionText('Skip')}
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <form
                onSubmit={handleSendSubmit}
                className="px-3 py-3 flex items-center gap-2"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
              >
                {/* Left Shortcuts Button */}
                <button
                  type="button"
                  onClick={() => setShowQuickShortcuts(prev => !prev)}
                  className={`h-11 px-3 rounded-2xl flex items-center gap-1.5 shrink-0 transition-all duration-200 cursor-pointer border ${
                    showQuickShortcuts
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 font-black'
                      : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-bold'
                  }`}
                  title={t('quickAnswerShortcuts')}
                >
                  <Zap className={`h-4 w-4 ${showQuickShortcuts ? 'fill-current text-amber-300 animate-pulse' : 'text-blue-600 dark:text-blue-400'}`} />
                  <span className="text-[11px]">{t('chatbot.shortcuts', 'Shortcuts')}</span>
                </button>

                {/* Text input with left Sparkles icon */}
                <div className="relative flex-1 flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-blue-500 dark:focus-within:border-blue-500 rounded-2xl transition-colors min-w-0">
                  <Sparkles className="h-4 w-4 text-blue-500/80 dark:text-blue-400/80 ml-3 shrink-0" />
                  <input
                    type={currentStep?.inputType === 'NUMBER' ? 'number' : 'text'}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={t('chatbot.inputPlaceholder', 'Type your answer or select an option...')}
                    className="flex-1 min-w-0 bg-transparent border-none px-2.5 py-3 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                  />
                </div>

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
                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">{t('nudge.checkinDone', 'All Done!')}</p>
                  <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500">{t('habits.habitLogged', { habit: '' }, 'Dashboard updated')}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bg-gradient-to-br from-emerald-600 to-teal-600 hover:opacity-90 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md transition-all cursor-pointer active:scale-95"
              >
                {t('common.done', 'Done')}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
