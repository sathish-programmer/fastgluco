import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Video, Upload, Eye, EyeOff } from 'lucide-react';

const getYoutubeThumbnailUrl = (url: string) => {
  if (!url) return '';
  let videoId = '';
  try {
    const cleanUrl = url.trim();
    if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
      if (cleanUrl.includes('watch?v=')) {
        const parts = cleanUrl.split('watch?v=');
        if (parts[1]) {
          videoId = parts[1].split('&')[0];
        }
      } else if (cleanUrl.includes('embed/')) {
        const parts = cleanUrl.split('embed/');
        if (parts[1]) {
          videoId = parts[1].split('?')[0];
        }
      } else if (cleanUrl.includes('youtu.be/')) {
        const parts = cleanUrl.split('youtu.be/');
        if (parts[1]) {
          videoId = parts[1].split('?')[0];
        }
      } else if (cleanUrl.includes('shorts/')) {
        const parts = cleanUrl.split('shorts/');
        if (parts[1]) {
          videoId = parts[1].split('?')[0];
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
  videoId = videoId.trim();
  if (videoId && videoId.length === 11) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return '';
};

interface AdminIndianCancersProps {
  apiUrl: string;
  token: string;
}

export const AdminIndianCancers: React.FC<AdminIndianCancersProps> = ({ apiUrl, token }) => {
  const [activeTab, setActiveTab] = useState<'cancers' | 'videos'>('cancers');
  const [cancers, setCancers] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});

  const resolveThumbnail = (thumbnailUrl: string, videoUrl: string) => {
    const ytThumbFromThumb = getYoutubeThumbnailUrl(thumbnailUrl);
    if (ytThumbFromThumb) return ytThumbFromThumb;
    if (thumbnailUrl) {
      return thumbnailUrl.startsWith('/uploads/') ? `${apiUrl.replace('/api', '')}${thumbnailUrl}` : thumbnailUrl;
    }
    const ytThumbFromVideo = getYoutubeThumbnailUrl(videoUrl);
    if (ytThumbFromVideo) return ytThumbFromVideo;
    return '';
  };

  // Cancer form state
  const [cancerForm, setCancerForm] = useState({
    _id: '',
    name: '',
    gender: 'Both' as 'Men' | 'Women' | 'Both',
    percentage: 0,
    riskFactorsText: '',
    description: '',
    displayOrder: 0,
    status: 'active' as 'active' | 'inactive'
  });

  // Video form state
  const [videoForm, setVideoForm] = useState({
    _id: '',
    cancerId: '',
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    displayOrder: 0,
    status: 'active' as 'active' | 'inactive'
  });

  const [showCancerModal, setShowCancerModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const cancersRes = await fetch(`${apiUrl}/admin/indian-cancers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const cancersData = await cancersRes.json();
      setCancers(cancersData);

      const videosRes = await fetch(`${apiUrl}/admin/cancer-videos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const videosData = await videosRes.json();
      setVideos(videosData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Cancer Operations ---
  const handleCancerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${apiUrl}/admin/indian-cancers/${cancerForm._id}` : `${apiUrl}/admin/indian-cancers`;
      
      const payload = {
        name: cancerForm.name,
        gender: cancerForm.gender,
        percentage: Number(cancerForm.percentage),
        riskFactors: cancerForm.riskFactorsText.split(',').map(s => s.trim()).filter(Boolean),
        description: cancerForm.description,
        displayOrder: Number(cancerForm.displayOrder),
        status: cancerForm.status
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowCancerModal(false);
        fetchData();
      } else {
        alert('Error saving cancer category');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCancer = async (id: string) => {
    if (!window.confirm('Delete cancer category and all associated videos?')) return;
    try {
      const res = await fetch(`${apiUrl}/admin/indian-cancers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Error deleting cancer category');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCancerStatus = async (cancer: any) => {
    const nextStatus = cancer.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`${apiUrl}/admin/indian-cancers/${cancer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Video Operations ---
  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${apiUrl}/admin/cancer-videos/${videoForm._id}` : `${apiUrl}/admin/cancer-videos`;
      
      const payload = {
        cancerId: videoForm.cancerId,
        title: videoForm.title,
        description: videoForm.description,
        videoUrl: videoForm.videoUrl,
        thumbnailUrl: videoForm.thumbnailUrl,
        displayOrder: Number(videoForm.displayOrder),
        status: videoForm.status
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowVideoModal(false);
        fetchData();
      } else {
        alert('Error saving video');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm('Delete video?')) return;
    try {
      const res = await fetch(`${apiUrl}/admin/cancer-videos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Error deleting video');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleVideoStatus = async (video: any) => {
    const nextStatus = video.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`${apiUrl}/admin/cancer-videos/${video._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'videoUrl' | 'thumbnailUrl') => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await fetch(`${apiUrl}/admin/upload-media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        if (field === 'videoUrl') {
          setVideoForm(prev => ({ ...prev, videoUrl: data.url }));
        } else {
          setVideoForm(prev => ({ ...prev, thumbnailUrl: data.url }));
        }
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  // --- Modals togglers ---
  const openNewCancer = () => {
    setCancerForm({
      _id: '',
      name: '',
      gender: 'Both',
      percentage: 0,
      riskFactorsText: '',
      description: '',
      displayOrder: cancers.length + 1,
      status: 'active'
    });
    setIsEditing(false);
    setShowCancerModal(true);
  };

  const openEditCancer = (c: any) => {
    setCancerForm({
      _id: c._id,
      name: c.name,
      gender: c.gender,
      percentage: c.percentage,
      riskFactorsText: c.riskFactors.join(', '),
      description: c.description || '',
      displayOrder: c.displayOrder || 0,
      status: c.status
    });
    setIsEditing(true);
    setShowCancerModal(true);
  };

  const openNewVideo = () => {
    setVideoForm({
      _id: '',
      cancerId: cancers[0]?._id || '',
      title: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      displayOrder: videos.length + 1,
      status: 'active'
    });
    setIsEditing(false);
    setShowVideoModal(true);
  };

  const openEditVideo = (v: any) => {
    setVideoForm({
      _id: v._id,
      cancerId: v.cancerId?._id || v.cancerId || '',
      title: v.title,
      description: v.description || '',
      videoUrl: v.videoUrl,
      thumbnailUrl: v.thumbnailUrl || '',
      displayOrder: v.displayOrder || 0,
      status: v.status
    });
    setIsEditing(true);
    setShowVideoModal(true);
  };

  if (loading) return <div className="text-center p-8 text-slate-500 font-medium">Loading Indian Cancer data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-sans">Indian Cancers & Risks Management</h2>
          <p className="text-xs text-slate-500 mt-1">Configure cancers, statistics, risk factors, and educational awareness videos</p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'cancers' ? (
            <button onClick={openNewCancer} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
              <Plus className="h-4 w-4" /> Add Cancer Category
            </button>
          ) : (
            <button onClick={openNewVideo} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
              <Video className="h-4 w-4" /> Add Video
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('cancers')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'cancers' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Indian Cancers ({cancers.length})
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'videos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Awareness Videos ({videos.length})
        </button>
      </div>

      {/* CANCERS TABLE */}
      {activeTab === 'cancers' && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Display Order</th>
                  <th className="px-6 py-4">Cancer Name</th>
                  <th className="px-6 py-4">Gender</th>
                  <th className="px-6 py-4">Percentage/Share</th>
                  <th className="px-6 py-4">Risk Factors</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {cancers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">No cancers configured. Click Add to begin.</td>
                  </tr>
                ) : (
                  cancers.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-4 font-mono text-slate-400">{c.displayOrder}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          c.gender === 'Men' ? 'bg-teal-50 text-teal-700' : c.gender === 'Women' ? 'bg-pink-50 text-pink-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {c.gender}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">{c.percentage}%</td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-500" title={c.riskFactors.join(', ')}>
                        {c.riskFactors.join(', ')}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleCancerStatus(c)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                            c.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {c.status === 'active' ? (
                            <><Eye className="h-3.5 w-3.5" /> Active</>
                          ) : (
                            <><EyeOff className="h-3.5 w-3.5" /> Inactive</>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => openEditCancer(c)} className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-all inline-flex items-center">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteCancer(c._id)} className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all inline-flex items-center">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIDEOS TABLE */}
      {activeTab === 'videos' && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Display Order</th>
                  <th className="px-6 py-4">Video Title</th>
                  <th className="px-6 py-4">Cancer Category</th>
                  <th className="px-6 py-4">Url / Source</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {videos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No videos configured. Click Add Video to begin.</td>
                  </tr>
                ) : (
                  videos.map((v) => (
                    <tr key={v._id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-4 font-mono text-slate-400">{v.displayOrder}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        <div className="flex items-center gap-3">
                          {resolveThumbnail(v.thumbnailUrl || '', v.videoUrl) && !imageErrors[v._id] ? (
                            <img 
                              src={resolveThumbnail(v.thumbnailUrl || '', v.videoUrl)} 
                              alt="" 
                              className="w-12 h-8 rounded object-cover border border-slate-200" 
                              onError={() => setImageErrors(prev => ({ ...prev, [v._id]: true }))}
                            />
                          ) : (
                            <div className="w-12 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-mono text-[9px] font-bold">Video</div>
                          )}
                          <div>
                            <p className="font-bold text-slate-800">{v.title}</p>
                            <p className="text-[10px] text-slate-400 max-w-xs truncate">{v.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600">{v.cancerId?.name || 'Unassigned'}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400 max-w-xs truncate" title={v.videoUrl}>
                        {v.videoUrl}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleVideoStatus(v)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                            v.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {v.status === 'active' ? (
                            <><Eye className="h-3.5 w-3.5" /> Active</>
                          ) : (
                            <><EyeOff className="h-3.5 w-3.5" /> Inactive</>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => openEditVideo(v)} className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-all inline-flex items-center">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteVideo(v._id)} className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all inline-flex items-center">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CANCER MODAL */}
      {showCancerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">{isEditing ? 'Edit Cancer Category' : 'Add Cancer Category'}</h3>
              <button onClick={() => setShowCancerModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>
            <form onSubmit={handleCancerSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Cancer Name</label>
                <input 
                  type="text" 
                  required
                  value={cancerForm.name} 
                  onChange={e => setCancerForm({ ...cancerForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Gender / Category</label>
                  <select
                    value={cancerForm.gender}
                    onChange={e => setCancerForm({ ...cancerForm, gender: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Percentage Share (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    required
                    value={cancerForm.percentage} 
                    onChange={e => setCancerForm({ ...cancerForm, percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Risk Factors (comma-separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Obesity, Smoking, Family history"
                  value={cancerForm.riskFactorsText} 
                  onChange={e => setCancerForm({ ...cancerForm, riskFactorsText: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Description / Content</label>
                <textarea 
                  rows={3}
                  value={cancerForm.description} 
                  onChange={e => setCancerForm({ ...cancerForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Display Order</label>
                  <input 
                    type="number" 
                    value={cancerForm.displayOrder} 
                    onChange={e => setCancerForm({ ...cancerForm, displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={cancerForm.status}
                    onChange={e => setCancerForm({ ...cancerForm, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCancerModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIDEO MODAL */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">{isEditing ? 'Edit Awareness Video' : 'Add Awareness Video'}</h3>
              <button onClick={() => setShowVideoModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>
            <form onSubmit={handleVideoSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Cancer Category</label>
                <select
                  required
                  value={videoForm.cancerId}
                  onChange={e => setVideoForm({ ...videoForm, cancerId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                >
                  <option value="" disabled>Select Cancer Category</option>
                  {cancers.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.gender})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Video Title</label>
                <input 
                  type="text" 
                  required
                  value={videoForm.title} 
                  onChange={e => setVideoForm({ ...videoForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Description</label>
                <input 
                  type="text" 
                  value={videoForm.description} 
                  onChange={e => setVideoForm({ ...videoForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Video File / URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    required
                    placeholder="Enter Video streaming URL"
                    value={videoForm.videoUrl} 
                    onChange={e => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                  <label className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
                    <Upload className="h-4 w-4" />
                    Upload
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={e => handleFileUpload(e, 'videoUrl')}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Thumbnail Image File / URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Thumbnail URL"
                    value={videoForm.thumbnailUrl} 
                    onChange={e => setVideoForm({ ...videoForm, thumbnailUrl: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                  <label className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
                    <Upload className="h-4 w-4" />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleFileUpload(e, 'thumbnailUrl')}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Display Order</label>
                  <input 
                    type="number" 
                    value={videoForm.displayOrder} 
                    onChange={e => setVideoForm({ ...videoForm, displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={videoForm.status}
                    onChange={e => setVideoForm({ ...videoForm, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {uploading && <div className="text-center text-xs font-bold text-indigo-600 animate-pulse">Uploading file... Please wait.</div>}

              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowVideoModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={uploading} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold disabled:opacity-50">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
