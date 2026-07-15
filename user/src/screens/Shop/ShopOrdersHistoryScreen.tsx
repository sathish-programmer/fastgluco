import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Package, Truck, Download, Calendar } from 'lucide-react';

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
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-150';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-150';
      case 'out_for_delivery':
      case 'out for delivery': return 'bg-cyan-50 text-cyan-600 border-cyan-150';
      case 'packed': return 'bg-indigo-50 text-indigo-650 border-indigo-150';
      case 'accepted': return 'bg-purple-50 text-purple-650 border-purple-150';
      case 'assigned': return 'bg-amber-50 text-amber-600 border-amber-150';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-155';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getFulfillmentSteps = (currentStatus?: string) => {
    const steps = [
      { key: 'placed', label: 'Order Placed' },
      { key: 'assigned', label: 'Vendor Assigned' },
      { key: 'accepted', label: 'Accepted' },
      { key: 'packed', label: 'Packed' },
      { key: 'shipped', label: 'Shipped' },
      { key: 'delivered', label: 'Delivered' }
    ];

    const statusMap: Record<string, number> = {
      pending: 0,
      assigned: 1,
      accepted: 2,
      processing: 2,
      packed: 3,
      shipped: 4,
      out_for_delivery: 4,
      delivered: 5
    };

    const currentStepIndex = statusMap[currentStatus || 'pending'] ?? 0;

    return steps.map((s, idx) => ({
      ...s,
      isCompleted: currentStepIndex >= idx,
      isCurrent: currentStepIndex === idx
    }));
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">MitoReboot</span>
          <h2 className="text-2xl font-sans font-bold text-slate-850 leading-none mt-1">Shop Order History</h2>
        </div>
        {onBack && (
          <button onClick={onBack} className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-650 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-bold text-slate-450">Loading orders summary...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <Package className="h-12 w-12 text-slate-355 mx-auto mb-4" />
          <h3 className="font-bold text-slate-700">No orders placed yet</h3>
          <p className="text-xs text-slate-450 mt-1">Navigate to the Health Store to place your first order.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const steps = getFulfillmentSteps(order.deliveryStatus);
            const isCancelled = order.deliveryStatus === 'cancelled';
            const invoiceDownloadLink = order.invoiceUrl ? `${apiUrl.replace('/api', '')}${order.invoiceUrl}` : null;
            const currencySymbol = order.currency === 'USD' ? '$' : '₹';

            return (
              <div key={order._id} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-4 hover:shadow-md transition-all">
                {/* Header Row */}
                <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Order ID</span>
                    <span className="text-xs font-mono font-bold text-slate-700">{order._id}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-xl border uppercase tracking-wider ${getStatusColor(order.deliveryStatus)}`}>
                      Status: {order.deliveryStatus || 'pending'}
                    </span>
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-xl border uppercase tracking-wider ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      Payment: {order.status}
                    </span>
                  </div>
                </div>

                {/* Products Summary */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ordered Supplies</h4>
                  <div className="space-y-1.5">
                    {order.products.map((p: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs text-slate-700">
                        <span className="font-semibold text-slate-700">
                          {p.name}
                          {p.variantName && <span className="text-[9px] text-slate-400 ml-1">({p.variantName})</span>}
                          <span className="text-slate-400 font-normal ml-1">x{p.qty}</span>
                        </span>
                        <span className="font-bold text-slate-800">{currencySymbol}{(p.price * p.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping & Tracking details */}
                {order.trackingDetails?.trackingId && (
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 space-y-2">
                    <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-indigo-500" /> Carrier Shipment Tracking
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-semibold">Courier Partner</span>
                        <span className="font-bold text-slate-750">{order.trackingDetails.courierName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-semibold">Tracking ID</span>
                        <span className="font-bold text-slate-750">{order.trackingDetails.trackingId}</span>
                      </div>
                    </div>
                    {order.trackingDetails.trackingUrl && (
                      <a 
                        href={order.trackingDetails.trackingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[10px] text-indigo-650 hover:underline font-bold block pt-1"
                      >
                        Click to view Live Tracking Map →
                      </a>
                    )}
                  </div>
                )}

                {/* Timeline Visual Tracker */}
                {!isCancelled ? (
                  <div className="py-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Delivery Timeline</span>
                    
                    <div className="relative flex justify-between items-center px-2">
                      {/* Connector Line */}
                      <div className="absolute top-3 left-0 right-0 h-0.5 bg-slate-100 -z-10"></div>
                      
                      {steps.map((step, sIdx) => (
                        <div key={sIdx} className="flex flex-col items-center z-10">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 text-[9px] font-black transition-all ${
                            step.isCompleted
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-350'
                          }`}>
                            {step.isCompleted ? '✓' : sIdx + 1}
                          </div>
                          <span className={`text-[8px] font-bold mt-1 text-center hidden sm:block ${step.isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-100 text-center">
                    This order was cancelled and refunded.
                  </div>
                )}

                {/* Total row with Action buttons */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <div className="flex gap-2">
                    {invoiceDownloadLink && (
                      <a 
                        href={invoiceDownloadLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="py-2 px-4 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-650 flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Download className="h-3.5 w-3.5 text-indigo-500" /> Invoice PDF
                      </a>
                    )}
                    {order.deliveryDate && (
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Delivered: {new Date(order.deliveryDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block font-bold">Total Amount Paid</span>
                    <span className="text-lg font-black text-slate-850">{currencySymbol}{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
