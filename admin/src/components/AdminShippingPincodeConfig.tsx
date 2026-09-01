import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Truck, Search, CheckCircle, XCircle } from 'lucide-react';

interface DistanceRange {
  minDistanceKm: number;
  maxDistanceKm: number;
  shippingCharge: number;
  estimatedDeliveryTime: string;
  isDefaultRange?: boolean;
}

interface PincodeRule {
  _id: string;
  pincode: string;
  localityName: string;
  city: string;
  state: string;
  isServiceable: boolean;
  pincodeCenterLat?: number;
  pincodeCenterLon?: number;
  baseShippingFee?: number;
  distanceRanges: DistanceRange[];
  createdAt?: string;
}

interface AdminShippingPincodeConfigProps {
  apiUrl: string;
  token: string;
}

export const AdminShippingPincodeConfig: React.FC<AdminShippingPincodeConfigProps> = ({ apiUrl, token }) => {
  const [rules, setRules] = useState<PincodeRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<PincodeRule | null>(null);

  // Form states
  const [pincode, setPincode] = useState<string>('');
  const [localityName, setLocalityName] = useState<string>('');
  const [city, setCity] = useState<string>('Bangalore');
  const [state, setState] = useState<string>('Karnataka');
  const [isServiceable, setIsServiceable] = useState<boolean>(true);
  const [pincodeCenterLat, setPincodeCenterLat] = useState<string>('12.9716');
  const [pincodeCenterLon, setPincodeCenterLon] = useState<string>('77.5946');
  const [baseShippingFee, setBaseShippingFee] = useState<string>('');
  const [useCustomTiers, setUseCustomTiers] = useState<boolean>(false);
  const [distanceRanges, setDistanceRanges] = useState<DistanceRange[]>([
    { minDistanceKm: 0, maxDistanceKm: 5, shippingCharge: 40, estimatedDeliveryTime: 'Same Day Delivery (2-4 hrs)' },
    { minDistanceKm: 5, maxDistanceKm: 15, shippingCharge: 75, estimatedDeliveryTime: '24 Hours Delivery' }
  ]);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchPincodeRules();
  }, [apiUrl, token]);

  const fetchPincodeRules = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/shop-pincodes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRules(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching pincode rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingRule(null);
    setPincode('');
    setLocalityName('');
    setCity('Bangalore');
    setState('Karnataka');
    setIsServiceable(true);
    setPincodeCenterLat('12.9716');
    setPincodeCenterLon('77.5946');
    setBaseShippingFee('');
    setUseCustomTiers(false);
    setDistanceRanges([
      { minDistanceKm: 0, maxDistanceKm: 5, shippingCharge: 40, estimatedDeliveryTime: 'Same Day Delivery (2-4 hrs)' },
      { minDistanceKm: 5, maxDistanceKm: 15, shippingCharge: 75, estimatedDeliveryTime: '24 Hours Delivery' }
    ]);
    setShowModal(true);
  };

  const handleOpenEditModal = (rule: PincodeRule) => {
    setEditingRule(rule);
    setPincode(rule.pincode);
    setLocalityName(rule.localityName);
    setCity(rule.city || 'Bangalore');
    setState(rule.state || 'Karnataka');
    setIsServiceable(rule.isServiceable);
    setPincodeCenterLat(rule.pincodeCenterLat ? rule.pincodeCenterLat.toString() : '12.9716');
    setPincodeCenterLon(rule.pincodeCenterLon ? rule.pincodeCenterLon.toString() : '77.5946');
    setBaseShippingFee(rule.baseShippingFee !== undefined ? rule.baseShippingFee.toString() : '');
    const hasCustom = rule.distanceRanges && rule.distanceRanges.length > 0;
    setUseCustomTiers(hasCustom);
    setDistanceRanges(hasCustom ? rule.distanceRanges : [
      { minDistanceKm: 0, maxDistanceKm: 5, shippingCharge: 40, estimatedDeliveryTime: 'Same Day Delivery' }
    ]);
    setShowModal(true);
  };

  const handleAddRangeTier = () => {
    const lastRange = distanceRanges[distanceRanges.length - 1];
    const newMin = lastRange ? lastRange.maxDistanceKm : 0;
    const newMax = newMin + 10;
    const newFee = lastRange ? lastRange.shippingCharge + 30 : 50;

    setDistanceRanges([
      ...distanceRanges,
      { minDistanceKm: newMin, maxDistanceKm: newMax, shippingCharge: newFee, estimatedDeliveryTime: '2-4 Days' }
    ]);
  };

  const handleRemoveRangeTier = (index: number) => {
    setDistanceRanges(distanceRanges.filter((_, i) => i !== index));
  };

  const handleUpdateRangeField = (index: number, field: keyof DistanceRange, value: any) => {
    const updated = [...distanceRanges];
    updated[index] = { ...updated[index], [field]: value };
    setDistanceRanges(updated);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode.trim() || !localityName.trim()) {
      alert('Please enter Pincode and Locality Name.');
      return;
    }

    setSaving(true);
    const payload = {
      pincode: pincode.trim(),
      localityName: localityName.trim(),
      city: city.trim(),
      state: state.trim(),
      isServiceable,
      pincodeCenterLat: parseFloat(pincodeCenterLat) || 12.9716,
      pincodeCenterLon: parseFloat(pincodeCenterLon) || 77.5946,
      baseShippingFee: baseShippingFee ? parseFloat(baseShippingFee) : undefined,
      distanceRanges: useCustomTiers ? distanceRanges : []
    };

    try {
      const url = editingRule
        ? `${apiUrl}/admin/shop-pincodes/${editingRule._id}`
        : `${apiUrl}/admin/shop-pincodes`;
      const method = editingRule ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        fetchPincodeRules();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Error saving pincode rule.');
      }
    } catch (err) {
      console.error('Save pincode error:', err);
      alert('Server error saving pincode rule.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete pincode rule for ${code}?`)) return;

    try {
      const res = await fetch(`${apiUrl}/admin/shop-pincodes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPincodeRules();
      }
    } catch (err) {
      console.error('Delete pincode error:', err);
    }
  };

  const filteredRules = rules.filter(r =>
    r.pincode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.localityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.city || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800">Pincode & Distance Shipping Management</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure serviceable pincodes, custom locality centers, and distance-based delivery tiers.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Serviceable Pincode</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Filter by pincode, locality or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-2 rounded-xl">
          Total: {filteredRules.length} Pincodes
        </span>
      </div>

      {/* Rules Table */}
      {loading ? (
        <div className="text-center py-8 text-xs font-bold text-slate-400">Loading pincode shipping rules...</div>
      ) : filteredRules.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <MapPin className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-500">No serviceable pincode rules configured yet.</p>
          <p className="text-[11px] text-slate-400">Click "Add Serviceable Pincode" above to configure your first delivery zone.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-700">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black border-y border-slate-100">
              <tr>
                <th className="px-4 py-3">Pincode</th>
                <th className="px-4 py-3">Locality / City</th>
                <th className="px-4 py-3">Serviceable Status</th>
                <th className="px-4 py-3">Distance Range Tiers</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRules.map((rule) => (
                <tr key={rule._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-black text-slate-900 text-sm">
                    {rule.pincode}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">{rule.localityName}</p>
                    <p className="text-[10px] text-slate-400">{rule.city}, {rule.state}</p>
                  </td>
                  <td className="px-4 py-3">
                    {rule.isServiceable ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <CheckCircle className="h-3 w-3" /> Serviceable
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full">
                        <XCircle className="h-3 w-3" /> Non-Serviceable
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {rule.distanceRanges && rule.distanceRanges.length > 0 ? (
                        rule.distanceRanges.map((r, i) => (
                          <span key={i} className="text-[9px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                            {r.minDistanceKm}-{r.maxDistanceKm}km: ₹{r.shippingCharge} ({r.estimatedDeliveryTime})
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">Base Fee: ₹{rule.baseShippingFee || 0}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(rule)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all cursor-pointer"
                        title="Edit Pincode Rule"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule._id, rule.pincode)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer"
                        title="Delete Pincode Rule"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Dialog for Add/Edit Pincode Rule */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-black text-slate-900">
                {editingRule ? `Edit Pincode Rule (${editingRule.pincode})` : 'Add New Serviceable Pincode'}
              </h4>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Pincode (6 digits) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 560001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Locality / Area Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indiranagar, Bangalore"
                    value={localityName}
                    onChange={(e) => setLocalityName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Serviceable Status</label>
                  <select
                    value={isServiceable ? 'true' : 'false'}
                    onChange={(e) => setIsServiceable(e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="true">🟢 Active (Serviceable)</option>
                    <option value="false">🔴 Disabled (Non-Serviceable)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Center Latitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="12.9716"
                    value={pincodeCenterLat}
                    onChange={(e) => setPincodeCenterLat(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Center Longitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="77.5946"
                    value={pincodeCenterLon}
                    onChange={(e) => setPincodeCenterLon(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Distance Range Tiers */}
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                      Distance Tier Configuration Mode
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Choose whether this pincode inherits global distance tiers or uses custom overrides.
                    </p>
                  </div>
                  <select
                    value={useCustomTiers ? 'custom' : 'global'}
                    onChange={(e) => setUseCustomTiers(e.target.value === 'custom')}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white"
                  >
                    <option value="global">🌐 Inherit Global Distance Tiers</option>
                    <option value="custom">✏️ Custom Pincode Overrides</option>
                  </select>
                </div>

                {useCustomTiers && (
                  <div className="space-y-2 border-t border-dashed border-slate-200 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-500">Custom Distance Tiers</span>
                      <button
                        type="button"
                        onClick={handleAddRangeTier}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Custom Tier Range
                      </button>
                    </div>

                <div className="space-y-2">
                  {distanceRanges.map((range, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl grid grid-cols-12 gap-2 items-center text-xs font-semibold">
                      <div className="col-span-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Min - Max (Km)</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <input
                            type="number"
                            min="0"
                            value={range.minDistanceKm}
                            onChange={(e) => handleUpdateRangeField(index, 'minDistanceKm', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white"
                          />
                          <span>-</span>
                          <input
                            type="number"
                            min="0"
                            value={range.maxDistanceKm}
                            onChange={(e) => handleUpdateRangeField(index, 'maxDistanceKm', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white"
                          />
                        </div>
                      </div>

                      <div className="col-span-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Charge (₹)</span>
                        <input
                          type="number"
                          min="0"
                          value={range.shippingCharge}
                          onChange={(e) => handleUpdateRangeField(index, 'shippingCharge', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs mt-0.5 bg-white font-bold text-emerald-700"
                        />
                      </div>

                      <div className="col-span-5">
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Estimated Delivery Time</span>
                        <input
                          type="text"
                          placeholder="e.g. Same Day (2-4 hrs)"
                          value={range.estimatedDeliveryTime}
                          onChange={(e) => handleUpdateRangeField(index, 'estimatedDeliveryTime', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs mt-0.5 bg-white font-semibold"
                        />
                      </div>

                      <div className="col-span-1 text-right pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveRangeTier(index)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          title="Remove Tier"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingRule ? 'Update Rule' : 'Save Pincode Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
