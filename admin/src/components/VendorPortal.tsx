import React, { useState, useEffect } from 'react';
import { Package, Truck, LogOut } from 'lucide-react';

interface VendorPortalProps {
  apiUrl: string;
  token: string;
  onLogout: () => void;
}

export const VendorPortal: React.FC<VendorPortalProps> = ({ apiUrl, token, onLogout }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<'accepted' | 'packed' | 'shipped' | 'delivered' | 'cancelled'>('accepted');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${apiUrl}/vendor/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setOrders(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingOrderId) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/vendor/orders/${updatingOrderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ deliveryStatus })
      });
      if (res.ok) {
        setUpdatingOrderId(null);
        fetchOrders();
      } else {
        alert('Error updating order status');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'packed': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'accepted': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-primary text-xl font-bold">🚚 Vendor Logistics Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onLogout} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 flex items-center gap-1 text-sm font-bold">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-500" /> Assigned Fulfillment Orders
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map(order => (
              <div key={order._id} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-mono text-slate-800 text-xs font-bold">Order ID: {order._id}</h4>
                    <p className="text-[10px] text-slate-400 font-mono tracking-wide mt-0.5">Assigned to me</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${getStatusColor(order.deliveryStatus)}`}>
                    {order.deliveryStatus || 'pending'}
                  </span>
                </div>

                <div className="space-y-1">
                  {order.products.map((p: any, idx: number) => (
                    <div key={idx} className="text-xs text-slate-600 font-semibold">
                      {p.name} <span className="text-slate-400">x{p.qty}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">Shipping Address: Local Area Delivery</span>
                  <button
                    onClick={() => {
                      setUpdatingOrderId(order._id);
                      setDeliveryStatus(order.deliveryStatus || 'accepted');
                    }}
                    className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold shadow-sm transition-all"
                  >
                    Update Shipment Status
                  </button>
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6 col-span-2">No pending assignments found.</p>
            )}
          </div>
        </div>
      </main>

      {/* Status updates modal */}
      {updatingOrderId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 border border-slate-100 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-indigo-500" /> Update Order Status
            </h3>
            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Fulfillment Step</label>
                <select
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 font-bold"
                >
                  <option value="accepted">Accepted</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setUpdatingOrderId(null)} className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold text-slate-600">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-50">Save Status</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
