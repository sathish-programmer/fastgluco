import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Video, Play, CheckCircle2, AlertCircle, Eye, EyeOff, RefreshCw, Save } from 'lucide-react';

interface AdminCancerTestsProps {
  apiUrl: string;
  token: string;
}

const DEFAULT_BREAST_VIDEO_URL = 'https://youtu.be/hymu-0jWtdM?si=n8pz91JRuhK4opin';

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0`;
  }
  return url;
};

export const AdminCancerTests: React.FC<AdminCancerTestsProps> = ({ apiUrl, token }) => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ _id: '', name: '', description: '', frequency: '', category: 'Universal', isActive: true, whyItIsNeeded: '', recommendedAge: '', generalPreparationInstructions: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Educational Video Configuration (Animated Self Breast Examination)
  const [videoConfig, setVideoConfig] = useState({
    title: 'Animated Self Breast Examination',
    description: 'Step-by-step visual animation for monthly breast self-examination and awareness',
    youtubeUrl: DEFAULT_BREAST_VIDEO_URL,
    isActive: true
  });
  const [videoSaving, setVideoSaving] = useState(false);
  const [videoMsg, setVideoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showVideoPreview, setShowVideoPreview] = useState(false);

  const fetchVideoConfig = async () => {
    try {
      const res = await fetch(`${apiUrl}/content/educational-videos/breast_self_exam`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setVideoConfig({
            title: json.data.title || 'Animated Self Breast Examination',
            description: json.data.description || 'Step-by-step visual animation for monthly breast self-examination and awareness',
            youtubeUrl: json.data.youtubeUrl || '',
            isActive: json.data.isActive !== false
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch breast exam video config:', err);
    }
  };

  const handleSaveVideo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setVideoSaving(true);
      setVideoMsg(null);
      const res = await fetch(`${apiUrl}/admin/educational-videos/breast_self_exam`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(videoConfig)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVideoMsg({ type: 'success', text: 'Video link and settings updated successfully!' });
        setTimeout(() => setVideoMsg(null), 4000);
      } else {
        setVideoMsg({ type: 'error', text: data.message || 'Failed to update video link' });
      }
    } catch (err: any) {
      setVideoMsg({ type: 'error', text: err.message || 'Error updating video' });
    } finally {
      setVideoSaving(false);
    }
  };

  const handleRemoveVideo = async () => {
    if (!window.confirm('Are you sure you want to remove this video link? It will no longer be shown in 3-weekly symptom check or screening screens.')) {
      return;
    }
    try {
      setVideoSaving(true);
      const res = await fetch(`${apiUrl}/admin/educational-videos/breast_self_exam`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVideoConfig(prev => ({ ...prev, youtubeUrl: '', isActive: false }));
        setVideoMsg({ type: 'success', text: 'Video link removed/disabled successfully.' });
        setTimeout(() => setVideoMsg(null), 4000);
      }
    } catch (err: any) {
      setVideoMsg({ type: 'error', text: err.message || 'Failed to remove link' });
    } finally {
      setVideoSaving(false);
    }
  };

  const handleRestoreDefaultVideo = () => {
    setVideoConfig({
      title: 'Animated Self Breast Examination',
      description: 'Step-by-step visual animation for monthly breast self-examination and awareness',
      youtubeUrl: DEFAULT_BREAST_VIDEO_URL,
      isActive: true
    });
  };

  const fetchTests = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/screening-tests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
    fetchVideoConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${apiUrl}/admin/screening-tests/${form._id}` : `${apiUrl}/admin/screening-tests`;
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setShowModal(false);
        fetchTests();
      } else {
        alert('Error saving test');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete screening test?')) return;
    try {
      await fetch(`${apiUrl}/admin/screening-tests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTests();
    } catch (err) {
      console.error(err);
    }
  };

  const openNew = () => {
    setForm({ _id: '', name: '', description: '', frequency: '', category: 'Universal', isActive: true, whyItIsNeeded: '', recommendedAge: '', generalPreparationInstructions: '' });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEdit = (t: any) => {
    setForm({ 
      ...t, 
      whyItIsNeeded: t.whyItIsNeeded || '', 
      recommendedAge: t.recommendedAge || '', 
      generalPreparationInstructions: t.generalPreparationInstructions || '' 
    });
    setIsEditing(true);
    setShowModal(true);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* ── EDUCATIONAL VIDEO CONFIGURATION SECTION ── */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  Animated Self Breast Examination Video
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  videoConfig.isActive && videoConfig.youtubeUrl 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {videoConfig.isActive && videoConfig.youtubeUrl ? 'Active in App' : 'Disabled / Hidden'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Displays in 3-Weekly Symptom Check (Breast Lump) & Cancer Screening (Women under 40 and 40+)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {videoConfig.youtubeUrl && (
              <button
                type="button"
                onClick={() => setShowVideoPreview(!showVideoPreview)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {showVideoPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showVideoPreview ? 'Hide Preview' : 'Preview'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleRestoreDefaultVideo}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset link to default"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>

        {videoMsg && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            videoMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {videoMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{videoMsg.text}</span>
          </div>
        )}

        {/* Video Fields Form */}
        <form onSubmit={handleSaveVideo} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                YouTube Video URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=..."
                  value={videoConfig.youtubeUrl}
                  onChange={e => setVideoConfig({ ...videoConfig, youtubeUrl: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Accepts youtu.be shortlinks, standard youtube.com links, or embed links.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Display Title
              </label>
              <input
                type="text"
                required
                value={videoConfig.title}
                onChange={e => setVideoConfig({ ...videoConfig, title: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Description / Caption
            </label>
            <input
              type="text"
              value={videoConfig.description}
              onChange={e => setVideoConfig({ ...videoConfig, description: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={videoConfig.isActive}
                onChange={e => setVideoConfig({ ...videoConfig, isActive: e.target.checked })}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
              />
              <span className="text-xs font-bold text-slate-700">Enable this video link in Patient App</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRemoveVideo}
                disabled={videoSaving || !videoConfig.youtubeUrl}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Link</span>
              </button>

              <button
                type="submit"
                disabled={videoSaving}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{videoSaving ? 'Saving...' : 'Update & Save Link'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Embedded Video Preview (if expanded) */}
        {showVideoPreview && videoConfig.youtubeUrl && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Live Patient App Preview</span>
            </h4>
            <div className="max-w-xl mx-auto rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-video shadow-md">
              <iframe
                src={getYouTubeEmbedUrl(videoConfig.youtubeUrl)}
                title="Preview"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>

      {/* ── CANCER SCREENING TESTS TABLE ── */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Cancer Screening Details</h2>
          <p className="text-xs text-slate-500 mt-1">Manage tests for non-cancer patient dashboard</p>
        </div>
        <button onClick={openNew} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Test
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
            <tr>
              <th className="px-4 py-3">Test Name</th>
              <th className="px-4 py-3">Frequency</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tests.map(t => (
              <tr key={t._id}>
                <td className="px-4 py-3 font-semibold text-slate-800">{t.name}</td>
                <td className="px-4 py-3">{t.frequency}</td>
                <td className="px-4 py-3">{t.category}</td>
                <td className="px-4 py-3 text-right flex justify-end gap-2">
                  <button onClick={() => openEdit(t)} className="p-1.5 text-blue-500 bg-blue-50 rounded"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(t._id)} className="p-1.5 text-red-500 bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{isEditing ? 'Edit Test' : 'New Test'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Description (incl markers)</label>
                <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm" rows={3}></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Frequency</label>
                <input required value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} placeholder="e.g. Yearly from 50" className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Universal">Universal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Why It Is Needed</label>
                <textarea value={form.whyItIsNeeded} onChange={e => setForm({...form, whyItIsNeeded: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm" rows={2}></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Recommended Age</label>
                <input value={form.recommendedAge} onChange={e => setForm({...form, recommendedAge: e.target.value})} placeholder="e.g. 50-70 years" className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Preparation Instructions</label>
                <textarea value={form.generalPreparationInstructions} onChange={e => setForm({...form, generalPreparationInstructions: e.target.value})} placeholder="e.g. Fasting for 12 hours" className="w-full border border-slate-200 rounded-lg p-2 text-sm" rows={2}></textarea>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary rounded-lg text-sm font-bold text-white">Save Test</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
