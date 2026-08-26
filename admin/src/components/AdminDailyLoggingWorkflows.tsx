import React, { useState, useEffect } from 'react';
import { 
  Bot, Plus, Trash2, Edit2, Check, ArrowUp, ArrowDown, ToggleLeft, ToggleRight
} from 'lucide-react';

interface WorkflowStep {
  stepId: string;
  title: string;
  questionPrompt: string;
  inputType: 'YES_NO' | 'OPTIONS' | 'NUMBER' | 'TEXT' | 'FILE';
  options?: string[];
  order: number;
  isEnabled: boolean;
}

interface Workflow {
  _id?: string;
  name: string;
  targetMode: 'STANDARD' | 'CANCER_PATIENT' | 'ALL';
  isActive: boolean;
  steps: WorkflowStep[];
}

interface AdminDailyLoggingWorkflowsProps {
  apiUrl: string;
  token: string;
}

const AVAILABLE_STEP_TYPES = [
  { id: 'stress', name: 'Stress Check', defaultPrompt: 'Did you experience high stress or emotional strain today?' },
  { id: 'sleep', name: 'Sleep Duration', defaultPrompt: 'How many hours of sleep did you get last night?' },
  { id: 'smoking', name: 'Alcohol & Smoking Exposure', defaultPrompt: 'Did you consume alcohol or smoke today?' },
  { id: 'damage_habits', name: 'Damage Habits Check', defaultPrompt: 'Did you have any high-glycemic snacks or late-night meals today?' },
  { id: 'repair_habits', name: 'Cellular Repair Check', defaultPrompt: 'Did you complete your daily walk, fasting window, or hydration goal today?' },
  { id: 'report_upload', name: 'CGM / Lab Report Upload', defaultPrompt: 'Do you have a new CGM report or lab test PDF to upload today?' }
];

