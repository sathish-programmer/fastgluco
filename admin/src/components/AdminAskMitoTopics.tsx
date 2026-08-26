import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Trash2, Edit2, ToggleLeft, ToggleRight, Search, 
  BookOpen, Activity, Tag, Layers, X
} from 'lucide-react';

interface AskMitoTopic {
  _id?: string;
  title: string;
  category: string;
  keywords: string[];
  answer: string;
  suggestedPrompt: string;
  icon?: string;
  order: number;
  isActive: boolean;
}

interface AdminAskMitoTopicsProps {
  apiUrl: string;
  token: string;
}

export const AdminAskMitoTopics: React.FC<AdminAskMitoTopicsProps> = ({ apiUrl, token }) => {
  const [topics, setTopics] = useState<AskMitoTopic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [editingTopic, setEditingTopic] = useState<AskMitoTopic>({
    title: '',
    category: 'General',
    keywords: [],
    answer: '',
    suggestedPrompt: '',
    icon: '💡',
    order: 1,
    isActive: true
  });
  const [keywordInput, setKeywordInput] = useState<string>('');

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/ask-mito/topics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
      }
    } catch (err) {
      console.error('Error fetching Ask Mito topics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [apiUrl, token]);

  const handleSaveTopic = async () => {
    if (!editingTopic.title || !editingTopic.answer) {
      alert('Please fill in title and detailed answer.');
      return;
    }

    setSaving(true);
    try {
      const url = editingTopic._id
        ? `${apiUrl}/admin/ask-mito/topics/${editingTopic._id}`
        : `${apiUrl}/admin/ask-mito/topics`;
      const method = editingTopic._id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingTopic)
      });

      if (res.ok) {
        alert('Ask Mito topic workflow saved successfully!');
        fetchTopics();
        setActiveTab('list');
      } else {
        alert('Failed to save topic workflow.');
      }
    } catch (err) {
      console.error('Error saving topic:', err);
      alert('Error saving topic.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Ask Mito topic?')) return;
    try {
      const res = await fetch(`${apiUrl}/admin/ask-mito/topics/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTopics();
      }
    } catch (err) {
      console.error('Error deleting topic:', err);
    }
  };

  const handleAddKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !editingTopic.keywords.includes(kw)) {
      setEditingTopic({ ...editingTopic, keywords: [...editingTopic.keywords, kw] });
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setEditingTopic({
      ...editingTopic,
      keywords: editingTopic.keywords.filter(k => k !== kwToRemove)
    });
  };

  const filteredTopics = topics.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen text-slate-900 font-sans">
      {/* Top Header matching Admin theme */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ask Mito Workflows & Q&A Topics</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configure Ask Mito knowledge base answers, suggested topic shortcuts, and intent matching keywords.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'list' ? (
            <button
              onClick={() => {
                setEditingTopic({
                  title: '',
                  category: 'General',
                  keywords: [],
                  answer: '',
                  suggestedPrompt: '',
                  icon: '💡',
                  order: topics.length + 1,
                  isActive: true
                });
                setActiveTab('editor');
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Topic</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('list')}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Back to Topics List
            </button>
          )}
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-5">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search topics by title, category, or keyword..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-xs transition-all"
            />
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-medium text-slate-400">Loading Ask Mito topics...</div>
          ) : filteredTopics.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
              <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No topics found</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add New Topic" to create a new Ask Mito Q&A workflow topic.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTopics.map(t => (
                <div
                  key={t._id}
                  className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t.title}</h3>
                          <span className="inline-block mt-0.5 text-[9.5px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {t.category}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[9.5px] font-bold px-2.5 py-0.5 rounded-full border ${t.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        {t.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-medium text-slate-600 leading-relaxed line-clamp-3 whitespace-pre-line bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                        {t.answer}
                      </p>
                    </div>

                    {/* Keywords pills */}
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {t.keywords.map(kw => (
                        <span key={kw} className="inline-flex items-center gap-1 text-[9.5px] font-medium bg-slate-100 text-slate-600 border border-slate-200/70 px-2 py-0.5 rounded-md">
                          <Tag className="h-2.5 w-2.5 text-slate-400" />
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order: {t.order}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingTopic(t);
                          setActiveTab('editor');
                        }}
                        className="p-2 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-xl transition-colors cursor-pointer"
                        title="Edit Topic"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => t._id && handleDeleteTopic(t._id)}
                        className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                        title="Delete Topic"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Editor View matching light admin theme */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-3xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                {editingTopic._id ? 'Edit Ask Mito Topic Workflow' : 'Add New Ask Mito Topic Workflow'}
              </h2>
            </div>
            <button 
              onClick={() => setActiveTab('list')}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Title (Clean Text)</label>
                <input
                  type="text"
                  value={editingTopic.title}
                  onChange={e => setEditingTopic({ ...editingTopic, title: e.target.value })}
                  placeholder="e.g. Continuous Glucose Monitoring (CGM) Guide"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={editingTopic.category}
                  onChange={e => setEditingTopic({ ...editingTopic, category: e.target.value })}
                  placeholder="e.g. CGM, Fasting, Sleep, Nutrition, General"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Suggested User Prompt</label>
                <input
                  type="text"
                  value={editingTopic.suggestedPrompt}
                  onChange={e => setEditingTopic({ ...editingTopic, suggestedPrompt: e.target.value })}
                  placeholder="e.g. How do I read my CGM report?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={editingTopic.order}
                  onChange={e => setEditingTopic({ ...editingTopic, order: parseInt(e.target.value, 10) || 1 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Detailed Answer / Knowledge Base Content</label>
              <textarea
                value={editingTopic.answer}
                onChange={e => setEditingTopic({ ...editingTopic, answer: e.target.value })}
                rows={6}
                placeholder="Enter detailed, evidence-based answer content..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            {/* Keyword matching tags */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Matching Keywords (for AI intent matching)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }}
                  placeholder="Type keyword and press Enter (e.g. cgm, spikes, glucose)"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Add Keyword
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {editingTopic.keywords.map(kw => (
                  <span key={kw} className="inline-flex items-center gap-1 text-[11px] font-bold bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg shadow-2xs">
                    #{kw}
                    <button type="button" onClick={() => handleRemoveKeyword(kw)} className="text-slate-400 hover:text-rose-500 font-bold ml-1">✕</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTopic({ ...editingTopic, isActive: !editingTopic.isActive })}
                className="flex items-center gap-2 font-bold cursor-pointer"
              >
                {editingTopic.isActive ? <ToggleRight className="h-6 w-6 text-emerald-600" /> : <ToggleLeft className="h-6 w-6 text-slate-400" />}
                <span className={editingTopic.isActive ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                  {editingTopic.isActive ? 'Active & Published' : 'Disabled'}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTopic}
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Topic Workflow'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
