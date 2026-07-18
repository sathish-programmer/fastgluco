import React, { useState, useEffect } from 'react';
import { Plus, Building2, TestTube2, X } from 'lucide-react';

interface AdminLabsProps {
  apiUrl: string;
  token: string;
}

export const AdminLabs: React.FC<AdminLabsProps> = ({ apiUrl, token }) => {
  const [labs, setLabs] = useState<any[]>([]);
  const [allTests, setAllTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Lab Form
  const [showNewLab, setShowNewLab] = useState(false);
  const [labForm, setLabForm] = useState({
    name: '',
    logo: '',
    address: '',
    commissionType: 'PERCENTAGE',
    commissionValue: 15,
    isHomeCollectionAvailable: true
  });

  // Manage Tests Modal State
  const [selectedLab, setSelectedLab] = useState<any>(null);
  const [showAddTestForm, setShowAddTestForm] = useState(false);
  const [testForm, setTestForm] = useState({
    cancerScreeningTestId: '',
    price: '',
    turnaroundTimeHours: '',
    preparationInstructions: ''
  });
  const [mappedTests, setMappedTests] = useState<any[]>([]);

  // Manage Staff Modal State
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [labStaffList, setLabStaffList] = useState<any[]>([]);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'LabAdmin',
    password: ''
  });

  useEffect(() => {
    fetchLabs();
    fetchAllTests();
  }, []);

  useEffect(() => {
    if (selectedLab) {
      fetchMappedTests(selectedLab._id);
    }
  }, [selectedLab]);

  const fetchMappedTests = async (labId: string) => {
    try {
      const res = await fetch(`${apiUrl}/labs/admin/labs/${labId}/tests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMappedTests(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLabs = async () => {
    try {
      const res = await fetch(`${apiUrl}/labs/admin/labs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLabs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTests = async () => {
    try {
      const res = await fetch(`${apiUrl}/labs/tests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAllTests(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const createLab = async () => {
    try {
      await fetch(`${apiUrl}/labs/admin/labs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(labForm)
      });
      setShowNewLab(false);
      setLabForm({ name: '', logo: '', address: '', commissionType: 'PERCENTAGE', commissionValue: 15, isHomeCollectionAvailable: true });
      fetchLabs();
    } catch (e) {
      console.error('Failed to create lab', e);
    }
  };

  const openManageTests = async (lab: any) => {
    setSelectedLab(lab);
    setShowAddTestForm(false);
    try {
      // Since we don't have a specific API just for getting tests of a specific lab in the admin routes yet,
      // We will hit a new endpoint or filter. Actually, I will add an endpoint in backend or filter from frontend.
      // Wait, there is no endpoint yet for getting all tests for a specific lab. 
      // I will fetch /api/labs/tests/:testId/labs, but that's the reverse.
      // Let's assume we can fetch them or we'll update the backend.
      // For MVP, let's just make the UI and we will update backend next.
    } catch (e) {}
  };

  const assignTestToLab = async () => {
    try {
      await fetch(`${apiUrl}/labs/admin/lab-tests`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          laboratoryId: selectedLab._id,
          cancerScreeningTestId: testForm.cancerScreeningTestId,
          price: Number(testForm.price),
          turnaroundTimeHours: Number(testForm.turnaroundTimeHours),
          preparationInstructions: testForm.preparationInstructions
        })
      });
      setShowAddTestForm(false);
      setTestForm({ cancerScreeningTestId: '', price: '', turnaroundTimeHours: '', preparationInstructions: '' });
      fetchMappedTests(selectedLab._id);
      alert('Test mapped successfully!');
    } catch (e) {
      console.error('Failed to map test', e);
    }
  };

  const openManageStaff = (lab: any) => {
    setSelectedLab(lab);
    setShowStaffModal(true);
    fetchLabStaff(lab._id);
  };

  const fetchLabStaff = async (labId: string) => {
    try {
      const res = await fetch(`${apiUrl}/labs/admin/labs/${labId}/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLabStaffList(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const createLabStaff = async () => {
    try {
      const res = await fetch(`${apiUrl}/labs/admin/lab-staff`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...staffForm,
          laboratoryId: selectedLab._id
        })
      });
      if (res.ok) {
        alert('Lab Staff created successfully! They can now log in using the Admin login page.');
        setStaffForm({ name: '', email: '', phone: '', role: 'LabAdmin', password: '' });
        fetchLabStaff(selectedLab._id);
      } else {
        const error = await res.json();
        alert(`Failed to create staff: ${error.error || error.message}`);
      }
    } catch (e) {
      console.error('Failed to create staff', e);
      alert('An error occurred');
    }
  };


  if (loading) return <div className="p-10 text-center animate-pulse">Loading labs...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Partner Laboratories</h2>
          <p className="text-sm text-slate-500">Manage diagnostic centers, tests, and commissions</p>
        </div>
        <button 
          onClick={() => setShowNewLab(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Partner Lab
        </button>
      </div>

      {showNewLab && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <h3 className="font-bold text-slate-800 mb-4">Register New Laboratory</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input 
              type="text" placeholder="Lab Name (e.g. Apollo Diagnostics)" 
              value={labForm.name} onChange={e => setLabForm({...labForm, name: e.target.value})}
              className="border border-slate-200 rounded-xl p-3 text-sm focus:outline-indigo-500"
            />
            <input 
              type="text" placeholder="Logo Image URL" 
              value={labForm.logo} onChange={e => setLabForm({...labForm, logo: e.target.value})}
              className="border border-slate-200 rounded-xl p-3 text-sm focus:outline-indigo-500"
            />
            <input 
              type="text" placeholder="Full Address / Branch" 
              value={labForm.address} onChange={e => setLabForm({...labForm, address: e.target.value})}
              className="col-span-2 border border-slate-200 rounded-xl p-3 text-sm focus:outline-indigo-500"
            />
            <select 
              value={labForm.commissionType} onChange={e => setLabForm({...labForm, commissionType: e.target.value})}
              className="border border-slate-200 rounded-xl p-3 text-sm focus:outline-indigo-500"
            >
              <option value="PERCENTAGE">Percentage (%) Commission</option>
              <option value="FIXED">Fixed (₹) Commission</option>
            </select>
            <input 
              type="number" placeholder="Commission Value" 
              value={labForm.commissionValue} onChange={e => setLabForm({...labForm, commissionValue: Number(e.target.value)})}
              className="border border-slate-200 rounded-xl p-3 text-sm focus:outline-indigo-500"
            />
            <div className="col-span-2 flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                id="homeCollection"
                checked={labForm.isHomeCollectionAvailable}
                onChange={e => setLabForm({...labForm, isHomeCollectionAvailable: e.target.checked})}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="homeCollection" className="text-sm font-bold text-slate-700 cursor-pointer">
                Home Collection Available
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={createLab} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold">Save Lab</button>
            <button onClick={() => setShowNewLab(false)} className="bg-slate-100 text-slate-600 px-6 py-2 rounded-xl text-sm font-bold">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {labs.map(lab => (
          <div key={lab._id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200">
                {lab.logo ? <img src={lab.logo} alt={lab.name} className="h-full w-full object-cover" /> : <Building2 className="text-slate-400 h-8 w-8" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{lab.name}</h3>
                <p className="text-sm text-slate-500">{lab.address}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                    {lab.commissionType === 'PERCENTAGE' ? `${lab.commissionValue}% Comm.` : `₹${lab.commissionValue} Comm.`}
                  </span>
                  {lab.isHomeCollectionAvailable && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">Home Collection</span>}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button onClick={() => openManageStaff(lab)} className="h-10 px-4 flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-100 transition-all">
                Manage Staff
              </button>
              <button onClick={() => openManageTests(lab)} className="h-10 px-4 flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-100 transition-all">
                <TestTube2 className="h-4 w-4" /> Manage Tests
              </button>
            </div>
          </div>
        ))}
        {labs.length === 0 && !showNewLab && (
          <div className="text-center py-12 text-slate-500">No partner labs registered yet.</div>
        )}
      </div>

      {/* MANAGE TESTS MODAL */}
      {selectedLab && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedLab.name}</h3>
                <p className="text-sm text-slate-500">Manage Tests & Pricing</p>
              </div>
              <button onClick={() => setSelectedLab(null)} className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <div className="mb-6 flex justify-end">
              <button 
                onClick={() => setShowAddTestForm(!showAddTestForm)}
                className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Map New Test
              </button>
            </div>

            {showAddTestForm && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <select 
                    value={testForm.cancerScreeningTestId} 
                    onChange={e => setTestForm({...testForm, cancerScreeningTestId: e.target.value})}
                    className="col-span-2 border border-slate-200 rounded-xl p-3 text-sm focus:outline-indigo-500 bg-white"
                  >
                    <option value="">Select a Cancer Test...</option>
                    {allTests.map(t => (
                      <option key={t._id} value={t._id}>{t.name} ({t.category})</option>
                    ))}
                  </select>
                  <input 
                    type="number" placeholder="Price (₹)" 
                    value={testForm.price} onChange={e => setTestForm({...testForm, price: e.target.value})}
                    className="border border-slate-200 rounded-xl p-3 text-sm focus:outline-indigo-500 bg-white"
                  />
                  <input 
                    type="number" placeholder="Turnaround Time (Hours)" 
                    value={testForm.turnaroundTimeHours} onChange={e => setTestForm({...testForm, turnaroundTimeHours: e.target.value})}
                    className="border border-slate-200 rounded-xl p-3 text-sm focus:outline-indigo-500 bg-white"
                  />
                  <input 
                    type="text" placeholder="Lab-specific preparation instructions (Optional)" 
                    value={testForm.preparationInstructions} onChange={e => setTestForm({...testForm, preparationInstructions: e.target.value})}
                    className="col-span-2 border border-slate-200 rounded-xl p-3 text-sm focus:outline-indigo-500 bg-white"
                  />
                </div>
                <button 
                  onClick={assignTestToLab}
                  disabled={!testForm.cancerScreeningTestId || !testForm.price || !testForm.turnaroundTimeHours}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold w-full disabled:opacity-50"
                >
                  Save Mapping
                </button>
              </div>
            )}

            <div className="space-y-3">
              {mappedTests.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm">
                  <TestTube2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  No tests mapped to this laboratory yet.
                </div>
              ) : (
                mappedTests.map(test => (
                  <div key={test._id} className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{test.cancerScreeningTestId?.name || 'Unknown Test'}</h4>
                      <p className="text-xs text-slate-500">₹{test.price} • {test.turnaroundTimeHours} Hrs Turnaround</p>
                    </div>
                    <button className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-100">
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* MANAGE STAFF MODAL */}
      {showStaffModal && selectedLab && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Add Lab Staff</h3>
                <p className="text-sm text-slate-500">{selectedLab.name}</p>
              </div>
              <button onClick={() => setShowStaffModal(false)} className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <input 
                type="text" placeholder="Full Name" 
                value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-indigo-500 bg-white"
              />
              <input 
                type="email" placeholder="Email Address" 
                value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-indigo-500 bg-white"
              />
              <input 
                type="text" placeholder="Phone Number" 
                value={staffForm.phone} onChange={e => setStaffForm({...staffForm, phone: e.target.value})}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-indigo-500 bg-white"
              />
              <input 
                type="password" placeholder="Temporary Password" 
                value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-indigo-500 bg-white"
              />
              <button 
                onClick={createLabStaff}
                disabled={!staffForm.name || !staffForm.email || !staffForm.password}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold w-full disabled:opacity-50 mt-4"
              >
                Create Staff Account
              </button>
            </div>

            {labStaffList.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="text-sm font-bold text-slate-800 mb-3">Existing Staff</h4>
                <div className="space-y-2">
                  {labStaffList.map(staff => (
                    <div key={staff._id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{staff.name}</p>
                        <p className="text-xs text-slate-500">{staff.email} • {staff.role}</p>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${staff.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                        {staff.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
