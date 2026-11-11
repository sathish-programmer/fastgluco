import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, LogOut, FileText, User, Settings, 
  Users, BarChart3, Star, CheckCircle, ChevronLeft, ChevronRight,
  Plus, Trash2, Send, Download, Upload, Pill, Eye, MessageSquare,
  FileCheck, X
} from 'lucide-react';

// Shared date formatter — handles ISO strings, YYYY-MM-DD, and timestamps
const formatDate = (dateStr: string | undefined | null, withTime = false): string => {
  if (!dateStr) return '--';
  try {
    // If it looks like YYYY-MM-DD (no time component), parse as local date
    const isPlain = /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
    const date = isPlain
      ? new Date(dateStr + 'T00:00:00')
      : new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const opts: Intl.DateTimeFormatOptions = withTime
      ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-IN', opts);
  } catch {
    return dateStr;
  }
};

interface DoctorPortalProps {
  apiUrl: string;
  token: string;
  onLogout: () => void;
  adminReturn?: () => void;
  adminModeDoctorName?: string;
  allDoctors?: any[];
  onSwitchDoctor?: (docId: string) => void;
}

type TabType = 'dashboard' | 'appointments' | 'calendar' | 'patients' | 'availability' | 'notes' | 'prescriptions' | 'feedback' | 'profile' | 'settings';

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ apiUrl, token, onLogout, adminReturn, adminModeDoctorName, allDoctors, onSwitchDoctor }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [calendarTab, setCalendarTab] = useState<'month' | 'week' | 'day'>('month');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedApptId, setExpandedApptId] = useState<string | null>(null);

  // Assigned Issues lists
  const [assignedStains, setAssignedStains] = useState<any[]>([]);
  const [assignedLabs, setAssignedLabs] = useState<any[]>([]);
  const [stainReviewNotes, setStainReviewNotes] = useState<Record<string, string>>({});
  const [labReviewNotes, setLabReviewNotes] = useState<Record<string, string>>({});
  const [submittingStainNotesId, setSubmittingStainNotesId] = useState<string | null>(null);
  const [submittingLabNotesId, setSubmittingLabNotesId] = useState<string | null>(null);

  // Profile Form States
  const [profileForm, setProfileForm] = useState({
    name: '', qualification: '', specialty: '', experience: 0, 
    hospitalName: '', registrationNumber: '', description: '', 
    consultationFee: 0, phone: '', email: '', address: '', 
    languagesKnown: [] as string[], avatar: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Settings Form States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [workingHours, setWorkingHours] = useState('09:00 - 17:00');
  const [availableDays, setAvailableDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [slotDuration, setSlotDuration] = useState(30);
  const [maxAppointmentsPerSlot, setMaxAppointmentsPerSlot] = useState(1);
  const [onlineConsultationFee, setOnlineConsultationFee] = useState(0);
  const [offlineConsultationFee, setOfflineConsultationFee] = useState(0);
  const [visibility, setVisibility] = useState(true);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailsEnabled, setEmailsEnabled] = useState(true);
  const [deaddictionHelpline, setDeaddictionHelpline] = useState('1800-11-0031');
  const [savingSettings, setSavingSettings] = useState(false);
  const [dbStats, setDbStats] = useState<any>({
    onlineRevenue: 0,
    offlineRevenue: 0,
    totalRevenue: 0,
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0
  });

  // Note/Prescription consultation editor states
  const [selectedApptForNotes, setSelectedApptForNotes] = useState<any | null>(null);
  const [consultNotes, setConsultNotes] = useState('');
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState('');
  const [dietaryAdvice, setDietaryAdvice] = useState('');
  const [lifestyleAdvice, setLifestyleAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicinesList, setMedicinesList] = useState<Array<{
    name: string;
    dosage: string;
    frequency: string;
    timing: string;
    duration: string;
    instructions: string;
  }>>([
    { name: '', dosage: '', frequency: '1-0-1', timing: 'After Food', duration: '5 days', instructions: '' }
  ]);
  const [prescriptionText, setPrescriptionText] = useState('');
  const [prescriptionUrl, setPrescriptionUrl] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [isGeneratingPrescription, setIsGeneratingPrescription] = useState(false);
  const [completingAppt, setCompletingAppt] = useState<any | null>(null);

  // Message Patient Modal state
  const [messagePatientModal, setMessagePatientModal] = useState<{
    isOpen: boolean;
    patientId: string;
    patientName: string;
    appointmentId?: string;
  } | null>(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Patient History Drawer/Modal state
  const [patientHistoryModal, setPatientHistoryModal] = useState<any | null>(null);

  // Notes tab filter
  const [notesFilter, setNotesFilter] = useState<'all' | 'confirmed' | 'completed'>('all');

  // Calendar dynamic date state
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Accept/Custom link states
  const [acceptingAppt, setAcceptingAppt] = useState<any | null>(null);
  const [customMeetUrl, setCustomMeetUrl] = useState('');
  const [savingMeetUrl, setSavingMeetUrl] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [token]);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAppointments(),
      fetchDoctorProfile(),
      fetchFeedback(),
      fetchDashboardStats(),
      fetchAssignedStainReviews(),
      fetchAssignedLabBookings()
    ]);
    setLoading(false);
  };

  const fetchAssignedStainReviews = async () => {
    try {
      const res = await fetch(`${apiUrl}/doctor/assigned-stain-reviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAssignedStains(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAssignedLabBookings = async () => {
    try {
      const res = await fetch(`${apiUrl}/doctor/assigned-lab-bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAssignedLabs(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitStainReviewNotes = async (logId: string) => {
    const notes = stainReviewNotes[logId];
    if (!notes || !notes.trim()) {
      alert('Please enter clinical advice notes.');
      return;
    }
    setSubmittingStainNotesId(logId);
    try {
      const res = await fetch(`${apiUrl}/doctor/assigned-stain-reviews/${logId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ doctorNotes: notes })
      });
      if (res.ok) {
        alert('Stain review notes submitted!');
        fetchAssignedStainReviews();
      } else {
        alert('Failed to submit notes.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingStainNotesId(null);
    }
  };

  const submitLabBookingNotes = async (bookingId: string) => {
    const notes = labReviewNotes[bookingId];
    if (!notes || !notes.trim()) {
      alert('Please enter doctor notes.');
      return;
    }
    setSubmittingLabNotesId(bookingId);
    try {
      const res = await fetch(`${apiUrl}/doctor/assigned-lab-bookings/${bookingId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ doctorNotes: notes })
      });
      if (res.ok) {
        alert('Lab report notes submitted!');
        fetchAssignedLabBookings();
      } else {
        alert('Failed to submit notes.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingLabNotesId(null);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/doctor/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setDbStats(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

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

  const fetchDoctorProfile = async () => {
    try {
      const res = await fetch(`${apiUrl}/doctor/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDoctorInfo(data);
        setProfileForm({
          name: data.name || '',
          qualification: data.qualification || '',
          specialty: data.specialty || '',
          experience: data.experience || 0,
          hospitalName: data.hospitalName || '',
          registrationNumber: data.registrationNumber || '',
          description: data.description || '',
          consultationFee: data.consultationFee ?? data.onlineConsultationFee ?? 0,
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          languagesKnown: data.languagesKnown || [],
          avatar: data.avatar || ''
        });

        setWorkingHours(data.workingHours || '09:00 - 17:00');
        setAvailableDays(data.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
        setSlotDuration(data.slotDuration || 30);
        setOnlineConsultationFee(data.onlineConsultationFee || 0);
        setOfflineConsultationFee(data.offlineConsultationFee || 0);
        setVisibility(data.visibility !== false);
        setNotificationsEnabled(data.notificationPreferences?.pushAlerts !== false);
        setEmailsEnabled(data.notificationPreferences?.emailAlerts !== false);
        setHolidays(data.holidays || []);
        setDeaddictionHelpline(data.deaddictionHelpline || '1800-11-0031');

        // Fetch max appointments limit from availability
        try {
          const availRes = await fetch(`${apiUrl}/doctor/availability`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (availRes.ok) {
            const availData = await availRes.json();
            setMaxAppointmentsPerSlot(availData.maxAppointmentsPerSlot || 1);
          }
        } catch (err) {
          console.error('Error loading doctor availability settings:', err);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFeedback = async () => {
    try {
      const res = await fetch(`${apiUrl}/doctor/feedback`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setFeedbacks(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        ...profileForm,
        onlineConsultationFee: profileForm.consultationFee,
        offlineConsultationFee: profileForm.consultationFee,
        languagesKnown: typeof profileForm.languagesKnown === 'string'
          ? (profileForm.languagesKnown as string).split(',').map(s => s.trim()).filter(Boolean)
          : profileForm.languagesKnown
      };
      const res = await fetch(`${apiUrl}/doctor/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Profile details updated successfully!');
        fetchDoctorProfile();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    setSavingSettings(true);
    try {
      const payload: any = {
        workingHours,
        availableDays,
        slotDuration,
        maxAppointmentsPerSlot,
        onlineConsultationFee,
        offlineConsultationFee,
        visibility,
        holidays,
        deaddictionHelpline,
        notificationPreferences: {
          pushAlerts: notificationsEnabled,
          emailAlerts: emailsEnabled
        }
      };
      if (newPassword) payload.password = newPassword;

      const res = await fetch(`${apiUrl}/doctor/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Settings updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
        fetchDoctorProfile();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const resetPrescriptionFields = () => {
    setConsultNotes('');
    setClinicalDiagnosis('');
    setDietaryAdvice('');
    setLifestyleAdvice('');
    setFollowUpDate('');
    setMedicinesList([
      { name: '', dosage: '', frequency: '1-0-1', timing: 'After Food', duration: '5 days', instructions: '' }
    ]);
    setPrescriptionText('');
    setPrescriptionUrl('');
  };

  const openPrescriptionModalForAppt = (appt: any) => {
    setCompletingAppt(appt);
    setConsultNotes(appt.notes || '');
    setClinicalDiagnosis(appt.diagnosis || appt.reason || '');
    setDietaryAdvice(appt.dietaryAdvice || '');
    setLifestyleAdvice(appt.lifestyleAdvice || '');
    setFollowUpDate(appt.followUpDate || '');
    setPrescriptionUrl(appt.prescriptionUrl || '');
    setPrescriptionText(appt.prescriptionText || '');
    
    if (Array.isArray(appt.medicines) && appt.medicines.length > 0) {
      setMedicinesList(appt.medicines.map((m: any) => ({
        name: m.name || '',
        dosage: m.dosage || '',
        frequency: m.frequency || '1-0-1',
        timing: m.timing || 'After Food',
        duration: m.duration || '5 days',
        instructions: m.instructions || ''
      })));
    } else {
      setMedicinesList([
        { name: '', dosage: '', frequency: '1-0-1', timing: 'After Food', duration: '5 days', instructions: '' }
      ]);
    }
  };

  const handleAddMedicineRow = () => {
    setMedicinesList(prev => [
      ...prev,
      { name: '', dosage: '', frequency: '1-0-1', timing: 'After Food', duration: '5 days', instructions: '' }
    ]);
  };

  const handleRemoveMedicineRow = (index: number) => {
    setMedicinesList(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ name: '', dosage: '', frequency: '1-0-1', timing: 'After Food', duration: '5 days', instructions: '' }];
    });
  };

  const handleUpdateMedicine = (index: number, field: string, value: string) => {
    setMedicinesList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleGeneratePrescriptionPdf = async () => {
    const targetAppt = completingAppt || selectedApptForNotes;
    if (!targetAppt) return;
    const validMedicines = medicinesList.filter(m => m.name && m.name.trim());
    setIsGeneratingPrescription(true);
    try {
      const res = await fetch(`${apiUrl}/doctor/appointments/${targetAppt._id}/prescription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: consultNotes,
          diagnosis: clinicalDiagnosis || targetAppt.reason,
          dietaryAdvice,
          lifestyleAdvice,
          followUpDate,
          medicines: validMedicines,
          prescriptionText
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPrescriptionUrl(data.prescriptionUrl);
        alert('Official medical prescription PDF generated successfully!');
        fetchAppointments();
      } else {
        const err = await res.json();
        alert(err.message || 'Error generating prescription PDF.');
      }
    } catch (e) {
      console.error(e);
      alert('Server error generating prescription PDF.');
    } finally {
      setIsGeneratingPrescription(false);
    }
  };

  const handleUploadPrescriptionFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetAppt = completingAppt || selectedApptForNotes;
    if (!targetAppt || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsGeneratingPrescription(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${apiUrl}/doctor/appointments/${targetAppt._id}/prescription-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setPrescriptionUrl(data.prescriptionUrl);
        alert('Prescription file uploaded and saved to consultation!');
        fetchAppointments();
      } else {
        const err = await res.json();
        alert(err.message || 'Error uploading file.');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading prescription file.');
    } finally {
      setIsGeneratingPrescription(false);
    }
  };

  const handleSendMessageToPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messagePatientModal || !messageBody.trim()) {
      alert('Please enter your message.');
      return;
    }
    setSendingMessage(true);
    try {
      const endpoint = messagePatientModal.appointmentId 
        ? `${apiUrl}/doctor/appointments/${messagePatientModal.appointmentId}/message`
        : `${apiUrl}/doctor/patients/${messagePatientModal.patientId}/message`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: messagePatientModal.patientId,
          subject: messageSubject,
          message: messageBody
        })
      });

      if (res.ok) {
        alert(`Message sent to ${messagePatientModal.patientName} via Push Notification and Email!`);
        setMessagePatientModal(null);
        setMessageSubject('');
        setMessageBody('');
      } else {
        const err = await res.json();
        alert(err.message || 'Error sending message.');
      }
    } catch (e) {
      console.error(e);
      alert('Server error sending message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleConsultNotesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApptForNotes) return;
    if (!consultNotes.trim() && !clinicalDiagnosis.trim()) {
      alert('Clinical notes or diagnosis summary are required.');
      return;
    }
    setSavingNotes(true);
    try {
      const validMedicines = medicinesList.filter(m => m.name && m.name.trim());
      const res = await fetch(`${apiUrl}/doctor/appointments/${selectedApptForNotes._id}/consultation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: consultNotes,
          diagnosis: clinicalDiagnosis,
          dietaryAdvice,
          lifestyleAdvice,
          followUpDate,
          medicines: validMedicines,
          prescriptionText,
          prescriptionUrl,
          generatePdf: true,
          status: selectedApptForNotes.status === 'confirmed' ? 'completed' : selectedApptForNotes.status
        })
      });
      if (res.ok) {
        alert('Consultation details & prescription saved successfully! Confirmation sent to patient.');
        setSelectedApptForNotes(null);
        resetPrescriptionFields();
        fetchAppointments();
        fetchDashboardStats();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Error saving consultation.');
      }
    } catch (e) {
      console.error(e);
      alert('Server error. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handlePopupNotesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingAppt) return;
    if (!consultNotes.trim() && !clinicalDiagnosis.trim()) {
      alert('Clinical notes or diagnosis summary are required.');
      return;
    }
    setSavingNotes(true);
    try {
      const validMedicines = medicinesList.filter(m => m.name && m.name.trim());
      const res = await fetch(`${apiUrl}/doctor/appointments/${completingAppt._id}/consultation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: consultNotes,
          diagnosis: clinicalDiagnosis,
          dietaryAdvice,
          lifestyleAdvice,
          followUpDate,
          medicines: validMedicines,
          prescriptionText,
          prescriptionUrl,
          generatePdf: true,
          status: completingAppt.status === 'confirmed' ? 'completed' : completingAppt.status
        })
      });
      if (res.ok) {
        alert('Consultation & Medical Prescription saved successfully! Patient notified.');
        setCompletingAppt(null);
        resetPrescriptionFields();
        fetchAppointments();
        fetchDashboardStats();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Error marking appointment as completed.');
      }
    } catch (e) {
      console.error(e);
      alert('Server error. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAcceptAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingAppt) return;
    setSavingMeetUrl(true);
    try {
      const res = await fetch(`${apiUrl}/doctor/appointments/${acceptingAppt._id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ meetingLink: customMeetUrl })
      });
      if (res.ok) {
        setAcceptingAppt(null);
        setCustomMeetUrl('');
        fetchAppointments();
      } else {
        alert('Error accepting appointment.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingMeetUrl(false);
    }
  };

  const handleRejectAppointment = async (apptId: string) => {
    if (!window.confirm('Reject appointment request?')) return;
    try {
      const res = await fetch(`${apiUrl}/doctor/appointments/${apptId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchAppointments();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleDay = (day: string) => {
    setAvailableDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleAddHoliday = () => {
    if (!newHoliday || holidays.includes(newHoliday)) return;
    setHolidays([...holidays, newHoliday]);
    setNewHoliday('');
  };

  const handleRemoveHoliday = (h: string) => {
    setHolidays(holidays.filter(x => x !== h));
  };

  const getUniquePatients = () => {
    const patientMap = new Map<string, any>();
    appointments.forEach(appt => {
      if (appt.userId && appt.userId._id) {
        const pId = appt.userId._id;
        if (!patientMap.has(pId)) {
          patientMap.set(pId, {
            ...appt.userId,
            lastVisit: appt.date,
            lastReason: appt.reason,
            latestAppt: appt,
            allAppointments: [appt]
          });
        } else {
          const existing = patientMap.get(pId);
          existing.allAppointments.push(appt);
          if (new Date(appt.date) >= new Date(existing.lastVisit)) {
            existing.lastVisit = appt.date;
            existing.lastReason = appt.reason;
            existing.latestAppt = appt;
          }
        }
      }
    });
    return Array.from(patientMap.values());
  };

  const getGoogleCalendarUrl = (appt: any) => {
    if (!appt) return '#';
    const title = encodeURIComponent(`Consultation: ${appt.userId?.name || 'Patient'}`);
    const dateClean = appt.date.replace(/-/g, '');
    const timeClean = appt.time.replace(/:/g, '');
    
    // Compute end time (add 30 minutes)
    const [h, m] = appt.time.split(':').map(Number);
    let endH = h;
    let endM = m + 30;
    if (endM >= 60) {
      endH += 1;
      endM -= 60;
    }
    const endHStr = String(endH).padStart(2, '0');
    const endMStr = String(endM).padStart(2, '0');
    const endTimeClean = `${endHStr}${endMStr}00`;
    
    const dates = `${dateClean}T${timeClean}00/${dateClean}T${endTimeClean}`;
    const details = encodeURIComponent(`Patient Name: ${appt.userId?.name || 'N/A'}\nReason: ${appt.reason || 'Consultation'}\nNotes: ${appt.patientNotes || 'None'}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
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

  const stats = {
    todayAppointmentsCount: appointments.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status !== 'cancelled').length,
    pendingApprovalsCount: appointments.filter(a => a.status === 'pending').length,
    completedConsultations: appointments.filter(a => a.status === 'completed').length,
    totalRegisteredPatients: getUniquePatients().length
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans antialiased">
      {adminReturn && (
        <header className="bg-slate-900 text-white px-6 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs shrink-0 z-30 shadow-md">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30 text-[10px] tracking-wider uppercase">
              Admin Impersonation Mode
            </span>
            <span className="text-slate-300">
              Managing Doctor Dashboard for: <strong className="text-white">{doctorInfo?.name || adminModeDoctorName || 'Specialist'}</strong>
            </span>
            {allDoctors && allDoctors.length > 0 && onSwitchDoctor && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-[11px] text-slate-400 font-bold">Switch:</span>
                <select
                  value={doctorInfo?._id || allDoctors.find((d: any) => d.name === (doctorInfo?.name || adminModeDoctorName))?._id || ''}
                  onChange={(e) => {
                    const nextDocId = e.target.value;
                    if (nextDocId) onSwitchDoctor(nextDocId);
                  }}
                  className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none cursor-pointer hover:bg-slate-700 transition-colors"
                >
                  {allDoctors.map((d: any) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.specialty || d.specialization || 'Consultant'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button
            onClick={adminReturn}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer text-xs active:scale-95 shrink-0"
          >
            <span>← Return to Admin Panel</span>
          </button>
        </header>
      )}

      <div className="flex-1 flex min-h-0">
      
      {/* 1. COLLAPSIBLE SIDEBAR PANEL */}
      <aside className={`bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 transition-all ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div>
          {/* Brand Logo Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold shrink-0">🩺</div>
              {!sidebarCollapsed && <span className="font-extrabold text-white text-sm tracking-tight truncate">Clinical Portal</span>}
            </div>
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-slate-500 hover:text-white hidden md:block"
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {[
              { key: 'dashboard', label: 'Overview', icon: BarChart3 },
              { key: 'appointments', label: 'Appointments', icon: Calendar },
              { key: 'calendar', label: 'Calendar', icon: Calendar },
              { key: 'patients', label: 'My Patients', icon: Users },
              { key: 'assigned-reviews', label: 'Assigned Issues', icon: FileText, count: assignedStains.filter(s => !s.reviewed).length + assignedLabs.filter(l => !l.doctorNotes).length },
              { key: 'availability', label: 'Availability', icon: Clock },
              { key: 'notes', label: 'Consultation Notes', icon: FileText },
              { key: 'feedback', label: 'Feedbacks', icon: Star },
              { key: 'profile', label: 'My Profile', icon: User },
              { key: 'settings', label: 'Settings', icon: Settings }
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key as any)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === item.key ? 'bg-primary text-white shadow-md shadow-primary/20' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.count !== undefined && item.count > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/20 transition-all`}
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 min-w-0 overflow-y-auto px-8 py-6">
        
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-black text-slate-800">
                  {doctorInfo?.name
                    ? (/^(Dr|Ms|Mr|Mrs)\.?\s+/i.test(doctorInfo.name) ? doctorInfo.name : `Dr. ${doctorInfo.name}`)
                    : 'Consultant'}
                </h1>
                <span className="text-[10px] text-indigo-650 font-bold uppercase tracking-wider">{profileForm.specialty || 'General Practitioner'}</span>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{new Date().toDateString()}</span>
            </div>

            {/* TAB CONTENT: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Modern Hero Greeting Banner */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">Clinician Portal</span>
                    <h2 className="text-xl md:text-2xl font-black tracking-tight">
                      Welcome back, {doctorInfo?.name
                        ? (/^(Dr|Ms|Mr|Mrs)\.?\s+/i.test(doctorInfo.name) ? doctorInfo.name : `Dr. ${doctorInfo.name}`)
                        : 'Doctor'}!
                    </h2>
                    <p className="text-slate-350 text-xs font-semibold max-w-md">Access patient stain tracker logs, schedule consultations, diagnostic reports, and manage availability settings.</p>
                  </div>
                  <div className="flex gap-4 self-end md:self-auto shrink-0 bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl">
                    <div className="text-center">
                      <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">Visits Pending</span>
                      <strong className="text-xl font-black text-white">{dbStats.upcomingAppointments || 0}</strong>
                    </div>
                    <div className="border-r border-white/10 my-1" />
                    <div className="text-center">
                      <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">Assigned Reviews</span>
                      <strong className="text-xl font-black text-indigo-400">{assignedStains.filter(s => !s.reviewed).length + assignedLabs.filter(l => !l.doctorNotes).length}</strong>
                    </div>
                  </div>
                </div>

                {/* Stats widgets */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-soft hover:shadow-md transition-all flex items-center gap-4">
                    <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-indigo-650 text-white rounded-2xl shadow-md shadow-indigo-500/20"><Calendar className="h-5 w-5" /></div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Today's Visits</span>
                      <h3 className="text-xl font-black text-slate-800 mt-1">{stats.todayAppointmentsCount}</h3>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-soft hover:shadow-md transition-all flex items-center gap-4">
                    <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-emerald-650 text-white rounded-2xl shadow-md shadow-emerald-500/20"><CheckCircle className="h-5 w-5" /></div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Net Doctor Earnings</span>
                      <h3 className="text-xl font-black text-emerald-700 mt-1">
                        Rs. {Number(dbStats.netDoctorEarnings !== undefined ? dbStats.netDoctorEarnings : dbStats.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </h3>
                      {dbStats.totalCommission > 0 && (
                        <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">
                          Gross: ₹{Number(dbStats.totalRevenue || 0).toLocaleString('en-IN')} (Comm: ₹{Number(dbStats.totalCommission).toLocaleString('en-IN')})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-soft hover:shadow-md transition-all flex items-center gap-4">
                    <div className="p-3.5 bg-gradient-to-br from-cyan-500 to-cyan-650 text-white rounded-2xl shadow-md shadow-cyan-500/20"><BarChart3 className="h-5 w-5" /></div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Online Revenue</span>
                      <h3 className="text-xl font-black text-slate-850 mt-1">Rs. {Number(dbStats.onlineRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-soft hover:shadow-md transition-all flex items-center gap-4">
                    <div className="p-3.5 bg-gradient-to-br from-purple-500 to-purple-650 text-white rounded-2xl shadow-md shadow-purple-500/20"><Users className="h-5 w-5" /></div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Offline Revenue</span>
                      <h3 className="text-xl font-black text-slate-800 mt-1">Rs. {Number(dbStats.offlineRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                    </div>
                  </div>
                </div>

                {/* Additional metrics info */}
                <div className="grid grid-cols-4 gap-4 bg-slate-100/50 border border-slate-200/60 p-4 rounded-2xl text-center">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Bookings</span>
                    <strong className="text-sm text-slate-700">{dbStats.totalAppointments || 0}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Upcoming</span>
                    <strong className="text-sm text-slate-700">{dbStats.upcomingAppointments || 0}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Completed</span>
                    <strong className="text-sm text-slate-700">{dbStats.completedAppointments || 0}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Cancelled</span>
                    <strong className="text-sm text-rose-600">{dbStats.cancelledAppointments || 0}</strong>
                  </div>
                </div>

                {/* Dashboard layout splits */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left list: Today's Schedule */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Today's Appointment Queue</h3>
                    <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto scrollbar-thin">
                      {appointments.filter(a => a.status === 'confirmed').slice(0, 5).map(appt => (
                        <div key={appt._id} className="py-3 flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{appt.userId?.name}</h4>
                            <span className="text-[10px] text-slate-400 font-bold block">🕒 {appt.time} | Reason: {appt.reason}</span>
                          </div>
                          {appt.meetingLink && (
                            <a href={appt.meetingLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow hover:bg-emerald-600 transition-all">Join</a>
                          )}
                        </div>
                      ))}
                      {appointments.filter(a => a.status === 'confirmed').length === 0 && (
                        <p className="text-xs text-slate-400 italic py-6">No visits scheduled for today.</p>
                      )}
                    </div>
                  </div>

                  {/* Right list: Quick Feedbacks */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Patient Reviews</h3>
                    <div className="space-y-3.5 max-h-96 overflow-y-auto scrollbar-thin">
                      {feedbacks.slice(0, 3).map(f => (
                        <div key={f._id} className="text-xs space-y-1 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700">{f.appointmentId?.userId?.name || 'Patient'}</span>
                            <span className="text-amber-500">{'★'.repeat(f.rating)}</span>
                          </div>
                          <p className="italic text-slate-500">"{f.feedbackText}"</p>
                        </div>
                      ))}
                      {feedbacks.length === 0 && (
                        <p className="text-xs text-slate-400 italic py-6 text-center">No reviews recorded yet.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB CONTENT: APPOINTMENTS */}
            {activeTab === 'appointments' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Schedule & Virtual Bookings</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Approve, decline, or mark consulting sessions</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {appointments.map(appt => (
                    <div key={appt._id} className="border border-slate-200 bg-slate-50/50 rounded-2xl p-5 space-y-4 hover:border-slate-350 transition-all flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-850 text-sm">Patient: {appt.userId?.name || 'Unregistered'}</h4>
                            <p className="text-[10px] text-indigo-650 font-bold block mt-0.5">{formatDate(appt.date)} at {appt.time}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                              (appt.status === 'pending' || appt.status === 'confirmed') && isExpired(appt.date, appt.time) ? 'bg-slate-100 text-slate-400 border-slate-200' :
                              appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              appt.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              appt.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {(appt.status === 'pending' || appt.status === 'confirmed') && isExpired(appt.date, appt.time) ? 'expired' : appt.status}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                              appt.type === 'online' ? 'bg-teal-50 text-teal-650 border-teal-100' : 'bg-purple-50 text-purple-650 border-purple-100'
                            }`}>
                              {appt.type || 'offline'}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs bg-white border border-slate-200 p-3 rounded-xl text-slate-655 font-bold">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Reason:</span>
                          {appt.reason}
                        </div>
                        {appt.patientNotes && (
                          <div className="text-xs bg-indigo-50/30 border border-indigo-100 p-3 rounded-xl text-slate-700 font-semibold">
                            <span className="text-[9px] font-bold text-indigo-400 block uppercase mb-0.5">Patient Notes:</span>
                            {appt.patientNotes}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 space-y-2 border-t border-slate-100">
                        {appt.status === 'pending' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => { setAcceptingAppt(appt); setCustomMeetUrl(''); }}
                              className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleRejectAppointment(appt._id)}
                              className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-650 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                              Reject
                            </button>
                            {appt.recommendationId && (
                              <button 
                                onClick={() => setExpandedApptId(expandedApptId === appt._id ? null : appt._id)}
                                className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm"
                              >
                                {expandedApptId === appt._id ? 'Less Details' : 'More Details'}
                              </button>
                            )}
                          </div>
                        )}

                        {appt.status === 'confirmed' && (
                          <div className="flex gap-2 flex-col">
                            <div className="flex gap-2">
                              {appt.meetingLink && (
                                <a href={appt.meetingLink} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all">
                                  Join Call
                                </a>
                              )}
                              <button 
                                onClick={() => {
                                  setSelectedApptForNotes(appt);
                                  setConsultNotes(appt.notes || '');
                                  setPrescriptionText(appt.prescriptionText || '');
                                  setPrescriptionUrl(appt.prescriptionUrl || '');
                                  setActiveTab('notes');
                                }}
                                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg text-xs font-bold transition-all border border-slate-200"
                              >
                                Notes / Prescription
                              </button>
                              {appt.recommendationId && (
                                <button 
                                  onClick={() => setExpandedApptId(expandedApptId === appt._id ? null : appt._id)}
                                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm"
                                >
                                  {expandedApptId === appt._id ? 'Less' : 'More'}
                                </button>
                              )}
                            </div>
                            {/* Mark Completed button — opens notes popup */}
                            <button
                              onClick={() => openPrescriptionModalForAppt(appt)}
                              className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Complete & Prescribe
                            </button>
                            {/* Inline feedback display if patient submitted */}
                            {appt.feedback && (
                              <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5 text-xs text-slate-700 mt-2">
                                <div className="flex items-center gap-1 text-amber-500 font-bold mb-1">
                                  <span>{'★'.repeat(appt.feedback.rating)}{'☆'.repeat(5 - appt.feedback.rating)}</span>
                                  <span className="text-[10px] text-slate-400 font-bold">({appt.feedback.rating}/5)</span>
                                </div>
                                <p className="italic">{appt.feedback.feedbackText}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {appt.status === 'completed' && (
                          <div className="pt-2 space-y-2.5">
                            {/* Actions for completed appointments */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => openPrescriptionModalForAppt(appt)}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-all flex items-center gap-1.5 shadow-2xs"
                              >
                                <Pill className="h-3.5 w-3.5" />
                                <span>Edit Medicines / Notes</span>
                              </button>

                              {appt.prescriptionUrl && (
                                <a
                                  href={appt.prescriptionUrl.startsWith('http') ? appt.prescriptionUrl : `${apiUrl.replace(/\/api\/?$/, '')}${appt.prescriptionUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 transition-all flex items-center gap-1.5 shadow-2xs"
                                >
                                  <FileCheck className="h-3.5 w-3.5" />
                                  <span>Prescription PDF</span>
                                </a>
                              )}

                              <button
                                onClick={() => {
                                  setMessagePatientModal({
                                    isOpen: true,
                                    patientId: appt.userId?._id,
                                    patientName: appt.userId?.name || 'Patient',
                                    appointmentId: appt._id
                                  });
                                  setMessageSubject(`Clinical Advice - Visit on ${formatDate(appt.date)}`);
                                  setMessageBody('');
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5 shadow-2xs"
                              >
                                <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                                <span>Message</span>
                              </button>
                            </div>

                            {appt.feedback ? (
                              <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5 text-xs text-slate-700">
                                <div className="flex items-center gap-1 text-amber-500 font-bold mb-1">
                                  <span>{'★'.repeat(appt.feedback.rating)}{'☆'.repeat(5 - appt.feedback.rating)}</span>
                                  <span className="text-[10px] text-slate-400 font-bold">({appt.feedback.rating}/5)</span>
                                </div>
                                <p className="italic">"{appt.feedback.feedbackText}"</p>
                              </div>
                            ) : (
                              <div className="text-center py-2 bg-slate-50 border border-slate-150 rounded-xl text-[11px] font-medium text-slate-400 italic">
                                Completed • Waiting for patient review
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Expandable Section */}
                        {expandedApptId === appt._id && appt.recommendationId && (
                          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                            <h5 className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-2">Consultation Context</h5>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Source Module</span>
                                <span className="text-xs font-medium text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">{appt.recommendationId.sourceModule}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Risk Level</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded border ${
                                  appt.recommendationId.riskLevel === 'High' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                  appt.recommendationId.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                  'bg-emerald-50 text-emerald-600 border-emerald-200'
                                }`}>
                                  {appt.recommendationId.riskLevel || 'Unknown'}
                                </span>
                              </div>
                            </div>

                            <div>
                              <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Trigger Condition</span>
                              <p className="text-xs text-slate-600 leading-relaxed bg-white p-2 rounded border border-slate-200">{appt.recommendationId.triggerCondition || 'N/A'}</p>
                            </div>

                            {appt.recommendationId.assessmentAnswers && Object.keys(appt.recommendationId.assessmentAnswers).length > 0 && (
                              <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Assessment Answers</span>
                                <div className="bg-white border border-slate-200 rounded p-2 text-xs text-slate-600 space-y-1">
                                  {Object.entries(appt.recommendationId.assessmentAnswers).map(([key, val]) => (
                                    <div key={key} className="flex justify-between border-b border-slate-100 last:border-0 pb-1 last:pb-0">
                                      <span className="font-medium">{key}:</span>
                                      <span className="text-slate-500">{String(val)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <p className="text-xs text-slate-400 italic col-span-3 py-10 text-center">No schedule bookings found.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: CALENDAR */}
            {activeTab === 'calendar' && (() => {
              const currentYear = calendarDate.getFullYear();
              const currentMonth = calendarDate.getMonth();
              const todayStr = new Date().toISOString().split('T')[0];

              // Navigation Handlers
              const handlePrev = () => {
                const d = new Date(calendarDate);
                if (calendarTab === 'month') {
                  d.setMonth(d.getMonth() - 1);
                } else if (calendarTab === 'week') {
                  d.setDate(d.getDate() - 7);
                } else {
                  d.setDate(d.getDate() - 1);
                }
                setCalendarDate(d);
              };

              const handleNext = () => {
                const d = new Date(calendarDate);
                if (calendarTab === 'month') {
                  d.setMonth(d.getMonth() + 1);
                } else if (calendarTab === 'week') {
                  d.setDate(d.getDate() + 7);
                } else {
                  d.setDate(d.getDate() + 1);
                }
                setCalendarDate(d);
              };

              const handleToday = () => {
                setCalendarDate(new Date());
              };

              // Month View Calculations
              const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
              const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
              const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

              const leadingDays = Array.from({ length: firstDayOfWeek }).map((_, idx) => {
                const dayNum = daysInPrevMonth - firstDayOfWeek + idx + 1;
                const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
                const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                return { dayNum, dateStr, isCurrentMonth: false };
              });

              const currentMonthDays = Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                return { dayNum, dateStr, isCurrentMonth: true };
              });

              const totalCellsNeeded = Math.ceil((leadingDays.length + currentMonthDays.length) / 7) * 7;
              const trailingCount = totalCellsNeeded - (leadingDays.length + currentMonthDays.length);
              const trailingDays = Array.from({ length: trailingCount }).map((_, idx) => {
                const dayNum = idx + 1;
                const nextDate = new Date(currentYear, currentMonth + 1, dayNum);
                const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                return { dayNum, dateStr, isCurrentMonth: false };
              });

              const allMonthCells = [...leadingDays, ...currentMonthDays, ...trailingDays];

              // Week View Calculations
              const startOfWeek = new Date(calendarDate);
              startOfWeek.setDate(calendarDate.getDate() - calendarDate.getDay());
              const weekDays = Array.from({ length: 7 }).map((_, idx) => {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + idx);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = d.getDate();
                return { date: d, dateStr, label: `${dayName} ${dayNum}` };
              });

              // Day View Calculations
              const selectedDayStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(calendarDate.getDate()).padStart(2, '0')}`;

              // Title string
              const headerTitle = calendarTab === 'month' 
                ? calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : calendarTab === 'week'
                  ? `Week of ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : calendarDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

              return (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                  {/* Calendar Top Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-base font-bold text-slate-800">My Clinical Bookings Calendar</h2>
                        <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-150">
                          {headerTitle}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Visual monthly scheduler tracker & booking manager</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Prev / Today / Next Controls */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={handlePrev}
                          className="p-1 hover:bg-white text-slate-600 rounded-lg transition-all"
                          title="Previous"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleToday}
                          className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-all"
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={handleNext}
                          className="p-1 hover:bg-white text-slate-600 rounded-lg transition-all"
                          title="Next"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      {/* View Switcher: Month / Week / Day */}
                      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        {(['month', 'week', 'day'] as const).map(tab => (
                          <button 
                            key={tab}
                            type="button"
                            onClick={() => setCalendarTab(tab)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                              calendarTab === tab ? 'bg-primary text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* MONTH VIEW */}
                  {calendarTab === 'month' && (
                    <>
                      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="py-1">{day}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {allMonthCells.map((cell, idx) => {
                          const dayAppts = appointments.filter(a => a.date === cell.dateStr);
                          const isToday = cell.dateStr === todayStr;
                          return (
                            <div 
                              key={idx} 
                              onClick={() => {
                                setCalendarDate(new Date(cell.dateStr + 'T00:00:00'));
                                setCalendarTab('day');
                              }}
                              className={`border rounded-2xl p-2.5 min-h-[100px] flex flex-col justify-between transition-all cursor-pointer ${
                                isToday 
                                  ? 'border-indigo-400 bg-indigo-50/30 ring-2 ring-indigo-400/20' 
                                  : cell.isCurrentMonth
                                    ? 'border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-xs'
                                    : 'border-slate-100 bg-slate-50/40 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[11px] font-black ${
                                  isToday ? 'bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center' :
                                  cell.isCurrentMonth ? 'text-slate-700' : 'text-slate-350'
                                }`}>
                                  {cell.dayNum}
                                </span>
                                {dayAppts.length > 0 && (
                                  <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-100/70 px-1.5 py-0.2 rounded-full">
                                    {dayAppts.length}
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1 overflow-y-auto max-h-[60px] scrollbar-none mt-1">
                                {dayAppts.map(appt => (
                                  <div 
                                    key={appt._id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openPrescriptionModalForAppt(appt);
                                    }}
                                    className={`p-1 rounded text-[9px] font-bold text-left truncate leading-tight shadow-2xs ${
                                      appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                      appt.status === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                      appt.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                      'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}
                                    title={`${appt.time} - ${appt.userId?.name || 'Patient'} (${appt.reason}) - Click to manage`}
                                  >
                                    {appt.time} {appt.userId?.name || 'Patient'}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* WEEK VIEW */}
                  {calendarTab === 'week' && (
                    <div className="grid grid-cols-7 gap-3">
                      {weekDays.map((col) => {
                        const dayAppts = appointments.filter(a => a.date === col.dateStr);
                        const isToday = col.dateStr === todayStr;
                        return (
                          <div 
                            key={col.dateStr} 
                            className={`border rounded-2xl p-3 min-h-[340px] flex flex-col gap-2 ${
                              isToday ? 'border-indigo-400 bg-indigo-50/20 ring-1 ring-indigo-400/30' : 'border-slate-200 bg-slate-50/30'
                            }`}
                          >
                            <div className="text-center pb-2 border-b border-slate-150">
                              <span className={`text-xs font-bold block ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>
                                {col.label}
                              </span>
                              {isToday && <span className="text-[9px] font-bold text-indigo-500 uppercase">Today</span>}
                            </div>
                            <div className="flex-1 space-y-2 overflow-y-auto max-h-[280px] scrollbar-none">
                              {dayAppts.map(appt => (
                                <div 
                                  key={appt._id} 
                                  onClick={() => openPrescriptionModalForAppt(appt)}
                                  className={`p-2.5 rounded-xl text-[10px] font-bold border flex flex-col gap-1 cursor-pointer transition-all hover:shadow-xs ${
                                    appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    appt.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    appt.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                    'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>🕒 {appt.time}</span>
                                    <span className="uppercase text-[8px] px-1 rounded bg-white/70">{appt.status}</span>
                                  </div>
                                  <span className="truncate text-slate-800 font-extrabold">{appt.userId?.name || 'Patient'}</span>
                                  <span className="text-[9px] text-slate-500 font-normal truncate">{appt.reason}</span>
                                </div>
                              ))}
                              {dayAppts.length === 0 && (
                                <span className="text-[10px] text-slate-400 italic block text-center mt-12">No bookings</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* DAY VIEW */}
                  {calendarTab === 'day' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-2xl flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900">
                          Consultations for {selectedDayStr} ({appointments.filter(a => a.date === selectedDayStr).length} visits scheduled)
                        </span>
                        <button
                          type="button"
                          onClick={() => setCalendarTab('month')}
                          className="text-xs font-bold text-indigo-600 hover:underline"
                        >
                          ← Back to Month View
                        </button>
                      </div>

                      <div className="space-y-2 border border-slate-200 rounded-3xl p-4 bg-slate-50/20 max-h-[500px] overflow-y-auto">
                        {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(hour => {
                          const hourPrefix = hour.split(':')[0];
                          const hourAppts = appointments.filter(a => a.date === selectedDayStr && a.time && a.time.startsWith(hourPrefix));
                          return (
                            <div key={hour} className="flex gap-4 items-center py-3 border-b border-slate-100 last:border-0">
                              <span className="text-xs font-bold text-slate-400 w-16 shrink-0">{hour}</span>
                              <div className="flex-1 flex gap-2 overflow-x-auto">
                                {hourAppts.map(appt => (
                                  <div 
                                    key={appt._id}
                                    onClick={() => openPrescriptionModalForAppt(appt)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-3 cursor-pointer transition-all hover:shadow-xs ${
                                      appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      appt.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      appt.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                      'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span>{appt.userId?.name || 'Patient'}</span>
                                        <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-white border uppercase text-slate-500">
                                          {appt.time} • {appt.type || 'consultation'}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-500 font-normal block mt-0.5">Reason: {appt.reason}</span>
                                    </div>
                                    <button 
                                      type="button"
                                      className="px-2 py-1 bg-white rounded-lg text-[10px] font-bold text-slate-700 border shadow-2xs hover:bg-slate-50"
                                    >
                                      Manage
                                    </button>
                                  </div>
                                ))}
                                {hourAppts.length === 0 && (
                                  <span className="text-xs text-slate-350 italic">No bookings scheduled for this hour</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* TAB CONTENT: PATIENTS */}
            {activeTab === 'patients' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-800">My Patients Directory</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Manage details and consultation logs for registered patients</p>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-xs text-slate-600 text-left">
                    <thead className="bg-slate-50 font-bold uppercase text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="p-4">Patient Name</th>
                        <th className="p-4">Contact Info</th>
                        <th className="p-4 text-center">Last Visit</th>
                        <th className="p-4">Consultation Reason</th>
                        <th className="p-4 text-center">Prescription Status</th>
                        <th className="p-4 text-right">Actions & Medical Options</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {getUniquePatients().map(p => {
                        const hasPrescription = !!p.latestAppt?.prescriptionUrl;
                        return (
                          <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                              <span className="font-bold text-slate-800 text-sm block">{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {p.allAppointments ? `${p.allAppointments.length} total consultation${p.allAppointments.length > 1 ? 's' : ''}` : 'Registered Patient'}
                              </span>
                            </td>
                            <td className="p-4 text-slate-600">
                              <span className="block">{p.email}</span>
                              {p.mobileNumber && <span className="text-[10px] text-slate-400">{p.mobileNumber}</span>}
                            </td>
                            <td className="p-4 text-center">
                              <span className="font-bold text-indigo-650 block">{formatDate(p.lastVisit)}</span>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold bg-slate-100 text-slate-500">
                                {p.latestAppt?.status || 'completed'}
                              </span>
                            </td>
                            <td className="p-4 font-normal text-slate-600 max-w-xs">
                              <p className="truncate" title={p.lastReason}>{p.lastReason || 'General Consultation'}</p>
                            </td>
                            <td className="p-4 text-center">
                              {hasPrescription ? (
                                <a
                                  href={p.latestAppt.prescriptionUrl.startsWith('http') ? p.latestAppt.prescriptionUrl : `${apiUrl.replace(/\/api\/?$/, '')}${p.latestAppt.prescriptionUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all shadow-2xs"
                                >
                                  <FileCheck className="h-3 w-3" />
                                  <span>View Rx PDF</span>
                                </a>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400">
                                  No Rx attached
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {p.latestAppt && (
                                  <button
                                    type="button"
                                    onClick={() => openPrescriptionModalForAppt(p.latestAppt)}
                                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-all flex items-center gap-1 shadow-2xs"
                                    title="Edit diagnostic notes, suggest medicines, or create a prescription"
                                  >
                                    <Pill className="h-3.5 w-3.5" />
                                    <span>Prescribe / Edit</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setMessagePatientModal({
                                      isOpen: true,
                                      patientId: p._id,
                                      patientName: p.name,
                                      appointmentId: p.latestAppt?._id
                                    });
                                    setMessageSubject(`Advice from Doctor - ${formatDate(p.lastVisit)}`);
                                    setMessageBody('');
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all flex items-center gap-1 shadow-2xs"
                                  title="Send push notification & email advice to patient"
                                >
                                  <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                                  <span>Message</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setPatientHistoryModal(p)}
                                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 transition-all flex items-center gap-1 shadow-2xs"
                                  title="View full patient consultation history"
                                >
                                  <Eye className="h-3.5 w-3.5 text-slate-400" />
                                  <span>History</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {getUniquePatients().length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400 italic">No registered patient consultations found in directory.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: AVAILABILITY */}
            {activeTab === 'availability' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Schedule Availability</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Configure working hours, days, and holiday calendar exclusions</p>
                </div>

                <form onSubmit={handleSettingsSubmit} className="space-y-6 max-w-xl">
                  {/* Days */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Working Days</label>
                    <div className="flex flex-wrap gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                        const active = availableDays.includes(day);
                        return (
                          <button
                            type="button"
                            key={day}
                            onClick={() => handleToggleDay(day)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              active ? 'bg-primary text-white border-primary' : 'bg-white text-slate-555 border-slate-200 hover:border-slate-350'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hours & duration & max slot appointments */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Working Hours Range</label>
                      <input 
                        type="text" 
                        value={workingHours} 
                        onChange={e => setWorkingHours(e.target.value)}
                        placeholder="e.g. 09:00 - 17:00"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time Slot Interval (mins)</label>
                      <input 
                        type="number" 
                        value={slotDuration === 0 ? '' : slotDuration}
                        onChange={e => {
                          const val = e.target.value;
                          setSlotDuration(val === '' ? 0 : parseInt(val));
                        }}
                        placeholder="e.g. 30"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Max Patients Per Slot</label>
                      <input 
                        type="number" 
                        value={maxAppointmentsPerSlot === 0 ? '' : maxAppointmentsPerSlot}
                        onChange={e => {
                          const val = e.target.value;
                          setMaxAppointmentsPerSlot(val === '' ? 0 : parseInt(val));
                        }}
                        placeholder="e.g. 1"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Consultation Fees */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consultation Fees Settings (Rs.)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block">Online Consultation Fee</label>
                        <input 
                          type="number" 
                          value={onlineConsultationFee} 
                          onChange={e => setOnlineConsultationFee(parseInt(e.target.value) || 0)}
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block">Offline Consultation Fee</label>
                        <input 
                          type="number" 
                          value={offlineConsultationFee} 
                          onChange={e => setOfflineConsultationFee(parseInt(e.target.value) || 0)}
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Holiday leaves list */}
                  <div className="pt-6 mt-6 border-t border-slate-100">
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-rose-500">⛱️</span> Leave Exclusions & Holidays
                      </h3>
                      <p className="text-slate-500 text-[11px] mt-1">Select dates when you will be completely closed or on leave. Patients cannot book slots on these days.</p>
                    </div>
                    
                    <div className="flex gap-2 mb-6">
                      <input 
                        type="date" 
                        value={newHoliday}
                        onChange={(e) => setNewHoliday(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-rose-500 text-sm"
                      />
                      <button 
                        type="button"
                        onClick={handleAddHoliday}
                        className="bg-rose-500 text-white font-bold px-5 py-3 rounded-xl hover:bg-rose-600 shadow-sm text-sm"
                      >
                        Add Holiday
                      </button>
                    </div>

                    <div className="space-y-2">
                      {[...holidays].sort().map(holiday => (
                        <div key={holiday} className="flex items-center justify-between p-4 rounded-xl border border-rose-100 bg-rose-50/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white border border-rose-100 flex flex-col items-center justify-center">
                              <span className="text-[10px] font-bold text-rose-400 uppercase leading-none">{new Date(holiday).toLocaleDateString('en-US', { month: 'short' })}</span>
                              <span className="text-lg font-black text-rose-700 leading-none mt-0.5">{new Date(holiday).getDate()}</span>
                            </div>
                            <span className="font-bold text-slate-700 text-sm">{new Date(holiday).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleRemoveHoliday(holiday)}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-100 p-2 rounded-lg transition-colors text-xs font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {holidays.length === 0 && (
                        <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-medium">
                          No holidays scheduled.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button 
                      type="submit"
                      disabled={savingSettings}
                      className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      {savingSettings ? 'Saving...' : 'Save Availability & Leaves'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CONTENT: CONSULTATION NOTES */}
            {activeTab === 'notes' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Consultation Notes & Prescription Suite</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Record diagnostic summaries, suggest medicines, and generate official medical prescriptions</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Sidebar list of appointments */}
                  <div className="space-y-3 lg:col-span-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Patient</h3>
                      <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px]">
                        {(['all', 'confirmed', 'completed'] as const).map(f => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setNotesFilter(f)}
                            className={`px-2 py-0.5 rounded capitalize font-bold ${
                              notesFilter === f ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 max-h-[550px] overflow-y-auto scrollbar-thin">
                      {appointments
                        .filter(a => {
                          if (notesFilter === 'all') return a.status === 'confirmed' || a.status === 'completed';
                          return a.status === notesFilter;
                        })
                        .map(appt => (
                          <div 
                            key={appt._id} 
                            onClick={() => {
                              setSelectedApptForNotes(appt);
                              setConsultNotes(appt.notes || '');
                              setClinicalDiagnosis(appt.diagnosis || appt.reason || '');
                              setDietaryAdvice(appt.dietaryAdvice || '');
                              setLifestyleAdvice(appt.lifestyleAdvice || '');
                              setFollowUpDate(appt.followUpDate || '');
                              setPrescriptionUrl(appt.prescriptionUrl || '');
                              setPrescriptionText(appt.prescriptionText || '');
                              if (Array.isArray(appt.medicines) && appt.medicines.length > 0) {
                                setMedicinesList(appt.medicines.map((m: any) => ({
                                  name: m.name || '',
                                  dosage: m.dosage || '',
                                  frequency: m.frequency || '1-0-1',
                                  timing: m.timing || 'After Food',
                                  duration: m.duration || '5 days',
                                  instructions: m.instructions || ''
                                })));
                              } else {
                                setMedicinesList([
                                  { name: '', dosage: '', frequency: '1-0-1', timing: 'After Food', duration: '5 days', instructions: '' }
                                ]);
                              }
                            }}
                            className={`p-3.5 border rounded-2xl cursor-pointer transition-all ${
                              selectedApptForNotes?._id === appt._id 
                                ? 'border-primary bg-indigo-50/30 ring-1 ring-primary/40' 
                                : 'border-slate-200 bg-white hover:border-slate-350 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-xs text-slate-800">{appt.userId?.name}</h4>
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                                appt.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-150' : 'bg-emerald-50 text-emerald-600 border-emerald-150'
                              }`}>
                                {appt.status}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-1">🕒 {formatDate(appt.date)} at {appt.time}</span>
                            <span className="text-[10px] text-slate-500 truncate block mt-0.5">Reason: {appt.reason}</span>
                            {appt.prescriptionUrl && (
                              <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                                <FileCheck className="h-3 w-3" /> Rx Attached
                              </span>
                            )}
                          </div>
                        ))}
                      {appointments.filter(a => a.status === 'confirmed' || a.status === 'completed').length === 0 && (
                        <p className="text-xs text-slate-400 italic py-6 text-center">No active or completed visits found.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Form Editor */}
                  <div className="lg:col-span-2">
                    {selectedApptForNotes ? (
                      <form onSubmit={handleConsultNotesSubmit} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-5">
                        <div className="pb-3 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-slate-800">
                              Consultation for {selectedApptForNotes.userId?.name}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {formatDate(selectedApptForNotes.date)} at {selectedApptForNotes.time} • Reason: {selectedApptForNotes.reason}
                            </span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            selectedApptForNotes.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}>
                            Status: {selectedApptForNotes.status}
                          </span>
                        </div>

                        {/* Clinical Diagnosis */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Clinical Assessment / Diagnosis Summary <span className="text-rose-500">*</span>
                          </label>
                          <textarea 
                            required
                            value={consultNotes} 
                            onChange={e => setConsultNotes(e.target.value)}
                            rows={3}
                            className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                            placeholder="Primary symptoms, clinical findings, diagnostic evaluation..."
                          />
                        </div>

                        {/* Structured Medicines Section */}
                        <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-indigo-600">℞</span>
                              <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Prescribed Medicines & Dosages</h5>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddMedicineRow}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 flex items-center gap-1 transition-all"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add Medicine</span>
                            </button>
                          </div>

                          <div className="space-y-2.5">
                            {medicinesList.map((med, idx) => (
                              <div key={idx} className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                  {/* Medicine Name */}
                                  <div className="sm:col-span-5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Medicine Name & Strength</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Paracetamol 500mg, Metformin"
                                      value={med.name}
                                      onChange={e => handleUpdateMedicine(idx, 'name', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
                                    />
                                  </div>

                                  {/* Dosage */}
                                  <div className="sm:col-span-3">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Dosage</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. 1 Tab, 5ml"
                                      value={med.dosage}
                                      onChange={e => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
                                    />
                                  </div>

                                  {/* Frequency */}
                                  <div className="sm:col-span-4">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Frequency</label>
                                    <select
                                      value={med.frequency}
                                      onChange={e => handleUpdateMedicine(idx, 'frequency', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                                    >
                                      <option value="1-0-1">1-0-1 (Twice Daily)</option>
                                      <option value="1-0-0">1-0-0 (Morning Only)</option>
                                      <option value="0-0-1">0-0-1 (Night Only)</option>
                                      <option value="1-1-1">1-1-1 (Thrice Daily)</option>
                                      <option value="Once Daily">Once Daily</option>
                                      <option value="SOS / As Needed">SOS / As Needed</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                  {/* Timing */}
                                  <div className="sm:col-span-4">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Timing</label>
                                    <select
                                      value={med.timing}
                                      onChange={e => handleUpdateMedicine(idx, 'timing', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                                    >
                                      <option value="After Food">After Food</option>
                                      <option value="Before Food">Before Food</option>
                                      <option value="With Food">With Food</option>
                                      <option value="At Bedtime">At Bedtime</option>
                                      <option value="Empty Stomach">Empty Stomach</option>
                                    </select>
                                  </div>

                                  {/* Duration */}
                                  <div className="sm:col-span-3">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Duration</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. 5 days, 1 month"
                                      value={med.duration}
                                      onChange={e => handleUpdateMedicine(idx, 'duration', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
                                    />
                                  </div>

                                  {/* Instructions */}
                                  <div className="sm:col-span-4">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Instructions</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. With warm water"
                                      value={med.instructions}
                                      onChange={e => handleUpdateMedicine(idx, 'instructions', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
                                    />
                                  </div>

                                  {/* Delete Button */}
                                  <div className="sm:col-span-1 flex justify-end pt-3">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMedicineRow(idx)}
                                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                      title="Remove medicine"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dietary & Lifestyle Advice */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dietary & Lifestyle Advice</label>
                            <input
                              type="text"
                              value={dietaryAdvice}
                              onChange={e => setDietaryAdvice(e.target.value)}
                              placeholder="e.g. Low glycemic nutrition, 3L water daily, 30m walking"
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Follow-up Recommendation</label>
                            <input
                              type="text"
                              value={followUpDate}
                              onChange={e => setFollowUpDate(e.target.value)}
                              placeholder="e.g. Follow-up in 2 weeks or after fasting blood test"
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Medical Prescription PDF Generation & Upload Options */}
                        <div className="space-y-3 bg-indigo-50/40 border border-indigo-150 p-4 rounded-2xl">
                          <label className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                            Official Medical Prescription PDF
                          </label>

                          {prescriptionUrl ? (
                            <div className="flex items-center justify-between p-3 bg-white border border-emerald-200 rounded-xl">
                              <div className="flex items-center gap-2">
                                <FileCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                                <div>
                                  <span className="text-xs font-bold text-emerald-800 block">Medical Prescription Ready</span>
                                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-xs block">{prescriptionUrl}</span>
                                </div>
                              </div>
                              <a
                                href={prescriptionUrl.startsWith('http') ? prescriptionUrl : `${apiUrl.replace(/\/api\/?$/, '')}${prescriptionUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>View PDF</span>
                              </a>
                            </div>
                          ) : null}

                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={handleGeneratePrescriptionPdf}
                              disabled={isGeneratingPrescription}
                              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <span>✨</span>
                              <span>{isGeneratingPrescription ? 'Generating...' : 'Generate Medical Prescription PDF'}</span>
                            </button>

                            <label className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs">
                              <Upload className="h-3.5 w-3.5 text-slate-500" />
                              <span>Upload PDF / Scan</span>
                              <input
                                type="file"
                                accept=".pdf,image/*"
                                onChange={handleUploadPrescriptionFile}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                          <button 
                            type="button" 
                            onClick={() => {
                              setSelectedApptForNotes(null);
                              resetPrescriptionFields();
                            }}
                            className="px-4 py-2 bg-slate-200 rounded-xl text-xs font-bold text-slate-655 hover:bg-slate-300 transition-all"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            disabled={savingNotes}
                            className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                          >
                            {savingNotes ? 'Saving...' : 'Save Consultation & Update Prescription'}
                          </button>
                        </div>

                      </form>
                    ) : (
                      <div className="border border-dashed border-slate-300 rounded-3xl p-10 text-center text-slate-400 text-xs py-24 bg-slate-50/50">
                        Choose a patient appointment card from the left list to record consultation notes, prescribe medicines, and generate a medical prescription.
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* TAB CONTENT: FEEDBACK */}
            {activeTab === 'feedback' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Patient Feedback & Ratings</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Reviews submitted by patients following completed virtual consultation sessions</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feedbacks.map(f => (
                    <div key={f._id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/30 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">{f.appointmentId?.userId?.name || 'Patient'}</h4>
                          <span className="text-[9px] text-slate-400 font-bold block">{formatDate(f.appointmentId?.date)}</span>
                        </div>
                        <div className="flex items-center text-amber-500">
                          {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                        </div>
                      </div>
                      <p className="italic text-slate-600 text-xs leading-relaxed">"{f.feedbackText}"</p>
                    </div>
                  ))}
                  {feedbacks.length === 0 && (
                    <p className="text-xs text-slate-450 italic col-span-2 py-6 text-center">No patient feedback records found.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: ASSIGNED REVIEWS */}
            {activeTab === ('assigned-reviews' as any) && (
              <div className="space-y-6">
                {/* Tooth Stain reviews assigned queue */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-base font-black text-slate-850">Assigned Tobacco Stain Reviews</h3>
                    <p className="text-xs text-slate-400 font-medium">Dental staining logs assigned to you for consultation and advice.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {assignedStains.map((stain) => (
                      <div key={stain._id} className="border border-slate-200 bg-slate-50/30 rounded-2xl p-5 space-y-4 hover:border-slate-350 transition-all flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">Patient: {stain.userId?.name || 'Anonymous'}</h4>
                              <span className="text-[10px] text-slate-400 font-bold">{new Date(stain.timestamp).toLocaleString()}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${stain.reviewed ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                              {stain.reviewed ? 'Reviewed' : 'Action Required'}
                            </span>
                          </div>
                          
                          <div className="flex justify-center bg-slate-900 rounded-xl overflow-hidden py-2 border border-slate-200">
                            <img
                              src={stain.value.imageUrl.startsWith('http') ? stain.value.imageUrl : `${apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl}/api/admin/stain-image/${stain.value.imageUrl.split('/').pop()}?token=${token}`}
                              alt="Teeth"
                              className="max-h-[160px] w-auto object-contain"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white p-2 rounded-lg border border-slate-100">
                              <span className="text-[9px] text-slate-400 uppercase block">Stain Score</span>
                              <strong className="text-slate-850 text-sm">{stain.value.score} / 100</strong>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-100">
                              <span className="text-[9px] text-slate-400 uppercase block">Category</span>
                              <strong className="text-slate-850 text-sm">{stain.value.category}</strong>
                            </div>
                          </div>

                          {stain.doctorNotes && (
                            <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 text-xs">
                              <span className="text-[9px] text-emerald-500 font-bold uppercase block mb-1">Your Diagnostic Notes:</span>
                              <p className="text-slate-700 font-semibold">{stain.doctorNotes}</p>
                            </div>
                          )}
                        </div>

                        {!stain.reviewed && (
                          <div className="space-y-2 pt-3 border-t border-slate-100">
                            <label className="text-[9px] text-slate-400 font-bold uppercase block">Clinical Notes / Recommendations</label>
                            <textarea
                              rows={2}
                              value={stainReviewNotes[stain._id] || ''}
                              onChange={(e) => setStainReviewNotes({ ...stainReviewNotes, [stain._id]: e.target.value })}
                              placeholder="Enter advice..."
                              className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent bg-white"
                            />
                            <button
                              onClick={() => submitStainReviewNotes(stain._id)}
                              disabled={submittingStainNotesId === stain._id}
                              className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                            >
                              Submit Diagnostic Notes
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {assignedStains.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-6">No stain reviews assigned to you.</p>
                    )}
                  </div>
                </div>

                {/* Lab report reviews assigned queue */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-base font-black text-slate-850">Assigned Lab Booking Reports</h3>
                    <p className="text-xs text-slate-400 font-medium">Lab screening test bookings assigned to you for clinical notes and review.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {assignedLabs.map((booking) => (
                      <div key={booking._id} className="border border-slate-200 bg-slate-50/30 rounded-2xl p-5 space-y-4 hover:border-slate-350 transition-all flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">Patient: {booking.userId?.name || 'Anonymous'}</h4>
                              <span className="text-[10px] text-slate-400 font-bold">{new Date(booking.createdAt).toLocaleDateString()}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${booking.doctorNotes ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                              {booking.doctorNotes ? 'Reviewed' : 'Pending Notes'}
                            </span>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-slate-150 text-xs">
                            <span className="text-[9px] text-slate-400 uppercase block">Screening Test</span>
                            <strong className="text-slate-850">{booking.labTestId?.cancerScreeningTestId?.name || 'Screening Test'}</strong>
                          </div>

                          {booking.doctorNotes && (
                            <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 text-xs">
                              <span className="text-[9px] text-emerald-500 font-bold uppercase block mb-1">Your Diagnostic Notes:</span>
                              <p className="text-slate-700 font-semibold">{booking.doctorNotes}</p>
                            </div>
                          )}
                        </div>

                        {!booking.doctorNotes && (
                          <div className="space-y-2 pt-3 border-t border-slate-100">
                            <label className="text-[9px] text-slate-400 font-bold uppercase block">Clinical Review / Report Notes</label>
                            <textarea
                              rows={2}
                              value={labReviewNotes[booking._id] || ''}
                              onChange={(e) => setLabReviewNotes({ ...labReviewNotes, [booking._id]: e.target.value })}
                              placeholder="Add report diagnostics review notes..."
                              className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent bg-white"
                            />
                            <button
                              onClick={() => submitLabBookingNotes(booking._id)}
                              disabled={submittingLabNotesId === booking._id}
                              className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                            >
                              Submit Report Review
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {assignedLabs.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-6">No lab reports assigned to you.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: PROFILE */}
            {activeTab === 'profile' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Edit Professional Profile</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Manage specialized fields, registration numbers, fees, and contact details</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-2xl">
                  
                  {/* Photo / Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consultant Full Name *</label>
                      <input 
                        required
                        type="text" 
                        value={profileForm.name} 
                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avatar Profile Photo URL</label>
                      <input 
                        type="text" 
                        value={profileForm.avatar} 
                        onChange={e => setProfileForm({ ...profileForm, avatar: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Qualification *</label>
                      <input 
                        required
                        type="text" 
                        value={profileForm.qualification} 
                        onChange={e => setProfileForm({ ...profileForm, qualification: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                        placeholder="e.g. MBBS, MD"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Specialization Specialty *</label>
                      <input 
                        required
                        type="text" 
                        value={profileForm.specialty} 
                        onChange={e => setProfileForm({ ...profileForm, specialty: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Years of Experience *</label>
                      <input 
                        required
                        type="number" 
                        value={profileForm.experience} 
                        onChange={e => setProfileForm({ ...profileForm, experience: parseInt(e.target.value) || 0 })}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Languages Spoken (comma separated)</label>
                      <input 
                        type="text" 
                        value={Array.isArray(profileForm.languagesKnown) ? profileForm.languagesKnown.join(', ') : profileForm.languagesKnown || ''} 
                        onChange={e => setProfileForm({ ...profileForm, languagesKnown: e.target.value as any })}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                        placeholder="e.g. English, Hindi, Tamil"
                      />
                    </div>
                  </div>

                  {/* Hospital & Registration */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hospital / Clinic Name</label>
                      <input 
                        type="text" 
                        value={profileForm.hospitalName} 
                        onChange={e => setProfileForm({ ...profileForm, hospitalName: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Medical Registration Number</label>
                      <input 
                        type="text" 
                        value={profileForm.registrationNumber} 
                        onChange={e => setProfileForm({ ...profileForm, registrationNumber: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consultation Fee (Rs) *</label>
                      <input 
                        required
                        type="number" 
                        value={profileForm.consultationFee} 
                        onChange={e => setProfileForm({ ...profileForm, consultationFee: parseInt(e.target.value) || 0 })}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Phone & Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</label>
                      <input 
                        type="tel" 
                        value={profileForm.phone} 
                        onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address *</label>
                      <input 
                        required
                        type="email" 
                        value={profileForm.email} 
                        onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bio / About Doctor *</label>
                    <textarea 
                      required
                      value={profileForm.description} 
                      onChange={e => setProfileForm({ ...profileForm, description: e.target.value })}
                      rows={4}
                      className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button 
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      {savingProfile ? 'Saving...' : 'Save Profile Details'}
                    </button>
                  </div>

                </form>
              </div>
            )}

            {/* TAB CONTENT: SETTINGS */}
            {activeTab === 'settings' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Security & Visibility Settings</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Toggle visibility, notification preferences, and change passwords</p>
                </div>

                <form onSubmit={handleSettingsSubmit} className="space-y-5 max-w-md">
                  
                  {/* Password */}
                  <div className="space-y-3.5 pb-4 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-700">Change Password</h3>
                    <div className="space-y-2">
                      <input 
                        type="password" 
                        placeholder="New Password" 
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none font-semibold"
                      />
                      <input 
                        type="password" 
                        placeholder="Confirm Password" 
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none font-semibold"
                      />
                    </div>
                  </div>

                  {/* Visibility & Alerts */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold text-slate-700">Preferences</h3>
                    <div className="flex flex-col gap-2.5">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={visibility}
                          onChange={e => setVisibility(e.target.checked)}
                          className="rounded text-primary h-4.5 w-4.5"
                        />
                        <span className="text-xs font-bold text-slate-700">Visible to patients searching for consulting slots</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={notificationsEnabled}
                          onChange={e => setNotificationsEnabled(e.target.checked)}
                          className="rounded text-primary h-4.5 w-4.5"
                        />
                        <span className="text-xs font-bold text-slate-700">Receive push alerts for new appointments</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={emailsEnabled}
                          onChange={e => setEmailsEnabled(e.target.checked)}
                          className="rounded text-primary h-4.5 w-4.5"
                        />
                        <span className="text-xs font-bold text-slate-700">Receive daily digest email alerts</span>
                      </label>
                    </div>
                  </div>

                  {/* Deaddiction Settings */}
                  <div className="space-y-3 pt-2 pb-2">
                    <h3 className="text-xs font-bold text-slate-700">Deaddiction Referral Settings</h3>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deaddiction Helpline Number</label>
                      <input 
                        type="text" 
                        value={deaddictionHelpline} 
                        onChange={e => setDeaddictionHelpline(e.target.value)} 
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none font-semibold text-slate-800" 
                        placeholder="e.g. 1800-11-0031" 
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button 
                      type="submit"
                      disabled={savingSettings}
                      className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      {savingSettings ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>

                </form>
              </div>
            )}

          </div>
        )}

      </main>

      {/* CONFIRM APPOINTMENT / MEET INVITE MODAL */}
      {acceptingAppt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-2">Accept Appointment</h3>
            <p className="text-[11px] text-slate-400 mb-4">Set meeting details for Dr. {doctorInfo?.name} consultation.</p>

            <form onSubmit={handleAcceptAppointment} className="space-y-4">
              {acceptingAppt.type === 'online' ? (
                <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-2xl space-y-2">
                  <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">
                    📅 Open Google Calendar to set up a meeting invite and auto-generate a Google Meet link.
                  </p>
                  <a 
                    href={getGoogleCalendarUrl(acceptingAppt)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all"
                  >
                    Create Calendar Event ↗
                  </a>
                </div>
              ) : (
                <div className="bg-purple-50/50 border border-purple-100 p-3.5 rounded-2xl">
                  <p className="text-[10px] text-purple-950 font-semibold leading-relaxed">
                    🏥 This is an <strong>Offline Visit</strong>. Please enter the clinic room instructions or map location link below.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">
                  {acceptingAppt.type === 'online' ? 'Google Meet / Calendar Invite Link' : 'Clinic Instructions / Location Details'}
                </label>
                {acceptingAppt.type === 'online' ? (
                  <input 
                    required
                    type="text" 
                    value={customMeetUrl}
                    onChange={e => setCustomMeetUrl(e.target.value)}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none"
                  />
                ) : (
                  <textarea 
                    required
                    rows={3}
                    value={customMeetUrl}
                    onChange={e => setCustomMeetUrl(e.target.value)}
                    placeholder="e.g. Visit Room 302, 3rd floor. Bring your blood test reports. Map: https://maps.app.goo.gl/..."
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none font-bold"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setAcceptingAppt(null)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingMeetUrl}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  {savingMeetUrl ? 'Saving...' : 'Accept Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {completingAppt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl border border-slate-150 space-y-4 my-8 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-primary">
                <Pill className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-800">
                  {completingAppt.status === 'completed' ? 'Edit Consultation & Prescription' : 'Complete Consultation & Issue Prescription'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setCompletingAppt(null);
                  resetPrescriptionFields();
                }} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-150 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Patient: </span>
                <strong className="text-slate-900">{completingAppt.userId?.name || 'Patient'}</strong>
                <span className="text-slate-400 font-normal ml-2">({completingAppt.userId?.email || ''})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-indigo-700 font-bold">{formatDate(completingAppt.date)} at {completingAppt.time}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white border text-indigo-600">
                  {completingAppt.type || 'consultation'}
                </span>
              </div>
            </div>

            <form onSubmit={handlePopupNotesSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* Clinical Assessment / Diagnosis */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Clinical Diagnosis & Assessment <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  required
                  value={consultNotes} 
                  onChange={e => setConsultNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Primary diagnosis, symptoms, clinical findings... (Mandatory)"
                />
              </div>

              {/* Medicines Prescription Table */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-indigo-600">℞</span>
                    <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Prescribed Medicines</h5>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMedicineRow}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 flex items-center gap-1 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Medicine</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {medicinesList.map((med, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        {/* Medicine Name */}
                        <div className="sm:col-span-5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Medicine Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Paracetamol 500mg"
                            value={med.name}
                            onChange={e => handleUpdateMedicine(idx, 'name', e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
                          />
                        </div>

                        {/* Dosage */}
                        <div className="sm:col-span-3">
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Dosage</label>
                          <input
                            type="text"
                            placeholder="e.g. 1 Tab, 5ml"
                            value={med.dosage}
                            onChange={e => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
                          />
                        </div>

                        {/* Frequency */}
                        <div className="sm:col-span-4">
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Frequency</label>
                          <select
                            value={med.frequency}
                            onChange={e => handleUpdateMedicine(idx, 'frequency', e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                          >
                            <option value="1-0-1">1-0-1 (Twice Daily)</option>
                            <option value="1-0-0">1-0-0 (Morning Only)</option>
                            <option value="0-0-1">0-0-1 (Night Only)</option>
                            <option value="1-1-1">1-1-1 (Thrice Daily)</option>
                            <option value="Once Daily">Once Daily</option>
                            <option value="SOS / As Needed">SOS / As Needed</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        {/* Timing */}
                        <div className="sm:col-span-4">
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Timing</label>
                          <select
                            value={med.timing}
                            onChange={e => handleUpdateMedicine(idx, 'timing', e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                          >
                            <option value="After Food">After Food</option>
                            <option value="Before Food">Before Food</option>
                            <option value="With Food">With Food</option>
                            <option value="At Bedtime">At Bedtime</option>
                            <option value="Empty Stomach">Empty Stomach</option>
                          </select>
                        </div>

                        {/* Duration */}
                        <div className="sm:col-span-3">
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Duration</label>
                          <input
                            type="text"
                            placeholder="e.g. 5 days, 1 month"
                            value={med.duration}
                            onChange={e => handleUpdateMedicine(idx, 'duration', e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
                          />
                        </div>

                        {/* Instructions */}
                        <div className="sm:col-span-4">
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Instructions</label>
                          <input
                            type="text"
                            placeholder="e.g. With warm water"
                            value={med.instructions}
                            onChange={e => handleUpdateMedicine(idx, 'instructions', e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
                          />
                        </div>

                        {/* Delete Button */}
                        <div className="sm:col-span-1 flex justify-end pt-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicineRow(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Remove medicine"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lifestyle Guidance & Follow-up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dietary & Lifestyle Advice</label>
                  <input
                    type="text"
                    value={dietaryAdvice}
                    onChange={e => setDietaryAdvice(e.target.value)}
                    placeholder="e.g. Hydrate 3L daily, Low glycemic carbs"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Follow-up Recommendation</label>
                  <input
                    type="text"
                    value={followUpDate}
                    onChange={e => setFollowUpDate(e.target.value)}
                    placeholder="e.g. Review in 14 days"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Professional Medical Prescription Generator & Upload */}
              <div className="space-y-2.5 bg-indigo-50/40 border border-indigo-150 p-3.5 rounded-2xl">
                <label className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                  Official Medical Prescription PDF Format
                </label>

                {prescriptionUrl ? (
                  <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-emerald-800">Medical Prescription PDF Ready</span>
                    </div>
                    <a
                      href={prescriptionUrl.startsWith('http') ? prescriptionUrl : `${apiUrl.replace(/\/api\/?$/, '')}${prescriptionUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      <span>View PDF</span>
                    </a>
                  </div>
                ) : null}

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleGeneratePrescriptionPdf}
                    disabled={isGeneratingPrescription}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>✨</span>
                    <span>{isGeneratingPrescription ? 'Generating...' : 'Generate Medical Prescription PDF'}</span>
                  </button>

                  <label className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs">
                    <Upload className="h-3.5 w-3.5 text-slate-500" />
                    <span>Upload PDF / Scan</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleUploadPrescriptionFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => {
                    setCompletingAppt(null);
                    resetPrescriptionFields();
                  }}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingNotes || (!consultNotes.trim() && !clinicalDiagnosis.trim())}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>
                    {savingNotes 
                      ? 'Saving & Generating...' 
                      : completingAppt.status === 'completed' 
                        ? 'Update Consultation & Prescription' 
                        : 'Submit & Complete Consultation'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Patient Modal */}
      {messagePatientModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-150 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-primary">
                <MessageSquare className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-800">Send Clinical Advice / Message</h3>
              </div>
              <button 
                type="button"
                onClick={() => setMessagePatientModal(null)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Sending direct message to <strong className="text-slate-800">{messagePatientModal.patientName}</strong>. 
              This will be instantly delivered as an in-app notification, mobile push notification, and email.
            </p>

            <form onSubmit={handleSendMessageToPatient} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subject / Topic</label>
                <input
                  type="text"
                  required
                  value={messageSubject}
                  onChange={e => setMessageSubject(e.target.value)}
                  placeholder="e.g. Dietary Advice & Medication Follow-up"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Message / Advice</label>
                <textarea
                  required
                  rows={5}
                  value={messageBody}
                  onChange={e => setMessageBody(e.target.value)}
                  placeholder="Write clinical advice, suggested dosage alterations, or lifestyle notes..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMessagePatientModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{sendingMessage ? 'Sending...' : 'Send to Patient'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient History Modal */}
      {patientHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl border border-slate-150 space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Consultation History: {patientHistoryModal.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{patientHistoryModal.email} • {patientHistoryModal.mobileNumber || 'No phone'}</p>
              </div>
              <button 
                type="button"
                onClick={() => setPatientHistoryModal(null)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {patientHistoryModal.allAppointments?.map((appt: any) => (
                <div key={appt._id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-slate-800">{formatDate(appt.date)} at {appt.time}</span>
                      <span className="text-[11px] text-slate-500 block">Reason: {appt.reason}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      appt.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                      appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
                      {appt.status}
                    </span>
                  </div>

                  {appt.notes && (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-150 text-xs text-slate-700">
                      <strong className="text-[10px] uppercase text-slate-400 block mb-0.5">Clinical Assessment / Notes:</strong>
                      <p className="whitespace-pre-line">{appt.notes}</p>
                    </div>
                  )}

                  {Array.isArray(appt.medicines) && appt.medicines.length > 0 && (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-150 text-xs">
                      <strong className="text-[10px] uppercase text-slate-400 block mb-1">Prescribed Medicines:</strong>
                      <div className="space-y-1">
                        {appt.medicines.map((m: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-700">
                            <span className="font-bold">{m.name}</span>
                            <span className="text-slate-400">({m.dosage})</span>
                            <span className="text-indigo-600 font-semibold">{m.frequency}</span>
                            <span className="text-slate-500">• {m.timing}</span>
                            <span className="text-slate-400">• {m.duration}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPatientHistoryModal(null);
                        openPrescriptionModalForAppt(appt);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Pill className="h-3.5 w-3.5" />
                      <span>Edit Notes / Prescribe</span>
                    </button>

                    {appt.prescriptionUrl && (
                      <a
                        href={appt.prescriptionUrl.startsWith('http') ? appt.prescriptionUrl : `${apiUrl.replace(/\/api\/?$/, '')}${appt.prescriptionUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 transition-all flex items-center gap-1 shadow-2xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Prescription PDF</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
