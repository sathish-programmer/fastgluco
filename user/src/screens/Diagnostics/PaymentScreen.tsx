import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PaymentScreenProps {
  bookingData: any;
  testPrice: number;
  lab: any;
  testId: string;
  onBack: () => void;
  onSuccess: (bookingId: string) => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ bookingData, testPrice, lab, testId, onBack, onSuccess }) => {
  const { apiUrl, token } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [showPromoPopup, setShowPromoPopup] = useState(true);

  const discountAmount = promoApplied ? (testPrice + (bookingData.collectionType === 'HOME' ? bookingData.homeCollectionFee : 0)) : 0;
  const totalAmount = Math.max(0, testPrice + (bookingData.collectionType === 'HOME' ? bookingData.homeCollectionFee : 0) - discountAmount);

  const applyPromo = () => {
    setPromoError('');
    if (promoCode.trim().toLowerCase() === 'free100') {
      setPromoApplied(true);
    } else {
      setPromoError('Invalid promo code.');
    }
  };

  const handlePay = async () => {
    setProcessing(true);
    setError('');
    try {
      // 1. Create booking in backend
      const res = await fetch(`${apiUrl}/labs/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          laboratoryId: lab._id,
          labTestId: testId,
          isFreeBooking: promoApplied,
          ...bookingData
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create booking');

      if (totalAmount === 0 || !data.razorpayOrderId) {
        setProcessing(false);
        onSuccess(data.bookingId);
      } else {
        // Initialize Razorpay SDK
        const options = {
          key: data.razorpayKeyId,
          amount: data.amount * 100,
          currency: 'INR',
          name: 'HealthApp',
          description: 'Lab Test Booking',
          order_id: data.razorpayOrderId,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch(`${apiUrl}/labs/booking/verify-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  bookingId: data.bookingId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
              
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');
              
              setProcessing(false);
              onSuccess(data.bookingId);
            } catch (err: any) {
              setError(err.message || 'Error verifying payment.');
              setProcessing(false);
            }
          },
          prefill: {
            name: bookingData.patientName,
            contact: bookingData.patientPhone
          },
          theme: {
            color: '#4f46e5'
          },
          modal: {
            ondismiss: function () {
              setProcessing(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setError(response.error.description || 'Payment failed.');
          setProcessing(false);
        });
        rzp.open();
      }
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };

  return (
    <div className="pb-32 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          disabled={processing}
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Step 3 of 3</span>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none mt-1">Checkout & Pay</h2>
        </div>
      </div>

      {showPromoPopup && (
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-6 text-white mb-6 relative overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute right-0 bottom-0 translate-y-4 translate-x-4 opacity-10 text-9xl font-black">100</div>
          <button onClick={() => setShowPromoPopup(false)} className="absolute top-4 right-4 text-white/80 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 w-6 h-6 rounded-full flex items-center justify-center">✕</button>
          <h4 className="font-extrabold text-lg mb-1 flex items-center gap-2">🎁 Trial Special Offer</h4>
          <p className="text-xs text-white/90 leading-relaxed mb-4">Use the code <span className="font-mono bg-white/20 px-2 py-0.5 rounded font-black text-white">free100</span> at checkout to book this test fully free for testing purposes!</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter code" 
              value={promoCode} 
              onChange={e => setPromoCode(e.target.value)} 
              className="bg-white/10 border border-white/25 placeholder-white/60 text-white rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-white/50 flex-1"
            />
            <button onClick={applyPromo} className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-4 py-2 rounded-xl text-xs shadow transition-all">Apply</button>
          </div>
          {promoError && <p className="text-[10px] text-rose-200 font-bold mt-1.5">{promoError}</p>}
          {promoApplied && <p className="text-[10px] text-emerald-200 font-bold mt-1.5">✓ Code applied! Booking fee discounted to 0.</p>}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 text-sm uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">Booking Summary</h3>
        
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Diagnostic Center</p>
              <p className="text-xs text-slate-500">{lab.name}</p>
            </div>
            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-lg text-slate-600 dark:text-slate-400">₹{testPrice}</span>
          </div>

          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Collection Method</p>
              <p className="text-xs text-slate-500">{bookingData.collectionType === 'HOME' ? 'Home Visit' : 'Lab Visit'}</p>
            </div>
            {bookingData.collectionType === 'HOME' && (
              <span className="text-xs font-bold bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-lg text-slate-600 dark:text-slate-400">₹{bookingData.homeCollectionFee}</span>
            )}
          </div>

          {promoApplied && (
            <div className="flex justify-between items-start text-emerald-600 dark:text-emerald-400">
              <div>
                <p className="font-bold text-sm">Promo Code (free100)</p>
                <p className="text-xs text-emerald-500">100% discount applied</p>
              </div>
              <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg">-₹{discountAmount}</span>
            </div>
          )}

          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Date & Time</p>
              <p className="text-xs text-slate-500">{new Date(bookingData.preferredDate).toLocaleDateString()} at {bookingData.preferredTime}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between items-center">
          <span className="font-bold text-slate-800 dark:text-slate-150">Total to Pay</span>
          <span className="text-2xl font-black text-indigo-650 dark:text-indigo-400">₹{totalAmount}</span>
        </div>
      </div>

      {totalAmount > 0 && (
        <div className="bg-green-50 dark:bg-green-955/20 border border-green-200 dark:border-green-900/30 rounded-2xl p-4 flex items-start gap-3 mb-6">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-bold text-green-800 dark:text-green-300 text-sm">Secure Payment</h4>
            <p className="text-xs text-green-700 dark:text-green-450 mt-1">Your payment is processed securely via Razorpay. HealthApp does not store your card details.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-4 flex items-start gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700 font-bold">{error}</p>
        </div>
      )}

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] max-w-5xl mx-auto z-40">
        <button 
          onClick={handlePay}
          disabled={processing}
          className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          {processing ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
          ) : totalAmount === 0 ? (
            'Confirm Booking (Free)'
          ) : (
            `Pay ₹${totalAmount} via Razorpay`
          )}
        </button>
      </div>
    </div>
  );
};
