import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  RotateCcw,
  MessageSquare,
  Mail,
  BarChart3,
  Store,
  Settings,
  ShieldCheck,
  X,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { OrderOverviewPage } from './OrderOverviewPage';
import { AllOrdersPage } from './AllOrdersPage';
import { RefundsCancellationsPage } from './RefundsCancellationsPage';
import { SupportInboxPage } from './SupportInboxPage';
import { CustomerMessagesPage } from './CustomerMessagesPage';
import { ReportsAnalyticsPage } from './ReportsAnalyticsPage';
import { VendorsFulfilmentPage } from './VendorsFulfilmentPage';
import { OrderSettingsAuditPage } from './OrderSettingsAuditPage';

export type OrderManagementSubTab =
  | 'overview'
  | 'orders'
  | 'refunds'
  | 'support'
  | 'messages'
  | 'reports'
  | 'vendors'
  | 'settings';

interface OrderManagementHubProps {
  apiUrl: string;
  token: string;
  adminRole?: string;
  initialTab?: OrderManagementSubTab;
  onNavigateTab?: (tab: OrderManagementSubTab) => void;
}

export const OrderManagementHub: React.FC<OrderManagementHubProps> = ({
  apiUrl,
  token,
  adminRole = 'Admin',
  initialTab = 'overview',
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<OrderManagementSubTab>(initialTab);
  const [drilldownFilters, setDrilldownFilters] = useState<any>({});

  // Synchronize activeTab whenever parent initialTab changes (e.g. from sidebar clicks)
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Global Refund Modal State
  const [refundModalOrder, setRefundModalOrder] = useState<any | null>(null);
  const [refundAmountInput, setRefundAmountInput] = useState<number>(0);
  const [refundReasonInput, setRefundReasonInput] = useState<string>('');
  const [isManualReconciliation, setIsManualReconciliation] = useState<boolean>(false);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [refundSuccessMsg, setRefundSuccessMsg] = useState<string | null>(null);
  const [refundErrorMsg, setRefundErrorMsg] = useState<string | null>(null);

  // Global Message Modal State
  const [messageModalOrder, setMessageModalOrder] = useState<any | null>(null);

  const switchTab = (tab: OrderManagementSubTab, filters?: any) => {
    setActiveTab(tab);
    if (filters?.order) {
      setMessageModalOrder(filters.order);
    }
    if (filters) setDrilldownFilters(filters);
    else setDrilldownFilters({});
    if (onNavigateTab) onNavigateTab(tab);
  };

  const handleOpenRefundModal = (order: any) => {
    const already = order.totalRefundedAmount || (order.cancellationRequest?.refundStatus === 'COMPLETED' ? order.cancellationRequest.refundAmount : 0) || 0;
    const remaining = Math.max(0, (order.totalAmount || 0) - already);
    setRefundModalOrder(order);
    setRefundAmountInput(remaining);
    setRefundReasonInput('');
    setIsManualReconciliation(false);
    setRefundSuccessMsg(null);
    setRefundErrorMsg(null);
  };

  const handleExecuteRefund = async () => {
    if (!refundModalOrder) return;
    if (refundAmountInput <= 0) {
      alert('Please enter a valid refund amount greater than zero.');
      return;
    }

    setProcessingRefund(true);
    setRefundSuccessMsg(null);
    setRefundErrorMsg(null);
    try {
      const res = await fetch(`${apiUrl}/admin/order-management/orders/${refundModalOrder._id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: refundAmountInput,
          reason: refundReasonInput || 'Admin verified customer refund',
          isManualReconciliation,
          idempotencyKey: `ref_${refundModalOrder._id}_${refundAmountInput}_${Date.now()}`
        })
      });

      const data = await res.json();
      if (res.ok) {
        setRefundSuccessMsg(`Refund of ₹${refundAmountInput} completed successfully! Reference: ${data.gatewayRefundId || data.refundRequestNumber}`);
        setRefundErrorMsg(null);
        setTimeout(() => {
          setRefundModalOrder(null);
          setRefundSuccessMsg(null);
        }, 2500);
      } else {
        setRefundErrorMsg(data.message || 'Error processing refund');
      }
    } catch (e: any) {
      setRefundErrorMsg(e.message || 'Network error occurred while processing refund');
    } finally {
      setProcessingRefund(false);
    }
  };

  const tabsConfig: { id: OrderManagementSubTab; label: string; icon: React.FC<any> }[] = [
    { id: 'overview', label: 'Order Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'All Orders', icon: ShoppingCart },
    { id: 'refunds', label: 'Refunds & Cancellations', icon: RotateCcw },
    { id: 'support', label: 'Customer Support Inbox', icon: MessageSquare },
    { id: 'messages', label: 'Customer Messages', icon: Mail },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'vendors', label: 'Vendors & Fulfilment', icon: Store },
    { id: 'settings', label: 'Order Settings & Audit', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Module Navigation Bar */}
      <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-sm flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 flex-nowrap">
          {tabsConfig.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Render */}
      <div>
        {activeTab === 'overview' && (
          <OrderOverviewPage
            apiUrl={apiUrl}
            token={token}
            onNavigateToTab={(tab, filters) => switchTab(tab as OrderManagementSubTab, filters)}
          />
        )}

        {activeTab === 'orders' && (
          <AllOrdersPage
            apiUrl={apiUrl}
            token={token}
            adminRole={adminRole}
            initialFilters={drilldownFilters}
            onOpenRefundModal={handleOpenRefundModal}
            onOpenMessageModal={ord => switchTab('messages', { order: ord })}
          />
        )}

        {activeTab === 'refunds' && (
          <RefundsCancellationsPage
            apiUrl={apiUrl}
            token={token}
            onOpenRefundModal={handleOpenRefundModal}
            onSelectOrder={orderId => switchTab('orders', { search: orderId })}
          />
        )}

        {activeTab === 'support' && (
          <SupportInboxPage
            apiUrl={apiUrl}
            token={token}
            initialFilters={drilldownFilters}
            onNavigateToOrder={orderId => switchTab('orders', { search: orderId })}
          />
        )}

        {activeTab === 'messages' && (
          <CustomerMessagesPage
            apiUrl={apiUrl}
            token={token}
            defaultOrder={messageModalOrder}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsAnalyticsPage
            apiUrl={apiUrl}
            token={token}
          />
        )}

        {activeTab === 'vendors' && (
          <VendorsFulfilmentPage
            apiUrl={apiUrl}
            token={token}
            onNavigateToOrder={orderId => switchTab('orders', { search: orderId })}
          />
        )}

        {activeTab === 'settings' && (
          <OrderSettingsAuditPage
            apiUrl={apiUrl}
            token={token}
            adminRole={adminRole}
          />
        )}
      </div>

      {/* GLOBAL REFUND MODAL */}
      {refundModalOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-base">
                <RotateCcw className="h-5 w-5" />
                <span>Process Order Refund</span>
              </div>
              <button
                onClick={() => setRefundModalOrder(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Order Reference:</span>
                <span className="font-mono font-bold text-slate-800">
                  {refundModalOrder.vendorOrderId || refundModalOrder._id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-bold text-slate-800">
                  {refundModalOrder.patientName || 'Customer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Original Total Paid:</span>
                <span className="font-bold text-slate-800">₹{refundModalOrder.totalAmount}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-bold">Max Refundable Balance:</span>
                <span className="font-black text-emerald-600">
                  ₹{Math.max(0, refundModalOrder.totalAmount - (refundModalOrder.totalRefundedAmount || 0))}
                </span>
              </div>
            </div>

            {/* Refund Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Refund Amount (₹)</label>
                <input
                  type="number"
                  value={refundAmountInput}
                  onChange={e => setRefundAmountInput(Number(e.target.value))}
                  max={Math.max(0, refundModalOrder.totalAmount - (refundModalOrder.totalRefundedAmount || 0))}
                  min={1}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-black text-base focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Refund</label>
                <textarea
                  value={refundReasonInput}
                  onChange={e => setRefundReasonInput(e.target.value)}
                  placeholder="State the verified customer reason (recorded in immutable audit trail)..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:bg-white resize-none"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <label className="flex items-start gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isManualReconciliation}
                    onChange={e => {
                      setIsManualReconciliation(e.target.checked);
                      if (e.target.checked) setRefundErrorMsg(null);
                    }}
                    className="mt-0.5 rounded text-purple-600 focus:ring-0"
                  />
                  <div>
                    <span>Process as Manual Offline Reconciliation (UPI / NEFT / Bank Transfer)</span>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Enable this if you have refunded or are refunding the customer directly via UPI/Bank transfer, or if your gateway account has insufficient balance.
                    </p>
                  </div>
                </label>
              </div>

              {!isManualReconciliation && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-800 text-[11px] space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                    Idempotent Gateway Protection Active
                  </div>
                  <p className="text-[10px] text-amber-700">
                    Duplicate requests are prevented automatically. The amount will be refunded directly via Razorpay to the customer's source account.
                  </p>
                </div>
              )}
            </div>

            {refundErrorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-start gap-2 text-rose-800 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <span className="font-bold block">Refund Notice:</span>
                    <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">{refundErrorMsg}</p>
                  </div>
                </div>
                {!isManualReconciliation && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualReconciliation(true);
                      setRefundErrorMsg(null);
                    }}
                    className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Switch to Manual Offline Refund (UPI / NEFT)</span>
                  </button>
                )}
              </div>
            )}

            {refundSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> {refundSuccessMsg}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefundModalOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRefund}
                disabled={processingRefund || refundAmountInput <= 0}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {processingRefund ? 'Processing Gateway Refund...' : `Confirm & Refund ₹${refundAmountInput}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
