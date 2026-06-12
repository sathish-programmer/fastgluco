import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileUp, 
  History, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  FileText,
  CreditCard,
  DownloadCloud,
  Lock,
  Trash2
} from 'lucide-react';

interface ReportsProps {
  onNavigateToTab?: (tab: string) => void;
  features?: any;
}

export const Reports: React.FC<ReportsProps> = ({ onNavigateToTab, features }) => {
  const { token, apiUrl } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [token]);

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
        setShowUpgradePrompt(false);
      }
    } catch (err) {
      console.error('Error fetching upload history:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage(null);
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
        setMessage({ text: `Success: Loaded ${data.readingsCount} readings.`, isError: false });
        setFile(null);
        // Clear input element
        const fileInput = document.getElementById('report-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        fetchHistory();
      } else {
        throw new Error(data.message || data.error || 'Failed to parse file.');
      }
    } catch (err: any) {
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
        fetchHistory();
      } else {
        alert(data.message || 'Reprocessing failed.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReprocessingId(null);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!token || !window.confirm('Delete this report? This cannot be undone.')) return;
    setDeletingId(reportId);
    try {
      const response = await fetch(`${apiUrl}/reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setHistory(prev => prev.filter(r => r._id !== reportId));
      } else {
        const data = await response.json();
        alert(data.message || 'Delete failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting report.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadReport = async (reportId: string, fileName: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${apiUrl}/reports/${reportId}/download`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 402 || response.status === 403) {
        setShowUpgradePrompt(true);
        return;
      }
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        alert(data.message || 'Download failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error downloading file.');
    }
  };

  if (showUpgradePrompt) {
    return (
      <div className="pb-24 pt-12 px-6 max-w-lg mx-auto bg-white min-h-[80vh] flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-4 shadow-soft">
          <CreditCard className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-800">Premium Feature Locked</h3>
        <p className="text-xs text-slate-500 font-semibold max-w-xs mt-2 mb-6">
          CGM Report Upload requires an active Basic or Premium Plan. Unlock unlimited uploads, analysis, and custom alerts.
        </p>
        <button
          onClick={() => {
            if (onNavigateToTab) {
              onNavigateToTab('Profile');
            }
          }}
          className="bg-primary hover:bg-primary-dark text-white font-extrabold px-6 py-3 rounded-2xl shadow-soft transition-all"
        >
          View Subscription Plans
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto bg-white min-h-screen">
      {/* Title */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">CGM Reports</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Upload Abbott FreeStyle Libre exported reports (.csv or .pdf)
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-500"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Upload Form Card - Premium Feature */}
      <div className="bg-cardBg p-5 rounded-3xl border border-slate-100 shadow-soft mb-6 relative">
        {!features?.unlimitedReports && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center p-4">
            <div className="bg-white p-4 rounded-2xl shadow-lg text-center max-w-xs border border-slate-100">
              <Lock className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800 mb-1">Premium Feature</h4>
              <p className="text-xs text-slate-500 font-semibold mb-3">Upgrade to a premium plan to import new CGM reports.</p>
              <button 
                onClick={() => setShowUpgradePrompt(true)}
                className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        )}
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 hover:border-primary/50 transition-all rounded-2xl p-6 text-center bg-white cursor-pointer relative">
            <input
              id="report-input"
              type="file"
              accept=".csv,.pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center">
              <FileUp className="h-10 w-10 text-primary mb-3" />
              {file ? (
                <div className="text-sm font-semibold text-slate-700 max-w-xs truncate">
                  {file.name}
                </div>
              ) : (
                <>
                  <span className="text-sm font-bold text-slate-700">Choose file or drag here</span>
                  <span className="text-xs text-slate-400 font-semibold mt-1">Supports CSV and PDF exports</span>
                </>
              )}
            </div>
          </div>

          {message && (
            <div className={`p-3 text-xs font-semibold rounded-xl border ${
              message.isError ? 'bg-red-50 text-danger border-red-100' : 'bg-green-50 text-success border-green-100'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-extrabold text-sm py-3.5 rounded-2xl transition-all shadow-sm shadow-primary/20 flex items-center justify-center disabled:opacity-50"
          >
            {uploading ? (
              <>
                <RefreshCw className="h-4.5 w-4.5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 mr-2" />
                <span>Upload & Parse Readings</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Upload History list */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <History className="h-5 w-5 text-slate-500" />
          <h3 className="text-base font-bold text-slate-700">Report History</h3>
        </div>

        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center p-8 bg-cardBg border border-slate-100 rounded-3xl text-sm font-semibold text-slate-400">
              No reports uploaded yet.
            </div>
          ) : (
            history.map((report) => (
              <div 
                key={report._id} 
                className="bg-cardBg p-4 rounded-2xl border border-slate-100 shadow-soft flex items-center justify-between"
              >
                <div className="flex items-start space-x-3 max-w-[70%]">
                  <div className="p-2 bg-white border border-slate-100 rounded-xl mt-0.5 shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 truncate max-w-xs" title={report.fileName}>
                      {report.fileName}
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {new Date(report.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                    <div className="flex items-center space-x-1.5 mt-1">
                      {report.status === 'Processed' && (
                        <span className="text-[10px] font-bold text-success flex items-center bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3 mr-1 shrink-0" />
                          {report.parsedReadingsCount} readings
                        </span>
                      )}
                      {report.status === 'Processing' && (
                        <span className="text-[10px] font-bold text-primary flex items-center bg-blue-50 px-2 py-0.5 rounded-full">
                          <Loader2 className="h-3 w-3 mr-1 shrink-0 animate-spin" />
                          Processing
                        </span>
                      )}
                      {report.status === 'Failed' && (
                        <span className="text-[10px] font-bold text-danger flex items-center bg-red-50 px-2 py-0.5 rounded-full" title={report.errorMessage}>
                          <XCircle className="h-3 w-3 mr-1 shrink-0" />
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center space-x-1">
                  {features?.exportReports && (
                    <button
                      onClick={() => handleDownloadReport(report._id, report.fileName)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-white hover:text-primary transition-all shadow-sm border border-transparent hover:border-slate-100"
                      title="Download Original CSV/PDF"
                    >
                      <DownloadCloud className="h-4.5 w-4.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleReprocess(report._id)}
                    disabled={reprocessingId === report._id || report.status === 'Processing'}
                    className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500 hover:text-slate-700 disabled:opacity-50 shrink-0"
                    title="Reprocess"
                  >
                    <RefreshCw className={`h-4 w-4 ${reprocessingId === report._id ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleDeleteReport(report._id)}
                    disabled={deletingId === report._id}
                    className="p-2 hover:bg-red-50 rounded-full transition-all text-slate-400 hover:text-danger disabled:opacity-50 shrink-0"
                    title="Delete Report"
                  >
                    {deletingId === report._id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
