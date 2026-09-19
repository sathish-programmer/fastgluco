import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, 
  ShieldCheck, 
  BarChart3, 
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
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Download,
  Settings,
  Check,
  Building
} from 'lucide-react';


interface AdminVendorManagementProps {
  apiUrl: string;
  token: string;
}

export const AdminVendorManagement: React.FC<AdminVendorManagementProps> = ({ apiUrl, token }) => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Active view: 'LIST' or 'DETAIL'
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedVendorData, setSelectedVendorData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'settlements' | 'logs' | 'config'>('overview');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'API' | 'MANUAL' | 'EXTERNAL_AMAZON'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Add Vendor Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVendorForm, setNewVendorForm] = useState({
    name: '',
    slug: '',
    email: '',
    password: '',
    phone: '',
    website: '',
    businessName: '',
    licenseNumber: '',
    taxId: '',
    commissionRate: 30,
    settlementCycleDays: 30,
    checkoutType: 'INTERNAL',
    productSyncMethod: 'API',
    productType: 'MULTIPLE',
    externalStoreUrl: '',
    mockMode: true
  });

  // Settlement Generation State
  const [generatingSettlement, setGeneratingSettlement] = useState(false);
  const [settlementCycleDays, setSettlementCycleDays] = useState(30);
  const [settlementStartDate, setSettlementStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [settlementEndDate, setSettlementEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSettlementBreakdown, setSelectedSettlementBreakdown] = useState<any | null>(null);

  // Order Details Modal
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<any | null>(null);

  // Edit Config Form in Tab 6
  const [editConfigForm, setEditConfigForm] = useState<any>({});

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVendors(data);
      }
    } catch (e) {
      console.error('Error fetching vendors:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorDetails = async (vendorId: string) => {
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/${vendorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedVendorData(data);
        setEditConfigForm({
          name: data.vendor.name || '',
          slug: data.vendor.slug || '',
          email: data.vendor.email || '',
          phone: data.vendor.phone || '',
          website: data.vendor.website || '',
          businessName: data.vendor.businessName || '',
          licenseNumber: data.vendor.licenseNumber || '',
          taxId: data.vendor.taxId || '',
          businessAddress: data.vendor.businessAddress || '',
          externalStoreUrl: data.vendor.externalStoreUrl || '',
          commissionRate: data.vendor.commissionConfig?.rate ?? 30,
          settlementCycleDays: data.vendor.commissionConfig?.settlementCycleDays ?? 30,
          gstOnCommissionRate: data.vendor.commissionConfig?.gstOnCommissionRate ?? 18,
          passThroughShipping: data.vendor.commissionConfig?.passThroughShipping ?? true,
          mockMode: data.vendor.apiConfig?.mockMode ?? true,
          baseUrl: data.vendor.apiConfig?.baseUrl || '',
          apiKey: data.vendor.apiConfig?.apiKey || '',
          checkoutType: data.vendor.capabilities?.checkoutType || 'INTERNAL',
          productSyncMethod: data.vendor.capabilities?.productSyncMethod || 'API',
          productType: data.vendor.capabilities?.productType || 'MULTIPLE'
        });
        setSettlementCycleDays(data.vendor.commissionConfig?.settlementCycleDays ?? 30);
      }
    } catch (e) {
      console.error('Error fetching vendor details:', e);
    }
  };

  const openVendorDetail = (vendor: any) => {
    setSelectedVendorId(vendor._id);
    fetchVendorDetails(vendor._id);
    setActiveTab('overview');
  };

  const handleSeedDefaults = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/seed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        setSyncMessage('Arivu Foods and future vendor architectural records seeded successfully!');
        setTimeout(() => setSyncMessage(null), 5000);
        await fetchVendors();
      }
    } catch (e) {
      console.error('Error seeding vendors:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCatalog = async (vendorId: string) => {
    setSyncingCatalog(true);
    setSyncMessage(null);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/${vendorId}/sync-products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(`Catalog Synchronized! Processed ${data.result?.createdCount || 0} new, ${data.result?.updatedCount || 0} updated products.`);
        if (selectedVendorId) {
          fetchVendorDetails(selectedVendorId);
        }
        fetchVendors();
      } else {
        setSyncMessage(`Sync Warning: ${data.message || 'Error occurred'}`);
      }
    } catch (e: any) {
      setSyncMessage(`Failed to sync: ${e.message}`);
    } finally {
      setSyncingCatalog(false);
      setTimeout(() => setSyncMessage(null), 6000);
    }
  };

  const handleSubmitOrderToVendor = async (orderId: string) => {
    if (!selectedVendorId) return;
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/${selectedVendorId}/orders/${orderId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        fetchVendorDetails(selectedVendorId);
        setSyncMessage('Order submitted to vendor successfully!');
        setTimeout(() => setSyncMessage(null), 4000);
      }
    } catch (e) {
      console.error('Error submitting order to vendor:', e);
    }
  };

  const handlePollOrderStatus = async (orderId: string) => {
    if (!selectedVendorId) return;
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/${selectedVendorId}/orders/${orderId}/sync-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        fetchVendorDetails(selectedVendorId);
        setSyncMessage('Polled latest status and tracking from vendor API!');
        setTimeout(() => setSyncMessage(null), 4000);
      }
    } catch (e) {
      console.error('Error polling status:', e);
    }
  };

  const handleGenerateSettlement = async () => {
    if (!selectedVendorId) return;
    setGeneratingSettlement(true);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/${selectedVendorId}/settlements/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: settlementStartDate,
          endDate: settlementEndDate,
          cycleDays: settlementCycleDays
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(`Settlement cycle created: ${data.settlementCode} for ₹${data.finalSettlementAmount}!`);
        fetchVendorDetails(selectedVendorId);
      } else {
        setSyncMessage(`Failed to generate settlement: ${data.message}`);
      }
    } catch (e: any) {
      setSyncMessage(`Error: ${e.message}`);
    } finally {
      setGeneratingSettlement(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleFinalizeSettlement = async (settlementId: string) => {
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/settlements/${settlementId}/finalize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        setSyncMessage('Settlement finalized and orders locked successfully!');
        if (selectedVendorId) fetchVendorDetails(selectedVendorId);
        setTimeout(() => setSyncMessage(null), 4000);
      }
    } catch (e) {
      console.error('Error finalizing settlement:', e);
    }
  };

  const handleSaveVendorConfig = async () => {
    if (!selectedVendorId) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/${selectedVendorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editConfigForm.name,
          slug: editConfigForm.slug,
          email: editConfigForm.email,
          phone: editConfigForm.phone,
          website: editConfigForm.website,
          businessName: editConfigForm.businessName,
          licenseNumber: editConfigForm.licenseNumber,
          taxId: editConfigForm.taxId,
          businessAddress: editConfigForm.businessAddress,
          externalStoreUrl: editConfigForm.externalStoreUrl,
          capabilities: {
            checkoutType: editConfigForm.checkoutType,
            productSyncMethod: editConfigForm.productSyncMethod,
            productType: editConfigForm.productType
          },
          commissionConfig: {
            rate: Number(editConfigForm.commissionRate),
            settlementCycleDays: Number(editConfigForm.settlementCycleDays),
            gstOnCommissionRate: Number(editConfigForm.gstOnCommissionRate),
            passThroughShipping: editConfigForm.passThroughShipping
          },
          apiConfig: {
            mockMode: editConfigForm.mockMode,
            baseUrl: editConfigForm.baseUrl,
            apiKey: editConfigForm.apiKey
          }
        })
      });
      if (res.ok) {
        setSyncMessage('Vendor configuration updated successfully!');
        fetchVendorDetails(selectedVendorId);
        fetchVendors();
      }
    } catch (e: any) {
      setSyncMessage(`Save error: ${e.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const handleCreateNewVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newVendorForm.name,
          slug: newVendorForm.slug,
          email: newVendorForm.email,
          password: newVendorForm.password,
          phone: newVendorForm.phone,
          website: newVendorForm.website,
          businessName: newVendorForm.businessName,
          licenseNumber: newVendorForm.licenseNumber,
          taxId: newVendorForm.taxId,
          externalStoreUrl: newVendorForm.externalStoreUrl,
          capabilities: {
            checkoutType: newVendorForm.checkoutType,
            productSyncMethod: newVendorForm.productSyncMethod,
            productType: newVendorForm.productType
          },
          commissionConfig: {
            rate: Number(newVendorForm.commissionRate),
            settlementCycleDays: Number(newVendorForm.settlementCycleDays)
          },
          apiConfig: {
            mockMode: newVendorForm.mockMode
          }
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchVendors();
        setSyncMessage('New vendor added successfully!');
        setTimeout(() => setSyncMessage(null), 4000);
      }
    } catch (e: any) {
      alert(`Error creating vendor: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Filtered vendors list
  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        v.name?.toLowerCase().includes(q) || 
        v.slug?.toLowerCase().includes(q) || 
        v.email?.toLowerCase().includes(q) || 
        v.businessName?.toLowerCase().includes(q);

      const matchesStatus = 
        statusFilter === 'ALL' ? true : 
        statusFilter === 'ACTIVE' ? v.isActive : !v.isActive;

      const checkoutType = v.capabilities?.checkoutType || 'INTERNAL';
      const syncMethod = v.capabilities?.productSyncMethod || 'API';
      const matchesType = 
        typeFilter === 'ALL' ? true :
        typeFilter === 'EXTERNAL_AMAZON' ? checkoutType === 'EXTERNAL_AMAZON' :
        typeFilter === 'API' ? syncMethod === 'API' : syncMethod === 'MANUAL';

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [vendors, searchQuery, statusFilter, typeFilter]);

  // Overall statistics banner
  const overallStats = useMemo(() => {
    const totalVendors = vendors.length;
    const activeVendors = vendors.filter(v => v.isActive).length;
    const totalGmv = vendors.reduce((acc, v) => acc + (v.metrics?.totalOrderValue || 0), 0);
    const totalPendingSettlement = vendors.reduce((acc, v) => acc + (v.metrics?.pendingSettlementAmount || 0), 0);
    const totalProducts = vendors.reduce((acc, v) => acc + (v.metrics?.productCount || 0), 0);

    return { totalVendors, activeVendors, totalGmv, totalPendingSettlement, totalProducts };
  }, [vendors]);

  return (
    <div className="space-y-6">
      {/* GLOBAL FEEDBACK NOTIFICATION BANNER */}
      {syncMessage && (
        <div className="bg-emerald-900/90 border border-emerald-500/40 text-emerald-100 px-4 py-3 rounded-xl flex items-center justify-between shadow-lg backdrop-blur animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{syncMessage}</span>
          </div>
          <button onClick={() => setSyncMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* VIEW: VENDOR LISTING */}
      {!selectedVendorId && (
        <div className="space-y-6">
          {/* HEADER & ACTIONS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-700/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            {/* subtle emerald glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/8 via-transparent to-teal-600/5 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-500/25">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Multi-Vendor E-Commerce Console</h1>
                  <p className="text-xs text-slate-400 mt-0.5">Manage partner integrations, catalog synchronization, order fulfillment & commission settlements</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 relative">
              <button
                onClick={handleSeedDefaults}
                disabled={loading}
                className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-600/60 transition shadow-sm"
                title="Seeds Arivu Foods (with 30% commission & mock catalog) and future vendor templates"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Seed Vendors & Templates</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/50 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Onboard New Vendor</span>
              </button>
            </div>
          </div>

          {/* KPI STATS BANNER */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="relative bg-gradient-to-br from-blue-950/80 to-slate-900 border border-blue-800/40 rounded-2xl p-4 flex items-center gap-3.5 overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -translate-y-4 translate-x-4 blur-xl" />
              <div className="p-3 bg-blue-500/15 rounded-xl text-blue-400 border border-blue-500/20">
                <Store className="h-5 w-5" />
              </div>
              <div className="relative">
                <p className="text-[10px] font-bold text-blue-400/80 uppercase tracking-wider">Total Vendors</p>
                <p className="text-2xl font-black text-white leading-none mt-1">{overallStats.totalVendors}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{overallStats.activeVendors} Active</p>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-800/40 rounded-2xl p-4 flex items-center gap-3.5 overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -translate-y-4 translate-x-4 blur-xl" />
              <div className="p-3 bg-emerald-500/15 rounded-xl text-emerald-400 border border-emerald-500/20">
                <Package className="h-5 w-5" />
              </div>
              <div className="relative">
                <p className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider">Vendor Products</p>
                <p className="text-2xl font-black text-white leading-none mt-1">{overallStats.totalProducts}</p>
                <p className="text-[10px] text-emerald-400/70 mt-0.5">Catalog Synced</p>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-800/40 rounded-2xl p-4 flex items-center gap-3.5 overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full -translate-y-4 translate-x-4 blur-xl" />
              <div className="p-3 bg-indigo-500/15 rounded-xl text-indigo-400 border border-indigo-500/20">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="relative">
                <p className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-wider">Total GMV</p>
                <p className="text-2xl font-black text-white leading-none mt-1">₹{overallStats.totalGmv.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Gross vendor orders</p>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-purple-950/80 to-slate-900 border border-purple-800/40 rounded-2xl p-4 flex items-center gap-3.5 overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -translate-y-4 translate-x-4 blur-xl" />
              <div className="p-3 bg-purple-500/15 rounded-xl text-purple-400 border border-purple-500/20">
                <Percent className="h-5 w-5" />
              </div>
              <div className="relative">
                <p className="text-[10px] font-bold text-purple-400/80 uppercase tracking-wider">Arivu Agreement</p>
                <p className="text-2xl font-black text-white leading-none mt-1">{vendors.find(v => v.slug === 'arivu-foods')?.commissionConfig?.rate ?? 30}% Comm</p>
                <p className="text-[10px] text-purple-400/70 mt-0.5">+ {vendors.find(v => v.slug === 'arivu-foods')?.commissionConfig?.gstOnCommissionRate ?? 18}% GST retention</p>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-amber-950/80 to-slate-900 border border-amber-800/40 rounded-2xl p-4 flex items-center gap-3.5 overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full -translate-y-4 translate-x-4 blur-xl" />
              <div className="p-3 bg-amber-500/15 rounded-xl text-amber-400 border border-amber-500/20">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div className="relative">
                <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider">Pending Settlement</p>
                <p className="text-2xl font-black text-amber-300 leading-none mt-1">₹{overallStats.totalPendingSettlement.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Unsettled orders</p>
              </div>
            </div>
          </div>

          {/* FILTER AND SEARCH BAR */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-700/60 p-3.5 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search vendor name, slug, email, business..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-600/60 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/70"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>

              {/* Integration Type Filter */}
              <select
                value={typeFilter}
                onChange={(e: any) => setTypeFilter(e.target.value)}
                className="bg-slate-800/80 border border-slate-600/60 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/70"
              >
                <option value="ALL">All Integration Types</option>
                <option value="API">API Sync (Arivu)</option>
                <option value="MANUAL">Manual / Portal (Babu/Wig/Oncocur)</option>
                <option value="EXTERNAL_AMAZON">Buy on Amazon (Pure & Pure / Swasa)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/60 p-1 rounded-lg border border-slate-700/50">
              <button
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-md border transition text-xs ${
                  viewMode === 'GRID'
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/30'
                    : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-700'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-md border transition text-xs ${
                  viewMode === 'TABLE'
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/30'
                    : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-700'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* VENDORS DISPLAY (GRID OR TABLE) */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
              <p className="text-sm">Loading vendors from database...</p>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <Store className="h-10 w-10 mx-auto text-slate-600" />
              <p className="text-base font-semibold text-white">No Vendors Found</p>
              <p className="text-xs max-w-md mx-auto text-slate-400">Click "Seed Vendors & Templates" above to automatically create Arivu Foods (with accepted 30% agreement terms) and future vendor templates.</p>
              <button
                onClick={handleSeedDefaults}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
              >
                Seed Default Vendors Now
              </button>
            </div>
          ) : viewMode === 'GRID' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredVendors.map((vendor) => {
                const isArivu = vendor.slug === 'arivu-foods' || vendor.name?.toLowerCase().includes('arivu');
                const isAmazon = vendor.capabilities?.checkoutType === 'EXTERNAL_AMAZON';
                const isApi = vendor.capabilities?.productSyncMethod === 'API';
                const commRate = vendor.commissionConfig?.rate ?? 30;
                const orderCount = vendor.metrics?.orderCount || 0;
                const productCount = vendor.metrics?.productCount || 0;
                const pendingAmt = vendor.metrics?.pendingSettlementAmount || 0;
                const gmv = vendor.metrics?.totalOrderValue || 0;
                const isHealthy = vendor.metrics?.healthStatus !== 'UNHEALTHY';

                return (
                  <div
                    key={vendor._id}
                    className={`relative bg-gradient-to-br from-slate-900 to-slate-950 border rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl hover:shadow-2xl transition-all duration-200 group overflow-hidden ${
                      isArivu
                        ? 'border-emerald-700/40 hover:border-emerald-600/60'
                        : isApi
                        ? 'border-blue-700/30 hover:border-blue-600/50'
                        : 'border-slate-700/60 hover:border-slate-600/80'
                    }`}
                  >
                    {/* Card accent glow */}
                    <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${
                      isArivu ? 'from-transparent via-emerald-500/60 to-transparent' :
                      isApi ? 'from-transparent via-blue-500/50 to-transparent' :
                      'from-transparent via-slate-600/50 to-transparent'
                    }`} />

                    <div className="space-y-3">
                      {/* Top Bar: Logo, Name, Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-xl border overflow-hidden flex items-center justify-center shrink-0 ${
                            isArivu ? 'bg-emerald-900/40 border-emerald-700/40' :
                            isApi ? 'bg-blue-900/30 border-blue-700/30' :
                            'bg-slate-800 border-slate-700'
                          }`}>
                            {vendor.logo ? (
                              <img src={vendor.logo} alt={vendor.name} className="h-full w-full object-cover" />
                            ) : (
                              <Store className={`h-6 w-6 ${isArivu ? 'text-emerald-400' : isApi ? 'text-blue-400' : 'text-slate-400'}`} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                                {vendor.name}
                              </h3>
                              {isArivu && (
                                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-500/30">
                                  PHASE 1
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">{vendor.businessName || vendor.slug}</p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${
                            vendor.isActive
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25 shadow-emerald-900/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/25'
                          }`}
                        >
                          {vendor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Capabilities Pill */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {isApi ? (
                          <span className="bg-blue-500/15 text-blue-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-500/25 flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" /> API Sync
                          </span>
                        ) : isAmazon ? (
                          <span className="bg-amber-500/15 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-500/25 flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> Buy on Amazon
                          </span>
                        ) : (
                          <span className="bg-slate-700/60 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-600/60">
                            Manual Fulfillment
                          </span>
                        )}

                        <span className="bg-purple-500/15 text-purple-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-purple-500/25">
                          {commRate}% Commission
                        </span>

                        {vendor.apiConfig?.mockMode && (
                          <span className="bg-amber-900/40 text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-600/30">
                            Mock API
                          </span>
                        )}
                      </div>

                      {/* Metrics 3-Col Box */}
                      <div className={`grid grid-cols-3 gap-2 rounded-xl p-3 border text-center ${
                        isArivu
                          ? 'bg-emerald-950/30 border-emerald-800/30'
                          : 'bg-slate-800/50 border-slate-700/50'
                      }`}>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Products</p>
                          <p className="text-base font-black text-white mt-0.5">{productCount}</p>
                        </div>
                        <div className="border-x border-slate-700/50">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Orders</p>
                          <p className="text-base font-black text-white mt-0.5">{orderCount}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Pending Set.</p>
                          <p className="text-base font-black text-amber-300 mt-0.5">₹{pendingAmt > 0 ? pendingAmt.toLocaleString('en-IN') : '0'}</p>
                        </div>
                      </div>

                      {/* GMV row */}
                      {gmv > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-800/30 rounded-lg px-2.5 py-1.5 border border-slate-700/30">
                          <span>Total GMV</span>
                          <span className="text-white font-bold">₹{gmv.toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      {/* Sync Status info */}
                      {isApi && (
                        <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-700/50 pt-2">
                          <span className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full shadow-sm ${
                              isHealthy ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-rose-400 shadow-rose-400/50'
                            }`} />
                            Health: <span className={isHealthy ? 'text-emerald-400' : 'text-rose-400'}>{vendor.metrics?.healthStatus || 'HEALTHY'}</span>
                          </span>
                          <span>Last sync: {vendor.metrics?.lastSyncAt ? new Date(vendor.metrics.lastSyncAt).toLocaleDateString('en-IN') : 'Never'}</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2.5 border-t border-slate-700/50 flex items-center justify-between gap-2">
                      {isApi && (
                        <button
                          onClick={() => handleSyncCatalog(vendor._id)}
                          disabled={syncingCatalog}
                          className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700/60"
                        >
                          <RefreshCw className={`h-3 w-3 ${syncingCatalog ? 'animate-spin' : ''}`} />
                          <span>Sync</span>
                        </button>
                      )}

                      <button
                        onClick={() => openVendorDetail(vendor)}
                        className={`flex-1 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          isArivu
                            ? 'bg-emerald-600/25 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30'
                            : 'bg-slate-700/60 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600/60'
                        }`}
                      >
                        <span>Manage Vendor</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700/80 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Vendor</th>
                      <th className="px-4 py-3.5">Integration Method</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-center">Products</th>
                      <th className="px-4 py-3.5 text-center">Orders</th>
                      <th className="px-4 py-3.5">Total GMV</th>
                      <th className="px-4 py-3.5">Commission</th>
                      <th className="px-4 py-3.5">Pending Settlement</th>
                      <th className="px-4 py-3.5">Health</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredVendors.map((vendor) => (
                      <tr key={vendor._id} className="hover:bg-slate-800/40 transition group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center overflow-hidden shrink-0">
                              {vendor.logo ? <img src={vendor.logo} alt="" className="h-full w-full object-cover" /> : <Store className="h-4 w-4 text-slate-400" />}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm group-hover:text-emerald-300 transition">{vendor.name}</p>
                              <p className="text-[11px] text-slate-500">{vendor.slug}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${
                            vendor.capabilities?.checkoutType === 'EXTERNAL_AMAZON'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : vendor.capabilities?.productSyncMethod === 'API'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-slate-700/60 text-slate-300 border-slate-600/60'
                          }`}>
                            {vendor.capabilities?.checkoutType === 'EXTERNAL_AMAZON' ? 'Amazon External' : vendor.capabilities?.productSyncMethod === 'API' ? 'API Sync' : 'Manual Portal'}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${vendor.isActive ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' : 'bg-rose-500/15 text-rose-400 border-rose-500/25'}`}>
                            {vendor.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center font-bold text-white">
                          {vendor.metrics?.productCount || 0}
                        </td>

                        <td className="px-4 py-4 text-center font-bold text-white">
                          {vendor.metrics?.orderCount || 0}
                        </td>

                        <td className="px-4 py-4 font-bold text-white">
                          ₹{(vendor.metrics?.totalOrderValue || 0).toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-4 text-purple-300 font-semibold">
                          {vendor.commissionConfig?.rate ?? 30}%
                        </td>

                        <td className="px-4 py-4 text-amber-300 font-bold">
                          ₹{(vendor.metrics?.pendingSettlementAmount || 0).toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-4">
                          <span className="flex items-center gap-1.5 text-xs text-slate-300">
                            <span className={`h-2 w-2 rounded-full shadow-sm ${
                              vendor.metrics?.healthStatus !== 'UNHEALTHY'
                                ? 'bg-emerald-400 shadow-emerald-400/40'
                                : 'bg-rose-400 shadow-rose-400/40'
                            }`} />
                            {vendor.metrics?.healthStatus || 'HEALTHY'}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => openVendorDetail(vendor)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: VENDOR DETAILS VIEW (6 TABS) */}
      {selectedVendorId && selectedVendorData && (
        <div className="space-y-6">
          {/* TOP BACK BAR */}
          <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-700/60 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-500/30 to-transparent" />
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setSelectedVendorId(null); setSelectedVendorData(null); fetchVendors(); }}
                className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-600/60 transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                  {selectedVendorData.vendor?.logo ? (
                    <img src={selectedVendorData.vendor.logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{selectedVendorData.vendor?.name}</h2>
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                      {selectedVendorData.vendor?.slug}
                    </span>
                    {selectedVendorData.vendor?.apiConfig?.mockMode && (
                      <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded font-bold border border-amber-500/30">
                        Mock API Mode
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedVendorData.vendor?.businessName} • {selectedVendorData.vendor?.email}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {selectedVendorData.vendor?.capabilities?.productSyncMethod === 'API' && (
                <button
                  onClick={() => handleSyncCatalog(selectedVendorId)}
                  disabled={syncingCatalog}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                >
                  <RefreshCw className={`h-4 w-4 ${syncingCatalog ? 'animate-spin' : ''}`} />
                  <span>Sync Catalog Now</span>
                </button>
              )}
            </div>
          </div>

          {/* 6 TABS NAVIGATION */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-700/60 pb-2">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'products', label: `Products (${selectedVendorData.products?.length || 0})`, icon: Package },
              { id: 'orders', label: `Orders (${selectedVendorData.orders?.length || 0})`, icon: FileText },
              { id: 'settlements', label: `Commission & Settlements`, icon: IndianRupee },
              { id: 'logs', label: `API Integration & Sync Logs`, icon: Activity },
              { id: 'config', label: `Vendor Configuration`, icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500/60 shadow-lg shadow-emerald-900/40'
                      : 'bg-slate-900/80 text-slate-400 border-slate-700/60 hover:text-white hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* AGREEMENT HIGHLIGHT BANNER */}
              <div className="relative bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-700/40 rounded-2xl p-6 shadow-xl space-y-4 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
                <div className="absolute top-4 right-6 opacity-10">
                  <ShieldCheck className="h-20 w-20 text-emerald-400" />
                </div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-7 w-7 text-emerald-400" />
                    <div>
                      <h3 className="text-base font-bold text-white">Commercial Partnership Terms (Accepted Agreement 02.09.2026)</h3>
                      <p className="text-xs text-slate-400">Formal agreement governing product listing, order processing, commission retention & settlement terms.</p>
                    </div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 shrink-0">
                    Active Contract
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-700/50">
                  <div className="bg-slate-800/40 rounded-xl p-3 border border-emerald-800/20">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Platform Commission</p>
                    <p className="text-lg font-black text-white mt-0.5">{selectedVendorData.vendor?.commissionConfig?.rate ?? 30}% Listed Price</p>
                    <p className="text-[10px] text-slate-500">Excludes shipping & gateway fee</p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 border border-purple-800/20">
                    <p className="text-[10px] uppercase font-bold text-slate-400">GST on Commission</p>
                    <p className="text-lg font-black text-white mt-0.5">{selectedVendorData.vendor?.commissionConfig?.gstOnCommissionRate ?? 18}% of Commission</p>
                    <p className="text-[10px] text-slate-500">Total platform retention: {((selectedVendorData.vendor?.commissionConfig?.rate ?? 30) * (1 + (selectedVendorData.vendor?.commissionConfig?.gstOnCommissionRate ?? 18) / 100)).toFixed(1)}%</p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 border border-teal-800/20">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Shipping Pass-Through</p>
                    <p className="text-lg font-black text-emerald-400 mt-0.5">100% to Vendor</p>
                    <p className="text-[10px] text-slate-500">Free ≥ ₹499 / state-based fee</p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 border border-blue-800/20">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Payment Gateway Fee</p>
                    <p className="text-lg font-black text-blue-400 mt-0.5">Borne by Customer</p>
                    <p className="text-[10px] text-slate-500">2% + 18% GST (2.36%)</p>
                  </div>
                </div>
              </div>

              {/* STATS TILES */}
              {(() => {
                const totalOrders = selectedVendorData.orders?.length || 0;
                const deliveredOrders = selectedVendorData.orders?.filter((o: any) => o.deliveryStatus === 'delivered').length || 0;
                const grossSales = selectedVendorData.orders?.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0) || 0;
                const commEarned = selectedVendorData.orders?.reduce((sum: number, o: any) => sum + (o.platformCommission || (o.totalAmount * (selectedVendorData.vendor?.commissionConfig?.rate ?? 30) / 100) || 0), 0) || 0;
                const pendingOrders = selectedVendorData.orders?.filter((o: any) => o.deliveryStatus === 'pending' || o.deliveryStatus === 'processing').length || 0;
                const shippedOrders = selectedVendorData.orders?.filter((o: any) => o.deliveryStatus === 'shipped').length || 0;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 rounded-xl p-4 col-span-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
                      <p className="text-2xl font-black text-white mt-1">{totalOrders}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/30 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider">Delivered</p>
                      <p className="text-2xl font-black text-emerald-300 mt-1">{deliveredOrders}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-800/30 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-blue-400/80 uppercase tracking-wider">Shipped</p>
                      <p className="text-2xl font-black text-blue-300 mt-1">{shippedOrders}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-800/30 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider">Pending</p>
                      <p className="text-2xl font-black text-amber-300 mt-1">{pendingOrders}</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/30 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-wider">Gross Sales</p>
                      <p className="text-2xl font-black text-white mt-1">₹{grossSales.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-800/30 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-purple-400/80 uppercase tracking-wider">Commission ({selectedVendorData.vendor?.commissionConfig?.rate ?? 30}%)</p>
                      <p className="text-2xl font-black text-purple-300 mt-1">₹{commEarned.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                );
              })()}

              {/* INTEGRATION HEALTH & DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-blue-800/30 rounded-2xl p-5 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-400" />
                    <span>API & Fulfillment Architecture</span>
                  </h4>
                  <div className="space-y-0 text-xs divide-y divide-slate-700/40">
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Product Sync Method:</span>
                      <span className="text-white font-semibold">{selectedVendorData.vendor?.capabilities?.productSyncMethod || 'API'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Checkout Flow:</span>
                      <span className="text-white font-semibold">{selectedVendorData.vendor?.capabilities?.checkoutType || 'INTERNAL'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Delivery & Logistics:</span>
                      <span className="text-emerald-400 font-semibold">Vendor Managed</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Tracking Method:</span>
                      <span className="text-white font-semibold">{selectedVendorData.vendor?.capabilities?.trackingMethod || 'API_POLLING'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">API Endpoint Base:</span>
                      <span className="text-blue-400 font-mono text-[11px]">{selectedVendorData.vendor?.apiConfig?.baseUrl || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-800/30 rounded-2xl p-5 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building className="h-4 w-4 text-amber-400" />
                    <span>Vendor Profile & Compliance</span>
                  </h4>
                  <div className="space-y-0 text-xs divide-y divide-slate-700/40">
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">FSSAI License:</span>
                      <span className="text-white font-mono">{selectedVendorData.vendor?.licenseNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">GST Registration:</span>
                      <span className="text-white font-mono">{selectedVendorData.vendor?.taxId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Official Website:</span>
                      <a href={selectedVendorData.vendor?.website || '#'} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1">
                        {selectedVendorData.vendor?.website || 'N/A'} {selectedVendorData.vendor?.website && <ExternalLink className="h-3 w-3" />}
                      </a>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Registered Address:</span>
                      <span className="text-white text-right max-w-xs">{selectedVendorData.vendor?.businessAddress || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Vendor Product Catalog ({selectedVendorData.products?.length || 0})</h3>
                  <p className="text-xs text-slate-400">Products mapped or synchronized from Arivu Foods API / manual catalog</p>
                </div>
                <button
                  onClick={() => handleSyncCatalog(selectedVendorId)}
                  disabled={syncingCatalog}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
                >
                  <RefreshCw className={`h-4 w-4 ${syncingCatalog ? 'animate-spin' : ''}`} />
                  <span>Sync Catalog Now</span>
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="px-5 py-3.5">Product</th>
                      <th className="px-4 py-3.5">Vendor SKU</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5">Price / MRP</th>
                      <th className="px-4 py-3.5 text-center">Stock</th>
                      <th className="px-4 py-3.5">FSSAI / Nutrition</th>
                      <th className="px-4 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {selectedVendorData.products?.map((prod: any) => (
                      <tr key={prod._id} className="hover:bg-slate-800/50 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                              {prod.image ? <img src={prod.image} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-slate-500" />}
                            </div>
                            <div>
                              <p className="font-bold text-white text-xs">{prod.name}</p>
                              <p className="text-[10px] text-slate-500">{prod.productWeight || 'Standard size'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                          {prod.vendorSku || prod.sku || 'N/A'}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] border border-slate-700 font-medium">
                            {prod.category}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-bold text-white">
                          ₹{prod.price}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${prod.stock > 10 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {prod.stock} units
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                          {prod.fssaiNumber ? <span className="font-mono text-emerald-400">FSSAI: {prod.fssaiNumber}</span> : 'Standard'}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${prod.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                            {prod.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Vendor Order Management ({selectedVendorData.orders?.length || 0})</h3>
                  <p className="text-xs text-slate-400">Orders submitted to vendor for fulfillment, tracking & status updates</p>
                </div>
              </div>

              {selectedVendorData.orders?.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
                  <FileText className="h-8 w-8 mx-auto text-slate-600" />
                  <p className="font-bold text-white">No Orders Placed Yet</p>
                  <p className="text-xs">Orders placed by customers for this vendor's items will appear here automatically.</p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                      <tr>
                        <th className="px-5 py-3.5">Mito Order</th>
                        <th className="px-4 py-3.5">Vendor Order Ref</th>
                        <th className="px-4 py-3.5">Date & Customer</th>
                        <th className="px-4 py-3.5">Items</th>
                        <th className="px-4 py-3.5">Order Total</th>
                        <th className="px-4 py-3.5">Delivery Status</th>
                        <th className="px-4 py-3.5">API Submission</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {selectedVendorData.orders?.map((order: any) => (
                        <tr key={order._id} className="hover:bg-slate-800/50 transition">
                          <td className="px-5 py-3.5 font-mono font-bold text-white">
                            #{order._id.slice(-6).toUpperCase()}
                          </td>

                          <td className="px-4 py-3.5 font-mono text-[11px] text-blue-400">
                            {order.vendorOrderId || <span className="text-slate-500 italic">Not generated</span>}
                          </td>

                          <td className="px-4 py-3.5">
                            <p className="text-white font-semibold">{order.patientName || 'Customer'}</p>
                            <p className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="text-slate-300 font-medium">{order.products?.length || 0} items</span>
                          </td>

                          <td className="px-4 py-3.5 font-bold text-white">
                            ₹{order.totalAmount}
                          </td>

                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                              order.deliveryStatus === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              order.deliveryStatus === 'shipped' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              order.deliveryStatus === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {order.deliveryStatus || 'pending'}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              order.vendorSubmissionStatus === 'SUBMITTED' ? 'bg-emerald-500/10 text-emerald-400' :
                              order.vendorSubmissionStatus === 'FAILED' ? 'bg-rose-500/10 text-rose-400' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {order.vendorSubmissionStatus || 'NOT_SUBMITTED'}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right space-x-2">
                            <button
                              onClick={() => setSelectedOrderForDetails(order)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition"
                            >
                              Financials
                            </button>

                            {order.vendorSubmissionStatus !== 'SUBMITTED' ? (
                              <button
                                onClick={() => handleSubmitOrderToVendor(order._id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                                title="Submit to Arivu Foods API"
                              >
                                Submit Order
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePollOrderStatus(order._id)}
                                className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-lg text-xs font-semibold transition"
                                title="Poll latest tracking from vendor"
                              >
                                Poll Status
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMMISSION & SETTLEMENTS */}
          {activeTab === 'settlements' && (
            <div className="space-y-6">
              {/* SETTLEMENT DISCREPANCY ADVISORY BANNER */}
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-5 text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                  <span>Agreement Notice: Settlement Cycle Clause Discrepancy</span>
                </div>
                <p>
                  In the accepted partnership agreement: <strong>Clause 13</strong> specifies a <strong>15-day settlement cycle</strong>, whereas <strong>Schedule A</strong> specifies a <strong>30-day settlement cycle</strong>.
                  Mito_Reboot maintains this as an explicit configurable setting rather than hardcoding. Choose your preferred cycle duration below.
                </p>
                <div className="flex items-center gap-4 pt-1">
                  <span className="font-semibold text-white">Active Settlement Cycle:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSettlementCycleDays(15)}
                      className={`px-3 py-1 rounded-lg font-bold border transition ${settlementCycleDays === 15 ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                    >
                      15 Days (Clause 13)
                    </button>
                    <button
                      onClick={() => setSettlementCycleDays(30)}
                      className={`px-3 py-1 rounded-lg font-bold border transition ${settlementCycleDays === 30 ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                    >
                      30 Days (Schedule A - Recommended)
                    </button>
                  </div>
                </div>
              </div>

              {/* GENERATE SETTLEMENT TOOLBAR */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <IndianRupee className="h-5 w-5 text-emerald-400" />
                      <span>Generate Settlement Cycle Run</span>
                    </h3>
                    <p className="text-xs text-slate-400">Calculates eligible delivered orders, applies 30% commission, 18% GST retention, and 100% shipping transfer</p>
                  </div>

                  <button
                    onClick={handleGenerateSettlement}
                    disabled={generatingSettlement}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{generatingSettlement ? 'Calculating...' : 'Generate Settlement'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={settlementStartDate}
                      onChange={(e) => setSettlementStartDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">End Date</label>
                    <input
                      type="date"
                      value={settlementEndDate}
                      onChange={(e) => setSettlementEndDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cycle Duration</label>
                    <input
                      type="text"
                      disabled
                      value={`${settlementCycleDays} Days Cycle`}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* SETTLEMENT RUNS LIST */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">Settlement History & Drafts</h4>
                {selectedVendorData.settlements?.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
                    <IndianRupee className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-white">No Settlements Generated Yet</p>
                    <p className="text-xs">Select dates above and click "Generate Settlement" to compute your first cycle run.</p>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                        <tr>
                          <th className="px-5 py-3.5">Settlement Code</th>
                          <th className="px-4 py-3.5">Period</th>
                          <th className="px-4 py-3.5 text-center">Orders</th>
                          <th className="px-4 py-3.5">Gross Sales</th>
                          <th className="px-4 py-3.5">Platform Retention (35.4%)</th>
                          <th className="px-4 py-3.5">Shipping Pass-Through</th>
                          <th className="px-4 py-3.5">Final Payable</th>
                          <th className="px-4 py-3.5">Status</th>
                          <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {selectedVendorData.settlements?.map((set: any) => (
                          <tr key={set._id} className="hover:bg-slate-800/50 transition">
                            <td className="px-5 py-3.5 font-mono font-bold text-white">
                              {set.settlementCode}
                            </td>

                            <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                              {new Date(set.startDate).toLocaleDateString()} – {new Date(set.endDate).toLocaleDateString()}
                            </td>

                            <td className="px-4 py-3.5 text-center font-bold text-white">
                              {set.totalOrdersCount}
                            </td>

                            <td className="px-4 py-3.5 font-semibold text-white">
                              ₹{set.grossSales.toLocaleString()}
                            </td>

                            <td className="px-4 py-3.5 font-semibold text-purple-400">
                              ₹{set.totalPlatformRetention.toLocaleString()}
                              <span className="block text-[10px] text-slate-500">(₹{set.totalPlatformCommission} + ₹{set.gstOnCommission} GST)</span>
                            </td>

                            <td className="px-4 py-3.5 font-semibold text-emerald-400">
                              ₹{set.shippingPassThrough.toLocaleString()}
                            </td>

                            <td className="px-4 py-3.5 font-black text-amber-400 text-sm">
                              ₹{set.finalSettlementAmount.toLocaleString()}
                            </td>

                            <td className="px-4 py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                set.status === 'FINALIZED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                set.status === 'PAID' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {set.status}
                              </span>
                            </td>

                            <td className="px-5 py-3.5 text-right space-x-2">
                              <button
                                onClick={() => setSelectedSettlementBreakdown(set)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition"
                              >
                                Breakdown
                              </button>

                              <a
                                href={`${apiUrl}/admin/vendors/settlements/${set._id}/export-csv`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition"
                              >
                                <Download className="h-3 w-3" /> CSV
                              </a>

                              {set.status === 'DRAFT' && (
                                <button
                                  onClick={() => handleFinalizeSettlement(set._id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                                  title="Lock settlement and prevent duplicate calculation"
                                >
                                  Finalize & Lock
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: API INTEGRATION & SYNC LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-400" />
                    <span>Vendor API Audit Logs ({selectedVendorData.syncLogs?.length || 0})</span>
                  </h3>
                  <p className="text-xs text-slate-400">Complete record of catalog synchronization, order submissions, and status polls</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSyncCatalog(selectedVendorId)}
                    disabled={syncingCatalog}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${syncingCatalog ? 'animate-spin' : ''}`} />
                    <span>Run Sync Test</span>
                  </button>
                </div>
              </div>

              {selectedVendorData.syncLogs?.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
                  <Activity className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                  <p className="font-semibold text-white">No Sync Logs Recorded</p>
                  <p className="text-xs">Click "Run Sync Test" to trigger catalog sync and record the first entry.</p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                      <tr>
                        <th className="px-5 py-3.5">Action</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5">Driver Mode</th>
                        <th className="px-4 py-3.5">Duration</th>
                        <th className="px-4 py-3.5">Items Processed</th>
                        <th className="px-4 py-3.5">Timestamp</th>
                        <th className="px-5 py-3.5">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {selectedVendorData.syncLogs?.map((log: any) => (
                        <tr key={log._id} className="hover:bg-slate-800/50 transition">
                          <td className="px-5 py-3.5 font-bold text-white font-mono">
                            {log.action}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              log.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {log.status}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-[11px] text-slate-400">
                            {log.isMock ? <span className="text-amber-400">Mock Driver</span> : <span className="text-emerald-400">Live API</span>}
                          </td>

                          <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                            {log.durationMs} ms
                          </td>

                          <td className="px-4 py-3.5 text-slate-300">
                            {log.itemsProcessed || 0}
                          </td>

                          <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>

                          <td className="px-5 py-3.5 text-slate-400 text-[11px] max-w-xs truncate">
                            {log.errorMessage || JSON.stringify(log.responsePayload || {})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: VENDOR CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Vendor Configuration & Capabilities</h3>
                  <p className="text-xs text-slate-400">Configure architectural capabilities, commission terms, and API credentials</p>
                </div>
                <button
                  onClick={handleSaveVendorConfig}
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition"
                >
                  <Check className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SECTION: GENERAL INFO */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">General Information</h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Vendor Name</label>
                    <input
                      type="text"
                      value={editConfigForm.name || ''}
                      onChange={(e) => setEditConfigForm({ ...editConfigForm, name: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">System Slug (Unique)</label>
                    <input
                      type="text"
                      value={editConfigForm.slug || ''}
                      onChange={(e) => setEditConfigForm({ ...editConfigForm, slug: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editConfigForm.email || ''}
                      onChange={(e) => setEditConfigForm({ ...editConfigForm, email: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Website URL</label>
                    <input
                      type="text"
                      value={editConfigForm.website || ''}
                      onChange={(e) => setEditConfigForm({ ...editConfigForm, website: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* SECTION: ARCHITECTURAL CAPABILITIES */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Multi-Vendor Capabilities</h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Checkout & Fulfillment Flow</label>
                    <select
                      value={editConfigForm.checkoutType || 'INTERNAL'}
                      onChange={(e) => setEditConfigForm({ ...editConfigForm, checkoutType: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="INTERNAL">Internal Checkout (Mito Cart & Payment)</option>
                      <option value="EXTERNAL_AMAZON">External Redirect ("Buy on Amazon")</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Product Catalog Sync Method</label>
                    <select
                      value={editConfigForm.productSyncMethod || 'API'}
                      onChange={(e) => setEditConfigForm({ ...editConfigForm, productSyncMethod: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="API">Automated API Synchronization (Arivu Foods)</option>
                      <option value="MANUAL">Manual Listing via Admin Dashboard</option>
                    </select>
                  </div>

                  {editConfigForm.checkoutType === 'EXTERNAL_AMAZON' && (
                    <div>
                      <label className="block text-xs font-semibold text-amber-400 mb-1">Amazon Product / Storefront URL</label>
                      <input
                        type="text"
                        value={editConfigForm.externalStoreUrl || ''}
                        onChange={(e) => setEditConfigForm({ ...editConfigForm, externalStoreUrl: e.target.value })}
                        placeholder="https://www.amazon.in/dp/..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Commission Rate (%)</label>
                      <input
                        type="number"
                        value={editConfigForm.commissionRate}
                        onChange={(e) => setEditConfigForm({ ...editConfigForm, commissionRate: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Settlement Cycle (Days)</label>
                      <select
                        value={editConfigForm.settlementCycleDays}
                        onChange={(e) => setEditConfigForm({ ...editConfigForm, settlementCycleDays: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value={15}>15 Days (Clause 13)</option>
                        <option value={30}>30 Days (Schedule A)</option>
                        <option value={7}>7 Days</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION: API CONFIGURATION */}
                <div className="space-y-4 md:col-span-2 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Vendor API Integration & Credentials</h4>
                  
                  <div className="flex items-center gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      id="mockModeToggle"
                      checked={editConfigForm.mockMode ?? true}
                      onChange={(e) => setEditConfigForm({ ...editConfigForm, mockMode: e.target.checked })}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                    />
                    <label htmlFor="mockModeToggle" className="text-xs text-slate-200">
                      <span className="font-bold text-white block">Enable Mock API Driver</span>
                      Use pre-configured authentic Arivu Foods catalog & simulated order responses while Arivu finalizes live API docs.
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Production API Base URL</label>
                      <input
                        type="text"
                        value={editConfigForm.baseUrl || ''}
                        onChange={(e) => setEditConfigForm({ ...editConfigForm, baseUrl: e.target.value })}
                        placeholder="https://api.arivufoods.com/v1"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">API Key / Authorization Token</label>
                      <input
                        type="password"
                        value={editConfigForm.apiKey || ''}
                        onChange={(e) => setEditConfigForm({ ...editConfigForm, apiKey: e.target.value })}
                        placeholder="••••••••••••••••••••••••"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: SETTLEMENT BREAKDOWN MODAL */}
      {selectedSettlementBreakdown && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-emerald-400" />
                  <span>Settlement Breakdown: {selectedSettlementBreakdown.settlementCode}</span>
                </h3>
                <p className="text-xs text-slate-400">Order-level commercial formula calculation per agreement</p>
              </div>
              <button onClick={() => setSelectedSettlementBreakdown(null)} className="text-slate-400 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-4 gap-3 bg-slate-800/60 p-3.5 rounded-xl text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Gross Product Sales</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">₹{selectedSettlementBreakdown.grossSales}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Platform Comm (30%)</span>
                  <span className="text-sm font-bold text-purple-400 mt-0.5 block">₹{selectedSettlementBreakdown.totalPlatformCommission}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">GST on Comm (18%)</span>
                  <span className="text-sm font-bold text-purple-400 mt-0.5 block">₹{selectedSettlementBreakdown.gstOnCommission}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Final Vendor Payable</span>
                  <span className="text-sm font-black text-emerald-400 mt-0.5 block">₹{selectedSettlementBreakdown.finalSettlementAmount}</span>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                <thead className="bg-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Order Ref</th>
                    <th className="px-3 py-2.5">Customer</th>
                    <th className="px-3 py-2.5">Listed Price</th>
                    <th className="px-3 py-2.5">30% Comm</th>
                    <th className="px-3 py-2.5">18% GST</th>
                    <th className="px-3 py-2.5">Vendor Share</th>
                    <th className="px-3 py-2.5">Shipping</th>
                    <th className="px-4 py-2.5 text-right">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {selectedSettlementBreakdown.lineItems?.map((li: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-mono font-bold text-white">#{li.orderNumber}</td>
                      <td className="px-3 py-2.5">{li.customerName}</td>
                      <td className="px-3 py-2.5">₹{li.listedProductPrice}</td>
                      <td className="px-3 py-2.5 text-purple-400">₹{li.platformCommission}</td>
                      <td className="px-3 py-2.5 text-purple-400">₹{li.gstOnCommission}</td>
                      <td className="px-3 py-2.5">₹{li.vendorProductShare}</td>
                      <td className="px-3 py-2.5 text-emerald-400">₹{li.shippingCollected}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-400">₹{li.netVendorPayable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
              <button
                onClick={() => setSelectedSettlementBreakdown(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ORDER FINANCIAL BREAKDOWN MODAL */}
      {selectedOrderForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Order Financial Breakdown</h3>
                <p className="text-xs text-slate-400">Mito Order #{selectedOrderForDetails._id.slice(-6).toUpperCase()}</p>
              </div>
              <button onClick={() => setSelectedOrderForDetails(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">External Vendor Order Ref:</span>
                <span className="text-blue-400 font-mono font-bold">{selectedOrderForDetails.vendorOrderId || 'Pending Submission'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Customer Total Paid:</span>
                <span className="text-white font-bold">₹{selectedOrderForDetails.totalAmount}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Platform Commission (30%):</span>
                <span className="text-purple-400 font-semibold">₹{selectedOrderForDetails.financialBreakdown?.platformCommission ?? selectedOrderForDetails.platformCommission}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">GST on Commission (18%):</span>
                <span className="text-purple-400 font-semibold">₹{selectedOrderForDetails.financialBreakdown?.gstOnCommission ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Shipping Pass-Through:</span>
                <span className="text-emerald-400 font-semibold">₹{selectedOrderForDetails.shippingCharge || 0}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Payment Gateway Fee (Customer Borne):</span>
                <span className="text-blue-400 font-semibold">₹{selectedOrderForDetails.financialBreakdown?.customerGatewayCharge ?? 0}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-bold bg-slate-800/60 p-2.5 rounded-xl">
                <span className="text-white">Final Vendor Payable:</span>
                <span className="text-emerald-400 font-black">₹{selectedOrderForDetails.financialBreakdown?.finalVendorPayable ?? selectedOrderForDetails.vendorEarnings}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderForDetails(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW VENDOR */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateNewVendor} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Store className="h-5 w-5 text-emerald-400" />
                <span>Onboard New Partner Vendor</span>
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={newVendorForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setNewVendorForm({ ...newVendorForm, name, slug });
                    }}
                    placeholder="e.g. Arivu Foods"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">System Slug</label>
                  <input
                    type="text"
                    required
                    value={newVendorForm.slug}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, slug: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Login Email *</label>
                  <input
                    type="email"
                    required
                    value={newVendorForm.email}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={newVendorForm.password}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, password: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Checkout Type</label>
                  <select
                    value={newVendorForm.checkoutType}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, checkoutType: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="INTERNAL">Internal Checkout</option>
                    <option value="EXTERNAL_AMAZON">Buy on Amazon (External)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Catalog Sync</label>
                  <select
                    value={newVendorForm.productSyncMethod}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, productSyncMethod: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="API">API Sync</option>
                    <option value="MANUAL">Manual Listing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    value={newVendorForm.commissionRate}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, commissionRate: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Settlement Cycle (Days)</label>
                  <select
                    value={newVendorForm.settlementCycleDays}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, settlementCycleDays: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value={30}>30 Days (Standard)</option>
                    <option value={15}>15 Days</option>
                    <option value={7}>7 Days</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
              >
                {saving ? 'Creating...' : 'Register Vendor'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
