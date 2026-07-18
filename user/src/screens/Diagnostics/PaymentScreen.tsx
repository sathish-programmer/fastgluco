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

  const totalAmount = testPrice + (bookingData.collectionType === 'HOME' ? bookingData.homeCollectionFee : 0);

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
    <div className="pb-32 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          disabled={processing}
          className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Step 3 of 3</span>
          <h2 className="text-2xl font-bold text-slate-800 leading-none mt-1">Checkout & Pay</h2>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-6">
        <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider border-b border-slate-100 pb-3">Booking Summary</h3>
        
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-slate-700 text-sm">Diagnostic Center</p>
              <p className="text-xs text-slate-500">{lab.name}</p>
            </div>
            <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-lg text-slate-600">₹{testPrice}</span>
          </div>

          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-slate-700 text-sm">Collection Method</p>
              <p className="text-xs text-slate-500">{bookingData.collectionType === 'HOME' ? 'Home Visit' : 'Lab Visit'}</p>
            </div>
            {bookingData.collectionType === 'HOME' && (
              <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-lg text-slate-600">₹{bookingData.homeCollectionFee}</span>
            )}
          </div>

          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-slate-700 text-sm">Date & Time</p>
              <p className="text-xs text-slate-500">{new Date(bookingData.preferredDate).toLocaleDateString()} at {bookingData.preferredTime}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
          <span className="font-bold text-slate-800">Total to Pay</span>
          <span className="text-2xl font-black text-indigo-600">₹{totalAmount}</span>
        </div>
      </div>

      {totalAmount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-bold text-green-800 text-sm">Secure Payment</h4>
            <p className="text-xs text-green-700 mt-1">Your payment is processed securely via Razorpay. HealthApp does not store your card details.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700 font-bold">{error}</p>
        </div>
      )}

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] max-w-5xl mx-auto z-40">
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
