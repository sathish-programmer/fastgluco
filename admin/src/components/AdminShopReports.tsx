import React, { useState, useEffect } from 'react';
import { ShoppingBag, BarChart3, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

interface AdminShopReportsProps {
  apiUrl: string;
  token: string;
}

export const AdminShopReports: React.FC<AdminShopReportsProps> = ({ apiUrl, token }) => {
  const [reportsData, setReportsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = `${apiUrl}/admin/shop-reports`;
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReportsData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Date Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-500" /> Shop Reports & Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Visualize sales numbers, category distribution, and fulfillment stats</p>
        </div>

        <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-2 items-center bg-white p-2 border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-1">From</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="text-xs bg-slate-50 border-0 rounded-xl p-1.5 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-1">To</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="text-xs bg-slate-50 border-0 rounded-xl p-1.5 focus:outline-none"
            />
          </div>
          <button 
            type="submit"
            className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : !reportsData ? (
        <div className="bg-white border border-slate-250 rounded-3xl p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
          <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
          No report summary data could be fetched.
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Sales Volume</span>
              <span className="text-2xl font-black text-slate-800">{reportsData.summary?.totalOrdersCount} orders</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
              <span className="text-2xl font-black text-indigo-700">Rs.{reportsData.summary?.totalRevenue.toFixed(2)}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tax Collected</span>
              <span className="text-2xl font-black text-slate-800">Rs.{reportsData.summary?.totalGST.toFixed(2)}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Discounts Availed</span>
              <span className="text-2xl font-black text-rose-500">Rs.{reportsData.summary?.totalDiscounts.toFixed(2)}</span>
            </div>

          </div>

          {/* Double Column details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Top Products & categories */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Top Products Table */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-xs text-slate-850 flex items-center gap-1.5 uppercase tracking-widest">
                  <TrendingUp className="h-4 w-4 text-emerald-500" /> Top 5 Selling Products
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-450 border-b border-slate-100 text-left font-bold">
                        <th className="pb-2">Product Name</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2 text-center">Qty Sold</th>
                        <th className="pb-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportsData.topSellingProducts?.map((p: any, idx: number) => (
                        <tr key={idx} className="text-slate-655">
                          <td className="py-2.5 font-bold text-slate-800">{p.name}</td>
                          <td className="py-2.5">{p.category}</td>
                          <td className="py-2.5 text-center font-bold bg-slate-50 rounded-lg">{p.qty}</td>
                          <td className="py-2.5 text-right font-bold text-indigo-650">Rs.{p.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                      {(!reportsData.topSellingProducts || reportsData.topSellingProducts.length === 0) && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-slate-400 italic">No products sold in this duration.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Monthly Revenue logs */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-xs text-slate-850 flex items-center gap-1.5 uppercase tracking-widest">
                  <Calendar className="h-4 w-4 text-indigo-500" /> Monthly Revenue Breakdown (Current Year)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {reportsData.monthlyRevenue?.map((m: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">{m.month}</span>
                      <span className="text-xs font-black text-indigo-650">Rs.{m.revenue.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right column: Status Counts & Vendor lists */}
            <div className="space-y-6">
              
              {/* Order Delivery Status Counts */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-xs text-slate-850 flex items-center gap-1.5 uppercase tracking-widest">
                  <ShoppingBag className="h-4 w-4 text-indigo-500" /> Order Fulfillment Status
                </h3>
                <div className="space-y-2 text-xs">
                  {Object.entries(reportsData.statusCounts || {}).map(([status, count]: any) => (
                    <div key={status} className="flex justify-between items-center py-1">
                      <span className="capitalize font-semibold text-slate-600">{status}</span>
                      <span className="bg-slate-100 font-bold px-2 py-0.5 rounded-full text-slate-700">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category-wise Sales volume */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-xs text-slate-850 uppercase tracking-widest block">Sales by Category</h3>
                <div className="space-y-2.5 text-xs text-slate-655">
                  {reportsData.topCategories?.map((c: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="font-semibold">{c.name}</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{c.qty} sold</span>
                    </div>
                  ))}
                  {(!reportsData.topCategories || reportsData.topCategories.length === 0) && (
                    <p className="text-slate-400 italic py-2 text-center">No categories mapped.</p>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Row: Vendor Performance Reports */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-slate-850 uppercase tracking-widest">Vendor Partner Performance Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 text-left font-bold">
                    <th className="pb-2">Vendor Name</th>
                    <th className="pb-2">Business Name</th>
                    <th className="pb-2 text-center">Assigned</th>
                    <th className="pb-2 text-center">Completed</th>
                    <th className="pb-2 text-center">Cancelled</th>
                    <th className="pb-2 text-right">Revenue Fulfilled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-650">
                  {reportsData.vendorReports?.map((v: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-bold text-slate-800">{v.name}</td>
                      <td className="py-2.5 font-semibold">{v.businessName || 'N/A'}</td>
                      <td className="py-2.5 text-center font-bold">{v.assigned}</td>
                      <td className="py-2.5 text-center font-bold text-emerald-600">{v.completed}</td>
                      <td className="py-2.5 text-center font-bold text-red-500">{v.cancelled}</td>
                      <td className="py-2.5 text-right font-bold text-indigo-650">Rs.{v.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!reportsData.vendorReports || reportsData.vendorReports.length === 0) && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400 italic font-semibold">No vendor partner records mapped.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
