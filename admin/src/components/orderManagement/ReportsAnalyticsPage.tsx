import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Package,
  RefreshCw
} from 'lucide-react';

interface ReportsAnalyticsPageProps {
  apiUrl: string;
  token: string;
}

export const ReportsAnalyticsPage: React.FC<ReportsAnalyticsPageProps> = ({ apiUrl, token }) => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`${apiUrl}/admin/order-management/analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
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

  useEffect(() => {
    fetchReports();
  }, [period, startDate, endDate, apiUrl, token]);

  const kpis = data?.kpis || {};
  const topProducts = data?.topProducts || [];

  return (
    <div className="space-y-6">
      {/* Top Bar with Time Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Business Growth Reports & Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified database financial summaries, tax collection, net sales, refund deductions, and customer retention.
          </p>
        </div>

        {/* Time filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            {(['day', 'week', 'month', 'quarter', 'year', 'custom'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-xl capitalize transition ${
                  period === p ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={fetchReports}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition shadow-sm"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Custom Date Picker Bar */}
      {period === 'custom' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 text-xs">
          <span className="font-bold text-slate-500">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus:outline-none"
          />
          <span className="font-bold text-slate-500">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus:outline-none"
          />
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-slate-400 font-bold">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          Calculating metrics...
        </div>
      ) : (
        <>
          {/* Financial KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Gross Order Value
              </span>
              <p className="text-2xl font-black text-slate-800 mt-1">
                ₹{(kpis.grossOrderValue || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {kpis.successfulPayments || 0} paid orders
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Net Sales After Refunds
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                ₹{(kpis.netSalesAfterRefunds || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-emerald-700/80 mt-0.5 block">
                After ₹{kpis.totalRefunds || 0} refunds
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Taxes Collected (GST)
              </span>
              <p className="text-2xl font-black text-blue-600 mt-1">
                ₹{(kpis.totalTaxes || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Verified collected</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Average Order Value (AOV)
              </span>
              <p className="text-2xl font-black text-purple-600 mt-1">
                ₹{(kpis.aov || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Per paid basket</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Discounts Given
              </span>
              <p className="text-2xl font-black text-amber-600 mt-1">
                ₹{(kpis.totalDiscounts || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Coupons & offers</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Cancellation Rate
              </span>
              <p className="text-2xl font-black text-rose-600 mt-1">
                {kpis.cancellationRate || 0}%
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Of total bookings</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Repeat Customer Rate
              </span>
              <p className="text-2xl font-black text-teal-600 mt-1">
                {kpis.repeatCustomerRate || 0}%
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {kpis.repeatCustomers || 0} repeat buyers
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Support Tickets
              </span>
              <p className="text-2xl font-black text-indigo-600 mt-1">
                {kpis.supportTicketVolume || 0}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {kpis.resolvedTicketsCount || 0} resolved • {kpis.otpSupportIssues || 0} OTP issues
              </span>
            </div>
          </div>

          {/* Product Sales Leaderboard */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Product Performance in Selected Period
            </h3>

            <div className="divide-y divide-slate-100">
              {topProducts.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No product data for this period.</p>
              ) : (
                topProducts.map((p: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-400 w-6">#{idx + 1}</span>
                      <span className="font-bold text-slate-800">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-slate-500 font-medium">{p.qty} units</span>
                      <span className="font-black text-slate-800 w-24 text-right">
                        ₹{(p.revenue || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
