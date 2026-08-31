import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Trash2, Search, 
  X, MessageSquare, Clock, CheckCircle2, 
  Send, User, RefreshCw, Stethoscope, Image, Maximize2, ExternalLink
} from 'lucide-react';

interface PatientQuery {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: string;
  subject: string;
  question: string;
  status: 'pending' | 'answered';
  isPaid?: boolean;
  amountPaid?: number;
  isFreeQuotaUsed?: boolean;
  adminReply?: string;
  repliedBy?: string;
  repliedAt?: string;
  allowImageUpload?: boolean;
  patientImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminAskMitoTopicsProps {
  apiUrl: string;
  token: string;
}

const REPLY_TEMPLATES = [
  {
    label: 'Nutrition & Diet Guidance',
    text: 'Thank you for reaching out. Based on your health focus, we recommend prioritizing polyphenol-rich foods (berries, dark leafy greens, and turmeric) while minimizing refined carbohydrates and inflammatory seed oils to support mitochondrial repair.'
  },
  {
    label: 'CGM & Glucose Spike Advice',
    text: 'Thank you for sharing your query. Post-meal glucose spikes can be reduced by combining carbohydrates with healthy proteins/fats and engaging in a brisk 15-20 minute walk immediately after meals.'
  },
  {
    label: 'Fasting & Autophagy Protocol',
    text: 'For optimal cellular autophagy and metabolic recovery, aim for a 14-to-16-hour overnight circadian fasting window. Ensure adequate hydration with electrolytes during fasting hours.'
  },
  {
    label: 'Physician Consultation Recommendation',
    text: 'While these lifestyle adjustments support cellular defense, we advise discussing these specific lab results or medication adjustments with your primary physician or oncologist during your next consultation.'
  }
];

export const AdminAskMitoTopics: React.FC<AdminAskMitoTopicsProps> = ({ apiUrl, token }) => {
  // Queries State
  const [queries, setQueries] = useState<PatientQuery[]>([]);
  const [queriesLoading, setQueriesLoading] = useState<boolean>(true);
  const [queryFilter, setQueryFilter] = useState<'all' | 'pending' | 'answered'>('all');
  const [querySearch, setQuerySearch] = useState<string>('');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [globalImageUploadEnabled, setGlobalImageUploadEnabled] = useState<boolean>(true);

  // Active Reply Modal & Lightbox Viewer
  const [activeQueryForReply, setActiveQueryForReply] = useState<PatientQuery | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [sendingReply, setSendingReply] = useState<boolean>(false);
  const [viewingFullImage, setViewingFullImage] = useState<string | null>(null);

  // Helper to safely open images (including Data URIs) in a new tab
  const openImageInNewTab = (imageUrl: string) => {
    if (imageUrl.startsWith('data:')) {
      const win = window.open();
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Patient Diagnostic Image View</title>
              <style>
                body { margin: 0; background: #0f172a; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                img { max-width: 95%; max-height: 95vh; object-fit: contain; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
              </style>
            </head>
            <body>
              <img src="${imageUrl}" alt="Patient Diagnostic Image" />
            </body>
          </html>
        `);
        win.document.close();
      }
    } else {
      window.open(imageUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Fetch Patient Queries
  const fetchQueries = async () => {
    setQueriesLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/ask-mito/queries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const queryList: PatientQuery[] = Array.isArray(data) ? data : (data.queries || []);
        setQueries(queryList);
        if (typeof data.enableGlobalImageUpload === 'boolean') {
          setGlobalImageUploadEnabled(data.enableGlobalImageUpload);
        }
        const pending = typeof data.pendingCount === 'number' 
          ? data.pendingCount 
          : queryList.filter(q => q.status === 'pending').length;
        const answered = typeof data.answeredCount === 'number' 
          ? data.answeredCount 
          : queryList.filter(q => q.status === 'answered').length;
        setPendingCount(pending);
        setAnsweredCount(answered);
      }
    } catch (err) {
      console.error('Error fetching patient queries:', err);
    } finally {
      setQueriesLoading(false);
    }
  };

  const handleToggleGlobalImageUpload = async () => {
    const targetState = !globalImageUploadEnabled;
    try {
      const res = await fetch(`${apiUrl}/admin/ask-mito/toggle-global-image-upload`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: targetState })
      });

      if (res.ok) {
        setGlobalImageUploadEnabled(targetState);
        fetchQueries();
      } else {
        alert('Failed to update global image upload setting.');
      }
    } catch (err) {
      console.error('Error toggling global image upload:', err);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [token]);

  // Submit Doctor / Specialist Reply
  const handleSendReply = async () => {
    if (!activeQueryForReply || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch(`${apiUrl}/admin/ask-mito/queries/${activeQueryForReply._id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reply: replyText.trim() })
      });

      if (res.ok) {
        setActiveQueryForReply(null);
        setReplyText('');
        fetchQueries();
      } else {
        alert('Failed to send reply. Please try again.');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('Error sending reply.');
    } finally {
      setSendingReply(false);
    }
  };

