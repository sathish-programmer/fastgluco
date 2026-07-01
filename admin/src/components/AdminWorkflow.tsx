import React, { useState, useEffect } from 'react';

interface AdminWorkflowProps {
  apiUrl: string;
  token: string;
}

export const AdminWorkflow: React.FC<AdminWorkflowProps> = ({ apiUrl, token }) => {
  const [config, setConfig] = useState({ systemPrompt: '', firstMessage: '', whatsappNumber: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/workflow-config/SexualHealth`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/admin/workflow-config/SexualHealth`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        alert('Workflow configuration saved successfully!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Sexual Health AI Chat Workflow</h2>
        <p className="text-xs text-slate-500 mt-1">Configure the AI bot persona and Doctor's WhatsApp connection</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">AI System Prompt (Bot Personality & Rules)</label>
            <p className="text-xs text-slate-500 mb-2">Instructions for how the AI should ask questions before redirecting.</p>
            <textarea 
              required 
              value={config.systemPrompt} 
              onChange={e => setConfig({...config, systemPrompt: e.target.value})} 
              className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono text-slate-700 bg-slate-50 focus:bg-white" 
              rows={6}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Bot's First Message</label>
            <input 
              required 
              value={config.firstMessage} 
              onChange={e => setConfig({...config, firstMessage: e.target.value})} 
              className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Doctor's WhatsApp Number</label>
            <p className="text-xs text-slate-500 mb-2">The number the user will be redirected to (include country code, e.g. 919876543210)</p>
            <input 
              required 
              type="tel"
              value={config.whatsappNumber} 
              onChange={e => setConfig({...config, whatsappNumber: e.target.value})} 
              className="w-full border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800" 
              placeholder="e.g. 919876543210"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button type="submit" disabled={saving} className="bg-primary text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 transition-all shadow-sm">
              {saving ? 'Saving...' : 'Save Workflow Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
