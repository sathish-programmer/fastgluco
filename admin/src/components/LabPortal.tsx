import React, { useState, useEffect } from 'react';
import { LogOut, Activity, Search, RefreshCw, CheckCircle, FileText, Upload, Calendar } from 'lucide-react';

interface LabPortalProps {
  apiUrl: string;
  token: string;
  onLogout: () => void;
  adminProfile: any;
}

export const LabPortal: React.FC<LabPortalProps> = ({ apiUrl, token, onLogout, adminProfile }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'ready' | 'availability' | 'tests' | 'staff'>('pending');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingBookingId, setUploadingBookingId] = useState<string | null>(null);

  // Management States
  const [availability, setAvailability] = useState({ availableSlots: [] as string[], isHomeCollectionAvailable: false, holidays: [] as string[] });
  const [newSlot, setNewSlot] = useState('');
  
  // Bulk Slot Generator States
  const [bulkStart, setBulkStart] = useState('09:00');
  const [bulkEnd, setBulkEnd] = useState('17:00');
  const [bulkInterval, setBulkInterval] = useState('30');
  
  // Holiday Picker State
  const [newHoliday, setNewHoliday] = useState('');
  
  const [labTests, setLabTests] = useState<any[]>([]);
  const [allGlobalTests, setAllGlobalTests] = useState<any[]>([]);
  const [showAddTest, setShowAddTest] = useState(false);
  const [testForm, setTestForm] = useState({ cancerScreeningTestId: '', price: '', turnaroundTimeHours: '', preparationInstructions: '' });

  const [labStaff, setLabStaff] = useState<any[]>([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', phone: '', role: 'Technician', password: '' });

  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});

  useEffect(() => {
    if (['pending', 'completed', 'ready'].includes(activeTab)) {
      fetchBookings();
    } else if (activeTab === 'availability') {
      fetchAvailability();
    } else if (activeTab === 'tests') {
      fetchLabTests();
      fetchAllGlobalTests();
    } else if (activeTab === 'staff') {
      fetchLabStaff();
    }
  }, [activeTab]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/labs/portal/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter by the lab's ID if provided in profile
        let filtered = data;
        if (adminProfile.laboratoryId) {
          filtered = data.filter((b: any) => b.laboratoryId?._id === adminProfile.laboratoryId || b.laboratoryId === adminProfile.laboratoryId);
        }
        
        setBookings(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/labs/portal/availability`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setAvailability(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const updateAvailability = async (slots: string[], homeCol: boolean, holidays: string[]) => {
    try {
      await fetch(`${apiUrl}/labs/portal/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ availableSlots: slots, isHomeCollectionAvailable: homeCol, holidays })
      });
      fetchAvailability();
    } catch (e) { console.error(e); }
  };

  const handleBulkGenerateSlots = () => {
    if (!bulkStart || !bulkEnd || !bulkInterval) return;
    const startParts = bulkStart.split(':').map(Number);
    const endParts = bulkEnd.split(':').map(Number);
    
    let currentMins = startParts[0] * 60 + startParts[1];
    const endMins = endParts[0] * 60 + endParts[1];
    const intervalMins = parseInt(bulkInterval, 10);
    
    if (currentMins >= endMins || intervalMins <= 0) return;
    
    const newSlots: string[] = [];
    while (currentMins <= endMins) {
      const h = Math.floor(currentMins / 60);
      const m = currentMins % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      const formattedSlot = `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
      newSlots.push(formattedSlot);
      currentMins += intervalMins;
    }
    
    const mergedSlots = Array.from(new Set([...(availability.availableSlots || []), ...newSlots]));
    updateAvailability(mergedSlots, availability.isHomeCollectionAvailable, availability.holidays || []);
  };

  const fetchLabTests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/labs/portal/tests`, { headers: { 'Authorization': `Bearer ${token}` } });
      setLabTests(await res.json() || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchAllGlobalTests = async () => {
    try {
      const res = await fetch(`${apiUrl}/labs/tests`, { headers: { 'Authorization': `Bearer ${token}` } });
      setAllGlobalTests(await res.json() || []);
    } catch (e) { console.error(e); }
  };

  const createLabTest = async () => {
    try {
      await fetch(`${apiUrl}/labs/portal/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...testForm, price: Number(testForm.price), turnaroundTimeHours: Number(testForm.turnaroundTimeHours) })
      });
      setShowAddTest(false);
      setTestForm({ cancerScreeningTestId: '', price: '', turnaroundTimeHours: '', preparationInstructions: '' });
      fetchLabTests();
    } catch (e) { console.error(e); }
  };

  const fetchLabStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/labs/portal/staff`, { headers: { 'Authorization': `Bearer ${token}` } });
      setLabStaff(await res.json() || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const createLabStaff = async () => {
    try {
      await fetch(`${apiUrl}/labs/portal/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(staffForm)
      });
      setShowAddStaff(false);
      setStaffForm({ name: '', email: '', phone: '', role: 'Technician', password: '' });
      fetchLabStaff();
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (bookingId: string, status: string) => {
    try {
      const res = await fetch(`${apiUrl}/labs/portal/booking/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId, status, note: `Status updated to ${status} by Lab` })
      });
      if (res.ok) {
        fetchBookings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileSelect = (bookingId: string, file: File | null) => {
    if (file) {
      setSelectedFiles(prev => ({ ...prev, [bookingId]: file }));
    } else {
      setSelectedFiles(prev => {
        const next = { ...prev };
        delete next[bookingId];
        return next;
      });
    }
  };

  const handleUploadReport = async (bookingId: string) => {
    const file = selectedFiles[bookingId];
    if (!file) {
      alert('Please select a file first.');
      return;
    }

    setUploadingBookingId(bookingId);
    try {
      const formData = new FormData();
      formData.append('bookingId', bookingId);
      formData.append('reportFile', file);

      const res = await fetch(`${apiUrl}/labs/portal/booking/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        alert('Digital report uploaded and patient notified!');
        handleFileSelect(bookingId, null); // Clear selected file
        fetchBookings();
      } else {
        alert('Failed to upload digital report.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while uploading the report.');
    } finally {
      setUploadingBookingId(null);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = (b.userId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.labTestId?.cancerScreeningTestId?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'pending') {
      return ['PENDING', 'CONFIRMED', 'SAMPLE_ASSIGNED', 'SAMPLE_COLLECTED'].includes(b.status);
    }
    if (activeTab === 'completed') {
      return ['IN_PROCESSING', 'COMPLETED'].includes(b.status);
    }
    if (activeTab === 'ready') {
      return b.status === 'REPORT_READY';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#0f172a] text-slate-300 flex flex-col shadow-2xl z-20">
        <div className="h-16 flex items-center px-6 bg-[#0b1221] border-b border-white/5">
          <Activity className="h-6 w-6 text-indigo-400 mr-3" />
          <span className="text-white font-black text-lg tracking-tight">Lab Portal</span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2">
          <div className="mb-6 px-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Welcome,</p>
            <p className="text-white font-bold">{adminProfile.name}</p>
          </div>

          <button 
            onClick={() => setActiveTab('pending')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'pending' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-white/5'
            }`}
          >
            <Calendar className="h-4.5 w-4.5" /> Active Bookings
          </button>
          
          <button 
            onClick={() => setActiveTab('completed')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'completed' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-white/5'
            }`}
          >
            <CheckCircle className="h-4.5 w-4.5" /> Awaiting Report
          </button>

          <button 
            onClick={() => setActiveTab('ready')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'ready' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-white/5'
            }`}
          >
            <FileText className="h-4.5 w-4.5" /> Reports Ready
          </button>

          <div className="pt-4 mt-4 border-t border-white/5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Management</p>
            <button 
              onClick={() => setActiveTab('availability')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'availability' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-white/5'
              }`}
            >
              <Activity className="h-4.5 w-4.5" /> Availability
            </button>
            <button 
              onClick={() => setActiveTab('tests')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'tests' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-white/5'
              }`}
            >
              <Search className="h-4.5 w-4.5" /> Manage Tests
            </button>
            <button 
              onClick={() => setActiveTab('staff')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'staff' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-white/5'
              }`}
            >
              <LogOut className="h-4.5 w-4.5" /> Manage Staff
            </button>
          </div>
        </div>

        <div className="p-4 bg-[#0b1221]">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shadow-sm">
          <h2 className="text-lg font-black text-slate-800 capitalize">
            {activeTab === 'pending' ? 'Active Bookings' : activeTab === 'completed' ? 'Awaiting Report Upload' : 'Reports Ready for Collection'}
          </h2>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search patient or test..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-64"
              />
            </div>
            <button onClick={fetchBookings} className="p-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {['pending', 'completed', 'ready'].includes(activeTab) && (
            loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin mb-4" />
                <p className="font-bold">Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-bold text-lg">No bookings found</p>
                <p className="text-sm">There are no bookings matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBookings.map((booking) => (
                  <div key={booking._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{booking.userId?.name || 'Unknown Patient'}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{booking.labTestId?.cancerScreeningTestId?.name || 'Unknown Test'}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase ${
                        booking.status === 'REPORT_READY' ? 'bg-green-100 text-green-700' :
                        booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Date</span>
                        <span className="font-medium text-slate-700">{new Date(booking.preferredDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Time</span>
                        <span className="font-medium text-slate-700">{booking.preferredTime}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Collection Type</span>
                        <span className="font-medium text-slate-700">{booking.collectionType === 'HOME' ? '🏠 Home' : '🏥 Center'}</span>
                      </div>
                    </div>

                    {activeTab === 'pending' && (
                      <div className="flex gap-2">
                        {booking.status === 'PENDING' && (
                          <button onClick={() => updateStatus(booking._id, 'CONFIRMED')} className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors">
                            Confirm Booking
                          </button>
                        )}
                        {booking.status === 'CONFIRMED' && (
                          <button onClick={() => updateStatus(booking._id, 'SAMPLE_COLLECTED')} className="flex-1 bg-emerald-600 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors">
                            Mark Sample Collected
                          </button>
                        )}
                        {booking.status === 'SAMPLE_COLLECTED' && (
                          <button onClick={() => updateStatus(booking._id, 'IN_PROCESSING')} className="flex-1 bg-amber-500 text-white font-bold py-2.5 rounded-xl hover:bg-amber-600 transition-colors">
                            Start Processing
                          </button>
                        )}
                      </div>
                    )}

                    {activeTab === 'completed' && (
                      <div className="space-y-3">
                        {booking.status === 'IN_PROCESSING' ? (
                          <button onClick={() => updateStatus(booking._id, 'COMPLETED')} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                            <RefreshCw className="h-4 w-4" />
                            Mark Processing Complete
                          </button>
                        ) : (
                          <>
                            <div className="relative">
                              <input 
                                type="file" 
                                accept="application/pdf,image/*" 
                                id={`file-upload-${booking._id}`}
                                className="hidden" 
                                onChange={(e) => handleFileSelect(booking._id, e.target.files?.[0] || null)}
                              />
                              <label 
                                htmlFor={`file-upload-${booking._id}`}
                                className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl border border-slate-200 border-dashed hover:bg-slate-200 cursor-pointer transition-colors"
                              >
                                <FileText className="h-4 w-4" />
                                {selectedFiles[booking._id] ? selectedFiles[booking._id].name : 'Choose Report File'}
                              </label>
                            </div>
                            <button 
                              onClick={() => handleUploadReport(booking._id)} 
                              disabled={uploadingBookingId === booking._id || !selectedFiles[booking._id]}
                              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {uploadingBookingId === booking._id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                              {uploadingBookingId === booking._id ? 'Uploading...' : 'Upload & Mark Ready'}
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {activeTab === 'ready' && (
                      <div className="bg-emerald-50 text-emerald-700 font-bold p-3 rounded-xl text-center flex items-center justify-center gap-2">
                        <CheckCircle className="h-4 w-4" /> Report Sent
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* AVAILABILITY VIEW */}
          {activeTab === 'availability' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* SLOTS COLUMN */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800">Slot Management</h3>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={availability.isHomeCollectionAvailable}
                      onChange={(e) => updateAvailability(availability.availableSlots, e.target.checked, availability.holidays || [])}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm font-bold text-slate-700">Home Collection</span>
                  </label>
                </div>
                
                <div className="mb-8 p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    Bulk Generate Slots
                  </h4>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-indigo-800 mb-1">Start Time</label>
                      <input type="time" value={bulkStart} onChange={e => setBulkStart(e.target.value)} className="w-full bg-white border border-indigo-200 rounded-xl p-2 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-indigo-800 mb-1">End Time</label>
                      <input type="time" value={bulkEnd} onChange={e => setBulkEnd(e.target.value)} className="w-full bg-white border border-indigo-200 rounded-xl p-2 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-indigo-800 mb-1">Interval</label>
                      <select value={bulkInterval} onChange={e => setBulkInterval(e.target.value)} className="w-full bg-white border border-indigo-200 rounded-xl p-2 text-sm focus:outline-none focus:border-indigo-500">
                        <option value="15">15 mins</option>
                        <option value="30">30 mins</option>
                        <option value="60">60 mins</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={handleBulkGenerateSlots} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm shadow-md">
                    Generate Slots
                  </button>
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 mb-3">Active Daily Slots</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(availability?.availableSlots || []).map(slot => (
                      <div key={slot} className="group flex items-center gap-1 bg-white border-2 border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm">
                        {slot}
                        <button 
                          onClick={() => updateAvailability((availability?.availableSlots || []).filter(s => s !== slot), availability?.isHomeCollectionAvailable || false, availability.holidays || [])}
                          className="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {(availability?.availableSlots || []).length === 0 && (
                      <div className="w-full py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-medium">
                        No slots active. Use the bulk generator above.
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <input 
                      type="text" 
                      placeholder="Or add single slot (e.g. 07:45 AM)" 
                      value={newSlot}
                      onChange={(e) => setNewSlot(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <button 
                      onClick={() => {
                        if (newSlot.trim() && !availability.availableSlots.includes(newSlot.trim())) {
                          updateAvailability([...availability.availableSlots, newSlot.trim()], availability.isHomeCollectionAvailable, availability.holidays || []);
                          setNewSlot('');
                        }
                      }}
                      className="bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-slate-900 text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* HOLIDAYS COLUMN */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm h-fit">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-rose-500">⛱️</span> Holidays / Closed Days
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">Select dates when your laboratory will be completely closed. Patients cannot book slots on these days.</p>
                </div>
                
                <div className="flex gap-2 mb-6">
                  <input 
                    type="date" 
                    value={newHoliday}
                    onChange={(e) => setNewHoliday(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-rose-500"
                  />
                  <button 
                    onClick={() => {
                      if (newHoliday && !(availability.holidays || []).includes(newHoliday)) {
                        updateAvailability(availability.availableSlots, availability.isHomeCollectionAvailable, [...(availability.holidays || []), newHoliday]);
                        setNewHoliday('');
                      }
                    }}
                    className="bg-rose-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-rose-600 shadow-sm"
                  >
                    Add Holiday
                  </button>
                </div>

                <div className="space-y-2">
                  {(availability.holidays || []).sort().map(holiday => (
                    <div key={holiday} className="flex items-center justify-between p-4 rounded-xl border border-rose-100 bg-rose-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-rose-100 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-bold text-rose-400 uppercase leading-none">{new Date(holiday).toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-lg font-black text-rose-700 leading-none mt-0.5">{new Date(holiday).getDate()}</span>
                        </div>
                        <span className="font-bold text-slate-700">{new Date(holiday).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}</span>
                      </div>
                      <button 
                        onClick={() => updateAvailability(availability.availableSlots, availability.isHomeCollectionAvailable, (availability.holidays || []).filter(h => h !== holiday))}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-100 p-2 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {(availability.holidays || []).length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-medium">
                      No holidays scheduled.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TESTS VIEW */}
          {activeTab === 'tests' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">My Lab Tests</h3>
                <button onClick={() => setShowAddTest(true)} className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-sm">
                  + Add New Test
                </button>
              </div>
              
              {showAddTest && (
                <div className="bg-white border border-slate-200 p-6 rounded-3xl mb-6">
                  <h4 className="font-bold text-slate-800 mb-4">Map Global Test to Lab</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <select 
                      value={testForm.cancerScreeningTestId} 
                      onChange={e => setTestForm({...testForm, cancerScreeningTestId: e.target.value})}
                      className="col-span-2 border border-slate-200 rounded-xl p-3 text-sm bg-white"
                    >
                      <option value="">Select a Test...</option>
                      {allGlobalTests.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                    <input type="number" placeholder="Price (₹)" value={testForm.price} onChange={e => setTestForm({...testForm, price: e.target.value})} className="border border-slate-200 rounded-xl p-3 text-sm bg-white" />
                    <input type="number" placeholder="Turnaround (Hrs)" value={testForm.turnaroundTimeHours} onChange={e => setTestForm({...testForm, turnaroundTimeHours: e.target.value})} className="border border-slate-200 rounded-xl p-3 text-sm bg-white" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={createLabTest} disabled={!testForm.cancerScreeningTestId} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold disabled:opacity-50">Save</button>
                    <button onClick={() => setShowAddTest(false)} className="bg-slate-100 text-slate-600 px-6 py-2 rounded-xl text-sm font-bold">Cancel</button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Test Name</th>
                      <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Price</th>
                      <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Turnaround Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(labTests) ? labTests : []).map(test => (
                      <tr key={test._id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{test.cancerScreeningTestId?.name || 'Unknown'}</td>
                        <td className="p-4 text-slate-600">₹{test.price}</td>
                        <td className="p-4 text-slate-600">{test.turnaroundTimeHours} Hrs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STAFF VIEW */}
          {activeTab === 'staff' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">My Lab Staff</h3>
                <button onClick={() => setShowAddStaff(true)} className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-sm">
                  + Add Staff
                </button>
              </div>

              {showAddStaff && (
                <div className="bg-white border border-slate-200 p-6 rounded-3xl mb-6">
                  <h4 className="font-bold text-slate-800 mb-4">Create Staff Account</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input type="text" placeholder="Name" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="border border-slate-200 rounded-xl p-3 text-sm bg-white" />
                    <input type="email" placeholder="Email" value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} className="border border-slate-200 rounded-xl p-3 text-sm bg-white" />
                    <input type="text" placeholder="Phone" value={staffForm.phone} onChange={e => setStaffForm({...staffForm, phone: e.target.value})} className="border border-slate-200 rounded-xl p-3 text-sm bg-white" />
                    <input type="password" placeholder="Password" value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} className="border border-slate-200 rounded-xl p-3 text-sm bg-white" />
                    <select value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})} className="col-span-2 border border-slate-200 rounded-xl p-3 text-sm bg-white">
                      <option value="Technician">Technician</option>
                      <option value="Collector">Sample Collector</option>
                      <option value="LabAdmin">Lab Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={createLabStaff} disabled={!staffForm.name} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold disabled:opacity-50">Save Staff</button>
                    <button onClick={() => setShowAddStaff(false)} className="bg-slate-100 text-slate-600 px-6 py-2 rounded-xl text-sm font-bold">Cancel</button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Staff Name</th>
                      <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Email</th>
                      <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(labStaff) ? labStaff : []).map(staff => (
                      <tr key={staff._id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{staff.name}</td>
                        <td className="p-4 text-slate-600">{staff.email}</td>
                        <td className="p-4 text-slate-600 capitalize">{staff.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