  // Delete Query
  const handleDeleteQuery = async (queryId: string) => {
    if (!window.confirm('Are you sure you want to delete this patient inquiry?')) return;

    try {
      const res = await fetch(`${apiUrl}/admin/ask-mito/queries/${queryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        fetchQueries();
      } else {
        alert('Failed to delete query.');
      }
    } catch (err) {
      console.error('Error deleting query:', err);
    }
  };

  // Toggle Patient Image Upload Permission
  const handleToggleImageUpload = async (queryId: string, currentStatus: boolean | undefined) => {
    try {
      const targetState = currentStatus === false ? true : false;
      const res = await fetch(`${apiUrl}/admin/ask-mito/queries/${queryId}/toggle-image-upload`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ allowImageUpload: targetState })
      });

      if (res.ok) {
        fetchQueries();
      } else {
        alert('Failed to update image upload permission.');
      }
    } catch (err) {
      console.error('Error toggling image upload status:', err);
    }
  };

  // Filtered queries
  const safeQueries = Array.isArray(queries) ? queries : [];
  const filteredQueries = safeQueries.filter(q => {
    const matchesFilter = queryFilter === 'all' || q.status === queryFilter;
    const matchesSearch = 
      q.subject?.toLowerCase().includes(querySearch.toLowerCase()) ||
      q.question?.toLowerCase().includes(querySearch.toLowerCase()) ||
      q.category?.toLowerCase().includes(querySearch.toLowerCase()) ||
      q.userName?.toLowerCase().includes(querySearch.toLowerCase()) ||
      q.userEmail?.toLowerCase().includes(querySearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen text-slate-900 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ask Mito • Patient Consultations</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Review direct patient inquiries, track response times, and provide verified clinical advice.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleToggleGlobalImageUpload}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              globalImageUploadEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
            title="Click to toggle patient image upload functionality across all consultations"
          >
            <Image className="h-4 w-4" />
            <span>Patient Image Upload: {globalImageUploadEnabled ? 'ENABLED' : 'DISABLED'}</span>
          </button>

          <button
            onClick={fetchQueries}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Refresh Consultations"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Patient Queries Section */}
      <div className="space-y-5">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="p-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Questions</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{queries.length}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Response</p>
              <h3 className="text-xl font-black text-rose-600 mt-0.5">{pendingCount}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Answered by Team</p>
              <h3 className="text-xl font-black text-emerald-600 mt-0.5">{answeredCount}</h3>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setQueryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                queryFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({queries.length})
            </button>
            <button
              onClick={() => setQueryFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                queryFilter === 'pending'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setQueryFilter('answered')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                queryFilter === 'answered'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Answered ({answeredCount})
            </button>
          </div>

          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={querySearch}
              onChange={e => setQuerySearch(e.target.value)}
              placeholder="Search by patient, subject, category..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Queries List */}
        {queriesLoading ? (
          <div className="py-16 text-center text-xs font-semibold text-slate-400">
            Loading consultations...
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="py-16 text-center bg-white border border-slate-200/80 rounded-2xl p-8">
            <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">No patient inquiries found</p>
            <p className="text-xs text-slate-400 mt-1">Questions submitted from the Mito mobile app will appear here for review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQueries.map(q => {
              const isPending = q.status === 'pending';
              const createdDate = new Date(q.createdAt);
              const elapsedHours = Math.round((Date.now() - createdDate.getTime()) / (1000 * 60 * 60));
              const isOverdue = isPending && elapsedHours > 48;

              return (
                <div
                  key={q._id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                    isPending 
                      ? 'border-blue-200 hover:border-blue-300' 
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          {q.category || 'General'}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${
                          isPending
                            ? (isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200')
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isPending ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                          <span>{isPending ? (isOverdue ? `Overdue (${elapsedHours}h)` : `Pending (${elapsedHours}h ago)`) : 'Answered'}</span>
                        </span>
                        {q.isFreeQuotaUsed ? (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                            <span>✨ Free Sub Quota</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <span>💳 ₹{q.amountPaid || 100} Paid</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{q.subject}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Submitted on {createdDate.toLocaleDateString()} at {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setActiveQueryForReply(q);
                          setReplyText(q.adminReply || '');
                        }}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
                          isPending
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{isPending ? 'Write Reply' : 'Edit Reply'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteQuery(q._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Query"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Patient Info Card & Image Toggle */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 mb-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-bold text-slate-700">{q.userName}</span>
                      <span>•</span>
                      <span className="text-slate-600">{q.userEmail}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleImageUpload(q._id, q.allowImageUpload)}
                      className={`text-[10.5px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                        q.allowImageUpload !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                      title="Click to toggle whether patient can upload image for this inquiry"
                    >
                      <Image className="h-3.5 w-3.5" />
                      <span>{q.allowImageUpload !== false ? 'Patient Image Upload: Allowed' : 'Patient Image Upload: Disabled'}</span>
                    </button>
                  </div>

                  {/* Question Content */}
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 text-xs font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {q.question}
                  </div>

                  {/* Attached Patient Image View */}
                  {q.patientImageUrl && (
                    <div className="mt-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-start gap-3">
                      <Image className="h-4 w-4 text-blue-600 shrink-0 mt-1" />
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-blue-900 block">
                          Attached Patient Diagnostic Image / Lab Report:
                        </span>
                        <div 
                          onClick={() => setViewingFullImage(q.patientImageUrl!)}
                          className="relative group inline-block cursor-pointer mt-1"
                        >
                          <img 
                            src={q.patientImageUrl} 
                            alt="Patient diagnostic upload" 
                            className="h-44 max-w-xs object-cover rounded-xl border border-blue-200 shadow-xs group-hover:brightness-95 transition-all" 
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2 text-white font-bold text-xs">
                            <Maximize2 className="h-4 w-4" />
                            <span>Click to Expand</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin / Doctor Reply Section */}
                  {q.adminReply && (
                    <div className="mt-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                          <Stethoscope className="h-4 w-4 text-emerald-600" />
                          <span>Clinical Team Response</span>
                        </div>
                        {q.repliedAt && (
                          <span className="text-[10.5px] font-semibold text-emerald-700">
                            {new Date(q.repliedAt).toLocaleDateString()} ({q.repliedBy || 'Specialist'})
                          </span>
                        )}
                      </div>
                      <p className="text-emerald-900 leading-relaxed whitespace-pre-wrap mt-1">
                        {q.adminReply}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* REPLY MODAL                                                               */}
      {/* ========================================================================= */}
      {activeQueryForReply && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Reply to Patient Question</h3>
                  <p className="text-[11px] text-slate-500">Patient: {activeQueryForReply.userName} ({activeQueryForReply.userEmail})</p>
                </div>
              </div>
              <button
                onClick={() => setActiveQueryForReply(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Question summary banner */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                  Category: {activeQueryForReply.category}
                </span>
                <h4 className="font-bold text-xs text-slate-900 mt-1">{activeQueryForReply.subject}</h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">{activeQueryForReply.question}</p>
              </div>

              {/* Quick response templates */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Insert Clinical Template
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {REPLY_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReplyText(tmpl.text)}
                      className="text-left p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-[11px] text-slate-700 transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-slate-900 block">{tmpl.label}</span>
                      <span className="text-slate-500 line-clamp-2 mt-0.5 text-[10px]">{tmpl.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Clinical Response Text
                </label>
                <textarea
                  rows={6}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your medical / nutritional guidance here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Response will be instantly delivered to user app</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveQueryForReply(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{sendingReply ? 'Sending...' : 'Send Reply to Patient'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIGHTBOX / FULLSCREEN IMAGE VIEWER MODAL                                  */}
      {/* ========================================================================= */}
      {viewingFullImage && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            {/* Top Action Bar */}
            <div className="w-full flex items-center justify-between p-3 bg-slate-900/90 border border-slate-800 rounded-2xl mb-3 text-white shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Image className="h-4 w-4 text-blue-400" />
                <span>Patient Diagnostic Image Viewer</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openImageInNewTab(viewingFullImage)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Open in full browser window"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open Full Window</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingFullImage(null)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                  title="Close Viewer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Image Viewport */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 overflow-hidden shadow-2xl flex items-center justify-center max-h-[82vh] w-full">
              <img 
                src={viewingFullImage} 
                alt="Patient Diagnostic Full View" 
                className="max-h-[78vh] max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
