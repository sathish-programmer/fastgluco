import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ArrowLeft, Package, Truck, Download, Calendar, Star, Beaker, FileText, 
  HelpCircle, ExternalLink, Copy, Check, ChevronRight, Clock
} from 'lucide-react';
import { ProductImage } from './ShopScreen';
import { downloadFile } from '../../utils/fileDownloader';
import { ShopOrderDetailView } from './ShopOrderDetailView';

interface ShopOrdersHistoryScreenProps {
  onBack?: () => void;
  onRateOrder?: (orderId: string) => void;
  initialOrderId?: string;
}

export const ShopOrdersHistoryScreen: React.FC<ShopOrdersHistoryScreenProps> = ({ onBack, onRateOrder, initialOrderId }) => {
  const { t, language } = useLanguage();

  const LOCALE_MAP: Record<string, string> = {
    en: 'en-US',
    ta: 'ta-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    hi: 'hi-IN'
  };
  const activeLocale = LOCALE_MAP[language] || 'en-US';

  const { apiUrl, token, user } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [labBookings, setLabBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'tests'>('products');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');

  // Selected Order for Full Dedicated Detail View
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: '', email: '', question: '', relatedId: '', type: 'GENERAL' });
  const [submittingSupport, setSubmittingSupport] = useState(false);
  const [refreshingOrderId, setRefreshingOrderId] = useState<string | null>(null);
  const [downloadingShopInvoiceId, setDownloadingShopInvoiceId] = useState<string | null>(null);
  const [downloadingLabInvoiceId, setDownloadingLabInvoiceId] = useState<string | null>(null);
  const [downloadingLabReportId, setDownloadingLabReportId] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const handleCopyOrderId = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(orderId);
    setCopiedOrderId(orderId);
    showToast(t('copiedToClipboard', 'Order ID copied to clipboard'), 'info');
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const handleRefreshTracking = async (orderId: string) => {
    setRefreshingOrderId(orderId);
    try {
      const res = await fetch(`${apiUrl}/patient/orders/${orderId}/track`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(prev => prev.map(o => o._id === orderId ? {
          ...o,
          deliveryStatus: data.deliveryStatus,
          vendorOrderStatus: data.vendorOrderStatus,
          vendorStatusMessage: data.vendorStatusMessage,
          estimatedDeliveryDate: data.estimatedDeliveryDate,
          trackingDetails: data.trackingNumber ? {
            courierName: data.courierName,
            trackingId: data.trackingNumber,
            trackingUrl: data.trackingUrl
          } : o.trackingDetails,
          orderTimeline: data.orderTimeline || o.orderTimeline
        } : o));

        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder((prev: any) => prev ? {
            ...prev,
            deliveryStatus: data.deliveryStatus,
            vendorOrderStatus: data.vendorOrderStatus,
            vendorStatusMessage: data.vendorStatusMessage,
            estimatedDeliveryDate: data.estimatedDeliveryDate,
            trackingDetails: data.trackingNumber ? {
              courierName: data.courierName,
              trackingId: data.trackingNumber,
              trackingUrl: data.trackingUrl
            } : prev.trackingDetails,
            orderTimeline: data.orderTimeline || prev.orderTimeline
          } : prev);
        }

        showToast('Live tracking status updated.', 'success');
      } else {
        showToast('Live tracking is being updated by courier partner.', 'info');
      }
    } catch (e) {
      console.error(e);
      showToast('Could not reach logistics tracking API.', 'error');
    } finally {
      setRefreshingOrderId(null);
    }
  };

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
      const list = Array.isArray(data) ? data : [];
      setOrders(list);

      if (initialOrderId) {
        let found = list.find((o: any) => o._id === initialOrderId || o.vendorOrderId === initialOrderId);
        if (!found) {
          try {
            const singleRes = await fetch(`${apiUrl}/patient/orders/${initialOrderId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (singleRes.ok) {
              const singleOrder = await singleRes.json();
              found = singleOrder;
              setOrders(prev => [singleOrder, ...prev.filter(o => o._id !== singleOrder._id)]);
            }
          } catch (err) {
            console.error('Error fetching single order by direct ID:', err);
          }
        }
        if (found) {
          setSelectedOrder(found);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId && orders.length > 0) {
      const found = orders.find((o: any) => o._id === initialOrderId || o.vendorOrderId === initialOrderId);
      if (found) {
        setSelectedOrder(found);
      }
    }
  }, [initialOrderId, orders]);

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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'delivered':
        return {
          label: t('shop.statusDelivered', 'Delivered'),
          color: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
          dot: 'bg-emerald-500'
        };
      case 'shipped':
      case 'in_transit':
        return {
          label: t('shop.statusShipped', 'In Transit / Shipped'),
          color: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40',
          dot: 'bg-blue-500 animate-pulse'
        };
      case 'out_for_delivery':
      case 'out for delivery':
        return {
          label: 'Out for Delivery',
          color: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/40',
          dot: 'bg-cyan-500 animate-ping'
        };
      case 'packed':
        return {
          label: t('shop.stepPacked', 'Packed & Ready'),
          color: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40',
          dot: 'bg-indigo-500'
        };
      case 'accepted':
      case 'processing':
        return {
          label: t('shop.stepAccepted', 'Order Confirmed'),
          color: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
          dot: 'bg-purple-500'
        };
      case 'assigned':
        return {
          label: t('shop.stepPreparing', 'Preparing for Dispatch'),
          color: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
          dot: 'bg-amber-500'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
          dot: 'bg-rose-500'
        };
      default:
        return {
          label: t('shop.stepOrderPlaced', 'Order Placed'),
          color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dot: 'bg-slate-400'
        };
    }
  };

  const handleDownloadShopInvoice = async (orderId: string, invoiceUrl?: string) => {
    if (downloadingShopInvoiceId) return;
    setDownloadingShopInvoiceId(orderId);
    try {
      const url = invoiceUrl 
        ? (invoiceUrl.startsWith('http') ? invoiceUrl : `${apiUrl.replace(/\/api$/, '')}${invoiceUrl}`)
        : `${apiUrl}/shop/orders/${orderId}/invoice`;
      await downloadFile({
        url,
        filename: `Invoice-Order-${orderId.slice(-6).toUpperCase()}.pdf`,
        token
      });
      showToast('Tax invoice downloaded successfully.', 'success');
    } catch (err: any) {
      console.error('Error downloading shop invoice:', err);
      showToast(err.message || 'Failed to download invoice.', 'error');
    } finally {
      setDownloadingShopInvoiceId(null);
    }
  };

  const handleDownloadLabInvoice = async (bookingId: string) => {
    if (downloadingLabInvoiceId) return;
    setDownloadingLabInvoiceId(bookingId);
    try {
      const url = `${apiUrl}/labs/booking/${bookingId}/invoice`;
      await downloadFile({
        url,
        filename: `Invoice-Lab-${bookingId.slice(-6).toUpperCase()}.pdf`,
        token
      });
      showToast('Lab invoice downloaded successfully.', 'success');
    } catch (err: any) {
      console.error('Error downloading lab invoice:', err);
      showToast(err.message || 'Failed to download lab invoice.', 'error');
    } finally {
      setDownloadingLabInvoiceId(null);
    }
  };

  const handleDownloadReport = async (bookingId: string) => {
    if (downloadingLabReportId) return;
    setDownloadingLabReportId(bookingId);
    try {
      const res = await fetch(`${apiUrl}/labs/booking/${bookingId}/report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const report = await res.json();
        if (report && report.pdfUrl) {
          const downloadUrl = report.pdfUrl.startsWith('http') ? report.pdfUrl : `${apiUrl.replace(/\/api$/, '')}${report.pdfUrl}`;
          await downloadFile({
            url: downloadUrl,
            filename: `Lab-Report-${bookingId.slice(-6).toUpperCase()}.pdf`,
            token
          });
          showToast('Lab report downloaded successfully.', 'success');
        } else {
          showToast('Report file not found. It might be available for physical pickup.', 'error');
        }
      } else {
        const data = await res.json().catch(() => null);
        showToast(data?.message || data?.error || 'Failed to fetch report.', 'error');
      }
    } catch (e: any) {
      console.error('Error downloading lab report:', e);
      showToast(e.message || 'An error occurred while fetching the report.', 'error');
    } finally {
      setDownloadingLabReportId(null);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportForm.name || !supportForm.email || !supportForm.question) {
      showToast('Please fill in all required fields.', 'error');
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
        showToast('Support ticket submitted successfully!', 'success');
        setShowSupportModal(false);
      } else {
        showToast('Failed to submit support ticket.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('An error occurred while submitting support ticket.', 'error');
    } finally {
      setSubmittingSupport(false);
    }
  };

  const handleReorder = (products: any[]) => {
    try {
      const currentCart = JSON.parse(localStorage.getItem('mitoreboot_health_cart') || '[]');
      const newCart = [...currentCart];
      products.forEach((p: any) => {
        const pId = p.productId?._id || p.productId || p.name;
        const existingIdx = newCart.findIndex(x => x.item.id === pId && x.variantName === p.variantName);
        if (existingIdx > -1) {
          newCart[existingIdx].qty += p.qty;
        } else {
          newCart.push({
            item: {
              id: pId,
              name: p.name,
              price: p.price,
              image: p.productId?.image || p.image,
              category: p.productId?.category || 'Functional Nutrition',
              stock: 99
            },
            variantName: p.variantName,
            qty: p.qty
          });
        }
      });
      localStorage.setItem('mitoreboot_health_cart', JSON.stringify(newCart));
      showToast('Order items added to your basket!', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const renderSupportModal = () => {
    if (!showSupportModal) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">Support & Helpdesk</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">We respond within 24 hours.</p>
            </div>
            <button 
              onClick={() => setShowSupportModal(false)}
              className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSupportSubmit} className="p-5 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Name</label>
              <input 
                type="text" 
                required
                placeholder="Enter full name"
                value={supportForm.name}
                onChange={(e) => setSupportForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Email</label>
              <input 
                type="email" 
                required
                placeholder="name@example.com"
                value={supportForm.email}
                onChange={(e) => setSupportForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">How can we assist you?</label>
              <textarea 
                required
                rows={3}
                placeholder="Tell us what you need help with regarding this order..."
                value={supportForm.question}
                onChange={(e) => setSupportForm(prev => ({ ...prev, question: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submittingSupport}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {submittingSupport ? 'Submitting Ticket...' : 'Submit Support Request'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  // If user selected an order, render the dedicated Order Detailed View page
  if (selectedOrder) {
    return (
      <>
        <ShopOrderDetailView
          order={selectedOrder}
          onBack={() => setSelectedOrder(null)}
          onRateOrder={onRateOrder}
          onReorder={handleReorder}
          onRefreshTracking={handleRefreshTracking}
          isRefreshingTracking={refreshingOrderId === selectedOrder._id}
          onDownloadInvoice={handleDownloadShopInvoice}
          isDownloadingInvoice={downloadingShopInvoiceId === selectedOrder._id}
          onOpenSupport={(orderId) => {
            const displayId = selectedOrder.vendorOrderId || orderId.slice(-6).toUpperCase();
            setSupportForm({ 
              name: user?.name || '', 
              email: user?.email || '', 
              question: `Hi, I need assistance regarding Order #${displayId}. `, 
              relatedId: orderId, 
              type: 'PRODUCT' 
            });
            setShowSupportModal(true);
          }}
          hasRated={userReviews.some(r => r.orderId === selectedOrder._id)}
        />
        {renderSupportModal()}
      </>
    );
  }

  // Filter orders based on statusFilter
  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'delivered') return o.deliveryStatus === 'delivered';
    if (statusFilter === 'cancelled') return o.deliveryStatus === 'cancelled';
    if (statusFilter === 'active') return o.deliveryStatus !== 'delivered' && o.deliveryStatus !== 'cancelled';
    return true;
  });

  return (
    <div className="pb-28 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Sticky Header with Safe Notch Clearance */}
      <div 
        className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 pb-3 shadow-xs"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 24px) + 12px)' }}
      >
        <div className="max-w-5xl mx-auto flex justify-between items-center gap-3">
          <div>
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 tracking-[0.2em] uppercase block">
              {t('shop.storeTitle', 'MitoReboot Store')}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-none mt-0.5">
              {t('shop.myOrdersHistory', 'Order History')}
            </h2>
          </div>
          {onBack && (
            <button 
              onClick={onBack} 
              className="h-10 px-3.5 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 border border-slate-200/60 dark:border-slate-700/60 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Shop</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
        </div>
      </div>

      <div className="px-4 max-w-5xl mx-auto pt-6 space-y-5">

        {/* Tab Switcher: Products vs Lab Tests */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl max-w-md mx-auto border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'products'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>{t('shop.productsTab', 'Product Orders')} ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Beaker className="h-4 w-4" />
            <span>{t('shop.testsTab', 'Lab Tests')} ({labBookings.length})</span>
          </button>
        </div>

        {/* Sub-filter chips for Products */}
        {activeTab === 'products' && orders.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {[
              { id: 'all', label: `All Orders (${orders.length})` },
              { id: 'active', label: `Active / In Transit (${orders.filter(o => o.deliveryStatus !== 'delivered' && o.deliveryStatus !== 'cancelled').length})` },
              { id: 'delivered', label: `Delivered (${orders.filter(o => o.deliveryStatus === 'delivered').length})` },
              { id: 'cancelled', label: `Cancelled (${orders.filter(o => o.deliveryStatus === 'cancelled').length})` },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all duration-200 whitespace-nowrap cursor-pointer shadow-2xs ${
                  statusFilter === f.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 hover:bg-slate-50/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="w-9 h-9 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">
              {t('shop.loadingHistory', 'Loading order history...')}
            </p>
          </div>
        ) : activeTab === 'products' ? (
          filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {statusFilter === 'all' ? t('shop.noOrdersYet', 'No orders placed yet') : 'No orders in this status'}
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {t('shop.firstOrderHelp', 'Browse our medical store for certified supplements, diagnostic tests, and health kits.')}
                </p>
              </div>
              {onBack && statusFilter === 'all' && (
                <button
                  onClick={onBack}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition-all"
                >
                  Explore Store
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => {
                const currencySymbol = order.currency === 'USD' ? '$' : '₹';
                const hasRated = userReviews.some(r => r.orderId === order._id);
                const isDelivered = order.deliveryStatus === 'delivered';
                const statusMeta = getStatusBadge(order.deliveryStatus);
                const formattedDate = new Date(order.createdAt || order.updatedAt || Date.now()).toLocaleDateString(activeLocale, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });

                return (
                  <div 
                    key={order._id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.06)] hover:border-indigo-200 dark:hover:border-indigo-800/60 rounded-[2rem] p-5 sm:p-6 space-y-4.5 transition-all duration-300 cursor-pointer group"
                  >
                    {/* Top Row: Order ID, Date, Status Badges */}
                    <div className="flex flex-wrap justify-between items-center gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                            #{order.vendorOrderId || order._id.slice(-8).toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyOrderId(e, order.vendorOrderId || order._id)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Copy Order ID"
                          >
                            {copiedOrderId === (order.vendorOrderId || order._id) ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-semibold block">
                            Ordered on {formattedDate}
                          </span>
                          {order.vendorOrderId && (
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                              Ref: #{order._id.slice(-6).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Badge */}
                        <div className={`px-3 py-1 rounded-full border flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider shadow-2xs ${statusMeta.color}`}>
                          <span className={`h-2 w-2 rounded-full ${statusMeta.dot}`} />
                          <span>{statusMeta.label}</span>
                        </div>

                        {/* Payment Pill */}
                        <span className={`text-[11px] font-black px-3 py-1 rounded-full border uppercase tracking-wider shadow-2xs ${
                          order.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        }`}>
                          {order.status === 'completed' ? '✓ Paid Online' : 'Payment Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Items preview strip */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-x-auto pb-1 max-w-full scrollbar-none">
                        {order.products?.slice(0, 4).map((p: any, pIdx: number) => (
                          <div key={pIdx} className="flex items-center gap-2.5 bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-2.5 shrink-0">
                            <div className="h-12 w-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs p-1">
                              <ProductImage 
                                src={p.productId?.image || p.image} 
                                apiUrl={apiUrl} 
                                title={p.name} 
                                className="h-full w-full object-contain" 
                                textClassName="text-lg" 
                              />
                            </div>
                            <div className="max-w-[140px] pr-1">
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate block leading-snug">
                                {p.name}
                              </span>
                              <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
                                Qty: {p.qty} {p.variantName ? `• ${p.variantName}` : ''}
                              </span>
                            </div>
                          </div>
                        ))}

                        {order.products && order.products.length > 4 && (
                          <span className="text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl shrink-0">
                            +{order.products.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Recipient Snippet */}
                      {order.shippingAddress && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 shrink-0 hidden md:block text-right">
                          <span className="block font-medium">Deliver to</span>
                          <span className="font-extrabold text-slate-700 dark:text-slate-300">
                            {order.patientName || 'Recipient'} ({order.shippingAddress.postalCode})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Actions & Total Amount */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-0.5">
                          Total Amount Paid
                        </span>
                        <span className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                          {currencySymbol}{order.totalAmount.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Primary View Order Details Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer active:scale-98"
                        >
                          <span>View Order Details</span>
                          <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>

                        {/* INVOICE PDF: STRICTLY ONLY SHOWN WHEN ORDER IS DELIVERED */}
                        {isDelivered && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadShopInvoice(order._id, order.invoiceUrl);
                            }}
                            disabled={downloadingShopInvoiceId === order._id}
                            className="py-2.5 px-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                            title="Download official tax invoice"
                          >
                            {downloadingShopInvoiceId === order._id ? (
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-indigo-500 border-t-transparent" />
                            ) : (
                              <Download className="h-3.5 w-3.5 text-indigo-500" />
                            )}
                            <span>{downloadingShopInvoiceId === order._id ? 'Generating...' : 'Invoice PDF'}</span>
                          </button>
                        )}

                        {/* Rate Products Button (Delivered Only) */}
                        {isDelivered && !hasRated && onRateOrder && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRateOrder(order._id);
                            }}
                            className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                          >
                            <Star className="h-3.5 w-3.5 fill-white" />
                            <span>Rate Products</span>
                          </button>
                        )}

                        {/* Track external link if available */}
                        {order.trackingDetails?.trackingUrl && (
                          <a
                            href={order.trackingDetails.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="py-2.5 px-3.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-2xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 transition-colors"
                          >
                            <Truck className="h-3.5 w-3.5" />
                            <span>Track Package</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSupportForm({ name: '', email: '', question: '', relatedId: order._id, type: 'PRODUCT' });
                            setShowSupportModal(true);
                          }}
                          className="py-2.5 px-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 transition-all shadow-2xs"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                          <span>Help</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Lab Test Bookings */
          labBookings.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto">
                <Beaker className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-slate-700 dark:text-slate-200">{t('shop.noTestHistory', 'No test history')}</h3>
              <p className="text-xs text-slate-450 mt-1">{t('shop.bookTestHelp', 'Book a lab test to see your history here.')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {labBookings.map((booking: any) => {
                const reportReady = booking.status === 'REPORT_READY' || booking.status === 'COMPLETED';
                return (
                  <div key={booking._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5 space-y-4 hover:shadow-md transition-all">
                    <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{t('shop.bookingId', 'Booking ID')}</span>
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">#{booking._id.slice(-8).toUpperCase()}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border uppercase tracking-wider ${
                          reportReady ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200'
                        }`}>
                          {t('common.status', 'Status')}: {booking.status === 'COMPLETED' ? 'Completed' : booking.status === 'CONFIRMED' ? 'Confirmed' : booking.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm truncate leading-snug">
                          {booking.labTestId?.cancerScreeningTestId?.name || booking.labTestId?.name || 'Diagnostic Health Test'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {new Date(booking.preferredDate).toLocaleDateString(activeLocale, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">• {booking.preferredTime}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Collection: {booking.collectionType === 'HOME' ? 'Home Collection' : 'Lab Visit'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-slate-400 block font-bold">Total Paid</span>
                        <span className="font-black text-slate-900 dark:text-slate-100 text-base block">₹{booking.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setSupportForm({ name: '', email: '', question: '', relatedId: booking._id, type: 'LAB_TEST' });
                            setShowSupportModal(true);
                          }}
                          className="py-2 px-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <HelpCircle className="h-3.5 w-3.5 text-slate-500" /> Need Help?
                        </button>

                        {/* Lab invoice */}
                        <button
                          onClick={() => handleDownloadLabInvoice(booking._id)}
                          disabled={downloadingLabInvoiceId === booking._id}
                          className="py-2 px-3.5 border border-indigo-200 dark:border-indigo-800/40 bg-indigo-50/60 dark:bg-indigo-950/30 hover:bg-indigo-100 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {downloadingLabInvoiceId === booking._id ? (
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-indigo-500 border-t-transparent" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 text-indigo-500" />
                          )}
                          <span>Invoice</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {reportReady ? (
                          <button 
                            onClick={() => handleDownloadReport(booking._id)}
                            disabled={downloadingLabReportId === booking._id}
                            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Download Report</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> Awaiting Report
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

      </div>

      {/* Support Ticket Modal */}
      {renderSupportModal()}

    </div>
  );
};
