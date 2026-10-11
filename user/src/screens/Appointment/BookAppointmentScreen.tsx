import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { Calendar as CalendarIcon, Clock, ArrowLeft, Star, Sparkles, Globe, Video, Building2, Download, FileText, Loader2, Check, Info, X, ExternalLink, MapPin } from 'lucide-react';
import { useConsultation } from '../../context/ConsultationContext';
import { downloadFile } from '../../utils/fileDownloader';

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

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  hi: 'hi-IN'
};

const getAvatarUrl = (avatarPath?: string, apiUrl?: string) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) return avatarPath;
  const baseUrl = (apiUrl || '').replace(/\/api\/?$/, '');
  return `${baseUrl}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
};

export const BookAppointmentScreen: React.FC<BookAppointmentScreenProps> = ({ onBack }) => {
  const { t, language } = useLanguage();
  const activeLocale = LOCALE_MAP[language] || 'en-US';
  const { apiUrl, token, user } = useAuth();
  const { showToast } = useToast();
  const { pendingRecommendationId, setPendingRecommendationId } = useConsultation();

  const formatDate = (dateStr: string | undefined | null): string => {
    if (!dateStr) return '--';
    try {
      const isPlain = /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
      const date = isPlain ? new Date(dateStr + 'T00:00:00') : new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString(activeLocale, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const getLocalizedReason = (reasonStr: string) => {
    if (!reasonStr) return '';
    const reasonMap: Record<string, string> = {
      'General Consultation': t('appointment.generalConsultation', 'General Consultation'),
      'Diabetes Consultation': t('appointment.diabetesConsultation', 'Diabetes Consultation'),
      'Endocrinologist Consultation': t('appointment.endocrinologistConsultation', 'Endocrinologist Consultation'),
      'Dentist Consultation': t('appointment.dentistConsultation', 'Dentist Consultation'),
      'Gastric Specialist Consultation': t('appointment.gastricSpecialistConsultation', 'Gastric Specialist Consultation'),
      'Genetic Counselor Consultation': t('appointment.geneticCounselorConsultation', 'Genetic Counselor Consultation'),
      'Sleep Issues': t('appointment.sleepIssues', 'Sleep Issues'),
      'Smoking': t('appointment.smoking', 'Smoking'),
      'Sex Health': t('appointment.sexHealth', 'Sex Health'),
      'Other': t('common.other', 'Other')
    };
    return reasonMap[reasonStr] || reasonStr;
  };

  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [profileDoctor, setProfileDoctor] = useState<any | null>(null);
  const [date, setDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('General Consultation');
  const [patientNotes, setPatientNotes] = useState('');
  const [consultationType, setConsultationType] = useState<'online' | 'offline'>('online');

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPendingWarning, setShowPendingWarning] = useState(false);
  const [showPaymentDisclaimer, setShowPaymentDisclaimer] = useState(false);

  // Rating states
  const [ratingApptId, setRatingApptId] = useState<string | null>(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  // Download states
  const [downloadingApptInvoiceId, setDownloadingApptInvoiceId] = useState<string | null>(null);
  const [downloadingPrescriptionId, setDownloadingPrescriptionId] = useState<string | null>(null);

  const handleDownloadAppointmentInvoice = async (apptId: string) => {
    if (downloadingApptInvoiceId) return;
    setDownloadingApptInvoiceId(apptId);
    try {
      const url = `${apiUrl}/appointments/${apptId}/invoice`;
      await downloadFile({
        url,
        filename: `Invoice-Consultation-${apptId.slice(-6).toUpperCase()}.pdf`,
        token
      });
      showToast('Invoice downloaded successfully.', 'success');
    } catch (err: any) {
      console.error('Error downloading consultation invoice:', err);
      showToast(err.message || 'Failed to download invoice.', 'error');
    } finally {
      setDownloadingApptInvoiceId(null);
    }
  };

  const handleDownloadPrescription = async (apptId: string, prescriptionUrl: string) => {
    if (downloadingPrescriptionId) return;
    setDownloadingPrescriptionId(apptId);
    try {
      const url = prescriptionUrl.startsWith('http')
        ? prescriptionUrl
        : `${apiUrl.replace(/\/api$/, '')}${prescriptionUrl}`;
      const ext = prescriptionUrl.split('.').pop() || 'pdf';
      await downloadFile({
        url,
        filename: `Prescription-${apptId.slice(-6).toUpperCase()}.${ext}`,
        token
      });
      showToast('Prescription downloaded successfully.', 'success');
    } catch (err: any) {
      console.error('Error downloading prescription:', err);
      showToast(err.message || 'Failed to download prescription.', 'error');
    } finally {
      setDownloadingPrescriptionId(null);
    }
  };

  // Generate next 14 days for the date picker
  const upcomingDates = Array.from({ length: 14 }, (_, i) => {
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

  const isMatchingSpecialty = (doc: any): boolean => {
    const targetSpec = (sessionStorage.getItem('mito_target_specialty') || '').toLowerCase();
    const activeJourney = (user?.cancerJourney || (localStorage.getItem('fastgluco_active_mode') as string) || '').toLowerCase();

    if (!targetSpec && !activeJourney) return false;
    const docText = `${doc.name || ''} ${doc.specialty || ''} ${doc.department || ''} ${doc.qualification || ''} ${doc.description || ''} ${doc.bio || ''}`.toLowerCase();

    if (targetSpec.includes('gynaec') || targetSpec.includes('gynec') || targetSpec.includes('pcod') || activeJourney === 'pcod') {
      return docText.includes('gynaec') || docText.includes('gynec') || docText.includes('obgyn') || docText.includes('endocrin') || docText.includes('women') || docText.includes('pcod');
    }
    if (targetSpec.includes('diabet') || targetSpec.includes('endocrin') || activeJourney === 'diabetes') {
      return docText.includes('diabet') || docText.includes('endocrin') || docText.includes('metabol') || docText.includes('physician');
    }
    if (targetSpec.includes('cardio') || activeJourney === 'hypertension' || activeJourney === 'cardiac') {
      return docText.includes('cardio') || docText.includes('heart') || docText.includes('vascular') || docText.includes('physician');
    }
    if (targetSpec.includes('neuro') || activeJourney === 'parkinson') {
      return docText.includes('neuro') || docText.includes('brain') || docText.includes('movement') || docText.includes('parkinson');
    }
    if (targetSpec.includes('geriat') || targetSpec.includes('preventive') || activeJourney === 'ageing') {
      return docText.includes('geriat') || docText.includes('preventive') || docText.includes('physician') || docText.includes('longevity');
    }
    if (targetSpec.includes('oncol') || targetSpec.includes('cancer') || activeJourney === 'treatment' || activeJourney === 'prevention' || activeJourney === 'secondary_prevention') {
      return docText.includes('oncol') || docText.includes('cancer') || docText.includes('chemo') || docText.includes('radiation') || docText.includes('surgical oncol');
    }
    if (targetSpec.includes('dent') || targetSpec.includes('oral') || targetSpec.includes('mouth')) {
      return docText.includes('dent') || docText.includes('oral') || docText.includes('caries');
    }
    return targetSpec ? docText.includes(targetSpec) : false;
  };

  const isRecommendedDoctor = (doc: any): boolean => {
    if (!doc) return false;
    return Boolean(doc.isRecommended === true || (doc.name && /Krithikaa/i.test(doc.name)));
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${apiUrl}/patient/doctors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      const targetSpec = sessionStorage.getItem('mito_target_specialty');
      if (targetSpec) {
        const customReason = `${targetSpec} Consultation`;
        setReasons(prev => prev.includes(customReason) ? prev : [customReason, ...prev]);
        setReason(customReason);
      }

      // Sort: Recommended doctors FIRST, then specialty matches, then highest rated, then most experienced, then lowest fee
      const sorted = [...data].sort((a: any, b: any) => {
        const recA = isRecommendedDoctor(a) ? 1 : 0;
        const recB = isRecommendedDoctor(b) ? 1 : 0;
        if (recB !== recA) return recB - recA;

        const matchA = isMatchingSpecialty(a) ? 1 : 0;
        const matchB = isMatchingSpecialty(b) ? 1 : 0;
        if (matchB !== matchA) return matchB - matchA;

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

      if (sorted.length > 0 && !selectedDoctor) {
        setSelectedDoctor(sorted[0]);
      }
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
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">{t('appointment.consultation', 'Consultation')}</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-100 leading-none mt-1">{t('appointment.bookAppointment', 'Book Appointment')}</h2>
        </div>
        {onBack && (
          <button onClick={onBack} className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Booking Form */}
        <div className="lg:col-span-2 min-w-0 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5 transition-colors duration-300">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-500" /> {t('appointment.appointmentSchedule', 'Appointment Schedule')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('appointment.selectSpecialist', 'Select Specialist')}</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {doctors.map(doc => {
                    const isRec = isRecommendedDoctor(doc);
                    const isSelected = selectedDoctor?._id === doc._id;
                    const avatarSrc = getAvatarUrl(doc.avatar, apiUrl);
                    const effectiveDuration = doc.slotDuration || 30;

                    const isDental = Boolean(
                      (doc.specialty && /dent|oral/i.test(doc.specialty)) ||
                      (doc.qualification && /bds|mds|dent/i.test(doc.qualification)) ||
                      (doc.focusTitle && /dent|oral/i.test(doc.focusTitle)) ||
                      (doc.name && /Pavithra/i.test(doc.name))
                    );

                    const isMetabolic = Boolean(
                      (doc.specialty && /metabolic|cancer|oncol|radiation/i.test(doc.specialty)) ||
                      (doc.qualification && /oncology|metabolic/i.test(doc.qualification)) ||
                      (doc.focusTitle && /metabolic|cancer/i.test(doc.focusTitle)) ||
                      (doc.name && /Krithikaa/i.test(doc.name))
                    );

                    const isPsychological = Boolean(
                      (doc.specialty && /psycho|counsel|mental|addiction/i.test(doc.specialty)) ||
                      (doc.qualification && /psycho|counsel|mental/i.test(doc.qualification)) ||
                      (doc.focusTitle && /psycho|mental|counsel/i.test(doc.focusTitle)) ||
                      (doc.name && /Sailee/i.test(doc.name))
                    );

                    const isSleep = Boolean(
                      (doc.specialty && /sleep|pulmon|respiratory/i.test(doc.specialty)) ||
                      (doc.focusTitle && /sleep/i.test(doc.focusTitle))
                    );

                    const focusTitle = doc.focusTitle || (
                      isDental
                        ? 'Preventive Dentistry Focus'
                        : isMetabolic
                          ? 'Metabolic Lifestyle Modulation Focus'
                          : isPsychological
                            ? 'Psychological Support Focus'
                            : isSleep
                              ? 'Sleep Evaluation Focus'
                              : 'Specialist Consultation Focus'
                    );

                    const focusIcon = doc.focusIcon || (
                      isDental
                        ? '🦷'
                        : isMetabolic
                          ? '🎗️'
                          : isPsychological
                            ? '🧠'
                            : isSleep
                              ? '🌙'
                              : '🩺'
                    );

                    const noteText = (isDental && (!doc.sleepEvaluationNote || /restorative sleep/i.test(doc.sleepEvaluationNote)))
                      ? 'Oral health & preventive dentistry for systemic wellness, early screening, and cavity prevention'
                      : (isPsychological && (!doc.sleepEvaluationNote || /restorative sleep/i.test(doc.sleepEvaluationNote)))
                        ? 'for emotional wellbeing, coping strategies, and psychological support'
                        : (isMetabolic && (!doc.sleepEvaluationNote || /restorative sleep/i.test(doc.sleepEvaluationNote)))
                          ? 'Metabolic lifestyle modulation for cancer prevention and cancer therapy'
                          : doc.sleepEvaluationNote;

                    return (
                      <button
                        key={doc._id}
                        type="button"
                        onClick={() => setSelectedDoctor(doc)}
                        className={`group relative text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer w-full min-w-0 overflow-hidden ${isSelected
                          ? 'border-indigo-600 dark:border-indigo-500 bg-white dark:bg-slate-900 shadow-md ring-2 ring-indigo-500/20'
                          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                          }`}
                      >
                        <div className="w-full min-w-0">
                          {/* Header: Avatar + Details + Radio Indicator */}
                          <div className="flex items-start gap-3 w-full min-w-0">
                            {/* Avatar */}
                            <div
                              className="relative shrink-0 w-14 h-14 cursor-pointer group/avatar"
                              style={{ width: 56, height: 56, minWidth: 56, minHeight: 56, maxWidth: 56, maxHeight: 56 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setProfileDoctor(doc);
                              }}
                              title="Click to view full doctor profile"
                            >
                              <div
                                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-slate-800 dark:to-slate-850 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-sm overflow-hidden shadow-2xs group-hover/avatar:ring-2 group-hover/avatar:ring-indigo-400/50 transition-all"
                                style={{ width: 56, height: 56, minWidth: 56, minHeight: 56, maxWidth: 56, maxHeight: 56 }}
                              >
                                {avatarSrc ? (
                                  <img
                                    src={avatarSrc}
                                    alt={doc.name}
                                    className="w-full h-full object-cover rounded-2xl block"
                                    style={{ width: 56, height: 56, minWidth: 56, minHeight: 56, maxWidth: 56, maxHeight: 56, objectFit: 'cover' }}
                                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  doc.name.replace(/^(Dr\.?|Ms\.?|Mr\.?)\s+/i, '').charAt(0) || 'D'
                                )}
                              </div>
                              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900 z-10 pointer-events-none" title="Active Specialist" />
                            </div>

                            {/* Name & Specialty Info */}
                            <div className="flex-1 min-w-0 pr-6">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-[14px] leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {doc.name}
                                </h4>
                              </div>

                              {doc.qualification && (
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5" title={doc.qualification}>
                                  {doc.qualification}
                                </p>
                              )}

                              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 line-clamp-1 mt-0.5">
                                {doc.specialty}
                              </p>
                            </div>

                            {/* Radio / Checkmark Selection Button */}
                            <div className="absolute top-3.5 right-3.5 shrink-0">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${isSelected
                                  ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200 dark:ring-indigo-900/60'
                                  : 'border-2 border-slate-300 dark:border-slate-700 bg-transparent group-hover:border-slate-400'
                                  }`}
                              >
                                {isSelected && (
                                  <Check className="w-3 h-3 stroke-[3]" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Pills Row: Recommended + Experience + Duration + Hospital */}
                          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap text-[10px]">
                            {isRec && (
                              <span className="font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 text-amber-700 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 flex items-center gap-1 shadow-2xs">
                                <Sparkles className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400 fill-amber-500/20" />
                                {t('appointment.recommended', 'Recommended')}
                              </span>
                            )}

                            {doc.experience != null && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/60 dark:border-slate-700/80">
                                🎓 {doc.experience} {t('appointment.yrsExpLabel', 'yrs exp')}
                              </span>
                            )}

                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/60 dark:border-slate-700/80">
                              ⏱️ {effectiveDuration}m
                            </span>

                            {doc.hospitalName && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200/60 dark:border-slate-700/80 truncate max-w-[140px]" title={doc.hospitalName}>
                                📍 {doc.hospitalName}
                              </span>
                            )}

                            {doc.languagesKnown && doc.languagesKnown.length > 0 && (
                              <span className="text-slate-400 font-medium text-[10px] hidden sm:inline-flex items-center gap-1 ml-auto">
                                <Globe className="h-2.5 w-2.5 inline" /> {doc.languagesKnown.slice(0, 2).join(', ')}
                              </span>
                            )}
                          </div>

                          {/* Specialist Focus Callout */}
                          {noteText && (
                            <div
                              className={`mt-2.5 p-2.5 rounded-xl border text-xs transition-colors ${isDental
                                ? 'bg-cyan-50/70 dark:bg-cyan-950/20 border-cyan-200/70 dark:border-cyan-900/40'
                                : isMetabolic
                                  ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/40'
                                  : isPsychological
                                    ? 'bg-purple-50/70 dark:bg-purple-950/20 border-purple-200/70 dark:border-purple-900/40'
                                    : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/40'
                                }`}
                            >
                              <div
                                className={`font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 mb-0.5 ${isDental
                                  ? 'text-cyan-700 dark:text-cyan-400'
                                  : isMetabolic
                                    ? 'text-rose-700 dark:text-rose-400'
                                    : isPsychological
                                      ? 'text-purple-700 dark:text-purple-400'
                                      : 'text-amber-700 dark:text-amber-400'
                                  }`}
                              >
                                <span>{focusIcon}</span>
                                <span className="truncate">{focusTitle}</span>
                              </div>
                              <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-300 italic line-clamp-2">
                                "{noteText}"
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Pricing & Policy Footer */}
                        <div className="mt-3 pt-2.5 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap w-full">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                              ₹{doc.onlineConsultationFee || doc.consultationFee || 750}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              / {effectiveDuration}m
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 ml-auto">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProfileDoctor(doc);
                              }}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center gap-1 transition-all cursor-pointer hover:shadow-2xs"
                              title="View full doctor credentials, bio, and clinic details"
                            >
                              <Info className="w-2.5 h-2.5" />
                              <span>View Profile</span>
                            </button>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
                              <Video className="w-2.5 h-2.5" /> Online
                            </span>
                            {doc.offlineConsultationFee !== undefined && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-lg border border-purple-200/60 dark:border-purple-800/60">
                                <Building2 className="w-2.5 h-2.5" /> Clinic
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDoctor && (
                <>
                  {/* Modern Compact Consultation Type Selector */}
                  <div className="space-y-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {t('appointment.consultationType', 'Consultation Type')}
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setConsultationType('online')}
                        className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${consultationType === 'online'
                          ? 'bg-gradient-to-br from-indigo-50/80 to-white dark:from-slate-800 dark:to-slate-850 border-indigo-600 dark:border-indigo-500 shadow-xs ring-2 ring-indigo-500/15'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${consultationType === 'online' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                              <Video className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                              Online Video
                            </span>
                          </div>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${consultationType === 'online' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                            {consultationType === 'online' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                          </span>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-baseline justify-between text-[11px]">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">
                            ₹{selectedDoctor.onlineConsultationFee || selectedDoctor.consultationFee || 750}
                          </span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            In-App Call • {selectedDoctor.slotDuration || 30}m
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConsultationType('offline')}
                        className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${consultationType === 'offline'
                          ? 'bg-gradient-to-br from-purple-50/80 to-white dark:from-slate-800 dark:to-slate-850 border-purple-600 dark:border-purple-500 shadow-xs ring-2 ring-purple-500/15'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${consultationType === 'offline' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                              Hospital Visit
                            </span>
                          </div>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${consultationType === 'offline' ? 'border-purple-600 bg-purple-600' : 'border-slate-300 dark:border-slate-600'}`}>
                            {consultationType === 'offline' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                          </span>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-baseline justify-between text-[11px]">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate max-w-[90px]" title={selectedDoctor.hospitalName || 'HCG Cancer Hospital'}>
                            {selectedDoctor.hospitalName || 'HCG Hospital'}
                          </span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                            Hospital Portal
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {consultationType === 'offline' ? (
                    /* OFFLINE / HOSPITAL DIRECT BOOKING REDIRECT CARD */
                    <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-purple-50/70 via-indigo-50/30 to-white dark:from-slate-850 dark:to-slate-900 border border-purple-200/80 dark:border-purple-800/60 shadow-xs space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800/80 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0 shadow-2xs">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                            In-Person Hospital Consultation
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                            {selectedDoctor.hospitalName || 'HCG Cancer Hospital KR Road, Bangalore'}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            In-person clinic appointments with <strong>{selectedDoctor.name}</strong> directly at the hospital.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 space-y-1.5 text-xs">
                        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-snug">
                            {selectedDoctor.address || 'HCG Cancer Hospital, No 8, P Kalinga Rao Rd, Sampangi Rama Nagar, Bengaluru, Karnataka 560027'}
                          </span>
                        </div>
                        {selectedDoctor.workingHours && (
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[10px] pt-1 border-t border-slate-100 dark:border-slate-800">
                            <Clock className="w-3 h-3 text-purple-400 shrink-0" />
                            <span>OPD Hours: {selectedDoctor.workingHours}</span>
                          </div>
                        )}
                      </div>

                      <a
                        href={selectedDoctor.hospitalBookingUrl || 'https://www.hcgoncology.com/book-an-appointment/'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-md active:scale-[0.99]"
                      >
                        <span>Book Appointment at HCG Hospital</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
                        Redirects directly to HCG appointment booking portal.
                      </p>
                    </div>
                  ) : (
                    /* ONLINE VIDEO CONSULTATION IN-APP SCHEDULER */
                    <>
                      <div className="mt-3 mb-3">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5 text-indigo-500" /> {t('appointment.chooseDate', 'Choose a Date')}
                        </label>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                          {upcomingDates.map(d => {
                            const dateObj = new Date(d);
                            const isSelected = date === d;
                            const isHoliday = (selectedDoctor?.holidays || []).includes(d);
                            const dayIdx = dateObj.getDay();
                            const dayKey = dayIdx === 0 ? 'sun' : dayIdx === 1 ? 'mon' : dayIdx === 2 ? 'tue' : dayIdx === 3 ? 'wed' : dayIdx === 4 ? 'thu' : dayIdx === 5 ? 'fri' : 'sat';
                            const dayLabel = t(`appointment.${dayKey}`, dateObj.toLocaleDateString('en-US', { weekday: 'short' }));
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => { if (!isHoliday) setDate(d); }}
                                disabled={isHoliday}
                                className={`flex-shrink-0 flex flex-col items-center justify-center p-2.5 rounded-xl border-2 min-w-[65px] transition-all cursor-pointer ${isHoliday ? 'border-rose-100 dark:border-rose-950/30 bg-rose-50 dark:bg-rose-950/20 opacity-60 cursor-not-allowed' :
                                  isSelected ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs' : 'border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-200 dark:hover:border-slate-700'
                                  }`}
                              >
                                <span className={`text-[10px] uppercase font-bold tracking-widest ${isHoliday ? 'text-rose-400' : isSelected ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                                  {dayLabel}
                                </span>
                                <span className={`text-lg font-black mt-0.5 ${isHoliday ? 'text-rose-700 dark:text-rose-400' : ''}`}>
                                  {dateObj.getDate()}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('appointment.reasonForAppt', 'Reason for Appointment')}</label>
                        <select
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-400 font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
                        >
                          {reasons.map(r => (
                            <option key={r} value={r} className="dark:bg-slate-900 dark:text-slate-100">{r}</option>
                          ))}
                        </select>
                      </div>

                      {date && (
                        <div className="space-y-2 mt-2">
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('appointment.selectTime', 'Select Consultation Time')}</label>
                          {availableSlots.length === 0 ? (
                            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3 text-xs text-amber-600 dark:text-amber-450 font-bold">
                              {t('appointment.noSlotsAvailable', 'No slots available on this day. Please pick another date.')}
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
                                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer shadow-2xs ${!isAvailable
                                      ? 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800/80 text-slate-400 dark:text-slate-650 cursor-not-allowed opacity-60'
                                      : selectedSlot === slotTime
                                        ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-100 dark:ring-indigo-950/50'
                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850'
                                      }`}
                                  >
                                    <Clock className="w-3 h-3 opacity-65" /> {slotTime} {!isAvailable && (slotObj.isAvailable === false ? `(${t('appointment.booked', 'Booked')})` : `(${t('appointment.past', 'Past')})`)}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes to Doctor — shown after slot selected */}
                      {selectedSlot && (
                        <div className="border border-indigo-100 dark:border-slate-800 bg-indigo-50/40 dark:bg-slate-900/40 rounded-2xl p-3.5 mt-3">
                          <label className="block text-xs font-bold text-indigo-400 dark:text-indigo-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            📝 {t('appointment.notesToDoctor', 'Notes for the Doctor (Optional)')}
                          </label>
                          <textarea
                            value={patientNotes}
                            onChange={e => setPatientNotes(e.target.value)}
                            placeholder={t('appointment.notesPlaceholder', 'Share any symptoms, concerns or context the doctor should know before your visit...')}
                            rows={2}
                            maxLength={500}
                            className="w-full bg-white dark:bg-slate-950 border border-indigo-100 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-950/50 focus:border-indigo-400 text-slate-700 dark:text-slate-200 resize-none leading-relaxed"
                          />
                          <p className="text-[10px] text-slate-300 dark:text-slate-500 text-right mt-0.5">{patientNotes.length}/500</p>
                        </div>
                      )}

                      <button
                        onClick={handleBook}
                        disabled={loading || !selectedSlot}
                        className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 mt-4 cursor-pointer"
                      >
                        {loading ? t('appointment.booking', 'Booking...') : t('appointment.confirmBooking', 'Confirm & Book Video Appointment')}
                      </button>
                    </>
                  )}

                  {/* Pending appointment warning modal */}
                  {showPendingWarning && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
                        <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                          <span className="text-3xl">⚠️</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-800 mb-2">{t('diag.pendingApptExists', 'Pending Appointment Exists')}</h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                          {t('appt.alreadyHaveA', 'You already have a')} <strong className="text-amber-600">{t('appt.pendingApptWord', 'pending appointment')}</strong> {t('appt.waitingApprovalConfirm', 'waiting for doctor approval. Are you sure you want to book another one?')}
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowPendingWarning(false)}
                            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-colors cursor-pointer"
                          >
                            {t('common.cancel', 'Cancel')}
                          </button>
                          <button
                            onClick={() => { setShowPendingWarning(false); confirmBook(); }}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-bold text-white shadow-sm transition-colors cursor-pointer"
                          >
                            {t('appt.bookAnyway', 'Book Anyway')}
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
        <div className="lg:col-span-1 min-w-0 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5 transition-colors duration-300">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" /> {t('appointment.upcomingAndPastVisits', 'Upcoming & Past Visits')}
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[500px]">
              {appointments.map(appt => (
                <div key={appt._id} className="border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {appt.doctorId?.name
                          ? (/^(Dr|Ms|Mr|Mrs)\.?/i.test(appt.doctorId.name) ? appt.doctorId.name : `Dr. ${appt.doctorId.name}`)
                          : (appt.doctorName || 'Doctor')}
                      </h4>
                      <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wide">{formatDate(appt.date)} {t('common.at', 'at')} {appt.time}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${appt.paymentStatus === 'failed'
                        ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 dark:border-rose-900/30'
                        : (appt.status === 'pending' || appt.status === 'confirmed') && isExpired(appt.date, appt.time)
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-250 dark:border-slate-700'
                          : appt.status === 'confirmed'
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                            : appt.status === 'completed'
                              ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                              : appt.status === 'cancelled'
                                ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450'
                                : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                        }`}>
                        {appt.paymentStatus === 'failed'
                          ? t('appointment.paymentFailed', 'Payment Failed')
                          : (appt.status === 'pending' || appt.status === 'confirmed') && isExpired(appt.date, appt.time)
                            ? t('appointment.expired', 'Expired')
                            : appt.status === 'confirmed'
                              ? t('appointment.confirmed', 'Confirmed')
                              : appt.status === 'completed'
                                ? t('appointment.completed', 'Completed')
                                : appt.status === 'cancelled'
                                  ? t('appointment.cancelled', 'Cancelled')
                                  : t('appointment.pending', 'Pending')}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase ${appt.type === 'online' ? 'bg-teal-50 dark:bg-teal-950/20 text-teal-600' : 'bg-purple-50 dark:bg-purple-950/20 text-purple-600'}`}>
                        {appt.type === 'online' ? t('appointment.online', 'Online') : t('appointment.offline', 'Offline')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-655 dark:text-slate-350"><strong className="text-slate-400">{t('diag.reason', 'Reason:')}</strong> {getLocalizedReason(appt.reason)}</p>

                  {appt.patientNotes?.trim() && (
                    <div className="bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">{t('appt.myNotesToDoctor', '📝 My Notes to Doctor:')}</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{appt.patientNotes}</p>
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
                          ? t('appt.openCalendarInvite', 'Open Google Calendar Invite')
                          : t('appt.joinGoogleMeet', 'Join Google Meet')}
                      </a>
                    ) : (
                      <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 space-y-1.5">
                        <p className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">{t('appt.clinicInstructions', '🏥 Clinic Instructions from Doctor:')}</p>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{appt.meetingLink}</p>
                      </div>
                    )
                  )}

                  {appt.notes && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-655 dark:text-slate-300 mt-2">
                      <strong className="text-slate-500">{t('diag.consultationNotes', 'Consultation Notes:')}</strong>
                      <p className="mt-1 font-mono leading-relaxed">{appt.notes}</p>
                    </div>
                  )}

                  {appt.prescriptionText && (
                    <div className="bg-slate-100/80 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-300 mt-2 font-sans leading-relaxed">
                      <strong className="text-slate-500">{t('diag.prescriptionNotes', 'Prescription Notes:')}</strong>
                      <p className="mt-1 font-medium">{appt.prescriptionText}</p>
                    </div>
                  )}

                  {appt.prescriptionUrl && (
                    <button
                      onClick={() => handleDownloadPrescription(appt._id, appt.prescriptionUrl)}
                      disabled={downloadingPrescriptionId === appt._id}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold mt-2 shadow-sm transition-all"
                    >
                      {downloadingPrescriptionId === appt._id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{t('common.downloading', 'Downloading...')}</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5" />
                          <span>{t('diag.viewPrescriptionAttachment', 'Download Prescription Attachment')}</span>
                        </>
                      )}
                    </button>
                  )}

                  {(appt.invoiceUrl || appt.status === 'completed' || appt.paymentStatus === 'paid') && (
                    <button
                      onClick={() => handleDownloadAppointmentInvoice(appt._id)}
                      disabled={downloadingApptInvoiceId === appt._id}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold mt-2 shadow-sm transition-all"
                    >
                      {downloadingApptInvoiceId === appt._id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{t('common.downloading', 'Downloading...')}</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>{t('diag.downloadInvoicePdf', 'Download Invoice PDF')}</span>
                        </>
                      )}
                    </button>
                  )}

                  {appt.status === 'completed' && !appt.hasFeedback && (
                    <button
                      onClick={() => setRatingApptId(appt._id)}
                      className="w-full py-2 text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors mt-2"
                    >
                      {t('diag.giveFeedbackRating', 'Give Feedback & Rating')}
                    </button>
                  )}

                  {appt.feedback && (
                    <div className="bg-amber-50/60 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-350 mt-2">
                      <div className="flex items-center gap-1 text-amber-500 font-bold mb-1">
                        <span>{'★'.repeat(appt.feedback.rating)}{'☆'.repeat(5 - appt.feedback.rating)}</span>
                        <span className="text-[10px] text-slate-400 font-bold">({appt.feedback.rating}/5)</span>
                      </div>
                      <p className="italic text-slate-655 dark:text-slate-400">"{appt.feedback.feedbackText}"</p>
                    </div>
                  )}
                </div>
              ))}

              {appointments.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">{t('diag.noApptHistory', 'No appointment history found.')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {ratingApptId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> {t('diag.consultationFeedback', 'Consultation Feedback')}
            </h3>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">{t('diag.ratingLabel', 'Rating')}</label>
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
                <label className="block text-xs font-bold text-slate-500 mb-1">{t('diag.yourReview', 'Your review')}</label>
                <textarea
                  required
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={t('shareExperiencePlaceholder')}
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
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
                >
                  {t('common.submit', 'Submit')}
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
              <h3 className="text-base font-bold text-slate-800">{t('diag.redirectingPayment', 'Redirecting to Payment Gateway')}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                To confirm your {consultationType} consultation with <strong>Dr. {selectedDoctor?.name}</strong>, {t('paymentRedirectNote')} <strong>Rs. {consultationType === 'online' ? selectedDoctor?.onlineConsultationFee : selectedDoctor?.offlineConsultationFee}</strong>.
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

      {/* Doctor Full Profile Inspection Modal */}
      {profileDoctor && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setProfileDoctor(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Banner */}
            <div className="relative p-6 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setProfileDoctor(null)}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4 pr-10">
                <div
                  className="w-18 h-18 min-w-[72px] min-h-[72px] rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-slate-800 dark:to-slate-850 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xl overflow-hidden shadow-sm shrink-0 relative"
                  style={{ width: 72, height: 72, minWidth: 72, minHeight: 72 }}
                >
                  {getAvatarUrl(profileDoctor.avatar, apiUrl) ? (
                    <img
                      src={getAvatarUrl(profileDoctor.avatar, apiUrl)!}
                      alt={profileDoctor.name}
                      className="w-full h-full object-cover rounded-2xl block"
                      style={{ width: 72, height: 72, objectFit: 'cover' }}
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    profileDoctor.name.replace(/^(Dr\.?|Ms\.?|Mr\.?)\s+/i, '').charAt(0) || 'D'
                  )}
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      {profileDoctor.name}
                    </h3>
                    {isRecommendedDoctor(profileDoctor) && (
                      <span className="font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[11px] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" /> Recommended
                      </span>
                    )}
                  </div>

                  {profileDoctor.qualification && (
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                      🎓 {profileDoctor.qualification}
                    </p>
                  )}

                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {profileDoctor.specialty}
                  </p>

                  <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px]">
                    {profileDoctor.experience != null && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                        ⏳ {profileDoctor.experience} yrs experience
                      </span>
                    )}
                    {profileDoctor.slotDuration && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                        ⏱️ {profileDoctor.slotDuration} mins session
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] text-slate-700 dark:text-slate-200 text-sm">
              {/* Focus Banner */}
              {(profileDoctor.focusTitle || profileDoctor.sleepEvaluationNote) && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                  <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1">
                    <span>{profileDoctor.focusIcon || '🩺'}</span>
                    <span>{profileDoctor.focusTitle || 'Clinical Focus Area'}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "{profileDoctor.sleepEvaluationNote || profileDoctor.focusTitle}"
                  </p>
                </div>
              )}

              {/* Clinical Biography / About */}
              {profileDoctor.description && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" /> About Specialist
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line bg-slate-50/60 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {profileDoctor.description}
                  </p>
                </div>
              )}

              {/* Hospital & Location */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Practice & Clinic Location
                </h4>
                <div className="bg-slate-50/60 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                  {profileDoctor.hospitalName && (
                    <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>📍 Hospital/Clinic:</span>
                      <span>{profileDoctor.hospitalName}</span>
                    </p>
                  )}
                  {profileDoctor.address && (
                    <p className="text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                      <span>🏢 Address:</span>
                      <span>{profileDoctor.address}</span>
                    </p>
                  )}
                  {profileDoctor.workingHours && (
                    <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span>🕒 Timing:</span>
                      <span>{profileDoctor.workingHours}</span>
                    </p>
                  )}
                  {profileDoctor.availableDays && profileDoctor.availableDays.length > 0 && (
                    <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span>📅 Available Days:</span>
                      <span>{profileDoctor.availableDays.join(', ')}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Languages Spoken */}
              {profileDoctor.languagesKnown && profileDoctor.languagesKnown.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" /> Languages Spoken
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profileDoctor.languagesKnown.map((lang: string) => (
                      <span
                        key={lang}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200/60 dark:border-slate-700"
                      >
                        🗣️ {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Consultation Fees & Overtime Policy */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> Consultation Fees & Policy
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                    <span className="block font-bold text-emerald-800 dark:text-emerald-300 text-[11px] uppercase">Online Video Visit</span>
                    <span className="text-lg font-black text-emerald-900 dark:text-emerald-100 mt-0.5 block">
                      ₹{profileDoctor.onlineConsultationFee || profileDoctor.consultationFee || 750}
                    </span>
                    <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400">Duration: {profileDoctor.slotDuration || 30} mins</span>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                    <span className="block font-bold text-purple-800 dark:text-purple-300 text-[11px] uppercase">In-Clinic Visit</span>
                    <span className="text-lg font-black text-purple-900 dark:text-purple-100 mt-0.5 block">
                      ₹{profileDoctor.offlineConsultationFee || profileDoctor.consultationFee || 750}
                    </span>
                    <span className="text-[10px] text-purple-700/80 dark:text-purple-400">Duration: {profileDoctor.slotDuration || 30} mins</span>
                  </div>
                </div>

                {(profileDoctor.feePolicy || profileDoctor.extraFeePer15Min) && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span className="text-amber-500 text-sm">ℹ️</span>
                    <span>
                      {profileDoctor.feePolicy || `Additional ₹${profileDoctor.extraFeePer15Min}/- per 15 minutes applies if session exceeds ${profileDoctor.slotDuration || 30} mins.`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setProfileDoctor(null)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer transition-all"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDoctor(profileDoctor);
                  setProfileDoctor(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Select Specialist & Choose Slot</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
