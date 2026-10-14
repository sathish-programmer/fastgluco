import React, { useState, useEffect } from 'react';
import {
  Store,
  RefreshCw,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface VendorsFulfilmentPageProps {
  apiUrl: string;
  token: string;
  onNavigateToOrder?: (orderId: string) => void;
}

export const VendorsFulfilmentPage: React.FC<VendorsFulfilmentPageProps> = ({
  apiUrl,
  token,
  onNavigateToOrder
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('all');
  const [submissionStatus, setSubmissionStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchVendorOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedVendorId !== 'all') params.append('vendorId', selectedVendorId);
      if (submissionStatus !== 'all') params.append('submissionStatus', submissionStatus);

      const res = await fetch(`${apiUrl}/admin/order-management/vendors/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        if (data.vendors) setVendors(data.vendors);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorOrders();
  }, [selectedVendorId, submissionStatus, apiUrl, token]);

  const handleRetrySubmission = async (orderId: string) => {
    setRetryingId(orderId);
    try {
      const res = await fetch(`${apiUrl}/admin/order-management/vendors/orders/${orderId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Submission retried.');
        fetchVendorOrders();
      } else {
        alert(data.message || 'Failed to retry submission.');
      }
    } catch (e: any) {
      alert(e.message || 'Error occurred');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Store className="h-5 w-5 text-emerald-600" /> Vendor Fulfilment & Dispatch Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor vendor orders (e.g. Arivu Foods), API submission logs, dispatch confirmations, and retry failed transmissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchVendorOrders}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 shadow-sm transition"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            Refresh
          </button>
        </div>
      </div>

      {/* Distinction Note */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <strong>Mito Reboot Store Orders:</strong> Verified native orders fulfilled directly by registered merchant partners like Arivu Foods.
            Amazon affiliate redirects are strictly managed separately and never counted as store revenue.
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400 uppercase text-[10px]">Filter Vendor:</span>
          <select
            value={selectedVendorId}
            onChange={e => setSelectedVendorId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Vendors</option>
            {vendors.map(v => (
              <option key={v._id} value={v._id}>{v.businessName || v.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400 uppercase text-[10px]">API Submission:</span>
          <select
            value={submissionStatus}
            onChange={e => setSubmissionStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none"
          >
            <option value="all">All API Statuses</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED (Needs Retry)</option>
            <option value="RETRY">RETRY</option>
            <option value="NOT_SUBMITTED">NOT_SUBMITTED</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Order Ref</th>
                <th className="py-3.5 px-4">Vendor Partner</th>
                <th className="py-3.5 px-4">Customer & City</th>
                <th className="py-3.5 px-4">Vendor API Submission</th>
                <th className="py-3.5 px-4">Fulfilment Status</th>
                <th className="py-3.5 px-4">Logistics / Tracking</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-semibold">
                    <div className="animate-spin h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2" />
                    Loading vendor pipeline...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No vendor orders matching selected criteria.</p>
                  </td>
                </tr>
              ) : (
                orders.map(order => {
                  const subStatus = order.vendorSubmissionStatus || 'NOT_SUBMITTED';
                  const isFailed = subStatus === 'FAILED' || subStatus === 'RETRY';
                  const isSubmitted = subStatus === 'SUBMITTED';

                  return (
                    <tr key={order._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4">
                        <span
                          onClick={() => onNavigateToOrder && onNavigateToOrder(order._id)}
                          className="font-mono font-bold text-primary hover:underline cursor-pointer"
                        >
                          {order.vendorOrderId || `#${order._id.slice(-6)}`}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {(order.vendorId as any)?.businessName || (order.vendorId as any)?.name || 'Direct'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{order.patientName || 'Customer'}</div>
                        <div className="text-[10px] text-slate-400">{order.shippingAddress?.city || 'India'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isSubmitted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isFailed
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isSubmitted ? <CheckCircle2 className="h-3 w-3" /> : isFailed ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {subStatus}
                        </span>
                        {order.vendorSubmissionError && (
                          <span className="block text-[9px] text-rose-600 mt-0.5 truncate max-w-[150px]" title={order.vendorSubmissionError}>
                            {order.vendorSubmissionError}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 uppercase font-bold text-[10px] text-slate-700">
                        {order.deliveryStatus || 'pending'}
                      </td>

                      <td className="py-3.5 px-4 text-[11px]">
                        {order.trackingDetails?.trackingId ? (
                          <span className="font-mono font-bold text-slate-700">
                            {order.trackingDetails.trackingId}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No Tracking</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-800">
                        ₹{order.totalAmount}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isFailed ? (
                          <button
                            onClick={() => handleRetrySubmission(order._id)}
                            disabled={retryingId === order._id}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[10px] transition disabled:opacity-50"
                          >
                            {retryingId === order._id ? 'Retrying...' : 'Retry Dispatch'}
                          </button>
                        ) : (
                          <button
                            onClick={() => onNavigateToOrder && onNavigateToOrder(order._id)}
                            className="text-primary hover:underline text-[11px] font-bold"
                          >
                            View Order
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
