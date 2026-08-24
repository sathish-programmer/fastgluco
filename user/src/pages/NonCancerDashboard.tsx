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
  ArrowLeft
} from 'lucide-react';
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
// import { ContinueWhereLeftOff } from '../components/ContinueWhereLeftOff';
// import { MitoProgressCard } from '../components/MitoProgressCard';
import { ExploreFeaturesGrid } from '../components/ExploreFeaturesGrid';
import { ContextualShopCard } from '../components/ContextualShopCard';
import { AskMitoDrawer } from '../components/AskMitoDrawer';
import { Sparkles } from 'lucide-react';

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

  useEffect(() => {
    const fetchHabitsAndAppointments = async () => {
      try {
        const logs = await HabitsService.getRecentHabits(apiUrl, token, 'all', 30);
        setHabits(logs);
        checkHealthDanger(logs);
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

  const calculateDamageCount = () => {
    let count = 0;
    periodHabits.forEach(h => {
      if (h.type === 'Stress' && (h.value?.faceId === 'tense' || h.value?.faceId === 'stressed' || h.value?.faceId === 'maxed')) count += 1;
      if (h.type === 'Sleep' && (h.value?.hours < 6 || h.value?.quality === 'poor')) count += 1;
      if (h.type === 'Smoking' && h.value?.count > 0) count += 1;
      if (h.type === 'Alcohol' && h.value?.drinks > 0) count += 1;
      if (h.type === 'Substances' && h.value?.used === true) count += 1;
      if (h.type === 'Intimacy' && h.value?.happy === false) count += 1;
      if (h.type === 'Dental' && (h.value?.sharpTooth === true || h.value?.tobacco === true || h.value?.illFittingDenture === true)) count += 1;
      if (h.type === 'Gastritis' && h.value?.gastritis === true) count += 1;
      if (h.type === 'Genetic' && h.value?.geneticLink === true) count += 1;
      if (h.type === 'Environmental' && h.value?.score < 0) count += 1;
    });
    return count;
  };

  const calculateRepairCount = () => {
    let count = 0;
    periodHabits.forEach(h => {
      if (h.type === 'Stress' && h.value?.faceId === 'calm') count += 1;
      if (h.type === 'Sleep' && (h.value?.hours >= 6 && h.value?.quality !== 'poor')) count += 1;
      if (h.type === 'Smoking' && h.value?.count === 0) count += 1;
      if (h.type === 'Alcohol' && h.value?.drinks === 0) count += 1;
      if (h.type === 'Substances' && h.value?.used === false) count += 1;
      if (h.type === 'Fasting') count += 1;
      if (h.type === 'Antioxidants') count += 1;
      if (h.type === 'Movement' && h.value?.minutes >= 20) count += 1;
      if (h.type === 'Stillness' && h.value?.sat === true) count += 1;
      if (h.type === 'Joy' && h.value?.done !== false) count += 1;
      if (h.type === 'SaferProducts') count += 1;
      if (h.type === 'CancerScreening') count += 1;
      if (h.type === 'Intimacy' && h.value?.happy === true) count += 1;
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
    const logs = periodHabits.filter(h => h.type === 'Dental');
    if (logs.length === 0) return null;
    const damageLogs = logs.filter(l => l.value?.sharpTooth === true || l.value?.tobacco === true || l.value?.illFittingDenture === true).length;
    const repairLogs = logs.filter(l => l.value?.sharpTooth === false && l.value?.tobacco === false && l.value?.illFittingDenture === false).length;
    if (damageLogs > 0) return -damageLogs;
    if (repairLogs > 0) return repairLogs;
    return 0;
  };

  const getGastritisScore = () => {
    const logs = periodHabits.filter(h => h.type === 'Gastritis');
    if (logs.length === 0) return null;
    const damageLogs = logs.filter(l => l.value?.gastritis === true).length;
    const repairLogs = logs.filter(l => l.value?.gastritis === false).length;
    if (damageLogs > 0) return -damageLogs;
    if (repairLogs > 0) return repairLogs;
    return 0;
  };

  const getGeneticScore = () => {
    const logs = periodHabits.filter(h => h.type === 'Genetic');
    if (logs.length === 0) return null;
    const damageLogs = logs.filter(l => l.value?.geneticLink === true).length;
    return damageLogs > 0 ? -damageLogs : 0;
  };

  const getStressScore = () => {
    const logs = periodHabits.filter(h => h.type === 'Stress');
    if (logs.length === 0) return null;
    const damageLogs = logs.filter(l => l.value?.faceId === 'tense' || l.value?.faceId === 'stressed' || l.value?.faceId === 'maxed').length;
    const repairLogs = logs.filter(l => l.value?.faceId === 'calm').length;
    if (damageLogs > 0) return -damageLogs;
    if (repairLogs > 0) return repairLogs;
    return 0;
  };

  const getSleepScore = () => {
    const logs = periodHabits.filter(h => h.type === 'Sleep');
    if (logs.length === 0) return null;
    const damageLogs = logs.filter(l => l.value?.hours < 6 || l.value?.quality === 'poor').length;
    const repairLogs = logs.filter(l => l.value?.hours >= 6 && l.value?.quality !== 'poor').length;
    if (damageLogs > 0) return -damageLogs;
    if (repairLogs > 0) return repairLogs;
    return 0;
  };

  const getSmokingScore = () => {
    const logs = periodHabits.filter(h => h.type === 'Smoking');
    if (logs.length === 0) return null;
    const damageLogs = logs.filter(l => l.value?.count > 0).length;
    const repairLogs = logs.filter(l => l.value?.count === 0).length;
    if (damageLogs > 0) return -damageLogs;
    if (repairLogs > 0) return repairLogs;
    return 0;
  };

  const getAlcoholScore = () => {
    const logs = periodHabits.filter(h => h.type === 'Alcohol');
    if (logs.length === 0) return null;
    const damageLogs = logs.filter(l => l.value?.drinks > 0).length;
    const repairLogs = logs.filter(l => l.value?.drinks === 0).length;
    if (damageLogs > 0) return -damageLogs;
    if (repairLogs > 0) return repairLogs;
    return 0;
  };

  const getSubstancesScore = () => {
    const logs = periodHabits.filter(h => h.type === 'Substances');
    if (logs.length === 0) return null;
    const damageLogs = logs.filter(l => l.value?.used === true).length;
    const repairLogs = logs.filter(l => l.value?.used === false).length;
    if (damageLogs > 0) return -damageLogs;
    if (repairLogs > 0) return repairLogs;
    return 0;
  };

  const getObesityScore = () => {
    if (!user?.height || !user?.weight) return null;
    const bmi = user.weight / Math.pow(user.height / 100, 2);
    if (bmi >= 25) return -1;
    return 0;
  };

  const getFastingScore = () => {
    const logs = periodHabits.filter(h => h.type === 'Fasting');
    if (logs.length === 0) return null;
    const repairLogs = logs.filter(l => l.value?.hours >= 12).length;
    return repairLogs > 0 ? repairLogs : 0;
  };

  const getAntioxidantsScore = () => {
    const logs = periodHabits.filter(h => h.type === 'Antioxidants');
    if (logs.length === 0) return null;
    const repairLogs = logs.filter(l => l.value?.consumed === true).length;
    return repairLogs > 0 ? repairLogs : 0;
  };

  const getMovementScore = () => {
    const logs = periodHabits.filter(h => h.type === 'Movement');
    if (logs.length === 0) return null;
    const repairLogs = logs.filter(l => l.value?.minutes >= 20).length;
    return repairLogs > 0 ? repairLogs : 0;
  };

  const getStillnessScore = () => {
    const logs = periodHabits.filter(h => h.type === 'Stillness');
    if (logs.length === 0) return null;
    const repairLogs = logs.filter(l => l.value?.sat === true).length;
    return repairLogs > 0 ? repairLogs : 0;
  };

  const getJoyScore = () => {
    const logs = periodHabits.filter(h => h.type === 'Joy');
    if (logs.length === 0) return null;
    const repairLogs = logs.filter(l => l.value?.done !== false).length;
    return repairLogs > 0 ? repairLogs : 0;
  };

  const getSaferProductsScore = () => {
    const logs = periodHabits.filter(h => h.type === 'SaferProducts');
    if (logs.length === 0) return null;
    return logs.length;
  };

  const getEnvironmentalScore = () => {
    const logs = periodHabits.filter(h => h.type === 'Environmental');
    if (logs.length === 0) return null;
    const negLogs = logs.filter(l => l.value?.score < 0).length;
    return negLogs > 0 ? -negLogs : 0;
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
        <div className="sub-page-body flex-1">
          {activeScreenComponent}
        </div>
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
      <div className="pb-36 pt-4 px-3.5 max-w-5xl mx-auto bg-gradient-to-b from-slate-50/90 to-slate-100/80 dark:from-slate-950/90 dark:to-slate-900/80 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-200 transition-colors duration-300">
        <ModeSwitcher />
        <Dashboard onNavigateToTab={onNavigateToTab} onBackToTugOfWar={() => setShowTugOfWar(true)} />
      </div>
    );
  }



  const handleActionKey = (key: string, params?: any) => {
    if (!key) return;
    const lowerKey = key.toLowerCase();

    if (params?.search) {
      setShopQuery(params.search);
      if (params.search.toLowerCase() === 'wig') return setActiveScreen('WigShop');
      return setActiveScreen('EnvironmentalShop');
    }

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

  return (
    <div className="pb-24 pt-4 px-3.5 max-w-5xl mx-auto bg-gradient-to-b from-slate-50/90 to-slate-100/80 dark:from-slate-900/90 dark:to-slate-950/80 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      {/* Feature Discovery & Ask Mito Modals */}
      <AskMitoDrawer
        isOpen={showAskMito}
        onClose={() => setShowAskMito(false)}
        onNavigateToTab={onNavigateToTab}
      />

      {/* Top Greeting & Action Bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Welcome back
          </span>
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            Hello, {user?.name || 'Friend'} 👋
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAskMito(true)}
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-light rounded-2xl text-xs font-extrabold transition-all flex items-center space-x-1.5 border border-primary/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ask Mito</span>
          </button>
        </div>
      </div>

      <ModeSwitcher />

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
                className={`px-2 py-0.5 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all ${
                  timePeriod === 'today'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setTimePeriod('weekly')}
                className={`px-2 py-0.5 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all ${
                  timePeriod === 'weekly'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setTimePeriod('monthly')}
                className={`px-2 py-0.5 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all ${
                  timePeriod === 'monthly'
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
              className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] uppercase tracking-wider transition-all ${
                forcesView === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setForcesView('damage')}
              className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] uppercase tracking-wider transition-all ${
                forcesView === 'damage'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              Damage ({damageCount})
            </button>
            <button
              type="button"
              onClick={() => setForcesView('repair')}
              className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] uppercase tracking-wider transition-all ${
                forcesView === 'repair'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              Repair ({repairCount})
            </button>
          </div>
        </div>
      )}

      <div className={`${isCancerPatient ? 'w-full mb-4' : 'grid grid-cols-2 gap-2.5 sm:gap-3.5 mb-8 items-start'}`}>
        {/* Damage Column (Left) */}
        {!isCancerPatient && (forcesView === 'all' || forcesView === 'damage') && (
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-rose-100 dark:border-rose-900/30 shadow-[0_8px_30px_rgba(225,29,72,0.03)] rounded-3xl p-2.5 sm:p-3 flex flex-col h-fit self-start transition-colors duration-300">
            <div className="px-1.5 pt-1.5 pb-2.5 flex items-center justify-between">
              <div>
                <h3 className="text-rose-500 font-sans text-sm sm:text-base font-bold flex items-center gap-1 mb-0.5">
                  <Skull className="h-4 w-4" /> Damage
                </h3>
                <p className="text-[7.5px] sm:text-[8px] text-slate-400 font-bold uppercase tracking-widest">Reduce the load</p>
              </div>
              <span className="text-[8.5px] sm:text-[9px] font-extrabold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-1.5 sm:px-2 py-0.5 rounded-full border border-rose-200/50 dark:border-rose-900/40 shrink-0">
                {damageCount} active
              </span>
            </div>
            
            <div className="flex flex-col gap-1 sm:gap-1.5">
              <HabitItem icon={<Frown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />} label="Stress" onClick={() => handleOpenHabit('Stress')} score={getStressScore()} />
              <HabitItem icon={<Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-400" />} label="Sleep debt" onClick={() => handleOpenHabit('Sleep')} score={getSleepScore()} />
              <HabitItem icon={<Cigarette className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />} label="Smoking" onClick={() => handleOpenHabit('Smoking')} score={getSmokingScore()} />
              <HabitItem icon={<Wine className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-600" />} label="Alcohol" onClick={() => handleOpenHabit('Alcohol')} score={getAlcoholScore()} />
              <HabitItem icon={<Pill className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />} label="Substances" onClick={() => handleOpenHabit('Substances')} score={getSubstancesScore()} />
              <HabitItem icon={<Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-500" />} label="Environment" onClick={() => handleOpenHabit('Environmental')} score={getEnvironmentalScore()} />
              <HabitItem icon={<Scale className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500" />} label="Obesity" onClick={() => handleOpenHabit('Obesity')} score={getObesityScore()} />
              <HabitItem icon={<Stethoscope className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500" />} label="Dental health" onClick={() => handleOpenHabit('Dental')} score={getDentalScore()} />
              <HabitItem icon={<Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />} label="Gastritis" onClick={() => handleOpenHabit('Gastritis')} score={getGastritisScore()} />
              <HabitItem icon={<Dna className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />} label="Genetic risk" onClick={() => handleOpenHabit('Genetic')} score={getGeneticScore()} />
            </div>
          </div>
        )}

        {/* Repair Column (Right) */}
        {(forcesView === 'all' || forcesView === 'repair') && (
          <div className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-3xl p-2.5 sm:p-3 flex flex-col h-fit self-start transition-colors duration-300 ${isCancerPatient ? 'w-full' : ''}`}>
            {!isCancerPatient && (
              <div className="px-1.5 pt-1.5 pb-2.5 flex items-center justify-between">
                <div>
                  <h3 className="text-emerald-500 font-sans text-sm sm:text-base font-bold flex items-center gap-1 mb-0.5">
                    <Leaf className="h-4 w-4" /> Repair
                  </h3>
                  <p className="text-[7.5px] sm:text-[8px] text-slate-400 font-bold uppercase tracking-widest">Build the defence</p>
                </div>
                <span className="text-[8.5px] sm:text-[9px] font-extrabold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/40 shrink-0">
                  {repairCount} active
                </span>
              </div>
            )}
            
            <div className="flex flex-col gap-1 sm:gap-1.5">
              {isCancerPatient ? (
                <>
                  <HabitItem icon={<Timer className="h-4 w-4 text-sky-500" />} label="INTERMITTENT FASTING" onClick={() => handleOpenHabit('Fasting')} score={getFastingScore()} />
                  <HabitItem icon={<User className="h-4 w-4 text-amber-500" />} label="MOVEMENT" onClick={() => handleOpenHabit('Movement')} score={getMovementScore()} />
                  <HabitItem icon={<User className="h-4 w-4 text-amber-600" />} label="Stillness" onClick={() => handleOpenHabit('Stillness')} score={getStillnessScore()} />
                  <HabitItem icon={<Palette className="h-4 w-4 text-indigo-400" />} label="THINGS YOU LOVE" onClick={() => handleOpenHabit('Joy')} score={getJoyScore()} />
                  <HabitItem icon={<BrainCircuit className="h-4 w-4 text-rose-500" />} label="ARE YOU STRESSED/WORRIED?" onClick={() => setShowStressedModal(true)} />
                  <HabitItem icon={<User className="h-4 w-4 text-teal-500" />} label="CAREGIVER STRESS" onClick={() => setShowCaregiverModal(true)} />
                  <HabitItem icon={<ShoppingBag className="h-4 w-4 text-pink-500" />} label="Explore wigs for hairloss" onClick={() => setActiveScreen('WigShop')} />
                </>
              ) : (
                <>
                  <HabitItem icon={<Timer className="h-4 w-4 text-sky-500" />} label="Fasting" onClick={() => handleOpenHabit('Fasting')} score={getFastingScore()} />
                  <HabitItem icon={<Cherry className="h-4 w-4 text-rose-400" />} label="Antioxidants" onClick={() => handleOpenHabit('Antioxidants')} score={getAntioxidantsScore()} />
                  <HabitItem icon={<User className="h-4 w-4 text-amber-500" />} label="Exercise" onClick={() => handleOpenHabit('Movement')} score={getMovementScore()} />
                  <HabitItem icon={<User className="h-4 w-4 text-amber-600" />} label="Stillness" onClick={() => handleOpenHabit('Stillness')} score={getStillnessScore()} />
                  <HabitItem icon={<Palette className="h-4 w-4 text-indigo-400" />} label="Things you love" onClick={() => handleOpenHabit('Joy')} score={getJoyScore()} />
                  <HabitItem icon={<ShieldCheck className="h-4 w-4 text-emerald-500" />} label="Safer products" onClick={() => handleOpenHabit('SaferProducts')} score={getSaferProductsScore()} />
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

          {/* Metabolic & CGM Redirection Card */}
          <button
            onClick={() => {
              if (onGoToCGMDashboard) onGoToCGMDashboard();
              else setShowTugOfWar(false);
            }}
            className="w-full bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-3xl p-5 md:p-6 text-left transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98] group flex items-center justify-between gap-4"
          >
            <div className="flex-1">
              <span className="text-[9px] font-extrabold bg-white/20 text-white uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-block mb-2.5">
                Glucose & Food
              </span>
              <h4 className="font-sans font-black text-white text-base leading-tight group-hover:translate-x-1 transition-transform">
                Continuous Glucose & Insights 📊
              </h4>
              <p className="text-[11px] text-indigo-100/90 mt-1 leading-relaxed">
                Upload your CGM report, view metabolic stability graphs, log meals, and coordinate doctor consults.
              </p>
            </div>
            <div className="h-10 w-10 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <ArrowRight className="h-5 w-5 text-white" />
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
      className="group flex items-center justify-between w-full px-2.5 py-2 bg-white/80 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-[0.99] text-left"
    >
      <div className="flex items-center gap-2 text-left flex-1 min-w-0">
        <div className="p-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-900/80 group-hover:scale-105 transition-transform shrink-0">
          {icon}
        </div>
        <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate">
          {label}
        </span>
      </div>
      {score !== undefined && score !== null ? (
        <span className={`text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-lg transition-all shadow-2xs shrink-0 ml-1.5 ${
          isNegative
            ? 'bg-rose-50 text-rose-600 border border-rose-200/60 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/50' 
            : isPositive
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/50'
              : 'bg-slate-100 text-slate-600 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60'
        }`}>
          {score > 0 ? `+${score}` : score}
        </span>
      ) : (
        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400 dark:group-hover:bg-slate-500 transition-colors shrink-0 ml-1.5"></div>
      )}
    </button>
  );
};
