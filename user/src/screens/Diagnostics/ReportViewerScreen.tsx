import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { downloadFile } from '../../utils/fileDownloader';

interface ReportViewerScreenProps {
  bookingId: string;
  onBack: () => void;
}

export const ReportViewerScreen: React.FC<ReportViewerScreenProps> = ({ bookingId, onBack }) => {
  const { apiUrl, token } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [bookingId]);

  const fetchReport = async () => {
    try {
      const res = await fetch(`${apiUrl}/labs/booking/${bookingId}/report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!report?.pdfUrl || downloading) return;
    setDownloading(true);
    try {
      const fullUrl = report.pdfUrl.startsWith('http')
        ? report.pdfUrl
        : `${apiUrl.replace(/\/api$/, '')}${report.pdfUrl}`;
      await downloadFile({
        url: fullUrl,
        filename: `LabReport-${report._id.slice(-6).toUpperCase()}.pdf`,
        token
      });
      showToast(t('reportDownloaded', 'Report downloaded successfully.'), 'success');
    } catch (err: any) {
      console.error('Error downloading lab report:', err);
      showToast(err.message || 'Failed to download report.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400 font-bold animate-pulse">{t('common.loading', 'Loading report...')}</div>;
  if (!report) return (
    <div className="p-10 text-center flex flex-col items-center">
      <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
      <span className="text-slate-500 font-bold">{t('reportNotFound', 'Report not found.')}</span>
      <button onClick={onBack} className="mt-4 text-indigo-600 font-bold">{t('nav.back', 'Go Back')}</button>
    </div>
  );

  return (
    <div className="pb-32 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">{t('reportTitle', 'Diagnostic Results')}</span>
          <h2 className="text-xl font-bold text-slate-800 leading-none mt-1 truncate">Report #{report._id.slice(-6).toUpperCase()}</h2>
        </div>
        
        {report.pdfUrl && (
          <button 
            onClick={handleDownload}
            disabled={downloading}
            className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 transition-all shrink-0"
            title={t('downloadPdfReport', 'Download PDF Report')}
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-6 flex-1 flex flex-col">
        {report.pdfUrl ? (
          <div className="flex-1 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex flex-col items-center justify-center relative min-h-[400px]">
            <FileText className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="font-bold text-slate-700">{t('pdfReportAvailable', 'PDF Report Available')}</h3>
            <p className="text-xs text-slate-500 mb-6 max-w-xs text-center mt-2">{t('pdfReportReadyDesc', 'Your detailed diagnostic results are ready. Download or view them externally.')}</p>
            <button 
              onClick={handleDownload}
              disabled={downloading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 transition-all"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('common.downloading', 'Downloading...')}</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>{t('downloadPdfReport', 'Download PDF Report')}</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
             <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
             <p className="text-slate-500 font-bold">{t('common.noDataFound', 'No PDF attached.')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
