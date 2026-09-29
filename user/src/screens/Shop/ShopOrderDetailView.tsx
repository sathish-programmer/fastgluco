import React, { useState } from 'react';
import { 
  ArrowLeft, Package, Truck, Download, Star, HelpCircle, 
  RefreshCw, ExternalLink, MapPin, Copy, Check, Clock, ShieldCheck, 
  Receipt, AlertCircle, RotateCcw, X, AlertTriangle
} from 'lucide-react';
import { ProductImage } from './ShopScreen';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface ShopOrderDetailViewProps {
  order: any;
  onBack: () => void;
  onRateOrder?: (orderId: string) => void;
  onReorder?: (products: any[]) => void;
  onRefreshTracking?: (orderId: string) => Promise<void>;
  isRefreshingTracking?: boolean;
  onDownloadInvoice?: (orderId: string, invoiceUrl?: string) => Promise<void>;
  isDownloadingInvoice?: boolean;
  onOpenSupport?: (orderId: string) => void;
  hasRated?: boolean;
}

export const ShopOrderDetailView: React.FC<ShopOrderDetailViewProps> = ({
  order: initialOrder,
  onBack,
  onRateOrder,
  onReorder,
  onRefreshTracking,
  isRefreshingTracking = false,
  onDownloadInvoice,
  isDownloadingInvoice = false,
  onOpenSupport,
  hasRated = false,
}) => {
  const { t, language } = useLanguage();
  const { apiUrl, token } = useAuth();
  const { showToast } = useToast();
  const [order, setOrder] = useState(initialOrder);

  const LOCALE_MAP: Record<string, string> = {
    en: 'en-US',
    ta: 'ta-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    hi: 'hi-IN'
  };
  const activeLocale = LOCALE_MAP[language] || 'en-US';

  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedTrackingId, setCopiedTrackingId] = useState(false);

  // Cancellation / Return Request Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelType, setCancelType] = useState<'cancellation' | 'return' | 'refund'>(
    order.deliveryStatus === 'delivered' ? 'return' : 'cancellation'
  );
  const [cancelReasonPreset, setCancelReasonPreset] = useState('');
  const [cancelReasonText, setCancelReasonText] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const handleSubmitCancelRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = [cancelReasonPreset, cancelReasonText].filter(Boolean).join(' - ').trim();
    if (!finalReason) {
      showToast('Please select or write a reason for this request.', 'error');
      return;
    }
    setSubmittingCancel(true);
    try {
      const res = await fetch(`${apiUrl}/shop/orders/${order._id}/cancel-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: cancelType,
          reason: finalReason
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Your request has been submitted.', 'success');
        if (data.order) {
          setOrder(data.order);
        }
        setShowCancelModal(false);
      } else {
        showToast(data.message || 'Failed to submit request.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error submitting request.', 'error');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.vendorOrderId || order._id);
    setCopiedOrderId(true);
    showToast(t('copiedToClipboard', 'Order ID copied to clipboard'), 'info');
    setTimeout(() => setCopiedOrderId(false), 2000);
  };

  const handleCopyTracking = (trackingId: string) => {
    navigator.clipboard.writeText(trackingId);
    setCopiedTrackingId(true);
    showToast(t('copiedToClipboard', 'Tracking ID copied to clipboard'), 'info');
    setTimeout(() => setCopiedTrackingId(false), 2000);
  };

  const currencySymbol = order.currency === 'USD' ? '$' : '₹';
  const isDelivered = order.deliveryStatus === 'delivered';
  const isCancelled = order.deliveryStatus === 'cancelled';

  // Delivery status styling
  const getDeliveryStatusMeta = (status?: string) => {
    switch (status) {
      case 'delivered':
        return {
          label: t('shop.statusDelivered', 'Delivered'),
          color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-500 shadow-emerald-500/50',
          icon: ShieldCheck,
          desc: order.deliveryDate 
            ? `Delivered on ${new Date(order.deliveryDate).toLocaleDateString(activeLocale, { month: 'short', day: 'numeric', year: 'numeric' })}`
            : 'Order safely delivered to recipient'
        };
      case 'shipped':
      case 'in_transit':
        return {
          label: t('shop.statusShipped', 'In Transit / Shipped'),
          color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          dot: 'bg-blue-500 shadow-blue-500/50 animate-pulse',
          icon: Truck,
          desc: order.estimatedDeliveryDate 
            ? `Estimated delivery by ${new Date(order.estimatedDeliveryDate).toLocaleDateString(activeLocale, { month: 'short', day: 'numeric' })}`
            : 'Package is on the way via courier'
        };
      case 'out_for_delivery':
      case 'out for delivery':
        return {
          label: 'Out for Delivery',
          color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
          dot: 'bg-cyan-500 shadow-cyan-500/50 animate-ping',
          icon: Truck,
          desc: 'Courier agent is arriving at your address today'
        };
      case 'packed':
        return {
          label: t('shop.stepPacked', 'Packed & Ready'),
          color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          dot: 'bg-indigo-500 shadow-indigo-500/50',
          icon: Package,
          desc: 'Items packed securely and awaiting courier pickup'
        };
      case 'accepted':
      case 'processing':
        return {
          label: t('shop.stepAccepted', 'Order Confirmed'),
          color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
          dot: 'bg-purple-500 shadow-purple-500/50',
          icon: Package,
          desc: 'Order confirmed and scheduled for packing'
        };
      case 'assigned':
        return {
          label: 'Processing',
          color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          dot: 'bg-amber-500 shadow-amber-500/50',
          icon: Clock,
          desc: 'Items are being prepared for dispatch'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          dot: 'bg-rose-500 shadow-rose-500/50',
          icon: AlertCircle,
          desc: 'This order was cancelled and refunded'
        };
      default:
        return {
          label: t('shop.stepOrderPlaced', 'Order Placed'),
          color: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
          dot: 'bg-slate-500',
          icon: Clock,
          desc: 'Order received and being processed'
        };
    }
  };

  const statusMeta = getDeliveryStatusMeta(order.deliveryStatus);

  // Fulfillment timeline steps (user-friendly customer language)
  const steps = [
    { key: 'placed', label: t('shop.stepOrderPlaced', 'Order Placed'), stepNum: 1 },
    { key: 'assigned', label: 'Processing', stepNum: 2 },
    { key: 'accepted', label: 'Confirmed', stepNum: 3 },
    { key: 'packed', label: t('shop.stepPacked', 'Packed & Ready'), stepNum: 4 },
    { key: 'shipped', label: t('shop.stepShipped', 'In Transit / Shipped'), stepNum: 5 },
    { key: 'delivered', label: t('shop.stepDelivered', 'Delivered'), stepNum: 6 }
  ];

  const statusRank: Record<string, number> = {
    pending: 0,
    assigned: 1,
    accepted: 2,
    processing: 2,
    packed: 3,
    shipped: 4,
    out_for_delivery: 4,
    delivered: 5
  };

  const currentStepIndex = statusRank[order.deliveryStatus || 'pending'] ?? 0;

  // Calculation helpers
  const itemsSubtotal = (order.products || []).reduce((sum: number, p: any) => sum + (p.price * p.qty), 0);
  const totalAmount = order.totalAmount ?? itemsSubtotal;
  const deliveryFee = order.shippingFee ?? 0;
  const discountAmount = order.discountAmount ?? 0;

  return (
    <div className="shop-screen-container pb-28 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Sticky Header */}
      <div 
        className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-2.5 sm:py-3 shadow-xs"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="h-10 px-4 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Orders</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div>
              <span className="text-[10px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase block">
                {t('shop.storeTitle', 'MitoReboot Store')}
              </span>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                Order Details
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSupport && (
              <button
                onClick={() => onOpenSupport(order._id)}
                className="h-9 px-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Need Help?</span>
              </button>
            )}

            {isDelivered && onDownloadInvoice && (
              <button
                onClick={() => onDownloadInvoice(order._id, order.invoiceUrl)}
                disabled={isDownloadingInvoice}
                className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDownloadingInvoice ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>Invoice PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 max-w-4xl mx-auto pt-6 space-y-6">

        {/* Hero Order Overview Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                {t('shop.orderId', 'Order ID')}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base sm:text-lg font-mono font-black text-slate-900 dark:text-slate-100">
                  #{order.vendorOrderId || order._id}
                </span>
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Copy Order ID"
                >
                  {copiedOrderId ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-450 dark:text-slate-500 block">
                  Placed on {new Date(order.createdAt || order.updatedAt || Date.now()).toLocaleDateString(activeLocale, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {order.vendorOrderId && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    Mito Ref: #{order._id.slice(-8).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Delivery Status Badge */}
              <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-black uppercase tracking-wider ${statusMeta.color}`}>
                <span className={`h-2 w-2 rounded-full ${statusMeta.dot}`} />
                <span>{statusMeta.label}</span>
              </div>

              {/* Payment Badge */}
              <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider ${
                order.status === 'completed'
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-405 border-emerald-200 dark:border-emerald-900/40'
                  : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
              }`}>
                {order.status === 'completed' ? '✓ Paid Online' : 'Payment Pending'}
              </span>
            </div>
          </div>

          {/* Status Subtitle Note */}
          <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <statusMeta.icon className="h-4 w-4 text-indigo-500 shrink-0" />
            <span className="font-semibold">{statusMeta.desc}</span>
          </div>

          {/* Cancellation / Return Request Status Banner */}
          {order.cancellationRequest && order.cancellationRequest.requestedAt && order.cancellationRequest.type && order.cancellationRequest.status ? (
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
              order.cancellationRequest.status === 'APPROVED'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
                : order.cancellationRequest.status === 'REJECTED'
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-black uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>
                    {order.cancellationRequest.type === 'cancellation' ? 'Order Cancellation' : order.cancellationRequest.type === 'return' ? 'Order Return' : 'Refund'} Request: {order.cancellationRequest.status}
                  </span>
                </span>
                <span className="text-[10px] font-bold opacity-75">
                  Requested on {new Date(order.cancellationRequest.requestedAt).toLocaleDateString(activeLocale, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                Reason: "{order.cancellationRequest.reason}"
              </p>
              {order.cancellationRequest.adminNotes && (
                <p className="text-[11px] font-semibold pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
                  Update: {order.cancellationRequest.adminNotes}
                </p>
              )}
              {order.cancellationRequest.status === 'PENDING' && (
                <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                  Our customer care team is reviewing your request. For eligible orders, refunds are issued directly to your original payment method.
                </p>
              )}
            </div>
          ) : !isCancelled ? (
            <div className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-slate-950/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                {isDelivered ? 'Need to return or request a refund for this order?' : 'Need to cancel this order?'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCancelType(isDelivered ? 'return' : 'cancellation');
                  setCancelReasonPreset('');
                  setCancelReasonText('');
                  setShowCancelModal(true);
                }}
                className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition shadow-2xs"
              >
                {isDelivered ? 'Request Return / Refund' : 'Request Cancellation'}
              </button>
            </div>
          ) : null}
        </div>

        {/* Visual Fulfillment Timeline Card */}
        {!isCancelled && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Logistics Tracking
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  Delivery Progress Timeline
                </h3>
              </div>

              {onRefreshTracking && (
                <button
                  type="button"
                  onClick={() => onRefreshTracking(order._id)}
                  disabled={isRefreshingTracking}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  title="Refresh live courier tracking status"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-indigo-500 ${isRefreshingTracking ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingTracking ? 'Syncing...' : 'Live Sync'}</span>
                </button>
              )}
            </div>

            {/* Stepper Bar */}
            <div className="relative pt-2 pb-1">
              {/* Connector Track */}
              {(() => {
                const progressPercent = Math.max(0, Math.min(100, (currentStepIndex / (steps.length - 1)) * 100));
                return (
                  <div className="absolute top-[19px] left-4 right-4 h-1 bg-slate-100 dark:bg-slate-800 rounded-full z-0 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700 rounded-full" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                );
              })()}

              {/* Step Dots */}
              <div className="relative z-10 flex justify-between items-start">
                {steps.map((step, idx) => {
                  const isCompleted = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center max-w-[70px] sm:max-w-[100px]">
                      <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                        isCompleted
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-4 ring-white dark:ring-slate-900 scale-105'
                          : 'bg-white dark:bg-slate-800 text-slate-400 border-2 border-slate-200 dark:border-slate-700 ring-4 ring-white dark:ring-slate-900'
                      } ${isCurrent ? 'ring-4 ring-indigo-400/40 animate-pulse' : ''}`}>
                        {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : step.stepNum}
                      </div>

                      <span className={`text-[9px] sm:text-[11px] font-extrabold mt-2 leading-tight block ${
                        isCurrent
                          ? 'text-indigo-600 dark:text-indigo-400 font-black'
                          : isCompleted
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Courier & Tracking Details Box matching Arivu schema */}
            {order.trackingDetails?.trackingId ? (
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/40 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-indigo-100/60 dark:border-indigo-900/30">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                        Shipment & Tracking Information
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {order.vendorId?.name || 'Arivu Foods'} Direct Dispatch
                      </span>
                    </div>
                  </div>

                  {order.trackingDetails.trackingUrl && (
                    <a
                      href={order.trackingDetails.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <span>Track Shipment: [Track Order]</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-50/80 dark:border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                      Order Status:
                    </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs mt-0.5 block uppercase">
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-50/80 dark:border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                      Logistics Provider:
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                      {order.trackingDetails.courierName || 'Logistics Provider Assigned'}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-50/80 dark:border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                      Tracking ID:
                    </span>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {order.trackingDetails.trackingId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyTracking(order.trackingDetails.trackingId)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                        title="Copy tracking ID"
                      >
                        {copiedTrackingId ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Ordered Items Full Details Table / Cards */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Items ({order.products?.length || 0})
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                Supplies & Nutrition
              </h3>
            </div>

            {onReorder && (
              <button
                type="button"
                onClick={() => onReorder(order.products)}
                className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 text-indigo-500" />
                <span>Buy Entire Order Again</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {order.products?.map((p: any, idx: number) => {
              const pImage = p.productId?.image || p.image;
              const unitPrice = p.price || 0;
              const itemTotal = unitPrice * p.qty;

              return (
                <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-16 w-16 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      <ProductImage 
                        src={pImage} 
                        apiUrl={apiUrl} 
                        title={p.name} 
                        className="h-12 w-12 object-contain" 
                        textClassName="text-2xl" 
                      />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                        {p.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {p.variantName && (
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-[10px] font-bold">
                            Pack: {p.variantName}
                          </span>
                        )}
                        <span className="text-slate-400 font-medium">
                          {currencySymbol}{unitPrice.toFixed(2)} × {p.qty}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Item Total</span>
                      <span className="text-base font-black text-slate-900 dark:text-slate-100">
                        {currencySymbol}{itemTotal.toFixed(2)}
                      </span>
                    </div>

                    {isDelivered && onRateOrder && (
                      <button
                        type="button"
                        onClick={() => onRateOrder(order._id)}
                        className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{hasRated ? 'Rated' : 'Rate'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-Column Details: Shipping Destination & Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Delivery & Destination Address Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Shipping Details
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Delivery Destination
                </h3>
              </div>
            </div>

            {order.shippingAddress ? (
              <div className="space-y-2 text-xs">
                {order.patientName && (
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Recipient</span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                      {order.patientName}
                    </p>
                    {order.patientPhone && (
                      <p className="text-slate-500 font-mono text-xs mt-0.5">
                        📞 {order.patientPhone}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Address</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed mt-0.5">
                    {order.shippingAddress.line1}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {order.shippingAddress.city ? `${order.shippingAddress.city}, ` : ''}
                    {order.shippingAddress.state} - <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{order.shippingAddress.postalCode}</span>
                  </p>
                  <p className="text-slate-450 dark:text-slate-500 text-[11px] font-semibold">
                    {order.shippingAddress.country || 'India'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No delivery address recorded.</p>
            )}

            {/* Fulfillment Partner Note */}
            <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm">
                  🌱
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Dispatched from {order.vendorId?.name || 'Arivu Foods'}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    100% genuine clinical-grade wellness packaging
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/40 px-2.5 py-1 rounded-lg">
                Verified Brand Partner
              </span>
            </div>
          </div>

          {/* Payment & Price Summary Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Billing Summary
                  </span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Payment Breakdown
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {currencySymbol}{itemsSubtotal.toFixed(2)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Coupon Discount</span>
                    <span className="font-bold">
                      -{currencySymbol}{discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Shipping & Delivery</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {deliveryFee > 0 ? `${currencySymbol}${deliveryFee.toFixed(2)}` : 'FREE'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-400 dark:text-slate-500 text-[11px]">
                  <span>Estimated Taxes (GST Included)</span>
                  <span>Included</span>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 block">
                      Total Amount Paid
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Paid via Razorpay / Online
                    </span>
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {currencySymbol}{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Invoice Section Inside Card */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              {isDelivered ? (
                onDownloadInvoice && (
                  <button
                    type="button"
                    onClick={() => onDownloadInvoice(order._id, order.invoiceUrl)}
                    disabled={isDownloadingInvoice}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isDownloadingInvoice ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>Download Official Tax Invoice (PDF)</span>
                  </button>
                )
              ) : (
                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Tax Invoice upon Delivery</span>
                    <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 leading-relaxed mt-0.5">
                      Your official GST tax invoice will be generated and available for download right here once this shipment is marked Delivered.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Customer Cancellation / Return / Refund Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    {cancelType === 'cancellation' ? 'Request Order Cancellation' : cancelType === 'return' ? 'Request Return' : 'Request Refund'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Order #{order.vendorOrderId || order._id.slice(-8).toUpperCase()}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCancelRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Request Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cancellation', 'return', 'refund'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCancelType(type)}
                      className={`py-2 px-2 rounded-xl text-xs font-extrabold capitalize border transition ${
                        cancelType === type
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reason for Request
                </label>
                <select
                  value={cancelReasonPreset}
                  onChange={(e) => setCancelReasonPreset(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select a reason --</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Need to change delivery address">Need to change delivery address</option>
                  <option value="Found alternative / cheaper product">Found alternative / cheaper product</option>
                  <option value="Expected delivery takes too long">Expected delivery takes too long</option>
                  <option value="Product arrived damaged or defective">Product arrived damaged or defective</option>
                  <option value="Incorrect item or quantity received">Incorrect item or quantity received</option>
                  <option value="Quality concerns or allergic sensitivity">Quality concerns or allergic sensitivity</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Details
                </label>
                <textarea
                  rows={3}
                  value={cancelReasonText}
                  onChange={(e) => setCancelReasonText(e.target.value)}
                  placeholder="Please provide any additional comments or context for our team..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-3 rounded-2xl border border-indigo-100/80 dark:border-indigo-900/40 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Requests are reviewed by our fulfillment team. Where eligible, refunds are credited back through our payment gateway to your original payment method.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel || (!cancelReasonPreset && !cancelReasonText.trim())}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shadow-sm disabled:opacity-50"
                >
                  {submittingCancel ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
