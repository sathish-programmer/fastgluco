import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, 
  Mail, 
  Phone, 
  ShieldCheck, 
  BarChart3, 
  Edit3, 
  UserCheck, 
  UserX, 
  Search, 
  Plus, 
  LayoutGrid, 
  List, 
  Sparkles, 
  Package, 
  X, 
  Percent, 
  IndianRupee, 
  FileText,
  TrendingUp,
  Activity
} from 'lucide-react';

interface AdminVendorManagementProps {
  apiUrl: string;
  token: string;
}

export const AdminVendorManagement: React.FC<AdminVendorManagementProps> = ({ apiUrl, token }) => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Performance data state
  const [selectedVendorPerf, setSelectedVendorPerf] = useState<any | null>(null);
  const [selectedVendorForPerf, setSelectedVendorForPerf] = useState<string | null>(null);
  const [selectedVendorObject, setSelectedVendorObject] = useState<any | null>(null);

  // Form states
  const [vendorId, setVendorId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [assignedProducts, setAssignedProducts] = useState<string[]>([]);
  const [commissionType, setCommissionType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [commissionValue, setCommissionValue] = useState<number>(10);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchVendors();
    fetchProducts();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setVendors(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/shop-products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPerformance = async (v: any) => {
    setSelectedVendorForPerf(v._id);
    setSelectedVendorObject(v);
    setSelectedVendorPerf(null);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/${v._id}/performance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedVendorPerf(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        email,
        phone,
        address,
        businessName,
        licenseNumber,
        taxId,
        businessAddress,
        assignedProducts,
        commissionType,
        commissionValue,
        isActive
      } as any;

      if (!isEditing) {
        payload.password = password;
      }

      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing 
        ? `${apiUrl}/admin/vendors/${vendorId}`
        : `${apiUrl}/admin/vendors`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchVendors();
      } else {
        const err = await res.json();
        alert(err.message || 'Error saving vendor partner profile');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (vendor: any) => {
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/${vendor._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...vendor, isActive: !vendor.isActive })
      });
      if (res.ok) {
        fetchVendors();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setVendorId('');
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setAddress('');
    setBusinessName('');
    setLicenseNumber('');
    setTaxId('');
    setBusinessAddress('');
    setAssignedProducts([]);
    setCommissionType('PERCENTAGE');
    setCommissionValue(10);
    setIsActive(true);
  };

  const openNew = () => {
    resetForm();
    setIsEditing(false);
    setShowModal(true);
  };

  const openEdit = (v: any) => {
    setVendorId(v._id);
    setName(v.name);
    setEmail(v.email);
    setPassword('');
    setPhone(v.phone || '');
    setAddress(v.address || '');
    setBusinessName(v.businessName || '');
    setLicenseNumber(v.licenseNumber || '');
    setTaxId(v.taxId || '');
    setBusinessAddress(v.businessAddress || '');
    setAssignedProducts(v.assignedProducts || []);
    setCommissionType(v.commissionType || 'PERCENTAGE');
    setCommissionValue(v.commissionValue !== undefined ? v.commissionValue : 10);
    setIsActive(v.isActive);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleProductSelect = (pId: string) => {
    setAssignedProducts(prev => {
      if (prev.includes(pId)) {
        return prev.filter(id => id !== pId);
      }
      return [...prev, pId];
    });
  };

  // Filtered Vendors calculation
  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchesSearch = 
        (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'ALL' ? true :
        statusFilter === 'ACTIVE' ? v.isActive :
        !v.isActive;

      return matchesSearch && matchesStatus;
    });
  }, [vendors, searchQuery, statusFilter]);

  // Metrics
  const activeCount = useMemo(() => vendors.filter(v => v.isActive).length, [vendors]);
  const totalAssignedProductsCount = useMemo(() => {
    return vendors.reduce((acc, v) => acc + (v.assignedProducts?.length || 0), 0);
  }, [vendors]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER BANNER WITH METRICS */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow elements */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Executive Partner Control Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Vendor Management & Logistics
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Onboard pharmacy partners, configure dynamic commission rules, map catalog products, and monitor real-time order fulfillment metrics.
            </p>
          </div>

          <button 
            onClick={openNew}
            className="self-start lg:self-auto bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold px-5 py-3 rounded-2xl text-sm flex items-center gap-2.5 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Register New Vendor
          </button>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Partners</span>
              <Store className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">{vendors.length}</div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Vendors</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {activeCount} <span className="text-xs font-semibold text-slate-400">({vendors.length ? Math.round((activeCount / vendors.length) * 100) : 0}%)</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Mapped Products</span>
              <Package className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">{totalAssignedProductsCount}</div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Default Comm.</span>
              <TrendingUp className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">10% <span className="text-[10px] text-slate-400 font-medium">avg</span></div>
          </div>
        </div>
      </div>

      {/* SEARCH, FILTER & ACTION BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search vendor name, business, email, phone..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills & View Toggles */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          
          {/* Status Filter */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60 shrink-0">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                  statusFilter === tab 
                    ? 'bg-white text-indigo-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60 shrink-0">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'GRID' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'TABLE' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* MAIN CONTENT REGION */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="animate-spin h-8 w-8 border-3 border-indigo-600 border-t-transparent rounded-full" />
          <span className="text-xs font-bold text-slate-400">Loading vendor partners...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* VENDORS LISTING (GRID OR TABLE) */}
          <div className="lg:col-span-2 space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                Registered Partners <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-indigo-100">{filteredVendors.length}</span>
              </h3>
            </div>

            {filteredVendors.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center space-y-3 shadow-xs">
                <Store className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">No Vendors Found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery || statusFilter !== 'ALL' 
                    ? 'No vendor matches your search criteria. Try resetting filters.' 
                    : 'Click "Register New Vendor" above to onboard your first partner pharmacy.'}
                </p>
              </div>
            ) : viewMode === 'GRID' ? (
              
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredVendors.map(v => (
                  <div 
                    key={v._id} 
                    className="bg-white border border-slate-200/90 hover:border-indigo-300 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-200 space-y-4 flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Top Status Stripe Accent */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${v.isActive ? 'bg-emerald-500' : 'bg-rose-400'}`} />

                    <div className="space-y-3.5">
                      
                      {/* Vendor Header Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                            {(v.businessName || v.name)[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                              {v.businessName || v.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-medium truncate flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 shrink-0" /> {v.email}
                            </p>
                          </div>
                        </div>

                        <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase border tracking-wider shrink-0 flex items-center gap-1 ${
                          v.isActive 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                            : 'bg-rose-50 text-rose-600 border-rose-200'
                        }`}>
                          {v.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {v.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Info Chips */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {v.commissionType === 'FIXED' ? <IndianRupee className="w-3.5 h-3.5" /> : <Percent className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none">Commission</span>
                            <span className="font-extrabold text-slate-800 text-xs">
                              {v.commissionType === 'FIXED' ? `₹${v.commissionValue ?? 10}` : `${v.commissionValue ?? 10}%`}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                            <Package className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none">Products</span>
                            <span className="font-extrabold text-slate-800 text-xs">
                              {v.assignedProducts?.length || 0} mapped
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contact & License Info */}
                      <div className="space-y-1 text-xs text-slate-500 bg-slate-50/50 rounded-2xl p-2.5 border border-slate-100">
                        {v.phone && (
                          <div className="flex items-center gap-2 text-slate-600 font-medium">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {v.phone}
                          </div>
                        )}
                        {v.taxId && (
                          <div className="flex items-center gap-2 text-slate-600 font-medium">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" /> GSTIN: <span className="font-bold text-slate-800">{v.taxId}</span>
                          </div>
                        )}
                        {v.licenseNumber && (
                          <div className="flex items-center gap-2 text-slate-600 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" /> License: <span className="font-bold text-slate-800">{v.licenseNumber}</span>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Actions Row */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button 
                        onClick={() => fetchPerformance(v)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
                          selectedVendorForPerf === v._id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" /> Performance
                      </button>
                      <button 
                        onClick={() => openEdit(v)}
                        className="py-2 px-3 bg-slate-50 hover:bg-indigo-50 text-indigo-600 border border-slate-200/80 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all"
                        title="Edit Vendor"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleToggleActive(v)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          v.isActive 
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200' 
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200'
                        }`}
                        title={v.isActive ? 'Deactivate Partner' : 'Activate Partner'}
                      >
                        {v.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (

              /* TABLE VIEW */
              <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 font-bold uppercase text-[10px] text-slate-400 tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Partner</th>
                      <th className="px-5 py-3.5">Commission</th>
                      <th className="px-5 py-3.5">Contact</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredVendors.map(v => (
                      <tr key={v._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {(v.businessName || v.name)[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs">{v.businessName || v.name}</div>
                              <div className="text-[10px] text-slate-400">{v.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="bg-amber-50 text-amber-700 font-extrabold px-2.5 py-1 rounded-lg border border-amber-200 text-[11px]">
                            {v.commissionType === 'FIXED' ? `₹${v.commissionValue ?? 10}` : `${v.commissionValue ?? 10}%`}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[11px]">
                          <div>{v.phone || '—'}</div>
                          <div className="text-slate-400 text-[10px]">{v.taxId ? `GST: ${v.taxId}` : ''}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border tracking-wider ${
                            v.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                          }`}>
                            {v.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => fetchPerformance(v)}
                              className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                              title="Performance"
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => openEdit(v)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            )}

          </div>

          {/* PERFORMANCE DISPLAY PANEL */}
          <div className="space-y-4 lg:sticky lg:top-6">
            <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" /> Fulfillment Metrics
            </h3>

            {selectedVendorForPerf ? (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{selectedVendorObject?.businessName || selectedVendorObject?.name}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">Real-time fulfillment analytics</span>
                  </div>
                  <button 
                    onClick={() => { setSelectedVendorForPerf(null); setSelectedVendorPerf(null); }}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                {selectedVendorPerf ? (
                  <div className="space-y-3.5 text-xs">
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Orders</span>
                        <span className="text-lg font-black text-slate-900">{selectedVendorPerf.totalAssigned}</span>
                      </div>
                      <div className="bg-emerald-50/60 rounded-2xl p-3 border border-emerald-100">
                        <span className="text-[9px] font-bold text-emerald-600 uppercase block">Delivered</span>
                        <span className="text-lg font-black text-emerald-700">{selectedVendorPerf.totalDelivered}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1 text-slate-600">
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Cancelled Orders</span>
                        <span className="font-bold text-rose-600">{selectedVendorPerf.totalCancelled}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Gross Sales Revenue</span>
                        <span className="font-black text-indigo-600">₹{selectedVendorPerf.totalRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-slate-500">Avg Lead Speed</span>
                        <span className="font-bold text-slate-800">{selectedVendorPerf.avgFulfillmentTimeHours} hours</span>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="animate-pulse space-y-3 py-4">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                    <div className="h-10 bg-slate-100 rounded-xl" />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs text-center text-slate-400 space-y-2">
                <BarChart3 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-500">No Vendor Selected</p>
                <p className="text-[11px] text-slate-400">Click <strong>"Performance"</strong> on any vendor card to inspect live sales & fulfillment metrics.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* REGISTER / EDIT VENDOR MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-2.5">
                <Store className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  {isEditing ? 'Edit Vendor Partner Profile' : 'Register New Vendor Partner'}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-xs">
              
              {/* Basic Credentials */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-[10px] text-indigo-600">Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Contact Name *</label>
                    <input 
                      required 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address *</label>
                    <input 
                      required 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)}
                      placeholder="vendor@pharmacy.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {!isEditing && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Account Password *</label>
                    <input 
                      required 
                      type="password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Set strong portal password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Business & License Details */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-[10px] text-indigo-600">Business & License Info</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pharmacy / Store Name</label>
                    <input 
                      type="text" 
                      value={businessName} 
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder="e.g. Apollo Pharmacy Local"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Drug / Retail License No.</label>
                    <input 
                      type="text" 
                      value={licenseNumber} 
                      onChange={e => setLicenseNumber(e.target.value)}
                      placeholder="DL-123456"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">GSTIN / Tax ID</label>
                    <input 
                      type="text" 
                      value={taxId} 
                      onChange={e => setTaxId(e.target.value)}
                      placeholder="29ABCDE1234F1Z5"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Business Address</label>
                  <input 
                    type="text" 
                    value={businessAddress} 
                    onChange={e => setBusinessAddress(e.target.value)}
                    placeholder="Full street address, city, pincode"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Commission Configuration */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-[10px] text-indigo-600">Platform Commission Rules</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">Commission Type</label>
                    <select 
                      value={commissionType} 
                      onChange={e => setCommissionType(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-xl p-2 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="PERCENTAGE">Percentage (%) Commission</option>
                      <option value="FIXED">Fixed Amount (₹) per Order</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">Commission Value</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.1"
                      value={commissionValue} 
                      onChange={e => setCommissionValue(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl p-2 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      placeholder="e.g. 10"
                    />
                  </div>
                </div>
              </div>

              {/* Product Mapping */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Assign Products Catalog Mapping</label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-2xl p-3 space-y-2 scrollbar-thin bg-slate-50/50">
                  {products.map(p => {
                    const isChecked = assignedProducts.includes(p._id);
                    return (
                      <label 
                        key={p._id} 
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          isChecked 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-2xs' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => handleProductSelect(p._id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span className="flex-1 truncate">{p.name} {p.brand && <span className="text-slate-400 text-[10px]">({p.brand})</span>}</span>
                      </label>
                    );
                  })}
                  {products.length === 0 && (
                    <p className="text-[10px] text-slate-450 italic text-center py-2">No catalog products found to assign.</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Vendor Profile'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
