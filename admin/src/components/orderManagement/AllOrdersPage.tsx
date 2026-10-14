import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Package,
  RotateCcw,
  X,
  CreditCard,
  User,
  Truck,
  Save,
  AlertTriangle,
  Send
} from 'lucide-react';

interface AllOrdersPageProps {
  apiUrl: string;
  token: string;
  adminRole?: string;
  initialFilters?: any;
  onOpenRefundModal?: (order: any) => void;
  onOpenMessageModal?: (order: any) => void;
}

export const AllOrdersPage: React.FC<AllOrdersPageProps> = ({
  apiUrl,
  token,
  initialFilters = {},
  onOpenRefundModal,
  onOpenMessageModal
}) => {
  // Orders list state
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, pages: 1 });

  // Filters state
  const [search, setSearch] = useState(initialFilters.search || '');
  const [dateRange, setDateRange] = useState(initialFilters.dateRange || 'all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(initialFilters.paymentStatus || 'all');
  const [deliveryStatus, setDeliveryStatus] = useState(initialFilters.deliveryStatus || 'all');
  const [refundStatus, setRefundStatus] = useState(initialFilters.refundStatus || 'all');
  const [vendorId, setVendorId] = useState(initialFilters.vendorId || 'all');
  const [vendorsList, setVendorsList] = useState<any[]>([]);

  // Detailed Order Drawer / Modal state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [orderExtra, setOrderExtra] = useState<any>(null);

  // Order lifecycle action state
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    deliveryStatus: '',
    paymentStatus: '',
    courierName: '',
    trackingId: '',
    trackingUrl: '',
    adminNotes: ''
  });
  const [savingStatus, setSavingStatus] = useState(false);

  // Internal Note form
  const [internalNoteText, setInternalNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Confirmation modal state for sensitive actions
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({ open: false, title: '', description: '', action: () => {} });

  // Fetch vendors for filter dropdown
  useEffect(() => {
    fetch(`${apiUrl}/admin/order-management/vendors/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.vendors) setVendorsList(data.vendors);
      })
      .catch(console.error);
  }, [apiUrl, token]);

  // Fetch orders
  const fetchOrders = async (targetPage = 1, customLimit?: number) => {
    setLoading(true);
    try {
      const limitToUse = customLimit || pagination.limit;
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: limitToUse.toString(),
        search,
        dateRange,
        paymentStatus,
        deliveryStatus,
        refundStatus,
        vendorId
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`${apiUrl}/admin/order-management/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [search, dateRange, paymentStatus, deliveryStatus, refundStatus, vendorId, startDate, endDate]);

  // Fetch order full details
  const openOrderDetails = async (orderId: string, initialOrder?: any) => {
    if (initialOrder) {
      setSelectedOrder(initialOrder);
      setStatusUpdateForm({
        deliveryStatus: initialOrder.deliveryStatus || 'pending',
        paymentStatus: initialOrder.status || 'pending',
        courierName: initialOrder.trackingDetails?.courierName || '',
        trackingId: initialOrder.trackingDetails?.trackingId || '',
        trackingUrl: initialOrder.trackingDetails?.trackingUrl || '',
        adminNotes: ''
      });
    }
    setDrawerLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/order-management/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data.order);
        setOrderExtra({
          remainingRefundable: data.remainingRefundable,
          alreadyRefunded: data.alreadyRefunded,
          linkedTickets: data.linkedTickets || [],
          orderAudits: data.orderAudits || []
        });
        setStatusUpdateForm({
          deliveryStatus: data.order.deliveryStatus || 'pending',
          paymentStatus: data.order.status || 'pending',
          courierName: data.order.trackingDetails?.courierName || '',
          trackingId: data.order.trackingDetails?.trackingId || '',
          trackingUrl: data.order.trackingDetails?.trackingUrl || '',
          adminNotes: ''
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDrawerLoading(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const params = new URLSearchParams({
      search,
      dateRange,
      paymentStatus,
      deliveryStatus,
      refundStatus,
      vendorId,
      format: 'csv'
    });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    window.open(`${apiUrl}/admin/order-management/orders?${params.toString()}&token=${token}`, '_blank');
  };

  // Submit lifecycle update
  const handleSaveStatusUpdate = () => {
    if (!selectedOrder) return;

    setConfirmDialog({
      open: true,
      title: 'Confirm Order Fulfilment Update',
      description: `Are you sure you want to change order #${selectedOrder.vendorOrderId || selectedOrder._id} fulfilment status to "${statusUpdateForm.deliveryStatus}"?`,
      action: async () => {
        setSavingStatus(true);
        try {
          const res = await fetch(`${apiUrl}/admin/order-management/orders/${selectedOrder._id}/lifecycle`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(statusUpdateForm)
          });
          if (res.ok) {
            const data = await res.json();
            setSelectedOrder(data.order);
            fetchOrders(pagination.page);
            setConfirmDialog(prev => ({ ...prev, open: false }));
          } else {
            const err = await res.json();
            alert(err.message || 'Error updating order status');
          }
        } catch (e: any) {
          alert(e.message || 'Error occurred');
        } finally {
          setSavingStatus(false);
        }
      }
    });
  };

  // Add internal note
  const handleSaveInternalNote = async () => {
    if (!selectedOrder || !internalNoteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`${apiUrl}/admin/order-management/orders/${selectedOrder._id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ note: internalNoteText.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder((prev: any) => ({ ...prev, adminNotes: data.adminNotes }));
        setInternalNoteText('');
        fetchOrders(pagination.page);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Comprehensive Filters */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Order #, Patient, Email, Phone, Tracking ID, or Product..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary focus:bg-white transition"
            />
          </div>

          {/* Quick controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm"
              title="Export filtered records to CSV"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Export CSV
            </button>
            <button
              onClick={() => {
                setSearch('');
                setDateRange('all');
                setPaymentStatus('all');
                setDeliveryStatus('all');
                setRefundStatus('all');
                setVendorId('all');
                setStartDate('');
                setEndDate('');
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Filter chips bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Date Presets */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Timeframe</label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium focus:outline-none"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Payment</label>
            <select
              value={paymentStatus}
              onChange={e => setPaymentStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium focus:outline-none"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid (Verified)</option>
              <option value="pending">Pending Payment</option>
              <option value="failed">Payment Failed</option>
            </select>
          </div>

          {/* Fulfilment Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fulfilment</label>
            <select
              value={deliveryStatus}
              onChange={e => setDeliveryStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium focus:outline-none"
            >
              <option value="all">All Fulfilment</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned to Vendor</option>
              <option value="accepted">Accepted</option>
              <option value="processing">Processing</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Vendor */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Vendor</label>
            <select
              value={vendorId}
              onChange={e => setVendorId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium focus:outline-none"
            >
              <option value="all">All Vendors</option>
              {vendorsList.map(v => (
                <option key={v._id} value={v._id}>{v.businessName || v.name}</option>
              ))}
            </select>
          </div>

          {/* Refund Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Refund Status</label>
            <select
              value={refundStatus}
              onChange={e => setRefundStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium focus:outline-none"
            >
              <option value="all">All Refunds</option>
              <option value="requested">Cancellation / Refund Requested</option>
              <option value="completed">Refund Completed</option>
              <option value="none">No Refunds</option>
            </select>
          </div>
        </div>

        {/* Custom date range inputs when selected */}
        {dateRange === 'custom' && (
          <div className="flex items-center gap-3 pt-2">
            <span className="text-[11px] font-bold text-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-xs focus:outline-none"
            />
            <span className="text-[11px] font-bold text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-xs focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Order ID & Date</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Products</th>
                <th className="py-3.5 px-4">Vendor</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Fulfilment</th>
                <th className="py-3.5 px-4">Tracking / Carrier</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 font-semibold">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">No matching orders found.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try broadening your search term or adjusting filters.</p>
                  </td>
                </tr>
              ) : (
                orders.map(order => {
                  const displayId = order.vendorOrderId || `#${order._id.slice(-6).toUpperCase()}`;
                  const isPaid = order.status === 'completed';
                  const deliveryStat = order.deliveryStatus || 'pending';
                  const hasRefund = (order.totalRefundedAmount && order.totalRefundedAmount > 0) || order.cancellationRequest?.refundStatus === 'COMPLETED';
                  const cancelPending = order.cancellationRequest?.status === 'PENDING';

                  return (
                    <tr
                      key={order._id}
                      onClick={() => openOrderDetails(order._id, order)}
                      className="hover:bg-slate-50/60 transition cursor-pointer"
                    >
                      {/* Order ID & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-primary flex items-center gap-1.5">
                          {displayId}
                          {cancelPending && (
                            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title="Cancellation Requested" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="py-3.5 px-4 max-w-[170px]">
                        <div className="font-bold text-slate-800 truncate">
                          {order.patientName || (order.userId as any)?.name || 'Customer'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {order.patientEmail || (order.userId as any)?.email || ''}
                        </div>
                        {order.patientPhone && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {order.patientPhone}
                          </div>
                        )}
                      </td>

                      {/* Products */}
                      <td className="py-3.5 px-4 max-w-[180px]">
                        <div className="font-medium text-slate-700 truncate">
                          {(order.products || []).map((p: any) => p.name).join(', ')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                          {(order.products || []).reduce((acc: number, p: any) => acc + (p.qty || 1), 0)} unit(s)
                        </div>
                      </td>

                      {/* Vendor */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700 text-[11px]">
                          {(order.vendorId as any)?.businessName || (order.vendorId as any)?.name || 'Direct'}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-800">
                          ₹{order.totalAmount}
                        </div>
                        {hasRefund && (
                          <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                            Refunded ₹{order.totalRefundedAmount || order.cancellationRequest?.refundAmount}
                          </span>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4">
                        {order.totalRefundedAmount >= order.totalAmount && order.totalAmount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                            <RotateCcw className="h-3 w-3" /> Refunded
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : order.status === 'failed'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isPaid ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {isPaid ? 'Paid' : order.status}
                          </span>
                        )}
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {order.paymentMethod || 'Razorpay'}
                        </div>
                      </td>

                      {/* Fulfilment */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            deliveryStat === 'delivered'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : deliveryStat === 'shipped' || deliveryStat === 'out_for_delivery'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : deliveryStat === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {deliveryStat}
                        </span>
                      </td>

                      {/* Tracking Details */}
                      <td className="py-3.5 px-4 text-[11px]">
                        {order.trackingDetails?.trackingId ? (
                          <div>
                            <span className="font-mono font-semibold text-slate-700 block truncate max-w-[120px]">
                              {order.trackingDetails.trackingId}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {order.trackingDetails.courierName || 'Courier'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic">Not Dispatched</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openOrderDetails(order._id, order);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-primary transition cursor-pointer"
                            title="View Detailed Order Drawer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {isPaid && onOpenRefundModal && Math.max(0, (order.totalAmount || 0) - (order.totalRefundedAmount || 0)) > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenRefundModal(order);
                              }}
                              className="p-1.5 hover:bg-purple-50 rounded-lg text-slate-500 hover:text-purple-600 transition cursor-pointer"
                              title="Process Refund"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                          {onOpenMessageModal && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenMessageModal(order);
                              }}
                              className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-500 hover:text-blue-600 transition cursor-pointer"
                              title="Message Customer Directly"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              Showing {pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
            </span>
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
              <span className="text-[11px] text-slate-400">Rows:</span>
              <select
                value={pagination.limit}
                onChange={e => {
                  const newLimit = Number(e.target.value);
                  setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
                  fetchOrders(1, newLimit);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            {(search || paymentStatus !== 'all' || deliveryStatus !== 'all' || refundStatus !== 'all' || vendorId !== 'all' || dateRange !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setDateRange('all');
                  setPaymentStatus('all');
                  setDeliveryStatus('all');
                  setRefundStatus('all');
                  setVendorId('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-primary text-[11px] font-bold hover:underline cursor-pointer"
              >
                Clear active filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOrders(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-100 transition cursor-pointer disabled:cursor-not-allowed shadow-sm"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-slate-700 px-2 select-none">
              Page {pagination.page} of {pagination.pages || 1}
            </span>
            <button
              onClick={() => fetchOrders(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-100 transition cursor-pointer disabled:cursor-not-allowed shadow-sm"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DETAILED ORDER DRAWER / MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-800">
                    Order Details: {selectedOrder.vendorOrderId || `#${selectedOrder._id}`}
                  </h3>
                  {drawerLoading && (
                    <span className="text-[10px] text-slate-400 font-medium">Syncing...</span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      selectedOrder.totalRefundedAmount >= selectedOrder.totalAmount && selectedOrder.totalAmount > 0
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : selectedOrder.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedOrder.totalRefundedAmount >= selectedOrder.totalAmount && selectedOrder.totalAmount > 0
                      ? 'Refunded'
                      : selectedOrder.status === 'completed'
                      ? 'Paid'
                      : selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {onOpenMessageModal && (
                  <button
                    onClick={() => {
                      onOpenMessageModal(selectedOrder);
                      setSelectedOrder(null);
                    }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    title="Send message to customer"
                  >
                    <Send className="h-3.5 w-3.5" /> Message Customer
                  </button>
                )}
                {(() => {
                  const remaining = orderExtra?.remainingRefundable !== undefined 
                    ? Number(orderExtra.remainingRefundable) 
                    : Math.max(0, (selectedOrder.totalAmount || 0) - (selectedOrder.totalRefundedAmount || 0));
                  if (selectedOrder.status !== 'completed' || !onOpenRefundModal || remaining <= 0) return null;
                  return (
                    <button
                      onClick={() => {
                        onOpenRefundModal(selectedOrder);
                        setSelectedOrder(null);
                      }}
                      className="px-3 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      title="Process refund"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Refund
                    </button>
                  );
                })()}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Customer and Delivery Information */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider text-[11px]">
                  <User className="h-3.5 w-3.5 text-primary" /> Customer & Shipping Info
                </h4>
                <div className="grid grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Patient / Customer Name</span>
                    <span className="font-bold text-slate-800">
                      {selectedOrder.patientName || (selectedOrder.userId as any)?.name || 'Guest / Unregistered'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Email</span>
                    <span className="font-medium">
                      {selectedOrder.patientEmail || (selectedOrder.userId as any)?.email || 'Not Provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Phone</span>
                    <span className="font-mono">
                      {selectedOrder.patientPhone || (selectedOrder.userId as any)?.mobileNumber || (selectedOrder.userId as any)?.mobile || 'Not Provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Vendor Assigned</span>
                    <span className="font-bold text-emerald-700">
                      {(selectedOrder.vendorId as any)?.businessName || (selectedOrder.vendorId as any)?.name || 'Direct (Mito Reboot)'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block">Delivery Address</span>
                    <span className="font-medium text-slate-700">
                      {selectedOrder.shippingAddress && (selectedOrder.shippingAddress.line1 || selectedOrder.shippingAddress.city) ? (
                        `${[selectedOrder.shippingAddress.line1, selectedOrder.shippingAddress.city, selectedOrder.shippingAddress.state].filter(Boolean).join(', ')}${selectedOrder.shippingAddress.postalCode ? ` - ${selectedOrder.shippingAddress.postalCode}` : ''}${selectedOrder.shippingAddress.country ? `, ${selectedOrder.shippingAddress.country}` : ''}`
                      ) : (
                        <span className="text-slate-400 italic">No delivery address specified</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Line Items */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider text-[11px]">
                  <Package className="h-3.5 w-3.5 text-primary" /> Product Line Items
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {(selectedOrder.products || []).map((p: any, idx: number) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 text-xs block">{p.name}</span>
                        {p.variantName && <span className="text-[10px] text-slate-400 font-medium">Variant: {p.variantName}</span>}
                        <span className="text-[11px] text-slate-500 font-medium block">
                          ₹{p.price} × {p.qty}
                        </span>
                      </div>
                      <span className="font-black text-slate-800 text-sm">
                        ₹{(p.price * p.qty).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Product Subtotal</span>
                    <span>
                      ₹{(selectedOrder.totalAmount - (selectedOrder.taxAmount || selectedOrder.gstAmount || 0) - (selectedOrder.shippingCharge || 0) + (selectedOrder.discountAmount || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount / Coupon {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}</span>
                    <span>-₹{(selectedOrder.discountAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST / Tax</span>
                    <span>₹{(selectedOrder.taxAmount || selectedOrder.gstAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Charges</span>
                    <span>₹{(selectedOrder.shippingCharge || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-slate-800 text-sm">
                    <span>Total Payable</span>
                    <span>₹{(selectedOrder.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Payment Details & Refund Status */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider text-[11px]">
                  <CreditCard className="h-3.5 w-3.5 text-primary" /> Payment Transaction Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Gateway / Method</span>
                    <span className="font-semibold text-slate-800">{selectedOrder.paymentMethod || 'Razorpay'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Razorpay Order ID</span>
                    <span className="font-mono text-xs">{selectedOrder.razorpayOrderId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Razorpay Payment ID</span>
                    <span className="font-mono text-xs text-primary">{selectedOrder.razorpayPaymentId || 'N/A'}</span>
                  </div>
                  {(() => {
                    const remaining = orderExtra?.remainingRefundable !== undefined 
                      ? Number(orderExtra.remainingRefundable) 
                      : Math.max(0, (selectedOrder.totalAmount || 0) - (selectedOrder.totalRefundedAmount || 0));
                    return (
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Refundable Balance</span>
                        <span className={`font-black ${remaining > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          ₹{remaining} {remaining <= 0 && '(Fully Refunded)'}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {(() => {
                  const remaining = orderExtra?.remainingRefundable !== undefined 
                    ? Number(orderExtra.remainingRefundable) 
                    : Math.max(0, (selectedOrder.totalAmount || 0) - (selectedOrder.totalRefundedAmount || 0));
                  
                  if (remaining <= 0) {
                    return (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                          Order Fully Refunded (₹{selectedOrder.totalRefundedAmount || selectedOrder.totalAmount})
                        </span>
                      </div>
                    );
                  }

                  if (selectedOrder.status === 'completed' && onOpenRefundModal) {
                    return (
                      <div className="pt-2">
                        <button
                          onClick={() => onOpenRefundModal(selectedOrder)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Initiate Refund for this Order
                        </button>
                      </div>
                    );
                  }

                  return null;
                })()}
              </div>

              {/* Lifecycle & Tracking Update Form */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider text-[11px]">
                  <Truck className="h-3.5 w-3.5 text-primary" /> Update Fulfilment & Tracking
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fulfilment Status</label>
                    <select
                      value={statusUpdateForm.deliveryStatus}
                      onChange={e => setStatusUpdateForm(prev => ({ ...prev, deliveryStatus: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="assigned">Assigned</option>
                      <option value="accepted">Accepted</option>
                      <option value="processing">Processing</option>
                      <option value="packed">Packed</option>
                      <option value="shipped">Shipped</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Courier Partner</label>
                    <input
                      type="text"
                      value={statusUpdateForm.courierName}
                      onChange={e => setStatusUpdateForm(prev => ({ ...prev, courierName: e.target.value }))}
                      placeholder="e.g. Blue Dart, Delhivery"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tracking ID</label>
                    <input
                      type="text"
                      value={statusUpdateForm.trackingId}
                      onChange={e => setStatusUpdateForm(prev => ({ ...prev, trackingId: e.target.value }))}
                      placeholder="e.g. AWB-19284729"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status Note / Reason</label>
                    <input
                      type="text"
                      value={statusUpdateForm.adminNotes}
                      onChange={e => setStatusUpdateForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                      placeholder="Optional message added to timeline and audit log"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveStatusUpdate}
                  disabled={savingStatus}
                  className="w-full py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-dark transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingStatus ? 'Updating Status...' : 'Save Fulfilment Update'}
                </button>
              </div>

              {/* Internal Admin Notes */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Internal Admin Notes (Private)
                </h4>

                {selectedOrder.adminNotes ? (
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-wrap font-mono text-[11px]">
                    {selectedOrder.adminNotes}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px]">No internal notes recorded yet.</p>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={internalNoteText}
                    onChange={e => setInternalNoteText(e.target.value)}
                    placeholder="Add an internal note..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                  />
                  <button
                    onClick={handleSaveInternalNote}
                    disabled={savingNote || !internalNoteText.trim()}
                    className="px-3 py-1.5 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-900 transition disabled:opacity-50"
                  >
                    Add Note
                  </button>
                </div>
              </div>

              {/* Order Status Timeline */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Order Status Timeline
                </h4>
                <div className="space-y-2 border-l-2 border-primary/30 ml-2 pl-4">
                  {(selectedOrder.orderTimeline || []).map((tl: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                      <div className="text-xs font-bold text-slate-800 uppercase">{tl.status}</div>
                      <div className="text-[11px] text-slate-600 font-medium">{tl.comment}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(tl.timestamp).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {confirmDialog.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-bold text-base text-slate-800">{confirmDialog.title}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{confirmDialog.description}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.action}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition shadow-sm"
              >
                Confirm & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
