import React, { useState, useEffect } from 'react';
import { User, Edit } from 'lucide-react';

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

  // Performance data state
  const [selectedVendorPerf, setSelectedVendorPerf] = useState<any | null>(null);
  const [selectedVendorForPerf, setSelectedVendorForPerf] = useState<string | null>(null);

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

  const fetchPerformance = async (vId: string) => {
    setSelectedVendorForPerf(vId);
    setSelectedVendorPerf(null);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/${vId}/performance`, {
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
        alert(err.message || 'Error saving vendor');
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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-500" /> Vendor Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Register partners, configure store mappings, and monitor performance</p>
        </div>
        <button 
          onClick={openNew}
          className="bg-indigo-650 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          + Register Vendor Partner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* List of registered vendors */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Partner Vendors ({vendors.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vendors.map(v => (
                <div key={v._id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{v.businessName || v.name}</h4>
                        <span className="text-[10px] text-slate-450 block font-semibold">{v.email}</span>
                      </div>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase border tracking-wider ${
                        v.isActive ? 'bg-emerald-555/10 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {v.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-500">
                      {v.phone && <div>📞 {v.phone}</div>}
                      {v.taxId && <div>Tax ID: {v.taxId}</div>}
                      {v.assignedProducts && (
                        <div className="text-[10px] text-indigo-600 font-bold">
                          Assigned: {v.assignedProducts.length} product(s)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex gap-2">
                    <button 
                      onClick={() => fetchPerformance(v._id)}
                      className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all"
                    >
                      Performance
                    </button>
                    <button 
                      onClick={() => openEdit(v)}
                      className="py-1.5 px-3 bg-slate-50 hover:bg-indigo-50 text-indigo-650 border border-slate-200 rounded-xl text-xs font-bold transition-all"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => handleToggleActive(v)}
                      className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        v.isActive 
                          ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-100' 
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-100'
                      }`}
                    >
                      {v.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}

              {vendors.length === 0 && (
                <p className="text-xs text-slate-400 italic col-span-2">No vendor partners registered.</p>
              )}
            </div>
          </div>

          {/* Performance display panel */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Performance Stats</h3>
            {selectedVendorForPerf ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-xs text-slate-700">Fulfillment Analysis</h4>
                  <span className="text-[10px] text-slate-400 font-medium">Real-time metrics calculated from order timeline logs</span>
                </div>

                {selectedVendorPerf ? (
                  <div className="space-y-3.5 text-xs text-slate-655">
                    <div className="flex justify-between">
                      <span>Total Assigned Orders</span>
                      <span className="font-bold text-slate-800">{selectedVendorPerf.totalAssigned}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivered Success</span>
                      <span className="font-bold text-slate-800">{selectedVendorPerf.totalDelivered}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cancelled Orders</span>
                      <span className="font-bold text-red-500">{selectedVendorPerf.totalCancelled}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivered Revenue</span>
                      <span className="font-bold text-indigo-700">Rs.{selectedVendorPerf.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Lead Speed</span>
                      <span className="font-bold text-slate-800">{selectedVendorPerf.avgFulfillmentTimeHours} hours</span>
                    </div>
                  </div>
                ) : (
                  <div className="animate-pulse flex space-y-2 flex-col">
                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-center text-slate-400 text-xs py-8">
                Click "Performance" on any vendor card to inspect live fulfillment data.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Register / Edit Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">
                {isEditing ? 'Edit Vendor Partner' : 'Register New Vendor Partner'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Basic credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Contact Person Name *</label>
                  <input 
                    required 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Email Address *</label>
                  <input 
                    required 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {!isEditing && (
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Vendor Password *</label>
                  <input 
                    required 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>
              )}

              {/* Business Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Business Name / Pharmacy Name</label>
                  <input 
                    type="text" 
                    value={businessName} 
                    onChange={e => setBusinessName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Phone Number</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Drug/Retail License Number</label>
                  <input 
                    type="text" 
                    value={licenseNumber} 
                    onChange={e => setLicenseNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Tax ID / GSTIN</label>
                  <input 
                    type="text" 
                    value={taxId} 
                    onChange={e => setTaxId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Business Address</label>
                <input 
                  type="text" 
                  value={businessAddress} 
                  onChange={e => setBusinessAddress(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                />
              </div>

              {/* Product Mapping */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-[9px] font-bold text-slate-400 uppercase block">Assign Products mapping (Optional)</label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-2xl p-3 space-y-1.5 scrollbar-thin">
                  {products.map(p => (
                    <label key={p._id} className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={assignedProducts.includes(p._id)}
                        onChange={() => handleProductSelect(p._id)}
                        className="rounded border-slate-350 text-indigo-650 h-4 w-4"
                      />
                      <span>{p.name} {p.brand && `(${p.brand})`}</span>
                    </label>
                  ))}
                  {products.length === 0 && (
                    <p className="text-[10px] text-slate-450 italic">No shop products found to assign.</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Vendor Details'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
