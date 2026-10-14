import React, { useState, useEffect } from 'react';
import {
  History,
  Settings,
  Search,
  ShieldAlert,
  Save,
  CheckCircle2
} from 'lucide-react';

interface OrderSettingsAuditPageProps {
  apiUrl: string;
  token: string;
  adminRole?: string;
}

export const OrderSettingsAuditPage: React.FC<OrderSettingsAuditPageProps> = ({
  apiUrl,
  token,
  adminRole = 'Admin'
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'settings'>('audit');

  // Audit Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditSearch, setAuditSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  // Settings state
  const [settings, setSettings] = useState<any>({
    cancellationWindowHours: 24,
    autoCancelUnpaidHours: 48,
    returnWindowDays: 7,
    enableEmailNotifications: true,
    enableSmsNotifications: false,
    enableInAppNotifications: true,
    supportEmail: 'support@mitoreboot.in',
    defaultCourier: 'Blue Dart',
    autoNotifyOnShipment: true,
    autoNotifyOnRefund: true,
    requireRefundConfirmation: true
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({
        search: auditSearch,
        action: actionFilter,
        entityType: entityFilter
      });
      const res = await fetch(`${apiUrl}/admin/order-management/audit-history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuditLoading(false);
    }
  };

  // Fetch Settings
  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/order-management/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    } else {
      fetchSettings();
    }
  }, [activeTab, auditSearch, actionFilter, entityFilter, apiUrl, token]);

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`${apiUrl}/admin/order-management/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save settings.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Subtab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" /> Order Settings & Immutable Audit Trail
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {adminRole}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically logged audit history of sensitive actions and order management policy configurations.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="h-4 w-4" /> Audit History
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="h-4 w-4" /> Order Policies & Settings
          </button>
        </div>
      </div>

      {activeTab === 'audit' ? (
        <div className="space-y-4">
          {/* Audit Filters */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                placeholder="Search audit trail by admin, order #, details..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium focus:outline-none"
              >
                <option value="all">All Actions</option>
                <option value="ORDER_LIFECYCLE_UPDATE">Fulfilment Status Update</option>
                <option value="REFUND_COMPLETED">Refund Completed</option>
                <option value="REFUND_FAILED">Refund Failed</option>
                <option value="CANCELLATION_APPROVE">Cancellation Approved</option>
                <option value="CANCELLATION_REJECT">Cancellation Rejected</option>
                <option value="TICKET_REPLIED">Support Ticket Replied</option>
                <option value="CUSTOMER_MESSAGE_SENT">Customer Message Sent</option>
                <option value="ORDER_SETTINGS_UPDATED">Settings Updated</option>
              </select>
            </div>

            <div>
              <select
                value={entityFilter}
                onChange={e => setEntityFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium focus:outline-none"
              >
                <option value="all">All Entity Types</option>
                <option value="Order">Order</option>
                <option value="Refund">Refund</option>
                <option value="Cancellation">Cancellation</option>
                <option value="SupportTicket">Support Ticket</option>
                <option value="Settings">Settings</option>
                <option value="Vendor">Vendor</option>
              </select>
            </div>
          </div>

          {/* Audit Trail Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Admin User</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Entity & Ref</th>
                    <th className="py-3.5 px-4">Audit Details</th>
                    <th className="py-3.5 px-4">Amount / Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLoading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400 font-semibold">
                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                        Loading audit trail...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400">
                        <ShieldAlert className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-600">No audit records match your filters.</p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((lg, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                          {new Date(lg.createdAt).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {lg.adminName || lg.adminEmail || 'Admin'}
                          {lg.adminEmail && <span className="block text-[10px] text-slate-400 font-normal">{lg.adminEmail}</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {lg.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-700 block">{lg.entityType || 'General'}</span>
                          {lg.orderNumber && <span className="font-mono text-[10px] text-primary font-bold">{lg.orderNumber}</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-sm truncate" title={lg.details}>
                          {lg.details}
                        </td>
                        <td className="py-3 px-4">
                          {lg.amount ? (
                            <span className="font-bold text-slate-800">₹{lg.amount}</span>
                          ) : lg.gatewayRef ? (
                            <span className="font-mono text-[10px] text-slate-500">{lg.gatewayRef}</span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : settingsLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold border border-slate-200 shadow-sm max-w-3xl">
          Loading order settings and configurations...
        </div>
      ) : (
        /* Settings Form */
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm max-w-3xl">
          <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
            {/* Windows and Policy Durations */}
            <div>
              <h3 className="font-bold text-sm text-slate-800 mb-3">Order & Return Policies</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Cancellation Window (Hours)
                  </label>
                  <input
                    type="number"
                    value={settings.cancellationWindowHours}
                    onChange={e => setSettings({ ...settings, cancellationWindowHours: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-xs focus:outline-none"
                    min={1}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Maximum time allowed to cancel before dispatch</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Return Window (Days)
                  </label>
                  <input
                    type="number"
                    value={settings.returnWindowDays}
                    onChange={e => setSettings({ ...settings, returnWindowDays: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-xs focus:outline-none"
                    min={1}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Eligible days for returns post delivery</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Auto-Cancel Unpaid (Hours)
                  </label>
                  <input
                    type="number"
                    value={settings.autoCancelUnpaidHours}
                    onChange={e => setSettings({ ...settings, autoCancelUnpaidHours: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-xs focus:outline-none"
                    min={1}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Abandon checkout orders expire after</span>
                </div>
              </div>
            </div>

            {/* Logistics & Support Defaults */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="font-bold text-sm text-slate-800 mb-3">Logistics & Communication Defaults</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Default Courier Partner
                  </label>
                  <input
                    type="text"
                    value={settings.defaultCourier}
                    onChange={e => setSettings({ ...settings, defaultCourier: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Official Support Desk Email
                  </label>
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Notification Automation Toggles */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="font-bold text-sm text-slate-800">Notification Automation</h3>
              
              <div className="space-y-2 text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoNotifyOnShipment}
                    onChange={e => setSettings({ ...settings, autoNotifyOnShipment: e.target.checked })}
                    className="rounded text-primary focus:ring-0"
                  />
                  <span className="font-bold">Automatically notify customer on order shipment & dispatch</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoNotifyOnRefund}
                    onChange={e => setSettings({ ...settings, autoNotifyOnRefund: e.target.checked })}
                    className="rounded text-primary focus:ring-0"
                  />
                  <span className="font-bold">Automatically send refund receipt & reference ID to customer</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.requireRefundConfirmation}
                    onChange={e => setSettings({ ...settings, requireRefundConfirmation: e.target.checked })}
                    className="rounded text-primary focus:ring-0"
                  />
                  <span className="font-bold">Enforce confirmation dialog on all financial refund actions</span>
                </label>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Settings updated successfully and logged in audit history.
              </div>
            )}

            <button
              type="submit"
              disabled={savingSettings}
              className="py-3 px-6 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs transition shadow-md shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {savingSettings ? 'Saving Settings...' : 'Save Order Policies'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
