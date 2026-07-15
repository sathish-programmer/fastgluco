import React, { useState, useEffect } from 'react';
import { Package, Truck, LogOut, Calendar, Info, BarChart3, Search } from 'lucide-react';

interface VendorPortalProps {
  apiUrl: string;
  token: string;
  onLogout: () => void;
}

type VendorView = 'dashboard' | 'orders';

export const VendorPortal: React.FC<VendorPortalProps> = ({ apiUrl, token, onLogout }) => {
  const [activeView, setActiveView] = useState<VendorView>('dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Search/Filters inside orders tab
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Shipment / Status update state
  const [updatingOrder, setUpdatingOrder] = useState<any | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<string>('accepted');
  const [courierName, setCourierName] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrdersAndDashboard();
  }, []);

  const fetchOrdersAndDashboard = async () => {
    setLoading(true);
    try {
      // 1. Fetch orders list
      const ordersRes = await fetch(`${apiUrl}/vendor/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let fetchedOrders = [];
      if (ordersRes.ok) {
        fetchedOrders = await ordersRes.json();
        setOrders(fetchedOrders);
      }

      // 2. Fetch dashboard stats
      const dashRes = await fetch(`${apiUrl}/vendor/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (dashRes.ok) {
        const dData = await dashRes.json();
        setDashboardData(dData);
      }

      // 3. Fetch performance metrics (use profile metadata + order analytics)
      const storedProfile = localStorage.getItem('fastgluco_admin_profile');
      if (storedProfile) {
        const prof = JSON.parse(storedProfile);
        const perfRes = await fetch(`${apiUrl}/admin/vendors/${prof.id}/performance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (perfRes.ok) {
          setPerformance(await perfRes.json());
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingOrder) return;
    setSaving(true);
    try {
      const isShippedTransition = deliveryStatus === 'shipped';
      const isDeliveredTransition = deliveryStatus === 'delivered';
      
      let res;
      if (isShippedTransition) {
        // Use tracking endpoint
        res = await fetch(`${apiUrl}/vendor/orders/${updatingOrder._id}/tracking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ courierName, trackingId, trackingUrl })
        });
      } else if (isDeliveredTransition) {
        // Use delivery confirmation endpoint
        res = await fetch(`${apiUrl}/vendor/orders/${updatingOrder._id}/confirm-delivery`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        // Standard status update
        res = await fetch(`${apiUrl}/vendor/orders/${updatingOrder._id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ deliveryStatus, comment })
        });
      }

      if (res.ok) {
        setUpdatingOrder(null);
        setCourierName('');
        setTrackingId('');
        setTrackingUrl('');
        setComment('');
        fetchOrdersAndDashboard();
      } else {
        const err = await res.json();
        alert(err.message || 'Error updating order status');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'packed': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'accepted': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'assigned': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'cancelled': return 'bg-red-50 text-red-650 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchStatus = statusFilter === 'All' || o.deliveryStatus === statusFilter;
    const matchSearch = !orderSearch || o._id.includes(orderSearch) || (o.patientName && o.patientName.toLowerCase().includes(orderSearch.toLowerCase())) || (o.userId?.name && o.userId.name.toLowerCase().includes(orderSearch.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const currencySymbol = 'Rs.';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl">🚚</span>
          <span className="text-slate-850 text-lg font-black tracking-tight">Vendor Fulfillment Portal</span>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="hidden sm:flex items-center gap-2">
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Overview Stats
            </button>
            <button 
              onClick={() => setActiveView('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'orders' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Assigned Orders ({orders.length})
            </button>
          </nav>

          <button onClick={onLogout} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 flex items-center gap-1.5 text-xs font-bold border border-slate-200 shadow-sm transition-all">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-6">
          
          {/* VIEW: DASHBOARD STATS */}
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Dashboard metric cards */}
              {dashboardData?.stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Orders</span>
                    <span className="text-2xl font-black text-slate-800">{dashboardData.stats.totalOrders}</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Processing Orders</span>
                    <span className="text-2xl font-black text-amber-600">{dashboardData.stats.processing + dashboardData.stats.pending}</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Deliveries</span>
                    <span className="text-2xl font-black text-emerald-600">{dashboardData.stats.delivered}</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Revenue Earned</span>
                    <span className="text-2xl font-black text-indigo-700">{currencySymbol}{dashboardData.stats.revenue.toFixed(2)}</span>
                  </div>

                </div>
              )}

              {/* Vendor performance analytics */}
              {performance && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-indigo-500" /> Live Performance Analytics
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                    <div className="pt-2 sm:pt-0 sm:px-4">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Average Delivery Speed</span>
                      <span className="text-lg font-black text-slate-750">{performance.avgFulfillmentTimeHours} hours</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Assigned status to final Delivered timestamp</p>
                    </div>

                    <div className="pt-4 sm:pt-0 sm:px-4">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Order Completion Rate</span>
                      <span className="text-lg font-black text-emerald-600">
                        {performance.totalAssigned > 0 ? ((performance.totalDelivered / performance.totalAssigned) * 100).toFixed(1) + '%' : '100%'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Delivered vs assigned order requests</p>
                    </div>

                    <div className="pt-4 sm:pt-0 sm:px-4">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Cancellation Rate</span>
                      <span className="text-lg font-black text-red-500">{performance.cancelRate}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Rejected or cancelled order tickets</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Orders List */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-indigo-500" /> Recent Order Requests
                  </h3>
                  <button 
                    onClick={() => setActiveView('orders')}
                    className="text-xs text-indigo-650 hover:underline font-bold"
                  >
                    View All Orders →
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {dashboardData?.recentOrders?.map((order: any) => (
                    <div key={order._id} className="py-3.5 flex justify-between items-center gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-mono font-bold text-slate-700">Order ID: {order._id}</span>
                        <div className="flex gap-2 text-[10px] text-slate-450 font-semibold">
                          <span>Patient: {order.patientName || order.userId?.name || 'N/A'}</span>
                          <span>•</span>
                          <span>Total: {currencySymbol}{order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${getStatusBadgeColor(order.deliveryStatus)}`}>
                        {order.deliveryStatus || 'pending'}
                      </span>
                    </div>
                  ))}
                  {(!dashboardData?.recentOrders || dashboardData.recentOrders.length === 0) && (
                    <p className="text-xs text-slate-400 text-center py-6">No recent fulfillment requests found.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* VIEW: ASSIGNED ORDERS */}
          {activeView === 'orders' && (
            <div className="space-y-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Package className="h-5 w-5 text-indigo-500" /> Fulfillment Orders
                </h3>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search ID/Patient..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold"
                  >
                    <option value="All">All Statuses</option>
                    <option value="assigned">Assigned</option>
                    <option value="accepted">Accepted</option>
                    <option value="packed">Packed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Grid of assigned orders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrders.map(order => (
                  <div key={order._id} className="border border-slate-150 rounded-3xl p-5 space-y-4 hover:border-slate-250 transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-mono text-slate-800 text-xs font-bold">Order ID: {order._id}</h4>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                            Created: {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${getStatusBadgeColor(order.deliveryStatus)}`}>
                          {order.deliveryStatus || 'pending'}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-1.5">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Supplies List</span>
                        {order.products.map((p: any, idx: number) => (
                          <div key={idx} className="text-xs text-slate-700 flex justify-between">
                            <span>{p.name} {p.variantName && `(${p.variantName})`} <span className="text-slate-400 font-medium">x{p.qty}</span></span>
                            <span className="font-bold">{currencySymbol}{(p.price * p.qty).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Patient / Address info */}
                      <div className="text-xs space-y-1 text-slate-600 bg-slate-50/50 border border-slate-100/50 rounded-2xl p-3">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Shipping Details</span>
                        <div className="font-semibold text-slate-700">Patient: {order.patientName || order.userId?.name || 'N/A'}</div>
                        <div>Phone: {order.patientPhone || order.userId?.mobileNumber || 'N/A'}</div>
                        {order.shippingAddress && (
                          <div className="text-[10px] text-slate-500 leading-normal">
                            Address: {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-black text-slate-800 text-sm">{currencySymbol}{order.totalAmount.toFixed(2)}</span>
                      
                      {order.deliveryStatus !== 'delivered' && order.deliveryStatus !== 'cancelled' && (
                        <button
                          onClick={() => {
                            setUpdatingOrder(order);
                            setDeliveryStatus(order.deliveryStatus || 'accepted');
                          }}
                          className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                        >
                          Update Status / Track
                        </button>
                      )}
                    </div>

                  </div>
                ))}

                {filteredOrders.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-8 col-span-2">No matching assigned orders found.</p>
                )}
              </div>
            </div>
          )}

        </main>
      )}

      {/* UPDATE STATUS MODAL (WITH COURIER FIELDS) */}
      {updatingOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 border border-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Truck className="h-5 w-5 text-indigo-500" /> Update Fulfillment Step
            </h3>
            
            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Fulfillment Status</label>
                <select
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none bg-white"
                >
                  <option value="accepted">Accepted (Vendor Confirmed)</option>
                  <option value="processing">Processing (Packing Order)</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped (Enter Tracking Details)</option>
                  <option value="delivered">Delivered (Fulfillment Complete)</option>
                  <option value="cancelled">Cancelled (Cancel Order)</option>
                </select>
              </div>

              {/* Courier tracking details shown ONLY when shipped is selected */}
              {deliveryStatus === 'shipped' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                  <span className="text-[9px] font-black text-indigo-650 uppercase tracking-widest block">Courier Logistics Info</span>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Courier Carrier Name *</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. DHL Express, BlueDart" 
                      value={courierName}
                      onChange={e => setCourierName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Tracking ID *</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. TRK1234567" 
                      value={trackingId}
                      onChange={e => setTrackingId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Tracking URL (Optional)</label>
                    <input 
                      type="url" 
                      placeholder="e.g. https://dhl.com/track" 
                      value={trackingUrl}
                      onChange={e => setTrackingUrl(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {deliveryStatus !== 'shipped' && deliveryStatus !== 'delivered' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Timeline Comment (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Items checked and packed in dry box." 
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>
              )}

              {/* Delivery Warning */}
              {deliveryStatus === 'delivered' && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-[10px] text-indigo-750 flex items-start gap-1.5 leading-normal">
                  <Info className="h-4 w-4 text-indigo-650 shrink-0 mt-0.5" />
                  <span>Marking as Delivered will automatically generate the PDF invoice, email it to the patient with attachment, and notify the clinic admins.</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setUpdatingOrder(null)} 
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-all shadow-sm"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
