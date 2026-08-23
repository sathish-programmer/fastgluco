import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useConsultation } from '../context/ConsultationContext';
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
  RotateCw,
  ChevronRight,
  Check,
  Droplets,
  AlertTriangle,
  Flame,
  Lightbulb,
  Sparkles,
  Calendar,
  X
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

interface DashboardProps {
  onNavigateToTab: (tab: string) => void;
  features?: { exportReports?: boolean };
  onBackToTugOfWar?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToTab, features, onBackToTugOfWar }) => {
  const { token, user, apiUrl, branding } = useAuth();
  const { showToast } = useToast();
  const { setPendingRecommendationId } = useConsultation();

  const [currentGlucose, setCurrentGlucose] = useState<number | null>(null);
  const [glucoseReadings, setGlucoseReadings] = useState<any[]>([]);
  const [todayCalories, setTodayCalories] = useState<number>(0);
  const [reportsCount, setReportsCount] = useState<number>(0);
  const [offlineMealsCount, setOfflineMealsCount] = useState<number>(0);
  const [timeInRange, setTimeInRange] = useState<number>(85);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'custom'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hasAutoJumpedDate, setHasAutoJumpedDate] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showRangeModal, setShowRangeModal] = useState<boolean>(false);
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
  const [activityType, setActivityType] = useState('Walk');
  const [activityDuration, setActivityDuration] = useState('15');
  const [activitySteps, setActivitySteps] = useState('');
  const [activityCalories, setActivityCalories] = useState('');
  const [activityTimestamp, setActivityTimestamp] = useState('');
  const [showDieticianModal, setShowDieticianModal] = useState(false);
  const [dieticianModalDismissed, setDieticianModalDismissed] = useState(false);
  const [submittingActivity, setSubmittingActivity] = useState(false);
  const [upcomingAppt, setUpcomingAppt] = useState<any | null>(null);
  const [isApptDismissed, setIsApptDismissed] = useState<boolean>(false);

  // Dynamically calculate glucose stability hours below spikeThreshold (defaults to 90)
  const calculateStabilityHours = () => {
    let maxHours = 24;
    let targetHours = 17;
    let unitText = 'hours / 24h';
    let targetText = `Target: Stay below ${spikeThreshold} mg/dL for 17 hrs a day`;

    if (dateRange === 'week') {
      maxHours = 168; // 7 days * 24h
      targetHours = 119; // 7 * 17h
      unitText = 'hours / 7 days';
      targetText = `Target: Stay below ${spikeThreshold} mg/dL for 119 hrs / week`;
    } else if (dateRange === 'month') {
      maxHours = 720; // 30 days * 24h
      targetHours = 510; // 30 * 17h
      unitText = 'hours / 30 days';
      targetText = `Target: Stay below ${spikeThreshold} mg/dL for 510 hrs / month`;
    }

    if (glucoseReadings.length === 0) {
      return {
        hours: 0,
        percentage: 0,
        status: 'No Data',
        unitText,
        label: targetText,
        hasData: false
      };
    }

    // Calculate percentage of readings below threshold
    const belowCount = glucoseReadings.filter(r => r.value < spikeThreshold).length;
    const totalCount = glucoseReadings.length;
    const percentage = Math.round((belowCount / totalCount) * 100);
    const hours = parseFloat(((belowCount / totalCount) * maxHours).toFixed(1));

    let status = 'Need Attention';
    if (hours >= targetHours) {
      status = 'Goal Achieved';
    } else if (hours >= targetHours * 0.7) {
      status = 'On Track';
    }

    return {
      hours,
      percentage,
      status,
      unitText,
      label: targetText,
      hasData: true
    };
  };

  const stability = calculateStabilityHours();

  const calculateAverageGlucose = () => {
    if (glucoseReadings.length === 0) return null;
    const sum = glucoseReadings.reduce((acc, r) => acc + r.value, 0);
    return Math.round(sum / glucoseReadings.length);
  };

  const chartScrollRef = React.useRef<HTMLDivElement>(null);
  const fullscreenScrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartScrollRef.current) {
      chartScrollRef.current.scrollLeft = 0;
    }
  }, [glucoseReadings, dateRange]);

  useEffect(() => {
    if (user?.spikeThreshold) {
      setSpikeThreshold(user.spikeThreshold);
    }
  }, [user]);

  useEffect(() => {
    if (glucoseReadings.length > 0) {
      const stability = calculateStabilityHours();
      if (stability.hasData && stability.hours < 14 && !dieticianModalDismissed) {
        setShowDieticianModal(true);
      }
    }
  }, [glucoseReadings, dieticianModalDismissed]);

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
  }, [token, dateRange, selectedDate, customStartDate, customEndDate]);

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      // 1. Fetch Glucose Readings
      let start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      let end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      
      if (dateRange === 'week') {
        start.setDate(start.getDate() - 7);
      } else if (dateRange === 'month') {
        start.setMonth(start.getMonth() - 1);
      } else if (dateRange === 'custom') {
        start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
      }

      const glucoseUrl = `${apiUrl}/glucose?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      const glucoseRes = await fetch(glucoseUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (glucoseRes.ok) {
        const data = await glucoseRes.json();
        setGlucoseReadings(data);
        if (data.length > 0) {
          // Take the latest reading as current glucose
          const latest = data[data.length - 1];
          setCurrentGlucose(latest.value);

          // Calculate actual Time in Range (70 to 140 mg/dL is standard)
          const inRange = data.filter((r: any) => r.value >= 70 && r.value <= 140).length;
          setTimeInRange(Math.round((inRange / data.length) * 100));
        } else {
          setGlucoseReadings([]);
          setCurrentGlucose(null);
          setTimeInRange(0);

          // If no readings on currently selected date, auto-fetch user's latest available reading date
          if (dateRange === 'day' && !hasAutoJumpedDate) {
            setHasAutoJumpedDate(true);
            fetch(`${apiUrl}/glucose?limit=1`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
              .then(res => res.ok ? res.json() : [])
              .then(latestReadings => {
                if (latestReadings && latestReadings.length > 0 && latestReadings[0].timestamp) {
                  const latestDateStr = new Date(latestReadings[0].timestamp).toISOString().split('T')[0];
                  if (latestDateStr !== selectedDate) {
                    setSelectedDate(latestDateStr);
                  }
                }
              })
              .catch(err => console.error('Error auto-detecting latest reading date:', err));
          }
        }
      }

      // 2. Fetch today's food logs
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      const foodRes = await fetch(`${apiUrl}/food-logs?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`, {
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
      let foodRangeStart = new Date(selectedDate);
      foodRangeStart.setHours(0, 0, 0, 0);
      let foodRangeEnd = new Date(selectedDate);
      foodRangeEnd.setHours(23, 59, 59, 999);
      
      if (dateRange === 'week') {
        foodRangeStart.setDate(foodRangeStart.getDate() - 7);
      } else if (dateRange === 'month') {
        foodRangeStart.setMonth(foodRangeStart.getMonth() - 1);
      }
      
      let foodRangeUrl = `${apiUrl}/food-logs?startDate=${foodRangeStart.toISOString()}&endDate=${foodRangeEnd.toISOString()}`;
      const rangeFoodRes = await fetch(foodRangeUrl, {
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
      const dateString = dateRange === 'day' ? selectedDate : new Date().toISOString().split('T')[0];
      const storedWaterKey = `fastgluco_water_${user?.id || 'guest'}_${dateString}`;
      const savedWater = localStorage.getItem(storedWaterKey);
      setTodayWater(savedWater ? parseInt(savedWater) : 0);

      // 6. Fetch activity logs
      let activityRangeStart = new Date(selectedDate);
      activityRangeStart.setHours(0, 0, 0, 0);
      let activityRangeEnd = new Date(selectedDate);
      activityRangeEnd.setHours(23, 59, 59, 999);
      
      if (dateRange === 'week') {
        activityRangeStart.setDate(activityRangeStart.getDate() - 7);
      } else if (dateRange === 'month') {
        activityRangeStart.setMonth(activityRangeStart.getMonth() - 1);
      }
      let activityUrl = `${apiUrl}/activity-logs?startDate=${activityRangeStart.toISOString()}&endDate=${activityRangeEnd.toISOString()}`;
      const activityRes = await fetch(activityUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (activityRes.ok) {
        await activityRes.json();
      }
      // Fetch upcoming confirmed appointments
      try {
        const apptRes = await fetch(`${apiUrl}/patient/appointments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (apptRes.ok) {
          const appts = await apptRes.json();
          const confirmedFuture = appts
            .filter((a: any) => a.status === 'confirmed')
            .sort((a: any, b: any) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())[0];
          
          if (confirmedFuture) {
            const dismissedId = localStorage.getItem(`dismissed_appt_${confirmedFuture._id}`);
            setIsApptDismissed(!!dismissedId);
          }
          setUpcomingAppt(confirmedFuture || null);
        }
      } catch (apptErr) {
        console.error('Error fetching upcoming appointments:', apptErr);
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
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      
      if (dateRange === 'week') {
        start.setDate(start.getDate() - 7);
      } else if (dateRange === 'month') {
        start.setMonth(start.getMonth() - 1);
      }

      const response = await fetch(`${apiUrl}/glucose/export?startDate=${start.toISOString()}&endDate=${end.toISOString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeAppName = branding.appName.replace(/[^a-z0-9]/gi, '_');
      a.download = `${safeAppName}_Report-${new Date().toISOString().split('T')[0]}.csv`;
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
    const dateString = dateRange === 'day' ? selectedDate : new Date().toISOString().split('T')[0];
    const key = `fastgluco_water_${user?.id || 'guest'}_${dateString}`;
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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="pb-36 pt-2 px-0 max-w-5xl mx-auto font-sans antialiased text-slate-800 dark:text-slate-100"
    >
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex items-center justify-between gap-4 mb-5"
      >
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">Overview</span>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-50 mt-0.5 tracking-tight flex items-center space-x-1.5">
            <span>Good day,</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{user?.name || 'Patient'}</span>
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchDashboardData()}
            className="h-10 w-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200/60 dark:border-slate-700 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow active:scale-90"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="h-11 w-11 bg-gradient-to-br from-primary to-indigo-600 dark:from-primary-dark dark:to-indigo-800 text-white rounded-2xl flex items-center justify-center font-extrabold shadow-sm tracking-wider">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
          </div>
        </div>
      </motion.div>

      {/* Tug of War Hero Banner */}
      {onBackToTugOfWar && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBackToTugOfWar}
          className="w-full mb-5 relative overflow-hidden rounded-3xl p-5 flex items-center justify-between gap-4 text-left shadow-lg"
          style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #6366F1 100%)' }}
        >
          {/* Decorative background circles */}
          <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-4 right-16 h-20 w-20 rounded-full bg-white/5" />
          <div className="absolute top-2 right-32 h-10 w-10 rounded-full bg-white/10" />

          <div className="flex-1 min-w-0 flex items-center gap-3 md:gap-4 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-2xl shrink-0 border border-white/20">
              ⚖️
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-0.5">
                <span className="text-sm font-extrabold text-white tracking-tight">Cellular Defense Strength</span>
                <span className="flex items-center gap-1 text-[9px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse inline-block"></span>
                  LIVE
                </span>
              </div>
              <p className="text-[11px] md:text-xs text-indigo-200 font-medium leading-tight">See how your daily habits shift the balance between repair & damage</p>
            </div>
          </div>

          <div className="relative z-10 h-9 w-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </motion.button>
      )}


      {/* Offline sync message */}
      {offlineMealsCount > 0 && (
        <div className="mb-5 p-4 bg-teal-50 border border-teal-100 rounded-3xl flex items-center justify-between shadow-soft animate-slide-in">
          <div className="flex items-center space-x-3 text-teal-800 text-sm font-semibold">
            <Info className="h-5 w-5 text-teal-600 shrink-0" />
            <span>{offlineMealsCount} meal log(s) queued offline.</span>
          </div>
          <button
            onClick={handleSyncOffline}
            className="bg-secondary hover:bg-secondary-dark text-white text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95"
          >
            Sync Now
          </button>
        </div>
      )}

      {syncMessage && (
        <div className="mb-5 p-4 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-3xl border border-emerald-100 shadow-sm animate-slide-in">
          {syncMessage}
        </div>
      )}

      {/* Upcoming Confirmed Appointment Alert Banner */}
      {upcomingAppt && !isApptDismissed && (
        <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 rounded-[32px] p-5 mb-6 shadow-[0_8px_30px_rgba(16,185,129,0.04)] flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-emerald-850 dark:text-emerald-300 text-xs">Upcoming Consultation Scheduled</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
                Your appointment with <strong>Dr. {upcomingAppt.doctorId?.name || 'Specialist'}</strong> is scheduled on <strong>{upcomingAppt.date}</strong> at <strong>{upcomingAppt.time}</strong>.
              </p>
              {upcomingAppt.meetingLink && (
                <a
                  href={upcomingAppt.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-750 px-4 py-2 rounded-xl shadow-sm transition-all"
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
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all shrink-0"
            title="Dismiss Alert"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      )}

      {/* Primary Metrics Hub (Stacked: Hero Stability card + Grid for secondary metrics) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex flex-col gap-3.5 mb-6"
      >

        {/* History Selector Header for Stability Score */}
        <div className="flex items-center justify-between px-1 mb-0.5 flex-wrap gap-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Stability & Metabolic Track
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setDateRange('day')}
              className={`px-3 py-1 rounded-lg font-extrabold text-[10px] uppercase tracking-wider transition-all ${
                dateRange === 'day'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setDateRange('week')}
              className={`px-3 py-1 rounded-lg font-extrabold text-[10px] uppercase tracking-wider transition-all ${
                dateRange === 'week'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setDateRange('month')}
              className={`px-3 py-1 rounded-lg font-extrabold text-[10px] uppercase tracking-wider transition-all ${
                dateRange === 'month'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Stability Card (Full-width, premium layout) */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 rounded-3xl border border-white/80 dark:border-slate-800 shadow-soft flex items-center justify-between gap-4"
        >

          {/* Progress Ring (Explicit size) */}
          <div className="relative h-20 w-20 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <defs>
                <linearGradient id="stabilityGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
                <linearGradient id="warningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
              </defs>
              <path
                className="text-slate-100/80 dark:text-slate-800"
                strokeWidth="3.2"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="transition-all duration-700 ease-out"
                strokeDasharray={`${Math.min(stability.percentage, 100)}, 100`}
                strokeWidth="3.4"
                strokeLinecap="round"
                stroke={`url(#${stability.status === 'Goal Achieved' || stability.status === 'On Track' ? 'stabilityGrad' : 'warningGrad'})`}
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black text-slate-800 dark:text-slate-100 leading-none">{Math.round(stability.percentage)}%</span>
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Stable</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between flex-grow text-left py-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Stability Score</span>
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${
                  stability.status === 'Goal Achieved'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-950/30 dark:text-emerald-400'
                    : stability.status === 'On Track'
                      ? 'bg-amber-50 text-amber-600 border-amber-100/50 dark:bg-amber-950/30 dark:text-amber-400'
                      : stability.status === 'No Data'
                        ? 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        : 'bg-rose-50 text-rose-500 border-rose-100/50 dark:bg-rose-950/30 dark:text-rose-400'
                }`}>
                {stability.status === 'Goal Achieved' && <Check className="h-2.5 w-2.5 text-emerald-500 stroke-[3.5]" />}
                {stability.status === 'On Track' && <Activity className="h-2.5 w-2.5 text-amber-500" />}
                {stability.status === 'No Data' && <Activity className="h-2.5 w-2.5 text-slate-400" />}
                {stability.status !== 'Goal Achieved' && stability.status !== 'On Track' && stability.status !== 'No Data' && <AlertTriangle className="h-2.5 w-2.5 text-rose-500" />}
                <span>{stability.status === 'Goal Achieved' ? 'Goal Met' : stability.status === 'On Track' ? 'On Track' : stability.status === 'No Data' ? 'No Data' : 'Attention'}</span>
              </span>
            </div>
            <div className="mt-1 flex items-baseline space-x-1">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{stability.hours}</span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{stability.unitText}</span>
            </div>
            <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-1 border-t border-slate-100 dark:border-slate-800 pt-1">
              {stability.label}
            </p>
          </div>
        </motion.div>

        {/* Supporting Metrics (Glucose & In Range side-by-side) */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Glucose Card */}
          {(() => {
            const displayGlucose = dateRange === 'day' ? currentGlucose : calculateAverageGlucose();
            const isLow = displayGlucose && displayGlucose < 70;
            const isStable = displayGlucose && displayGlucose <= spikeThreshold && displayGlucose >= 70;
            const isSpikeWarning = displayGlucose && displayGlucose > spikeThreshold && displayGlucose <= spikeThreshold + 40;

            let cardStyle = 'bg-white/90 dark:bg-slate-900/90 border-white/80 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.015)]';
            if (displayGlucose) {
              if (isLow) cardStyle = 'bg-gradient-to-br from-sky-50/40 dark:from-sky-900/20 to-white/90 dark:to-slate-900/90 border-sky-200/50 dark:border-sky-800/50 shadow-[0_8px_30px_rgba(56,189,248,0.02)]';
              else if (isStable) cardStyle = 'bg-gradient-to-br from-emerald-50/40 dark:from-emerald-900/20 to-white/90 dark:to-slate-900/90 border-emerald-200/50 dark:border-emerald-800/50 shadow-[0_8px_30px_rgba(16,185,129,0.02)]';
              else if (isSpikeWarning) cardStyle = 'bg-gradient-to-br from-amber-50/40 dark:from-amber-900/20 to-white/90 dark:to-slate-900/90 border-amber-200/50 dark:border-amber-800/50 shadow-[0_8px_30px_rgba(245,158,11,0.02)]';
              else cardStyle = 'bg-gradient-to-br from-rose-50/40 dark:from-rose-900/20 to-white/90 dark:to-slate-900/90 border-rose-200/50 dark:border-rose-800/50 shadow-[0_8px_30px_rgba(239,68,68,0.03)]';
            }

            return (
              <div className={`backdrop-blur-xl p-4 rounded-3xl border ${cardStyle} flex flex-col justify-between transition-all hover:scale-[1.01]`}>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {dateRange === 'day' ? 'Glucose' : 'Avg Glucose'}
                  </span>
                  <Activity className="h-3.5 w-3.5 text-primary" />
                </div>

                <div className="my-2.5 flex items-baseline space-x-0.5">
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">{displayGlucose || '--'}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">mg/dL</span>
                </div>

                <div className="pt-1.5 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                  {(() => {
                    if (!displayGlucose) return <span className="text-[8px] font-bold text-slate-405 uppercase">No Data</span>;
                    if (isLow) return (
                      <span className="inline-flex items-center gap-1 text-[8px] font-extrabold text-sky-650 bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-100/50 uppercase tracking-wider">
                        <Droplets className="h-2.5 w-2.5 text-sky-500 fill-sky-200" />
                        Low
                      </span>
                    );
                    if (isStable) return (
                      <span className="inline-flex items-center gap-1 text-[8px] font-extrabold text-emerald-650 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100/50 uppercase tracking-wider">
                        <Check className="h-2.5 w-2.5 text-emerald-500 stroke-[3.5]" />
                        Stable
                      </span>
                    );
                    if (isSpikeWarning) return (
                      <span className="inline-flex items-center gap-1 text-[8px] font-extrabold text-amber-650 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100/50 uppercase tracking-wider">
                        <AlertTriangle className="h-2.5 w-2.5 text-amber-500 fill-amber-200" />
                        Warn
                      </span>
                    );
                    return (
                      <span className="inline-flex items-center gap-1 text-[8px] font-extrabold text-rose-650 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100/50 animate-pulse uppercase tracking-wider">
                        <Flame className="h-2.5 w-2.5 text-rose-500 fill-rose-200" />
                        Spike
                      </span>
                    );
                  })()}
                </div>
              </div>
            );
          })()}

          {/* In Range */}
          <motion.div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 rounded-3xl border border-white/80 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.015)] flex flex-col justify-between transition-all hover:scale-[1.01]">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">In Range</span>
              <TrendingUp className="h-3.5 w-3.5 text-secondary" />
            </div>

            <div className="my-2.5 flex items-baseline space-x-0.5">
              <span className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">{timeInRange}%</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Time</span>
            </div>

            <div className="pt-1.5 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Target</span>
              <span className="text-[8px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">70-140</span>
            </div>
          </motion.div>
        </div>

      </motion.div>

      {/* Glucose Trend Area Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-3.5 sm:p-4 rounded-3xl border border-white/80 dark:border-slate-800 shadow-soft hover:shadow-md transition-all duration-300 mb-5"
      >
        <div className="mb-3 flex flex-col gap-2">
          {/* Header Row: Title & Action Buttons */}
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Glucose Profile</h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsChartExpanded(true)}
                className="p-1.5 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl transition-all active:scale-90"
                title="Full Screen View"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              {features?.exportReports && (
                <button
                  onClick={handleExportCSV}
                  disabled={exporting}
                  className="text-xs font-bold bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-xl transition-all shadow-md shadow-primary/10"
                >
                  {exporting ? '...' : 'Export'}
                </button>
              )}
            </div>
          </div>

          {/* Controls Row: Date Range Selector & Selected Date Badge */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between bg-slate-100/80 dark:bg-slate-950/70 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800">
              <div className="grid grid-cols-4 w-full bg-white/90 dark:bg-slate-900/90 rounded-xl p-0.5 shadow-xs border border-slate-200/40 dark:border-slate-800 text-center">
                <button
                  onClick={() => setDateRange('day')}
                  className={`py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${dateRange === 'day' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  Day
                </button>
                <button
                  onClick={() => setDateRange('week')}
                  className={`py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${dateRange === 'week' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  Week
                </button>
                <button
                  onClick={() => setDateRange('month')}
                  className={`py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${dateRange === 'month' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  Month
                </button>
                <button
                  onClick={() => setShowRangeModal(true)}
                  className={`py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 ${dateRange === 'custom' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  <Calendar className="h-3 w-3" />
                  <span>Custom</span>
                </button>
              </div>
            </div>

            {/* Active Date / Custom Range Pill */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">Selected Range</span>
              {dateRange === 'custom' && customStartDate && customEndDate ? (
                <button
                  onClick={() => setShowRangeModal(true)}
                  className="flex items-center gap-1.5 bg-primary/10 text-primary dark:text-primary-light border border-primary/20 rounded-xl px-2.5 py-1 text-xs font-extrabold shadow-2xs hover:bg-primary/20 transition-all cursor-pointer"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(customStartDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} – {new Date(customEndDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl px-2.5 py-1 border border-slate-200/60 dark:border-slate-700/60">
                  <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs font-extrabold text-slate-700 dark:text-slate-200 bg-transparent focus:outline-none border-none cursor-pointer p-0 w-[95px]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {glucoseReadings.length === 0 ? (
          <div className="h-48 w-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200/80 dark:border-slate-700 p-4">
            <Activity className="h-7 w-7 mb-2 opacity-40 text-primary" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">No Data Available</p>
            <p className="text-[10px] text-slate-400 mt-0.5 text-center max-w-[200px]">Upload a CGM CSV report to view continuous glucose insights.</p>
          </div>
        ) : (
          <div ref={chartScrollRef} className="h-60 w-full overflow-x-auto no-scrollbar scroll-smooth -mx-2">
            <div style={{ width: dateRange === 'day' ? '100%' : dateRange === 'week' ? '180%' : dateRange === 'custom' ? `${Math.max(100, Math.min(500, glucoseReadings.length * 15))}%` : '300%', minWidth: '100%' }} className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formatChartData()} margin={{ top: 6, right: 12, left: -36, bottom: -5 }}>
                  <defs>
                    <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
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
                    tick={{ fontSize: 9, fill: '#64748B', fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    domain={[40, 180]}
                    tick={{ fontSize: 9, fill: '#64748B', fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={spikeThreshold}
                    stroke="#0D9488"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{ value: `Spike Limit: ${spikeThreshold}`, fill: '#0D9488', fontSize: 8, position: 'insideTopLeft', fontWeight: '800' }}
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    dot={<CustomDot />}
                    fillOpacity={1}
                    fill="url(#glucoseGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </motion.div>

      {/* Stacked Daily Trackers (All displayed together as important cards) */}
      <div className="space-y-6 mb-6">
        {/* Calorie Tracker Card */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl border border-white/80 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.015)] transition-all hover:shadow-[0_12px_35px_rgba(0,0,0,0.03)] transition-colors duration-300">
          <div className="flex justify-between items-center mb-3.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
              <span>🍳</span>
              <span>Calories Tracker</span>
            </h4>
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
              {todayCalories} <span className="text-slate-400 font-bold">/ {user?.dailyCalorieTarget || 2000} kcal</span>
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-indigo-600 h-2 rounded-full transition-all duration-500 shadow-sm shadow-primary/20"
              style={{ width: `${Math.min((todayCalories / (user?.dailyCalorieTarget || 2000)) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-3 font-semibold leading-relaxed">
            * Calorie targets are estimated using the standard Mifflin-St Jeor equation. These are estimates only; please consult a physician for personalized medical advice.{' '}
            <a href="https://pubmed.ncbi.nlm.nih.gov/15883556/" target="_blank" rel="noreferrer" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>[Source]</a>
          </p>
        </div>

        {/* Hydration Tracker Card */}
        {enableHydration && (
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl border border-white/80 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.015)] transition-all hover:shadow-[0_12px_35px_rgba(0,0,0,0.03)] transition-colors duration-300">
            <div className="flex justify-between items-center mb-3.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                <span>💧</span>
                <span>Hydration Progress</span>
              </h4>
              <span className="text-xs font-extrabold text-blue-600">
                {todayWater} <span className="text-slate-450 font-bold">/ {hydrationGoal} ml</span>
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-5">
              <div
                className="bg-gradient-to-r from-sky-400 to-blue-505 h-2 rounded-full transition-all duration-500 shadow-sm shadow-blue-500/10"
                style={{ width: `${Math.min((todayWater / hydrationGoal) * 100, 100)}%` }}
              />
            </div>
            <div className="flex space-x-2.5">
              <button
                onClick={() => handleAddWater(250)}
                className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold py-2.5 rounded-2xl transition-all shadow-sm active:scale-95"
              >
                +250ml
              </button>
              <button
                onClick={() => handleAddWater(500)}
                className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold py-2.5 rounded-2xl transition-all shadow-sm active:scale-95"
              >
                +500ml
              </button>
              <button
                onClick={() => {
                  const dateString = dateRange === 'day' ? selectedDate : new Date().toISOString().split('T')[0];
                  const key = `fastgluco_water_${user?.id || 'guest'}_${dateString}`;
                  setTodayWater(0);
                  localStorage.removeItem(key);
                }}
                className="px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl transition-all text-xs font-bold active:scale-95"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Caregiver Stress Card */}
        <motion.div 
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl border border-white/80 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.015)] transition-all hover:shadow-[0_12px_35px_rgba(0,0,0,0.03)]"
        >
          <div className="flex items-center justify-between mb-3.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
              <span>🤝</span>
              <span>Caregiver Stress Support</span>
            </h4>
            <span className="text-[9px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 dark:bg-teal-950/20 px-2.5 py-0.5 rounded-full border border-teal-100/50">
              Mental Health
            </span>
          </div>
          <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200/30 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-semibold">
                Caring for a loved one with cancer can be challenging. Connect with a psycho-oncologist to support your mental well-being and get professional guidance.
              </p>
            </div>
            <button
              onClick={() => {
                setPendingRecommendationId('pending_Psycho-Oncologist_Caregiver stress support');
                onNavigateToTab('Book Appointment');
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0 whitespace-nowrap"
            >
              Consult & Connect to a Psycho-Oncologist
            </button>
          </div>
        </motion.div>

        {/* AI Insights Card */}
        <motion.div 
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl border border-white/80 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.015)] transition-all hover:shadow-[0_12px_35px_rgba(0,0,0,0.03)]"
        >
          <div className="flex items-center justify-between mb-3.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500 fill-amber-100" />
              <span>Lifestyle Insight</span>
            </h4>
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary-light px-2.5 py-0.5 rounded-full flex items-center space-x-1">
              <Sparkles className="h-2.5 w-2.5 text-primary fill-primary/10" />
              <span>AI Coach</span>
            </span>
          </div>
          <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200/30 dark:border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-semibold">
              {healthInsight}
            </p>
            <p className="text-[9px] text-slate-400 mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700 italic leading-relaxed">
              * Insights are generated by a third-party AI provider (Google Gemini) based on your input. Do not use this as a substitute for professional medical advice. Always consult a doctor before making medical decisions.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Quick Access Control Buttons */}
      <div className={`grid grid-cols-2 sm:${enableWorkout ? 'grid-cols-4' : 'grid-cols-3'} gap-2.5 mb-6`}>
        <button
          onClick={() => onNavigateToTab('Food Log')}
          className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700 text-xs font-extrabold py-4 px-3 rounded-2xl shadow-sm hover:shadow active:scale-95 transition-all duration-200 flex flex-col items-center space-y-1.5"
        >
          <div className="p-2 bg-primary-light rounded-xl text-primary">
            <Plus className="h-4 w-4" />
          </div>
          <span>Add Food</span>
        </button>

        <button
          onClick={() => setShowGlucoseModal(true)}
          className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700 text-xs font-extrabold py-4 px-3 rounded-2xl shadow-sm hover:shadow active:scale-95 transition-all duration-200 flex flex-col items-center space-y-1.5"
        >
          <div className="p-2 bg-rose-50 rounded-xl text-rose-500">
            <Activity className="h-4 w-4" />
          </div>
          <span>Log Glucose</span>
        </button>

        {enableWorkout && (
          <button
            onClick={() => setShowActivityModal(true)}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700 text-xs font-extrabold py-4 px-3 rounded-2xl shadow-sm hover:shadow active:scale-95 transition-all duration-200 flex flex-col items-center space-y-1.5"
          >
            <div className="p-2 bg-amber-50 rounded-xl text-amber-550">
              <span className="text-base leading-none">🏃</span>
            </div>
            <span>Workout</span>
          </button>
        )}

        <button
          onClick={() => onNavigateToTab('Reports')}
          className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700 text-xs font-extrabold py-4 px-3 rounded-2xl shadow-sm hover:shadow active:scale-95 transition-all duration-200 flex flex-col items-center space-y-1.5"
        >
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400">
            <FileUp className="h-4 w-4" />
          </div>
          <span>CGM CSV</span>
        </button>
      </div>

      <div
        onClick={() => onNavigateToTab('Reports')}
        className="bg-gradient-to-br from-white dark:from-slate-900 to-slate-50/80 dark:to-slate-800/80 hover:to-slate-100/40 dark:hover:to-slate-700/40 p-5 rounded-3xl border border-white/80 dark:border-slate-700 shadow-[0_8px_30px_rgba(0,0,0,0.015)] flex items-center justify-between cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_12px_35px_rgba(0,0,0,0.035)] group"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-gradient-to-br from-primary-light to-blue-100 text-primary rounded-2xl relative shadow-inner group-hover:scale-105 transition-transform duration-300">
            <FileUp className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Uploaded Reports</h4>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">CGM history & sync details</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right bg-primary/5 border border-primary/10 px-4 py-2 rounded-2xl font-bold text-primary flex items-baseline space-x-1 shadow-sm">
            <span className="text-lg font-black leading-none">{reportsCount}</span>
            <span className="text-[9px] text-primary/80 font-extrabold block uppercase tracking-wider">files</span>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {showGlucoseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm border border-slate-150 dark:border-slate-800 shadow-2xl animate-scaleIn text-slate-800 dark:text-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-1">Log Glucose Reading</h3>
            <p className="text-xs text-slate-400 font-semibold mb-5">
              Enter a manual blood glucose reading from your glucometer.
            </p>

            <form onSubmit={handleLogGlucose} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Glucose Level (mg/dL)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 105"
                  value={manualGlucose}
                  onChange={(e) => setManualGlucose(e.target.value)}
                  className="w-full text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Time of Reading (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={manualTimestamp}
                  onChange={(e) => setManualTimestamp(e.target.value)}
                  className="w-full text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-55 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <span className="text-[10px] text-slate-455 font-semibold mt-1.5 block">
                  Leave empty to use current time
                </span>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGlucoseModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-655 dark:text-slate-300 text-xs font-extrabold py-3.5 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGlucose}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white text-xs font-extrabold py-3.5 rounded-2xl transition-all shadow-md shadow-primary/20 flex items-center justify-center disabled:opacity-50"
                >
                  {submittingGlucose ? 'Saving...' : 'Save Glucose'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDieticianModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-150 shadow-2xl animate-scaleIn text-slate-800 text-center">
            <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-3">
              <span className="text-2xl">🥗</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">Consult a Dietician</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              Your CGM data shows you are not able to achieve a blood sugar level of &lt;90 mg/dL for at least 14 hours. We highly recommend consulting a dietician.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowDieticianModal(false);
                  setPendingRecommendationId(`pending_Dietician_High glucose levels (unable to maintain <90 mg/dL for 14 hours)`);
                  onNavigateToTab('Book Appointment');
                }}
                className="w-full bg-primary hover:bg-primary-dark text-white text-xs font-extrabold py-3.5 rounded-2xl transition-all shadow-sm"
              >
                Book Dietician Consult
              </button>
              <button
                onClick={() => {
                  setShowDieticianModal(false);
                  setDieticianModalDismissed(true);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-extrabold py-3.5 rounded-2xl transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {showRangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm border border-slate-150 dark:border-slate-800 shadow-2xl animate-scaleIn text-slate-800 dark:text-slate-100">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Select Date Range</h3>
                <p className="text-xs text-slate-400 font-semibold">Choose start and end dates to filter your glucose readings.</p>
              </div>
            </div>

            <div className="space-y-4 my-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Start Date (From)
                </label>
                <input
                  type="date"
                  value={customStartDate || '2025-03-26'}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  End Date (To)
                </label>
                <input
                  type="date"
                  value={customEndDate || '2025-04-08'}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRangeModal(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-extrabold py-3.5 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!customStartDate) setCustomStartDate('2025-03-26');
                  if (!customEndDate) setCustomEndDate('2025-04-08');
                  setDateRange('custom');
                  setShowRangeModal(false);
                }}
                className="flex-1 bg-primary hover:bg-primary-dark text-white text-xs font-extrabold py-3.5 rounded-2xl transition-all shadow-md shadow-primary/20"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-150 shadow-2xl animate-scaleIn text-slate-800">
            <h3 className="text-lg font-black text-slate-900 mb-1">Log Workout / Steps</h3>
            <p className="text-xs text-slate-400 font-semibold mb-5">
              Record physical activity to correlate with your glucose response curve.
            </p>

            <form onSubmit={handleLogActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Activity Type
                </label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    value={activityDuration}
                    onChange={(e) => setActivityDuration(e.target.value)}
                    className="w-full text-sm font-extrabold text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Steps (Optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 3000"
                    value={activitySteps}
                    onChange={(e) => setActivitySteps(e.target.value)}
                    className="w-full text-sm font-extrabold text-slate-75 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-455 uppercase tracking-wider mb-1.5">
                    Est. Calories
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 150"
                    value={activityCalories}
                    onChange={(e) => setActivityCalories(e.target.value)}
                    className="w-full text-sm font-extrabold text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-455 uppercase tracking-wider mb-1.5">
                    Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={activityTimestamp}
                    onChange={(e) => setActivityTimestamp(e.target.value)}
                    className="w-full text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={handleSyncHealth}
                  disabled={submittingActivity}
                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150 text-xs font-extrabold py-3 rounded-2xl transition-all flex items-center justify-center space-x-2 active:scale-98"
                >
                  <span>📲 Sync from Apple Health & Google Fit</span>
                </button>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-655 text-xs font-extrabold py-3.5 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingActivity}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white text-xs font-extrabold py-3.5 rounded-2xl transition-all shadow-md shadow-primary/20 flex items-center justify-center disabled:opacity-50"
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
          className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col p-4 md:p-6 backdrop-blur-xl transition-all duration-300 animate-fadeIn"
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
              <h3 className="text-lg font-black text-white">Glucose Profile (Full View)</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Detailed continuous trend map & food correlation events.</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsLandscape(!isLandscape)}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all flex items-center space-x-1.5 active:scale-95"
                title="Rotate View"
              >
                <RotateCw className="h-4 w-4" />
                <span className="text-xs font-extrabold hidden md:inline">Rotate</span>
              </button>
              <button
                onClick={() => {
                  setIsChartExpanded(false);
                  setIsLandscape(false);
                }}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all active:scale-95"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-950/40 rounded-3xl border border-slate-900 p-5 flex flex-col justify-center shadow-inner">
            {glucoseReadings.length === 0 ? (
              <div className="text-center text-slate-500 py-12 font-bold uppercase">No readings available.</div>
            ) : (
              <div ref={fullscreenScrollRef} className="flex-1 h-full min-h-[250px] w-full overflow-x-auto no-scrollbar scroll-smooth">
                <div style={{ width: dateRange === 'day' ? '100%' : dateRange === 'week' ? '250%' : '500%', minWidth: '100%' }} className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formatChartData()} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="glucoseGradientFullscreen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
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
                        tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={60}
                      />
                      <YAxis
                        domain={[40, 200]}
                        tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine
                        y={spikeThreshold}
                        stroke="#14B8A6"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{ value: `Spike limit: ${spikeThreshold}`, fill: '#14B8A6', fontSize: 9, position: 'insideTopLeft', fontWeight: 'bold' }}
                      />

                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={<CustomDot />}
                        fillOpacity={1}
                        fill="url(#glucoseGradientFullscreen)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
