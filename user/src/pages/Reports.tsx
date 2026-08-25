import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  FileUp, 
  History, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2, 
  FileText,
  CreditCard,
  DownloadCloud,
  Lock,
  Trash2,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ReportsProps {
  onNavigateToTab?: (tab: string) => void;
  features?: any;
}

import { Capacitor } from '@capacitor/core';

export const Reports: React.FC<ReportsProps> = ({ onNavigateToTab, features }) => {
  const { token, apiUrl, branding } = useAuth();
  const isIOSAppStoreBlocked = Capacitor.getPlatform() === 'ios' && !branding.enableIOSExternalPayments;
  const { showToast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [exportRange, setExportRange] = useState<string>('week');
  const [exportCustomFrom, setExportCustomFrom] = useState<string>('');
  const [exportCustomTo, setExportCustomTo] = useState<string>('');
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchHistory();
  }, [token]);

  // Auto-poll history if any report is currently processing in background
  useEffect(() => {
    const hasProcessing = history.some((r: any) => r.status === 'Processing');
    if (hasProcessing && token) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${apiUrl}/reports`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const newHistory = await res.json();
            // Check if any report completed processing in this poll cycle
            history.forEach(oldReport => {
              if (oldReport.status === 'Processing') {
                const updated = newHistory.find((n: any) => n._id === oldReport._id);
                if (updated && updated.status === 'Processed') {
                  const countText = updated.parsedReadingsCount !== undefined ? `${updated.parsedReadingsCount} readings` : 'readings';
                  showToast(`🎉 Report "${updated.fileName}" processed successfully! Loaded ${countText}.`, 'success');
                  setMessage({ text: `Success: Loaded ${countText} from "${updated.fileName}".`, isError: false });
                } else if (updated && updated.status === 'Failed') {
                  showToast(`Report processing failed: ${updated.errorMessage || 'Parsing error'}`, 'error');
                  setMessage({ text: `Failed: ${updated.errorMessage || 'Parsing error'}`, isError: true });
                }
              }
            });
            setHistory(newHistory);
          }
        } catch (_) {}
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [history, token]);

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${apiUrl}/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 402 || response.status === 403) {
        setShowUpgradePrompt(true);
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem('mito_has_cgm_reports', 'true');
        } else {
          localStorage.removeItem('mito_has_cgm_reports');
        }
        setShowUpgradePrompt(false);
      }
    } catch (err) {
      console.error('Error fetching upload history:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !token) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('report', file);

    try {
      const response = await fetch(`${apiUrl}/reports/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.status === 402 || response.status === 403) {
        setShowUpgradePrompt(true);
        setUploading(false);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        const pointReadingsCount = data.readingsCount || 0;
        const reportObj = data.report || {};
        const hasSummaryData = !!(
          reportObj.pdfSummaryAverageGlucose ||
          reportObj.pdfSummaryTimeInRange ||
          reportObj.glucoseVariability ||
          (reportObj.dailySummaries && reportObj.dailySummaries.length > 0) ||
          (reportObj.hourlyPatternSummaries && reportObj.hourlyPatternSummaries.length > 0)
        );

        let msgText = '';
        if (pointReadingsCount > 0) {
          msgText = `Successfully loaded ${pointReadingsCount} glucose readings from "${file.name}".`;
        } else if (hasSummaryData) {
          msgText = `Successfully processed "${file.name}". No individual point readings were available, but LibreView summary and pattern data were extracted.`;
        } else {
          msgText = `Successfully processed "${file.name}".`;
        }
        
        showToast(msgText, 'success');
        setMessage({ text: msgText, isError: false });
        setFile(null);
        // Clear input element
        const fileInput = document.getElementById('report-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        fetchHistory();
      } else {
        throw new Error(data.message || data.error || 'Failed to parse file.');
      }
    } catch (err: any) {
      showToast(err.message || 'Error occurred during parsing.', 'error');
      setMessage({ text: err.message || 'Error occurred during parsing.', isError: true });
    } finally {
      setUploading(false);
    }
  };

  const handleReprocess = async (reportId: string) => {
    if (!token) return;
    setReprocessingId(reportId);
    try {
      const response = await fetch(`${apiUrl}/reports/${reportId}/reprocess`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Report reprocessing started.', 'success');
        fetchHistory();
      } else {
        showToast(data.message || 'Reprocessing failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error reprocessing report.', 'error');
    } finally {
      setReprocessingId(null);
    }
  };

  const [reportToDelete, setReportToDelete] = useState<{ id: string; name: string } | null>(null);

  const confirmDeleteReport = async () => {
    if (!token || !reportToDelete) return;
    const reportId = reportToDelete.id;
    setDeletingId(reportId);
    setReportToDelete(null);
    try {
      const response = await fetch(`${apiUrl}/reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showToast('Report deleted successfully.', 'success');
        setHistory(prev => prev.filter(r => r._id !== reportId));
      } else {
        const data = await response.json();
        showToast(data.message || 'Delete failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting report.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    if (!token) return;
    try {
      showToast('Report download started.', 'success');
      const downloadUrl = `${apiUrl}/reports/${reportId}/download?token=${encodeURIComponent(token)}`;
      if (Capacitor.isNativePlatform()) {
        // In native Android/iOS app shell containers, window.open fails due to strict Webview sandbox rules.
        // Opening directly in the native device browser allows native OS file download handlers to function.
        window.open(downloadUrl, '_system');
      } else {
        window.open(downloadUrl, '_blank');
      }
    } catch (err) {
      console.error(err);
      showToast('Error downloading file.', 'error');
    }
  };

  const handleDownloadUserReport = async () => {
    if (!token) return;
    try {
      showToast('Generating report PDF. Please wait...', 'info');
      const safeAppName = branding.appName.replace(/[^a-z0-9]/gi, '_');
      let rangeParam = exportRange;
      if (exportRange === 'custom' && exportCustomFrom && exportCustomTo) {
        rangeParam = `custom&startDate=${exportCustomFrom}&endDate=${exportCustomTo}`;
      }
      const filename = `${safeAppName}_Health_Report-${exportRange}-${new Date().toISOString().split('T')[0]}.pdf`;
      const downloadUrl = `${apiUrl}/reports/user-pdf?range=${rangeParam}&token=${encodeURIComponent(token)}&filename=${encodeURIComponent(filename)}`;
      
      if (Capacitor.isNativePlatform()) {
        // Trigger system external browser to handle download on native iOS/Android devices
        window.open(downloadUrl, '_system');
      } else {
        window.open(downloadUrl, '_blank');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Error generating report.', 'error');
    }
  };

  if (showUpgradePrompt) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pb-24 pt-12 px-6 max-w-5xl mx-auto bg-white dark:bg-slate-950 min-h-[80vh] flex flex-col items-center justify-center text-center"
      >
        <div className="h-16 w-16 bg-blue-50 dark:bg-indigo-900/30 text-primary dark:text-indigo-400 rounded-full flex items-center justify-center mb-4 shadow-soft">
          <CreditCard className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{isIOSAppStoreBlocked ? 'Feature Unavailable' : 'Premium Feature Locked'}</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold max-w-xs mt-2 mb-6">
          {isIOSAppStoreBlocked
            ? 'This feature is currently unavailable on iOS.'
            : 'CGM Report Upload requires an active Basic or Premium Plan. Unlock unlimited uploads, analysis, and custom alerts.'
          }
        </p>
        {!isIOSAppStoreBlocked && (
          <button
            onClick={() => {
              if (onNavigateToTab) {
                onNavigateToTab('Subscription');
              }
            }}
            className="bg-primary hover:bg-primary/95 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl shadow-soft transition-all"
          >
            View Subscription Plans
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="pb-36 pt-4 px-4 max-w-5xl mx-auto bg-slate-50/70 dark:bg-slate-950/70 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100"
    >
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-bold text-slate-850 dark:text-slate-100">Glucose Reports</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
            Upload LibreView CSVs to sync data
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl transition-all text-slate-500 shadow-sm hover:bg-slate-50"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="bg-white dark:bg-slate-900 shadow-[0_12px_24px_rgba(0,0,0,0.02)] rounded-3xl p-5 mb-8 border border-slate-100 dark:border-slate-800 relative"
      >
        {!features?.unlimitedReports && (
          <div className="absolute inset-0 z-10 bg-white/70 dark:bg-slate-900/80 backdrop-blur-[1.5px] rounded-3xl flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-[0_12px_30px_rgba(0,0,0,0.05)] text-center max-w-xs border border-slate-100 dark:border-slate-700/80">
              <Lock className="h-7 w-7 text-amber-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{isIOSAppStoreBlocked ? 'Feature Unavailable' : 'Premium Feature'}</h4>
              <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold mb-3">
                {isIOSAppStoreBlocked ? 'This feature is currently unavailable on iOS.' : 'Upgrade to a premium plan to import new CGM reports.'}
              </p>
              {!isIOSAppStoreBlocked && (
                <button
                  type="button"
                  onClick={() => setShowUpgradePrompt(true)}
                  className="bg-primary hover:bg-primary/95 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-soft transition-all"
                >
                  Upgrade Plan
                </button>
              )}
            </div>
          </div>
        )}
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Upload CSV / PDF Data</h3>
        
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="relative group cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 p-6 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800 hover:border-primary/50 text-center flex flex-col items-center justify-center">
            <input
              id="report-input"
              type="file"
              accept=".csv,.pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={uploading}
            />
            <div className="flex flex-col items-center">
              <FileUp className="h-8 w-8 text-primary dark:text-primary-light mb-2.5" />
              {file ? (
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-xs truncate">
                  {file.name}
                </div>
              ) : (
                <>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Choose file or drag here</span>
                  <span className="text-[10px] text-slate-400 font-semibold mt-1">Supports CSV & PDF exports</span>
                </>
              )}
            </div>
          </div>

          {message && (
            <div className={`p-4 text-xs font-semibold rounded-2xl border flex items-start gap-3 shadow-xs transition-all ${
              message.isError 
                ? 'bg-rose-50/90 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/50' 
                : 'bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50'
            }`}>
              <div className={`p-1.5 rounded-xl shrink-0 ${message.isError ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                {message.isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              </div>
              <div className="flex-1 pt-0.5 leading-relaxed">
                {message.text}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full bg-primary hover:bg-primary/95 dark:bg-primary-dark text-white font-bold text-xs py-3 rounded-2xl transition-all shadow-soft flex items-center justify-center disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Upload Report'
            )}
          </button>
        </form>
      </motion.div>


      {/* Export Custom PDF Report Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.02)] mb-6"
      >
        <h3 className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
          <DownloadCloud className="h-4 w-4 text-primary dark:text-primary-light" />
          <span>Export Health Summary PDF</span>
        </h3>
        <p className="text-xs text-slate-400 font-semibold mb-4">
          Generate a beautiful, comprehensive PDF report with your matched food and glucose trends.
        </p>
        {/* Quick range pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { label: 'Today', value: 'day' },
            { label: 'Last 7 Days', value: 'week' },
            { label: 'Last 30 Days', value: 'month' },
            { label: 'All Time', value: 'all' },
            { label: 'Custom', value: 'custom' },
          ].map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => { setExportRange(value); if (value !== 'custom') { setExportCustomFrom(''); setExportCustomTo(''); } }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                exportRange === value
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {exportRange === 'custom' && (
          <div className="flex items-center gap-2 mb-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">From</span>
            <input
              type="date"
              value={exportCustomFrom}
              max={exportCustomTo || getTodayStr()}
              onChange={(e) => setExportCustomFrom(e.target.value)}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-transparent focus:outline-none border-none cursor-pointer flex-1"
            />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">To</span>
            <input
              type="date"
              value={exportCustomTo}
              min={exportCustomFrom}
              max={getTodayStr()}
              onChange={(e) => setExportCustomTo(e.target.value)}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-transparent focus:outline-none border-none cursor-pointer flex-1"
            />
          </div>
        )}

        <button
          onClick={handleDownloadUserReport}
          className="w-full bg-primary hover:bg-primary/95 dark:bg-primary-dark text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-soft transition-all flex items-center justify-center gap-1.5"
        >
          <FileText className="h-3.5 w-3.5" />
          Download PDF
        </button>
      </motion.div>

      {/* Upload History list */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <div className="flex items-center space-x-2 mb-4">
          <History className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Report History</h3>
        </div>

        <div className="space-y-3.5">
          {history.length === 0 ? (
            <div className="text-center p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl text-xs font-semibold text-slate-400 shadow-[0_12px_24px_rgba(0,0,0,0.02)]">
              No reports uploaded yet.
            </div>
          ) : (
            history.map((report) => (
              <motion.div 
                key={report._id} 
                whileHover={{ scale: 1.01 }}
                className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.02)] flex items-center justify-between transition-all hover:shadow-md"
              >
                <div className="flex items-start space-x-3.5 max-w-[70%]">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl mt-0.5 shrink-0">
                    <FileText className="h-5 w-5 text-primary dark:text-primary-light" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px] sm:max-w-xs" title={report.fileName}>
                      {report.fileName}
                    </h4>
                    <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 block mt-0.5">
                      {new Date(report.updatedAt || report.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                    <div className="flex items-center space-x-1.5 mt-1.5">
                      {report.status === 'Processed' && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {report.parsedReadingsCount > 0 ? (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3 mr-1 shrink-0 text-emerald-500 dark:text-emerald-400" />
                              {report.parsedReadingsCount} readings
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 flex items-center bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3 mr-1 shrink-0 text-blue-500 dark:text-blue-400" />
                              Summary Data Available
                            </span>
                          )}
                          {report.detectedReportType && (
                            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {report.detectedReportType === 'LIBRE_WEBSITE_AGP_DAILY_LOG' ? 'LibreView PDF' : 'Scanned Daily Log'}
                            </span>
                          )}
                        </div>
                      )}
                      {report.status === 'Processing' && (
                        <span className="text-[9px] font-bold text-primary dark:text-primary-light flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
                          <Loader2 className="h-3 w-3 mr-1 shrink-0 animate-spin" />
                          Processing
                        </span>
                      )}
                      {report.status === 'Failed' && (
                        <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2.5 py-0.5 rounded-full" title={report.errorMessage}>
                          <XCircle className="h-3 w-3 mr-1 shrink-0 text-rose-500 dark:text-rose-400" />
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center space-x-1 shrink-0">
                  {features?.exportReports && (
                    <button
                      onClick={() => handleDownloadReport(report._id)}
                      className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-primary-light transition-all"
                      title="Download Original CSV/PDF"
                    >
                      <DownloadCloud className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleReprocess(report._id)}
                    disabled={reprocessingId === report._id || report.status === 'Processing'}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-50 shrink-0"
                    title="Reprocess"
                  >
                    <RefreshCw className={`h-4 w-4 ${reprocessingId === report._id ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setReportToDelete({ id: report._id, name: report.fileName })}
                    disabled={deletingId === report._id}
                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-50 shrink-0"
                    title="Delete Report"
                  >
                    {deletingId === report._id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Modern Premium Delete Confirmation Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm border border-slate-150 dark:border-slate-800 shadow-2xl animate-scaleIn text-slate-800 dark:text-slate-100 text-center">
            <div className="mx-auto w-12 h-12 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl flex items-center justify-center mb-3">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-1">Delete Report?</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed mb-5">
              Are you sure you want to delete <strong className="text-slate-700 dark:text-slate-200">{reportToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-extrabold py-3 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteReport}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold py-3 rounded-2xl transition-all shadow-md shadow-rose-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
