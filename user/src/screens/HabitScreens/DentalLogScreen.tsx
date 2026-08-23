import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Stethoscope, Camera, Calendar, History, Info, Sparkles, AlertCircle, Eye, Trash2, Edit2, Check } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { ConsultationBanner } from '../../components/ConsultationBanner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { HabitsService } from '../../services/habitsService';

interface DentalLogScreenProps {
  onBack: () => void;
  onBookAppointment?: (reason: string) => void;
}

export const DentalLogScreen: React.FC<DentalLogScreenProps> = ({ onBack, onBookAppointment }) => {
  const { user, token, apiUrl } = useAuth();
  const { showToast } = useToast();
  
  // Dental Consultation state
  const [sharpTooth, setSharpTooth] = useState<boolean | null>(null);
  const [tobacco, setTobacco] = useState<boolean | null>(null);
  const [illFittingDenture, setIllFittingDenture] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  // Tracker state
  const [history, setHistory] = useState<any[]>([]);
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectionMode, setSelectionMode] = useState<'enamel' | 'stain'>('enamel');
  const [enamelPoint, setEnamelPoint] = useState<{ x: number; y: number } | null>(null);
  const [stainPoint, setStainPoint] = useState<{ x: number; y: number } | null>(null);
  const [enamelColor, setEnamelColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [stainColor, setStainColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(300);
  const [canvasHeight, setCanvasHeight] = useState(300);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const trackerRef = useRef<HTMLDivElement | null>(null);
  
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);
  const [editingLog, setEditingLog] = useState<any | null>(null);

  useEffect(() => {
    if (tobacco === true) {
      setTimeout(() => {
        trackerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    }
  }, [tobacco]);

  // Load Dental consultation state and Tracker history
  useEffect(() => {
    const initData = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        // Load consultation values
        const dentalLogs = await HabitsService.getRecentHabits(apiUrl, token, 'Dental', 1);
        if (dentalLogs.length > 0) {
          const val = dentalLogs[0].value;
          if (val.sharpTooth !== undefined) setSharpTooth(val.sharpTooth);
          if (val.tobacco !== undefined) setTobacco(val.tobacco);
          if (val.illFittingDenture !== undefined) setIllFittingDenture(val.illFittingDenture);
        }

        // Load tracker history
        const trackerLogs = await HabitsService.getRecentHabits(apiUrl, token, 'TobaccoStainTracker', 100);
        setHistory(trackerLogs);
      } catch (err) {
        console.error('Failed to load initial data', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [user]);

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'TobaccoStainTracker', 100);
      setHistory(logs);
    } catch (err) {
      console.error('Failed to reload tracker logs', err);
    }
  };

  const handleSelectDental = async (fieldName: string, value: boolean) => {
    const nextSharpTooth = fieldName === 'sharpTooth' ? value : sharpTooth;
    const nextTobacco = fieldName === 'tobacco' ? value : tobacco;
    const nextIllFittingDenture = fieldName === 'illFittingDenture' ? value : illFittingDenture;

    if (fieldName === 'sharpTooth') setSharpTooth(value);
    if (fieldName === 'tobacco') setTobacco(value);
    if (fieldName === 'illFittingDenture') setIllFittingDenture(value);

    if (!user?.id) return;
    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Dental', {
        sharpTooth: nextSharpTooth,
        tobacco: nextTobacco,
        illFittingDenture: nextIllFittingDenture
      });
    } catch (err) {
      console.error('Failed to log dental log', err);
    } finally {
      setLoading(false);
    }
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${apiUrl}/habits/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload image');
      const data = await response.json();
      setImageUrl(data.imageUrl);

      // Load image onto Canvas
      const img = new Image();
      // Use proxy or crossOrigin to avoid CORS issues
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Calculate aspect-ratio scaling
        const maxDim = 400;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = (maxDim / w) * h;
            w = maxDim;
          } else {
            w = (maxDim / h) * w;
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        setCanvasWidth(w);
        setCanvasHeight(h);

        ctx.drawImage(img, 0, 0, w, h);
        
        // Reset points
        setEnamelPoint(null);
        setStainPoint(null);
        setEnamelColor(null);
        setStainColor(null);
        setCalculatedScore(null);
        setSelectionMode('enamel');
      };
      // Prepend API URL if it's a relative uploads path
      const baseServerUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
      img.src = data.imageUrl.startsWith('http') ? data.imageUrl : `${baseServerUrl}${data.imageUrl}`;
    } catch (err) {
      console.error('Upload failed', err);
      showToast('Error uploading photo. Please try again.', 'error');
    } finally {
      setUploading(false);
      // Reset the file input values so onChange will trigger again even for the same file
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  // Capacitor Camera Capture handler
  const handleCapturePhoto = async () => {
    try {
      // Check and request camera permissions to prevent native crashes
      const checkPerms = await CapacitorCamera.checkPermissions();
      if (checkPerms.camera !== 'granted') {
        const reqPerms = await CapacitorCamera.requestPermissions({ permissions: ['camera'] });
        if (reqPerms.camera !== 'granted') {
          showToast('Camera permission is required to take photos.', 'error');
          return;
        }
      }

      const photo = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      if (!photo.webPath) return;

      setUploading(true);
      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const file = new File([blob], `dental-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('image', file);

      const uploadRes = await fetch(`${apiUrl}/habits/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!uploadRes.ok) throw new Error('Failed to upload image');
      const data = await uploadRes.json();
      setImageUrl(data.imageUrl);

      // Load image onto Canvas
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const maxDim = 400;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = (maxDim / w) * h;
            w = maxDim;
          } else {
            w = (maxDim / h) * w;
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        setCanvasWidth(w);
        setCanvasHeight(h);

        ctx.drawImage(img, 0, 0, w, h);
        
        setEnamelPoint(null);
        setStainPoint(null);
        setEnamelColor(null);
        setStainColor(null);
        setCalculatedScore(null);
        setSelectionMode('enamel');
      };
      const baseServerUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
      img.src = data.imageUrl.startsWith('http') ? data.imageUrl : `${baseServerUrl}${data.imageUrl}`;
    } catch (err: any) {
      console.error('Capture/upload failed', err);
      if (err.message !== 'User cancelled photos app' && !err.message?.includes('cancelled')) {
        showToast('Error capturing or uploading photo. Please try again.', 'error');
      }
    } finally {
      setUploading(false);
    }
  };

  const [draggingMarker, setDraggingMarker] = useState<'enamel' | 'stain' | null>(null);

  const handleMarkerDrag = (clientX: number, clientY: number, type: 'enamel' | 'stain') => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let x = Math.round(((clientX - rect.left) / rect.width) * canvas.width);
    let y = Math.round(((clientY - rect.top) / rect.height) * canvas.height);

    x = Math.max(0, Math.min(canvas.width, x));
    y = Math.max(0, Math.min(canvas.height, y));

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const rgb = { r: pixel[0], g: pixel[1], b: pixel[2] };

      if (type === 'enamel') {
        setEnamelColor(rgb);
        setEnamelPoint({ x, y });
      } else {
        setStainColor(rgb);
        setStainPoint({ x, y });
      }
    } catch (err) {
      console.error('Error fetching pixel data on drag', err);
      const mockColor = type === 'enamel' ? { r: 240, g: 235, b: 220 } : { r: 120, g: 90, b: 60 };
      if (type === 'enamel') {
        setEnamelColor(mockColor);
        setEnamelPoint({ x, y });
      } else {
        setStainColor(mockColor);
        setStainPoint({ x, y });
      }
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!draggingMarker) return;
      handleMarkerDrag(e.clientX, e.clientY, draggingMarker);
    };

    const handleGlobalMouseUp = () => {
      if (draggingMarker) setDraggingMarker(null);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!draggingMarker || e.touches.length === 0) return;
      handleMarkerDrag(e.touches[0].clientX, e.touches[0].clientY, draggingMarker);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [draggingMarker]);

  // Canvas spot selector
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * canvas.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const rgb = { r: pixel[0], g: pixel[1], b: pixel[2] };

      if (selectionMode === 'enamel') {
        setEnamelColor(rgb);
        const isFirstSelection = !enamelPoint;
        setEnamelPoint({ x, y });
        if (isFirstSelection) {
          setSelectionMode('stain');
        }
      } else {
        setStainColor(rgb);
        setStainPoint({ x, y });
      }
    } catch (err) {
      console.error('Error fetching pixel data', err);
      const mockColor = selectionMode === 'enamel' ? { r: 240, g: 235, b: 220 } : { r: 120, g: 90, b: 60 };
      if (selectionMode === 'enamel') {
        setEnamelColor(mockColor);
        const isFirstSelection = !enamelPoint;
        setEnamelPoint({ x, y });
        if (isFirstSelection) {
          setSelectionMode('stain');
        }
      } else {
        setStainColor(mockColor);
        setStainPoint({ x, y });
      }
    }
  };

  // Calculate score when enamel and stain colors are both selected
  useEffect(() => {
    if (enamelColor && stainColor) {
      const enamelBrightness = 0.299 * enamelColor.r + 0.587 * enamelColor.g + 0.114 * enamelColor.b;
      const stainBrightness = 0.299 * stainColor.r + 0.587 * stainColor.g + 0.114 * stainColor.b;

      if (enamelBrightness <= 0) {
        setCalculatedScore(100);
        return;
      }

      let diff = 1 - stainBrightness / enamelBrightness;
      if (diff < 0) diff = 0;

      // Scale difference to a 0-100 index (e.g. 50% darker = score 100)
      const scoreValue = Math.min(100, Math.max(0, Math.round(diff * 200)));
      setCalculatedScore(scoreValue);
    }
  }, [enamelColor, stainColor]);

  // Score categories
  const getCategory = (scoreVal: number) => {
    if (scoreVal <= 14) return { label: 'Minimal', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (scoreVal <= 34) return { label: 'Mild', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
    if (scoreVal <= 59) return { label: 'Moderate', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { label: 'Heavy', color: 'text-rose-600 bg-rose-50 border-rose-200' };
  };

  // Save tracker reading
  const handleSaveReading = async () => {
    if (calculatedScore === null || !imageUrl) return;

    setTrackerLoading(true);
    try {
      const categoryLabel = getCategory(calculatedScore).label;
      const targetDate = editingLog ? editingLog.value.date : new Date().toISOString();
      const payload = {
        score: calculatedScore,
        category: categoryLabel,
        imageUrl,
        enamelPoint,
        stainPoint,
        enamelColor,
        stainColor,
        canvasWidth,
        canvasHeight,
        date: targetDate
      };

      if (editingLog) {
        await HabitsService.deleteHabit(apiUrl, token, editingLog.id);
      }

      await HabitsService.logHabit(apiUrl, token, 'TobaccoStainTracker', payload, targetDate);
      
      // Reset tracker state
      setImageUrl('');
      setEnamelPoint(null);
      setStainPoint(null);
      setEnamelColor(null);
      setStainColor(null);
      setCalculatedScore(null);
      setEditingLog(null);

      // Reload logs
      await loadHistory();
    } catch (err) {
      console.error('Failed to save reading', err);
      showToast('Failed to save reading. Please try again.', 'error');
    } finally {
      setTrackerLoading(false);
    }
  };

  const [dentalReadingToDelete, setDentalReadingToDelete] = useState<string | null>(null);

  // Delete tracker reading
  const confirmDeleteReading = async () => {
    if (!dentalReadingToDelete) return;
    const id = dentalReadingToDelete;
    setDentalReadingToDelete(null);
    try {
      await HabitsService.deleteHabit(apiUrl, token, id);
      setSelectedHistoryItem(null);
      showToast('Reading deleted successfully.', 'success');
      await loadHistory();
    } catch (err) {
      console.error('Failed to delete reading', err);
      showToast('Failed to delete reading. Please try again.', 'error');
    }
  };

  // Edit tracker reading
  const handleStartEdit = (log: any) => {
    setSelectedHistoryItem(null);
    setEditingLog(log);

    setImageUrl(log.value.imageUrl);
    setEnamelPoint(log.value.enamelPoint);
    setStainPoint(log.value.stainPoint);
    setEnamelColor(log.value.enamelColor);
    setStainColor(log.value.stainColor);
    setCalculatedScore(log.value.score);
    setCanvasWidth(log.value.canvasWidth || 300);
    setCanvasHeight(log.value.canvasHeight || 300);

    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = log.value.canvasWidth || 300;
        canvas.height = log.value.canvasHeight || 300;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      const baseServerUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
      img.src = log.value.imageUrl.startsWith('http') ? log.value.imageUrl : `${baseServerUrl}${log.value.imageUrl}`;
    }, 200);

    setTimeout(() => {
      trackerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
  };

  // Date and Lockout calculations
  const latestReading = history.length > 0 ? history[0] : null;
  const lastReadingDate = latestReading ? new Date(latestReading.value.date) : null;
  const nextReadingDate = lastReadingDate ? new Date(lastReadingDate.getTime() + 28 * 24 * 60 * 60 * 1000) : null;
  const daysRemaining = nextReadingDate ? Math.ceil((nextReadingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const isDue = daysRemaining <= 0;

  // Chart data formatting (at least 2 readings)
  const chartData = [...history]
    .reverse()
    .map(log => ({
      date: new Date(log.value.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      score: log.value.score
    }));

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 sub-page-internal-header">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Damage · Dental</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">Dental Health</h2>
        </div>
      </div>

      {/* Info check */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 mb-1.5 flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Oral Health Check</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Poor dental health, sharp teeth, and tobacco staining are linked to chronic inflammation and increased risk of oral cancers.
        </p>
      </div>

      {/* Consultation Questions */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 mb-8">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-6">Self Assessment</span>
        
        {/* Q1: Sharp Tooth */}
        <div className="mb-8">
          <p className="font-semibold text-slate-800 text-sm mb-4">Do you have any sharp tooth?</p>
          <div className="flex gap-3">
            <button 
              onClick={() => handleSelectDental('sharpTooth', true)}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${sharpTooth === true ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800'} disabled:opacity-50`}
            >
              Yes
            </button>
            <button 
              onClick={() => handleSelectDental('sharpTooth', false)}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${sharpTooth === false ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800'} disabled:opacity-50`}
            >
              No
            </button>
          </div>

          {sharpTooth === true && (
            <ConsultationBanner
              sourceModule="Dental"
              reason="Dentist Consultation"
              triggerCondition="Has sharp tooth"
              riskLevel="Medium"
              recommendedSpecialty="Dentist"
              title="Recommendation"
              description="A sharp tooth can cause chronic irritation which might lead to complications over time. Please consult a dentist."
              colorTheme="amber"
              onBookAppointment={onBookAppointment!}
            />
          )}

          {sharpTooth === false && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-emerald-700 text-xs font-semibold">Good! Keep maintaining your oral hygiene.</p>
            </div>
          )}
        </div>

        {/* Q2: Tobacco Staining */}
        <div className="pt-6 border-t border-slate-100 mb-8">
          <p className="font-semibold text-slate-800 text-sm mb-4">Do you have tobacco staining on your teeth?</p>
          <div className="flex gap-3">
            <button 
              onClick={() => handleSelectDental('tobacco', true)}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${tobacco === true ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800'} disabled:opacity-50`}
            >
              Yes
            </button>
            <button 
              onClick={() => handleSelectDental('tobacco', false)}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${tobacco === false ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800'} disabled:opacity-50`}
            >
              No
            </button>
          </div>

          {tobacco === true && (
            <>
              <ConsultationBanner
                sourceModule="Dental"
                reason="Dentist Consultation"
                triggerCondition="Has tobacco staining"
                riskLevel="Medium"
                recommendedSpecialty="Dentist"
                title="Recommendation"
                description="Tobacco staining requires professional cleaning and evaluation to prevent further damage."
                colorTheme="amber"
                onBookAppointment={onBookAppointment!}
              />

              {/* TOBACCO STAIN TRACKER (Rendered inline directly under Tobacco staining banner) */}
              <div ref={trackerRef} className="mt-6 border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-teal-600 animate-pulse" />
                    <h3 className="text-base font-bold text-slate-800 animate-fade-in">Tobacco Stain Tracker</h3>
                  </div>
                  <span className="text-[9px] font-bold text-teal-600 bg-teal-50 border border-teal-150 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Mito Reboot
                  </span>
                </div>

                {/* Tracker Guide */}
                <div className="p-3 bg-slate-50 rounded-xl text-slate-600 text-[11px] leading-relaxed mb-4 flex gap-2">
                  <Info className="h-3.5 w-3.5 text-slate-455 shrink-0 mt-0.5" />
                  <div>
                    Photograph the same front teeth using consistent light, angle, and distance every 4 weeks. Select the enamel and stained areas to track shade differences over time.
                  </div>
                </div>

                {/* Locked / Due State Display */}
                {!latestReading ? (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center mb-6">
                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block mb-1">NO READINGS YET</span>
                    <p className="text-xs font-bold text-amber-700">Take your first photo below</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5 mb-6 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/50">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Last Reading</span>
                      <p className="text-xs font-bold text-slate-700">
                        {lastReadingDate ? lastReadingDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '-'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/50">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Current Score</span>
                      <p className="text-xs font-bold text-slate-700">
                        {latestReading.value.score} ({latestReading.value.category})
                      </p>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDue ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-teal-50 border-teal-200 text-teal-700'}`}>
                      <span className={`text-[8px] font-bold uppercase tracking-wider block mb-0.5 ${isDue ? 'text-rose-400' : 'text-teal-400'}`}>
                        Next Due
                      </span>
                      <p className="text-xs font-bold">
                        {isDue ? 'Reading due now' : `${daysRemaining} days`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Photo Capture / Analysis section */}
                {(!latestReading || isDue || imageUrl || editingLog) ? (
                  <div className="space-y-4">
                    {editingLog && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Edit2 className="h-4 w-4 text-amber-600 shrink-0" />
                          <span className="text-[11px] font-bold text-amber-800">
                            Editing reading from {new Date(editingLog.value.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLog(null);
                            setImageUrl('');
                            setEnamelPoint(null);
                            setStainPoint(null);
                            setEnamelColor(null);
                            setStainColor(null);
                            setCalculatedScore(null);
                          }}
                          className="text-[9px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-250 px-2 py-1 rounded-lg uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">1. Add a photo</span>
                    
                    {imageUrl ? (
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          setEnamelPoint(null);
                          setStainPoint(null);
                          setEnamelColor(null);
                          setStainColor(null);
                          setCalculatedScore(null);
                        }}
                        className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                      >
                        <Trash2 className="h-4 w-4" /> Remove & Retake Photo
                      </button>
                    ) : (
                      <div className="flex gap-3">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          ref={fileInputRef} 
                          className="hidden" 
                        />
                        <button
                          type="button"
                          onClick={handleCapturePhoto}
                          disabled={uploading || trackerLoading}
                          className="flex-1 py-2.5 bg-teal-850 hover:bg-teal-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                          style={{ backgroundColor: '#1F4D4B' }}
                        >
                          <Camera className="h-4 w-4" /> Take Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading || trackerLoading}
                          className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                          Upload Photo
                        </button>
                      </div>
                    )}

                    {uploading && (
                      <div className="text-center py-4">
                        <div className="w-5 h-5 border-2 border-slate-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-2"></div>
                        <span className="text-xs text-slate-500">Uploading dental photo...</span>
                      </div>
                    )}

                    {/* Interactive Canvas */}
                    {imageUrl && (
                      <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">2. Select tooth areas</span>
                        
                        {/* Selector Toggle */}
                        <div className="flex gap-2 mb-4 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                          <button
                            type="button"
                            onClick={() => setSelectionMode('enamel')}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${selectionMode === 'enamel' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                          >
                            Enamel Area
                            {enamelColor && <Check className="h-3.5 w-3.5 text-emerald-100" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectionMode('stain')}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${selectionMode === 'stain' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-550 hover:bg-slate-50'}`}
                          >
                            Stained Area
                            {stainColor && <Check className="h-3.5 w-3.5 text-amber-100" />}
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-500 mb-4 bg-white p-2.5 rounded-lg border border-slate-200/50">
                          {selectionMode === 'enamel' 
                            ? 'Tap on a clean, normal enamel part of your front teeth.' 
                            : 'Tap on a stained part of your front teeth to measure discoloration.'}
                        </p>

                        <div className="flex justify-center mb-4">
                          <div className="relative inline-block max-w-full">
                            <canvas
                              ref={canvasRef}
                              onClick={handleCanvasClick}
                              className="max-w-full h-auto rounded-xl border border-slate-200 cursor-crosshair bg-white"
                            />
                             {enamelPoint && (
                              <div 
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setDraggingMarker('enamel');
                                }}
                                onTouchStart={(e) => {
                                  e.stopPropagation();
                                  setDraggingMarker('enamel');
                                }}
                                className="absolute w-6 h-6 border-2 border-emerald-500 rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 bg-emerald-500/20 text-[10px] font-extrabold text-emerald-800 shadow-md cursor-grab active:cursor-grabbing select-none"
                                style={{ 
                                  left: `${(enamelPoint.x / canvasWidth) * 100}%`, 
                                  top: `${(enamelPoint.y / canvasHeight) * 100}%` 
                                }}
                              >
                                E
                              </div>
                            )}
                            {stainPoint && (
                              <div 
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setDraggingMarker('stain');
                                }}
                                onTouchStart={(e) => {
                                  e.stopPropagation();
                                  setDraggingMarker('stain');
                                }}
                                className="absolute w-6 h-6 border-2 border-amber-600 rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 bg-amber-600/20 text-[10px] font-extrabold text-amber-800 shadow-md cursor-grab active:cursor-grabbing select-none"
                                style={{ 
                                  left: `${(stainPoint.x / canvasWidth) * 100}%`, 
                                  top: `${(stainPoint.y / canvasHeight) * 100}%` 
                                }}
                              >
                                S
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Selected Shade Previews */}
                        {(enamelColor || stainColor) && (
                          <div className="flex gap-3 justify-center mb-4">
                            {enamelColor && (
                              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-[10px] font-bold text-slate-600">
                                <span className="w-3 h-3 rounded-full border border-slate-200 shadow-inner" style={{ backgroundColor: `rgb(${enamelColor.r}, ${enamelColor.g}, ${enamelColor.b})` }} />
                                Enamel Shade
                              </div>
                            )}
                            {stainColor && (
                              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-[10px] font-bold text-slate-600">
                                <span className="w-3 h-3 rounded-full border border-slate-200 shadow-inner" style={{ backgroundColor: `rgb(${stainColor.r}, ${stainColor.g}, ${stainColor.b})` }} />
                                Stain Shade
                              </div>
                            )}
                          </div>
                        )}

                        {/* Calculated Results */}
                        {calculatedScore !== null && (
                          <div className="bg-white border border-slate-200 rounded-2xl p-4 mt-4 shadow-sm text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                              Calculated Stain Score
                            </span>
                            <div className="flex items-center justify-center gap-2 mb-4">
                              <span className="text-4xl font-sans font-bold text-slate-800">
                                {calculatedScore}
                              </span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-full ${getCategory(calculatedScore).color}`}>
                                {getCategory(calculatedScore).label}
                              </span>
                            </div>

                            {/* Premium Score Indicator Slider */}
                            <div className="px-2 mb-6">
                              <div className="relative w-full h-2.5 bg-slate-100 rounded-full flex overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: '15%' }} />
                                <div className="h-full bg-yellow-400" style={{ width: '20%' }} />
                                <div className="h-full bg-amber-500" style={{ width: '25%' }} />
                                <div className="h-full bg-rose-500" style={{ width: '40%' }} />
                              </div>
                              <div className="relative w-full h-3">
                                <div 
                                  className="absolute -top-3.5 w-4 h-4 bg-slate-850 border-2 border-white rounded-full shadow-md -translate-x-1/2 transition-all duration-500 ease-out"
                                  style={{ left: `${calculatedScore}%`, backgroundColor: '#1F4D4B' }}
                                />
                              </div>
                              <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-2 px-1">
                                <span>0 (Minimal)</span>
                                <span>15 (Mild)</span>
                                <span>35 (Mod)</span>
                                <span>60 (Heavy)</span>
                              </div>
                            </div>

                            <button
                              onClick={handleSaveReading}
                              disabled={trackerLoading}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50"
                            >
                              {trackerLoading ? 'Saving reading...' : 'Save Reading'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 text-center text-teal-800 font-bold text-xs mb-4">
                    Next reading due in {daysRemaining} days.
                  </div>
                )}

                {/* Trend Chart (At least 2 readings) */}
                {chartData.length >= 2 && (
                  <div className="mt-8">
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-3">Staining Score Trend</span>
                    <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-4 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0D9488" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
                          <YAxis domain={[0, 100]} stroke="#64748B" fontSize={10} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ color: '#64748B', fontSize: '10px', fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="score" stroke="#0D9488" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* History List */}
                {(() => {
                  const filteredHistory = history.filter((log) => !editingLog || log.id !== editingLog.id);
                  if (filteredHistory.length === 0) return null;
                  return (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-4 flex items-center gap-1.5"><History className="h-3.5 w-3.5" /> Previous Readings (Tap to view details)</span>
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {filteredHistory.map((log) => {
                        const logDate = new Date(log.value.date);
                        const logScore = log.value.score;
                        const cat = getCategory(logScore);
                        return (
                          <div 
                            key={log.id} 
                            onClick={() => setSelectedHistoryItem(log)}
                            className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 cursor-pointer hover:bg-slate-100 transition-all hover:border-slate-350 active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-2.5">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <div>
                                <p className="text-xs font-bold text-slate-700">{logDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                <p className="text-[10px] text-slate-400">Score: {logScore}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cat.color}`}>
                                {cat.label}
                              </span>
                              <Eye className="h-4 w-4 text-slate-400 hover:text-teal-650 transition-colors" />
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  );
                })()}

                {/* Disclaimer */}
                <div className="mt-6 p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 leading-relaxed">
                    <strong>Disclaimer:</strong> This tool gives an informal, photo-based approximation for personal tracking only, is not a validated diagnostic device, and does not replace a professional dental examination.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Q3: Ill-fitting Dentures */}
        <div className="pt-6 border-t border-slate-100">
          <p className="font-semibold text-slate-800 text-sm mb-4">Do you have ill fitting denture?</p>
          <div className="flex gap-3">
            <button 
              onClick={() => handleSelectDental('illFittingDenture', true)}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${illFittingDenture === true ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 border border-transparent dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800'} disabled:opacity-50`}
            >
              Yes
            </button>
            <button 
              onClick={() => handleSelectDental('illFittingDenture', false)}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${illFittingDenture === false ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 border border-transparent dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800'} disabled:opacity-50`}
            >
              No
            </button>
          </div>

          {illFittingDenture === true && (
            <ConsultationBanner
              sourceModule="Dental"
              reason="Dentist Consultation"
              triggerCondition="Has ill-fitting denture"
              riskLevel="Medium"
              recommendedSpecialty="Dentist"
              title="Recommendation"
              description="An ill-fitting denture can cause chronic mucosal irritation, ulcers, or other long-term oral health issues. Please consult a dentist."
              colorTheme="amber"
              onBookAppointment={onBookAppointment!}
            />
          )}

          {illFittingDenture === false && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-emerald-700 text-xs font-semibold">Good! Well-fitting dentures ensure chewing comfort and oral health.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal for viewing details of a previous reading */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full border border-slate-100 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">
                Reading Details ({new Date(selectedHistoryItem.value.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })})
              </h3>
              <button 
                type="button"
                onClick={() => setSelectedHistoryItem(null)}
                className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex justify-center mb-4">
              <div className="relative inline-block max-w-full">
                <img 
                  src={selectedHistoryItem.value.imageUrl.startsWith('http') 
                    ? selectedHistoryItem.value.imageUrl 
                    : `${apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl}${selectedHistoryItem.value.imageUrl}`}
                  alt="Saved dental check" 
                  className="max-w-full h-auto rounded-xl border border-slate-200"
                  style={{ width: `${selectedHistoryItem.value.canvasWidth || 300}px` }}
                />
                {selectedHistoryItem.value.enamelPoint && (
                  <div 
                    className="absolute w-5 h-5 border-2 border-emerald-500 rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 bg-emerald-500/20 text-[9px] font-extrabold text-emerald-800 shadow-md"
                    style={{ 
                      left: `${(selectedHistoryItem.value.enamelPoint.x / (selectedHistoryItem.value.canvasWidth || 300)) * 100}%`, 
                      top: `${(selectedHistoryItem.value.enamelPoint.y / (selectedHistoryItem.value.canvasHeight || 300)) * 100}%` 
                    }}
                  >
                    E
                  </div>
                )}
                {selectedHistoryItem.value.stainPoint && (
                  <div 
                    className="absolute w-5 h-5 border-2 border-amber-600 rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 bg-amber-600/20 text-[9px] font-extrabold text-amber-800 shadow-md"
                    style={{ 
                      left: `${(selectedHistoryItem.value.stainPoint.x / (selectedHistoryItem.value.canvasWidth || 300)) * 100}%`, 
                      top: `${(selectedHistoryItem.value.stainPoint.y / (selectedHistoryItem.value.canvasHeight || 300)) * 100}%` 
                    }}
                  >
                    S
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Stain Score
              </span>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-3xl font-sans font-bold text-slate-800">
                  {selectedHistoryItem.value.score}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-full ${getCategory(selectedHistoryItem.value.score).color}`}>
                  {getCategory(selectedHistoryItem.value.score).label}
                </span>
              </div>

              {/* Progress/Indicator bar in modal */}
              <div className="px-2">
                <div className="relative w-full h-2.5 bg-slate-200/70 rounded-full flex overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '15%' }} />
                  <div className="h-full bg-yellow-400" style={{ width: '20%' }} />
                  <div className="h-full bg-amber-500" style={{ width: '25%' }} />
                  <div className="h-full bg-rose-500" style={{ width: '40%' }} />
                </div>
                <div className="relative w-full h-2">
                  <div 
                    className="absolute -top-3.5 w-3.5 h-3.5 border border-white rounded-full shadow-sm -translate-x-1/2"
                    style={{ left: `${selectedHistoryItem.value.score}%`, backgroundColor: '#1F4D4B' }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 mt-4">
              <button
                type="button"
                onClick={() => setDentalReadingToDelete(selectedHistoryItem.id)}
                className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
              <button
                type="button"
                onClick={() => handleStartEdit(selectedHistoryItem)}
                className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1"
              >
                <Edit2 className="h-3 w-3" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setSelectedHistoryItem(null)}
                className="flex-1 py-2 bg-slate-850 hover:bg-slate-900 text-white rounded-xl font-bold text-[10px] transition-all"
                style={{ backgroundColor: '#1F4D4B' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Delete Confirmation Modal */}
      {dentalReadingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm border border-slate-150 dark:border-slate-800 shadow-2xl animate-scaleIn text-slate-800 dark:text-slate-100 text-center">
            <div className="mx-auto w-12 h-12 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl flex items-center justify-center mb-3">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-1">Delete Reading?</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed mb-5">
              Are you sure you want to delete this stain reading? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setDentalReadingToDelete(null)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-extrabold py-3 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteReading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold py-3 rounded-2xl transition-all shadow-md shadow-rose-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
