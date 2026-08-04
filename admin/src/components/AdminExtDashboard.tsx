import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, UserCheck, UserX } from 'lucide-react';

const formatDate = (dateStr: string | undefined | null, withTime = false): string => {
  if (!dateStr) return '--';
  try {
    const isPlain = /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
    const date = isPlain ? new Date(dateStr + 'T00:00:00') : new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const opts: Intl.DateTimeFormatOptions = withTime
      ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-IN', opts);
  } catch { return dateStr; }
};

interface AdminExtDashboardProps {
  apiUrl: string;
  token: string;
  adminRole?: string;
}

export const AdminExtDashboard: React.FC<AdminExtDashboardProps & { defaultTab?: 'doctors' | 'availability' | 'vendors' | 'orders' | 'reports' }> = ({ apiUrl, token, defaultTab }) => {
  const [activeTab, setActiveTab] = useState<'doctors' | 'availability' | 'vendors' | 'orders' | 'reports'>(defaultTab || 'doctors');
  
  // Doctors Management
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docForm, setDocForm] = useState({ _id: '', name: '', email: '', password: '', specialty: '', description: '', avatar: '', isActive: true, languagesKnown: [] as string[] });
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  // Vendor Management
  const [vendors, setVendors] = useState<any[]>([]);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorForm, setVendorForm] = useState({ _id: '', name: '', email: '', password: '', isActive: true });
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  // Order Assignments
  const [orders, setOrders] = useState<any[]>([]);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState('');

  // Doctor Availability Slot Simulator
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorAvailability, setDoctorAvailability] = useState<any>(null);
  const [availLoading, setAvailLoading] = useState(false);

  // Reports
  const [salesReport, setSalesReport] = useState({ totalSales: 0, totalOrders: 0, averageValue: 0 });
  const [vendorStats, setVendorStats] = useState<any[]>([]);

  useEffect(() => {
    fetchDoctors();
    fetchVendors();
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!selectedDoctorId) return;
    const fetchAvailability = async () => {
      setAvailLoading(true);
      try {
        const res = await fetch(`${apiUrl}/admin/doctors/${selectedDoctorId}/availability`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setDoctorAvailability(data);
      } catch (e) {
        setDoctorAvailability(null);
      } finally {
        setAvailLoading(false);
      }
    };
    fetchAvailability();
  }, [selectedDoctorId]);

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/doctors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
        if (data.length > 0 && !selectedDoctorId) setSelectedDoctorId(data[0]._id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingDocId ? 'PUT' : 'POST';
      const url = editingDocId ? `${apiUrl}/admin/doctors/${editingDocId}` : `${apiUrl}/admin/doctors`;
      const payload = {
        ...docForm,
        languagesKnown: typeof docForm.languagesKnown === 'string'
          ? (docForm.languagesKnown as string).split(',').map(s => s.trim()).filter(Boolean)
          : docForm.languagesKnown
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowDocModal(false);
        fetchDoctors();
      } else {
        alert('Error saving doctor profile');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDocDelete = async (id: string) => {
    if (!window.confirm('Delete doctor?')) return;
    try {
      const res = await fetch(`${apiUrl}/admin/doctors/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchDoctors();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/vendors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setVendors(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingVendorId ? 'PUT' : 'POST';
      const url = editingVendorId ? `${apiUrl}/admin/vendors/${editingVendorId}` : `${apiUrl}/admin/vendors`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(vendorForm)
      });
      if (res.ok) {
        setShowVendorModal(false);
        fetchVendors();
      } else {
        alert('Error saving vendor account');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/orders/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setOrders(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignOrder = async () => {
    if (!assigningOrderId || !selectedVendorId) return;
    try {
      const res = await fetch(`${apiUrl}/admin/orders/${assigningOrderId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ vendorId: selectedVendorId })
      });
      if (res.ok) {
        setAssigningOrderId(null);
        setSelectedVendorId('');
        fetchOrders();
      } else {
        alert('Error assigning order to vendor');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (orders.length > 0) {
      generateReports();
    }
  }, [orders, vendors]);

  const generateReports = () => {
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalSales = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = completedOrders.length;
    const averageValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    setSalesReport({ totalSales, totalOrders, averageValue });

    // Vendor statistics
    const statsMap: { [vendorName: string]: { totalAssigned: number, completed: number } } = {};
    vendors.forEach(v => {
      statsMap[v.name] = { totalAssigned: 0, completed: 0 };
    });

    orders.forEach(o => {
      if (o.vendorId && o.vendorId.name) {
        const vName = o.vendorId.name;
        if (!statsMap[vName]) statsMap[vName] = { totalAssigned: 0, completed: 0 };
        statsMap[vName].totalAssigned++;
        if (o.deliveryStatus === 'delivered') statsMap[vName].completed++;
      }
    });

    const vStats = Object.keys(statsMap).map(name => ({
      name,
      ...statsMap[name]
    }));
    setVendorStats(vStats);
  };

  return (
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {(['doctors', 'availability', 'vendors', 'orders', 'reports'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-bold capitalize transition-all rounded-lg ${activeTab === tab ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* DOCTORS TABS */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-sans">Doctors Management</h2>
              <p className="text-xs text-slate-500 mt-1">Register, edit and deactivate consultant doctors</p>
            </div>
            <button
              onClick={() => {
                setDocForm({ _id: '', name: '', email: '', password: '', specialty: '', description: '', avatar: '', isActive: true, languagesKnown: [] });
                setEditingDocId(null);
                setShowDocModal(true);
              }}
              className="bg-primary text-white font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-soft"
            >
              <Plus className="h-4 w-4" /> Add Doctor
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Specialist</th>
                  <th className="px-6 py-4">Specialty</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {doctors.map(doc => (
                  <tr key={doc._id}>
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                        {doc.avatar ? <img src={doc.avatar} className="w-full h-full rounded-full object-cover" /> : doc.name[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Dr. {doc.name}</h4>
                        <p className="text-xs text-slate-400 font-normal">{doc.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-indigo-600">{doc.specialty}</td>
                    <td className="px-6 py-4">
                      {doc.avgRating != null ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(star => (
                              <svg key={star} className={`w-3.5 h-3.5 ${star <= Math.round(doc.avgRating) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.168c.969 0 1.371 1.24.588 1.81l-3.374 2.452a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118L10 14.347l-3.952 2.701c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.058 9.394c-.783-.57-.38-1.81.588-1.81h4.168a1 1 0 00.95-.69l1.285-3.967z"/>
                              </svg>
                            ))}
                            <span className="text-xs font-bold text-slate-700 ml-1">{doc.avgRating}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{doc.ratingCount} review{doc.ratingCount !== 1 ? 's' : ''}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-350 italic">No ratings yet</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {doc.isActive ? (
                        <span className="bg-green-50 text-success text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1 w-max">
                          <UserCheck className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="bg-red-50 text-danger text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1 w-max">
                          <UserX className="w-3.5 h-3.5" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2 mt-1">
                      <button
                        onClick={() => {
                          setDocForm({ ...doc, password: '', languagesKnown: doc.languagesKnown || [] });
                          setEditingDocId(doc._id);
                          setShowDocModal(true);
                        }}
                        className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-xl"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDocDelete(doc._id)}
                        className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AVAILABILITY SIMULATOR TABS */}
      {activeTab === 'availability' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Dynamic Slot Simulator</h2>
            <p className="text-xs text-slate-400 mt-1">Choose a doctor to preview their real configured availability.</p>
          </div>

          <div className="flex gap-4">
            <div className="w-1/3">
              <label className="block text-xs font-bold text-slate-500 mb-2">Select Doctor</label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 font-bold bg-white"
              >
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>Dr. {d.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              {availLoading ? (
                <p className="text-xs text-slate-400">Loading availability...</p>
              ) : doctorAvailability ? (
                <>
                  <h3 className="font-bold text-slate-800 text-sm mb-3">Real Availability Configuration</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase">Available Days</span>
                      <span>{(() => {
                        const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                        return (doctorAvailability.availableDays || []).map((d: number) => dayNames[d]).join(', ') || 'Not configured';
                      })()}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase">Time Slots</span>
                      <span>{(doctorAvailability.availableTimeSlots || []).map((s: any) => `${s.start} – ${s.end}`).join(', ') || 'Not configured'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase">Slot Duration</span>
                      <span>{doctorAvailability.slotDuration || 30} minutes</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase">Max Per Slot</span>
                      <span>{doctorAvailability.maxAppointmentsPerSlot || 1} patient(s)</span>
                    </div>
                    {(doctorAvailability.holidays || []).length > 0 && (
                      <div className="col-span-2">
                        <span className="block text-[10px] text-slate-400 uppercase">Holidays</span>
                        <span>{(doctorAvailability.holidays as string[]).map(h => formatDate(h)).join(', ')}</span>
                      </div>
                    )}
                    {(doctorAvailability.leaves || []).length > 0 && (
                      <div className="col-span-2">
                        <span className="block text-[10px] text-slate-400 uppercase">Leaves</span>
                        <span>{(doctorAvailability.leaves as string[]).map(l => formatDate(l)).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm font-semibold text-slate-500">No availability configured yet</p>
                  <p className="text-xs text-slate-400 mt-1">Doctor has not set up their schedule in the portal.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VENDORS TABS */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Vendor Management</h2>
              <p className="text-xs text-slate-500 mt-1">Logistics vendors for patient shop orders</p>
            </div>
            <button
              onClick={() => {
                setVendorForm({ _id: '', name: '', email: '', password: '', isActive: true });
                setEditingVendorId(null);
                setShowVendorModal(true);
              }}
              className="bg-primary text-white font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-soft"
            >
              <Plus className="h-4 w-4" /> Add Vendor
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Vendor Partner</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {vendors.map(v => (
                  <tr key={v._id}>
                    <td className="px-6 py-4">
                      <h4 className="font-bold text-slate-800 text-sm">{v.name}</h4>
                      <p className="text-xs text-slate-400 font-normal">{v.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      {v.isActive ? (
                        <span className="bg-green-50 text-success text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1 w-max">
                          <UserCheck className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="bg-red-50 text-danger text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1 w-max">
                          <UserX className="w-3.5 h-3.5" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setVendorForm({ ...v, password: '' });
                          setEditingVendorId(v._id);
                          setShowVendorModal(true);
                        }}
                        className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-xl"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDERS TABS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Admin Order Routing</h2>
            <p className="text-xs text-slate-500 mt-1">Assign orders to shipment partners and track real-time status</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Order ID & Date</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">Assigned Partner</th>
                  <th className="px-6 py-4">Shipment status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {orders.map(o => (
                  <tr key={o._id}>
                    <td className="px-6 py-4">
                      <h4 className="font-mono text-slate-800 text-xs">{o._id}</h4>
                      <p className="text-[10px] text-slate-400 font-normal">{formatDate(o.createdAt, true)}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {o.currency === 'USD' ? '$' : '₹'}{o.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-indigo-600">
                      {o.vendorId?.name || <span className="text-amber-500">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 uppercase text-[10px] font-bold">
                      {o.deliveryStatus || 'pending'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!o.vendorId ? (
                        <button
                          onClick={() => setAssigningOrderId(o._id)}
                          className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-primary-dark shadow-sm"
                        >
                          Assign Vendor
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Assigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SALES REPORTS TABS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Total Sales Revenue</span>
              <h2 className="text-3xl font-black text-slate-800">₹{salesReport.totalSales.toFixed(2)}</h2>
            </div>
            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Completed Orders</span>
              <h2 className="text-3xl font-black text-slate-800">{salesReport.totalOrders}</h2>
            </div>
            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Average Order Value</span>
              <h2 className="text-3xl font-black text-slate-800">₹{salesReport.averageValue.toFixed(2)}</h2>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Vendor Fulfilment Performance</h3>
            <table className="w-full text-left text-xs font-bold text-slate-500">
              <thead>
                <tr className="border-b border-slate-100 pb-2">
                  <th className="pb-2">Vendor Name</th>
                  <th className="pb-2">Total Orders Assigned</th>
                  <th className="pb-2">Completed Deliveries</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {vendorStats.map((vs, idx) => (
                  <tr key={idx} className="border-b border-slate-50/50">
                    <td className="py-3">{vs.name}</td>
                    <td className="py-3">{vs.totalAssigned}</td>
                    <td className="py-3 text-success">{vs.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOCTOR CREATE MODAL */}
      {showDocModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-100 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-4">{editingDocId ? 'Edit Doctor Profile' : 'Add Doctor'}</h3>
            <form onSubmit={handleDocSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                <input required value={docForm.name} onChange={e => setDocForm({ ...docForm, name: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                <input required type="email" value={docForm.email} onChange={e => setDocForm({ ...docForm, email: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 font-semibold" />
              </div>
              {!editingDocId && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Password</label>
                  <input required type="password" value={docForm.password} onChange={e => setDocForm({ ...docForm, password: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 font-semibold" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Specialty</label>
                  <input required value={docForm.specialty} onChange={e => setDocForm({ ...docForm, specialty: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Avatar (URL)</label>
                  <input value={docForm.avatar} onChange={e => setDocForm({ ...docForm, avatar: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Languages Spoken (comma separated)</label>
                <input 
                  value={Array.isArray(docForm.languagesKnown) ? docForm.languagesKnown.join(', ') : docForm.languagesKnown || ''} 
                  onChange={e => setDocForm({ ...docForm, languagesKnown: e.target.value as any })} 
                  placeholder="e.g. English, Hindi, Tamil" 
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 font-semibold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Profile Description</label>
                <textarea required value={docForm.description} onChange={e => setDocForm({ ...docForm, description: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 font-semibold" rows={3}></textarea>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowDocModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary rounded-xl text-sm font-bold text-white shadow-sm">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VENDOR CREATE MODAL */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-100 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-4">{editingVendorId ? 'Edit Vendor account' : 'Add Vendor'}</h3>
            <form onSubmit={handleVendorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Vendor Partner Name</label>
                <input required value={vendorForm.name} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                <input required type="email" value={vendorForm.email} onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 font-semibold" />
              </div>
              {!editingVendorId && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Password</label>
                  <input required type="password" value={vendorForm.password} onChange={e => setVendorForm({ ...vendorForm, password: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 font-semibold" />
                </div>
              )}
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowVendorModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary rounded-xl text-sm font-bold text-white shadow-sm">Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN VENDOR ROUTING MODAL */}
      {assigningOrderId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 border border-slate-100 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-4">Route Order to Vendor</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Select Logistics Partner</label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 font-bold bg-white"
                >
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map(v => (
                    <option key={v._id} value={v._id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setAssigningOrderId(null)} className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold text-slate-600">Cancel</button>
                <button onClick={handleAssignOrder} disabled={!selectedVendorId} className="px-4 py-2 bg-primary rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-50">Assign Route</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