export const AdminDailyLoggingWorkflows: React.FC<AdminDailyLoggingWorkflowsProps> = ({ apiUrl, token }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow>({
    name: 'Default AI Daily Check-in Workflow',
    targetMode: 'ALL',
    isActive: true,
    steps: []
  });

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/daily-logging-workflows`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
      }
    } catch (err) {
      console.error('Error fetching workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleCreateNew = () => {
    setEditingWorkflow({
      name: 'New Custom Logging Workflow',
      targetMode: 'ALL',
      isActive: true,
      steps: AVAILABLE_STEP_TYPES.map((st, idx) => ({
        stepId: st.id,
        title: st.name,
        questionPrompt: st.defaultPrompt,
        inputType: st.id === 'sleep' ? 'NUMBER' : 'YES_NO',
        options: st.id === 'sleep' ? [] : ['No', 'Yes'],
        order: idx + 1,
        isEnabled: true
      }))
    });
    setActiveTab('editor');
  };

  const handleEdit = (wf: Workflow) => {
    setEditingWorkflow({ ...wf });
    setActiveTab('editor');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isUpdate = !!editingWorkflow._id;
      const url = isUpdate 
        ? `${apiUrl}/admin/daily-logging-workflows/${editingWorkflow._id}`
        : `${apiUrl}/admin/daily-logging-workflows`;
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingWorkflow)
      });

      if (res.ok) {
        alert(`Workflow ${isUpdate ? 'updated' : 'created'} successfully!`);
        fetchWorkflows();
        setActiveTab('list');
      } else {
        alert('Failed to save workflow.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving workflow.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      const res = await fetch(`${apiUrl}/admin/daily-logging-workflows/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchWorkflows();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const updatedSteps = [...editingWorkflow.steps];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updatedSteps.length) return;
    const temp = updatedSteps[index];
    updatedSteps[index] = updatedSteps[targetIdx];
    updatedSteps[targetIdx] = temp;
    // Re-assign order values
    updatedSteps.forEach((s, i) => s.order = i + 1);
    setEditingWorkflow({ ...editingWorkflow, steps: updatedSteps });
  };

  const updateStep = (index: number, key: keyof WorkflowStep, val: any) => {
    const updatedSteps = [...editingWorkflow.steps];
    updatedSteps[index] = { ...updatedSteps[index], [key]: val };
    setEditingWorkflow({ ...editingWorkflow, steps: updatedSteps });
  };

  const addCustomStep = () => {
    const newStep: WorkflowStep = {
      stepId: `custom_${Date.now()}`,
      title: 'Custom Check-in Step',
      questionPrompt: 'How are you feeling overall today?',
      inputType: 'YES_NO',
      options: ['Good', 'Needs Improvement'],
      order: editingWorkflow.steps.length + 1,
      isEnabled: true
    };
    setEditingWorkflow({
      ...editingWorkflow,
      steps: [...editingWorkflow.steps, newStep]
    });
  };

  const removeStep = (index: number) => {
    const updatedSteps = editingWorkflow.steps.filter((_, i) => i !== index);
    updatedSteps.forEach((s, i) => s.order = i + 1);
    setEditingWorkflow({ ...editingWorkflow, steps: updatedSteps });
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading AI Workflows...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            AI Daily Check-in Workflows
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Configure the automated step-by-step chatbot sequence for daily user habit logging & report check-ins.
          </p>
        </div>
        {activeTab === 'list' && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-primary-dark transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Workflow
          </button>
        )}
      </div>

      {/* List View */}
      {activeTab === 'list' && (
        <div className="grid gap-4">
          {workflows.map((wf) => (
            <div
              key={wf._id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-800">{wf.name}</h3>
                  {wf.isActive ? (
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Inactive
                    </span>
                  )}
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {wf.targetMode}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  {wf.steps.filter(s => s.isEnabled).length} active logging steps configured in sequence.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {wf.steps.map((st, i) => (
                    <span key={i} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {i + 1}. {st.title}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleEdit(wf)}
                  className="p-2 text-slate-600 hover:text-primary hover:bg-slate-50 rounded-xl transition-all"
                  title="Edit Workflow"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                {wf._id && (
                  <button
                    onClick={() => handleDelete(wf._id!)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    title="Delete Workflow"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor View */}
      {activeTab === 'editor' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Workflow General Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Workflow Title</label>
                <input
                  required
                  type="text"
                  value={editingWorkflow.name}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-primary"
                  placeholder="e.g. Daily Cancer Patient Check-in Flow"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Target Patient Mode</label>
                <select
                  value={editingWorkflow.targetMode}
                  onChange={(e: any) => setEditingWorkflow({ ...editingWorkflow, targetMode: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-primary"
                >
                  <option value="ALL">ALL (Standard & Cancer Patients)</option>
                  <option value="STANDARD">STANDARD (Glucose & Metabolic Track)</option>
                  <option value="CANCER_PATIENT">CANCER_PATIENT (Oncology Focus)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="text-xs font-bold uppercase text-slate-500">Active Status:</label>
              <button
                type="button"
                onClick={() => setEditingWorkflow({ ...editingWorkflow, isActive: !editingWorkflow.isActive })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                  editingWorkflow.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {editingWorkflow.isActive ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5" />}
                {editingWorkflow.isActive ? 'Active Workflow' : 'Inactive'}
              </button>
            </div>
          </div>

          {/* Sequence Steps */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Configured Logging Sequence</h3>
                <p className="text-xs text-slate-500 mt-0.5">The chatbot will ask these questions in exact order.</p>
              </div>
              <button
                type="button"
                onClick={addCustomStep}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-bold text-xs transition-all"
              >
                <Plus className="h-4 w-4" /> Add Step
              </button>
            </div>

            <div className="space-y-3">
              {editingWorkflow.steps.map((step, idx) => (
                <div
                  key={step.stepId || idx}
                  className={`p-4 rounded-xl border transition-all ${
                    step.isEnabled ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary text-white font-black text-xs h-6 w-6 rounded-full flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => updateStep(idx, 'title', e.target.value)}
                        className="font-bold text-sm text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary focus:outline-none px-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveStep(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(idx, 'down')}
                        disabled={idx === editingWorkflow.steps.length - 1}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStep(idx, 'isEnabled', !step.isEnabled)}
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                          step.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {step.isEnabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">AI Chat Prompt Question</label>
                      <textarea
                        rows={2}
                        value={step.questionPrompt}
                        onChange={(e) => updateStep(idx, 'questionPrompt', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Input Response Type</label>
                      <select
                        value={step.inputType}
                        onChange={(e: any) => updateStep(idx, 'inputType', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-primary mb-2"
                      >
                        <option value="YES_NO">YES_NO (Quick Choice)</option>
                        <option value="NUMBER">NUMBER (e.g. Hours)</option>
                        <option value="OPTIONS">OPTIONS (Custom Buttons)</option>
                        <option value="TEXT">TEXT (Free Response)</option>
                        <option value="FILE">FILE (Report Upload Trigger)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-primary hover:bg-primary-dark shadow-sm transition-all disabled:opacity-50"
            >
              {saving ? 'Saving Workflow...' : 'Save & Activate Workflow'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
