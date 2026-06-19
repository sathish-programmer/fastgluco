import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
  ShieldCheck
} from 'lucide-react';

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
  trialDays: number;
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

export const Subscription: React.FC<SubscriptionPageProps> = ({ onBack, onSuccess, isBlocking = false }) => {
  const { user, token, apiUrl, branding } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSub, setActiveSub] = useState<SubscriptionDetails | null>(null);
  const [activePlanDetails, setActivePlanDetails] = useState<Plan | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [gstPercentage, setGstPercentage] = useState<number>(18);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
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
          'Authorization': `Bearer ${token}`
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
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred loading subscription details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiUrl, token]);

  const handleCancelAutoRenew = async () => {
    if (!window.confirm('Are you sure you want to turn off auto-renewal? Your premium access will continue until the end of your billing cycle.')) {
      return;
    }

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
      
      setSuccessMsg('Auto-renewal turned off. Your subscription is active until ' + new Date(data.subscription.endDate).toLocaleDateString());
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
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${apiUrl}/subscriptions/invoices/${invoiceId}/download`, {
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to generate PDF invoice.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
      setSuccessMsg('Invoice PDF downloaded successfully.');
    } catch (err: any) {
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
          'Authorization': `Bearer ${token}`
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
            'Authorization': `Bearer ${token}`
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
                  'Authorization': `Bearer ${token}`
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
          modal: {
            ondismiss: () => {
              setActionLoading(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during payment checkout.');
      setActionLoading(false);
    }
  };

  const renderFeatureList = (features: FeatureFlag) => {
    const featureLabels = [
      { key: 'unlimitedReports', label: 'Unlimited Abbott CGM Report Uploads' },
      { key: 'advancedAnalysis', label: 'Advanced Spikes & Glucose Analysis' },
      { key: 'foodInsights', label: 'Top Safe / Moderate / Avoid Food Insights' },
      { key: 'exportReports', label: 'Export Comprehensive PDF Reports' },
      { key: 'premiumVideos', label: 'Premium Educational Guides & Videos' },
      { key: 'notifications', label: 'Custom Meal Reminders & Spikes Alerts' },
      { key: 'foodScanner', label: 'AI Photo Food Scanner & Macros Estimation', highlight: true }
    ];

    return (
      <ul className="space-y-2.5 my-4 text-xs font-semibold text-slate-600">
        {featureLabels.map((f) => {
          const hasFeature = !!(features as any)[f.key];
          const isHighlighted = f.highlight;
          return (
            <li key={f.key} className="flex items-start space-x-2">
              {hasFeature ? (
                <Check className="h-4.5 w-4.5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <X className="h-4.5 w-4.5 text-slate-300 shrink-0 mt-0.5" />
              )}
              {isHighlighted ? (
                <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                  hasFeature 
                    ? 'text-indigo-700 bg-indigo-50 border border-indigo-100' 
                    : 'text-slate-400 bg-slate-50 border border-slate-100 line-through'
                }`}>
                  <span>{f.label}</span>
                  {hasFeature && (
                    <span className="text-[7px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold animate-pulse">
                      New
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
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-xs text-slate-500 font-bold">Fetching plans and billing data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`pb-24 ${isBlocking ? 'pt-0' : 'pt-2'} px-4 max-w-lg mx-auto bg-slate-50 min-h-screen`}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-6 bg-white -mx-4 px-4 py-3 border-b border-slate-100 sticky ${isBlocking ? 'top-0' : 'top-12'} z-10`}>
        <div className="flex items-center space-x-3">
          {!isBlocking && (
            <button onClick={onBack} className="p-1 text-slate-500 hover:text-slate-700">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <span className="font-extrabold text-slate-800 text-sm">Subscription & Billing</span>
        </div>
        {isBlocking && (
          <button 
            onClick={onBack}
            className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center space-x-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-full transition-all"
          >
            <span>Sign Out</span>
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
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-soft mb-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                Your Current Tier
              </span>
              <h3 className="text-xl font-extrabold text-slate-800 mt-1 flex items-center space-x-2">
                <span style={{ color: activePlanDetails.color }}>{activePlanDetails.name}</span>
                {activeSub.status === 'trialing' && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Free Trial
                  </span>
                )}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs font-extrabold text-slate-700">
                ₹{activeSub.billingCycle === 'yearly' ? activePlanDetails.yearlyPrice : activePlanDetails.monthlyPrice}
              </span>
              <span className="text-[9px] text-slate-400 font-bold block">
                / {activeSub.billingCycle}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-semibold mb-4">
            {activePlanDetails.description}
          </p>

          <div className="border-t border-slate-100 pt-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
              <span className="flex items-center space-x-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Start Date</span>
              </span>
              <span className="text-slate-800 font-bold">
                {new Date(activeSub.startDate).toLocaleDateString()}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
              <span className="flex items-center space-x-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{activeSub.status === 'trialing' ? 'Trial Expiry' : activeSub.cancelAtPeriodEnd ? 'Expiry Date' : 'Renewal Date'}</span>
              </span>
              <span className="text-slate-800 font-bold">
                {new Date(activeSub.status === 'trialing' && activeSub.trialEndDate ? activeSub.trialEndDate : activeSub.endDate).toLocaleDateString()}
              </span>
            </div>

            {activeSub.cancelAtPeriodEnd ? (
              <div className="space-y-2.5 pt-2">
                <div className="p-2.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-xl border border-amber-100 flex items-start space-x-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <span>Auto-renew is disabled. Your access will expire on {new Date(activeSub.endDate).toLocaleDateString()}.</span>
                </div>
                <button
                  onClick={handleReactivateSubscription}
                  disabled={actionLoading}
                  className="w-full bg-primary hover:bg-primary-dark text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm"
                >
                  {actionLoading ? 'Processing...' : 'Turn On Auto-Renewal'}
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  onClick={handleCancelAutoRenew}
                  disabled={actionLoading}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  {actionLoading ? 'Processing...' : 'Turn Off Auto-Renewal'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-5 mb-6 text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-2 animate-bounce" />
          <h3 className="text-sm font-extrabold text-slate-800">Unlock Full {branding.appName} Access</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Choose a premium tier to upload CGM reports, calculate insights, and receive spike alerts.
          </p>
        </div>
      )}

      {/* Pricing Cards Listing */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Pricing Plans</h4>
          
          {/* Toggle Cycle */}
          <div className="bg-slate-200 p-0.5 rounded-full inline-flex items-center text-[10px] font-bold">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1 rounded-full transition-all ${billingCycle === 'monthly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1 rounded-full transition-all ${billingCycle === 'yearly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              Yearly (Save ~15%)
            </button>
          </div>
        </div>

        {/* Coupon Input Area */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-soft mb-4">
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
            Have a promo coupon code?
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="ENTER PROMO CODE (e.g. WELCOME50)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={couponLoading || !!appliedCoupon}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 uppercase focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white disabled:opacity-70"
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={() => {
                  setAppliedCoupon(null);
                  setCouponCode('');
                  setCouponSuccess(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold px-4 py-2 rounded-xl transition-all border border-slate-200"
              >
                Clear
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="bg-primary hover:bg-primary-dark text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {couponLoading ? 'Checking...' : 'Apply'}
              </button>
            )}
          </div>
          {couponError && (
            <p className="text-[10px] text-red-500 font-bold mt-1.5 flex items-center space-x-1">
              <span>⚠️ {couponError}</span>
            </p>
          )}
          {couponSuccess && (
            <p className="text-[10px] text-green-600 font-extrabold mt-1.5 flex items-center space-x-1">
              <span>✅ {couponSuccess}</span>
            </p>
          )}
        </div>

        <div className="space-y-4">
          {plans.map((plan) => {
            const isActivePlan = activeSub && activeSub.planId === plan._id;
            const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            const color = plan.color || '#2563EB';
            const currencySymbol = user?.currency === 'USD' ? '$' : '₹';

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

            return (
              <div 
                key={plan._id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-soft transition-all hover:border-slate-300 relative"
              >
                {/* Accent line */}
                <div className="h-1.5 w-full" style={{ backgroundColor: color }}></div>
                
                {plan.badge && plan.badge !== 'None' && (
                  <span 
                    className="absolute right-4 top-4 text-[9px] font-extrabold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: color }}
                  >
                    {plan.badge}
                  </span>
                )}

                <div className="p-5">
                  <h4 className="text-base font-extrabold text-slate-800 mb-1" style={{ color: color }}>
                    {plan.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold mb-4">
                    {plan.description}
                  </p>

                  {/* Price breakdown: Base, GST, Total */}
                  <div className="mb-4 text-xs font-semibold text-slate-600 space-y-1.5 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                    <div className="flex justify-between">
                      <span>Base Plan Price:</span>
                      <span className="text-slate-800 font-extrabold">{currencySymbol}{discount > 0 ? finalPrice : price}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-red-500 text-[10px] font-bold">
                        <span>Coupon Discount ({appliedCoupon?.code}):</span>
                        <span>-{currencySymbol}{discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[11px]">
                      <span>GST ({gstPercentage}%):</span>
                      <span className="text-slate-800 font-bold">{currencySymbol}{((discount > 0 ? finalPrice : price) * gstPercentage / 100).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-slate-200/50 my-1"></div>
                    <div className="flex justify-between font-black text-slate-800 text-sm">
                      <span className="flex items-baseline space-x-0.5">
                        <span>Total Price</span>
                        <span className="text-[10px] text-slate-400 font-bold ml-1">/ {billingCycle === 'yearly' ? 'year' : 'month'}</span>
                      </span>
                      <span className="text-primary font-black">{currencySymbol}{((discount > 0 ? finalPrice : price) * (1 + gstPercentage / 100)).toFixed(2)}</span>
                    </div>
                    {plan.trialDays > 0 && (
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50/75 border border-blue-100 px-2 py-0.5 rounded-md">
                          {plan.trialDays} Days Free Trial included
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="border-t border-slate-100 pt-3">
                    {renderFeatureList(plan.features)}
                  </div>

                  {/* Action Button */}
                  <div className="mt-4">
                    {isActivePlan ? (
                      <div className="text-center py-2.5 text-xs text-green-600 bg-green-50 rounded-2xl border border-green-100 font-extrabold flex items-center justify-center space-x-1.5">
                        <Check className="h-4 w-4" />
                        <span>Active Subscription</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan._id)}
                        disabled={actionLoading}
                        className="w-full text-white font-extrabold py-3 rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                        style={{ backgroundColor: color }}
                      >
                        <CreditCard className="h-4.5 w-4.5" />
                        <span>{plan.trialDays > 0 && !activeSub ? 'Start Free Trial' : `Subscribe Now (${currencySymbol}${((discount > 0 ? finalPrice : price) * (1 + gstPercentage / 100)).toFixed(2)})`}</span>
                      </button>
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
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-soft">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
            <FileText className="h-4 w-4" />
            <span>Billing & Invoice History</span>
          </h4>
          
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto no-scrollbar">
            {invoices.map((inv) => (
              <div key={inv._id} className="py-3 flex justify-between items-center text-xs font-semibold">
                <div>
                  <span className="text-slate-800 font-bold block">{inv.invoiceNumber}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-700 font-bold">₹{inv.totalAmount.toFixed(2)}</span>
                  <button 
                    onClick={() => setSelectedInvoice(inv)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-primary transition-all"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 overflow-hidden relative animate-fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-black text-slate-800 flex items-center space-x-1">
                <FileText className="h-4 w-4 text-primary" />
                <span>Invoice Details</span>
              </span>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full"
              >
                Close
              </button>
            </div>

            <div className="text-center mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoice Number</span>
              <span className="text-lg font-black text-slate-800">{selectedInvoice.invoiceNumber}</span>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                Date: {new Date(selectedInvoice.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-4 text-xs font-semibold text-slate-600 space-y-2.5 border border-slate-100">
              <div className="flex justify-between">
                <span>Billing Name:</span>
                <span className="text-slate-800 font-bold">{selectedInvoice.billingName}</span>
              </div>
              <div className="flex justify-between">
                <span>Billing Email:</span>
                <span className="text-slate-800 font-bold">{selectedInvoice.billingEmail}</span>
              </div>
              <div className="border-t border-slate-200/60 my-2"></div>
              <div className="flex justify-between">
                <span>Base Amount (Taxable):</span>
                <span className="text-slate-800 font-bold">₹{selectedInvoice.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center space-x-1">
                  <Percent className="h-3 w-3 text-slate-400" />
                  <span>GST ({Math.round((selectedInvoice.taxAmount / (selectedInvoice.amount || 1)) * 100)}%):</span>
                </span>
                <span className="text-slate-800 font-bold">₹{selectedInvoice.taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 my-2"></div>
              <div className="flex justify-between text-sm font-extrabold text-slate-800">
                <span>Total Paid:</span>
                <span className="text-primary font-black">₹{selectedInvoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4">
              <button
                onClick={() => handleDownloadPDF(selectedInvoice._id, selectedInvoice.invoiceNumber)}
                disabled={actionLoading}
                className="w-full bg-primary hover:bg-primary-dark text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>{actionLoading ? 'Generating PDF...' : 'Download Invoice PDF'}</span>
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl flex items-center space-x-2 text-[10px] font-bold text-blue-800">
              <Award className="h-4.5 w-4.5 text-blue-600 shrink-0" />
              <span>Thank you for choosing {branding.appName}. Keep tracking to live anti-gravity health!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
