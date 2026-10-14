import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Search
} from 'lucide-react';

interface RefundsCancellationsPageProps {
  apiUrl: string;
  token: string;
  onOpenRefundModal?: (order: any) => void;
  onSelectOrder?: (orderId: string) => void;
}

export const RefundsCancellationsPage: React.FC<RefundsCancellationsPageProps> = ({
  apiUrl,
  token,
  onOpenRefundModal,
  onSelectOrder
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'cancellation' | 'return' | 'refund'>('all');
  const [search, setSearch] = useState('');

  // Review modal state
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    item: any | null;
    action: 'APPROVE' | 'REJECT';
    adminNotes: string;
    initiateRefund: boolean;
    refundAmount: number;
    submitting: boolean;
  }>({
    open: false,
    item: null,
    action: 'APPROVE',
    adminNotes: '',
    initiateRefund: true,
    refundAmount: 0,
    submitting: false
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/order-management/refunds-cancellations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [apiUrl, token]);

  const filteredItems = items.filter(it => {
    const matchesTab = activeTab === 'all' || it.type === activeTab;
    const matchesSearch =
      !search ||
      it.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      it.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      it.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
      it.reason?.toLowerCase().includes(search.toLowerCase()) ||
      it.gatewayRef?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Handle Review submission
  const handleReviewSubmit = async () => {
    if (!reviewModal.item) return;
    setReviewModal(prev => ({ ...prev, submitting: true }));

    try {
      const res = await fetch(`${apiUrl}/admin/order-management/orders/${reviewModal.item.orderId}/cancellation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: reviewModal.action,
          adminNotes: reviewModal.adminNotes,
          initiateRefund: reviewModal.initiateRefund,
          refundAmount: reviewModal.refundAmount
        })
      });

      if (res.ok) {
        setReviewModal({
          open: false,
          item: null,
          action: 'APPROVE',
          adminNotes: '',
          initiateRefund: false,
          refundAmount: 0,
          submitting: false
        });
        fetchItems();
      } else {
        const err = await res.json();
        alert(err.message || 'Error updating request');
        setReviewModal(prev => ({ ...prev, submitting: false }));
      }
    } catch (e: any) {
      alert(e.message || 'Network error');
      setReviewModal(prev => ({ ...prev, submitting: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-purple-600" />
            Refunds, Cancellations & Return Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit refund balances, review cancellation and return requests, and prevent duplicate financial gateway reversals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('cancellation')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'cancellation' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Cancellations
            </button>
            <button
              onClick={() => setActiveTab('return')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'return' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Returns
            </button>
            <button
              onClick={() => setActiveTab('refund')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'refund' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Refunds
            </button>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter requests by order number, customer, reason, or gateway transaction ID..."
          className="flex-1 bg-transparent text-xs focus:outline-none"
        />
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Order / Request ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Requested / Remaining</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Approval Status</th>
                <th className="py-3.5 px-4">Gateway Ref</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 font-semibold">
                    <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2" />
                    Loading refund requests...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No requests in this category.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isPending = item.approvalStatus === 'PENDING';
                  const isApproved = item.approvalStatus === 'APPROVED';
                  const isRefunded = item.refundStatus === 'COMPLETED';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        <span
                          onClick={() => onSelectOrder && onSelectOrder(item.orderId)}
                          className="hover:text-primary hover:underline cursor-pointer"
                        >
                          {item.orderNumber}
                        </span>
                        {item.refundRequestNumber && (
                          <span className="block text-[10px] text-purple-600 font-normal">
                            {item.refundRequestNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{item.customerName}</div>
                        <div className="text-[10px] text-slate-400">{item.customerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize font-bold text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-black text-slate-800 block">
                          ₹{item.requestedAmount}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Remain: ₹{item.remainingRefundable}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px] truncate" title={item.reason}>
                        {item.reason}
                      </td>
                      <td className="py-3.5 px-4 text-[10px] text-slate-400">
                        {new Date(item.requestDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isApproved || isRefunded
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isRefunded ? 'Refunded' : item.approvalStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                        {item.gatewayRef || '--'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <button
                            onClick={() =>
                              setReviewModal({
                                open: true,
                                item,
                                action: 'APPROVE',
                                adminNotes: '',
                                initiateRefund: true,
                                refundAmount: item.remainingRefundable,
                                submitting: false
                              })
                            }
                            className="px-3 py-1 bg-primary text-white rounded-lg font-bold text-[11px] hover:bg-primary-dark transition"
                          >
                            Review
                          </button>
                        ) : isApproved && !isRefunded && onOpenRefundModal ? (
                          <button
                            onClick={() => onOpenRefundModal({ _id: item.orderId, totalAmount: item.requestedAmount, vendorOrderId: item.orderNumber })}
                            className="px-3 py-1 bg-purple-600 text-white rounded-lg font-bold text-[11px] hover:bg-purple-700 transition"
                          >
                            Refund Now
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal.open && reviewModal.item && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800">
                Review {reviewModal.item.type.toUpperCase()} Request
              </h3>
              <span className="font-mono text-xs text-primary font-bold">{reviewModal.item.orderNumber}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-bold text-slate-700">{reviewModal.item.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer Reason:</span>
                <span className="font-medium text-slate-700">{reviewModal.item.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Remaining Refundable:</span>
                <span className="font-black text-emerald-600">₹{reviewModal.item.remainingRefundable}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewModal(prev => ({ ...prev, action: 'APPROVE' }))}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      reviewModal.action === 'APPROVE'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Approve Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewModal(prev => ({ ...prev, action: 'REJECT' }))}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      reviewModal.action === 'REJECT'
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Reject Request
                  </button>
                </div>
              </div>

              {reviewModal.action === 'APPROVE' && (
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-purple-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewModal.initiateRefund}
                      onChange={e => setReviewModal(prev => ({ ...prev, initiateRefund: e.target.checked }))}
                      className="rounded text-purple-600 focus:ring-0"
                    />
                    Process Gateway Refund Immediately
                  </label>

                  {reviewModal.initiateRefund && (
                    <div>
                      <span className="text-[10px] text-purple-700 font-semibold block mb-1">Refund Amount (₹)</span>
                      <input
                        type="number"
                        value={reviewModal.refundAmount}
                        onChange={e => setReviewModal(prev => ({ ...prev, refundAmount: Number(e.target.value) }))}
                        max={reviewModal.item.remainingRefundable}
                        min={1}
                        className="w-full bg-white border border-purple-200 rounded-lg p-2 text-xs font-bold focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Admin Notes / Decision Reason</label>
                <textarea
                  value={reviewModal.adminNotes}
                  onChange={e => setReviewModal(prev => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder="Explain why this decision was made (recorded in audit log and sent in customer notification)..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:bg-white transition"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewModal(prev => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                disabled={reviewModal.submitting}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {reviewModal.submitting ? 'Submitting...' : 'Submit Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
