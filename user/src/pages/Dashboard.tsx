import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SyncService } from '../services/syncService';
import { 
  TrendingUp, 
  Plus, 
  FileUp, 
  CheckCircle, 
  Info, 
  Activity, 
  UtensilsCrossed,
  RefreshCw
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface DashboardProps {
  onNavigateToTab: (tab: string) => void;
  features?: { exportReports?: boolean };
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToTab, features }) => {
  const { token, user, apiUrl } = useAuth();
  
  const [currentGlucose, setCurrentGlucose] = useState<number | null>(null);
  const [glucoseReadings, setGlucoseReadings] = useState<any[]>([]);
  const [todayCalories, setTodayCalories] = useState<number>(0);
  const [reportsCount, setReportsCount] = useState<number>(0);
  const [offlineMealsCount, setOfflineMealsCount] = useState<number>(0);
  const [timeInRange, setTimeInRange] = useState<number>(85);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month'>('day');
  const [exporting, setExporting] = useState(false);

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
      alert('Failed to export data.');
    } finally {
      setExporting(false);
    }
  };

  // Format time labels for chart axis
  const formatChartData = () => {
    return glucoseReadings.map(r => {
      if (!r.timestamp) return r;
      try {
        const date = new Date(r.timestamp);
        if (isNaN(date.getTime())) return r; // already formatted mock
        return {
          ...r,
          timeLabel: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } catch (e) {
        return r;
      }
    });
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
            <span className="text-xs font-bold text-success flex items-center mt-1">
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Stable
            </span>
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
          
          <div className="flex space-x-2">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border-none focus:ring-0"
            >
              <option value="day">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
            {features?.exportReports && (
              <button 
                onClick={handleExportCSV}
                disabled={exporting}
                className="text-xs font-bold bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary-dark transition-colors"
              >
                {exporting ? '...' : 'Export Report'}
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
          <div className="h-64 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formatChartData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey={glucoseReadings[0]?.timestamp ? 'timestamp' : 'timeLabel'} 
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={[40, 180]} 
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                  itemStyle={{ color: '#2563EB', fontWeight: 'semibold', fontSize: '12px' }}
                />
                <ReferenceLine y={90} stroke="#14B8A6" strokeDasharray="3 3" label={{ value: 'Spike threshold', fill: '#14B8A6', fontSize: 9, position: 'insideBottomRight' }} />
                <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorGlucose)" />
              </AreaChart>
            </ResponsiveContainer>
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

      {/* Patient Experience Guidance Card */}
      <div className="bg-secondary-light/30 border border-secondary/15 p-4 rounded-3xl shadow-soft mb-6 flex items-start space-x-3">
        <Info className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-secondary-dark uppercase tracking-wider mb-1">Health Insights</h4>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Walking for 10-15 minutes after major meals helps clear circulating glucose, reducing the severity of peak spikes. Try swapping white rice for millets.
          </p>
        </div>
      </div>

      {/* Quick Access Control Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button 
          onClick={() => onNavigateToTab('Food Log')}
          className="bg-primary text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-primary-light flex items-center justify-center space-x-2 hover:bg-primary-dark transition-all"
        >
          <Plus className="h-5 w-5" />
          <span>Add Food Log</span>
        </button>

        <button 
          onClick={() => onNavigateToTab('Reports')}
          className="bg-secondary text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-secondary-light flex items-center justify-center space-x-2 hover:bg-secondary-dark transition-all"
        >
          <FileUp className="h-5 w-5" />
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
    </div>
  );
};
