import React, { useState, useEffect } from 'react';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Check,
  X,
  CreditCard,
  Calendar,
  FileText,
  ArrowLeft,
  AlertTriangle,
  Award,
  Percent,
  Sparkles,
  Download,
  ShieldCheck,
  Ticket,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { Capacitor } from '@capacitor/core';
import { downloadFile } from '../utils/fileDownloader';

interface FeatureFlag {
  unlimitedReports: boolean;
  advancedAnalysis: boolean;
  premiumVideos: boolean;
  foodInsights: boolean;
  exportReports: boolean;
  notifications: boolean;
  foodScanner: boolean;
}

interface Plan {
  _id: string;
  name: string;
  code: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  originalMonthlyPrice?: number;
  originalYearlyPrice?: number;
  monthlyFreeQuestions?: number;
  yearlyFreeQuestions?: number;
  trialDays: number;
  trialHours?: number;
  badge?: 'Popular' | 'Recommended' | 'Best Value' | 'None';
  color?: string;
  features: FeatureFlag;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  billingName: string;
  billingEmail: string;
  createdAt: string;
  paymentTransactionId?: string;
}

interface SubscriptionDetails {
  _id: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  status: 'active' | 'trialing' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  cancelAtPeriodEnd: boolean;
}

interface SubscriptionPageProps {
  onBack: () => void;
  onSuccess?: () => void;
  isBlocking?: boolean;
}

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  hi: 'hi-IN'
};

