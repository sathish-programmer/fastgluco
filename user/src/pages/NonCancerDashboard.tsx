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
  Heart,
  Leaf,
  Timer,
  Cherry,
  Activity,
  User,
  Palette,
  ShieldCheck,
  Microscope,
  ArrowRight
} from 'lucide-react';
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

interface NonCancerDashboardProps {
  onNavigateToTab: (tab: string) => void;
}

export const NonCancerDashboard: React.FC<NonCancerDashboardProps> = () => {
  // Navigation State for Habit Screens
  const [activeScreen, setActiveScreen] = useState<string | null>(null);
  const [habits, setHabits] = useState<HabitLog[]>([]);
  const { apiUrl, token } = useAuth();

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const logs = await HabitsService.getRecentHabits(apiUrl, token, 'all', 30);
        setHabits(logs);
      } catch (err) {
        console.error('Failed to load habits', err);
      }
    };
    if (activeScreen === null) {
      fetchHabits();
    }
  }, [activeScreen, apiUrl, token]);

  const todayStr = new Date().toDateString();
  const todaysHabits = habits.filter(h => new Date(h.timestamp).toDateString() === todayStr);

  const damageTypes = ['Substances', 'Stress', 'Alcohol', 'Smoking'];
  const repairTypes = ['Stillness', 'Sleep', 'Joy', 'Movement', 'Fasting', 'CancerScreening', 'Intimacy', 'ShopOrder'];

  const damageLogs = todaysHabits.filter(h => damageTypes.includes(h.type));
  const repairLogs = todaysHabits.filter(h => repairTypes.includes(h.type));
  
  const damageCount = damageLogs.length;
  const repairCount = repairLogs.length;
  const totalLogs = damageCount + repairCount;

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
    // If they haven't logged today, check if they logged yesterday
    if (sortedDates[0].getTime() !== today.getTime()) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (sortedDates[0].getTime() === yesterday.getTime()) {
        currentCheckDate = new Date(yesterday);
      } else {
        // No log today and no log yesterday = 0 streak
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

  // Calculate percentages for the tug-of-war bar
  const damagePct = totalLogs === 0 ? 50 : (damageCount / totalLogs) * 100;
  const repairPct = totalLogs === 0 ? 50 : (repairCount / totalLogs) * 100;

  // Pie chart data
  const chartData = totalLogs === 0 
    ? [{ name: 'Empty', value: 1, color: '#f1f5f9' }] // slate-100
    : [
        { name: 'Damage', value: damageCount, color: '#f43f5e' }, // rose-500
        { name: 'Repair', value: repairCount, color: '#10b981' }  // emerald-500
      ];

  if (activeScreen === 'Stress') return <StressLogScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'Smoking') return <SmokingLogScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'Substances') return <SubstancesLogScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'Intimacy') return <IntimacyCheckScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'Sleep') return <SleepLogScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'Movement') return <MovementLogScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'Alcohol') return <AlcoholLogScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'Fasting') return <FastingLogScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'Stillness') return <StillnessLogScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'Joy') return <JoyLogScreen onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'Antioxidants') return <ShopScreen type="Antioxidants" onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'SaferProducts') return <ShopScreen type="SaferProducts" onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'CancerScreening') return <CancerScreeningScreen onBack={() => setActiveScreen(null)} />;
  
  const handleOpenHabit = (screenName: string) => {
    setActiveScreen(screenName);
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-gradient-to-b from-slate-50/90 to-slate-100/80 min-h-screen font-sans antialiased text-slate-800">
      {/* Header section */}
      <div className="text-center mb-6 mt-2">
        <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">
          Every day, your cells choose a side
        </span>
        <h2 className="text-xl md:text-2xl font-sans text-slate-800 mt-2 tracking-tight leading-snug px-4">
          A quiet <span className="text-amber-500 italic">tug-of-war</span> runs inside every cell you own.
        </h2>
        <p className="text-xs text-slate-500 mt-2 max-w-[280px] mx-auto leading-relaxed">
          Damage pulls one way. Repair pulls the other. The habits you log here decide which side wins today.
        </p>
      </div>

      {/* Cellular Balance Card */}
      <div className="bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-3xl p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Cellular Balance</span>
          <span className="text-[10px] font-bold text-amber-500 tracking-widest uppercase flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100/50">
            <span className="w-1.5 h-1.5 rounded-full border border-amber-500"></span>
            {streak > 0 ? `${streak} day streak 🔥` : 'no streak yet'}
          </span>
        </div>
        
        <div className="flex items-center gap-5 mb-8">
          {/* Dynamic Half-Circle Chart */}
          <div className="relative w-24 h-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={40}
                  startAngle={180}
                  endAngle={-180}
                  paddingAngle={5}
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
              <span className="text-xl font-black text-slate-800 leading-none">{totalLogs}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Logs</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-sans text-slate-800 font-bold">Start logging</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Log a habit on either side and your balance comes to life.
            </p>
          </div>
        </div>

        {/* Tug of war bar */}
        <div className="relative w-full h-2 bg-slate-100 rounded-full mb-3 flex overflow-hidden shadow-inner">
          <div className="h-full bg-rose-500 transition-all duration-700 ease-out" style={{ width: `${damagePct}%` }}></div>
          <div className="h-full bg-emerald-500 transition-all duration-700 ease-out" style={{ width: `${repairPct}%` }}></div>
          {/* Center puck */}
          <div 
            className="absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center transition-all duration-700 ease-out"
            style={{ left: `${damagePct}%` }}
          >
            <Activity className="h-3 w-3 text-slate-400" />
          </div>
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest px-1">
          <span className="text-rose-500 flex items-center gap-1"><Skull className="h-3 w-3" /> Damage</span>
          <span className="text-emerald-500 flex items-center gap-1">Repair <Leaf className="h-3 w-3" /></span>
        </div>
        <div className="flex justify-between items-center text-[9px] text-slate-400 mt-1 px-1">
          <span>{damageCount} active</span>
          <span>{repairCount} active</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-slate-400 font-mono font-bold">01</span>
        <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Track the two forces</span>
        <div className="flex-1 h-px bg-slate-200"></div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {/* Damage Column */}
        <div className="bg-white/90 backdrop-blur-xl border border-rose-100 shadow-[0_8px_30px_rgba(225,29,72,0.03)] rounded-2xl p-1.5 flex flex-col">
          <div className="px-2 pt-3 pb-4">
            <h3 className="text-rose-500 font-sans text-lg font-bold flex items-center gap-1.5 mb-0.5">
              <Skull className="h-5 w-5" /> Damage
            </h3>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Reduce the load</p>
          </div>
          
          <div className="flex flex-col gap-1">
            <HabitItem icon={<Frown className="h-4 w-4 text-amber-500" />} label="Stress" onClick={() => handleOpenHabit('Stress')} />
            <HabitItem icon={<Moon className="h-4 w-4 text-indigo-400" />} label="Sleep debt" onClick={() => handleOpenHabit('Sleep')} />
            <HabitItem icon={<Cigarette className="h-4 w-4 text-slate-400" />} label="Smoking" onClick={() => handleOpenHabit('Smoking')} />
            <HabitItem icon={<Wine className="h-4 w-4 text-rose-600" />} label="Alcohol" onClick={() => handleOpenHabit('Alcohol')} />
            <HabitItem icon={<Pill className="h-4 w-4 text-amber-500" />} label="Substances" onClick={() => handleOpenHabit('Substances')} />
            <HabitItem icon={<Heart className="h-4 w-4 text-rose-500" />} label="Sexual health" onClick={() => handleOpenHabit('Intimacy')} />
          </div>
        </div>

        {/* Repair Column */}
        <div className="bg-white/90 backdrop-blur-xl border border-emerald-100 shadow-[0_8px_30px_rgba(16,185,129,0.03)] rounded-2xl p-1.5 flex flex-col">
          <div className="px-2 pt-3 pb-4">
            <h3 className="text-emerald-500 font-sans text-lg font-bold flex items-center gap-1.5 mb-0.5">
              <Leaf className="h-5 w-5" /> Repair
            </h3>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Build the defence</p>
          </div>
          
          <div className="flex flex-col gap-1">
            <HabitItem icon={<Timer className="h-4 w-4 text-sky-500" />} label="Fasting" onClick={() => handleOpenHabit('Fasting')} />
            <HabitItem icon={<Cherry className="h-4 w-4 text-rose-400" />} label="Antioxidants" onClick={() => handleOpenHabit('Antioxidants')} />
            <HabitItem icon={<User className="h-4 w-4 text-amber-500" />} label="Movement" onClick={() => handleOpenHabit('Movement')} />
            <HabitItem icon={<User className="h-4 w-4 text-amber-600" />} label="Stillness" onClick={() => handleOpenHabit('Stillness')} />
            <HabitItem icon={<Palette className="h-4 w-4 text-indigo-400" />} label="Things you love" onClick={() => handleOpenHabit('Joy')} />
            <HabitItem icon={<ShieldCheck className="h-4 w-4 text-emerald-500" />} label="Safer products" onClick={() => handleOpenHabit('SaferProducts')} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-slate-400 font-mono font-bold">02</span>
        <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Catch it early</span>
        <div className="flex-1 h-px bg-slate-200"></div>
      </div>

      {/* Cancer Screening Card */}
      <button 
        onClick={() => handleOpenHabit('CancerScreening')}
        className="w-full bg-white/90 backdrop-blur-xl border border-indigo-100 shadow-[0_8px_30px_rgba(99,102,241,0.04)] rounded-2xl p-4 flex items-center gap-4 text-left transition-all active:scale-95 hover:shadow-md"
      >
        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
          <Microscope className="h-5 w-5 text-indigo-500" />
        </div>
        <div className="flex-1">
          <h4 className="text-indigo-600 font-sans font-bold text-lg leading-tight">Cancer Screening</h4>
          <p className="text-[9px] text-slate-500 leading-snug mt-1">
            PSA · CEA · CA-125 · Pap · Mammogram · Whole-Body MRI · Genetic & liquid biopsy
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300" />
      </button>

    </div>
  );
};

const HabitItem = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex items-center justify-between w-full p-2.5 bg-slate-50/50 hover:bg-slate-100 rounded-xl transition-all"
  >
    <div className="flex items-center gap-2.5">
      {icon}
      <span className="text-xs font-semibold text-slate-600">{label}</span>
    </div>
    <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
  </button>
);
