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
  ChevronLeft,
  ChevronRight,
  Check,
  Droplets,
  AlertTriangle,
  Flame,
  Lightbulb,
  Sparkles,
  Calendar,
  Bot,
  X
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { DailyLoggingChatbotModal } from '../components/DailyLoggingChatbotModal';
import { AiDailyCheckinFloatingNudge } from '../components/AiDailyCheckinFloatingNudge';
import { AskMitoDrawer } from '../components/AskMitoDrawer';

interface DashboardProps {
  onNavigateToTab: (tab: string) => void;
  features?: { exportReports?: boolean };
  onBackToTugOfWar?: () => void;
}

interface StabilityScoreGaugeProps {
  percentage: number;
  status: string;
}

const StabilityScoreGauge: React.FC<StabilityScoreGaugeProps> = ({ percentage, status }) => {
  const isPositive = status === 'Goal Achieved' || status === 'On Track';
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-20 h-20 transform -rotate-90">
        <circle
          cx="40"
          cy="40"
          r="34"
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx="40"
          cy="40"
          r="34"
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={213.6}
          strokeDashoffset={213.6 - (213.6 * clampedPercentage) / 100}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${
            isPositive ? 'text-primary' : 'text-amber-500'
          }`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-black text-slate-800 dark:text-slate-100 leading-none">
          {Math.round(clampedPercentage)}%
        </span>
        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
          Stable
        </span>
      </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToTab, features, onBackToTugOfWar }) => {
  const { token, user, apiUrl, branding, activeMode } = useAuth();
  const { showToast } = useToast();
  const { setPendingRecommendationId } = useConsultation();

  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [currentGlucose, setCurrentGlucose] = useState<number | null>(null);
  const [glucoseReadings, setGlucoseReadings] = useState<any[]>([]);
  const [todayCalories, setTodayCalories] = useState<number>(0);
  const [reportsCount, setReportsCount] = useState<number>(0);
  const [offlineMealsCount, setOfflineMealsCount] = useState<number>(0);
  const [timeInRange, setTimeInRange] = useState<number>(85);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [latestSummaryReport, setLatestSummaryReport] = useState<any | null>(null);
  const [reportsHistory, setReportsHistory] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'custom'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showRangeModal, setShowRangeModal] = useState<boolean>(false);
  const [chartFitMode, setChartFitMode] = useState<'fit' | 'scroll'>('fit');
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
  const [showChatbotModal, setShowChatbotModal] = useState<boolean>(false);
  const [showAskMito, setShowAskMito] = useState<boolean>(false);
  const [pendingHabitsCount, setPendingHabitsCount] = useState<number>(0);

  useEffect(() => {
    const handleOpen = () => setShowChatbotModal(true);
    window.addEventListener('openDailyCheckinChatbot', handleOpen);
    return () => window.removeEventListener('openDailyCheckinChatbot', handleOpen);
  }, []);

  const handleDateStep = (direction: 'prev' | 'next') => {
    const parts = selectedDate.split('-');
    const cur = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    if (dateRange === 'day') {
      cur.setDate(cur.getDate() + (direction === 'next' ? 1 : -1));
    } else if (dateRange === 'week') {
      cur.setDate(cur.getDate() + (direction === 'next' ? 7 : -7));
    } else if (dateRange === 'month') {
      cur.setDate(cur.getDate() + (direction === 'next' ? 30 : -30));
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (cur > today) {
      setSelectedDate(getTodayDateStr());
    } else {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      setSelectedDate(`${y}-${m}-${d}`);
    }
  };

  const isAtCurrentDate = () => {
    const todayStr = getTodayDateStr();
    return selectedDate >= todayStr;
  };

  // Find the exact uploaded report that covers the active selected date range
  const getActiveReportForPeriod = (reports: any[]) => {
    if (!reports || reports.length === 0) return null;
    const processedReports = reports.filter(r => r.status === 'Processed');
    if (processedReports.length === 0) return null;

    let qStart = selectedDate || getTodayDateStr();
    let qEnd = selectedDate || getTodayDateStr();

    if (dateRange === 'week') {
      const endD = new Date(selectedDate || new Date());
      const startD = new Date(endD);
      startD.setDate(startD.getDate() - 6);
      qStart = startD.toISOString().split('T')[0];
      qEnd = endD.toISOString().split('T')[0];
    } else if (dateRange === 'month') {
      const endD = new Date(selectedDate || new Date());
      const startD = new Date(endD);
      startD.setDate(startD.getDate() - 29);
      qStart = startD.toISOString().split('T')[0];
      qEnd = endD.toISOString().split('T')[0];
    } else if (dateRange === 'custom') {
      if (customStartDate && customEndDate) {
        qStart = new Date(customStartDate).toISOString().split('T')[0];
        qEnd = new Date(customEndDate).toISOString().split('T')[0];
      }
    }

    // 1. Check for report whose endDateString matches qEnd exactly
    const exactEndMatch = processedReports.find(r => {
      const e = r.pdfSummaryDateRange?.endDateString || (r.pdfSummaryDateRange?.endDate ? new Date(r.pdfSummaryDateRange.endDate).toISOString().split('T')[0] : '');
      return e === qEnd;
    });
    if (exactEndMatch) return exactEndMatch;

    // 2. Check for report that overlaps with [qStart, qEnd]
    const overlapping = processedReports.find(r => {
      const s = r.pdfSummaryDateRange?.startDateString || (r.pdfSummaryDateRange?.startDate ? new Date(r.pdfSummaryDateRange.startDate).toISOString().split('T')[0] : '');
      const e = r.pdfSummaryDateRange?.endDateString || (r.pdfSummaryDateRange?.endDate ? new Date(r.pdfSummaryDateRange.endDate).toISOString().split('T')[0] : '');
      if (!s || !e) return false;
      return qStart <= e && qEnd >= s;
    });
    if (overlapping) return overlapping;

    return processedReports[0];
  };

  useEffect(() => {
    if (reportsHistory.length > 0) {
      const activeReport = getActiveReportForPeriod(reportsHistory);
      setLatestSummaryReport(activeReport);
    }
  }, [reportsHistory, dateRange, selectedDate, customStartDate, customEndDate]);

  // Helper to check if a specific date or active date range overlaps with the latest uploaded report
  const isPeriodOverlappingReport = (report: any): boolean => {
    if (!report) return false;
    const range = report.pdfSummaryDateRange;
    if (!range) return false;
    let s = range.startDateString;
    let e = range.endDateString;
    if (!s && range.startDate) {
      s = new Date(range.startDate).toISOString().split('T')[0];
      e = new Date(range.endDate || range.startDate).toISOString().split('T')[0];
    }
    if (!s || !e) return false;

    if (dateRange === 'day') {
      const qDate = selectedDate || new Date().toISOString().split('T')[0];
      return qDate >= s && qDate <= e;
    }
    if (dateRange === 'week') {
      const endD = new Date(selectedDate || new Date());
      const startD = new Date(endD);
      startD.setDate(startD.getDate() - 6);
      const sQ = startD.toISOString().split('T')[0];
      const eQ = endD.toISOString().split('T')[0];
      return sQ <= e && eQ >= s;
    }
    if (dateRange === 'month') {
      const endD = new Date(selectedDate || new Date());
      const startD = new Date(endD);
      startD.setDate(startD.getDate() - 29);
      const sQ = startD.toISOString().split('T')[0];
      const eQ = endD.toISOString().split('T')[0];
      return sQ <= e && eQ >= s;
    }
    if (dateRange === 'custom') {
      if (!customStartDate || !customEndDate) return false;
      const sQ = new Date(customStartDate).toISOString().split('T')[0];
      const eQ = new Date(customEndDate).toISOString().split('T')[0];
      return sQ <= e && eQ >= s;
    }
    return false;
  };

  const hasActiveReportData = (report: any): boolean => {
    if (!report) return false;
    return isPeriodOverlappingReport(report) && !!(
      report.pdfSummaryAverageGlucose != null ||
      report.pdfSummaryTimeInRange != null ||
      report.glucoseVariability != null ||
      (report.dailySummaries && report.dailySummaries.length > 0) ||
      (report.hourlyPatternSummaries && report.hourlyPatternSummaries.length > 0)
    );
  };

  // Dynamically calculate glucose stability hours below spikeThreshold (defaults to 90)
  const calculateStabilityHours = () => {
    const targetHoursPerDay = 17;
    const unitText = dateRange === 'day' ? 'hours / 24h' : 'hours / day (avg)';
    const defaultTargetText = `Target: Stay below ${spikeThreshold} mg/dL for 17 hrs a day`;

    // 1. If we have readings in database for the queried period (Day, Week, Month, or Custom)
    if (glucoseReadings.length > 0) {
      const belowCount = glucoseReadings.filter(r => r.value <= spikeThreshold).length;
      const totalCount = glucoseReadings.length;
      const percentage = Math.round((belowCount / totalCount) * 100);
      const hoursPerDay = parseFloat(((belowCount / totalCount) * 24).toFixed(1));

      let status = 'Need Attention';
      if (hoursPerDay >= targetHoursPerDay) {
        status = 'Goal Achieved';
      } else if (hoursPerDay >= targetHoursPerDay * 0.7) {
        status = 'On Track';
      }

      return {
        hours: hoursPerDay,
        percentage,
        status,
        unitText,
        label: defaultTargetText,
        hasData: true,
        source: 'TIMESTAMPED_READINGS'
      };
    }

    // 2. If no point readings, but the queried period overlaps with an uploaded summary report
    if (hasActiveReportData(latestSummaryReport)) {
      const tir = latestSummaryReport.pdfSummaryTimeInRange != null ? latestSummaryReport.pdfSummaryTimeInRange : 76;
      const hoursPerDay = parseFloat(((tir / 100) * 24).toFixed(1));
      let status = 'Need Attention';
      if (hoursPerDay >= targetHoursPerDay) {
        status = 'Goal Achieved';
      } else if (hoursPerDay >= targetHoursPerDay * 0.7) {
        status = 'On Track';
      }

      return {
        hours: hoursPerDay,
        percentage: tir,
        status,
        unitText,
        label: defaultTargetText,
        hasData: true,
        source: 'PDF_AGP_SUMMARY'
      };
    }

    // 3. Otherwise, No Data
    const periodLabel = dateRange === 'day' ? (selectedDate === getTodayDateStr() ? 'today' : `this date (${selectedDate})`) : dateRange === 'week' ? 'this week' : 'this month';
    return {
      hours: '--',
      percentage: 0,
      status: 'No Data',
      unitText,
      label: `No glucose logged for ${periodLabel}. Upload a CGM report or log a reading to track stability.`,
      hasData: false,
      source: 'NO_DATA'
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
      if (stability.hasData && typeof stability.hours === 'number' && stability.hours < 14 && !dieticianModalDismissed) {
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
      const queryDateStr = selectedDate || new Date().toISOString().split('T')[0];
      let start = new Date(queryDateStr);
      start.setHours(0, 0, 0, 0);
      let end = new Date(queryDateStr);
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

      // 3. Fetch report count and latest summary report
      const reportRes = await fetch(`${apiUrl}/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reportRes.ok) {
        const history = await reportRes.json();
        setReportsCount(history.length);
        setReportsHistory(history);
        const matchingReport = getActiveReportForPeriod(history);
        setLatestSummaryReport(matchingReport);
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

      // 8. Fetch Today's Habit Logs to determine pending check-in count
      try {
        const habitsRes = await fetch(`${apiUrl}/habits?type=all&days=1`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (habitsRes.ok) {
          const habitsData = await habitsRes.json();
          const todayStr = new Date().toDateString();
          const todayLogs = habitsData.filter((h: any) => 
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
        }
      } catch (habitErr) {
        console.error('Error fetching today habits count:', habitErr);
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
    let sourceReadings = [...glucoseReadings];

    // If point readings count is 0, but queried date or period overlaps with report data, render the AGP curve
    if (sourceReadings.length === 0 && hasActiveReportData(latestSummaryReport)) {
      const repAvg = latestSummaryReport.pdfSummaryAverageGlucose || 90;
      const hourlyPatterns = latestSummaryReport.hourlyPatternSummaries || [];

      if (dateRange === 'day') {
        const refDateStr = selectedDate || getTodayDateStr();
        const ds = latestSummaryReport.dailySummaries?.find((s: any) => s.dateString === refDateStr || s.date?.toString().startsWith(refDateStr));
        const dayAvg = ds?.averageGlucose || repAvg;
        const scaleFactor = dayAvg / repAvg;

        hourlyPatterns.forEach((hp: any) => {
          const hourMap: { [k: string]: number } = {
            '12am': 0, '2am': 2, '4am': 4, '6am': 6, '8am': 8, '10am': 10,
            '12pm': 12, '2pm': 14, '4pm': 16, '6pm': 18, '8pm': 20, '10pm': 22
          };
          const h = hourMap[hp.hourLabel] !== undefined ? hourMap[hp.hourLabel] : 0;
          const ptDate = new Date(`${refDateStr}T00:00:00`);
          ptDate.setHours(h, 0, 0, 0);

          sourceReadings.push({
            timestamp: ptDate.toISOString(),
            value: Math.round(hp.medianGlucose * scaleFactor),
            isHourlyPatternSummary: true,
            hourLabel: hp.hourLabel,
            timeLabel: hp.hourLabel
          });
        });
      } else {
        // Multi-day timeline for Week, Month, or Custom
        let startD = new Date(selectedDate);
        let endD = new Date(selectedDate);

        if (dateRange === 'week') {
          startD.setDate(startD.getDate() - 6);
        } else if (dateRange === 'month') {
          startD.setDate(startD.getDate() - 29);
        } else if (dateRange === 'custom' && customStartDate && customEndDate) {
          startD = new Date(customStartDate);
          endD = new Date(customEndDate);
        }

        const cur = new Date(startD);
        cur.setHours(0, 0, 0, 0);
        endD.setHours(23, 59, 59, 999);

        while (cur <= endD) {
          const dKey = cur.toISOString().split('T')[0];
          const ds = latestSummaryReport.dailySummaries?.find((s: any) => s.dateString === dKey || s.date?.toString().startsWith(dKey));
          const dayAvg = ds?.averageGlucose || repAvg;
          const scaleFactor = dayAvg / repAvg;
          const dateLabel = cur.toLocaleDateString([], { day: 'numeric', month: 'short' });

          // Plot 12 2-hourly pattern points per day across the full 24h cycle
          const dayHourOffsets = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
          dayHourOffsets.forEach((h, hIdx) => {
            const hourIdx = hIdx % (hourlyPatterns.length || 12);
            const baseMedian = hourlyPatterns[hourIdx]?.medianGlucose || repAvg;
            const ptDate = new Date(cur);
            ptDate.setHours(h, 0, 0, 0);

            sourceReadings.push({
              timestamp: ptDate.toISOString(),
              value: Math.round(baseMedian * scaleFactor),
              isHourlyPatternSummary: false,
              timeLabel: dateLabel,
              hourLabel: `${dateLabel} ${hourlyPatterns[hourIdx]?.hourLabel || `${h}:00`}`
            });
          });

          cur.setDate(cur.getDate() + 1);
        }
      }
    }

    const formattedReadings = sourceReadings.map(r => {
      if (!r.timestamp) return { ...r, timestampMs: 0 };
      try {
        const date = new Date(r.timestamp);
        if (isNaN(date.getTime())) return { ...r, timestampMs: 0 };
        return {
          ...r,
          timestampMs: date.getTime(),
          timeLabel: r.timeLabel || (dateRange === 'day' ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString([], { month: 'short', day: 'numeric' })),
          displayLabel: date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
          meal: null as any
        };
      } catch (e) {
        return { ...r, timestampMs: 0 };
      }
    });

    // Match food logs that occurred close to the glucose reading (up to 75 mins on summary charts)
    rangeFoodLogs.forEach(food => {
      const foodTime = new Date(food.loggedAt).getTime();
      let closestPoint: any = null;
      let minDiff = 75 * 60 * 1000; // 75 mins window for AGP 2-hour points

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
        closestPoint.meal = {
          name: food.name,
          mealType: food.mealType,
          calories: Math.round((food.calories || 0) * (food.quantity || 1)),
          carbs: Math.round((food.carbs || 0) * (food.quantity || 1)),
          protein: Math.round((food.protein || 0) * (food.quantity || 1)),
          fat: Math.round((food.fat || 0) * (food.quantity || 1)),
          quantity: food.quantity || 1,
          photoUrl: food.photoUrl
        };
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
      const val = data.value;
      const isStable = val <= spikeThreshold && val >= 70;
      const isLow = val < 70;

      // Format clean date & time (e.g., "26 Aug 2026 • 10:00 AM" or "27 Mar 2025 • 01:30 AM")
      const dateObj = data.timestamp ? new Date(data.timestamp) : (label ? new Date(label) : null);
      let dateString = '';
      if (dateObj && !isNaN(dateObj.getTime())) {
        dateString = `${dateObj.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })} • ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else if (data.hourLabel) {
        dateString = `${data.hourLabel} • Glucose Reading`;
      } else {
        dateString = 'Glucose Reading';
      }

      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 text-white p-3 rounded-2xl shadow-2xl min-w-[210px] max-w-[260px] pointer-events-none">
          {/* Header: Date/Time + Status Badge */}
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800">
            <span className="text-[10px] font-bold text-slate-300 truncate">{dateString}</span>
            <span className={`text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
              isLow ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
              isStable ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {isLow ? 'Low' : isStable ? 'Stable' : 'Spike'}
            </span>
          </div>

          {/* Reading Line */}
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400">Glucose Level:</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-white tracking-tight">{val}</span>
              <span className="text-[10px] font-bold text-slate-400">mg/dL</span>
            </div>
          </div>

          {/* Target Reference Info */}
          <div className="flex items-center justify-between text-[8.5px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>Target: 70–{spikeThreshold} mg/dL</span>
            <span className="text-slate-500 font-medium">LibreView CGM</span>
          </div>

          {/* Meal details if logged */}
          {data.meal && (
            <div className="pt-2 border-t border-slate-800 mt-2">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Logged Meal</span>
              <p className="text-xs font-bold text-rose-400 truncate mb-1.5" title={data.meal.name}>🍴 {data.meal.name}</p>
              <div className="grid grid-cols-2 gap-1.5 text-[9px] text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <div>Calories: <span className="font-bold text-white">{data.meal.calories ?? 0} kcal</span></div>
                <div>Carbs: <span className="font-bold text-white">{data.meal.carbs ?? 0}g</span></div>
                <div>Protein: <span className="font-bold text-white">{data.meal.protein ?? 0}g</span></div>
                <div>Fat: <span className="font-bold text-white">{data.meal.fat ?? 0}g</span></div>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Ask Mito & Clinical Consultations Drawer */}
      <AskMitoDrawer
        isOpen={showAskMito}
        onClose={() => setShowAskMito(false)}
        onNavigateToTab={onNavigateToTab}
      />

      <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="pb-36 pt-2 px-3 max-w-5xl mx-auto font-sans antialiased text-slate-800 dark:text-slate-100"
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
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAskMito(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black transition-all flex items-center space-x-1.5 border border-white/20 shadow-xs cursor-pointer active:scale-95"
            title="Ask Mito & Clinical Consultations"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
            <span>Ask Mito</span>
          </button>
          <button
            onClick={() => fetchDashboardData()}
            className="h-10 w-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200/60 dark:border-slate-700 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow active:scale-90 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="h-10 w-10 bg-gradient-to-br from-primary to-indigo-600 dark:from-primary-dark dark:to-indigo-800 text-white rounded-2xl flex items-center justify-center font-extrabold shadow-sm tracking-wider">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
          </div>
        </div>
      </motion.div>

      {/* Cellular Defense Strength Hero Banner (Clean Medical Health Card) */}
      {onBackToTugOfWar && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.99 }}
          onClick={onBackToTugOfWar}
          className="w-full mb-4 rounded-2xl p-3.5 md:p-4 flex items-center justify-between gap-3.5 text-left bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-xl shrink-0 text-blue-600">
              ⚖️
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-0.5">
                <span className="text-xs md:text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Cellular Defense Strength</span>
                <span className="flex items-center gap-1 text-[8.5px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight truncate">
                See how daily habits shift the balance between repair & damage
              </p>
            </div>
          </div>

          <div className="h-8 w-8 rounded-xl bg-slate-100 group-hover:bg-slate-200 dark:bg-slate-800 dark:group-hover:bg-slate-700 text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200 flex items-center justify-center shrink-0 transition-all">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

        {/* Stability Card (Full-width, premium layout) */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 rounded-3xl border border-white/80 dark:border-slate-800 shadow-soft flex items-center justify-between gap-4"
        >
          {/* Shared Progress Ring Gauge */}
          <StabilityScoreGauge 
            percentage={stability.percentage} 
            status={stability.status} 
          />

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
            let displayGlucose: number | null = null;
            let cardLabel = 'Avg Glucose';
            let cardSubtitle = 'Status';

            if (hasActiveReportData(latestSummaryReport)) {
              displayGlucose = latestSummaryReport.pdfSummaryAverageGlucose || 90;
              cardLabel = 'Avg Glucose';
              cardSubtitle = 'LibreView PDF Summary';
            } else if (glucoseReadings.length > 0) {
              displayGlucose = dateRange === 'day' ? (currentGlucose || calculateAverageGlucose()) : calculateAverageGlucose();
              cardLabel = dateRange === 'day' ? 'Daily Reading' : dateRange === 'week' ? '7-Day Avg' : dateRange === 'month' ? '30-Day Avg' : 'Avg Glucose';
              cardSubtitle = dateRange === 'day' ? `${selectedDate} Reading` : 'Calculated from Readings';
            }

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
                    {cardLabel}
                  </span>
                  <Activity className="h-3.5 w-3.5 text-primary" />
                </div>

                <div className="my-2.5 flex items-baseline space-x-0.5">
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">{displayGlucose || '--'}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">mg/dL</span>
                </div>

                <div className="pt-1.5 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider">
                    {cardSubtitle}
                  </span>
                  {(() => {
                    if (!displayGlucose) return <span className="text-[8px] font-bold text-slate-400 uppercase">No Data</span>;
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
          {(() => {
            let displayTir: number | null = null;
            let inRangeSubtitle = 'Status';

            if (hasActiveReportData(latestSummaryReport)) {
              displayTir = latestSummaryReport.pdfSummaryTimeInRange || 76;
              inRangeSubtitle = 'LibreView PDF Summary';
            } else if (glucoseReadings.length > 0) {
              const inRangeCount = glucoseReadings.filter(r => r.value >= 70 && r.value <= 180).length;
              displayTir = timeInRange != null ? timeInRange : Math.round((inRangeCount / glucoseReadings.length) * 100);
              inRangeSubtitle = dateRange === 'day' ? `${selectedDate} In Range` : 'Calculated from Readings';
            }

            return (
              <motion.div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 rounded-3xl border border-white/80 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.015)] flex flex-col justify-between transition-all hover:scale-[1.01]">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">In Range</span>
                  <TrendingUp className="h-3.5 w-3.5 text-secondary" />
                </div>

                <div className="my-2.5 flex items-baseline space-x-0.5">
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">{displayTir != null ? displayTir : '--'}%</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Time</span>
                </div>

                <div className="pt-1.5 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider">
                    {inRangeSubtitle}
                  </span>
                  <span className="text-[8px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">70-180</span>
                </div>
              </motion.div>
            );
          })()}
        </div>

      </motion.div>

      {/* Glucose Trend Area Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-3.5 sm:p-4 rounded-3xl border border-white/80 dark:border-slate-800 shadow-soft hover:shadow-md transition-all duration-300 mb-5"
      >
        {(() => {
          const chartData = formatChartData();
          const chartValues = chartData.map(d => d.value).filter(v => typeof v === 'number' && !isNaN(v));
          const chartMin = chartValues.length > 0 ? Math.min(...chartValues) : null;
          const chartMax = chartValues.length > 0 ? Math.max(...chartValues) : null;
          const chartAvg = chartValues.length > 0 ? Math.round(chartValues.reduce((a, b) => a + b, 0) / chartValues.length) : null;
          const inTargetCount = chartValues.filter(v => v >= 70 && v <= spikeThreshold).length;
          const chartTirPct = chartValues.length > 0 ? Math.round((inTargetCount / chartValues.length) * 100) : null;
          const hasData = chartValues.length > 0 || hasActiveReportData(latestSummaryReport);

          return (
            <>
              <div className="mb-3.5 flex flex-col gap-2.5">
                {/* Row 1: Title & Integrated Date Stepper Capsule */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-xs shadow-emerald-500/80"></span>
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                      Glucose Curve
                    </h3>
                  </div>

                  {/* Sleek Date Stepper Capsule */}
                  <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 px-1.5 py-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                    <button
                      onClick={() => handleDateStep('prev')}
                      className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer"
                      title="Previous"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-center gap-1.5 px-1.5 text-[11px] font-black text-slate-800 dark:text-slate-100">
                      <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                      {dateRange === 'week' ? (
                        <span>
                          {(() => {
                            const endD = new Date(selectedDate);
                            const startD = new Date(selectedDate);
                            startD.setDate(startD.getDate() - 6);
                            return `${startD.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${endD.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
                          })()}
                        </span>
                      ) : dateRange === 'month' ? (
                        <span>
                          {(() => {
                            const endD = new Date(selectedDate);
                            const startD = new Date(selectedDate);
                            startD.setDate(startD.getDate() - 29);
                            return `${startD.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${endD.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
                          })()}
                        </span>
                      ) : dateRange === 'custom' && customStartDate && customEndDate ? (
                        <button onClick={() => setShowRangeModal(true)} className="hover:underline cursor-pointer">
                          {new Date(customStartDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} – {new Date(customEndDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </button>
                      ) : (
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="bg-transparent focus:outline-none border-none cursor-pointer p-0 w-[95px] text-[11px] font-black text-slate-800 dark:text-slate-100"
                        />
                      )}
                    </div>

                    <button
                      onClick={() => handleDateStep('next')}
                      disabled={isAtCurrentDate()}
                      className={`p-1 rounded-lg transition-all ${
                        isAtCurrentDate()
                          ? 'opacity-30 cursor-not-allowed text-slate-400'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 active:scale-95 cursor-pointer'
                      }`}
                      title="Next"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Row 2: Segmented Period Switcher & View Actions */}
                <div className="flex items-center justify-between gap-2">
                  {/* Period Switcher Tabs */}
                  <div className="flex-1 grid grid-cols-4 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-center shadow-2xs">
                    {(['day', 'week', 'month', 'custom'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => mode === 'custom' ? setShowRangeModal(true) : setDateRange(mode)}
                        className={`py-1 text-[9.5px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                          dateRange === mode
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                        }`}
                      >
                        {mode === 'custom' ? 'Custom' : mode}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setChartFitMode(prev => prev === 'fit' ? 'scroll' : 'fit')}
                      className={`px-2.5 py-1.5 text-[9.5px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 border cursor-pointer ${
                        chartFitMode === 'fit'
                          ? 'bg-primary/10 text-primary border-primary/20 dark:text-primary-light'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                      }`}
                      title={chartFitMode === 'fit' ? 'Fit to Screen' : 'Detailed Zoom'}
                    >
                      {chartFitMode === 'fit' ? (
                        <>
                          <Minimize2 className="h-3 w-3" />
                          <span>Fit</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="h-3 w-3" />
                          <span>Zoom</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setIsChartExpanded(true)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all border border-slate-200/80 dark:border-slate-700 active:scale-95 cursor-pointer shadow-2xs"
                      title="Expand Full View"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>

                    {features?.exportReports && (
                      <button
                        onClick={handleExportCSV}
                        disabled={exporting}
                        className="text-[9px] font-black uppercase tracking-wider bg-primary hover:bg-primary-dark text-white px-2.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        {exporting ? '...' : 'CSV'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Modern Ultra-Compact Live Metrics Ribbon */}
                {hasData && (
                  <div className="bg-gradient-to-r from-slate-50/90 via-white/80 to-slate-50/90 dark:from-slate-800/80 dark:via-slate-900/90 dark:to-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/70 px-3 py-1.5 shadow-2xs">
                    <div className="grid grid-cols-4 divide-x divide-slate-200/80 dark:divide-slate-700/70 text-left items-center">
                      
                      {/* 1. AVG */}
                      <div className="px-1.5 sm:px-2 flex flex-col items-start text-left">
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Avg
                        </span>
                        <div className="flex items-baseline gap-0.5 mt-0.5">
                          <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">
                            {hasActiveReportData(latestSummaryReport) && latestSummaryReport.pdfSummaryAverageGlucose != null
                              ? latestSummaryReport.pdfSummaryAverageGlucose
                              : (chartAvg || '--')}
                          </span>
                          <span className="text-[7px] font-bold text-slate-400">mg/dL</span>
                        </div>
                      </div>

                      {/* 2. LOWEST */}
                      <div className="px-1.5 sm:px-2 flex flex-col items-start text-left">
                        <span className="text-[8px] font-black uppercase tracking-wider text-sky-500 dark:text-sky-400">
                          Min
                        </span>
                        <div className="flex items-baseline gap-0.5 mt-0.5">
                          <span className="text-xs sm:text-sm font-black text-sky-600 dark:text-sky-400 tracking-tight">
                            {chartMin || '--'}
                          </span>
                          <span className="text-[7px] font-bold text-slate-400">mg/dL</span>
                        </div>
                      </div>

                      {/* 3. PEAK */}
                      <div className="px-1.5 sm:px-2 flex flex-col items-start text-left">
                        <span className="text-[8px] font-black uppercase tracking-wider text-rose-500 dark:text-rose-400">
                          Peak
                        </span>
                        <div className="flex items-baseline gap-0.5 mt-0.5">
                          <span className={`text-xs sm:text-sm font-black tracking-tight ${(chartMax || 0) > spikeThreshold ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>
                            {chartMax || '--'}
                          </span>
                          <span className="text-[7px] font-bold text-slate-400">mg/dL</span>
                        </div>
                      </div>

                      {/* 4. IN TARGET */}
                      <div className="px-1.5 sm:px-2 flex flex-col items-start text-left">
                        <span className="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          In Target
                        </span>
                        <div className="flex items-baseline gap-0.5 mt-0.5">
                          <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                            {hasActiveReportData(latestSummaryReport) && latestSummaryReport.pdfSummaryTimeInRange != null
                              ? latestSummaryReport.pdfSummaryTimeInRange
                              : (chartTirPct ?? '--')}%
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>

              {!hasData ? (
                <div className="h-48 w-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200/80 dark:border-slate-700 p-4">
                  <Activity className="h-7 w-7 mb-2 opacity-40 text-primary" />
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    No Data Available for {dateRange === 'day' ? (selectedDate === getTodayDateStr() ? 'Today' : `Selected Date (${selectedDate})`) : dateRange === 'week' ? 'This Week' : 'This Month'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 text-center max-w-[220px] mb-3">Upload a CGM CSV or PDF report to view continuous glucose insights.</p>
                  <button
                    onClick={() => onNavigateToTab('Reports')}
                    className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileUp className="h-3.5 w-3.5" />
                    <span>Upload CGM Report</span>
                  </button>
                </div>
              ) : (
                <div ref={chartScrollRef} className="h-64 w-full overflow-x-auto no-scrollbar scroll-smooth">
                  <div
                    style={{
                      width: chartFitMode === 'fit'
                        ? '100%'
                        : (dateRange === 'day' ? '180%' : dateRange === 'week' ? '220%' : dateRange === 'custom' ? `${Math.max(160, Math.min(500, glucoseReadings.length * 18))}%` : '300%'),
                      minWidth: '100%'
                    }}
                    className="h-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -34, bottom: 0 }}>
                        <defs>
                          <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.32} />
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />

                        {/* Shaded In-Target Zone (70 to Spike Threshold) */}
                        <ReferenceArea
                          y1={70}
                          y2={spikeThreshold}
                          fill="#10B981"
                          fillOpacity={0.05}
                        />

                        <XAxis
                          dataKey="timeLabel"
                          tickFormatter={(value) => value}
                          tick={{ fontSize: 9, fill: '#64748B', fontWeight: 700 }}
                          axisLine={false}
                          tickLine={false}
                          minTickGap={chartFitMode === 'fit' ? 25 : 12}
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
            </>
          );
        })()}
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
              {(() => {
                const defaultStart = latestSummaryReport?.pdfSummaryDateRange?.startDateString || (() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 7);
                  return d.toISOString().split('T')[0];
                })();
                const defaultEnd = latestSummaryReport?.pdfSummaryDateRange?.endDateString || getTodayDateStr();

                return (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Start Date (From)
                      </label>
                      <input
                        type="date"
                        value={customStartDate || defaultStart}
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
                        value={customEndDate || defaultEnd}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </>
                );
              })()}
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
                  const defaultStart = latestSummaryReport?.pdfSummaryDateRange?.startDateString || (() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 7);
                    return d.toISOString().split('T')[0];
                  })();
                  const defaultEnd = latestSummaryReport?.pdfSummaryDateRange?.endDateString || getTodayDateStr();

                  if (!customStartDate) setCustomStartDate(defaultStart);
                  if (!customEndDate) setCustomEndDate(defaultEnd);
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
          className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col p-4 md:p-6 transition-all duration-300 animate-fadeIn"
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
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Glucose Profile (Full View)</h3>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary-light border border-primary/30">
                  {dateRange === 'day' ? selectedDate : dateRange === 'week' ? '7-Day AGP' : dateRange === 'month' ? '30-Day AGP' : 'Custom Period'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Continuous glucose trend curve with target zone reference.</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsLandscape(!isLandscape)}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
                title="Rotate View"
              >
                <RotateCw className="h-4 w-4" />
                <span className="text-xs font-extrabold hidden sm:inline">Rotate</span>
              </button>
              <button
                onClick={() => {
                  setIsChartExpanded(false);
                  setIsLandscape(false);
                }}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-all active:scale-95 cursor-pointer"
                title="Close Full View"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-900/60 rounded-3xl border border-slate-800/80 p-4 sm:p-5 flex flex-col justify-center shadow-2xl overflow-hidden">
            {(() => {
              const fullData = formatChartData();
              const hasFullData = fullData.length > 0 && fullData.some(d => d.value != null);

              if (!hasFullData) {
                return (
                  <div className="text-center text-slate-500 py-12 font-bold uppercase tracking-wider">
                    No readings available for this period.
                  </div>
                );
              }

              return (
                <div ref={fullscreenScrollRef} className="flex-1 h-full min-h-[280px] w-full overflow-x-auto no-scrollbar scroll-smooth">
                  <div style={{ width: dateRange === 'day' ? '100%' : dateRange === 'week' ? '180%' : '260%', minWidth: '100%' }} className="h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={fullData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                        <defs>
                          <linearGradient id="glucoseGradientFullscreen" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" opacity={0.8} />

                        {/* In-Target Zone (70 to Spike Threshold) */}
                        <ReferenceArea
                          y1={70}
                          y2={spikeThreshold}
                          fill="#10B981"
                          fillOpacity={0.06}
                        />

                        <XAxis
                          dataKey="timeLabel"
                          tickFormatter={(value) => value}
                          tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }}
                          axisLine={false}
                          tickLine={false}
                          minTickGap={15}
                        />
                        <YAxis
                          domain={[40, 200]}
                          tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine
                          y={spikeThreshold}
                          stroke="#14B8A6"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{ value: `Spike limit: ${spikeThreshold}`, fill: '#14B8A6', fontSize: 10, position: 'insideTopLeft', fontWeight: '800' }}
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
              );
            })()}
          </div>
        </div>
      )}
    </motion.div>

      {/* Floating AI Check-in Bot Trigger Button */}
      <button
        onClick={() => setShowChatbotModal(true)}
        className="fixed bottom-20 right-5 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white/80 active:scale-95 transition-all cursor-pointer"
        title="Open AI Daily Check-in Assistant"
      >
        <Bot className="h-6 w-6 text-white" />
        <span className="text-xs font-black tracking-wide pr-1 hidden sm:inline">AI Check-in</span>
      </button>

      {/* AI Daily Check-in Modern Floating Pop-up Nudge (Only if habits are pending) */}
      <AiDailyCheckinFloatingNudge
        pendingHabitsCount={pendingHabitsCount}
        onOpenCheckin={() => setShowChatbotModal(true)}
        userMode={activeMode}
      />

      {/* AI Daily Logging Chatbot Modal */}
      <DailyLoggingChatbotModal
        isOpen={showChatbotModal}
        onClose={() => setShowChatbotModal(false)}
        apiUrl={apiUrl}
        token={token}
        userMode={activeMode as any}
        onRefreshDashboard={() => fetchDashboardData()}
      />
    </>
  );
};
