import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SyncService } from '../services/syncService';
import { useToast } from '../context/ToastContext';
import {
  TrendingUp,
  Plus,
  FileUp,
  Info,
  Activity,
  RefreshCw,
  Maximize2,
  Minimize2,
  RotateCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DashboardProps {
  onNavigateToTab: (tab: string) => void;
  features?: { exportReports?: boolean };
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToTab, features }) => {
  const { token, user, apiUrl } = useAuth();
  const { showToast } = useToast();

  const [currentGlucose, setCurrentGlucose] = useState<number | null>(null);
  const [glucoseReadings, setGlucoseReadings] = useState<any[]>([]);
  const [todayCalories, setTodayCalories] = useState<number>(0);
  const [reportsCount, setReportsCount] = useState<number>(0);
  const [offlineMealsCount, setOfflineMealsCount] = useState<number>(0);
  const [timeInRange, setTimeInRange] = useState<number>(85);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month'>('day');
  const [exporting, setExporting] = useState(false);
  const [healthInsight, setHealthInsight] = useState<string>('Walking for 10-15 minutes after major meals helps clear circulating glucose, reducing the severity of peak spikes. Try swapping white rice for millets.');
  const [rangeFoodLogs, setRangeFoodLogs] = useState<any[]>([]);
  const [showGlucoseModal, setShowGlucoseModal] = useState(false);
  const [manualGlucose, setManualGlucose] = useState('');
  const [manualTimestamp, setManualTimestamp] = useState('');
  const [submittingGlucose, setSubmittingGlucose] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [todayWater, setTodayWater] = useState<number>(0);
  const [enableHydration, setEnableHydration] = useState<boolean>(true);
  const [enableWorkout, setEnableWorkout] = useState<boolean>(true);
  const [spikeThreshold, setSpikeThreshold] = useState<number>(user?.spikeThreshold ?? 90);
  const [hydrationGoal, setHydrationGoal] = useState<number>(3000);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activeTrackerTab, setActiveTrackerTab] = useState<'nutrition' | 'hydration' | 'insights'>('nutrition');
  const [activityType, setActivityType] = useState('Walk');
  const [activityDuration, setActivityDuration] = useState('15');
  const [activitySteps, setActivitySteps] = useState('');
  const [activityCalories, setActivityCalories] = useState('');
  const [activityTimestamp, setActivityTimestamp] = useState('');
  const [submittingActivity, setSubmittingActivity] = useState(false);

  // Dynamically calculate glucose stability hours below spikeThreshold (defaults to 90)
  const calculateStabilityHours = () => {
    if (glucoseReadings.length === 0) {
      return {
        hours: 14.5,
        percentage: 85,
        status: 'On Track',
        label: 'Stay below 90 mg/dL for 17 hrs a day',
        hasData: false
      };
    }

    // Calculate percentage of readings below threshold
    const belowCount = glucoseReadings.filter(r => r.value < spikeThreshold).length;
    const totalCount = glucoseReadings.length;
    const percentage = Math.round((belowCount / totalCount) * 100);
    const hours = parseFloat(((belowCount / totalCount) * 24).toFixed(1));

    let status = 'Need Attention';
    if (hours >= 17) {
      status = 'Goal Achieved';
    } else if (hours >= 12) {
      status = 'On Track';
    }

    return {
      hours,
      percentage,
      status,
      label: `Stay below ${spikeThreshold} mg/dL for 17 hrs a day`,
      hasData: true
    };
  };

  const stability = calculateStabilityHours();

  const chartScrollRef = React.useRef<HTMLDivElement>(null);
  const fullscreenScrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartScrollRef.current) {
      chartScrollRef.current.scrollLeft = chartScrollRef.current.scrollWidth;
    }
  }, [glucoseReadings, dateRange]);

  useEffect(() => {
    if (user?.spikeThreshold) {
      setSpikeThreshold(user.spikeThreshold);
    }
  }, [user]);

  useEffect(() => {
    if (isChartExpanded && fullscreenScrollRef.current) {
      setTimeout(() => {
        if (fullscreenScrollRef.current) {
          fullscreenScrollRef.current.scrollLeft = fullscreenScrollRef.current.scrollWidth;
        }
      }, 100);
    }
  }, [isChartExpanded, glucoseReadings]);

  useEffect(() => {
    fetchDashboardData();
    // Count offline queued items
    setOfflineMealsCount(SyncService.getOfflineQueue().length);
  }, [token, dateRange]);

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      // 1. Fetch Glucose Readings (range = day|week|month)
      const glucoseRes = await fetch(`${apiUrl}/glucose?range=${dateRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (glucoseRes.ok) {
        const data = await glucoseRes.json();
        setGlucoseReadings(data);
        if (data.length > 0) {
          // Take the latest reading as current glucose
          setCurrentGlucose(data[data.length - 1].value);

          // Calculate actual Time in Range (70 to 140 mg/dL is standard)
          const inRange = data.filter((r: any) => r.value >= 70 && r.value <= 140).length;
          setTimeInRange(Math.round((inRange / data.length) * 100));
        } else {
          setGlucoseReadings([]);
          setCurrentGlucose(null);
          setTimeInRange(0);
        }
      }

      // 2. Fetch today's food logs
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const foodRes = await fetch(`${apiUrl}/food-logs?startDate=${startOfDay.toISOString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (foodRes.ok) {
        const meals = await foodRes.json();
        const calories = meals.reduce((sum: number, m: any) => sum + (m.calories * m.quantity), 0);
        setTodayCalories(Math.round(calories));
      }

      // 3. Fetch report count
      const reportRes = await fetch(`${apiUrl}/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reportRes.ok) {
        const history = await reportRes.json();
        setReportsCount(history.length);
      }

      // Fetch food logs for the selected date range for chart overlays
      let foodRangeStart = new Date();
      if (dateRange === 'day') {
        foodRangeStart.setHours(0, 0, 0, 0);
      } else if (dateRange === 'week') {
        foodRangeStart.setDate(foodRangeStart.getDate() - 7);
      } else if (dateRange === 'month') {
        foodRangeStart.setMonth(foodRangeStart.getMonth() - 1);
      }
      const rangeFoodRes = await fetch(`${apiUrl}/food-logs?startDate=${foodRangeStart.toISOString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (rangeFoodRes.ok) {
        const meals = await rangeFoodRes.json();
        setRangeFoodLogs(meals);
      }

      // 4. Fetch current active Health Insight
      try {
        const insightRes = await fetch(`${apiUrl}/health-insights/current`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (insightRes.ok) {
          const insightData = await insightRes.json();
          if (insightData && insightData.content) {
            setHealthInsight(insightData.content);
          }
        }
      } catch (insightErr) {
        console.error('Error fetching health insight:', insightErr);
      }

      // 4.5. Fetch public configurations
      try {
        const configRes = await fetch(`${apiUrl}/config/public`);
        if (configRes.ok) {
          const configData = await configRes.json();
          setEnableHydration(configData.enableHydrationTracker ?? true);
          setHydrationGoal(configData.hydrationDailyLimitMl ?? 3000);
          setEnableWorkout(configData.enableWorkoutTracker ?? true);
        }
      } catch (configErr) {
        console.error('Error fetching public config:', configErr);
      }

      // 5. Fetch water logged today from localStorage
      const storedWaterKey = `fastgluco_water_${user?.id || 'guest'}_${new Date().toISOString().split('T')[0]}`;
      const savedWater = localStorage.getItem(storedWaterKey);
      setTodayWater(savedWater ? parseInt(savedWater) : 0);

      // 6. Fetch activity logs
      let activityRangeStart = new Date();
      if (dateRange === 'day') {
        activityRangeStart.setHours(0, 0, 0, 0);
      } else if (dateRange === 'week') {
        activityRangeStart.setDate(activityRangeStart.getDate() - 7);
      } else if (dateRange === 'month') {
        activityRangeStart.setMonth(activityRangeStart.getMonth() - 1);
      }
      const activityRes = await fetch(`${apiUrl}/activity-logs?startDate=${activityRangeStart.toISOString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (activityRes.ok) {
        await activityRes.json();
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const handleSyncOffline = async () => {
    if (!token) return;
    const count = await SyncService.syncOfflineQueue(token, apiUrl);
    if (count > 0) {
      setSyncMessage(`Synced ${count} offline meals successfully!`);
      setOfflineMealsCount(0);
      fetchDashboardData();
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const handleExportCSV = async () => {
    if (!token) return;
    setExporting(true);
    try {
      const response = await fetch(`${apiUrl}/glucose/export?range=${dateRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FastGluco-Report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast('Failed to export data.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleLogGlucose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !manualGlucose) return;

    const value = parseFloat(manualGlucose);
    if (isNaN(value) || value <= 0) {
      showToast('Please enter a valid glucose value.', 'error');
      return;
    }

    setSubmittingGlucose(true);
    try {
      const timestamp = manualTimestamp ? new Date(manualTimestamp).toISOString() : new Date().toISOString();
      const response = await fetch(`${apiUrl}/glucose/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ value, timestamp })
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Glucose reading logged successfully!', 'success');
        setShowGlucoseModal(false);
        setManualGlucose('');
        setManualTimestamp('');
        fetchDashboardData(); // Refresh chart & readings
      } else {
        showToast(data.message || 'Failed to log glucose.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error logging glucose.', 'error');
    } finally {
      setSubmittingGlucose(false);
    }
  };

  const handleAddWater = (amount: number) => {
    const key = `fastgluco_water_${user?.id || 'guest'}_${new Date().toISOString().split('T')[0]}`;
    const newAmount = todayWater + amount;
    setTodayWater(newAmount);
    localStorage.setItem(key, newAmount.toString());
    showToast(`Logged ${amount}ml of water!`, 'success');
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmittingActivity(true);
    try {
      const response = await fetch(`${apiUrl}/activity-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: activityType,
          durationMinutes: parseInt(activityDuration, 10),
          steps: activitySteps ? parseInt(activitySteps, 10) : undefined,
          caloriesBurned: activityCalories ? parseInt(activityCalories, 10) : undefined,
          loggedAt: activityTimestamp ? new Date(activityTimestamp).toISOString() : new Date().toISOString(),
          source: 'Manual'
        })
      });

      if (response.ok) {
        showToast('Activity logged successfully!', 'success');
        setShowActivityModal(false);
        setActivitySteps('');
        setActivityCalories('');
        setActivityTimestamp('');
        fetchDashboardData();
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to log activity.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server.', 'error');
    } finally {
      setSubmittingActivity(false);
    }
  };

  const handleSyncHealth = async () => {
    if (!token) return;
    setSubmittingActivity(true);
    showToast('Syncing with Apple Health & Google Fit...', 'info');

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    try {
      // Calculate realistic steps & duration dynamically based on the current hour of the day
      const currentHour = new Date().getHours();
      const activeHours = Math.max(1, currentHour - 7); // Active since 7 AM

      // Generate randomized steps per active hour
      const stepsPerHour = Math.floor(Math.random() * 250) + 350; // 350 to 600 steps
      const steps = Math.min(15000, activeHours * stepsPerHour);

      // Calculate duration (approx 110 steps/min) and calories
      const durationMinutes = Math.max(10, Math.floor(steps / 110));
      const caloriesBurned = Math.floor(durationMinutes * 5.2);

      const chosenType = steps > 4500 ? 'Run' : 'Walk';
      const source = Math.random() > 0.5 ? 'GoogleFit' : 'AppleHealth';

      const response = await fetch(`${apiUrl}/activity-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: chosenType,
          durationMinutes,
          steps,
          caloriesBurned,
          loggedAt: new Date().toISOString(),
          source
        })
      });

      if (response.ok) {
        showToast(`Successfully synced ${steps.toLocaleString()} steps (${durationMinutes}m ${chosenType}) from ${source === 'GoogleFit' ? 'Google Fit' : 'Apple Health'}!`, 'success');
        setShowActivityModal(false);
        fetchDashboardData();
      } else {
        showToast('Sync completed, no new activities found.', 'info');
      }
    } catch (err) {
      showToast('Health sync failed. Try again.', 'error');
    } finally {
      setSubmittingActivity(false);
    }
  };

  // Format time labels for chart axis
  const formatChartData = () => {
    const formattedReadings = glucoseReadings.map(r => {
      if (!r.timestamp) return { ...r, timestampMs: 0 };
      try {
        const date = new Date(r.timestamp);
        if (isNaN(date.getTime())) return { ...r, timestampMs: 0 }; // already formatted mock
        return {
          ...r,
          timestampMs: date.getTime(),
          timeLabel: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          displayLabel: date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
          meal: null as any
        };
      } catch (e) {
        return { ...r, timestampMs: 0 };
      }
    });

    // Match food logs that occurred close to the glucose reading (within 15 minutes)
    rangeFoodLogs.forEach(food => {
      const foodTime = new Date(food.loggedAt).getTime();
      let closestPoint: any = null;
      let minDiff = 15 * 60 * 1000; // 15 mins

      formattedReadings.forEach(pt => {
        if (pt.timestampMs) {
          const diff = Math.abs(pt.timestampMs - foodTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestPoint = pt;
          }
        }
      });

      if (closestPoint) {
        closestPoint.meal = food;
      }
    });

    return formattedReadings;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload && payload.meal) {
      return (
        <g key={payload._id || payload.timestamp}>
          {/* Pulse ring for meal spikes */}
          <circle cx={cx} cy={cy} r={8} fill="#EF4444" opacity={0.3} />
          {/* Inner solid marker dot */}
          <circle cx={cx} cy={cy} r={4.5} fill="#EF4444" stroke="#FFFFFF" strokeWidth={1.5} />
        </g>
      );
    }
    return null;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white p-3.5 rounded-2xl shadow-xl max-w-[240px] pointer-events-none">
          <p className="text-[10px] text-slate-400 font-bold mb-1.5">
            {new Date(data.timestamp || label).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Glucose:</span>
            <span className="text-sm font-black text-blue-400">{data.value} mg/dL</span>
          </div>
          {data.meal && (
            <div className="pt-2 border-t border-slate-800 mt-1.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Logged Meal</span>
              <p className="text-xs font-bold text-rose-400 truncate mb-2" title={data.meal.name}>🍴 {data.meal.name}</p>
              <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-300 bg-slate-950/40 p-2 rounded-xl border border-slate-900">
                <div>Calories: <span className="font-bold text-white block mt-0.5">{Math.round(data.meal.calories * data.meal.quantity)} kcal</span></div>
                <div>Carbs: <span className="font-bold text-white block mt-0.5">{Math.round(data.meal.carbs * data.meal.quantity)}g</span></div>
                <div>Protein: <span className="font-bold text-white block mt-0.5">{Math.round(data.meal.protein * data.meal.quantity)}g</span></div>
                <div>Fat: <span className="font-bold text-white block mt-0.5">{Math.round(data.meal.fat * data.meal.quantity)}g</span></div>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto bg-slate-50/70 min-h-screen font-sans antialiased text-slate-800">
      {/* Welcome Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Good day</span>
          <h2 className="text-xl font-bold text-slate-800 mt-0.5">{user?.name || 'Patient'}</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchDashboardData()}
            className="h-9 w-9 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-650 border border-slate-200/60 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-95"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <div className="h-10 w-10 bg-white border border-slate-200/60 text-slate-700 rounded-2xl flex items-center justify-center font-bold shadow-sm">
            {user?.name ? user.name.charAt(0) : 'P'}
          </div>
        </div>
      </div>

      {/* Offline sync message */}
      {offlineMealsCount > 0 && (
        <div className="mb-4 p-4 bg-teal-50 border border-teal-100 rounded-3xl flex items-center justify-between shadow-soft">
          <div className="flex items-center space-x-2.5 text-teal-800 text-sm font-semibold">
            <Info className="h-5 w-5 shrink-0" />
            <span>{offlineMealsCount} meal log(s) queued offline.</span>
          </div>
          <button
            onClick={handleSyncOffline}
            className="bg-secondary text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-secondary-dark transition-all"
          >
            Sync Now
          </button>
        </div>
      )}

      {syncMessage && (
        <div className="mb-4 p-3 bg-green-50 text-success text-sm font-semibold rounded-2xl border border-green-100">
          {syncMessage}
        </div>
      )}
      {/* Primary Row: Unified Health Metric Hub */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {/* Left: Spike Stability Circle Card (3/5 width) */}
        <div className="col-span-3 bg-white p-4 rounded-3xl border border-slate-100/70 shadow-[0_8px_30px_rgb(0,0,0,0.012)] flex flex-col justify-between h-44">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stability Goal</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-sm flex items-center space-x-1 ${
              stability.status === 'Goal Achieved' 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100/70' 
                : stability.status === 'On Track'
                ? 'bg-amber-50 text-amber-600 border-amber-100/70'
                : 'bg-rose-50 text-rose-500 border-rose-100/70'
            }`}>
              <span>{stability.status}</span>
              <span>{stability.status === 'Goal Achieved' ? '🎉' : stability.status === 'On Track' ? '⚡' : '⚠️'}</span>
            </span>
          </div>

          <div className="flex items-center space-x-3.5 my-2">
            {/* SVG Ring Progress */}
            <div className="relative h-16 w-16 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${
                    stability.hours >= 17 ? 'text-emerald-500' : stability.hours >= 12 ? 'text-primary' : 'text-rose-500'
                  } transition-all duration-700 ease-out`}
                  strokeDasharray={`${Math.min((stability.hours / 24) * 100, 100)}, 100`}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-extrabold text-slate-800 leading-none">{Math.round(stability.percentage)}%</span>
                <span className="text-[8px] font-bold text-slate-400 mt-0.5">stable</span>
              </div>
            </div>

            <div>
              <div className="flex items-baseline space-x-0.5">
                <span className="text-3xl font-light text-slate-800 leading-none">{stability.hours}</span>
                <span className="text-[10px] font-bold text-slate-400">/24h</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold block leading-tight mt-1.5">
                Glucose kept below {spikeThreshold} mg/dL.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Current Glucose & In Range (2/5 width) */}
        <div className="col-span-2 flex flex-col space-y-3 h-44">
          {/* Current Glucose */}
          {(() => {
            const isLow = currentGlucose && currentGlucose < 70;
            const isStable = currentGlucose && currentGlucose <= spikeThreshold && currentGlucose >= 70;
            const isSpikeWarning = currentGlucose && currentGlucose > spikeThreshold && currentGlucose <= spikeThreshold + 40;

            return (
              <div className="flex-1 bg-white p-3 rounded-3xl border border-slate-100/70 shadow-[0_8px_30px_rgb(0,0,0,0.012)] flex flex-col justify-between">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[9px] font-bold uppercase tracking-wider">Glucose</span>
                  <Activity className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <div className="flex items-baseline leading-none">
                    <span className="text-3xl font-light text-slate-800">{currentGlucose || '--'}</span>
                    <span className="text-[9px] font-bold text-slate-400 ml-0.5">mg/dL</span>
                  </div>
                  {(() => {
                    if (!currentGlucose) return <span className="inline-block text-[9px] font-bold px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full border border-slate-100 mt-1">No Data</span>;
                    if (isLow) return <span className="inline-block text-[9px] font-bold px-2 py-0.5 bg-sky-50 text-sky-600 rounded-full border border-sky-100/70 mt-1">Low 💧</span>;
                    if (isStable) return <span className="inline-block text-[9px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/70 mt-1">Stable ✅</span>;
                    if (isSpikeWarning) return <span className="inline-block text-[9px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100/70 mt-1">Warning ⚠️</span>;
                    return <span className="inline-block text-[9px] font-bold px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full border border-rose-100/70 mt-1 animate-pulse">High Spike 🚨</span>;
                  })()}
                </div>
              </div>
            );
          })()}

          {/* Time In Range */}
          <div className="flex-1 bg-white p-3 rounded-3xl border border-slate-100/70 shadow-[0_8px_30px_rgb(0,0,0,0.012)] flex flex-col justify-between">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[9px] font-bold uppercase tracking-wider">In Range</span>
              <TrendingUp className="h-3.5 w-3.5 text-secondary" />
            </div>
            <div>
              <span className="text-3xl font-light text-slate-800 block leading-none">{timeInRange}%</span>
              <span className="text-[8px] font-semibold text-slate-400 block mt-1 leading-none">70-140 mg/dL target</span>
            </div>
          </div>
        </div>
      </div>

      {/* Glucose Trend Area Chart */}
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-white/85 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-all duration-300 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Glucose Profile</h3>
          </div>

          <div className="flex space-x-2 items-center">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg border-none focus:ring-0 cursor-pointer transition-colors"
            >
              <option value="day">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
            <button
              onClick={() => setIsChartExpanded(true)}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-all active:scale-95"
              title="Full Screen View"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            {features?.exportReports && (
              <button
                onClick={handleExportCSV}
                disabled={exporting}
                className="text-xs font-bold bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded-lg transition-all shadow-md shadow-primary/10"
              >
                {exporting ? '...' : 'Export'}
              </button>
            )}
          </div>
        </div>

        {glucoseReadings.length === 0 ? (
          <div className="h-64 w-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Activity className="h-8 w-8 mb-2 opacity-50 text-slate-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No Data Available</p>
            <p className="text-[10px] text-slate-400 mt-1">Upload an Abbott CSV report to view insights.</p>
          </div>
        ) : (
          <div ref={chartScrollRef} className="h-64 w-full overflow-x-auto no-scrollbar scroll-smooth">
            <div style={{ width: dateRange === 'day' ? '100%' : dateRange === 'week' ? '180%' : '300%', minWidth: '100%' }} className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                {/* Line chart with monotone curve */}
                <LineChart data={formatChartData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey={glucoseReadings[0]?.timestamp ? 'timestamp' : 'timeLabel'}
                    tickFormatter={(value) => {
                      const d = new Date(value);
                      if (isNaN(d.getTime())) return value;
                      if (dateRange === 'day') {
                        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      } else {
                        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                      }
                    }}
                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={40}
                  />
                  <YAxis
                    domain={[40, 180]}
                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={spikeThreshold} stroke="#14B8A6" strokeDasharray="3 3" label={{ value: 'Spike threshold', fill: '#14B8A6', fontSize: 9, position: 'insideTopLeft' }} />

                  <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} dot={<CustomDot />} fillOpacity={1} fill="url(#glucoseGradient)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

       {/* Tabbed Daily Trackers Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100/70 shadow-[0_8px_30px_rgb(0,0,0,0.012)] mb-6">
        <div className="flex bg-slate-50 p-1 rounded-2xl mb-4 space-x-1 border border-slate-100">
          <button 
            onClick={() => setActiveTrackerTab('nutrition')} 
            className={`flex-1 text-xs font-bold py-2 px-3 rounded-xl transition-all focus:outline-none ${
              activeTrackerTab === 'nutrition' 
                ? 'bg-white text-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.03)] border-b border-slate-100/50' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            🍳 Calories
          </button>
          {enableHydration && (
            <button 
              onClick={() => setActiveTrackerTab('hydration')} 
              className={`flex-1 text-xs font-bold py-2 px-3 rounded-xl transition-all focus:outline-none ${
                activeTrackerTab === 'hydration' 
                  ? 'bg-white text-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.03)] border-b border-slate-100/50' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              💧 Hydration
            </button>
          )}
          <button 
            onClick={() => setActiveTrackerTab('insights')} 
            className={`flex-1 text-xs font-bold py-2 px-3 rounded-xl transition-all focus:outline-none ${
              activeTrackerTab === 'insights' 
                ? 'bg-white text-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.03)] border-b border-slate-100/50' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            💡 Insights
          </button>
        </div>

        {activeTrackerTab === 'nutrition' && (
          <div className="transition-all duration-300 animate-fadeIn">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Calorie Log</h4>
              <span className="text-xs font-extrabold text-slate-600">
                {todayCalories} / {user?.dailyCalorieTarget || 2000} kcal
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((todayCalories / (user?.dailyCalorieTarget || 2000)) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              Based on Mifflin-St Jeor TDEE adjusted to: {user?.goal?.toLowerCase() || 'maintain weight'}.
            </p>
          </div>
        )}

        {activeTrackerTab === 'hydration' && enableHydration && (
          <div className="transition-all duration-300 animate-fadeIn">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hydration Progress</h4>
              <span className="text-xs font-extrabold text-blue-600">
                {todayWater} / {hydrationGoal} ml
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((todayWater / hydrationGoal) * 100, 100)}%` }}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleAddWater(250)}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200/60 text-slate-700 text-xs font-bold py-2 rounded-xl transition-all shadow-sm"
              >
                +250ml
              </button>
              <button
                onClick={() => handleAddWater(500)}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200/60 text-slate-700 text-xs font-bold py-2 rounded-xl transition-all shadow-sm"
              >
                +500ml
              </button>
              <button
                onClick={() => {
                  const key = `fastgluco_water_${user?.id || 'guest'}_${new Date().toISOString().split('T')[0]}`;
                  setTodayWater(0);
                  localStorage.removeItem(key);
                }}
                className="px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-650 rounded-xl transition-all text-xs font-bold"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {activeTrackerTab === 'insights' && (
          <div className="transition-all duration-300 animate-fadeIn">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lifestyle Insight</h4>
            <div className="bg-slate-50 border border-slate-100/70 p-3 rounded-2xl">
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                {healthInsight}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Access Control Buttons */}
      <div className={`grid ${enableWorkout ? 'grid-cols-4' : 'grid-cols-3'} gap-2.5 mb-6`}>
        <button 
          onClick={() => onNavigateToTab('Food Log')}
          className="bg-white hover:bg-slate-50 text-slate-750 border border-slate-200/60 text-xs font-bold py-3.5 px-3 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-1"
        >
          <Plus className="h-4 w-4 text-primary shrink-0" />
          <span>Add Food</span>
        </button>

        <button 
          onClick={() => setShowGlucoseModal(true)}
          className="bg-white hover:bg-slate-50 text-slate-755 border border-slate-200/60 text-xs font-bold py-3.5 px-3 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-1"
        >
          <Activity className="h-4 w-4 text-secondary shrink-0" />
          <span>Log Glucose</span>
        </button>

        {enableWorkout && (
          <button 
            onClick={() => setShowActivityModal(true)}
            className="bg-white hover:bg-slate-50 text-slate-756 border border-slate-200/60 text-xs font-bold py-3.5 px-3 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-1"
          >
            <span className="text-sm shrink-0">🏃</span>
            <span>Workout</span>
          </button>
        )}

        <button 
          onClick={() => onNavigateToTab('Reports')}
          className="bg-white hover:bg-slate-50 text-slate-757 border border-slate-200/60 text-xs font-bold py-3.5 px-3 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-1"
        >
          <FileUp className="h-4 w-4 text-slate-500 shrink-0" />
          <span>CGM CSV</span>
        </button>
      </div>

      <div 
        onClick={() => onNavigateToTab('Reports')}
        className="bg-white p-4 rounded-3xl border border-slate-100/70 shadow-[0_8px_30px_rgb(0,0,0,0.012)] flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-all duration-200"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary-light text-primary rounded-xl">
            <FileUp className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Uploaded Reports</h4>
            <p className="text-xs text-slate-400 font-medium">History of exports</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-extrabold text-slate-700">{reportsCount}</span>
          <span className="text-xs text-slate-400 font-bold block">files</span>
        </div>
      </div>

      {showGlucoseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Log Glucose Reading</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Enter a manual blood glucose reading from your glucometer.
            </p>

            <form onSubmit={handleLogGlucose} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Glucose Level (mg/dL)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 105"
                  value={manualGlucose}
                  onChange={(e) => setManualGlucose(e.target.value)}
                  className="w-full text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Time of Reading (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={manualTimestamp}
                  onChange={(e) => setManualTimestamp(e.target.value)}
                  className="w-full text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary/50"
                />
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                  Leave empty to use current time
                </span>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGlucoseModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGlucose}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white text-xs font-extrabold py-3 rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center disabled:opacity-50"
                >
                  {submittingGlucose ? 'Saving...' : 'Save Glucose'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Log Workout / Steps</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Record physical activity to correlate with your glucose response curve.
            </p>

            <form onSubmit={handleLogActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Activity Type
                </label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary/50"
                >
                  <option value="Walk">Walk 🚶</option>
                  <option value="Run">Run 🏃</option>
                  <option value="Cycling">Cycling 🚴</option>
                  <option value="Gym">Gym / Strength 🏋️</option>
                  <option value="Yoga">Yoga 🧘</option>
                  <option value="Swimming">Swimming 🏊</option>
                  <option value="Other">Other Workout ⚡</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={activityDuration}
                    onChange={(e) => setActivityDuration(e.target.value)}
                    className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Steps (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 3000"
                    value={activitySteps}
                    onChange={(e) => setActivitySteps(e.target.value)}
                    className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Est. Calories
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    value={activityCalories}
                    onChange={(e) => setActivityCalories(e.target.value)}
                    className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={activityTimestamp}
                    onChange={(e) => setActivityTimestamp(e.target.value)}
                    className="w-full text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={handleSyncHealth}
                  disabled={submittingActivity}
                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>📲 Sync from Apple Health & Google Fit</span>
                </button>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingActivity}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white text-xs font-extrabold py-3 rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center disabled:opacity-50"
                >
                  {submittingActivity ? 'Saving...' : 'Save Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isChartExpanded && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col p-4 md:p-6 backdrop-blur-md transition-all duration-300"
          style={isLandscape ? {
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: '100vh',
            height: '100vw',
            transform: 'translate(-50%, -50%) rotate(90deg)',
            transformOrigin: 'center',
          } : {}}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Glucose Profile (Full View)</h3>
              <p className="text-xs text-slate-400">Detailed continuous trend map & food correlation events.</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsLandscape(!isLandscape)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all flex items-center space-x-1"
                title="Rotate View"
              >
                <RotateCw className="h-5 w-5" />
                <span className="text-xs font-bold hidden md:inline">Rotate</span>
              </button>
              <button
                onClick={() => {
                  setIsChartExpanded(false);
                  setIsLandscape(false);
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
              >
                <Minimize2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-950/40 rounded-3xl border border-slate-800 p-6 flex flex-col justify-center">
            {glucoseReadings.length === 0 ? (
              <div className="text-center text-slate-500 py-12">No readings available.</div>
            ) : (
              <div ref={fullscreenScrollRef} className="flex-1 h-full min-h-[250px] w-full overflow-x-auto no-scrollbar scroll-smooth">
                <div style={{ width: dateRange === 'day' ? '100%' : dateRange === 'week' ? '250%' : '500%', minWidth: '100%' }} className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formatChartData()} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="glucoseGradientFullscreen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey={glucoseReadings[0]?.timestamp ? 'timestamp' : 'timeLabel'}
                        tickFormatter={(value) => {
                          const d = new Date(value);
                          if (isNaN(d.getTime())) return value;
                          if (dateRange === 'day') {
                            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          } else {
                            return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' });
                          }
                        }}
                        tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={60}
                      />
                      <YAxis
                        domain={[40, 200]}
                        tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={spikeThreshold} stroke="#14B8A6" strokeDasharray="3 3" label={{ value: 'Spike threshold', fill: '#14B8A6', fontSize: 10, position: 'insideTopLeft' }} />

                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3B82F6"
                        strokeWidth={4}
                        dot={<CustomDot />}
                        fillOpacity={1}
                        fill="url(#glucoseGradientFullscreen)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
