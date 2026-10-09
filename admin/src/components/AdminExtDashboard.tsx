import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit, UserCheck, UserX, Upload, Image as ImageIcon } from 'lucide-react';

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [docForm, setDocForm] = useState({
    _id: '',
    name: '',
    email: '',
    password: '',
    specialty: '',
    qualification: '',
    experience: 0,
    description: '',
    sleepEvaluationNote: '',
    consultationFee: 750,
    onlineConsultationFee: 750,
    offlineConsultationFee: 750,
    slotDuration: 30,
    extraFeePer15Min: 100,
    feePolicy: 'extra 100/- every 15 mins, if consultation exceeds 30mins',
    avatar: '',
    isActive: true,
    languagesKnown: [] as string[],
    commissionType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    commissionValue: 10
  });
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

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${apiUrl}/admin/upload-media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setDocForm(prev => ({ ...prev, avatar: data.url }));
      } else {
        alert('Failed to upload doctor photo');
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert('Error uploading doctor photo');
    } finally {
      setUploadingAvatar(false);
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
              <p className="text-xs text-slate-500 mt-1">Register, edit and configure consultant doctors, fees, and sleep evaluation details</p>
            </div>
            <button
              onClick={() => {
                setDocForm({
                  _id: '',
                  name: '',
                  email: '',
                  password: '',
                  specialty: '',
                  qualification: '',
                  experience: 0,
                  description: '',
                  sleepEvaluationNote: '',
                  consultationFee: 750,
                  onlineConsultationFee: 750,
                  offlineConsultationFee: 750,
                  slotDuration: 30,
                  extraFeePer15Min: 100,
                  feePolicy: 'extra 100/- every 15 mins, if consultation exceeds 30mins',
                  avatar: '',
                  isActive: true,
                  languagesKnown: ['English'],
                  commissionType: 'PERCENTAGE',
                  commissionValue: 10
                });
                setEditingDocId(null);
                setShowDocModal(true);
              }}
              className="bg-primary hover:bg-primary-dark text-white font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-soft transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Doctor
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-5 py-4">Specialist</th>
                  <th className="px-5 py-4">Specialty & Experience</th>
                  <th className="px-5 py-4">Fee & Policy</th>
                  <th className="px-5 py-4">Commission</th>
                  <th className="px-5 py-4">Rating</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {doctors.map(doc => {
                  const avatarSrc = doc.avatar
                    ? (doc.avatar.startsWith('/uploads/') ? `${apiUrl.replace('/api', '')}${doc.avatar}` : doc.avatar)
                    : '';
                  return (
                    <tr key={doc._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 shrink-0 overflow-hidden shadow-2xs">
                            {avatarSrc ? (
                              <img src={avatarSrc} alt={doc.name} className="w-full h-full object-cover" />
                            ) : (
                              doc.name.replace(/^(Dr\.?|Ms\.?|Mr\.?)\s*/i, '').charAt(0) || 'D'
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{doc.name}</h4>
                            {doc.qualification && (
                              <p className="text-[11px] font-semibold text-slate-500 line-clamp-1" title={doc.qualification}>
                                {doc.qualification}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 font-normal">{doc.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-indigo-600 block">{doc.specialty}</span>
                          {doc.experience ? (
                            <span className="inline-block text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                              {doc.experience} yrs exp
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <span className="text-xs font-extrabold text-slate-900 block">
                            ₹{doc.onlineConsultationFee || doc.consultationFee || 750} <span className="text-[10px] text-slate-400 font-normal">/ {doc.slotDuration || 30}m</span>
                          </span>
                          {(doc.feePolicy || doc.extraFeePer15Min) && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded block max-w-[180px] truncate" title={doc.feePolicy || `+₹${doc.extraFeePer15Min}/15m`}>
                              ⏱️ {doc.feePolicy || `+₹${doc.extraFeePer15Min}/15m`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                        <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-lg font-bold border border-indigo-100">
                          {doc.commissionType === 'FIXED' ? `₹${doc.commissionValue ?? 10}` : `${doc.commissionValue ?? 10}%`}
                        </span>
                      </td>
                      <td className="px-5 py-4">
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
                      <td className="px-5 py-4">
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
                      <td className="px-5 py-4 text-right flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => {
                            setDocForm({
                              _id: doc._id || '',
                              name: doc.name || '',
                              email: doc.email || '',
                              password: '',
                              specialty: doc.specialty || '',
                              qualification: doc.qualification || '',
                              experience: doc.experience ?? 0,
                              description: doc.description || '',
                              sleepEvaluationNote: doc.sleepEvaluationNote || '',
                              consultationFee: doc.consultationFee ?? doc.onlineConsultationFee ?? 750,
                              onlineConsultationFee: doc.onlineConsultationFee ?? doc.consultationFee ?? 750,
                              offlineConsultationFee: doc.offlineConsultationFee ?? doc.consultationFee ?? 750,
                              slotDuration: doc.slotDuration ?? 30,
                              extraFeePer15Min: doc.extraFeePer15Min ?? 0,
                              feePolicy: doc.feePolicy || '',
                              avatar: doc.avatar || '',
                              isActive: doc.isActive !== false,
                              languagesKnown: doc.languagesKnown || [],
                              commissionType: doc.commissionType || 'PERCENTAGE',
                              commissionValue: doc.commissionValue ?? 10
                            });
                            setEditingDocId(doc._id);
                            setShowDocModal(true);
                          }}
                          className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-xl cursor-pointer"
                          title="Edit Doctor Profile"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDocDelete(doc._id)}
                          className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl cursor-pointer"
                          title="Delete Doctor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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

      {/* DOCTOR CREATE / EDIT MODAL */}
      {showDocModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 sm:p-7 border border-slate-100 shadow-2xl space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  {editingDocId ? 'Edit Doctor Profile' : 'Add Consultant / Doctor'}
                </h3>
                <p className="text-xs text-slate-400 font-medium">Configure credentials, sleep evaluation focus, and fees</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDocSubmit} className="space-y-4 text-xs">
              {/* Photo Upload Section */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                <input
                  type="file"
                  ref={avatarFileRef}
                  onChange={handleAvatarFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400 overflow-hidden shrink-0 shadow-2xs">
                  {docForm.avatar ? (
                    <img
                      src={docForm.avatar.startsWith('/uploads/') ? `${apiUrl.replace('/api', '')}${docForm.avatar}` : docForm.avatar}
                      alt="Doctor Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <span className="font-bold text-slate-700 block">Doctor Profile Photo</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => avatarFileRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{uploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
                    </button>
                    {docForm.avatar && (
                      <button
                        type="button"
                        onClick={() => setDocForm({ ...docForm, avatar: '' })}
                        className="text-slate-400 hover:text-rose-500 font-bold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={docForm.avatar}
                    onChange={e => setDocForm({ ...docForm, avatar: e.target.value })}
                    placeholder="Or enter direct image URL"
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] font-mono text-slate-600 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Basic Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-black text-slate-600 uppercase tracking-wider text-[10px] mb-1">Doctor Name *</label>
                  <input
                    required
                    value={docForm.name}
                    onChange={e => setDocForm({ ...docForm, name: e.target.value })}
                    placeholder="e.g. Dr. Krishnaveni Renganathan"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-400 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-600 uppercase tracking-wider text-[10px] mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={docForm.email}
                    onChange={e => setDocForm({ ...docForm, email: e.target.value })}
                    placeholder="doctor@example.com"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-400 font-semibold text-slate-800"
                  />
                </div>
              </div>

              {!editingDocId && (
                <div>
                  <label className="block font-black text-slate-600 uppercase tracking-wider text-[10px] mb-1">Doctor Portal Password *</label>
                  <input
                    required
                    type="password"
                    value={docForm.password}
                    onChange={e => setDocForm({ ...docForm, password: e.target.value })}
                    placeholder="Create login password"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-400 font-semibold text-slate-800"
                  />
                </div>
              )}

              {/* Specialty & Qualifications */}
              <div className="space-y-3.5">
                <div>
                  <label className="block font-black text-slate-600 uppercase tracking-wider text-[10px] mb-1">Specialty / Title *</label>
                  <input
                    required
                    value={docForm.specialty}
                    onChange={e => setDocForm({ ...docForm, specialty: e.target.value })}
                    placeholder="e.g. Consultant Pulmonologist, Allergy and Sleep Specialist"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-400 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-600 uppercase tracking-wider text-[10px] mb-1">Qualifications / Degrees</label>
                  <input
                    value={docForm.qualification}
                    onChange={e => setDocForm({ ...docForm, qualification: e.target.value })}
                    placeholder="e.g. MBBS, MD, DNB(Respiratory Medicine), DAA (CMC Vellore), Fellowship in sleep medicine (St John's)"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-400 font-medium text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-black text-slate-600 uppercase tracking-wider text-[10px] mb-1">Total Experience (Years)</label>
                    <input
                      type="number"
                      min="0"
                      value={docForm.experience}
                      onChange={e => setDocForm({ ...docForm, experience: Number(e.target.value) })}
                      placeholder="e.g. 13"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-400 font-bold text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-black text-slate-600 uppercase tracking-wider text-[10px] mb-1">Languages Spoken</label>
                    <input
                      value={Array.isArray(docForm.languagesKnown) ? docForm.languagesKnown.join(', ') : docForm.languagesKnown || ''}
                      onChange={e => setDocForm({ ...docForm, languagesKnown: e.target.value as any })}
                      placeholder="e.g. English, Hindi, Tamil"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-400 font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Consultation Pricing & Overtime Policy */}
              <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100/80 space-y-3">
                <span className="font-black text-indigo-950 uppercase tracking-wider text-[10px] block">
                  Consultation Pricing & Overtime Policy
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 text-[10px] mb-1">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={docForm.onlineConsultationFee}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setDocForm({ ...docForm, onlineConsultationFee: val, consultationFee: val });
                      }}
                      placeholder="750"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 text-[10px] mb-1">Slot Duration (Mins)</label>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={docForm.slotDuration}
                      onChange={e => setDocForm({ ...docForm, slotDuration: Number(e.target.value) })}
                      placeholder="30"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 text-[10px] mb-1">Extra Fee / 15m (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={docForm.extraFeePer15Min}
                      onChange={e => setDocForm({ ...docForm, extraFeePer15Min: Number(e.target.value) })}
                      placeholder="100"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 text-[10px] mb-1">Overtime Policy Note (Shown to Patient)</label>
                  <input
                    value={docForm.feePolicy}
                    onChange={e => setDocForm({ ...docForm, feePolicy: e.target.value })}
                    placeholder="e.g. extra 100/- every 15 mins , if consultation exceeds 30mins"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Sleep Evaluation Focus & Clinical Description */}
              <div className="space-y-3">
                <div>
                  <label className="block font-black text-amber-900 uppercase tracking-wider text-[10px] mb-1">
                    🌙 Why Sleep Evaluation / Clinical Focus Note (1-2 lines)
                  </label>
                  <textarea
                    value={docForm.sleepEvaluationNote}
                    onChange={e => setDocForm({ ...docForm, sleepEvaluationNote: e.target.value })}
                    placeholder="e.g. Sleep evaluation helps detect treatable sleep disorders, improving recovery, immunity, energy, and overall quality of life"
                    rows={2}
                    className="w-full border border-amber-200 bg-amber-50/40 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-600 uppercase tracking-wider text-[10px] mb-1">Full Profile Description / Bio</label>
                  <textarea
                    value={docForm.description}
                    onChange={e => setDocForm({ ...docForm, description: e.target.value })}
                    placeholder="Detailed bio, clinical interests, background..."
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Commission Settings */}
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <label className="block font-black text-slate-600 text-[10px] mb-1">Commission Type</label>
                  <select
                    value={docForm.commissionType}
                    onChange={e => setDocForm({ ...docForm, commissionType: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs font-bold bg-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-black text-slate-600 text-[10px] mb-1">Commission Rate / Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    value={docForm.commissionValue}
                    onChange={e => setDocForm({ ...docForm, commissionValue: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs font-bold bg-white focus:outline-none focus:border-indigo-400 font-mono"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="docActiveToggle"
                  checked={docForm.isActive}
                  onChange={e => setDocForm({ ...docForm, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="docActiveToggle" className="font-bold text-slate-700 cursor-pointer">
                  Doctor is Active and Visible for Booking
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-black text-white shadow-sm transition-all cursor-pointer"
                >
                  Save Doctor Profile
                </button>
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
