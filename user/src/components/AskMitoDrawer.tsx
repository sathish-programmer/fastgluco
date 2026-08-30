import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Loader2,
  Stethoscope, Clock, CheckCircle2, Plus, RefreshCw,
  MessageSquare, ChevronDown, Sparkles, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PatientQuery {
  _id: string;
  subject: string;
  category: string;
  question: string;
  status: 'pending' | 'answered';
  adminReply?: string;
  repliedBy?: string;
  repliedAt?: string;
  createdAt: string;
}

interface AskMitoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

const QUESTION_CATEGORIES = [
  'CGM & Glucose Reports',
  'Anti-Cancer Nutrition & Diet',
  'Circadian Fasting Protocol',
  'PCOS & Hormonal Health',
  'Hypertension & Blood Pressure',
  'Parkinson\'s & Motor Health',
  'Sleep & Recovery',
  'General Medical / App Query',
  'Others'
];

export const AskMitoDrawer: React.FC<AskMitoDrawerProps> = ({ isOpen, onClose }) => {
  const { token, user } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  // State
  const [queries, setQueries] = useState<PatientQuery[]>([]);
  const [loadingQueries, setLoadingQueries] = useState<boolean>(false);
  const [showNewQuestionModal, setShowNewQuestionModal] = useState<boolean>(false);
  
  // Form State
  const [newSubject, setNewSubject] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('CGM & Glucose Reports');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [newQuestion, setNewQuestion] = useState<string>('');
  const [submittingQuestion, setSubmittingQuestion] = useState<boolean>(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Fetch Patient's Consultations
  const fetchMyQueries = async () => {
    if (!token) return;
    setLoadingQueries(true);
    try {
      const res = await fetch(`${apiUrl}/ask-mito/my-queries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQueries(data || []);
      }
    } catch (err) {
      console.error('Error fetching consultations:', err);
    } finally {
      setLoadingQueries(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMyQueries();
    }
  }, [isOpen]);

  // Submit Question
  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newQuestion.trim() || !token) return;

    if (newCategory === 'Others' && !customCategory.trim()) {
      alert('Please specify your health topic or category.');
      return;
    }

    const finalCategory = newCategory === 'Others' && customCategory.trim()
      ? `Other: ${customCategory.trim()}`
      : newCategory;

    setSubmittingQuestion(true);
    setSubmitSuccessMsg(null);
    try {
      const res = await fetch(`${apiUrl}/ask-mito/queries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: newSubject.trim(),
          category: finalCategory,
          question: newQuestion.trim(),
          userName: (user as any)?.name || 'Patient',
          userEmail: (user as any)?.email || ''
        })
      });

      if (res.ok) {
        setNewSubject('');
        setCustomCategory('');
        setNewQuestion('');
        setShowNewQuestionModal(false);
        setSubmitSuccessMsg('Submitted! Our medical team will review and reply within 48 hours.');
        fetchMyQueries();
        setTimeout(() => setSubmitSuccessMsg(null), 7000);
      } else {
        alert('Failed to submit question. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting question:', err);
      alert('Error submitting question. Please check network connection.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-all"
      />

      {/* Drawer Container */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="relative w-full max-w-md bg-[#F8FAFC] dark:bg-[#0B1120] h-[100dvh] max-h-[100dvh] shadow-2xl flex flex-col z-10 overflow-hidden font-sans border-l border-slate-200/80 dark:border-slate-800"
      >
        {/* ========================================================================= */}
        {/* ULTRA-CLEAN MODERN TELEHEALTH TOP BAR                                     */}
        {/* ========================================================================= */}
        <div className="bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl px-5 pt-[max(env(safe-area-inset-top),16px)] pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0 z-20 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0F172A]" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  Doctor Consultation
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Clinical Team Active • Reply &lt;48h</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={fetchMyQueries}
                className="h-8.5 w-8.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button 
                onClick={onClose} 
                className="h-8.5 w-8.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TIMELINE CONSULTATIONS STREAM                                             */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Success Banner */}
          {submitSuccessMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2.5 shadow-xs"
            >
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
              <span className="leading-snug">{submitSuccessMsg}</span>
            </motion.div>
          )}

          {/* Loading Indicator */}
          {loadingQueries ? (
            <div className="py-24 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              <span>Loading consultations...</span>
            </div>
          ) : queries.length === 0 ? (
            /* Empty State */
            <div className="py-20 px-6 text-center">
              <div className="h-16 w-16 rounded-3xl bg-white dark:bg-slate-800/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-slate-200/80 dark:border-slate-700 shadow-sm">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                No Consultations Yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
                Have questions regarding your glucose spikes, lab reports, or diet? Tap the button below to get verified medical advice within 48 hours.
              </p>
            </div>
          ) : (
            /* Modern Conversational Thread Cards */
            <div className="space-y-4">
              {queries.map(q => {
                const isAnswered = q.status === 'answered';
                const createdDate = new Date(q.createdAt);

                return (
                  <div 
                    key={q._id}
                    className="bg-white dark:bg-[#111A2E] rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4"
                  >
                    {/* Header Row: Subject, Category Pill & Status Tag */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                      <div className="space-y-1">
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded-xl">
                          {q.category}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug pt-1">
                          {q.subject}
                        </h4>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          {createdDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} at {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <span className={`text-[10.5px] font-bold px-3 py-1 rounded-full border shrink-0 flex items-center gap-1.5 ${
                        isAnswered
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isAnswered ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
                        {isAnswered ? 'Doctor Replied' : 'Under Review'}
                      </span>
                    </div>

                    {/* Patient Question Bubble */}
                    <div className="flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0 mt-0.5">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Your Inquiry
                        </span>
                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-wrap">
                          {q.question}
                        </p>
                      </div>
                    </div>

                    {/* Doctor Clinical Response */}
                    {isAnswered && q.adminReply ? (
                      <div className="flex items-start gap-2.5 pt-1">
                        <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                          <Stethoscope className="h-4 w-4" />
                        </div>
                        <div className="flex-1 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 p-4 rounded-2xl rounded-tl-sm space-y-2">
                          <div className="flex items-center justify-between border-b border-emerald-500/15 dark:border-emerald-800/40 pb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-emerald-950 dark:text-emerald-200 text-xs">
                                Clinical Team Response
                              </span>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            {q.repliedAt && (
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                {new Date(q.repliedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 font-medium leading-relaxed whitespace-pre-wrap">
                            {q.adminReply}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300 font-semibold bg-amber-50/80 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-900/50">
                        <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Doctor is reviewing your health parameters. Reply will appear here within 48 hours.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* DOCKED BOTTOM ACTION BUTTON                                               */}
        {/* ========================================================================= */}
        <div className="p-4 bg-white dark:bg-[#0F172A] border-t border-slate-200/80 dark:border-slate-800 shrink-0 z-20 shadow-lg">
          <button
            onClick={() => setShowNewQuestionModal(true)}
            className="w-full h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:opacity-95 active:scale-[0.98] text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Ask a New Medical Question</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SLIDE-UP CONSULTATION SUBMISSION MODAL                                    */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {showNewQuestionModal && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNewQuestionModal(false)}
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
              />

              <motion.form
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                onSubmit={handleQuestionSubmit}
                className="relative w-full max-w-md bg-white dark:bg-[#0F172A] rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">Ask Doctor</h4>
                      <p className="text-xs text-slate-400">Guaranteed clinical reply within 48 hours</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewQuestionModal(false)}
                    className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer appearance-none pr-9"
                    >
                      {QUESTION_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {newCategory === 'Others' && (
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                      Specify Health Topic
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      placeholder="e.g. Thyroid, Gut Microbiome, Fatty Liver..."
                      required={newCategory === 'Others'}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    Subject / Question Title
                  </label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    placeholder="e.g. Glucose spike after lunch"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    Detailed Symptoms & Inquiry
                  </label>
                  <textarea
                    rows={4}
                    value={newQuestion}
                    onChange={e => setNewQuestion(e.target.value)}
                    placeholder="Describe your health question, symptoms, food habits, or lab report numbers..."
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewQuestionModal(false)}
                    className="flex-1 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingQuestion || !newSubject.trim() || !newQuestion.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-xs font-black shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {submittingQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span>Submit Question</span>
                  </button>
                </div>
              </motion.form>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
