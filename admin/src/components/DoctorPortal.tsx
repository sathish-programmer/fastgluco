import React, { useState, useEffect } from 'react';
import { Calendar, Clock, LogOut, FileText } from 'lucide-react';

interface DoctorPortalProps {
  apiUrl: string;
  token: string;
  onLogout: () => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ apiUrl, token, onLogout }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  
  // Tab: 'appointments' | 'availability'
  const [activeTab, setActiveTab] = useState<'appointments' | 'availability'>('appointments');

  // Consultation notes updates
  const [consultingApptId, setConsultingApptId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [prescriptionUrl, setPrescriptionUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Custom Google Calendar modal flow states
  const [acceptingAppt, setAcceptingAppt] = useState<any | null>(null);
  const [customMeetUrl, setCustomMeetUrl] = useState('');
  const [savingMeetUrl, setSavingMeetUrl] = useState(false);

  // Availability form state
  const [slotDuration, setSlotDuration] = useState(30);
  const [availableDays, setAvailableDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ start: string; end: string }[]>([
    { start: '09:00', end: '13:00' },
    { start: '14:00', end: '17:00' }
  ]);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('13:00');

  useEffect(() => {
    fetchAppointments();
    fetchAvailability();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${apiUrl}/doctor/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setAppointments(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAvailability = async () => {
    try {
      const res = await fetch(`${apiUrl}/doctor/availability`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.slotDuration) setSlotDuration(data.slotDuration);
        if (data.availableDays) setAvailableDays(data.availableDays);
        if (data.availableTimeSlots) setAvailableTimeSlots(data.availableTimeSlots);
        if (data.holidays) {
          setHolidays(data.holidays.map((h: string) => h.split('T')[0]));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultingApptId) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/doctor/appointments/${consultingApptId}/consultation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notes,
          prescriptionUrl,
          status: 'completed'
        })
      });
      if (res.ok) {
        setConsultingApptId(null);
        setNotes('');
        setPrescriptionUrl('');
        fetchAppointments();
      } else {
        alert('Error updating consultation notes');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/doctor/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          slotDuration,
          availableDays,
          availableTimeSlots,
          holidays
        })
      });
      if (res.ok) {
        alert('Availability config saved successfully!');
        fetchAvailability();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleDay = (day: number) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };



  const saveAvailabilityDirectly = async (updatedHolidays: string[], updatedTimeSlots = availableTimeSlots, updatedDays = availableDays) => {
    try {
      await fetch(`${apiUrl}/doctor/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          slotDuration,
          availableDays: updatedDays,
          availableTimeSlots: updatedTimeSlots,
          holidays: updatedHolidays
        })
      });
    } catch (e) {
      console.error('Auto save failed', e);
    }
  };

  const addHoliday = () => {
    if (!newHoliday || holidays.includes(newHoliday)) return;
    const nextHolidays = [...holidays, newHoliday];
    setHolidays(nextHolidays);
    setNewHoliday('');
    saveAvailabilityDirectly(nextHolidays);
  };

  const removeHoliday = (dateStr: string) => {
    const nextHolidays = holidays.filter(h => h !== dateStr);
    setHolidays(nextHolidays);
    saveAvailabilityDirectly(nextHolidays);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/25">
            <span className="text-xl">🩺</span>
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-800">MitoReboot</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Clinical Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'appointments' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-850'}`}
          >
            My Appointments
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'availability' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-850'}`}
          >
            My Availability & Leaves
          </button>
        </div>
        <button onClick={onLogout} className="px-4 py-2 hover:bg-slate-100 rounded-xl text-slate-500 flex items-center gap-2 text-xs font-bold border border-slate-200 hover:text-slate-800 transition-all">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </header>

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8">
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 shadow-sm rounded-[32px] p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-500" /> Consultations & Schedule
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Review upcoming virtual slots and clinical history records</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {appointments.map(appt => (
                  <div key={appt._id} className="border border-slate-150 bg-slate-50/50 rounded-2xl p-5 space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">Patient: {appt.userId?.name || 'Unregistered'}</h4>
                          <p className="text-[10px] text-slate-400 font-mono tracking-wide mt-0.5">{appt.date} at {appt.time}</p>
                        </div>
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : appt.status === 'completed' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                          {appt.status}
                        </span>
                      </div>

                      <div className="bg-slate-100/50 p-3 rounded-xl border border-slate-200 text-xs text-slate-650">
                        <strong className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Reason:</strong>
                        {appt.reason}
                      </div>

                      {appt.patientNotes?.trim() && (
                        <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 text-xs text-slate-700">
                          <strong className="text-indigo-400 block text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                            <FileText className="h-3 w-3" /> Patient Notes:
                          </strong>
                          <p className="leading-relaxed text-slate-600">{appt.patientNotes}</p>
                        </div>
                      )}

                      {appt.feedback && (
                        <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 text-xs text-slate-700">
                          <strong className="text-amber-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                            ⭐ Patient Review:
                          </strong>
                          <div className="flex items-center gap-1 text-amber-500 font-bold mb-1">
                            <span>{'★'.repeat(appt.feedback.rating)}{'☆'.repeat(5 - appt.feedback.rating)}</span>
                            <span className="text-[10px] text-slate-400 font-bold">({appt.feedback.rating}/5)</span>
                          </div>
                          <p className="italic text-slate-650">"{appt.feedback.feedbackText}"</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-2">
                      {appt.meetingLink && appt.status === 'confirmed' && (
                        <a
                          href={appt.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                        >
                          {appt.meetingLink.includes('calendar.app.google') || appt.meetingLink.includes('calendar.google.com') 
                            ? 'Open Google Calendar Invite' 
                            : 'Join Virtual Meeting'}
                        </a>
                      )}

                      {appt.status === 'pending' && (
                        <div className="flex gap-2 w-full mt-1">
                          <button
                            onClick={() => {
                              setAcceptingAppt(appt);
                              setCustomMeetUrl('');
                            }}
                            className="flex-1 py-2 text-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm('Reject appointment request?')) return;
                              try {
                                const res = await fetch(`${apiUrl}/doctor/appointments/${appt._id}/reject`, {
                                  method: 'POST',
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) fetchAppointments();
                              } catch (e) { console.error(e); }
                            }}
                            className="flex-1 py-2 text-center bg-red-500 hover:bg-red-650 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {appt.status === 'confirmed' && (
                        <button
                          onClick={() => {
                            setConsultingApptId(appt._id);
                            setNotes(appt.notes || '');
                            setPrescriptionUrl(appt.prescriptionUrl || '');
                          }}
                          className="w-full py-3 text-xs font-bold text-indigo-500 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-200"
                        >
                          Complete & Share Notes
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {appointments.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-500 text-xs font-bold border border-dashed border-slate-800 rounded-3xl">
                    No consultations scheduled.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Days & Hours setup */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-[32px] p-8 space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-500" /> Availability & Leave Rules
                </h2>
                <p className="text-xs text-slate-400 mt-1">Configure active days and default working slot divisions</p>
              </div>

              <form onSubmit={handleAvailabilityUpdate} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Available Days</label>
                  <div className="flex gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, idx) => {
                      const active = availableDays.includes(idx);
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => toggleDay(idx)}
                          className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${active ? 'bg-primary text-white border-primary ring-4 ring-indigo-500/10' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800'}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Slot Duration</label>
                  <select
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold text-slate-700 focus:outline-none focus:border-primary"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Consultation Shift Hours (Excluding Breaks/Lunch)</label>
                  </div>
                  <div className="space-y-2">
                    {availableTimeSlots.map((slot, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                        <span>☀️ Active Shift: {slot.start} to {slot.end}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextSlots = availableTimeSlots.filter((_, i) => i !== idx);
                            setAvailableTimeSlots(nextSlots);
                            saveAvailabilityDirectly(holidays, nextSlots);
                          }}
                          className="text-red-500 hover:text-red-600 font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Shift Start</span>
                      <input type="time" value={newSlotStart} onChange={e => setNewSlotStart(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Shift End</span>
                      <input type="time" value={newSlotEnd} onChange={e => setNewSlotEnd(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextSlots = [...availableTimeSlots, { start: newSlotStart, end: newSlotEnd }];
                      setAvailableTimeSlots(nextSlots);
                      saveAvailabilityDirectly(holidays, nextSlots);
                    }}
                    className="w-full py-2.5 rounded-xl border border-dashed border-slate-350 bg-slate-50/50 text-xs font-bold text-indigo-500 hover:bg-slate-100 transition-all"
                  >
                    + Add Consultation Shift Hour
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark transition-all shadow-sm"
                >
                  Save Availability Config
                </button>
              </form>
            </div>

            {/* Calendar Holidays & Leaves */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-[32px] p-8 space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-500" /> Holidays & Day-Offs
                </h2>
                <p className="text-xs text-slate-400 mt-1">Block specific dates and holidays from scheduling</p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newHoliday}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNewHoliday(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={addHoliday}
                    className="px-6 py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs transition-all"
                  >
                    Block Date
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {holidays.map((dateStr) => (
                    <div key={dateStr} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
                      <span>{new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      <button
                        type="button"
                        onClick={() => removeHoliday(dateStr)}
                        className="text-red-500 hover:text-red-600 font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {holidays.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">No holidays blocked yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Consultations updates modal */}
      {consultingApptId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" /> Share Prescription & Notes
            </h3>
            <form onSubmit={handleConsultationSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Consultation Summary Notes</label>
                <textarea
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Clinical notes for the patient..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary"
                  rows={4}
                ></textarea>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Prescription Link / URL</label>
                <input
                  type="url"
                  value={prescriptionUrl}
                  onChange={(e) => setPrescriptionUrl(e.target.value)}
                  placeholder="https://mitoreboot.com/prescriptions/rx-101.pdf"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setConsultingApptId(null)} className="px-4 py-3 bg-slate-100 rounded-xl text-xs font-bold text-slate-550 hover:bg-slate-200 transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-3 bg-primary rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50 hover:bg-primary-dark transition-all">Complete Consultation</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* GOOGLE CALENDAR SCHEDULE MODAL */}
      {acceptingAppt && (() => {
        const patientName = acceptingAppt.userId?.name || 'Patient';
        const rawDate = acceptingAppt.date; // YYYY-MM-DD
        const rawTime = acceptingAppt.time; // HH:MM
        
        // Build start and end dates for calendar url
        const [year, month, day] = rawDate.split('-').map(Number);
        const [hour, min] = rawTime.split(':').map(Number);
        
        const startDate = new Date(year, month - 1, day, hour, min);
        const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // default 30 mins
        
        const formatCalDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Consultation+with+${encodeURIComponent(patientName)}&dates=${formatCalDate(startDate)}/${formatCalDate(endDate)}&details=MitoReboot+Consultation%0AReason:+${encodeURIComponent(acceptingAppt.reason)}`;

        const handleConfirmAccept = async (e: React.FormEvent) => {
          e.preventDefault();
          const trimmedLink = customMeetUrl.trim();
          const isValidGoogleLink = 
            trimmedLink.startsWith('https://meet.google.com/') || 
            trimmedLink.startsWith('https://calendar.app.google/') ||
            trimmedLink.startsWith('https://calendar.google.com/');
          
          if (!isValidGoogleLink) {
            alert('Please paste a valid Google Meet or Calendar link (starts with https://meet.google.com/, calendar.app.google, or calendar.google.com)');
            return;
          }
          setSavingMeetUrl(true);
          try {
            const res = await fetch(`${apiUrl}/doctor/appointments/${acceptingAppt._id}/accept`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ meetingLink: customMeetUrl.trim() })
            });
            if (res.ok) {
              setAcceptingAppt(null);
              fetchAppointments();
            } else {
              alert('Error confirming appointment');
            }
          } catch (err) {
            console.error(err);
          } finally {
            setSavingMeetUrl(false);
          }
        };

        return (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-100 shadow-xl">
              <div className="mb-4">
                <span className="text-xl">🗓️</span>
                <h3 className="text-base font-bold text-slate-800 mt-2">Schedule Google Meet</h3>
                <p className="text-xs text-slate-400 mt-1">Please schedule a calendar event at the slot requested by the patient.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-semibold text-slate-650 space-y-1.5 mb-5">
                <div><span className="text-slate-400">Patient:</span> {patientName}</div>
                <div><span className="text-slate-400">Requested Time:</span> {rawDate} at {rawTime}</div>
                <div><span className="text-slate-400">Reason:</span> {acceptingAppt.reason}</div>
              </div>

              <div className="space-y-4">
                <a
                  href={calUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Create Event on Google Calendar ↗
                </a>

                <form onSubmit={handleConfirmAccept} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Paste Google Meet Link</label>
                    <input
                      type="url"
                      required
                      placeholder="https://meet.google.com/abc-defg-hij"
                      value={customMeetUrl}
                      onChange={e => setCustomMeetUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setAcceptingAppt(null)} className="px-4 py-3 bg-slate-100 rounded-xl text-xs font-bold text-slate-550 hover:bg-slate-200 transition-all">Cancel</button>
                    <button type="submit" disabled={savingMeetUrl} className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50 transition-all">Confirm & Notify Patient</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
