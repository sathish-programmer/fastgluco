import React, { useState, useEffect } from 'react';
import {
  Send,
  Mail,
  Bell,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Eye
} from 'lucide-react';

interface CustomerMessagesPageProps {
  apiUrl: string;
  token: string;
  defaultOrder?: any;
}

const TEMPLATES: Record<string, { subject: string; template: string }> = {
  order_confirmation: {
    subject: 'Order Confirmation - Mito Reboot',
    template: 'Hello {{customerName}},\n\nYour Mito Reboot order #{{orderId}} for ₹{{amount}} has been confirmed and is now being prepared for fulfillment.\n\nThank you for choosing metabolic wellness with Mito Reboot!'
  },
  processing_delay: {
    subject: 'Update on Your Order Processing - Mito Reboot',
    template: 'Dear {{customerName}},\n\nWe are writing to inform you that order #{{orderId}} is experiencing a slight fulfillment delay due to strict quality inspections. Our logistics team expects to dispatch your items within the next 24-48 hours.\n\nWe sincerely appreciate your patience!'
  },
  shipment_tracking: {
    subject: 'Your Order Has Shipped! 🚚 - Mito Reboot',
    template: 'Hi {{customerName}},\n\nGreat news! Your order #{{orderId}} has been handed over to our courier partner ({{courier}}). Your tracking ID is {{trackingId}}.\n\nYou can track delivery progress directly in your Mito Reboot app.'
  },
  delivery_issue: {
    subject: 'Delivery Update Regarding Your Order - Mito Reboot',
    template: 'Dear {{customerName}},\n\nOur courier partner attempted delivery for order #{{orderId}} but could not complete it. Please verify your delivery address or contact our support desk so we can re-attempt dispatch immediately.'
  },
  cancellation_update: {
    subject: 'Order Cancellation Update - Mito Reboot',
    template: 'Hello {{customerName}},\n\nRegarding your cancellation request for order #{{orderId}}: Your request has been approved and processed by our fulfillment administration. Any applicable refund will reflect in your original payment method within 5-7 business days.'
  },
  refund_processed: {
    subject: 'Refund Completed 💳 - Mito Reboot',
    template: 'Dear {{customerName}},\n\nYour refund of ₹{{amount}} for order #{{orderId}} has been processed successfully. Reference transaction ID: {{refundRef}}.\n\nThank you for your patience and cooperation.'
  },
  request_info: {
    subject: 'Information Required Regarding Your Order - Mito Reboot',
    template: 'Hello {{customerName}},\n\nOur support team requires clarification regarding order #{{orderId}}. Please reply to this message or update your profile details in the app at your earliest convenience.'
  },
  custom: {
    subject: '',
    template: ''
  }
};

