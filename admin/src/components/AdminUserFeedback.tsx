import React, { useState, useEffect } from 'react';
import { Star, Search, MessageSquare, Trash2, RefreshCw, Edit3 } from 'lucide-react';

interface FeedbackItem {
  _id: string;
  userName: string;
  userEmail: string;
  rating: number;
  category: string;
  comment: string;
  status: 'Pending' | 'Reviewed' | 'Featured' | 'Archived';
  adminNotes?: string;
  createdAt: string;
}

interface FeedbackStats {
  totalFeedbacks: number;
  avgRating: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface AdminUserFeedbackProps {
  token: string;
  apiUrl: string;
}

export const AdminUserFeedback: React.FC<AdminUserFeedbackProps> = ({ token, apiUrl }) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    totalFeedbacks: 0,
    avgRating: 5.0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Edit notes modal state
  const [editingItem, setEditingItem] = useState<FeedbackItem | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    fetchFeedbacks();
  }, [selectedRating, selectedCategory, selectedStatus, page]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRating !== 'All') params.append('rating', selectedRating);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      if (search.trim()) params.append('search', search.trim());
      params.append('page', String(page));
      params.append('limit', '12');

      const res = await fetch(`${apiUrl}/admin/feedback?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.feedbacks || []);
        setTotalPages(data.totalPages || 1);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching admin feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFeedbacks();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${apiUrl}/admin/feedback/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setFeedbacks(prev => prev.map(item => item._id === id ? { ...item, status: newStatus as any } : item));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!editingItem) return;
    setUpdating(true);
    try {
      const res = await fetch(`${apiUrl}/admin/feedback/${editingItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adminNotes })
      });

      if (res.ok) {
        setFeedbacks(prev => prev.map(item => item._id === editingItem._id ? { ...item, adminNotes } : item));
        setEditingItem(null);
      }
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user feedback entry?')) return;
    try {
      const res = await fetch(`${apiUrl}/admin/feedback/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setFeedbacks(prev => prev.filter(item => item._id !== id));
        fetchFeedbacks();
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12">
      
      {/* Premium Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        
        {/* Glow accent decoration */}
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shadow-inner">
            <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-400/15 text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-400/20 tracking-wider">
                Patient Feedback Hub
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">User Ratings & App Feedback</h1>
            <p className="text-xs text-indigo-200 font-medium mt-0.5 max-w-xl">
              Monitor app experience reviews, metabolic results testimonials, and feature requests submitted directly from users.
            </p>
          </div>
        </div>

        <button
          onClick={fetchFeedbacks}
          className="relative z-10 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ratings</span>
        </button>
      </div>

      {/* Analytics Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Average Rating Widget */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Overall Satisfaction Score</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900">{stats.avgRating}</span>
            <span className="text-xs font-bold text-slate-400">out of 5.0</span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`h-4 w-4 ${s <= Math.round(stats.avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-transparent'}`} />
            ))}
          </div>
        </div>

        {/* Total Reviews Count */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Ratings Submitted</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-indigo-600">{stats.totalFeedbacks}</span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Reviews</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Captured via Help & Support modal</p>
        </div>

        {/* 5-Star Reviews Count */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">5-Star Testimonials</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-600">{stats.distribution[5] || 0}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {stats.totalFeedbacks > 0 ? Math.round(((stats.distribution[5] || 0) / stats.totalFeedbacks) * 100) : 100}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Top level patient satisfaction</p>
        </div>

        {/* Critical Ratings (1-2 Stars) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Needs Follow-Up (1-2 Stars)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-rose-600">
              {(stats.distribution[1] || 0) + (stats.distribution[2] || 0)}
            </span>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">Feedback</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Low ratings requiring team response</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email or review..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
          />
        </form>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          {/* Rating filter */}
          <select
            value={selectedRating}
            onChange={(e) => { setSelectedRating(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="All">All Ratings (1-5 ⭐)</option>
            <option value="5">5 Stars ⭐⭐⭐⭐⭐</option>
            <option value="4">4 Stars ⭐⭐⭐⭐</option>
            <option value="3">3 Stars ⭐⭐⭐</option>
            <option value="2">2 Stars ⭐⭐</option>
            <option value="1">1 Star ⭐</option>
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="App Experience">App Experience</option>
            <option value="Metabolic Results">Metabolic Results</option>
            <option value="Feature Request">Feature Request</option>
            <option value="Bug Report">Bug Report</option>
            <option value="General Feedback">General Feedback</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending Review</option>
            <option value="Reviewed">Reviewed / Approved</option>
            <option value="Featured">Featured Review</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Feedbacks Grid List */}
      {loading ? (
        <div className="text-center py-20 bg-white border border-slate-200/90 rounded-3xl shadow-xs">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-500">Loading user feedbacks...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-3">
          <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-800">No feedbacks found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">No patient reviews match your selected filters or search queries.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {feedbacks.map((fb) => (
              <div
                key={fb._id}
                className="bg-white border border-slate-200/90 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="space-y-3">
                  
                  {/* Top user avatar info & status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        {fb.userName ? fb.userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{fb.userName}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold truncate block">{fb.userEmail}</span>
                      </div>
                    </div>

                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 border ${
                      fb.status === 'Featured' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      fb.status === 'Reviewed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      fb.status === 'Archived' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                      'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {fb.status}
                    </span>
                  </div>

                  {/* Rating Stars & Category Pill */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-4 w-4 ${s <= fb.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-transparent'}`} />
                      ))}
                    </div>
                    <span className="text-[9px] font-extrabold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200/80">
                      {fb.category}
                    </span>
                  </div>

                  {/* Comment Quote Card */}
                  <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-2xl text-xs text-slate-700 font-medium leading-relaxed italic">
                    "{fb.comment}"
                  </div>

                  {/* Internal Admin Notes */}
                  {fb.adminNotes && (
                    <div className="bg-indigo-50 border border-indigo-200/80 p-3 rounded-2xl text-[11px] text-indigo-950 space-y-0.5">
                      <span className="font-extrabold block text-[9px] uppercase tracking-wider text-indigo-700">Team Reply (Visible to User):</span>
                      <p className="font-semibold text-slate-800">{fb.adminNotes}</p>
                    </div>
                  )}
                </div>

                {/* Footer Controls & Date */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { setEditingItem(fb); setAdminNotes(fb.adminNotes || ''); }}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border border-indigo-200 flex items-center gap-1"
                      title="Reply to Patient"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>{fb.adminNotes ? 'Edit Reply' : 'Reply'}</span>
                    </button>

                    {fb.status !== 'Reviewed' && (
                      <button
                        onClick={() => handleUpdateStatus(fb._id, 'Reviewed')}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer"
                      >
                        Approve
                      </button>
                    )}

                    {fb.status !== 'Featured' && (
                      <button
                        onClick={() => handleUpdateStatus(fb._id, 'Featured')}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer"
                      >
                        Feature
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteFeedback(fb._id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition-all cursor-pointer"
                      title="Delete Entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4">
              <span className="text-xs font-bold text-slate-400">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Admin Reply Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Reply to Patient Feedback</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Your reply will be displayed directly under <strong className="text-slate-700">{editingItem.userName}'s</strong> review in their mobile app.
            </p>

            <textarea
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Enter official team reply (e.g. Thank you for your feedback! We are glad you love the app)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={updating}
                className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {updating ? 'Sending Reply...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
