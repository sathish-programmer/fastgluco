import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { HabitsService } from '../services/habitsService';
import type { HabitLog } from '../services/habitsService';
import {
  Skull,
  Frown,
  Moon,
  Cigarette,
  Wine,
  Pill,
  Leaf,
  Timer,
  Cherry,
  Activity,
  User,
  Palette,
  ShieldCheck,
  Microscope,
  ArrowRight,
  Calendar,
  X,
  Scale,
  Stethoscope,
  Flame,
  Dna,
  Globe,
  BrainCircuit,
  ShoppingBag,
  ArrowLeft,
  Bot
} from 'lucide-react';
import { DailyLoggingChatbotModal } from '../components/DailyLoggingChatbotModal';
import { AiDailyCheckinFloatingNudge } from '../components/AiDailyCheckinFloatingNudge';
import { AiBannerQuickNudge } from '../components/AiBannerQuickNudge';
import { useConsultation } from '../context/ConsultationContext';
import { StressLogScreen } from '../screens/HabitScreens/StressLogScreen';
import { SmokingLogScreen } from '../screens/HabitScreens/SmokingLogScreen';
import { SubstancesLogScreen } from '../screens/HabitScreens/SubstancesLogScreen';
import { IntimacyCheckScreen } from '../screens/HabitScreens/IntimacyCheckScreen';
import { FastingLogScreen } from '../screens/HabitScreens/FastingLogScreen';
import { StillnessLogScreen } from '../screens/HabitScreens/StillnessLogScreen';
import { JoyLogScreen } from '../screens/HabitScreens/JoyLogScreen';
import { SleepLogScreen } from '../screens/HabitScreens/SleepLogScreen';
import { MovementLogScreen } from '../screens/HabitScreens/MovementLogScreen';
import { AlcoholLogScreen } from '../screens/HabitScreens/AlcoholLogScreen';
import { ShopScreen } from '../screens/Shop/ShopScreen';
import { CancerScreeningScreen } from '../screens/HabitScreens/CancerScreeningScreen';
import { IndianCancersScreen } from '../screens/HabitScreens/IndianCancersScreen';
import { ObesityLogScreen } from '../screens/HabitScreens/ObesityLogScreen';
import { DentalLogScreen } from '../screens/HabitScreens/DentalLogScreen';
import { GastritisLogScreen } from '../screens/HabitScreens/GastritisLogScreen';
import { GeneticLogScreen } from '../screens/HabitScreens/GeneticLogScreen';
import { AntioxidantLogScreen } from '../screens/HabitScreens/AntioxidantLogScreen';
import { EnvironmentalExposuresLogScreen } from '../screens/HabitScreens/EnvironmentalExposuresLogScreen';
import { ModeSwitcher } from '../components/ModeSwitcher';
import { Dashboard } from './Dashboard';
import { TodaysFocusCard } from '../components/TodaysFocusCard';
import { AgeingModule } from '../modules/AgeingModule';
import { PCODModule } from '../modules/PCODModule';
import { DiabetesModule } from '../modules/DiabetesModule';
import { HypertensionModule } from '../modules/HypertensionModule';
import { CardiacModule } from '../modules/CardiacModule';
import { ParkinsonModule } from '../modules/ParkinsonModule';
// import { ContinueWhereLeftOff } from '../components/ContinueWhereLeftOff';
// import { MitoProgressCard } from '../components/MitoProgressCard';
import { ExploreFeaturesGrid } from '../components/ExploreFeaturesGrid';
import { ContextualShopCard } from '../components/ContextualShopCard';
import { AskMitoDrawer } from '../components/AskMitoDrawer';
import { AiFeatureDiscoveryModal } from '../components/AiFeatureDiscoveryModal';

interface NonCancerDashboardProps {
  onNavigateToTab: (tab: string) => void;
  onGoToCGMDashboard?: () => void;
}

