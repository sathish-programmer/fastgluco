import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Package } from 'lucide-react';

interface ShopOrdersHistoryScreenProps {
  onBack?: () => void;
}

export const ShopOrdersHistoryScreen: React.FC<ShopOrdersHistoryScreenProps> = ({ onBack }) => {
  const { apiUrl, token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${apiUrl}/patient/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'packed': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'accepted': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'assigned': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Shop</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">Order History</h2>
        </div>
        {onBack && (
          <button onClick={onBack} className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-bold text-slate-500">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-700">No orders placed yet</h3>
          <p className="text-xs text-slate-400 mt-1">Visit the shop to browse products and build healthy habits.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Order ID</span>
                  <span className="text-xs font-mono font-bold text-slate-700">{order._id}</span>
                </div>
                <div className="flex gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border uppercase tracking-wider ${getStatusColor(order.deliveryStatus)}`}>
                    {order.deliveryStatus || 'pending'}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border uppercase tracking-wider ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    Payment: {order.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {order.products.map((p: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">{p.name} <span className="text-slate-400 font-normal">x{p.qty}</span></span>
                    <span className="font-semibold text-slate-600">{order.currency === 'USD' ? '$' : '₹'}{(p.price * p.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Status Tracker */}
              {order.deliveryStatus !== 'cancelled' && (
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Real-time Tracker</span>
                  <div className="flex justify-between items-center relative">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 -z-10"></div>
                    
                    {/* Status Steps */}
                    <div className="flex flex-col items-center">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 text-[10px] font-bold ${['assigned', 'accepted', 'packed', 'shipped', 'delivered'].includes(order.deliveryStatus) ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-white border-slate-300 text-slate-400'}`}>✓</div>
                      <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Assigned</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 text-[10px] font-bold ${['accepted', 'packed', 'shipped', 'delivered'].includes(order.deliveryStatus) ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-white border-slate-300 text-slate-400'}`}>✓</div>
                      <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Accepted</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 text-[10px] font-bold ${['packed', 'shipped', 'delivered'].includes(order.deliveryStatus) ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-white border-slate-300 text-slate-400'}`}>✓</div>
                      <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Packed</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 text-[10px] font-bold ${['shipped', 'delivered'].includes(order.deliveryStatus) ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-white border-slate-300 text-slate-400'}`}>✓</div>
                      <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Shipped</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 text-[10px] font-bold ${order.deliveryStatus === 'delivered' ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-white border-slate-300 text-slate-400'}`}>✓</div>
                      <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Delivered</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-sm">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">Total paid</span>
                <span className="text-lg font-black text-slate-800">{order.currency === 'USD' ? '$' : '₹'}{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
