import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Calendar as CalendarIcon, Clock, ArrowLeft, Star } from 'lucide-react';

interface BookAppointmentScreenProps {
  onBack?: () => void;
}

export const BookAppointmentScreen: React.FC<BookAppointmentScreenProps> = ({ onBack }) => {
  const { apiUrl, token } = useAuth();
  const { showToast } = useToast();

  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [date, setDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('General Consultation');
  const [patientNotes, setPatientNotes] = useState('');

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPendingWarning, setShowPendingWarning] = useState(false);

  // Rating states
  const [ratingApptId, setRatingApptId] = useState<string | null>(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  const reasons = [
    'High Stress',
    'Sleep Issues',
    'Smoking',
    'Sex Health',
    'General Consultation',
    'Diabetes Consultation',
    'Other'
  ];

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (selectedDoctor && date) {
      fetchSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDoctor, date]);

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${apiUrl}/patient/doctors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setDoctors(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${apiUrl}/patient/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAppointments(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await fetch(`${apiUrl}/patient/doctors/${selectedDoctor._id}/slots?date=${date}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAvailableSlots(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBook = async () => {
    if (!selectedDoctor || !date || !selectedSlot || !reason) {
      showToast('Please fill all appointment details', 'error');
      return;
    }

    // Check if user already has a pending appointment
    const hasPending = appointments.some(
      (a: any) => a.status === 'pending'
    );
    if (hasPending && !showPendingWarning) {
      setShowPendingWarning(true);
      return;
    }
    setShowPendingWarning(false);
    confirmBook();
  };

  const confirmBook = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/patient/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          doctorId: selectedDoctor._id,
          date,
          time: selectedSlot,
          reason,
          patientNotes
        })
      });
      if (res.ok) {
        showToast('Appointment requested successfully!', 'success');
        setSelectedDoctor(null);
        setDate('');
        setSelectedSlot('');
        setReason('General Consultation');
        setPatientNotes('');
        fetchAppointments();
      } else {
        const err = await res.json();
        showToast(err.message || 'Error booking appointment', 'error');
      }
    } catch (e) {
      showToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingApptId) return;
    try {
      const res = await fetch(`${apiUrl}/patient/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentId: ratingApptId,
          rating: ratingVal,
          feedbackText
        })
      });
      if (res.ok) {
        showToast('Thank you for your feedback!', 'success');
        setRatingApptId(null);
        setFeedbackText('');
        fetchAppointments();
      } else {
        showToast('Error saving feedback', 'error');
      }
    } catch (e) {
      showToast('Server error during feedback save', 'error');
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Consultation</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">Book Appointment</h2>
        </div>
        {onBack && (
          <button onClick={onBack} className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Booking Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-500" /> Appointment Schedule
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Specialist</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {doctors.map(doc => (
                    <button
                      key={doc._id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-4 rounded-2xl border text-left transition-all ${selectedDoctor?._id === doc._id ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                    >
                      <h4 className="font-bold text-slate-800 text-sm">Dr. {doc.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{doc.specialty}</p>
                      <p className="text-[10px] text-slate-400 mt-2 line-clamp-2">{doc.description}</p>
                      {doc.consultationFee !== undefined && doc.consultationFee !== null && (
                        <p className="text-[11px] font-bold text-indigo-600 mt-1">Consultation Fee: Rs. {doc.consultationFee}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDoctor && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Choose Date</label>
                      <input
                        type="date"
                        value={date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reason for Appointment</label>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 font-bold"
                      >
                        {reasons.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {date && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Select Consultation Time</label>
                      {availableSlots.length === 0 ? (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-600 font-bold">
                          No slots available on this day. Please pick another date.
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots.map((slot, idx) => (
                            <button
                              key={`${slot}-${idx}`}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-3 rounded-2xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1 shadow-sm ${selectedSlot === slot ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-100' : 'bg-slate-50 border-slate-200/60 text-slate-700 hover:bg-slate-100'}`}
                            >
                              <Clock className="w-3.5 h-3.5 opacity-65" /> {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes to Doctor — shown after slot selected */}
                  {selectedSlot && (
                    <div className="border border-indigo-100 bg-indigo-50/40 rounded-2xl p-4">
                      <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        📝 Notes to Doctor <span className="text-slate-300 font-normal normal-case">(optional)</span>
                      </label>
                      <textarea
                        value={patientNotes}
                        onChange={e => setPatientNotes(e.target.value)}
                        placeholder="Share any symptoms, concerns or context the doctor should know before your visit..."
                        rows={3}
                        maxLength={500}
                        className="w-full bg-white border border-indigo-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none leading-relaxed"
                      />
                      <p className="text-[10px] text-slate-300 text-right mt-1">{patientNotes.length}/500</p>
                    </div>
                  )}

                  <button
                    onClick={handleBook}
                    disabled={loading || !selectedSlot}
                    className="w-full py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 mt-6"
                  >
                    {loading ? 'Requesting...' : 'Confirm Request'}
                  </button>

                  {/* Pending appointment warning modal */}
                  {showPendingWarning && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
                        <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                          <span className="text-3xl">⚠️</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-800 mb-2">Pending Appointment Exists</h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                          You already have a <strong className="text-amber-600">pending appointment</strong> waiting for doctor approval. Are you sure you want to book another one?
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowPendingWarning(false)}
                            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => { setShowPendingWarning(false); confirmBook(); }}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-bold text-white shadow-sm transition-colors"
                          >
                            Book Anyway
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Appointment List & Feedback */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" /> Upcoming & Past Visits
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[500px]">
              {appointments.map(appt => (
                <div key={appt._id} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Dr. {appt.doctorId.name}</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wide">{appt.date} at {appt.time}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : appt.status === 'completed' ? 'bg-blue-50 text-blue-600' : appt.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                      {appt.status}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-600"><strong className="text-slate-400">Reason:</strong> {appt.reason}</p>

                  {appt.patientNotes?.trim() && (
                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">📝 My Notes to Doctor:</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{appt.patientNotes}</p>
                    </div>
                  )}

                  {appt.meetingLink && appt.status === 'confirmed' && (
                    <a
                      href={appt.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                    >
                      {appt.meetingLink.includes('calendar.app.google') || appt.meetingLink.includes('calendar.google.com')
                        ? 'Open Google Calendar Invite'
                        : 'Join Google Meet'}
                    </a>
                  )}

                  {appt.notes && (
                    <div className="bg-white border border-slate-100 rounded-xl p-2.5 text-xs text-slate-600 mt-2">
                      <strong className="text-slate-500">Consultation Notes:</strong>
                      <p className="mt-1 font-mono leading-relaxed">{appt.notes}</p>
                    </div>
                  )}

                  {appt.prescriptionUrl && (
                    <a
                      href={appt.prescriptionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold mt-2 shadow-sm transition-all"
                    >
                      View Prescription
                    </a>
                  )}

                  {appt.status === 'completed' && !appt.hasFeedback && (
                    <button
                      onClick={() => setRatingApptId(appt._id)}
                      className="w-full py-2 text-xs font-bold text-indigo-500 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors mt-2"
                    >
                      Give Feedback & Rating
                    </button>
                  )}

                  {appt.feedback && (
                    <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5 text-xs text-slate-700 mt-2">
                      <div className="flex items-center gap-1 text-amber-500 font-bold mb-1">
                        <span>{'★'.repeat(appt.feedback.rating)}{'☆'.repeat(5 - appt.feedback.rating)}</span>
                        <span className="text-[10px] text-slate-400 font-bold">({appt.feedback.rating}/5)</span>
                      </div>
                      <p className="italic text-slate-600">"{appt.feedback.feedbackText}"</p>
                    </div>
                  )}
                </div>
              ))}

              {appointments.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No appointment history found.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {ratingApptId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> Consultation Feedback
            </h3>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Rating</label>
                <div className="flex gap-2 justify-center py-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRatingVal(star)}
                      className={`text-3xl transition-transform hover:scale-110 ${star <= ratingVal ? 'text-amber-500' : 'text-slate-200'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Your review</label>
                <textarea
                  required
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 font-bold"
                  rows={3}
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setRatingApptId(null)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
