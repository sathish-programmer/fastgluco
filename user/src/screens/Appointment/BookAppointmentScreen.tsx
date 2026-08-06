import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Calendar as CalendarIcon, Clock, ArrowLeft, Star } from 'lucide-react';
import { useConsultation } from '../../context/ConsultationContext';

interface BookAppointmentScreenProps {
  onBack?: () => void;
}

const getLocalDateString = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

const isExpired = (apptDate: string, apptTime: string) => {
  try {
    const [year, month, day] = apptDate.split('-').map(Number);
    const [hour, min] = apptTime.split(':').map(Number);
    const apptDateTime = new Date(year, month - 1, day, hour, min);
    return apptDateTime < new Date();
  } catch (e) {
    return false;
  }
};

const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '--';
  try {
    const isPlain = /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
    const date = isPlain ? new Date(dateStr + 'T00:00:00') : new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
};

export const BookAppointmentScreen: React.FC<BookAppointmentScreenProps> = ({ onBack }) => {
  const { apiUrl, token, user } = useAuth();
  const { showToast } = useToast();
  const { pendingRecommendationId, setPendingRecommendationId } = useConsultation();

  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [date, setDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('General Consultation');
  const [patientNotes, setPatientNotes] = useState('');
  const [consultationType, setConsultationType] = useState<'online' | 'offline'>('offline');

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPendingWarning, setShowPendingWarning] = useState(false);
  const [showPaymentDisclaimer, setShowPaymentDisclaimer] = useState(false);

  // Rating states
  const [ratingApptId, setRatingApptId] = useState<string | null>(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  // Generate next 14 days for the date picker
  const upcomingDates = Array.from({length: 14}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const defaultReasons = [
    'High Stress',
    'Sleep Issues',
    'Smoking',
    'Sex Health',
    'General Consultation',
    'Diabetes Consultation',
    'Endocrinologist Consultation',
    'Dentist Consultation',
    'Gastric Specialist Consultation',
    'Genetic Counselor Consultation',
    'Other'
  ];
  const [reasons, setReasons] = useState<string[]>(defaultReasons);

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();

    if (pendingRecommendationId) {
      fetchRecommendationMetadata(pendingRecommendationId);
    }
  }, [pendingRecommendationId]);

  const fetchRecommendationMetadata = async (recId: string) => {
    if (recId.startsWith('pending_')) {
      const parsedReason = recId.replace('pending_', '');
      if (parsedReason && !defaultReasons.includes(parsedReason)) {
        setReasons(prev => [...prev, parsedReason]);
      }
      if (parsedReason) setReason(parsedReason);
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/patient/consultations/${recId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const recReason = data.recommendation.reason || data.recommendation.recommendedSpecialty;
        if (recReason && !defaultReasons.includes(recReason)) {
          setReasons(prev => [...prev, recReason]);
        }
        if (recReason) setReason(recReason);
      }
    } catch (err) {
      console.error('Failed to fetch recommendation metadata', err);
    }
  };

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
      // Sort: highest rated first, then most experienced, then lowest fee
      const sorted = [...data].sort((a: any, b: any) => {
        const ratingA = a.avgRating ?? -1;
        const ratingB = b.avgRating ?? -1;
        if (ratingB !== ratingA) return ratingB - ratingA;
        const expA = a.experience ?? 0;
        const expB = b.experience ?? 0;
        if (expB !== expA) return expB - expA;
        const feeA = a.onlineConsultationFee ?? 0;
        const feeB = b.onlineConsultationFee ?? 0;
        return feeA - feeB;
      });
      setDoctors(sorted);
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

    const fee = consultationType === 'online' ? (selectedDoctor.onlineConsultationFee || 0) : (selectedDoctor.offlineConsultationFee || 0);
    if (fee > 0) {
      setShowPaymentDisclaimer(true);
    } else {
      confirmBook();
    }
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
          patientNotes,
          type: consultationType,
          recommendationId: pendingRecommendationId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Error booking appointment', 'error');
        setLoading(false);
        return;
      }

      const appointment = data.appointment;

      // Handle Razorpay checkout for Appointments
      if (data.razorpayOrder && data.razorpayOrder.amount > 0) {
        const options = {
          key: data.razorpayOrder.keyId,
          amount: data.razorpayOrder.amount,
          currency: data.razorpayOrder.currency,
          name: 'Mito_Reboot',
          description: `${consultationType === 'online' ? 'Online' : 'Offline'} Consultation with Dr. ${selectedDoctor.name}`,
          order_id: data.razorpayOrder.id,
          handler: async (response: any) => {
            setLoading(true);
            try {
              const verifyRes = await fetch(`${apiUrl}/patient/appointments/verify-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  appointmentId: appointment._id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.message || 'Payment verification failed.');

              showToast('Payment successful and appointment confirmed!', 'success');
              setPendingRecommendationId(null);
              await fetchAppointments();
              fetchSlots();
            } catch (err: any) {
              showToast(err.message || 'Error verifying Razorpay payment signature.', 'error');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.mobileNumber || ''
          },
          theme: {
            color: '#4F46E5' // Indigo
          },
          modal: {
            ondismiss: async () => {
              setLoading(false);
              try {
                await fetch(`${apiUrl}/patient/appointments/${appointment._id}/cancel-payment`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchAppointments();
              } catch (e) {
                console.error(e);
              }
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Offline or free online consultation
        showToast('Appointment requested successfully!', 'success');
        setPendingRecommendationId(null);
        resetForm();
      }
    } catch (e) {
      showToast('Error connecting to server', 'error');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDoctor(null);
    setDate('');
    setSelectedSlot('');
    setReason('General Consultation');
    setPatientNotes('');
    setConsultationType('offline');
    setPendingRecommendationId(null);
    setLoading(false);
    fetchAppointments();
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
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Consultation</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-100 leading-none mt-1">Book Appointment</h2>
        </div>
        {onBack && (
          <button onClick={onBack} className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Booking Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5 transition-colors duration-300">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-500" /> Appointment Schedule
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Specialist</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[...doctors].sort((a, b) => {
                    if (reason === 'Endocrinologist Consultation') {
                      const aIsEndo = a.specialty?.toLowerCase().includes('endocrinologist');
                      const bIsEndo = b.specialty?.toLowerCase().includes('endocrinologist');
                      if (aIsEndo && !bIsEndo) return -1;
                      if (!aIsEndo && bIsEndo) return 1;
                    }
                    return 0;
                  }).map(doc => (
                    <button
                      key={doc._id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-4 rounded-2xl border text-left transition-all ${selectedDoctor?._id === doc._id ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{doc.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{doc.specialty}</p>
                          {doc.languagesKnown && doc.languagesKnown.length > 0 && (
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">🗣️ {doc.languagesKnown.join(', ')}</p>
                          )}
                        </div>
                        {doc.avgRating != null && (
                          <div className="flex flex-col items-end shrink-0">
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map((star: number) => (
                                <svg key={star} className={`w-3 h-3 ${star <= Math.round(doc.avgRating) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.168c.969 0 1.371 1.24.588 1.81l-3.374 2.452a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118L10 14.347l-3.952 2.701c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.058 9.394c-.783-.57-.38-1.81.588-1.81h4.168a1 1 0 00.95-.69l1.285-3.967z"/>
                                </svg>
                              ))}
                            </div>
                            <span className="text-[9px] text-slate-400 mt-0.5">{doc.avgRating} ({doc.ratingCount})</span>
                          </div>
                        )}
                      </div>
                      {doc.experience != null && (
                        <p className="text-[10px] text-indigo-500 font-semibold mt-1.5">{doc.experience} yrs exp</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{doc.description}</p>
                      <div className="flex gap-3 mt-2">
                        {doc.onlineConsultationFee !== undefined && (
                          <span className="text-[10px] font-bold text-emerald-600">🌐 Rs. {doc.onlineConsultationFee}</span>
                        )}
                        {doc.offlineConsultationFee !== undefined && (
                          <span className="text-[10px] font-bold text-purple-600">🏥 Rs. {doc.offlineConsultationFee}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedDoctor && (
                <>
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 my-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Consultation Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setConsultationType('online')}
                        className={`p-3 rounded-xl border text-sm font-bold text-center transition-all ${consultationType === 'online' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}
                      >
                        🌐 Online Consultation
                        <span className="block text-[10px] opacity-80 font-normal mt-0.5">Fee: Rs. {selectedDoctor.onlineConsultationFee || 0}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConsultationType('offline')}
                        className={`p-3 rounded-xl border text-sm font-bold text-center transition-all ${consultationType === 'offline' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}
                      >
                        🏥 Offline Consultation
                        <span className="block text-[10px] opacity-80 font-normal mt-0.5">Fee: Rs. {selectedDoctor.offlineConsultationFee || 0}</span>
                      </button>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" /> Choose a Date
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {upcomingDates.map(d => {
                        const dateObj = new Date(d);
                        const isSelected = date === d;
                        const isHoliday = (selectedDoctor?.holidays || []).includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => { if (!isHoliday) setDate(d); }}
                            disabled={isHoliday}
                            className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border-2 min-w-[70px] transition-all ${
                              isHoliday ? 'border-rose-100 bg-rose-50 opacity-60 cursor-not-allowed' :
                              isSelected ? 'border-indigo-600 bg-indigo-600 text-white shadow-md' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                            }`}
                          >
                            <span className={`text-[10px] uppercase font-bold tracking-widest ${isHoliday ? 'text-rose-400' : isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                              {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span className={`text-xl font-black mt-1 ${isHoliday ? 'text-rose-700' : ''}`}>
                              {dateObj.getDate()}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="mb-4">
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

                  {date && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Select Consultation Time</label>
                      {availableSlots.length === 0 ? (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-600 font-bold">
                          No slots available on this day. Please pick another date.
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots.map((slotObj: any, idx) => {
                            const slotTime = slotObj.time || slotObj;
                            let isAvailable = slotObj.isAvailable !== false;

                            // If date is today, disable past timeslots
                            const todayStr = getLocalDateString();
                            if (date === todayStr) {
                              const [sHour, sMin] = slotTime.split(':').map(Number);
                              const now = new Date();
                              const currentHour = now.getHours();
                              const currentMin = now.getMinutes();
                              if (sHour < currentHour || (sHour === currentHour && sMin < currentMin)) {
                                isAvailable = false;
                              }
                            }

                            return (
                              <button
                                key={`${slotTime}-${idx}`}
                                type="button"
                                disabled={!isAvailable}
                                onClick={() => setSelectedSlot(slotTime)}
                                className={`py-3 rounded-2xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1 shadow-sm ${
                                  !isAvailable 
                                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60' 
                                    : selectedSlot === slotTime 
                                      ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-100' 
                                      : 'bg-slate-50 border-slate-200/60 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5 opacity-65" /> {slotTime} {!isAvailable && (slotObj.isAvailable === false ? '(Booked)' : '(Past)')}
                              </button>
                            );
                          })}
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5 transition-colors duration-300">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" /> Upcoming & Past Visits
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[500px]">
              {appointments.map(appt => (
                <div key={appt._id} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Dr. {appt.doctorId.name}</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wide">{formatDate(appt.date)} at {appt.time}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        appt.paymentStatus === 'failed' 
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : (appt.status === 'pending' || appt.status === 'confirmed') && isExpired(appt.date, appt.time)
                            ? 'bg-slate-100 text-slate-400 border border-slate-250'
                            : appt.status === 'confirmed' 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : appt.status === 'completed' 
                                ? 'bg-blue-50 text-blue-600' 
                                : appt.status === 'cancelled' 
                                  ? 'bg-rose-50 text-rose-600' 
                                  : 'bg-amber-50 text-amber-600'
                      }`}>
                        {appt.paymentStatus === 'failed' 
                          ? 'Payment Failed' 
                          : (appt.status === 'pending' || appt.status === 'confirmed') && isExpired(appt.date, appt.time)
                            ? 'Expired'
                            : appt.status}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase ${appt.type === 'online' ? 'bg-teal-50 text-teal-600' : 'bg-purple-50 text-purple-600'}`}>
                        {appt.type || 'offline'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-600"><strong className="text-slate-400">Reason:</strong> {appt.reason}</p>

                  {appt.patientNotes?.trim() && (
                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">📝 My Notes to Doctor:</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{appt.patientNotes}</p>
                    </div>
                  )}

                  {appt.meetingLink && appt.status === 'confirmed' && (
                    appt.type === 'online' ? (
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
                    ) : (
                      <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 space-y-1.5">
                        <p className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">🏥 Clinic Instructions from Doctor:</p>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{appt.meetingLink}</p>
                      </div>
                    )
                  )}

                  {appt.notes && (
                    <div className="bg-white border border-slate-100 rounded-xl p-2.5 text-xs text-slate-600 mt-2">
                      <strong className="text-slate-500">Consultation Notes:</strong>
                      <p className="mt-1 font-mono leading-relaxed">{appt.notes}</p>
                    </div>
                  )}

                  {appt.prescriptionText && (
                    <div className="bg-slate-100/80 border border-slate-200/50 rounded-xl p-2.5 text-xs text-slate-700 mt-2 font-sans leading-relaxed">
                      <strong className="text-slate-500">Prescription Notes:</strong>
                      <p className="mt-1 font-medium">{appt.prescriptionText}</p>
                    </div>
                  )}

                  {appt.prescriptionUrl && (
                    <a
                      href={appt.prescriptionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold mt-2 shadow-sm transition-all"
                    >
                      View Prescription Attachment
                    </a>
                  )}

                  {appt.invoiceUrl && (
                    <a
                      href={`${apiUrl.replace(/\/api$/, '')}${appt.invoiceUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold mt-2 shadow-sm transition-all"
                    >
                      Download Invoice PDF
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

      {/* Payment Disclaimer Modal */}
      {showPaymentDisclaimer && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-2xl">
              💳
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Redirecting to Payment Gateway</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                To confirm your {consultationType} consultation with <strong>Dr. {selectedDoctor?.name}</strong>, you will be redirected to our secure payment gateway to complete the transaction of <strong>Rs. {consultationType === 'online' ? selectedDoctor?.onlineConsultationFee : selectedDoctor?.offlineConsultationFee}</strong>.
              </p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-[10px] text-slate-400 font-medium leading-relaxed">
              ⚠️ Please do not close the window or hit back while the payment gateway loads. Once payment is confirmed, your appointment request will be saved as pending doctor's confirmation.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentDisclaimer(false)}
                className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPaymentDisclaimer(false);
                  confirmBook();
                }}
                className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white shadow hover:bg-indigo-700 transition-colors"
              >
                Accept & Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
