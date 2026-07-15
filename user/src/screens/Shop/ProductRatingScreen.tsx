import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Star, X, CheckCircle, ArrowLeft } from 'lucide-react';
import { ProductImage } from '../../screens/Shop/ShopScreen';

interface ProductRatingScreenProps {
  orderId: string;
  onBack: () => void;
}

export const ProductRatingScreen: React.FC<ProductRatingScreenProps> = ({ orderId, onBack }) => {
  const { apiUrl, token } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any | null>(null);
  
  // Rating states per product index/ID
  // Key: productId, Value: { rating: number, comment: string, submitted: boolean }
  const [reviewsState, setReviewsState] = useState<{ [key: string]: { rating: number, comment: string, submitting: boolean, submitted: boolean } }>({});

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await fetch(`${apiUrl}/patient/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const allOrders = await res.json();
          const targetOrder = allOrders.find((o: any) => o._id === orderId);
          if (targetOrder) {
            setOrder(targetOrder);
            
            // Initialize rating states
            const initial: any = {};
            targetOrder.products.forEach((p: any) => {
              const pId = p.productId && typeof p.productId === 'object' ? p.productId._id : p.productId;
              initial[pId] = { rating: 5, comment: '', submitting: false, submitted: false };
            });
            setReviewsState(initial);
          } else {
            showToast('Order details could not be found.', 'error');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, apiUrl, token]);

  const handleSubmitRating = async (productId: string) => {
    const state = reviewsState[productId];
    if (!state || state.submitting || state.submitted) return;

    // Update submitting state
    setReviewsState(prev => ({
      ...prev,
      [productId]: { ...prev[productId], submitting: true }
    }));

    try {
      const res = await fetch(`${apiUrl}/shop/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId,
          productId,
          rating: state.rating,
          comment: state.comment
        })
      });

      if (res.ok) {
        showToast('Review submitted successfully!', 'success');
        setReviewsState(prev => ({
          ...prev,
          [productId]: { ...prev[productId], submitting: false, submitted: true }
        }));
      } else {
        const errData = await res.json();
        showToast(errData.message || 'Failed to submit review.', 'error');
        setReviewsState(prev => ({
          ...prev,
          [productId]: { ...prev[productId], submitting: false }
        }));
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to review server.', 'error');
      setReviewsState(prev => ({
        ...prev,
        [productId]: { ...prev[productId], submitting: false }
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-650 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <X className="h-12 w-12 text-rose-500 mb-4" />
        <h3 className="font-bold text-slate-800 text-lg">Invalid Review Session</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          We could not locate this order or it is not eligible for product feedback.
        </p>
        <button
          onClick={onBack}
          className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-sm transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-4 max-w-2xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="h-10 px-4 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Delivered Order Feedback
        </span>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-6 mb-6">
        <h2 className="text-xl font-black text-slate-850 flex items-center gap-2">
          ⭐ Rate Your Products
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Thank you for your purchase! Let us know how your new items worked out.
        </p>

        <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl mt-4 flex justify-between items-center text-xs font-bold text-slate-655">
          <span>Order ID: {order._id.slice(-8).toUpperCase()}</span>
          <span>Delivered: {new Date(order.deliveryDate || order.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Products list */}
      <div className="space-y-4">
        {order.products.map((p: any) => {
          const pId = p.productId && typeof p.productId === 'object' ? p.productId._id : p.productId;
          const pImage = p.productId && typeof p.productId === 'object' ? p.productId.image : p.image;
          const state = reviewsState[pId] || { rating: 5, comment: '', submitting: false, submitted: false };

          return (
            <div key={pId} className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  <ProductImage src={pImage || '💊'} apiUrl={apiUrl} className="h-9 w-9 object-contain" textClassName="text-2xl" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs leading-snug">{p.name}</h4>
                  {p.variantName && <span className="text-[9px] text-slate-400 block mt-0.5">{p.variantName}</span>}
                </div>
              </div>

              {state.submitted ? (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in duration-200">
                  <CheckCircle className="h-5 w-5 text-emerald-555 shrink-0" />
                  <span className="text-xs font-bold">Review submitted successfully! Pending moderator approval.</span>
                </div>
              ) : (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  {/* Stars input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Product Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            setReviewsState(prev => ({
                              ...prev,
                              [pId]: { ...prev[pId], rating: star }
                            }));
                          }}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= state.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment Textarea */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Review Comments</label>
                    <textarea
                      value={state.comment}
                      onChange={(e) => {
                        setReviewsState(prev => ({
                          ...prev,
                          [pId]: { ...prev[pId], comment: e.target.value }
                        }));
                      }}
                      placeholder="Explain what you liked or disliked about this product..."
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  {/* Submit button */}
                  <button
                    type="button"
                    disabled={state.submitting}
                    onClick={() => handleSubmitRating(pId)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-2xl shadow-sm hover:shadow transition-all disabled:opacity-50"
                  >
                    {state.submitting ? 'Submitting Review...' : 'Submit Rating & Comment'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
