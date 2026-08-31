import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Loader2,
  Stethoscope, Clock, CheckCircle2, Plus, RefreshCw,
  MessageSquare, ChevronDown, Sparkles, User, ShieldCheck, CreditCard,
  AlertTriangle, UploadCloud
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PatientQuery {
  _id: string;
  subject: string;
  category: string;
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
}

interface QuotaStatus {
  isSubscribed: boolean;
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  totalFreeQuestions: number;
  freeQuestionsUsed: number;
  remainingFreeQuestions: number;
  questionFee: number;
  isSandbox: boolean;
  razorpayKeyId?: string;
  enableGlobalImageUpload?: boolean;
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
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  
  // Form State
  const [newSubject, setNewSubject] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('CGM & Glucose Reports');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [newQuestion, setNewQuestion] = useState<string>('');
  const [patientImageUrl, setPatientImageUrl] = useState<string>('');
  const [imageUploading, setImageUploading] = useState<boolean>(false);
  const [submittingQuestion, setSubmittingQuestion] = useState<boolean>(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('File size exceeds 8MB limit. Please choose a smaller image.');
      return;
    }

    setImageUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPatientImageUrl(reader.result as string);
      setImageUploading(false);
    };
    reader.onerror = () => {
      setImageUploading(false);
      alert('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

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

  // Fetch Quota Status & Fee
  const fetchQuotaStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/ask-mito/quota-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuotaStatus(data);
      }
    } catch (err) {
      console.error('Error fetching quota status:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMyQueries();
      fetchQuotaStatus();
    }
  }, [isOpen]);

  // Final Query Submitter (handles either free quota or verified payment details)
  const submitFinalQuery = async (paymentDetails?: any) => {
    if (!newSubject.trim() || !newQuestion.trim() || !token) return;

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
          userEmail: (user as any)?.email || '',
          patientImageUrl: patientImageUrl || undefined,
          paymentDetails
        })
      });

      if (res.ok) {
        setNewSubject('');
        setCustomCategory('');
        setNewQuestion('');
        setPatientImageUrl('');
        setShowNewQuestionModal(false);
        setSubmitSuccessMsg('Submitted! Our clinical team will review and reply within 48 hours.');
        fetchMyQueries();
        fetchQuotaStatus();
        setTimeout(() => setSubmitSuccessMsg(null), 7000);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to submit question. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting question:', err);
      alert('Error submitting question. Please check your network connection.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  // Submit Question Handler (determines free quota vs ₹100 payment flow)
  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newQuestion.trim() || !token) return;

    if (newCategory === 'Others' && !customCategory.trim()) {
      alert('Please specify your health topic or category.');
      return;
    }

    // 1. If user has free question quota remaining on active subscription, submit immediately (₹0)
    if (quotaStatus && quotaStatus.remainingFreeQuestions > 0) {
      await submitFinalQuery();
      return;
    }

    // 2. Otherwise, initiate paid order for ₹100
    setSubmittingQuestion(true);
    try {
      const orderRes = await fetch(`${apiUrl}/ask-mito/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!orderRes.ok) {
        throw new Error('Failed to initiate consultation order.');
      }

      const orderData = await orderRes.json();

      if (orderData.gateway === 'razorpay' && (window as any).Razorpay) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount, // amount in paise from Razorpay order
          currency: orderData.currency || 'INR',
          name: 'Mito Reboot',
          description: 'Doctor Consultation Question (48h Reply SLA)',
          order_id: orderData.orderId,
          handler: async (response: any) => {
            await submitFinalQuery({
              gateway: 'razorpay',
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });
          },
          prefill: {
            name: (user as any)?.name || 'Patient',
            email: (user as any)?.email || '',
            contact: (user as any)?.phone || ''
          },
          theme: { color: '#2563EB' },
          retry: {
            enabled: true,
            max_count: 4
          },
          modal: {
            backdropclose: false,
            escape: false,
            handleback: false,
            ondismiss: () => {
              setSubmittingQuestion(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (resp: any) => {
          console.warn('[AskMito] Razorpay payment failed event:', resp?.error);
          setQuestionError(resp?.error?.description || resp?.error?.reason || 'Payment could not be completed.');
          setSubmittingQuestion(false);
        });
        rzp.open();
      } else {
        // Mock gateway instant sandbox payment
        await submitFinalQuery({
          gateway: 'mock',
          orderId: orderData.orderId,
          paymentId: `mock_pay_${Date.now()}`
        });
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      alert(err.message || 'Error initializing consultation payment.');
      setSubmittingQuestion(false);
    }
  };

  if (!isOpen) return null;

  const hasFreeQuota = (quotaStatus?.remainingFreeQuestions ?? 0) > 0;
  const questionFee = quotaStatus?.questionFee ?? 100;

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
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                  <span>Clinical Team Active • Reply &lt;48h</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  fetchMyQueries();
                  fetchQuotaStatus();
                }}
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
          {/* Plan Quota or Per-Question Fee Banner */}
          {quotaStatus && (
            hasFreeQuota ? (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11.5px] font-black text-emerald-900 dark:text-emerald-200">
                      {quotaStatus.remainingFreeQuestions} Free Question{quotaStatus.remainingFreeQuestions > 1 ? 's' : ''} Remaining
                    </p>
                    <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-semibold">
                      Included with your subscription • 48h Response SLA
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-600 text-white rounded-md shrink-0">
                  FREE
                </span>
              </div>
            ) : (
              <div 
                onClick={() => setShowNewQuestionModal(true)}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl p-3 flex items-center justify-between shadow-xs cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11.5px] font-black text-blue-950 dark:text-blue-200">
                      Doctor Consultation: ₹{questionFee} / Question
                    </p>
                    <p className="text-[10px] text-blue-700/80 dark:text-blue-400/80 font-semibold">
                      Verified Clinical Review within 48 hours
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNewQuestionModal(true);
                  }}
                  className="text-[10.5px] font-black px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-xs shrink-0 cursor-pointer active:scale-95 transition-all"
                >
                  Ask Now
                </button>
              </div>
            )
          )}

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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-xl">
                            {q.category}
                          </span>
                          {q.isFreeQuotaUsed ? (
                            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                              ✨ Free Quota
                            </span>
                          ) : (
                            <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                              💳 ₹{q.amountPaid || 100} Paid
                            </span>
                          )}
                        </div>
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
                        {q.patientImageUrl && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Attached Diagnostic Image / Report
                            </span>
                            <a href={q.patientImageUrl} target="_blank" rel="noopener noreferrer">
                              <img 
                                src={q.patientImageUrl} 
                                alt="Attached patient report" 
                                className="h-36 max-w-xs object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:opacity-90 transition-opacity" 
                              />
                            </a>
                          </div>
                        )}
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
            <span>
              {hasFreeQuota ? 'Ask a Doctor (Free with Plan)' : `Ask a Doctor (₹${questionFee})`}
            </span>
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
                    className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {questionError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-semibold rounded-2xl border border-red-200 dark:border-red-800 flex items-center justify-between">
                    <span>{questionError}</span>
                    <button type="button" onClick={() => setQuestionError(null)} className="text-red-500 hover:text-red-700">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Quota & Pricing Summary Card */}
                {hasFreeQuota ? (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <span className="font-bold text-emerald-950 dark:text-emerald-200 block">
                          Included Free with Subscription
                        </span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          {quotaStatus?.remainingFreeQuestions} free question{quotaStatus?.remainingFreeQuestions !== 1 ? 's' : ''} left in this cycle
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 bg-emerald-600 text-white rounded-lg">
                      ₹0
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-blue-950 dark:text-blue-200 block">
                        Doctor Consultation Fee
                      </span>
                      <span className="text-[11px] text-blue-700 dark:text-blue-400">
                        Detailed review by clinical team within 48h
                      </span>
                    </div>
                    <span className="text-sm font-black text-blue-700 dark:text-blue-300">
                      ₹{questionFee}
                    </span>
                  </div>
                )}

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

                {/* Image Attachment & Policy Warning Section */}
                {quotaStatus?.enableGlobalImageUpload === false ? (
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs text-slate-500 font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Image attachments are currently disabled by the system administrator.</span>
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Attach Diagnostic Image / Lab Report (Optional)
                    </label>

                    {/* Strict Policy & Guidelines Callout */}
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl flex items-start gap-2.5 text-xs">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                        <strong className="font-bold text-amber-950 dark:text-amber-100 block mb-0.5">
                          Medical Image Guidelines & Compliance Notice:
                        </strong>
                        Only upload clear photos of lab reports, CGM glucose readings, food items, or relevant diagnostic charts.
                        <span className="text-rose-600 dark:text-rose-400 font-extrabold block mt-1">
                          🚫 Strictly NO nudity, explicit, offensive, or non-medical personal images. Violations result in immediate permanent account suspension.
                        </span>
                      </div>
                    </div>

                    {patientImageUrl ? (
                      <div className="relative inline-block mt-2">
                        <img 
                          src={patientImageUrl} 
                          alt="Uploaded preview" 
                          className="h-28 w-auto object-cover rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setPatientImageUrl('')}
                          className="absolute -top-2 -right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-sm"
                          title="Remove image"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-3.5 bg-slate-50 dark:bg-slate-800/80 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-2xl cursor-pointer transition-colors text-xs font-bold text-slate-600 dark:text-slate-300">
                        {imageUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span>Processing Image...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-4 w-4 text-blue-600" />
                            <span>Choose Diagnostic Image / Report Photo</span>
                          </>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageFileChange} 
                          className="hidden" 
                          disabled={imageUploading}
                        />
                      </label>
                    )}
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewQuestionModal(false)}
                    className="flex-1 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingQuestion || !newSubject.trim() || !newQuestion.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white rounded-2xl text-xs font-black shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {submittingQuestion ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>
                      {hasFreeQuota ? 'Submit Question (Free)' : `Pay ₹${questionFee} & Submit`}
                    </span>
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
