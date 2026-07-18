import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, ExternalLink, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ReportViewerScreenProps {
  bookingId: string;
  onBack: () => void;
}

export const ReportViewerScreen: React.FC<ReportViewerScreenProps> = ({ bookingId, onBack }) => {
  const { apiUrl, token } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-10 text-center text-slate-400 font-bold animate-pulse">Loading report...</div>;
  if (!report) return (
    <div className="p-10 text-center flex flex-col items-center">
      <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
      <span className="text-slate-500 font-bold">Report not found.</span>
      <button onClick={onBack} className="mt-4 text-indigo-600 font-bold">Go Back</button>
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
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Diagnostic Results</span>
          <h2 className="text-xl font-bold text-slate-800 leading-none mt-1 truncate">Report #{report._id.slice(-6).toUpperCase()}</h2>
        </div>
        
        {report.pdfUrl && (
          <a 
            href={report.pdfUrl}
            download
            className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-all shrink-0"
          >
            <Download className="h-4 w-4" />
          </a>
        )}
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-6 flex-1 flex flex-col">
        {report.pdfUrl ? (
          <div className="flex-1 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex flex-col items-center justify-center relative min-h-[400px]">
            {/* For a real app, you might use a PDF viewer component here, or an iframe.
                Since iframes can be tricky with auth/CORS in web, we provide a button to open it. */}
            <FileText className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="font-bold text-slate-700">PDF Report Available</h3>
            <p className="text-xs text-slate-500 mb-6 max-w-xs text-center mt-2">Your detailed diagnostic results are ready. Download or view them externally.</p>
            <a 
              href={report.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2"
            >
              Open PDF Document <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
             <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
             <p className="text-slate-500 font-bold">No PDF attached.</p>
          </div>
        )}
      </div>
    </div>
  );
};
