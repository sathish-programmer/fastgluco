import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  TrendingUp,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  AlertTriangle,
  CreditCard,
  MessageSquare,
  RefreshCw,
  ArrowUpRight,
  ChevronRight,
  Store,
  DollarSign
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface OrderOverviewPageProps {
  apiUrl: string;
  token: string;
  onNavigateToTab: (tabId: string, filterState?: any) => void;
}

export const OrderOverviewPage: React.FC<OrderOverviewPageProps> = ({
  apiUrl,
  token,
  onNavigateToTab
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/admin/order-management/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error loading order overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [apiUrl, token]);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-200 rounded-3xl"></div>
          <div className="h-72 bg-slate-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-rose-800">Failed to load Order Overview</h3>
          <p className="text-xs text-rose-600 mt-1">{error || 'Server error'}</p>
          <button
            onClick={fetchOverview}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { summary, charts, topSellingProducts, topVendors, recentOrders, recentComplaints, ordersRequiringAttention } = data;

  const statCards = [
    {
      title: 'Total Orders',
      value: summary.totalOrders,
      badge: 'All Time',
      icon: ShoppingCart,
      color: 'blue',
      onClick: () => onNavigateToTab('orders', {})
    },
    {
      title: 'Orders Placed Today',
      value: summary.ordersToday,
      badge: 'Today',
      icon: Clock,
      color: 'indigo',
      onClick: () => onNavigateToTab('orders', { dateRange: 'today' })
    },
    {
      title: 'Orders This Month',
      value: summary.ordersThisMonth,
      badge: 'This Month',
      icon: TrendingUp,
      color: 'cyan',
      onClick: () => onNavigateToTab('orders', { dateRange: 'this_month' })
    },
    {
      title: 'Gross Order Value',
      value: `₹${(summary.grossOrderValue || 0).toLocaleString('en-IN')}`,
      badge: 'Verified Paid',
      icon: CreditCard,
      color: 'emerald',
      onClick: () => onNavigateToTab('orders', { paymentStatus: 'paid' })
    },
    {
      title: 'Net Sales After Refunds',
      value: `₹${(summary.netSalesAfterRefunds || 0).toLocaleString('en-IN')}`,
      badge: 'Net Revenue',
      icon: DollarSign,
      color: 'emerald',
      onClick: () => onNavigateToTab('reports', {})
    },
    {
      title: 'Pending Payments',
      value: summary.pendingPayments,
      badge: 'Unpaid/Awaiting',
      icon: Clock,
      color: 'amber',
      onClick: () => onNavigateToTab('orders', { paymentStatus: 'pending' })
    },
    {
      title: 'Paid Orders',
      value: summary.paidOrders,
      badge: 'Completed',
      icon: CheckCircle2,
      color: 'emerald',
      onClick: () => onNavigateToTab('orders', { paymentStatus: 'paid' })
    },
    {
      title: 'Awaiting Processing',
      value: summary.ordersAwaitingProcessing,
      badge: 'Action Needed',
      icon: Package,
      color: 'amber',
      onClick: () => onNavigateToTab('orders', { deliveryStatus: 'pending' })
    },
    {
      title: 'Shipped & Delivered',
      value: (summary.ordersShipped || 0) + (summary.ordersDelivered || 0),
      badge: `${summary.ordersDelivered} Delivered`,
      icon: Truck,
      color: 'teal',
      onClick: () => onNavigateToTab('orders', { deliveryStatus: 'delivered' })
    },
    {
      title: 'Cancelled Orders',
      value: summary.cancelledOrders,
      badge: 'Cancelled/Failed',
      icon: XCircle,
      color: 'rose',
      onClick: () => onNavigateToTab('orders', { deliveryStatus: 'cancelled' })
    },
    {
      title: 'Refund Requests Pending',
      value: summary.refundsPendingCount,
      badge: 'Review Pending',
      icon: RotateCcw,
      color: 'orange',
      onClick: () => onNavigateToTab('refunds', {})
    },
    {
      title: 'Refunds Completed',
      value: `₹${(summary.totalRefundsCompleted || 0).toLocaleString('en-IN')}`,
      badge: `${summary.refundsCompletedCount} orders`,
      icon: CheckCircle2,
      color: 'purple',
      onClick: () => onNavigateToTab('refunds', {})
    },
    {
      title: 'Open Support Tickets',
      value: summary.openSupportTickets,
      badge: 'Customer Help',
      icon: MessageSquare,
      color: 'rose',
      onClick: () => onNavigateToTab('support', { status: 'Open' })
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'emerald':
        return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', hover: 'hover:border-emerald-300' };
      case 'rose':
        return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', hover: 'hover:border-rose-300' };
      case 'amber':
        return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', hover: 'hover:border-amber-300' };
      case 'orange':
        return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', hover: 'hover:border-orange-300' };
      case 'teal':
        return { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', hover: 'hover:border-teal-300' };
      case 'purple':
        return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', hover: 'hover:border-purple-300' };
      case 'cyan':
        return { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100', hover: 'hover:border-cyan-300' };
      default:
        return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', hover: 'hover:border-blue-300' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Order & Fulfilment Overview
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Database Metrics
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime order pipeline, revenue breakdown, refund balances, and priority alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOverview}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            Refresh
          </button>
          <button
            onClick={() => onNavigateToTab('orders', {})}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white hover:bg-primary-dark rounded-xl text-xs font-bold transition shadow-sm shadow-primary/20"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Manage All Orders
          </button>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {statCards.map((card, idx) => {
          const c = getColorClasses(card.color);
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.onClick}
              className={`bg-white rounded-2xl p-4 border border-slate-200 shadow-sm transition-all cursor-pointer hover:shadow-md ${c.hover} group`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-[130px]">
                  {card.title}
                </span>
                <span className={`p-1.5 rounded-lg ${c.bg} ${c.text}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-lg font-black text-slate-800 tracking-tight group-hover:text-primary transition-colors">
                {card.value}
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-semibold">{card.badge}</span>
                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Required Alert Banner */}
      {ordersRequiringAttention && ordersRequiringAttention.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                Orders Requiring Admin Attention ({ordersRequiringAttention.length})
              </h3>
            </div>
            <span className="text-[11px] text-amber-700 font-semibold">Immediate Action Recommended</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {ordersRequiringAttention.map((ord: any) => {
              const reason = ord.cancellationRequest?.status === 'PENDING'
                ? 'Cancellation Requested'
                : ord.vendorSubmissionStatus === 'FAILED'
                ? 'Vendor API Sync Failed'
                : ord.status === 'pending'
                ? 'Pending Payment >2h'
                : 'Processing Delay >24h';

              return (
                <div
                  key={ord._id}
                  onClick={() => onNavigateToTab('orders', { search: ord.vendorOrderId || ord._id })}
                  className="bg-white p-3 rounded-xl border border-amber-200 hover:border-amber-400 cursor-pointer shadow-sm transition"
                >
                  <div className="flex justify-between items-start text-xs font-bold text-slate-800">
                    <span className="text-primary font-mono">{ord.vendorOrderId || `#${ord._id.slice(-6)}`}</span>
                    <span className="text-slate-900 font-bold">₹{ord.totalAmount}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    {ord.patientName || 'Customer'}
                  </div>
                  <div className="mt-2 text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded inline-block">
                    {reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Order Volume & Revenue Trend</h3>
              <p className="text-[11px] text-slate-400">Past 7 Days daily sales stream</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span> Revenue (₹)
              </span>
              <span className="flex items-center gap-1.5 text-teal-600">
                <span className="h-2 w-2 rounded-full bg-teal-500"></span> Orders
              </span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.last7Days || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    name === 'revenue' ? `₹${val.toLocaleString('en-IN')}` : val,
                    name === 'revenue' ? 'Revenue' : 'Orders Placed'
                  ]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="orders" stroke="#14B8A6" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Fulfilment Distribution</h3>
            <p className="text-[11px] text-slate-400 mb-4">Breakdown by current order state</p>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts?.orderStatusDistribution || []}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {(charts?.orderStatusDistribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-[11px]">
            {(charts?.orderStatusDistribution || []).map((entry: any, index: number) => (
              <div
                key={index}
                onClick={() => onNavigateToTab('orders', { deliveryStatus: entry.name.toLowerCase() })}
                className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                  {entry.name}
                </span>
                <span className="font-bold text-slate-800">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Sellers & Top Vendors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Top-Selling Health Products
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">By Quantity Sold</span>
          </div>

          <div className="space-y-3">
            {(topSellingProducts || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No completed product sales recorded yet.</p>
            ) : (
              (topSellingProducts || []).map((prod: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-400 w-5">#{idx + 1}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{prod.name}</h4>
                      <p className="text-[10px] text-slate-400">{prod.qty} units fulfilled</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-600">
                    ₹{prod.revenue?.toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Vendors */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Store className="h-4 w-4 text-emerald-600" /> Top-Performing Vendors
            </h3>
            <button
              onClick={() => onNavigateToTab('vendors', {})}
              className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1"
            >
              Vendor Pipeline <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {(topVendors || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No integrated vendors found.</p>
            ) : (
              (topVendors || []).map((v: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-400 w-5">#{idx + 1}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{v.name}</h4>
                      <p className="text-[10px] text-slate-400">{v.totalOrders} total • {v.deliveredOrders} delivered</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-800">
                    ₹{v.revenue?.toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders & Customer Support Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Recent Customer Orders</h3>
            <button
              onClick={() => onNavigateToTab('orders', {})}
              className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {(recentOrders || []).map((o: any) => (
              <div
                key={o._id}
                onClick={() => onNavigateToTab('orders', { search: o.vendorOrderId || o._id })}
                className="p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 cursor-pointer transition flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-800">{o.vendorOrderId || `#${o._id.slice(-6)}`}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      o.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {o.status === 'completed' ? 'Paid' : o.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600">
                      {o.deliveryStatus || 'pending'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    {o.patientName || 'Customer'} • {(o.products || []).length} item(s)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-slate-800">₹{o.totalAmount}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Support Complaints */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Recent Customer Inquiries</h3>
            <button
              onClick={() => onNavigateToTab('support', {})}
              className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1"
            >
              Open Inbox <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {(recentComplaints || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No open customer complaints.</p>
            ) : (
              (recentComplaints || []).map((t: any) => (
                <div
                  key={t._id}
                  onClick={() => onNavigateToTab('support', { search: t.name || t.email })}
                  className="p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">{t.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      t.status === 'Open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1 font-medium">{t.question}</p>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>{t.email}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
