import React, { useEffect, useState } from 'react';
import { BarChart3, Filter, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  funnel: {
    totalGenerated: number;
    totalViewed: number;
    totalClicked: number;
    totalBooked: number;
    totalCompleted: number;
    totalCancelled: number;
  };
  byModule: Array<{
    _id: string;
    generated: number;
    booked: number;
    completed: number;
  }>;
}

interface ConsultationAnalyticsProps {
  apiUrl: string;
  token: string;
}

export const ConsultationAnalytics: React.FC<ConsultationAnalyticsProps> = ({ apiUrl, token }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/consultations/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center text-rose-500">Error loading data.</div>;

  const funnelData = [
    { name: 'Generated', count: data.funnel.totalGenerated, fill: '#cbd5e1' },
    { name: 'Viewed', count: data.funnel.totalViewed, fill: '#94a3b8' },
    { name: 'Clicked', count: data.funnel.totalClicked, fill: '#64748b' },
    { name: 'Booked', count: data.funnel.totalBooked, fill: '#3b82f6' },
    { name: 'Completed', count: data.funnel.totalCompleted, fill: '#10b981' }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-500" />
          Consultation Engine Analytics
        </h2>
        <p className="text-xs text-slate-500 mt-1">Funnel metrics and module performance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Generated', value: data.funnel.totalGenerated, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Viewed', value: data.funnel.totalViewed, color: 'text-slate-700', bg: 'bg-slate-100' },
          { label: 'Clicked', value: data.funnel.totalClicked, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Booked', value: data.funnel.totalBooked, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed', value: data.funnel.totalCompleted, color: 'text-emerald-600', bg: 'bg-emerald-50' }
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} p-4 rounded-2xl border border-slate-100`}>
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{stat.label}</span>
            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-slate-200 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            Conversion Funnel
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-slate-400" />
            Performance by Module
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] text-slate-400 uppercase font-bold border-b border-slate-100">
                <tr>
                  <th className="pb-3">Module</th>
                  <th className="pb-3 text-right">Generated</th>
                  <th className="pb-3 text-right">Booked</th>
                  <th className="pb-3 text-right">Completed</th>
                  <th className="pb-3 text-right">Conv. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.byModule.map((mod, i) => {
                  const rate = mod.generated > 0 ? ((mod.booked / mod.generated) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={i} className="text-slate-600 font-medium">
                      <td className="py-3 font-bold text-slate-700">{mod._id}</td>
                      <td className="py-3 text-right">{mod.generated}</td>
                      <td className="py-3 text-right text-blue-600">{mod.booked}</td>
                      <td className="py-3 text-right text-emerald-600">{mod.completed}</td>
                      <td className="py-3 text-right">{rate}%</td>
                    </tr>
                  );
                })}
                {data.byModule.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">No module data available yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