export const CustomerMessagesPage: React.FC<CustomerMessagesPageProps> = ({
  apiUrl,
  token,
  defaultOrder
}) => {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('order_confirmation');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [amount, setAmount] = useState('');

  const [channels, setChannels] = useState<{ in_app: boolean; email: boolean; sms: boolean }>({
    in_app: true,
    email: true,
    sms: false
  });

  const [subject, setSubject] = useState(TEMPLATES.order_confirmation.subject);
  const [messageBody, setMessageBody] = useState(TEMPLATES.order_confirmation.template);
  const [sending, setSending] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ success: boolean; text: string } | null>(null);

  // Sync state whenever defaultOrder changes
  useEffect(() => {
    if (defaultOrder) {
      const name = defaultOrder.patientName || (defaultOrder.userId as any)?.name || '';
      const email = defaultOrder.patientEmail || (defaultOrder.userId as any)?.email || '';
      const phone = defaultOrder.patientPhone || (defaultOrder.userId as any)?.mobileNumber || (defaultOrder.userId as any)?.mobile || '';
      const oId = defaultOrder.vendorOrderId || (defaultOrder._id ? `#${defaultOrder._id}` : '');
      const cName = defaultOrder.trackingDetails?.courierName || '';
      const tId = defaultOrder.trackingDetails?.trackingId || '';
      const amt = defaultOrder.totalAmount ? defaultOrder.totalAmount.toString() : '';

      setCustomerName(name);
      setCustomerEmail(email);
      setCustomerPhone(phone);
      setOrderId(oId);
      setCourierName(cName);
      setTrackingId(tId);
      setAmount(amt);

      // Determine initial template key based on order status
      let key = 'order_confirmation';
      if (defaultOrder.trackingDetails?.trackingId || defaultOrder.deliveryStatus === 'shipped' || defaultOrder.deliveryStatus === 'out_for_delivery') {
        key = 'shipment_tracking';
      } else if (defaultOrder.totalRefundedAmount || defaultOrder.cancellationRequest?.refundStatus === 'COMPLETED') {
        key = 'refund_processed';
      } else if (defaultOrder.deliveryStatus === 'cancelled' || defaultOrder.cancellationRequest?.status === 'APPROVED') {
        key = 'cancellation_update';
      } else if (defaultOrder.status === 'completed') {
        key = 'order_confirmation';
      } else {
        key = 'request_info';
      }

      setSelectedTemplateKey(key);
      if (TEMPLATES[key]) {
        setSubject(TEMPLATES[key].subject);
        setMessageBody(TEMPLATES[key].template);
      }
    }
  }, [defaultOrder]);

  // Apply template
  const handleSelectTemplate = (key: string) => {
    setSelectedTemplateKey(key);
    if (key === 'custom') {
      setSubject('');
      setMessageBody('');
    } else if (TEMPLATES[key]) {
      setSubject(TEMPLATES[key].subject);
      setMessageBody(TEMPLATES[key].template);
    }
  };

  // Compile template tags
  const getCompiledMessage = (raw: string) => {
    return raw
      .replace(/\{\{customerName\}\}/g, customerName || 'Valued Customer')
      .replace(/\{\{orderId\}\}/g, orderId || 'Order Reference')
      .replace(/\{\{courier\}\}/g, courierName || 'our courier partner')
      .replace(/\{\{trackingId\}\}/g, trackingId || '(tracking details pending)')
      .replace(/\{\{amount\}\}/g, amount || '0')
      .replace(/\{\{refundRef\}\}/g, defaultOrder?.refunds?.[0]?.gatewayRefundId || defaultOrder?.refunds?.[0]?.refundRequestNumber || `RF-${Date.now().toString().slice(-6)}`);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultMessage(null);

    const activeChannels = Object.entries(channels)
      .filter(([_, enabled]) => enabled)
      .map(([ch]) => ch);

    if (activeChannels.length === 0) {
      alert('Please enable at least one delivery channel (In-App, Email, or SMS).');
      return;
    }

    setSending(true);
    try {
      const compiledBody = getCompiledMessage(messageBody);
      const res = await fetch(`${apiUrl}/admin/order-management/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerEmail,
          customerPhone,
          orderId: defaultOrder?._id,
          template: selectedTemplateKey,
          subject,
          message: compiledBody,
          channels: activeChannels
        })
      });

      const data = await res.json();
      if (res.ok) {
        setResultMessage({
          success: true,
          text: `Message dispatched successfully via ${activeChannels.join(', ')}.`
        });
      } else {
        setResultMessage({
          success: false,
          text: data.message || 'Error sending message.'
        });
      }
    } catch (e: any) {
      setResultMessage({
        success: false,
        text: e.message || 'Network error.'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" /> Customer Messaging & Notifications
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Dispatch official order lifecycle notifications and customized communications across In-App, Email, and SMS.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Template Selection */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
            {/* Template Selector */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase tracking-wider text-[10px]">
                Predefined Order Notification Template
              </label>
              <select
                value={selectedTemplateKey}
                onChange={e => handleSelectTemplate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-xs focus:outline-none focus:border-primary"
              >
                <option value="shipment_tracking">Shipment & Tracking Dispatched 🚚</option>
                <option value="order_confirmation">Order Confirmed</option>
                <option value="processing_delay">Processing Delay Alert</option>
                <option value="delivery_issue">Delivery Re-attempt Notice</option>
                <option value="cancellation_update">Cancellation Approval Notice</option>
                <option value="refund_processed">Refund Completed Confirmation 💳</option>
                <option value="request_info">Request Additional Order Information</option>
                <option value="custom">Custom Message Composer</option>
              </select>
            </div>

            {/* Recipient Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Order # / Reference</label>
                <input
                  type="text"
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                  placeholder="e.g. MR-81729482"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Customer Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Customer Mobile (10-Digit)</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Amount (₹)</label>
                <input
                  type="text"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="999"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Courier Partner</label>
                <input
                  type="text"
                  value={courierName}
                  onChange={e => setCourierName(e.target.value)}
                  placeholder="Blue Dart"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tracking ID / AWB</label>
                <input
                  type="text"
                  value={trackingId}
                  onChange={e => setTrackingId(e.target.value)}
                  placeholder="AWB-8392019"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Delivery Channels Checklist */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Delivery Channels
              </span>
              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.in_app}
                    onChange={e => setChannels(prev => ({ ...prev, in_app: e.target.checked }))}
                    className="rounded text-primary focus:ring-0"
                  />
                  <Bell className="h-3.5 w-3.5 text-primary" /> In-App Notification
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.email}
                    onChange={e => setChannels(prev => ({ ...prev, email: e.target.checked }))}
                    className="rounded text-primary focus:ring-0"
                  />
                  <Mail className="h-3.5 w-3.5 text-blue-600" /> Email
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.sms}
                    onChange={e => setChannels(prev => ({ ...prev, sms: e.target.checked }))}
                    className="rounded text-primary focus:ring-0"
                  />
                  <Smartphone className="h-3.5 w-3.5 text-teal-600" /> SMS (If Gateway Active)
                </label>
              </div>
            </div>

            {/* Subject Line */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Message Subject / Notification Title</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Subject of notification..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-primary font-bold"
                required
              />
            </div>

            {/* Body */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700">Message Content</label>
                <span className="text-[10px] text-slate-400">
                  Dynamic tags: &#123;&#123;customerName&#125;&#125;, &#123;&#123;orderId&#125;&#125;, &#123;&#123;trackingId&#125;&#125;
                </span>
              </div>
              <textarea
                value={messageBody}
                onChange={e => setMessageBody(e.target.value)}
                rows={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-primary leading-relaxed resize-none"
                required
              />
            </div>

            {/* Outcome Alert */}
            {resultMessage && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  resultMessage.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {resultMessage.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {resultMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs transition shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sending ? 'Dispatching Message...' : 'Preview & Dispatch to Customer'}
            </button>
          </form>
        </div>

        {/* Right Column: Live Customer Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-primary" /> Live Customer Preview
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                {channels.email && 'Email'} {channels.in_app && '• In-App'}
              </span>
            </div>

            {/* Mock Notification Card */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Bell className="h-3.5 w-3.5" /> Mito Reboot Notification
              </div>
              <h4 className="text-sm font-bold text-white">{subject || 'Notification Subject'}</h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {getCompiledMessage(messageBody) || 'Type your message on the left to see live preview...'}
              </p>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800">
              <div><strong className="text-slate-300">Recipient Email:</strong> {customerEmail || 'None'}</div>
              <div><strong className="text-slate-300">Recipient Phone:</strong> {customerPhone || 'None'}</div>
              <div><strong className="text-slate-300">Order Ref:</strong> {orderId || 'None'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
