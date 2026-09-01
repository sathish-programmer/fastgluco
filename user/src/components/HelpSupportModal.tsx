import React, { useState, useEffect } from 'react';
import { X, Star, MessageSquare, Heart, Code2, Headphones, Send, Mail, Edit3, Trash2, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SubmittedFeedback {
  _id: string;
  rating: number;
  category: string;
  comment: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({ isOpen, onClose }) => {
  const { user, token, apiUrl, branding } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'FEEDBACK' | 'FOUNDER' | 'DEVELOPER' | 'CONTACT'>('FEEDBACK');

  // Feedback form state
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<string>('App Experience');
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [myFeedbacks, setMyFeedbacks] = useState<SubmittedFeedback[]>([]);

  useEffect(() => {
    if (isOpen && token) {
      fetchMyFeedback();
    }
  }, [isOpen, token]);

  const fetchMyFeedback = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/user/feedback/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyFeedbacks(data);
      }
    } catch (err) {
      console.error('Error fetching my feedback history:', err);
    }
  };

  const handleEditReview = (fb: SubmittedFeedback) => {
    setEditingFeedbackId(fb._id);
    setRating(fb.rating);
    setCategory(fb.category);
    setComment(fb.comment);
  };

  const handleCancelEdit = () => {
    setEditingFeedbackId(null);
    setRating(5);
    setCategory('App Experience');
    setComment('');
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await fetch(`${apiUrl}/user/feedback/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Review deleted successfully.', 'success');
        if (editingFeedbackId === id) handleCancelEdit();
        fetchMyFeedback();
      } else {
        showToast('Failed to delete review.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting review.', 'error');
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast('Please enter your feedback or review comments.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = editingFeedbackId ? `${apiUrl}/user/feedback/${editingFeedbackId}` : `${apiUrl}/user/feedback`;
      const method = editingFeedbackId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating,
          category,
          comment: comment.trim(),
          name: user?.name,
          email: user?.email
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || (editingFeedbackId ? 'Your review has been updated!' : 'Thank you for your rating & feedback!'), 'success');
        handleCancelEdit();
        fetchMyFeedback();
      } else {
        showToast(data.error || 'Failed to submit feedback.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while submitting feedback.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] max-w-xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col border-t sm:border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden relative font-sans antialiased text-slate-800 dark:text-slate-100">
        
        {/* Mobile Handle Bar Indicator */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-0.5 sm:hidden shrink-0"></div>

        {/* Sleek Mobile & Desktop Header */}
        <div className="px-5 sm:px-6 pt-3 sm:pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                Help, Support & Feedback
              </h2>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Your voice helps shape the future of {branding?.appName || 'Mito_Reboot'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile-Optimized Segmented Tab Bar (Guaranteed No Text Truncation) */}
        <div className="px-3 sm:px-5 pt-2.5 pb-1 bg-slate-50/30 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div className="bg-slate-100/80 dark:bg-slate-950 p-1 rounded-2xl flex gap-1 border border-slate-200/60 dark:border-slate-800/80">
            
            <button
              onClick={() => setActiveTab('FEEDBACK')}
              className={`flex-1 px-1.5 sm:px-3 py-2 text-[11px] sm:text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'FEEDBACK'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span>Review</span>
            </button>

            <button
              onClick={() => setActiveTab('FOUNDER')}
              className={`flex-1 px-1.5 sm:px-3 py-2 text-[11px] sm:text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'FOUNDER'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 shrink-0" />
              <span>Founder</span>
            </button>

            <button
              onClick={() => setActiveTab('DEVELOPER')}
              className={`flex-1 px-1.5 sm:px-3 py-2 text-[11px] sm:text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'DEVELOPER'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Code2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>Developer</span>
            </button>

            <button
              onClick={() => setActiveTab('CONTACT')}
              className={`flex-1 px-1.5 sm:px-3 py-2 text-[11px] sm:text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'CONTACT'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span>Support</span>
            </button>

          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

          {/* TAB 1: RATING & REVIEW FORM */}
          {activeTab === 'FEEDBACK' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Main Rating Card */}
              <form onSubmit={handleSubmitFeedback} className={`border rounded-3xl p-4 sm:p-5 space-y-4 transition-all ${
                editingFeedbackId
                  ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 shadow-sm'
                  : 'bg-slate-50/70 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800 shadow-2xs'
              }`}>
                <div className="text-center space-y-2">
                  {editingFeedbackId && (
                    <div className="flex items-center justify-between mb-1 pb-2 border-b border-amber-200 dark:border-amber-800/80">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <Edit3 className="h-3 w-3" /> Editing Review
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-[10px] font-extrabold text-slate-500 hover:text-slate-800 dark:text-slate-400 underline cursor-pointer"
                      >
                        Cancel Editing
                      </button>
                    </div>
                  )}

                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 tracking-tight">
                    {editingFeedbackId ? 'Update Your Rating & Review' : `How is your experience with ${branding?.appName || 'Mito_Reboot'}?`}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Tap a star to rate your satisfaction</p>

                  {/* Glowing 5-Star Interactive Component */}
                  <div className="flex items-center justify-center gap-2 pt-1 pb-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = star <= (hoverRating || rating);
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transform hover:scale-125 active:scale-95 transition-all cursor-pointer"
                        >
                          <Star
                            className={`h-7 w-7 sm:h-8 sm:w-8 transition-all ${
                              active
                                ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                                : 'text-slate-200 dark:text-slate-800 fill-transparent'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1">
                    <span className="bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] sm:text-[11px] font-black px-3.5 py-1 rounded-full inline-block shadow-2xs">
                      {rating === 5 ? '⭐⭐⭐⭐⭐ Outstanding!' : rating === 4 ? '⭐⭐⭐⭐ Great Experience' : rating === 3 ? '⭐⭐⭐ Good' : rating === 2 ? '⭐⭐ Needs Improvement' : '⭐ Unsatisfactory'}
                    </span>
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Feedback Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-extrabold text-slate-800 dark:text-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none cursor-pointer transition-all shadow-2xs"
                  >
                    <option value="App Experience">📱 App Experience & Design</option>
                    <option value="Metabolic Results">🩺 Metabolic Health Results</option>
                    <option value="Feature Request">💡 Feature Request & Suggestion</option>
                    <option value="Bug Report">🛠️ Usability & Bug Report</option>
                    <option value="General Feedback">💬 General Feedback</option>
                  </select>
                </div>

                {/* Comments Textarea */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Your Comments & Suggestions</label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share how Mito_Reboot has helped your metabolic journey or suggest enhancements..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none font-medium leading-relaxed resize-none shadow-2xs"
                  />
                </div>

                {/* CTA Button */}
                <div className="flex gap-2 pt-1">
                  {editingFeedbackId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:opacity-95 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>{editingFeedbackId ? 'Updating...' : 'Submitting...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>{editingFeedbackId ? 'Update Review' : 'Submit Review'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* My Submitted Reviews Section */}
              {myFeedbacks.length > 0 && (
                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-indigo-500" /> My Submitted Reviews ({myFeedbacks.length})
                  </h4>
                  <div className="space-y-3">
                    {myFeedbacks.map((fb) => (
                      <div key={fb._id} className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-xs hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-400">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`h-3.5 w-3.5 ${s <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-transparent'}`} />
                            ))}
                            <span className="text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full ml-1.5 border border-slate-200/60 dark:border-slate-700">
                              {fb.category}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {new Date(fb.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed italic bg-slate-50/70 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                          "{fb.comment}"
                        </p>

                        {/* Admin / Team Reply */}
                        {fb.adminNotes && (
                          <div className="bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200/90 dark:border-indigo-800/80 rounded-2xl p-3.5 space-y-1 shadow-2xs">
                            <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-black text-[10px] uppercase tracking-wider">
                              <MessageSquare className="h-3.5 w-3.5 text-indigo-500 fill-indigo-500 shrink-0" />
                              <span>Mito_Reboot Team Reply</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                              {fb.adminNotes}
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                          <button
                            onClick={() => handleEditReview(fb)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1.5 border border-indigo-100 dark:border-indigo-900/40 cursor-pointer shadow-2xs"
                          >
                            <Edit3 className="h-3 w-3" /> Edit Review
                          </button>
                          <button
                            onClick={() => handleDeleteReview(fb._id)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1.5 border border-rose-100 dark:border-rose-900/40 cursor-pointer shadow-2xs"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FOUNDER NOTE */}
          {activeTab === 'FOUNDER' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-rose-500/10 dark:from-rose-950/40 dark:via-amber-950/20 dark:to-rose-950/40 border border-rose-200/90 dark:border-rose-900/50 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-md shrink-0">
                    👑
                  </div>
                  <div>
                    <span className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300/40 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Founder's Vision
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">A Message from Our Founders</h3>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-2 border-rose-400 pl-3.5 py-0.5">
                  <p>
                    "Welcome to {branding?.appName || 'Mito_Reboot'}. Our vision was born out of a deep passion to solve chronic lifestyle conditions naturally by harnessing the power of circadian biology, smart nutrition, and continuous glucose monitoring."
                  </p>
                  <p>
                    "We built this platform so you have evidence-backed lifestyle protocols, personalized food spike scores, and real-time clinical guidance at your fingertips. Your health journey is personal, and our entire mission is dedicated to helping you live a vibrant, disease-free, and energized life."
                  </p>
                  <p>
                    "Thank you for placing your trust in our platform and being a part of this preventive health movement."
                  </p>
                </div>

                <div className="pt-3 border-t border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-rose-500" /> The Founders Team
                  </span>
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Mito_Reboot Health</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEVELOPER NOTE */}
          {activeTab === 'DEVELOPER' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-purple-950/40 border border-blue-200/90 dark:border-blue-900/50 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-md shrink-0">
                    💻
                  </div>
                  <div>
                    <span className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-300/40 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Developer's Note
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">Behind Engineering & AI Platform</h3>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-2 border-blue-500 pl-3.5 py-0.5">
                  <p>
                    "Building {branding?.appName || 'Mito_Reboot'} has been an extraordinary journey of engineering passion, technical precision, and care. Every feature—from continuous glucose sensor integration and automated meal spike algorithms to seamless clinical consultation workflows—was designed to feel intuitive, fast, and empowering."
                  </p>
                  <p>
                    "As developers, knowing that our code directly helps individuals monitor their health, avoid glucose spikes, and build healthy daily habits gives our work immense purpose. We continuously refine the app architecture to ensure maximum security, speed, and responsiveness."
                  </p>
                  <p>
                    "If you ever have suggestions, find a bug, or want a feature added, please drop a rating & feedback. We read every single note!"
                  </p>
                </div>

                <div className="pt-3 border-t border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500" /> Engineering & AI Team
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Crafted for Wellness</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTACT SUPPORT */}
          {activeTab === 'CONTACT' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-slate-50/80 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 text-center space-y-4 shadow-2xs">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 shadow-inner">
                  <Mail className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Need Dedicated Help?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-md mx-auto font-medium">
                    Our medical support desk and technical team are available to assist with sensor pairing, subscriptions, order tracking, and app guidance.
                  </p>
                </div>

                <a
                  href="mailto:support@mitoreboot.in"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 dark:from-slate-100 dark:to-white text-white dark:text-slate-900 rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email support@mitoreboot.in</span>
                </a>

                <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-400 space-y-1 font-medium">
                  <p>Response Time: Typically within 24–48 hours</p>
                  <p>Available: Monday to Saturday (9:00 AM – 7:00 PM IST)</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