export const NonCancerDashboard: React.FC<NonCancerDashboardProps> = ({ onNavigateToTab, onGoToCGMDashboard }) => {
  // Navigation State for Habit Screens
  const [activeScreen, _setActiveScreen] = useState<string | null>(null);
  const setActiveScreen = (val: string | null) => {
    _setActiveScreen(val);
    (window as any).activeSubScreen = val;
    window.dispatchEvent(new CustomEvent('subScreenChange', { detail: val }));
  };

  useEffect(() => {
    const handleBack = () => {
      if (activeScreen) {
        setActiveScreen(null);
      }
    };
    window.addEventListener('appBackButton', handleBack);
    return () => {
      window.removeEventListener('appBackButton', handleBack);
    };
  }, [activeScreen]);

  const { apiUrl, token, user, activeMode } = useAuth();

  const [habits, setHabits] = useState<HabitLog[]>([]);
  const [shopQuery, setShopQuery] = useState<string>('');
  const [showStressedModal, setShowStressedModal] = useState<boolean>(false);
  const [showCaregiverModal, setShowCaregiverModal] = useState<boolean>(false);
  const [showRecommendation, setShowRecommendation] = useState<boolean>(false);
  const [recommendationReason, setRecommendationReason] = useState<string>('');
  const [upcomingAppt, setUpcomingAppt] = useState<any | null>(null);
  const [isApptDismissed, setIsApptDismissed] = useState<boolean>(false);
  const [showAskMito, setShowAskMito] = useState<boolean>(false);
  const [showChatbotModal, setShowChatbotModal] = useState<boolean>(false);
  const [pendingHabitsCount, setPendingHabitsCount] = useState<number>(0);

  useEffect(() => {
    const handleOpen = () => setShowChatbotModal(true);
    window.addEventListener('openDailyCheckinChatbot', handleOpen);
    return () => window.removeEventListener('openDailyCheckinChatbot', handleOpen);
  }, []);
  const [pendingManualAction, setPendingManualAction] = useState<{ key: string; params?: any } | null>(null);
  const [showAiNudgeModal, setShowAiNudgeModal] = useState<boolean>(false);
  const [showFastingDisclaimer, setShowFastingDisclaimer] = useState<boolean>(false);
  const [fastingStep, setFastingStep] = useState<number>(1);

  const [hasCGMData, setHasCGMData] = useState<boolean>(() => {
    return localStorage.getItem('mito_has_cgm_reports') === 'true';
  });

  const [showTugOfWar, setShowTugOfWarState] = useState<boolean>(() => {
    return localStorage.getItem('mito_show_cgm_dashboard') !== 'true';
  });

  const setShowTugOfWar = (show: boolean) => {
    localStorage.setItem('mito_show_cgm_dashboard', (!show) ? 'true' : 'false');
    setShowTugOfWarState(show);
  };

  useEffect(() => {
    const savedShowCGM = localStorage.getItem('mito_show_cgm_dashboard') === 'true';
    setShowTugOfWarState(!savedShowCGM);
  }, [activeMode]);

  const fetchHabitsAndAppointments = async () => {
    try {
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'all', 30);
      setHabits(logs);
      checkHealthDanger(logs);

      // Calculate pending habits count for today
      const todayStr = new Date().toDateString();
      const todayLogs = logs.filter((h: any) =>
        new Date(h.timestamp || h.createdAt).toDateString() === todayStr
      );
      if (todayLogs.length > 0) {
        localStorage.setItem('mito_last_habit_log_date', todayStr);
      }
      const envHabit = todayLogs.find((h: any) => (h.type || '').toUpperCase() === 'ENVIRONMENTAL');
      const envAnswers = envHabit?.value?.answers || {};

      let wfMode = 'STANDARD';
      if (activeMode === 'TREATMENT') wfMode = 'CANCER_PATIENT';
      else if (activeMode === 'SECONDARY_PREVENTION') wfMode = 'SECONDARY_PREVENTION';

      const [wfRes, reportsRes] = await Promise.all([
        fetch(`${apiUrl}/daily-logging-workflows/active?mode=${wfMode}`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
        fetch(`${apiUrl}/reports`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null)
      ]);

      let activeSteps: string[] = [];
      if (wfRes && wfRes.ok) {
        const wfData = await wfRes.json();
        activeSteps = (wfData?.steps || []).filter((s: any) => s.isEnabled).map((s: any) => s.stepId || s.id || s.title);
      }
      if (activeSteps.length === 0) {
        activeSteps = activeMode === 'TREATMENT'
          ? ['stillness', 'joy', 'stress', 'sleep', 'report_upload']
          : ['sleep', 'movement', 'fasting', 'stillness', 'stress'];
      }

      let reportsLoggedToday = false;
      if (reportsRes && reportsRes.ok) {
        const rData = await reportsRes.json();
        reportsLoggedToday = (rData || []).some((r: any) => new Date(r.createdAt || r.uploadedAt).toDateString() === todayStr);
      }

      const checkStepCompleted = (stepId: string): boolean => {
        const s = (stepId || '').toLowerCase();
        if (s === 'stress' || s === 'caregiver_stress') return todayLogs.some((h: any) => (h.type || '').toUpperCase() === 'STRESS');
        if (s === 'sleep') return todayLogs.some((h: any) => (h.type || '').toUpperCase() === 'SLEEP');
        if (s === 'fasting') return todayLogs.some((h: any) => (h.type || '').toUpperCase() === 'FASTING');
        if (s === 'movement') return todayLogs.some((h: any) => (h.type || '').toUpperCase() === 'MOVEMENT');
        if (s === 'stillness') return todayLogs.some((h: any) => (h.type || '').toUpperCase() === 'STILLNESS');
        if (s === 'joy') return todayLogs.some((h: any) => (h.type || '').toUpperCase() === 'JOY');
        if (s === 'smoking') return todayLogs.some((h: any) => (h.type || '').toUpperCase() === 'SMOKING');
        if (s === 'alcohol') return todayLogs.some((h: any) => (h.type || '').toUpperCase() === 'ALCOHOL');
        if (s === 'antioxidants') return todayLogs.some((h: any) => (h.type || '').toUpperCase() === 'ANTIOXIDANTS');
        if (s === 'report_upload' || s.includes('report')) return reportsLoggedToday || todayLogs.some((h: any) => (h.type || '').toUpperCase().includes('REPORT'));
        if (s === 'env_air') return envAnswers.airQ1 !== undefined && envAnswers.airQ1 !== null;
        if (s === 'env_water') return envAnswers.waterQ1 !== undefined && envAnswers.waterQ1 !== null;
        if (s === 'env_pesticides') return envAnswers.pesticidesQ1 !== undefined && envAnswers.pesticidesQ1 !== null;
        if (s === 'env_microplastics') return envAnswers.microplasticsQ1 !== undefined && envAnswers.microplasticsQ1 !== null;
        return false;
      };

      const pendingCount = activeSteps.filter(s => !checkStepCompleted(s)).length;
      setPendingHabitsCount(pendingCount);
    } catch (err) {
      console.error('Failed to load habits', err);
    }

    // Fetch CGM reports to check if user has uploaded reports
    if (token) {
      try {
        const reportsRes = await fetch(`${apiUrl}/reports`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (reportsRes.ok) {
          const reports = await reportsRes.json();
          const hasUploaded = Array.isArray(reports) && reports.length > 0;
          setHasCGMData(hasUploaded);
          if (hasUploaded) {
            localStorage.setItem('mito_has_cgm_reports', 'true');
          } else {
            localStorage.removeItem('mito_has_cgm_reports');
          }
        }
      } catch (e) {
        console.error('Failed to load CGM reports for focus card', e);
      }
    }

    // Fetch upcoming confirmed appointments
    if (token) {
      try {
        const res = await fetch(`${apiUrl}/patient/appointments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Find first confirmed appointment in the future
          const confirmedFuture = data
            .filter((a: any) => a.status === 'confirmed')
            .sort((a: any, b: any) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())[0];

          if (confirmedFuture) {
            const dismissedId = localStorage.getItem(`dismissed_appt_${confirmedFuture._id}`);
            setIsApptDismissed(!!dismissedId);
          }
          setUpcomingAppt(confirmedFuture || null);
        }
      } catch (e) {
        console.error('Failed to load appointments', e);
      }
    }
  };

  useEffect(() => {
    if (activeScreen === null) {
      fetchHabitsAndAppointments();
    }
  }, [activeScreen, apiUrl, token]);

  const checkHealthDanger = (logs: HabitLog[]) => {
    // Group logs by type and date
    const dailyLogs: { [dateStr: string]: HabitLog[] } = {};
    logs.forEach(l => {
      const dateStr = new Date(l.timestamp).toDateString();
      if (!dailyLogs[dateStr]) dailyLogs[dateStr] = [];
      dailyLogs[dateStr].push(l);
    });

    const last3Days: string[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last3Days.push(d.toDateString());
    }

    const checkDangerForType = (type: string, isDangerFn: (val: any) => boolean): boolean => {
      return last3Days.every(dateStr => {
        const dayLogs = dailyLogs[dateStr] || [];
        const typeLogs = dayLogs.filter(l => l.type === type);
        if (typeLogs.length === 0) return false;
        return typeLogs.some(l => isDangerFn(l.value));
      });
    };

    // Danger criteria:
    // Stress: 'stressed' or 'maxed'
    if (checkDangerForType('Stress', (val) => val.faceId === 'stressed' || val.faceId === 'maxed')) {
      setRecommendationReason('High Stress');
      setShowRecommendation(true);
      return;
    }
    // Sleep: hours <= 5
    if (checkDangerForType('Sleep', (val) => val.hours <= 5)) {
      setRecommendationReason('Sleep Issues');
      setShowRecommendation(true);
      return;
    }
    // Smoking: count >= 5
    if (checkDangerForType('Smoking', (val) => val.count >= 5)) {
      setRecommendationReason('Smoking');
      setShowRecommendation(true);
      return;
    }
    // Sex Health: happy === false
    if (checkDangerForType('Intimacy', (val) => val.happy === false)) {
      setRecommendationReason('Sex Health');
      setShowRecommendation(true);
      return;
    }

    setShowRecommendation(false);
  };

  const [timePeriod, setTimePeriod] = useState<'today' | 'weekly' | 'monthly'>('today');
  const [forcesView, setForcesView] = useState<'all' | 'damage' | 'repair'>('all');

  const getFilteredPeriodHabits = (allHabits: HabitLog[], period: 'today' | 'weekly' | 'monthly') => {
    const now = new Date();
    if (period === 'today') {
      const todayStr = now.toDateString();
      return allHabits.filter(h => new Date(h.timestamp).toDateString() === todayStr);
    }
    if (period === 'weekly') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return allHabits.filter(h => new Date(h.timestamp).getTime() >= sevenDaysAgo.getTime());
    }
    // monthly
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return allHabits.filter(h => new Date(h.timestamp).getTime() >= thirtyDaysAgo.getTime());
  };

  const periodHabits = getFilteredPeriodHabits(habits, timePeriod);
  const todaysHabits = getFilteredPeriodHabits(habits, 'today');

  const getCancerLoggedGuidelines = () => {
    let fastingLogged = false;
    let movementLogged = false;
    let stillnessLogged = false;
    let joyLogged = false;

    todaysHabits.forEach(h => {
      if (h.type === 'Fasting') fastingLogged = true;
      if (h.type === 'Movement' && h.value?.minutes >= 20) movementLogged = true;
      if (h.type === 'Stillness' && h.value?.sat === true) stillnessLogged = true;
      if (h.type === 'Joy' && h.value?.done !== false) joyLogged = true;
    });

    return {
      fasting: fastingLogged,
      movement: movementLogged,
      stillness: stillnessLogged,
      joy: joyLogged,
      count: (fastingLogged ? 1 : 0) + (movementLogged ? 1 : 0) + (stillnessLogged ? 1 : 0) + (joyLogged ? 1 : 0)
    };
  };

  const cancerGuidelines = getCancerLoggedGuidelines();

  // Get the most recent log per habit type for current period
  const getLatestLogForTypes = (...types: string[]) => {
    const uppercaseTypes = types.map(t => t.toUpperCase());
    const matching = periodHabits.filter(h => {
      const t = (h.type || '').toUpperCase();
      return uppercaseTypes.some(ut => t.includes(ut));
    });
    if (matching.length === 0) return null;
    return matching.sort((a, b) => new Date(b.timestamp || (b as any).createdAt || 0).getTime() - new Date(a.timestamp || (a as any).createdAt || 0).getTime())[0];
  };

  const calculateDamageCount = () => {
    let count = 0;
    const categories = ['STRESS', 'SLEEP', 'SMOKING', 'ALCOHOL', 'SUBSTANCES', 'INTIMACY', 'DENTAL', 'GASTRITIS', 'GENETIC', 'ENVIRONMENT'];
    categories.forEach(cat => {
      const latest = getLatestLogForTypes(cat);
      if (!latest) return;
      const typeUpper = (latest.type || '').toUpperCase();
      const val = latest.value;
      const optStr = (typeof val === 'object' ? (val.option || val.notes || val.faceId || '') : `${val}`).toLowerCase();

      if (typeUpper.includes('STRESS') && (optStr.includes('tense') || optStr.includes('high') || optStr.includes('stressed') || optStr.includes('maxed') || val === 3 || val?.faceId === 'tense' || val?.faceId === 'stressed' || val?.faceId === 'maxed')) count += 1;
      if (typeUpper.includes('SLEEP') && ((typeof val === 'number' && val < 6) || val?.hours < 6 || val?.quality === 'poor' || optStr.includes('poor'))) count += 1;
      if ((typeUpper.includes('SMOKING') || typeUpper.includes('ALCOHOL')) && ((typeof val === 'number' && val > 0) || val?.count > 0 || val?.drinks > 0 || optStr.includes('smoke') || optStr.includes('drink') || optStr.includes('both'))) count += 1;
      if (typeUpper.includes('SUBSTANCES') && (val === 1 || val?.used === true || optStr.includes('exposure'))) count += 1;
      if (typeUpper.includes('INTIMACY') && (val?.happy === false)) count += 1;
      if (typeUpper.includes('DENTAL') && (val?.sharpTooth === true || val?.tobacco === true || val?.illFittingDenture === true || optStr.includes('discomfort'))) count += 1;
      if (typeUpper.includes('GASTRITIS') && (val?.gastritis === true || optStr.includes('gastritis') || optStr.includes('acidity'))) count += 1;
      if (typeUpper.includes('GENETIC') && (val?.geneticLink === true || optStr.includes('family'))) count += 1;
      if ((typeUpper.includes('ENVIRONMENT') || typeUpper.includes('DAMAGE')) && (val === 1 || val?.score < 0 || val?.isExposure === true || optStr.includes('chemical') || optStr.includes('junk'))) count += 1;
    });
    return count;
  };

  const calculateRepairCount = () => {
    let count = 0;
    const categories = ['STRESS', 'SLEEP', 'SMOKING', 'ALCOHOL', 'SUBSTANCES', 'FASTING', 'ANTIOXIDANTS', 'MOVEMENT', 'STILLNESS', 'JOY', 'SAFERPRODUCTS', 'CANCERSCREENING', 'INTIMACY'];
    categories.forEach(cat => {
      const latest = getLatestLogForTypes(cat);
      if (!latest) return;
      const typeUpper = (latest.type || '').toUpperCase();
      const val = latest.value;
      const optStr = (typeof val === 'object' ? (val.option || val.notes || val.faceId || '') : `${val}`).toLowerCase();

      if (typeUpper.includes('STRESS') && (optStr.includes('calm') || optStr.includes('steady') || optStr.includes('no stress') || val === 1 || val?.faceId === 'calm')) count += 1;
      if (typeUpper.includes('SLEEP') && ((typeof val === 'number' && val >= 6) || (val?.hours >= 6 && val?.quality !== 'poor'))) count += 1;
      if ((typeUpper.includes('SMOKING') || typeUpper.includes('ALCOHOL')) && ((typeof val === 'number' && val === 0) || val?.count === 0 || val?.drinks === 0 || optStr.includes('clean') || optStr.includes('no alcohol') || optStr.includes('no (clean'))) count += 1;
      if (typeUpper.includes('SUBSTANCES') && (val === 0 || val?.used === false || optStr.includes('clean'))) count += 1;
      if (typeUpper.includes('FASTING') && (val === 1 || val?.hours >= 12 || typeof val === 'object' || optStr.includes('yes') || optStr.includes('16') || optStr.includes('12'))) count += 1;
      if (typeUpper.includes('ANTIOXIDANTS') && (val === 1 || val?.consumed === true || optStr.includes('yes') || optStr.includes('consumed'))) count += 1;
      if (typeUpper.includes('MOVEMENT') && (val === 1 || val?.minutes >= 20 || typeof val === 'number' || optStr.includes('walk') || optStr.includes('run') || optStr.includes('30+') || optStr.includes('yoga'))) count += 1;
      if (typeUpper.includes('STILLNESS') && (val === 1 || val?.sat === true || optStr.includes('yes') || optStr.includes('practiced'))) count += 1;
      if ((typeUpper.includes('JOY') || typeUpper.includes('REPAIR')) && (val === 1 || val?.done !== false || val?.isCompleted === true || optStr.includes('yes'))) count += 1;
      if (typeUpper.includes('SAFERPRODUCTS') && (val === 1 || typeof val === 'object')) count += 1;
      if (typeUpper.includes('CANCERSCREENING') && (val === 1 || typeof val === 'object')) count += 1;
      if (typeUpper.includes('INTIMACY') && (val?.happy === true)) count += 1;
    });
    return count;
  };

  const damageCount = calculateDamageCount();
  const repairCount = calculateRepairCount();
  const totalLogs = periodHabits.length;

  // Calculate Streak
  let streak = 0;
  const uniqueDates = [...new Set(habits.map(h => new Date(h.timestamp).toDateString()))];
  const sortedDates = uniqueDates
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentCheckDate = new Date(today);

  if (sortedDates.length > 0) {
    if (sortedDates[0].getTime() !== today.getTime()) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (sortedDates[0].getTime() === yesterday.getTime()) {
        currentCheckDate = new Date(yesterday);
      } else {
        streak = 0;
      }
    }

    if (streak !== 0 || sortedDates[0].getTime() === today.getTime() || sortedDates[0].getTime() === currentCheckDate.getTime()) {
      for (let i = 0; i < sortedDates.length; i++) {
        if (sortedDates[i].getTime() === currentCheckDate.getTime()) {
          streak++;
          currentCheckDate.setDate(currentCheckDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  const getDentalScore = () => {
    const latest = getLatestLogForTypes('DENTAL');
    if (!latest) return null;
    const val = latest.value;
    const optStr = (typeof val === 'object' ? (val.option || val.notes || '') : `${val}`).toLowerCase();
    if (val === 1 || val?.sharpTooth === true || val?.tobacco === true || val?.illFittingDenture === true || optStr.includes('discomfort')) return -1;
    return 0;
  };

  const getGastritisScore = () => {
    const latest = getLatestLogForTypes('GASTRITIS');
    if (!latest) return null;
    const val = latest.value;
    const optStr = (typeof val === 'object' ? (val.option || val.notes || '') : `${val}`).toLowerCase();
    if (val === 1 || val?.gastritis === true || optStr.includes('gastritis') || optStr.includes('acidity')) return -1;
    return 0;
  };

  const getGeneticScore = () => {
    const latest = getLatestLogForTypes('GENETIC');
    if (!latest) return null;
    const val = latest.value;
    const optStr = (typeof val === 'object' ? (val.option || val.notes || '') : `${val}`).toLowerCase();
    if (val === 1 || val?.geneticLink === true || optStr.includes('family')) return -1;
    return 0;
  };

  const getStressScore = () => {
    const latest = getLatestLogForTypes('STRESS');
    if (!latest) return null;
    const val = latest.value;
    const optStr = (typeof val === 'object' ? (val.option || val.notes || val.faceId || '') : `${val}`).toLowerCase();
    if (optStr.includes('tense') || optStr.includes('high') || optStr.includes('stressed') || optStr.includes('maxed') || val === 3 || val?.faceId === 'tense' || val?.faceId === 'stressed' || val?.faceId === 'maxed') return -1;
    if (optStr.includes('calm') || optStr.includes('steady') || optStr.includes('no stress') || val === 1 || val?.faceId === 'calm' || val?.faceId === 'steady') return 0;
    return 0;
  };

  const getSleepScore = () => {
    const latest = getLatestLogForTypes('SLEEP');
    if (!latest) return null;
    const val = latest.value;
    const optStr = (typeof val === 'object' ? (val.option || val.notes || '') : `${val}`).toLowerCase();
    if ((typeof val === 'number' && val < 6) || val?.hours < 6 || val?.quality === 'poor' || optStr.includes('poor')) return -1;
    return 0;
  };

  const getSmokingScore = () => {
    const latest = getLatestLogForTypes('SMOKING');
    if (!latest) return null;
    const val = latest.value;
    const optStr = (typeof val === 'object' ? (val.option || val.notes || '') : `${val}`).toLowerCase();
    if ((typeof val === 'number' && val > 0) || val?.count > 0 || optStr.includes('smoke') || optStr.includes('yes')) return -1;
    return 0;
  };

  const getAlcoholScore = () => {
    const latest = getLatestLogForTypes('ALCOHOL');
    if (!latest) return null;
    const val = latest.value;
    const optStr = (typeof val === 'object' ? (val.option || val.notes || '') : `${val}`).toLowerCase();
    if ((typeof val === 'number' && val > 0) || val?.drinks > 0 || optStr.includes('drink') || optStr.includes('heavy')) return -1;
    return 0;
  };

  const getSubstancesScore = () => {
    const latest = getLatestLogForTypes('SUBSTANCE');
    if (!latest) return null;
    const val = latest.value;
    const optStr = (typeof val === 'object' ? (val.option || val.notes || '') : `${val}`).toLowerCase();
    if (val === 1 || val?.used === true || optStr.includes('exposure') || optStr.includes('yes')) return -1;
    return 0;
  };

  const getObesityScore = () => {
    if (!user?.height || !user?.weight) return null;
    const bmi = user.weight / Math.pow(user.height / 100, 2);
    if (bmi >= 25) return -1;
    return 0;
  };

  const getFastingScore = () => {
    const latest = getLatestLogForTypes('FASTING', 'REPAIR');
    if (!latest) return null;
    const val = latest.value;
    const optStr = (typeof val === 'object' ? (val.option || val.notes || '') : `${val}`).toLowerCase();
    if (val === 1 || val?.hours >= 12 || typeof val === 'object' || optStr.includes('yes') || optStr.includes('16') || optStr.includes('12')) return 1;
    return 0;
  };

  const getAntioxidantsScore = () => {
    const latest = getLatestLogForTypes('ANTIOXIDANT');
    if (!latest) return null;
    const val = latest.value;
    const optStr = (typeof val === 'object' ? (val.option || val.notes || '') : `${val}`).toLowerCase();
    if (val === 1 || val?.consumed === true || optStr.includes('yes') || optStr.includes('consumed')) return 1;
    return 0;
  };

  const getMovementScore = () => {
    const latest = getLatestLogForTypes('MOVEMENT');
    if (!latest) return null;
    const val = latest.value;
    const optStr = (typeof val === 'object' ? (val.option || val.notes || '') : `${val}`).toLowerCase();
    if (val === 1 || val?.minutes >= 20 || typeof val === 'number' || optStr.includes('walk') || optStr.includes('run') || optStr.includes('30+') || optStr.includes('yoga')) return 1;
    return 0;
  };

  const getStillnessScore = () => {
    const latest = getLatestLogForTypes('STILLNESS');
    if (!latest) return null;
    const val = latest.value;
    const optStr = (typeof val === 'object' ? (val.option || val.notes || '') : `${val}`).toLowerCase();
    if (val === 1 || val?.sat === true || optStr.includes('yes') || optStr.includes('practiced')) return 1;
    return 0;
  };

  const getJoyScore = () => {
    const latest = getLatestLogForTypes('JOY');
    if (!latest) return null;
    const val = latest.value;
    const optStr = (typeof val === 'object' ? (val.option || val.notes || '') : `${val}`).toLowerCase();
    if (val === 1 || val?.done !== false || val?.isCompleted === true || optStr.includes('yes')) return 1;
    return 0;
  };

  const getSaferProductsScore = () => {
    const latest = getLatestLogForTypes('SAFERPRODUCT');
    if (!latest) return null;
    return 1;
  };

  const getEnvironmentalScore = () => {
    const latest = getLatestLogForTypes('ENVIRONMENT', 'DAMAGE');
    if (!latest) return null;
    const val = latest.value;
    const optStr = (typeof val === 'object' ? (val.option || val.notes || '') : `${val}`).toLowerCase();
    if (val === 1 || val?.score < 0 || val?.isExposure === true || optStr.includes('chemical') || optStr.includes('junk')) return -1;
    return 0;
  };

  // Calculate percentages for the tug-of-war bar
  const damagePct = totalLogs === 0 ? 50 : (damageCount / totalLogs) * 100;
  const repairPct = totalLogs === 0 ? 50 : (repairCount / totalLogs) * 100;

  const neutralCount = Math.max(0, totalLogs - damageCount - repairCount);

  // Pie chart data
  const chartData = totalLogs === 0
    ? [{ name: 'Empty', value: 1, color: '#f1f5f9' }] // slate-100
    : [
      ...(damageCount > 0 ? [{ name: 'Damage', value: damageCount, color: '#f43f5e' }] : []),
      ...(repairCount > 0 ? [{ name: 'Repair', value: repairCount, color: '#10b981' }] : []),
      ...(neutralCount > 0 ? [{ name: 'Neutral', value: neutralCount, color: '#94a3b8' }] : [])
    ];

  const { setPendingRecommendationId } = useConsultation();

  const handleBookAppt = (recommendationId: string) => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(recommendationId);
    const resolvedId = isObjectId ? recommendationId : `pending_${recommendationId}`;
    setPendingRecommendationId(resolvedId);
    onNavigateToTab('Book Appointment');
  };

  const renderActiveScreen = () => {
    if (activeScreen === 'Stress') return <StressLogScreen onBack={() => setActiveScreen(null)} onBookAppointment={handleBookAppt} onNavigateToIntimacy={() => setActiveScreen('Intimacy')} />;
    if (activeScreen === 'Smoking') return <SmokingLogScreen onBack={() => setActiveScreen(null)} onBookAppointment={handleBookAppt} />;
    if (activeScreen === 'Substances') return <SubstancesLogScreen onBack={() => setActiveScreen(null)} />;
    if (activeScreen === 'Intimacy') return <IntimacyCheckScreen onBack={() => setActiveScreen(null)} onBookAppointment={handleBookAppt} />;
    if (activeScreen === 'Environmental') return <EnvironmentalExposuresLogScreen onBack={() => setActiveScreen(null)} onBookAppointment={handleBookAppt} onNavigateToShop={(query) => { setShopQuery(query); setActiveScreen('EnvironmentalShop'); }} />;
    if (activeScreen === 'EnvironmentalShop') {
      if (shopQuery === 'SaferProducts') {
        return <ShopScreen type="SaferProducts" onBack={() => setActiveScreen('Environmental')} />;
      }
      return <ShopScreen type="All" defaultSearch={shopQuery} onBack={() => setActiveScreen('Environmental')} />;
    }
    if (activeScreen === 'Sleep') return <SleepLogScreen onBack={() => setActiveScreen(null)} onBookAppointment={handleBookAppt} />;
    if (activeScreen === 'Movement') return <MovementLogScreen onBack={() => setActiveScreen(null)} />;
    if (activeScreen === 'Alcohol') return <AlcoholLogScreen onBack={() => setActiveScreen(null)} onBookAppointment={handleBookAppt} />;
    if (activeScreen === 'Fasting') return <FastingLogScreen onBack={() => setActiveScreen(null)} />;
    if (activeScreen === 'Stillness') return <StillnessLogScreen onBack={() => setActiveScreen(null)} />;
    if (activeScreen === 'Joy') return <JoyLogScreen onBack={() => setActiveScreen(null)} />;
    if (activeScreen === 'Antioxidants') return <AntioxidantLogScreen onBack={() => setActiveScreen(null)} onViewShop={() => setActiveScreen('AntioxidantsShop')} onNavigateToDiagnostics={() => setActiveScreen('CancerScreening')} />;
    if (activeScreen === 'AntioxidantsShop') return <ShopScreen type="Antioxidants" onBack={() => setActiveScreen('Antioxidants')} />;
    if (activeScreen === 'SaferProducts') return <ShopScreen type="SaferProducts" onBack={() => setActiveScreen(null)} />;
    if (activeScreen === 'CancerScreening') return <CancerScreeningScreen onBack={() => setActiveScreen(null)} />;
    if (activeScreen === 'IndianCancers') return <IndianCancersScreen onBack={() => setActiveScreen(null)} />;
    if (activeScreen === 'Obesity') return <ObesityLogScreen onBack={() => setActiveScreen(null)} onBookAppointment={handleBookAppt} />;
    if (activeScreen === 'Dental') return <DentalLogScreen onBack={() => setActiveScreen(null)} onBookAppointment={handleBookAppt} />;
    if (activeScreen === 'Gastritis') return <GastritisLogScreen onBack={() => setActiveScreen(null)} onBookAppointment={handleBookAppt} onNavigateToShop={(query) => { setShopQuery(query); setActiveScreen('GastritisShop'); }} />;
    if (activeScreen === 'GastritisShop') return <ShopScreen type="All" defaultSearch={shopQuery} onBack={() => setActiveScreen('Gastritis')} />;
    if (activeScreen === 'Genetic') return <GeneticLogScreen onBack={() => setActiveScreen(null)} onBookAppointment={handleBookAppt} onNavigateToShop={(query) => { setShopQuery(query); setActiveScreen('GeneticShop'); }} />;
    if (activeScreen === 'GeneticShop') return <ShopScreen type="All" defaultSearch={shopQuery} onBack={() => setActiveScreen('Genetic')} />;
    if (activeScreen === 'WigShop') return <ShopScreen type="All" defaultSearch="wig" onBack={() => setActiveScreen(null)} />;
    return null;
  };

  const activeScreenComponent = renderActiveScreen();
  if (activeScreenComponent) {
    const isShopScreen = activeScreen === 'AntioxidantsShop' || activeScreen === 'SaferProducts' || activeScreen === 'GastritisShop' || activeScreen === 'GeneticShop' || activeScreen === 'WigShop' || activeScreen === 'EnvironmentalShop';

    const getScreenTitle = (screen: string | null) => {
      switch (screen) {
        case 'Stress': return 'Stress';
        case 'Smoking': return 'Smoking';
        case 'Substances': return 'Substances';
        case 'Intimacy': return 'Intimacy';
        case 'Environmental': return 'Environment';
        case 'Sleep': return 'Sleep Debt';
        case 'Movement': return 'Movement';
        case 'Alcohol': return 'Alcohol';
        case 'Fasting': return 'Intermittent Fasting';
        case 'Stillness': return 'Stillness';
        case 'Joy': return 'Things You Love';
        case 'Antioxidants': return 'Antioxidants';
        case 'CancerScreening': return 'Cancer Screening';
        case 'IndianCancers': return 'Indian Cancers & Risks';
        case 'Obesity': return 'Obesity';
        case 'Dental': return 'Dental Health';
        case 'Gastritis': return 'Gastritis';
        case 'Genetic': return 'Genetic Link';
        default: return '';
      }
    };

    return (
      <div className={`sub-page-safe-wrapper min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col ${isShopScreen ? 'is-shop' : ''}`}>
        {!isShopScreen && (
          <header className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 z-50 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 w-full flex items-center gap-4 transition-colors duration-300">
            <button
              onClick={() => setActiveScreen(null)}
              className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase block">
                {activeScreen === 'IndianCancers' ? 'Cancer Awareness' : 'Track Habit'}
              </span>
              <h2 className="text-xl font-sans font-bold text-slate-800 dark:text-slate-100 leading-none mt-0.5">
                {getScreenTitle(activeScreen)}
              </h2>
            </div>
          </header>
        )}
        {!isShopScreen && (
          <div className="px-4 pt-4 max-w-5xl w-full mx-auto">
            <AiBannerQuickNudge onOpenAiCheckin={() => setShowChatbotModal(true)} />
          </div>
        )}

        <div className="sub-page-body flex-1">
          {activeScreenComponent}
        </div>

        {/* AI Daily Logging Chatbot Modal */}
        <DailyLoggingChatbotModal
          isOpen={showChatbotModal}
          onClose={() => setShowChatbotModal(false)}
          apiUrl={apiUrl}
          token={token}
          userMode={activeMode as any}
          onRefreshDashboard={() => fetchHabitsAndAppointments()}
        />
      </div>
    );
  }

  const isCancerPatient = activeMode === 'TREATMENT';

  const handleOpenHabit = (screenName: string) => {
    if (isCancerPatient) {
      if (screenName === 'Fasting') {
        setShowFastingDisclaimer(true);
        setFastingStep(1);
        return;
      }
      if (screenName !== 'Joy') {
        setShowTugOfWar(false);
        return;
      }
    }
    setActiveScreen(screenName);
  };

  // Treatment Mode
  if (activeMode === 'TREATMENT' && !showTugOfWar) {
    return (
      <div className="pb-36 pt-4 px-0 max-w-5xl mx-auto bg-gradient-to-b from-slate-50/90 to-slate-100/80 dark:from-slate-950/90 dark:to-slate-900/80 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-200 transition-colors duration-300">
        {/* <ModeSwitcher /> */}
        <Dashboard onNavigateToTab={onNavigateToTab} onBackToTugOfWar={() => setShowTugOfWar(true)} />
      </div>
    );
  }



  const executeManualAction = (key: string, _params?: any) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'environmental_exposures' || lowerKey === 'environment' || lowerKey === 'environmental') return setActiveScreen('Environmental');
    if (lowerKey === 'antioxidants') return setActiveScreen('Antioxidants');
    if (lowerKey === 'genetics' || lowerKey === 'genetic') return setActiveScreen('Genetic');
    if (lowerKey === 'fasting') return setActiveScreen('Fasting');
    if (lowerKey === 'stress') return setActiveScreen('Stress');
    if (lowerKey === 'sleep') return setActiveScreen('Sleep');
    if (lowerKey === 'movement' || lowerKey === 'exercise') return setActiveScreen('Movement');
    if (lowerKey === 'cancer_screening' || lowerKey === 'cancerscreening') return setActiveScreen('CancerScreening');
    if (key === 'Book Appointment' || lowerKey === 'book appointment') return onNavigateToTab('Book Appointment');
    if (key === 'Reports' || lowerKey === 'reports') return onNavigateToTab('Reports');
    if (key === 'Food Log' || lowerKey === 'food log') return onNavigateToTab('Food Log');
    if (key === 'Educational' || lowerKey === 'educational') return onNavigateToTab('Educational');
    if (lowerKey === 'shop_all' || lowerKey === 'recommended_products') return setActiveScreen('SaferProducts');
    if (lowerKey === 'shop_wigs' || lowerKey === 'wigs') return setActiveScreen('WigShop');
    if (lowerKey === 'water') {
      setShopQuery('Water filter');
      return setActiveScreen('EnvironmentalShop');
    }
  };

  const handleActionKey = (key: string, params?: any) => {
    if (!key) return;
    const lowerKey = key.toLowerCase();

    if (params?.search) {
      setShopQuery(params.search);
      if (params.search.toLowerCase() === 'wig') return setActiveScreen('WigShop');
      return setActiveScreen('EnvironmentalShop');
    }

    // Intercept manual habit logging & report upload clicks to show AI Check-in discovery nudge!
    const isManualHabitOrReport = ['fasting', 'stress', 'sleep', 'movement', 'exercise', 'cancer_screening', 'reports'].includes(lowerKey);

    if (isManualHabitOrReport) {
      setPendingManualAction({ key, params });
      setShowAiNudgeModal(true);
      return;
    }

    executeManualAction(key, params);
  };

  return (
    <div className="pb-24 pt-4 px-3.5 sm:px-4 max-w-5xl mx-auto bg-gradient-to-b from-slate-50/90 to-slate-100/80 dark:from-slate-900/90 dark:to-slate-950/80 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-200 transition-colors duration-300">

      {/* Feature Discovery & Ask Mito Modals */}
      <AskMitoDrawer
        isOpen={showAskMito}
        onClose={() => setShowAskMito(false)}
        onNavigateToTab={onNavigateToTab}
      />

      {/* Top Greeting & Action Bar */}
      <div className="mb-4">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
          Welcome back
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight mt-0.5">
          Hello, {user?.name || 'Friend'}
        </h2>
      </div>

      <ModeSwitcher />

      {/* SPECIALIZED MULTI-CONDITION HEALTH MODULES (Ageing, PCOD, Diabetes, Hypertension, Parkinson's, Cardiac) */}
      {activeMode === 'AGEING' && (
        <div className="mb-6">
          <AgeingModule />
        </div>
      )}
      {activeMode === 'PCOD' && (
        <div className="mb-6">
          <PCODModule />
        </div>
      )}
      {activeMode === 'DIABETES' && (
        <div className="mb-6">
          <DiabetesModule />
        </div>
      )}
      {activeMode === 'HYPERTENSION' && (
        <div className="mb-6">
          <HypertensionModule />
        </div>
      )}
      {activeMode === 'PARKINSON' && (
        <div className="mb-6">
          <ParkinsonModule />
        </div>
      )}
      {activeMode === 'CARDIAC' && (
        <div className="mb-6">
          <CardiacModule />
        </div>
      )}

      {/* RENDER CANCER PREVENTION/RECURRENCE DASHBOARD ONLY WHEN IN CANCER MODES */}
      {!['AGEING', 'PCOD', 'DIABETES', 'HYPERTENSION', 'PARKINSON', 'CARDIAC'].includes(activeMode) && (
        <>
          {/* PRIMARY DASHBOARD SECTION: Today's Focus */}
          <div className="mb-4">
            <TodaysFocusCard
              activeMode={activeMode as any}
              habits={habits}
              hasCGMData={hasCGMData}
              upcomingAppt={upcomingAppt}
              onTakeAction={(actionKey) => handleActionKey(actionKey)}
            />
          </div>

      {/* SECONDARY DASHBOARD SECTION: Continue Where You Left Off (Hidden for future implementation) */}
      {/* 
      <ContinueWhereLeftOff
        activeMode={activeMode as any}
        habits={habits}
        upcomingAppt={upcomingAppt}
        hasCGMData={false}
        onContinue={(actionKey) => handleActionKey(actionKey)}
      />
      */}

      {/* TERTIARY DASHBOARD SECTION: Mito Progress Score (Hidden for future implementation) */}
      {/* 
      <MitoProgressCard
        activeMode={activeMode as any}
        habits={habits}
        hasCGMData={false}
        upcomingAppt={upcomingAppt}
        onTakeImprovementAction={(actionKey) => handleActionKey(actionKey)}
      />
      */}

      {/* Continuous Health Monitoring Danger recommendation */}
      {showRecommendation && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-bounce">
          <div className="flex-1">
            <h4 className="font-bold text-amber-800 text-sm">Action Recommended</h4>
            <p className="text-xs text-amber-700 mt-1">
              Based on your recent health records for {recommendationReason}, we recommend consulting a doctor. Would you like to book an appointment?
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('Book Appointment')}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm shrink-0"
          >
            Book Appointment
          </button>
        </div>
      )}

      {/* Upcoming Confirmed Appointment Alert Banner */}
      {upcomingAppt && !isApptDismissed && (
        <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl p-4 mb-6 shadow-[0_4px_20px_rgba(16,185,129,0.05)] flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 shrink-0 mt-0.5">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-xs">Upcoming Consultation Scheduled</h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                Appointment with <strong>Dr. {upcomingAppt.doctorId?.name || 'Specialist'}</strong> is scheduled on <strong>{upcomingAppt.date}</strong> at <strong>{upcomingAppt.time}</strong>.
              </p>
              {upcomingAppt.meetingLink && (
                <a
                  href={upcomingAppt.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
                >
                  {upcomingAppt.meetingLink.includes('calendar.app.google') || upcomingAppt.meetingLink.includes('calendar.google.com')
                    ? 'Open Google Calendar Invite'
                    : 'Join Google Meet'}
                </a>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.setItem(`dismissed_appt_${upcomingAppt._id}`, 'true');
              setIsApptDismissed(true);
            }}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all shrink-0"
            title="Dismiss Alert"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {!isCancerPatient && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/80 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-3xl p-4 sm:p-5 mb-5 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4 gap-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wider uppercase shrink-0">Cellular Balance</span>

            {/* History Selector Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
              <button
                type="button"
                onClick={() => setTimePeriod('today')}
                className={`px-2 py-0.5 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all ${timePeriod === 'today'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
                  }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setTimePeriod('weekly')}
                className={`px-2 py-0.5 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all ${timePeriod === 'weekly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
                  }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setTimePeriod('monthly')}
                className={`px-2 py-0.5 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all ${timePeriod === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
                  }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-5">
            {/* Dynamic Half-Circle Chart */}
            <div className="relative w-20 h-20 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={26}
                    outerRadius={36}
                    startAngle={180}
                    endAngle={-180}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-slate-800 dark:text-slate-100 leading-none">{totalLogs}</span>
                <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Logs</span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <h3 className="text-base font-sans text-slate-800 dark:text-slate-100 font-bold leading-tight">
                  {timePeriod === 'today' ? 'Daily Overview' : timePeriod === 'weekly' ? '7-Day Summary' : '30-Day History'}
                </h3>
                {timePeriod === 'today' && (
                  <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 shrink-0 shadow-2xs flex items-center gap-1">
                    <span>🔥</span>
                    <span>{streak > 0 ? `${streak} DAY STREAK` : '0 DAY STREAK'}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {timePeriod === 'today'
                  ? 'Log habits today to update your daily balance.'
                  : timePeriod === 'weekly'
                    ? 'Accumulated balance for the last 7 days.'
                    : 'Accumulated balance for the last 30 days.'}
              </p>
            </div>
          </div>

          {/* Tug of war bar */}
          <div className="relative w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 flex overflow-hidden shadow-inner">
            <div className="h-full bg-rose-500 transition-all duration-700 ease-out" style={{ width: `${damagePct}%` }}></div>
            <div className="h-full bg-emerald-500 transition-all duration-700 ease-out" style={{ width: `${repairPct}%` }}></div>
            {/* Center puck */}
            <div
              className="absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md flex items-center justify-center transition-all duration-700 ease-out"
              style={{ left: `${damagePct}%` }}
            >
              <Activity className="h-2.5 w-2.5 text-slate-400" />
            </div>
          </div>
          <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest px-1">
            <span className="text-rose-500 flex items-center gap-1"><Skull className="h-2.5 w-2.5" /> Damage</span>
            <span className="text-emerald-500 flex items-center gap-1">Repair <Leaf className="h-2.5 w-2.5" /></span>
          </div>
          <div className="flex justify-between items-center text-[8.5px] text-slate-400 mt-0.5 px-1">
            <span>{damageCount} active</span>
            <span>{repairCount} active</span>
          </div>
        </div>
      )}

      {!isCancerPatient && (
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono font-bold">01</span>
            <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">
              Track the two forces ({timePeriod === 'today' ? 'Today' : timePeriod === 'weekly' ? 'This Week' : 'This Month'})
            </span>
          </div>

          {/* Force Filter Segmented Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setForcesView('all')}
              className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] uppercase tracking-wider transition-all ${forcesView === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setForcesView('damage')}
              className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] uppercase tracking-wider transition-all ${forcesView === 'damage'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                }`}
            >
              Damage ({damageCount})
            </button>
            <button
              type="button"
              onClick={() => setForcesView('repair')}
              className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] uppercase tracking-wider transition-all ${forcesView === 'repair'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
            >
              Repair ({repairCount})
            </button>
          </div>
        </div>
      )}

      <div className={`${isCancerPatient ? 'w-full mb-4' : 'grid grid-cols-2 gap-2 sm:gap-3 mb-6 items-start'}`}>
        {/* Damage Column (Left) */}
        {!isCancerPatient && (forcesView === 'all' || forcesView === 'damage') && (
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-rose-100 dark:border-rose-900/30 shadow-[0_8px_30px_rgba(225,29,72,0.03)] rounded-2xl sm:rounded-3xl p-1.5 sm:p-3 flex flex-col h-fit self-start transition-colors duration-300">
            <div className="px-1 pt-1 pb-2 flex items-center justify-between">
              <div>
                <h3 className="text-rose-500 font-sans text-xs sm:text-base font-bold flex items-center gap-1 mb-0.5">
                  <Skull className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Damage
                </h3>
                <p className="text-[7px] sm:text-[8px] text-slate-400 font-bold uppercase tracking-widest">Reduce the load</p>
              </div>
              <span className="text-[8px] sm:text-[9px] font-extrabold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-1.5 sm:px-2 py-0.5 rounded-full border border-rose-200/50 dark:border-rose-900/40 shrink-0">
                {damageCount} active
              </span>
            </div>

            <div className="flex flex-col gap-1 sm:gap-1.5">
              <HabitItem icon={<Frown className="h-3.5 w-3.5 text-amber-500" />} label="Stress" onClick={() => handleOpenHabit('Stress')} score={getStressScore()} />
              <HabitItem icon={<Moon className="h-3.5 w-3.5 text-indigo-400" />} label="Sleep debt" onClick={() => handleOpenHabit('Sleep')} score={getSleepScore()} />
              <HabitItem icon={<Cigarette className="h-3.5 w-3.5 text-slate-400" />} label="Smoking" onClick={() => handleOpenHabit('Smoking')} score={getSmokingScore()} />
              <HabitItem icon={<Wine className="h-3.5 w-3.5 text-rose-600" />} label="Alcohol" onClick={() => handleOpenHabit('Alcohol')} score={getAlcoholScore()} />
              <HabitItem icon={<Pill className="h-3.5 w-3.5 text-amber-500" />} label="Substances" onClick={() => handleOpenHabit('Substances')} score={getSubstancesScore()} />
              <HabitItem icon={<Globe className="h-3.5 w-3.5 text-cyan-500" />} label="Environment" onClick={() => handleOpenHabit('Environmental')} score={getEnvironmentalScore()} />
              <HabitItem icon={<Scale className="h-3.5 w-3.5 text-rose-500" />} label="Obesity" onClick={() => handleOpenHabit('Obesity')} score={getObesityScore()} />
              <HabitItem icon={<Stethoscope className="h-3.5 w-3.5 text-slate-500" />} label="Dental health" onClick={() => handleOpenHabit('Dental')} score={getDentalScore()} />
              <HabitItem icon={<Flame className="h-3.5 w-3.5 text-orange-500" />} label="Gastritis" onClick={() => handleOpenHabit('Gastritis')} score={getGastritisScore()} />
              <HabitItem icon={<Dna className="h-3.5 w-3.5 text-purple-500" />} label="Genetic risk" onClick={() => handleOpenHabit('Genetic')} score={getGeneticScore()} />
            </div>
          </div>
        )}

        {/* Repair Column (Right) */}
        {(forcesView === 'all' || forcesView === 'repair') && (
          <div className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl sm:rounded-3xl p-1.5 sm:p-3 flex flex-col h-fit self-start transition-colors duration-300 ${isCancerPatient ? 'w-full' : ''}`}>
            {!isCancerPatient && (
              <div className="px-1 pt-1 pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-emerald-500 font-sans text-xs sm:text-base font-bold flex items-center gap-1 mb-0.5">
                    <Leaf className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Repair
                  </h3>
                  <p className="text-[7px] sm:text-[8px] text-slate-400 font-bold uppercase tracking-widest">Build the defence</p>
                </div>
                <span className="text-[8px] sm:text-[9px] font-extrabold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/40 shrink-0">
                  {repairCount} active
                </span>
              </div>
            )}

            <div className="flex flex-col gap-1 sm:gap-1.5">
              {isCancerPatient ? (
                <>
                  <HabitItem icon={<Timer className="h-3.5 w-3.5 text-sky-500" />} label="INTERMITTENT FASTING" onClick={() => handleOpenHabit('Fasting')} score={getFastingScore()} />
                  <HabitItem icon={<User className="h-3.5 w-3.5 text-amber-500" />} label="MOVEMENT" onClick={() => handleOpenHabit('Movement')} score={getMovementScore()} />
                  <HabitItem icon={<User className="h-3.5 w-3.5 text-amber-600" />} label="Stillness" onClick={() => handleOpenHabit('Stillness')} score={getStillnessScore()} />
                  <HabitItem icon={<Palette className="h-3.5 w-3.5 text-indigo-400" />} label="THINGS YOU LOVE" onClick={() => handleOpenHabit('Joy')} score={getJoyScore()} />
                  <HabitItem icon={<BrainCircuit className="h-3.5 w-3.5 text-rose-500" />} label="ARE YOU STRESSED/WORRIED?" onClick={() => setShowStressedModal(true)} />
                  <HabitItem icon={<User className="h-3.5 w-3.5 text-teal-500" />} label="CAREGIVER STRESS" onClick={() => setShowCaregiverModal(true)} />
                  <HabitItem icon={<ShoppingBag className="h-3.5 w-3.5 text-pink-500" />} label="Explore wigs for hairloss" onClick={() => setActiveScreen('WigShop')} />
                </>
              ) : (
                <>
                  <HabitItem icon={<Timer className="h-3.5 w-3.5 text-sky-500" />} label="Fasting" onClick={() => handleOpenHabit('Fasting')} score={getFastingScore()} />
                  <HabitItem icon={<Cherry className="h-3.5 w-3.5 text-rose-400" />} label="Antioxidants" onClick={() => handleOpenHabit('Antioxidants')} score={getAntioxidantsScore()} />
                  <HabitItem icon={<User className="h-3.5 w-3.5 text-amber-500" />} label="Exercise" onClick={() => handleOpenHabit('Movement')} score={getMovementScore()} />
                  <HabitItem icon={<User className="h-3.5 w-3.5 text-amber-600" />} label="Stillness" onClick={() => handleOpenHabit('Stillness')} score={getStillnessScore()} />
                  <HabitItem icon={<Palette className="h-3.5 w-3.5 text-indigo-400" />} label="Things you love" onClick={() => handleOpenHabit('Joy')} score={getJoyScore()} />
                  <HabitItem icon={<ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />} label="Safer products" onClick={() => handleOpenHabit('SaferProducts')} score={getSaferProductsScore()} />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {!isCancerPatient && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-slate-400 font-mono font-bold">02</span>
            <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Catch it early</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
          </div>

          {/* Cancer Screening Card */}
          <button
            onClick={() => handleOpenHabit('CancerScreening')}
            className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-emerald-100 dark:border-emerald-950/20 shadow-[0_8px_30px_rgba(16,185,129,0.04)] rounded-2xl p-4 flex items-center gap-4 text-left transition-all active:scale-95 hover:shadow-md"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Microscope className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-emerald-600 dark:text-emerald-400 font-sans font-bold text-lg leading-tight">Cancer Screening</h4>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-snug mt-1">
                PSA · CEA · CA-125 · Pap · Mammogram · Whole-Body MRI · Genetic & liquid biopsy
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300" />
          </button>

          {/* Indian Cancers & Risks Card */}
          <button
            onClick={() => handleOpenHabit('IndianCancers')}
            className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-purple-100 dark:border-purple-900/30 shadow-[0_8px_30px_rgba(168,85,247,0.04)] rounded-2xl p-4 flex items-center gap-4 text-left transition-all active:scale-95 hover:shadow-md mt-4"
          >
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-purple-600 dark:text-purple-400 font-sans font-bold text-lg leading-tight">Indian Cancers & Risks</h4>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-snug mt-1">
                Understand common cancers in India and their associated risk factors.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300" />
          </button>
        </>
      )}
      {isCancerPatient && (
        <div className="w-full flex flex-col gap-4 mb-4">
          {/* Cellular Defense Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-3xl p-5 md:p-6 flex items-center gap-5 transition-all duration-300">
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              {/* Background circular track */}
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
              {/* SVG circular progress */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-emerald-500 dark:stroke-emerald-450 fill-none transition-all duration-500 ease-out"
                  strokeWidth="5"
                  strokeDasharray="213.6"
                  strokeDashoffset={213.6 - (213.6 * cancerGuidelines.count) / 4}
                  strokeLinecap="round"
                />
              </svg>
              {/* Interactive pulsing light behind percent */}
              <div className={`absolute w-14 h-14 rounded-full bg-emerald-500/5 dark:bg-emerald-400/5 animate-pulse ${cancerGuidelines.count > 0 ? 'opacity-100' : 'opacity-0'}`}></div>
              <div className="flex flex-col items-center justify-center z-10">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                  {cancerGuidelines.count * 25}%
                </span>
                <span className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Shield</span>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-sans font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug">Cellular Defense Strength</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {cancerGuidelines.count === 0 && "Shield is currently offline. Log a guideline above to activate cellular repair pathways."}
                {cancerGuidelines.count === 1 && "Activating. Your cell repair signalling is starting to warm up."}
                {cancerGuidelines.count === 2 && "Defending. Core mitochondrial defense networks are actively online."}
                {cancerGuidelines.count === 3 && "Strong defense. Cellular systems are operating at peak restorative capacity."}
                {cancerGuidelines.count === 4 && "Fully Empowered. High cellular integrity and energy cycles are fully active!"}
              </p>
            </div>
          </div>

          {/* Metabolic & CGM Redirection Card (Clean Medical Health Card) */}
          <button
            type="button"
            onClick={() => {
              if (onGoToCGMDashboard) onGoToCGMDashboard();
              else setShowTugOfWar(false);
            }}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 md:p-6 text-left transition-all duration-200 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 active:scale-[0.99] group flex items-center justify-between gap-4 cursor-pointer"
          >
            <div className="flex-1">
              <span className="text-[9px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-block mb-2 border border-blue-200/60 dark:border-blue-800/60">
                Glucose & Food
              </span>
              <h4 className="font-sans font-black text-slate-900 dark:text-slate-100 text-base leading-tight">
                Continuous Glucose & Insights 📊
              </h4>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Upload your CGM report, view metabolic stability graphs, log meals, and coordinate doctor consults.
              </p>
            </div>
            <div className="h-10 w-10 bg-slate-100 group-hover:bg-slate-200 dark:bg-slate-800 dark:group-hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center shrink-0 transition-transform">
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}

      {/* FEATURE DISCOVERY & CONTEXTUAL SHOP SECTIONS */}
      <ExploreFeaturesGrid
        activeMode={activeMode as any}
        onSelectFeature={(key, params) => handleActionKey(key, params)}
      />

      <ContextualShopCard
        activeMode={activeMode as any}
        onOpenShop={(query) => {
          setShopQuery(query);
          if (query.toLowerCase() === 'wig') {
            setActiveScreen('WigShop');
          } else {
            setActiveScreen('EnvironmentalShop');
          }
        }}
      />
      </>
      )}

      {/* ── Floating AI Check-in FAB Trigger Button ── */}
      <div className="fixed bottom-20 right-5 z-40">
        <button
          onClick={() => setShowChatbotModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white/80 active:scale-95 transition-all cursor-pointer"
          title="Open AI Daily Check-in Assistant"
        >
          <Bot className="h-6 w-6 text-white" />
          <span className="text-xs font-black tracking-wide pr-1 hidden sm:inline">AI Check-in</span>
        </button>
      </div>

      {/* AI Daily Check-in Modern Floating Pop-up Nudge (Only if habits are pending on home) */}
      {activeScreen === null && (
        <AiDailyCheckinFloatingNudge
          pendingHabitsCount={pendingHabitsCount}
          onOpenCheckin={() => setShowChatbotModal(true)}
          userMode={activeMode}
        />
      )}

      {/* AI Daily Logging Chatbot Modal */}
      <DailyLoggingChatbotModal
        isOpen={showChatbotModal}
        onClose={() => setShowChatbotModal(false)}
        apiUrl={apiUrl}
        token={token}
        userMode={activeMode as any}
        onRefreshDashboard={() => fetchHabitsAndAppointments()}
      />

      {/* AI Feature Discovery Nudge Modal */}
      <AiFeatureDiscoveryModal
        isOpen={showAiNudgeModal}
        onClose={() => setShowAiNudgeModal(false)}
        onOpenAiChat={() => setShowChatbotModal(true)}
        onContinueManually={() => {
          if (pendingManualAction) {
            executeManualAction(pendingManualAction.key, pendingManualAction.params);
            setPendingManualAction(null);
          }
        }}
        targetFeatureName={pendingManualAction?.key || 'Habit'}
      />

      {showStressedModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
            <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mx-auto text-2xl">
              🧠
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Talk to our mental health expert</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Facing cancer can be overwhelming. We recommend speaking to our supportive mental health professionals to help you navigate your emotions.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowStressedModal(false);
                  handleBookAppt('Mental Health Specialist Consultation');
                }}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase shadow-sm transition-all"
              >
                Talk to expert
              </button>
              <button
                onClick={() => setShowStressedModal(false)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold rounded-xl text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showCaregiverModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
            <div className="h-12 w-12 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center mx-auto text-2xl">
              🤝
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Caregiver Stress</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Caring for a loved one with cancer can be challenging. Connect with a psycho-oncologist to support your mental well-being.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowCaregiverModal(false);
                  handleBookAppt('Psycho-Oncologist Consultation');
                }}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs uppercase shadow-sm transition-all"
              >
                Consult & Connect
              </button>
              <button
                onClick={() => setShowCaregiverModal(false)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold rounded-xl text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {showFastingDisclaimer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            {fastingStep === 1 ? (
              <>
                <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mx-auto text-2xl text-amber-500">
                  ⚠️
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Medical Disclaimer</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Intermittent fasting during cancer treatment is experimental. Please consult an expert and intimate your treating medical team.
                </p>
                <button
                  onClick={() => setFastingStep(2)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase shadow-sm transition-all"
                >
                  Next
                </button>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mx-auto text-2xl text-indigo-500">
                  🩺
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Consult Our Expert</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  We highly recommend consulting our medical expert before initiating any fasting regimen during active cancer treatment.
                </p>

                {/* Expert Profile Card */}
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-800 rounded-2xl p-3 text-left flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300">
                    MR
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">MitoReboot Medical Team</h5>
                    <p className="text-[10px] text-slate-400">Oncology & Metabolic Nutrition Experts</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowFastingDisclaimer(false);
                      handleBookAppt('Fasting Consultation with Medical Team');
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase shadow-sm transition-all"
                  >
                    Consult Expert
                  </button>
                  <button
                    onClick={() => {
                      setShowFastingDisclaimer(false);
                      setShowTugOfWar(false);
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase shadow-sm transition-all"
                  >
                    Start Fasting
                  </button>
                  <button
                    onClick={() => setShowFastingDisclaimer(false)}
                    className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold rounded-xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const HabitItem = ({ icon, label, onClick, score }: { icon: React.ReactNode, label: string, onClick: () => void, score?: number | null }) => {
  const isNegative = score !== undefined && score !== null && score < 0;
  const isPositive = score !== undefined && score !== null && score > 0;

  return (
    <button
      onClick={onClick}
      className="group flex items-center justify-between w-full px-2 sm:px-3 py-2 sm:py-2.5 bg-white/80 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-[0.99] text-left gap-1"
    >
      <div className="flex items-center gap-1.5 sm:gap-2 text-left flex-1 min-w-0">
        <div className="p-1 sm:p-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-900/80 group-hover:scale-105 transition-transform shrink-0">
          {icon}
        </div>
        <span className="text-[10.5px] xs:text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-[1.15] break-words line-clamp-2">
          {label}
        </span>
      </div>
      {score !== undefined && score !== null ? (
        <span className={`text-[9px] sm:text-[10.5px] font-black px-1.5 sm:px-2 py-0.5 rounded-lg transition-all shadow-2xs shrink-0 ml-1 ${isNegative
          ? 'bg-rose-50 text-rose-600 border border-rose-200/60 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/50'
          : isPositive
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/50'
            : 'bg-slate-100 text-slate-700 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60'
          }`}>
          {score > 0 ? `+${score}` : score}
        </span>
      ) : (
        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400 dark:group-hover:bg-slate-500 transition-colors shrink-0 ml-1"></div>
      )}
    </button>
  );
};