export const Subscription: React.FC<SubscriptionPageProps> = ({ onBack, onSuccess, isBlocking = false }) => {
  const { user, token, apiUrl, branding } = useAuth();
  const { t, language } = useLanguage();
  const activeLocale = LOCALE_MAP[language] || 'en-US';
  const isIOSAppStoreBlocked = Capacitor.getPlatform() === 'ios' && !branding.enableIOSExternalPayments;

  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSub, setActiveSub] = useState<SubscriptionDetails | null>(null);
  const [activePlanDetails, setActivePlanDetails] = useState<Plan | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const billingCycle = 'yearly';
  const [gstPercentage, setGstPercentage] = useState<number>(18);
  const [subscriptionGstInclusive, setSubscriptionGstInclusive] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [trialLoading, setTrialLoading] = useState<boolean>(false);
  const [canStartTrial, setCanStartTrial] = useState<boolean>(false);
  const [hasUsedTrial, setHasUsedTrial] = useState<boolean>(false);
  const [trialHoursRemaining, setTrialHoursRemaining] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Coupon promo state
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState<boolean>(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [showTrialPopup, setShowTrialPopup] = useState<boolean>(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);
    try {
      const res = await fetch(`${apiUrl}/subscriptions/validate-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Platform': Capacitor.getPlatform()
        },
        body: JSON.stringify({ couponCode: couponCode.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Coupon validation failed.');
      }
      setAppliedCoupon({
        code: data.couponCode,
        discountType: data.discountType,
        discountValue: data.discountValue
      });
      setCouponSuccess(`Coupon code '${data.couponCode}' applied successfully!`);
    } catch (err: any) {
      setCouponError(err.message || 'Error validating coupon.');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Fetch plans and current subscription status
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Plans
      const plansRes = await fetch(`${apiUrl}/subscriptions/plans`);
      if (!plansRes.ok) throw new Error('Failed to load subscription plans.');
      const plansData = await plansRes.json();
      setPlans(plansData);

      // 2. Fetch User Subscription Info
      if (token) {
        const subRes = await fetch(`${apiUrl}/subscriptions/current`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (subRes.ok) {
          const subData = await subRes.json();
          setActiveSub(subData.subscription);
          setActivePlanDetails(subData.plan);
          setInvoices(subData.invoices || []);
          if (subData.gstPercentage !== undefined) {
            setGstPercentage(subData.gstPercentage);
          }
          if (subData.subscriptionGstInclusive !== undefined) {
            setSubscriptionGstInclusive(subData.subscriptionGstInclusive);
          }
          setCanStartTrial(!!subData.canStartTrial);
          setHasUsedTrial(!!subData.hasUsedTrial);
          setTrialHoursRemaining(subData.trialHoursRemaining || 0);

          // Show popup if the user can start a trial and does not have an active subscription
          const hasActive = subData.subscription && (
            (subData.subscription.status === 'active' && new Date(subData.subscription.endDate) > new Date()) ||
            (subData.subscription.status === 'trialing' && subData.subscription.trialEndDate && new Date(subData.subscription.trialEndDate) > new Date()) ||
            (subData.subscription.status === 'cancelled' && new Date(subData.subscription.endDate) > new Date())
          );
          if (!hasActive && subData.canStartTrial) {
            setShowTrialPopup(true);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred loading subscription details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    setTrialLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${apiUrl}/subscriptions/start-trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Platform': Capacitor.getPlatform()
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to start free trial.');
      setSuccessMsg(data.message || 'Congratulations! Your 48-hour free trial has been activated.');
      setShowTrialPopup(false);
      await fetchData();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error starting free trial.');
    } finally {
      setTrialLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiUrl, token]);

  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState<boolean>(false);

  const confirmCancelAutoRenew = async () => {
    setShowCancelConfirmModal(false);
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${apiUrl}/subscriptions/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to cancel auto-renewal.');

      setSuccessMsg(t('sub.autoRenewTurnedOffUntil', { date: new Date(data.subscription.endDate).toLocaleDateString(activeLocale), defaultValue: 'Auto-renewal turned off. Your subscription is active until ' + new Date(data.subscription.endDate).toLocaleDateString(activeLocale) }));
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${apiUrl}/subscriptions/reactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reactivate auto-renewal.');

      setSuccessMsg('Auto-renewal enabled successfully.');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    setError(null);
    setSuccessMsg(null);
    setActionLoading(true);

    try {
      await downloadFile({
        url: `${apiUrl}/subscriptions/invoices/${invoiceId}/download`,
        filename: `Invoice-${invoiceNumber}.pdf`,
        token
      });
      setSuccessMsg('Invoice PDF downloaded successfully.');
    } catch (err: any) {
      console.error('Error downloading invoice PDF:', err);
      setError(err.message || 'Error downloading invoice PDF.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Create order
      const orderRes = await fetch(`${apiUrl}/subscriptions/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Platform': Capacitor.getPlatform()
        },
        body: JSON.stringify({
          planId,
          billingCycle,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || 'Failed to initialize order.');

      if (orderData.gateway === 'free') {
        setSuccessMsg(`Congratulations! Your promo subscription to ${orderData.planName} has been successfully activated.`);
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponSuccess(null);
        await fetchData();
        if (onSuccess) onSuccess();
      } else if (orderData.gateway === 'mock') {
        // Handle mock payment verification immediately
        const verifyRes = await fetch(`${apiUrl}/subscriptions/mock-verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Platform': Capacitor.getPlatform()
          },
          body: JSON.stringify({ orderId: orderData.orderId })
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) throw new Error(verifyData.message || 'Mock payment verification failed.');

        setSuccessMsg(`Congratulations! Your subscription to ${orderData.planName} has been successfully activated.`);
        await fetchData();
        if (onSuccess) onSuccess();
      } else if (orderData.gateway === 'razorpay') {
        // Handle real Razorpay Checkout modal
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: branding.appName,
          description: `Subscription to ${orderData.planName}`,
          order_id: orderData.orderId,
          handler: async (response: any) => {
            setActionLoading(true);
            try {
              const verifyRes = await fetch(`${apiUrl}/subscriptions/verify-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'X-Platform': Capacitor.getPlatform()
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.message || 'Payment verification failed.');

              setSuccessMsg(`Congratulations! Your payment has been verified and your subscription to ${orderData.planName} is now active.`);
              await fetchData();
              if (onSuccess) onSuccess();
            } catch (err: any) {
              setError(err.message || 'Error verifying Razorpay payment signature.');
            } finally {
              setActionLoading(false);
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || ''
          },
          theme: {
            color: '#2563EB'
          },
          retry: {
            enabled: true,
            max_count: 4
          },
          modal: {
            backdropclose: false,
            escape: false,
            handleback: false,
            ondismiss: () => {
              setActionLoading(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (resp: any) => {
          console.warn('[Razorpay] Payment failed event:', resp?.error);
          setError(resp?.error?.description || resp?.error?.reason || 'Payment could not be completed.');
          setActionLoading(false);
        });
        rzp.open();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during payment checkout.');
      setActionLoading(false);
    }
  };

  const renderFeatureList = (features: FeatureFlag, plan?: Plan) => {
    const includedQuestions = billingCycle === 'yearly'
      ? (plan?.yearlyFreeQuestions ?? 10)
      : (plan?.monthlyFreeQuestions ?? 1);

    const featureLabels = [
      { 
        key: 'doctorQuestions', 
        label: `${includedQuestions} Free Doctor Consultation Question${includedQuestions > 1 ? 's' : ''} / ${billingCycle === 'yearly' ? 'Year' : 'Month'} (48h Reply SLA)`,
        highlight: true,
        alwaysIncluded: true
      },
      { key: 'unlimitedReports', label: 'Unlimited Abbott CGM Report Uploads' },
      { key: 'advancedAnalysis', label: 'Advanced Spikes & Glucose Analysis' },
      { key: 'foodInsights', label: 'Top Safe / Moderate / Avoid Food Insights' },
      { key: 'exportReports', label: 'Export Comprehensive PDF Reports' },
      { key: 'premiumVideos', label: 'Premium Educational Guides & Videos' },
      { key: 'notifications', label: 'Custom Meal Reminders & Spikes Alerts' },
      { key: 'foodScanner', label: 'Food Scanner & Macros Estimation', highlight: true }
    ];

    return (
      <ul className="space-y-2.5 my-4 text-xs font-semibold text-slate-600">
        {featureLabels.map((f) => {
          const hasFeature = f.alwaysIncluded ? true : !!(features as any)[f.key];
          const isHighlighted = f.highlight;
          return (
            <li key={f.key} className="flex items-start space-x-2">
              {hasFeature ? (
                <Check className="h-4.5 w-4.5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <X className="h-4.5 w-4.5 text-slate-300 shrink-0 mt-0.5" />
              )}
              {isHighlighted ? (
                <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${hasFeature
                    ? 'text-indigo-700 bg-indigo-50 border border-indigo-100'
                    : 'text-slate-400 bg-slate-50 border border-slate-100 line-through'
                  }`}>
                  <span>{f.label}</span>
                  {hasFeature && (
                    <span className="text-[7px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold animate-pulse">
                      {t('sub.included', 'Included')}
                    </span>
                  )}
                </span>
              ) : (
                <span className={hasFeature ? 'text-slate-700' : 'text-slate-400 line-through'}>
                  {f.label}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-slate-950 flex flex-col pt-12 pb-24 px-6 md:px-10 lg:px-16">
        <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-center items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{t('sub.fetchingPlans', 'Fetching plans and billing data...')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 px-4 sm:px-6 md:px-10 lg:px-16 max-w-3xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-full h-full overflow-y-auto w-full">
      {/* Sleek Sticky Header */}
      <div 
        className={`sticky top-0 z-40 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-16 px-4 sm:px-6 md:px-10 lg:px-16 pb-3 ${isBlocking ? 'mb-6' : 'mb-4'} shadow-xs flex items-center justify-between`}
        style={isBlocking ? { paddingTop: 'calc(env(safe-area-inset-top, 24px) + 12px)' } : { paddingTop: '12px' }}
      >
        <div className="flex items-center space-x-3">
          {!isBlocking && (
            <button 
              onClick={onBack} 
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-2xs cursor-pointer"
              title={t('goBackTitle')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="font-black text-slate-900 dark:text-slate-100 text-lg sm:text-xl tracking-tight leading-tight">
              Subscription & Plans
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your membership & clinical features
            </p>
          </div>
        </div>
        {isBlocking && (
          <button
            onClick={onBack}
            className="text-xs font-extrabold text-rose-600 hover:text-rose-700 flex items-center space-x-1 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 rounded-full border border-rose-200 dark:border-rose-800/50 transition-all cursor-pointer shadow-xs"
          >
            <span>{t('signOutAction')}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-red-50 text-danger text-xs font-semibold rounded-2xl border border-red-100 flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-danger mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3.5 bg-green-50 text-green-700 text-xs font-semibold rounded-2xl border border-green-100 flex items-start space-x-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Active Subscription Banner */}
      {activeSub && activePlanDetails ? (
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft mb-6">
          {/* Subtle Ambient Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex justify-between items-start mb-3 relative z-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200/60 dark:border-slate-700">
                {t('sub.yourCurrentTier', 'Your Current Tier')}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 flex items-center gap-2">
                <span style={{ color: activePlanDetails.color }}>{activePlanDetails.name}</span>
                {activeSub.status === 'trialing' && (
                  <span className="text-[9.5px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-700/60 px-2 py-0.5 rounded-md leading-none self-center">
                    {t('sub.freeTrial', 'Free Trial')}
                  </span>
                )}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                ₹{activeSub.billingCycle === 'yearly' ? activePlanDetails.yearlyPrice : activePlanDetails.monthlyPrice}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">
                / {activeSub.billingCycle}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4">
            {activePlanDetails.description}
          </p>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <span>{t('startDateLabel')}</span>
              </span>
              <span className="text-slate-800 dark:text-slate-100 font-bold">
                {new Date(activeSub.startDate).toLocaleDateString(activeLocale)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <span>{activeSub.status === 'trialing' ? t('sub.trialExpiry', 'Trial Expiry') : activeSub.cancelAtPeriodEnd ? t('sub.expiryDate', 'Expiry Date') : t('sub.renewalDate', 'Renewal Date')}</span>
              </span>
              <span className="text-slate-800 dark:text-slate-100 font-bold">
                {new Date(activeSub.status === 'trialing' && activeSub.trialEndDate ? activeSub.trialEndDate : activeSub.endDate).toLocaleDateString(activeLocale)}
              </span>
            </div>

            {activeSub.cancelAtPeriodEnd ? (
              <div className="space-y-2.5 pt-2">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
                  <span>{t('sub.autoRenewDisabledExpireOn', { date: new Date(activeSub.endDate).toLocaleDateString(activeLocale), defaultValue: `Auto-renew is disabled. Your access will expire on ${new Date(activeSub.endDate).toLocaleDateString(activeLocale)}.` })}</span>
                </div>
                <button
                  onClick={handleReactivateSubscription}
                  disabled={actionLoading}
                  className="w-full bg-primary hover:bg-primary-dark text-white text-xs font-bold py-3 rounded-2xl transition-all shadow-sm cursor-pointer"
                >
                  {actionLoading ? t('common.processing', 'Processing...') : t('sub.turnOnAutoRenewal', 'Turn On Auto-Renewal')}
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  onClick={() => setShowCancelConfirmModal(true)}
                  disabled={actionLoading}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold py-2.5 rounded-2xl transition-all cursor-pointer"
                >
                  {actionLoading ? 'Processing...' : 'Turn Off Auto-Renewal'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-primary/5 border border-primary/10 dark:bg-primary/10 dark:border-primary/20 rounded-3xl p-5 mb-6 text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-2 animate-bounce" />
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Unlock Full {branding.appName} Access</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Choose a premium tier to upload CGM reports, calculate insights, and receive spike alerts.
          </p>
        </div>
      )}

      {/* Modern Cancel Auto-Renewal Modal */}
      {showCancelConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm border border-slate-150 dark:border-slate-800 shadow-2xl animate-scaleIn text-slate-800 dark:text-slate-100 text-center">
            <div className="mx-auto w-12 h-12 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-2xl flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-1">{t('sub.disableAutoRenewalQ', 'Disable Auto-Renewal?')}</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed mb-5">
              Your premium access will remain fully active until the end of your current billing cycle.
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowCancelConfirmModal(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-extrabold py-3 rounded-2xl transition-all"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={confirmCancelAutoRenew}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold py-3 rounded-2xl transition-all shadow-md shadow-amber-500/20"
              >
                Turn Off
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards Listing */}
      <div className="mb-8">
        {/* Modern Section Header for Single Annual Plan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>{t('sub.annualMembership', 'Mito_Reboot Annual Membership')}</span>
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              48 Hours Free Trial • ₹1,000 / year thereafter (slashed from ₹3,600)
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 self-start sm:self-auto shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-300">
              72% OFF Special Launch Offer
            </span>
          </div>
        </div>

        {/* Coupon Input Area */}
        {branding.enableSubscriptionCoupons && !isIOSAppStoreBlocked && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-soft mb-6 transition-all">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-primary" />
                <span>{t('sub.haveCoupon', 'Have a promo coupon code?')}</span>
              </label>
              {appliedCoupon && (
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Applied: {appliedCoupon.code}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('enterPromoCodePlaceholder', 'e.g. SAVE20, FREE100')}
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  if (couponError) setCouponError(null);
                }}
                disabled={couponLoading || !!appliedCoupon}
                className="flex-1 px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/60 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white dark:focus:bg-slate-900 disabled:opacity-60 transition-all"
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode('');
                    setCouponSuccess(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
                >
                  Clear
                </button>
              ) : (
                <button
                  type="button"
                  id="apply-coupon-btn"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 shrink-0"
                >
                  {couponLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{couponLoading ? 'Checking...' : 'Apply'}</span>
                </button>
              )}
            </div>
            {couponError && (
              <div className="mt-2.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                <span>{couponError}</span>
              </div>
            )}
            {couponSuccess && (
              <div className="mt-2.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                <span>{couponSuccess}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          {plans.map((plan) => {
            const isTrialActive = activeSub && activeSub.status === 'trialing' && activeSub.trialEndDate && new Date(activeSub.trialEndDate) > new Date();
            const isPaidActive = activeSub && activeSub.status === 'active' && new Date(activeSub.endDate) > new Date();
            const isActivePlan = isPaidActive;
            const price = plan.yearlyPrice;
            const color = plan.color || '#4F46E5';
            const currencySymbol = '₹';

            // Calculate coupon discount
            let discount = 0;
            if (appliedCoupon) {
              if (appliedCoupon.discountType === 'percentage') {
                discount = parseFloat(((price * appliedCoupon.discountValue) / 100).toFixed(2));
              } else {
                discount = appliedCoupon.discountValue;
              }
              if (discount > price) {
                discount = price;
              }
            }
            const finalPrice = parseFloat((price - discount).toFixed(2));
            const origPrice = plan.originalYearlyPrice || 3600;
            const hasOriginalPrice = origPrice > price;
            const discountPct = hasOriginalPrice ? Math.round(((origPrice - price) / origPrice) * 100) : 72;

            // GST and total calculation
            const effectivePrice = discount > 0 ? finalPrice : price;
            let taxableBase = effectivePrice;
            let gstAmount = 0;
            let totalToPay = effectivePrice;

            if (subscriptionGstInclusive) {
              totalToPay = effectivePrice;
              taxableBase = gstPercentage > 0
                ? parseFloat((totalToPay / (1 + gstPercentage / 100)).toFixed(2))
                : totalToPay;
              gstAmount = parseFloat((totalToPay - taxableBase).toFixed(2));
            } else {
              taxableBase = effectivePrice;
              gstAmount = parseFloat(((taxableBase * gstPercentage) / 100).toFixed(2));
              totalToPay = parseFloat((taxableBase + gstAmount).toFixed(2));
            }

            return (
              <div
                key={plan._id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-soft transition-all hover:border-slate-300 dark:hover:border-slate-700 relative"
              >
                {/* Accent line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-primary to-indigo-600"></div>

                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                    <h4 className="text-lg sm:text-xl font-black tracking-tight" style={{ color: color }}>
                      {plan.name}
                    </h4>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full text-white bg-indigo-600 shadow-xs">
                        {plan.badge || 'Best Value'}
                      </span>
                      <span className="text-[10px] font-black px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-full flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        <span>48 Hours Free Trial</span>
                      </span>
                      {hasOriginalPrice && (
                        <span className="text-[10px] font-black px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 rounded-full flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          <span>{discountPct}% INTRO OFFER</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4">
                    {plan.description}
                  </p>

                  {/* Price breakdown: Base, GST, Total */}
                  <div className="mb-4 text-xs font-semibold text-slate-600 dark:text-slate-400 space-y-1.5 bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-orange-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-2.5 rounded-xl text-xs font-bold mb-2">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span>Special Launch Deal (Save {discountPct}%)</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="line-through text-slate-400 text-xs font-medium">{currencySymbol}{origPrice}</span>
                        <span className="text-amber-600 dark:text-amber-400 font-black text-sm">{currencySymbol}{price} / year</span>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <span>{subscriptionGstInclusive ? t('basePlanPriceExclLabel', 'Base Plan Price (Excl. Tax)') : t('basePlanPriceLabel', 'Base Plan Price')}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold flex items-center gap-1.5">
                        {discount === 0 && (
                          <span className="line-through text-slate-400 text-[11px] font-normal">{currencySymbol}{origPrice}</span>
                        )}
                        <span>{currencySymbol}{taxableBase.toFixed(2)}</span>
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-rose-500 text-[10px] font-bold">
                        <span>Coupon Discount ({appliedCoupon?.code}):</span>
                        <span>-{currencySymbol}{discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[11px]">
                      <span>GST ({gstPercentage}%{subscriptionGstInclusive ? ' Included' : ''}):</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{currencySymbol}{gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-slate-200/60 dark:border-slate-750/50 my-1"></div>
                    <div className="flex justify-between font-black text-slate-900 dark:text-slate-100 text-sm">
                      <span className="flex items-baseline space-x-0.5">
                        <span>Total Price</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold ml-1">/ year</span>
                      </span>
                      <span className="text-primary font-black">{currencySymbol}{totalToPay.toFixed(2)}</span>
                    </div>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50/90 dark:bg-blue-900/30 border border-blue-200/80 dark:border-blue-800/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>Free for 48 hours • Then {currencySymbol}{price} / year</span>
                      </span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                    {renderFeatureList(plan.features, plan)}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 space-y-2">
                    {isActivePlan ? (
                      <div className="text-center py-3 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 font-extrabold flex items-center justify-center space-x-1.5 shadow-xs">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <span>{t('sub.activeSubscription', 'Active Annual Subscription')}</span>
                      </div>
                    ) : isTrialActive ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-2xl border border-amber-200/70 dark:border-amber-900/30 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                            <span>Free Trial Active ({trialHoursRemaining}h remaining)</span>
                          </span>
                          <span className="text-[10px] font-extrabold bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                            48h SLA
                          </span>
                        </div>
                        <button
                          onClick={() => handleSubscribe(plan._id)}
                          disabled={actionLoading}
                          className="w-full text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer bg-primary hover:bg-primary-dark"
                        >
                          <CreditCard className="h-4.5 w-4.5" />
                          <span className="text-xs sm:text-sm font-black tracking-wide">
                            Upgrade Now to Annual Plan ({currencySymbol}{totalToPay.toFixed(2)}/yr)
                          </span>
                        </button>
                      </div>
                    ) : isIOSAppStoreBlocked ? (
                      <div className="text-center py-3 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold px-2">
                        <span>{t('sub.iosIapSoon', 'In-App Purchases coming soon to iOS')}</span>
                      </div>
                    ) : canStartTrial ? (
                      <div className="space-y-2">
                        <button
                          onClick={handleStartTrial}
                          disabled={trialLoading || actionLoading}
                          className="w-full bg-gradient-to-r from-primary via-indigo-600 to-primary hover:from-primary-dark hover:to-indigo-700 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.99] flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {trialLoading ? (
                            <Loader2 className="h-4.5 w-4.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-4.5 w-4.5 text-amber-300 animate-pulse" />
                          )}
                          <span className="text-xs sm:text-sm font-black tracking-wide">
                            {trialLoading ? 'Activating Free Trial...' : 'Start 48-Hour Free Trial (No Card Needed)'}
                          </span>
                        </button>

                        <button
                          onClick={() => handleSubscribe(plan._id)}
                          disabled={actionLoading || trialLoading}
                          className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold py-3 px-4 rounded-2xl transition-all cursor-pointer flex items-center justify-center space-x-2 text-xs border border-slate-200/80 dark:border-slate-700"
                        >
                          <CreditCard className="h-4 w-4" />
                          <span>Or Subscribe Directly ({currencySymbol}{totalToPay.toFixed(2)} / yr)</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {hasUsedTrial && (
                          <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                            <span>Your 48-hour free trial has ended. Subscribe to unlock all features.</span>
                          </div>
                        )}
                        <button
                          onClick={() => handleSubscribe(plan._id)}
                          disabled={actionLoading}
                          className="w-full text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
                          style={{ backgroundColor: color }}
                        >
                          <CreditCard className="h-4.5 w-4.5" />
                          <span className="text-xs sm:text-sm font-black tracking-wide">
                            Subscribe Now ({currencySymbol}{totalToPay.toFixed(2)} / year)
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice Directory */}
      {invoices.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-soft">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
            <FileText className="h-4 w-4" />
            <span>{t('sub.billingInvoiceHistory', 'Billing & Invoice History')}</span>
          </h4>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto no-scrollbar">
            {invoices.map((inv) => (
              <div key={inv._id} className="py-3 flex justify-between items-center text-xs font-semibold">
                <div>
                  <span className="text-slate-800 dark:text-slate-100 font-bold block">{inv.invoiceNumber}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                    {new Date(inv.createdAt).toLocaleDateString(activeLocale)}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-700 dark:text-slate-200 font-bold">₹{inv.totalAmount.toFixed(2)}</span>
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-primary transition-all cursor-pointer"
                  >
                    <Download className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Modal Details */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative animate-fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center space-x-1">
                <FileText className="h-4 w-4 text-primary" />
                <span>{t('sub.invoiceDetails', 'Invoice Details')}</span>
              </span>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full cursor-pointer"
              >
                {t('common.close', 'Close')}
              </button>
            </div>

            <div className="space-y-2 mb-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <div className="flex justify-between">
                <span>{t('sub.invoiceNumber', 'Invoice Number:')}</span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('sub.paymentReference', 'Payment Reference:')}</span>
                <span className="text-slate-850 dark:text-slate-200 font-mono text-[10px]">{selectedInvoice.paymentTransactionId || t('sub.promoCodeManual', 'Promo Code / Manual')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('sub.billingDate', 'Billing Date:')}</span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">{new Date(selectedInvoice.createdAt).toLocaleDateString(activeLocale)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('sub.billingName', 'Billing Name:')}</span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">{selectedInvoice.billingName}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('sub.billingEmail', 'Billing Email:')}</span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">{selectedInvoice.billingEmail}</span>
              </div>
              <div className="border-t border-slate-200/60 dark:border-slate-800/60 my-2"></div>
              <div className="flex justify-between">
                <span>{t('sub.baseAmountTaxable', 'Base Amount (Taxable):')}</span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">₹{selectedInvoice.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center space-x-1">
                  <Percent className="h-3 w-3 text-slate-400" />
                  <span>GST ({Math.round((selectedInvoice.taxAmount / (selectedInvoice.amount || 1)) * 100)}%):</span>
                </span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">₹{selectedInvoice.taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 my-2"></div>
              <div className="flex justify-between text-sm font-extrabold text-slate-800 dark:text-slate-100">
                <span>{t('shop.totalPaid', 'Total Paid')}:</span>
                <span className="text-primary font-black">₹{selectedInvoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4">
              <button
                onClick={() => handleDownloadPDF(selectedInvoice._id, selectedInvoice.invoiceNumber)}
                disabled={actionLoading}
                className="w-full bg-primary hover:bg-primary-dark text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>{actionLoading ? t('sub.generatingPdf', 'Generating PDF...') : t('diag.downloadInvoicePdf', 'Download Invoice PDF')}</span>
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl flex items-center space-x-2 text-[10px] font-bold text-blue-800">
              <Award className="h-4.5 w-4.5 text-blue-600 shrink-0" />
              <span>Thank you for choosing {branding.appName}. Keep tracking to live anti-gravity health!</span>
            </div>
          </div>
        </div>
      )}
      {showTrialPopup && !activeSub && canStartTrial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 max-w-sm w-full border border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden transition-all duration-300">
            {/* Background design elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
            
            <button 
              onClick={() => setShowTrialPopup(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center pt-4">
              <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-[2rem] mb-4 shadow-soft">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              </div>
              
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                Claim 48-Hour Free Trial!
              </h3>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">
                Enjoy complete access to CGM reports, glucose spike analysis, AI food scanner, and coaching. Free for 48 hours, then ₹1,000/year (slashed from ₹3,600). No credit card required!
              </p>

              <div className="mt-6 space-y-2">
                <button
                  onClick={handleStartTrial}
                  disabled={trialLoading}
                  className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-dark hover:to-indigo-700 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-soft transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-xs flex items-center justify-center space-x-2"
                >
                  {trialLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  )}
                  <span>{trialLoading ? 'Activating Trial...' : 'Start 48-Hour Free Trial'}</span>
                </button>
                
                <button
                  onClick={() => setShowTrialPopup(false)}
                  className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-2.5 px-4 rounded-2xl transition-all duration-200 text-xs"
                >
                  Explore Membership Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
