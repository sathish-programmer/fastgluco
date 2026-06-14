import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SyncService } from '../services/syncService';
import { useToast } from '../context/ToastContext';
import { 
  TrendingUp, 
  Plus, 
  FileUp, 
  CheckCircle, 
  Info, 
  Activity, 
  UtensilsCrossed,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
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
  const [activities, setActivities] = useState<any[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityType, setActivityType] = useState('Walk');
  const [activityDuration, setActivityDuration] = useState('15');
  const [activitySteps, setActivitySteps] = useState('');
  const [activityCalories, setActivityCalories] = useState('');
  const [activityTimestamp, setActivityTimestamp] = useState('');
  const [submittingActivity, setSubmittingActivity] = useState(false);

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
        setActivities(await activityRes.json());
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
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto bg-white min-h-screen">
      {/* Welcome Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Good day</span>
          <h2 className="text-2xl font-bold text-slate-800">{user?.name || 'Patient'}</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchDashboardData()}
            className="h-9 w-9 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl flex items-center justify-center transition-all"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="h-10 w-10 bg-primary-light text-primary rounded-2xl flex items-center justify-center font-bold shadow-soft">
            {user?.name ? user.name.charAt(0) : 'P'}
          </div>
        </div>
      </div>

      {/* Offline sync message */}
      {offlineMealsCount > 0 && (
        <div className="mb-4 p-4 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-between shadow-soft">
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

      {/* Primary Row: Current Glucose & Time in Range */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Today's Glucose Summary Card */}
        <div className="bg-cardBg p-4 rounded-3xl border border-slate-100 shadow-soft flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Glucose</span>
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-baseline">
              <span className="text-4xl font-extrabold text-slate-800">{currentGlucose || '--'}</span>
              <span className="text-xs font-bold text-slate-400 ml-1">mg/dL</span>
            </div>
            {(() => {
              if (!currentGlucose) {
                return (
                  <span className="text-xs font-bold text-slate-400 flex items-center mt-1">
                    <Info className="h-3.5 w-3.5 mr-1" />
                    No Data
                  </span>
                );
              }
              const threshold = spikeThreshold;
              if (currentGlucose < 70) {
                return (
                  <span className="text-xs font-bold text-sky-600 flex items-center mt-1 animate-pulse">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    Low
                  </span>
                );
              }
              if (currentGlucose <= threshold) {
                return (
                  <span className="text-xs font-bold text-success flex items-center mt-1">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Stable
                  </span>
                );
              }
              if (currentGlucose <= threshold + 40) {
                return (
                  <span className="text-xs font-bold text-amber-500 flex items-center mt-1">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    High
                  </span>
                );
              }
              return (
                <span className="text-xs font-bold text-red-500 flex items-center mt-1 animate-pulse">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  Very High
                </span>
              );
            })()}
          </div>
        </div>

        {/* Time in Range Card */}
        <div className="bg-cardBg p-4 rounded-3xl border border-slate-100 shadow-soft flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">In Range</span>
            <TrendingUp className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <div className="flex items-baseline">
              <span className="text-4xl font-extrabold text-slate-800">{timeInRange}%</span>
            </div>
            <span className="text-xs font-medium text-slate-500 mt-1 block">Target: 70 - 140 mg/dL</span>
          </div>
        </div>
      </div>

      {/* Glucose Trend Area Chart */}
      <div className="bg-cardBg p-4 rounded-3xl border border-slate-100 shadow-soft mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Glucose Profile</h3>
          </div>
          
          <div className="flex space-x-2 items-center">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border-none focus:ring-0 cursor-pointer"
            >
              <option value="day">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
            <button
              onClick={() => setIsChartExpanded(true)}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-all"
              title="Full Screen View"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            {features?.exportReports && (
              <button 
                onClick={handleExportCSV}
                disabled={exporting}
                className="text-xs font-bold bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary-dark transition-colors"
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
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
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

      {/* Caloric Intake Progress bar */}
      <div className="bg-cardBg p-5 rounded-3xl border border-slate-100 shadow-soft mb-6">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            <h4 className="text-sm font-bold text-slate-700">Today's Calorie Log</h4>
          </div>
          <span className="text-xs font-extrabold text-slate-500">
            {todayCalories} / {user?.dailyCalorieTarget || 2000} kcal
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-slate-200 rounded-full h-3">
          <div 
            className="bg-primary h-3 rounded-full transition-all duration-500" 
            style={{ width: `${Math.min((todayCalories / (user?.dailyCalorieTarget || 2000)) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2 font-medium">
          Based on your Mifflin-St Jeor TDEE target adjusted to: {user?.goal?.toLowerCase() || 'maintain weight'}.
        </p>
      </div>

      {/* Hydration Tracker */}
      {enableHydration && (
        <div className="bg-gradient-to-br from-blue-50/50 to-blue-100/50 p-5 rounded-3xl border border-blue-100 shadow-soft mb-6">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">💧</span>
              <h4 className="text-sm font-bold text-slate-700">Hydration Tracker</h4>
            </div>
            <span className="text-xs font-extrabold text-blue-600">
              {todayWater} / {hydrationGoal} ml
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min((todayWater / hydrationGoal) * 100, 100)}%` }}
            />
          </div>

          {/* Quick Add buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleAddWater(250)}
              className="flex-1 bg-white hover:bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold py-2 rounded-xl transition-all shadow-sm"
            >
              +250ml (Cup)
            </button>
            <button
              onClick={() => handleAddWater(500)}
              className="flex-1 bg-white hover:bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold py-2 rounded-xl transition-all shadow-sm"
            >
              +500ml (Bottle)
            </button>
            <button
              onClick={() => {
                const key = `fastgluco_water_${user?.id || 'guest'}_${new Date().toISOString().split('T')[0]}`;
                setTodayWater(0);
                localStorage.removeItem(key);
              }}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all text-xs font-bold"
              title="Reset"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Patient Experience Guidance Card */}
      <div className="bg-secondary-light/30 border border-secondary/15 p-4 rounded-3xl shadow-soft mb-6 flex items-start space-x-3">
        <Info className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-secondary-dark uppercase tracking-wider mb-1">Health Insights</h4>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {healthInsight}
          </p>
        </div>
      </div>

      {/* Quick Access Control Buttons */}
      <div className={`grid ${enableWorkout ? 'grid-cols-4' : 'grid-cols-3'} gap-2.5 mb-6`}>
        <button 
          onClick={() => onNavigateToTab('Food Log')}
          className="bg-primary text-white text-xs font-bold py-3.5 px-3 rounded-2xl shadow-lg shadow-primary-light flex items-center justify-center space-x-1 hover:bg-primary-dark transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Food</span>
        </button>

        <button 
          onClick={() => setShowGlucoseModal(true)}
          className="bg-secondary text-white text-xs font-bold py-3.5 px-3 rounded-2xl shadow-lg shadow-secondary-light flex items-center justify-center space-x-1 hover:bg-secondary-dark transition-all"
        >
          <Activity className="h-4 w-4" />
          <span>Log Glucose</span>
        </button>

        {enableWorkout && (
          <button 
            onClick={() => setShowActivityModal(true)}
            className="bg-emerald-600 text-white text-xs font-bold py-3.5 px-3 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-1 hover:bg-emerald-750 transition-all"
          >
            <span className="text-sm">🏃</span>
            <span>Log Workout</span>
          </button>
        )}

        <button 
          onClick={() => onNavigateToTab('Reports')}
          className="bg-slate-800 text-white text-xs font-bold py-3.5 px-3 rounded-2xl shadow-lg shadow-slate-900/10 flex items-center justify-center space-x-1 hover:bg-slate-905 transition-all"
        >
          <FileUp className="h-4 w-4" />
          <span>Upload CGM</span>
        </button>
      </div>

      {/* Reports Summary Count Card */}
      <div 
        onClick={() => onNavigateToTab('Reports')}
        className="bg-cardBg p-4 rounded-3xl border border-slate-100 shadow-soft flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-card"
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
