import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Package, Truck, Download, Calendar, Star, Beaker, FileText, HelpCircle } from 'lucide-react';
import { ProductImage } from './ShopScreen';

interface ShopOrdersHistoryScreenProps {
  onBack?: () => void;
  onRateOrder?: (orderId: string) => void;
}

export const ShopOrdersHistoryScreen: React.FC<ShopOrdersHistoryScreenProps> = ({ onBack, onRateOrder }) => {
  const { apiUrl, token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [labBookings, setLabBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'tests'>('products');

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: '', email: '', question: '', relatedId: '', type: 'GENERAL' });
  const [submittingSupport, setSubmittingSupport] = useState(false);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchOrders();
      fetchUserReviews();
    } else {
      fetchLabBookings();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
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

  const fetchLabBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/labs/booking/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLabBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    try {
      const res = await fetch(`${apiUrl}/patient/reviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserReviews(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-150';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-150';
      case 'out_for_delivery':
      case 'out for delivery': return 'bg-cyan-50 text-cyan-600 border-cyan-150';
      case 'packed': return 'bg-indigo-50 text-indigo-600 border-indigo-150';
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

  const handleDownloadReport = async (bookingId: string) => {
    try {
      const res = await fetch(`${apiUrl}/labs/booking/${bookingId}/report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const report = await res.json();
        if (report && report.pdfUrl) {
          const downloadUrl = report.pdfUrl.startsWith('http') ? report.pdfUrl : `${apiUrl.replace('/api', '')}${report.pdfUrl}`;
          window.open(downloadUrl, '_blank');
        } else {
          alert('Report file not found. It might be available for physical pickup.');
        }
      } else {
        alert('Failed to fetch report.');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred while fetching the report.');
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportForm.name || !supportForm.email || !supportForm.question) {
      alert('Please fill in all required fields.');
      return;
    }
    setSubmittingSupport(true);
    try {
      const res = await fetch(`${apiUrl}/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(supportForm)
      });
      if (res.ok) {
        alert('Support ticket submitted successfully!');
        setShowSupportModal(false);
      } else {
        alert('Failed to submit support ticket.');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred.');
    } finally {
      setSubmittingSupport(false);
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">MitoReboot</span>
          <h2 className="text-2xl font-sans font-bold text-slate-850 leading-none mt-1">My Orders & History</h2>
        </div>
        {onBack && (
          <button onClick={onBack} className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex bg-slate-200/50 p-1 rounded-xl mb-6 shadow-inner">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'products' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Package className="h-4 w-4" /> Products
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'tests' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Beaker className="h-4 w-4" /> Test History
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-650/0 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-bold text-slate-450">Loading history...</p>
        </div>
      ) : activeTab === 'products' ?
        orders.length === 0 ? (
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
            const hasRated = userReviews.some(r => r.orderId === order._id);

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
                <div className="space-y-3 pt-1">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Ordered Supplies</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {order.products.map((p: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-50 border border-slate-100/80 rounded-2xl p-3">
                        <div className="h-11 w-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          <ProductImage src={p.productId?.image || p.image} apiUrl={apiUrl} className="h-8 w-8 object-contain" textClassName="text-xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-extrabold text-slate-800 text-xs truncate leading-snug">{p.name}</h5>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {p.variantName && (
                              <span className="text-[9px] text-slate-400 font-bold bg-slate-200/60 px-1 py-0.2 rounded-md">
                                {p.variantName}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-450 font-semibold">Qty: {p.qty}</span>
                          </div>
                        </div>
                        <span className="font-black text-slate-800 text-xs shrink-0">{currencySymbol}{(p.price * p.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping & Tracking details */}
                {order.trackingDetails?.trackingId && (
                  <div className="bg-indigo-50/40 border border-indigo-100/60 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-indigo-600" /> Shipment Dispatched
                      </h5>
                      {order.trackingDetails.trackingUrl && (
                        <a 
                          href={order.trackingDetails.trackingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-extrabold px-3 py-1 rounded-lg shadow-sm hover:shadow transition-all"
                        >
                          Track Package →
                        </a>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                      <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-50/50">
                        <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">Courier Partner</span>
                        <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">{order.trackingDetails.courierName}</span>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-50/50">
                        <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">Tracking ID</span>
                        <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">{order.trackingDetails.trackingId}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline Visual Tracker */}
                {!isCancelled ? (
                  <div className="py-3 bg-slate-50/60 border border-slate-100 rounded-2xl p-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Delivery Timeline</span>
                    
                    <div className="relative flex justify-between items-center px-2">
                      {/* Connector Line */}
                      {(() => {
                        const stepIndex = steps.findIndex(s => s.isCurrent);
                        const currentStepIndex = stepIndex !== -1 ? stepIndex : (steps.filter(s => s.isCompleted).length - 1);
                        const progressPercent = Math.max(0, Math.min(100, (currentStepIndex / (steps.length - 1)) * 100));
                        return (
                          <div className="absolute top-[11px] left-3 right-3 h-[3px] bg-slate-200 z-0 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 transition-all duration-500 rounded-full" 
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                        );
                      })()}
                      
                      {steps.map((step, sIdx) => {
                        const isActive = step.isCurrent;
                        const isCompleted = step.isCompleted;
                        return (
                          <div key={sIdx} className="flex flex-col items-center z-10 relative">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 text-[9px] font-black transition-all duration-300 ${
                              isCompleted
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm scale-105'
                                : 'bg-white border-slate-200 text-slate-355'
                            } ${isActive ? 'ring-4 ring-indigo-100 animate-pulse' : ''}`}>
                              {isCompleted ? '✓' : sIdx + 1}
                            </div>
                            <span className={`text-[7px] sm:text-[9px] font-extrabold mt-1.5 text-center block max-w-[48px] sm:max-w-none leading-none ${
                              isCompleted ? 'text-slate-800' : 'text-slate-400'
                            } ${isActive ? 'text-indigo-600 font-black' : ''}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-100 text-center">
                    This order was cancelled and refunded.
                  </div>
                )}

                {/* Total row with Action buttons */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => {
                        setSupportForm({ name: '', email: '', question: '', relatedId: order._id, type: 'PRODUCT' });
                        setShowSupportModal(true);
                      }}
                      className="py-2 px-4 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-650 flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-slate-500" /> Need Help?
                    </button>
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
                    {order.deliveryStatus === 'delivered' && hasRated && (
                      <span className="py-2 px-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        ✓ Rated & Reviewed
                      </span>
                    )}
                    {order.deliveryStatus === 'delivered' && !hasRated && onRateOrder && (
                      <button 
                        onClick={() => onRateOrder(order._id)}
                        className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Star className="h-3.5 w-3.5 fill-white" /> Rate Products
                      </button>
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
      ) : labBookings.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <Beaker className="h-12 w-12 text-slate-355 mx-auto mb-4" />
            <h3 className="font-bold text-slate-700">No test history</h3>
            <p className="text-xs text-slate-450 mt-1">Book a lab test to see your history here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {labBookings.map((booking: any) => {
              const reportReady = booking.status === 'REPORT_READY' || booking.status === 'COMPLETED';
              return (
                <div key={booking._id} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-4 hover:shadow-md transition-all">
                  <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Booking ID</span>
                      <span className="text-xs font-mono font-bold text-slate-700">{booking._id}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-xl border uppercase tracking-wider ${reportReady ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        Status: {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-100/80 rounded-2xl p-3">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-extrabold text-slate-800 text-sm truncate leading-snug">{booking.labTestId?.cancerScreeningTestId?.name || booking.labTestId?.name || 'Unknown Test'}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {new Date(booking.preferredDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">• {booking.preferredTime}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Collection: {booking.collectionType === 'HOME' ? 'Home Collection' : 'Lab Visit'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-slate-400 block font-bold">Total Paid</span>
                        <span className="font-black text-slate-800 text-sm block">₹{booking.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSupportForm({ name: '', email: '', question: '', relatedId: booking._id, type: 'LAB_TEST' });
                          setShowSupportModal(true);
                        }}
                        className="py-2 px-4 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-650 flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <HelpCircle className="h-3.5 w-3.5 text-slate-500" /> Need Help?
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {reportReady ? (
                        <button 
                          onClick={() => handleDownloadReport(booking._id)}
                          className="py-2 px-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-emerald-100 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" /> Download Report
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <FileText className="h-4 w-4" /> Awaiting Report
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

      {showSupportModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-indigo-600" /> Need Help?
              </h3>
              <button 
                onClick={() => setShowSupportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={supportForm.name}
                    onChange={e => setSupportForm({ ...supportForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={supportForm.email}
                    onChange={e => setSupportForm({ ...supportForm, email: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Issue / Question</label>
                  <textarea
                    required
                    rows={4}
                    value={supportForm.question}
                    onChange={e => setSupportForm({ ...supportForm, question: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                    placeholder="Please describe your issue in detail..."
                  ></textarea>
                </div>
                <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowSupportModal(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submittingSupport}
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {submittingSupport ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
