import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, LogOut, FileText, User, Settings, 
  Users, BarChart3, Star, CheckCircle
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
}

type TabType = 'dashboard' | 'appointments' | 'calendar' | 'patients' | 'availability' | 'notes' | 'prescriptions' | 'feedback' | 'profile' | 'settings';

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ apiUrl, token, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [calendarTab, setCalendarTab] = useState<'month' | 'week' | 'day'>('month');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [expandedApptId, setExpandedApptId] = useState<string | null>(null);

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
  const [prescriptionText, setPrescriptionText] = useState('');
  const [prescriptionUrl, setPrescriptionUrl] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [completingAppt, setCompletingAppt] = useState<any | null>(null);

  // Accept/Custom link states
  const [acceptingAppt, setAcceptingAppt] = useState<any | null>(null);
  const [customMeetUrl, setCustomMeetUrl] = useState('');
  const [savingMeetUrl, setSavingMeetUrl] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAppointments(),
      fetchDoctorProfile(),
      fetchFeedback(),
      fetchDashboardStats()
    ]);
    setLoading(false);
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
          consultationFee: data.consultationFee || 0,
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
      const res = await fetch(`${apiUrl}/doctor/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
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

  const handleConsultNotesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApptForNotes) return;
    if (!consultNotes.trim()) {
      alert('Clinical consultation notes are mandatory to complete the appointment.');
      return;
    }
    setSavingNotes(true);
    try {
      const res = await fetch(`${apiUrl}/doctor/appointments/${selectedApptForNotes._id}/consultation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: consultNotes,
          prescriptionText,
          prescriptionUrl,
          status: 'completed'
        })
      });
      if (res.ok) {
        alert('Consultation completed successfully! Confirmation email and SMS sent to doctor and patient.');
        setSelectedApptForNotes(null);
        setConsultNotes('');
        setPrescriptionText('');
        setPrescriptionUrl('');
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

  const handlePopupNotesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingAppt) return;
    if (!consultNotes.trim()) {
      alert('Clinical consultation notes are mandatory to complete the appointment.');
      return;
    }
    setSavingNotes(true);
    try {
      const res = await fetch(`${apiUrl}/doctor/appointments/${completingAppt._id}/consultation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: consultNotes,
          prescriptionText,
          prescriptionUrl,
          status: 'completed'
        })
      });
      if (res.ok) {
        alert('Consultation completed successfully! Confirmation email and SMS sent to doctor and patient.');
        setCompletingAppt(null);
        setConsultNotes('');
        setPrescriptionText('');
        setPrescriptionUrl('');
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
    const list: any[] = [];
    const patientIds = new Set<string>();
    appointments.forEach(appt => {
      if (appt.userId && !patientIds.has(appt.userId._id)) {
        patientIds.add(appt.userId._id);
        list.push({
          ...appt.userId,
          lastVisit: appt.date,
          lastReason: appt.reason
        });
      }
    });
    return list;
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
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans antialiased">
      
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
                  onClick={() => setActiveTab(item.key as TabType)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === item.key ? 'bg-primary text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
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
                <h1 className="text-xl font-black text-slate-800">Dr. {doctorInfo?.name || 'Consultant'}</h1>
                <span className="text-[10px] text-indigo-650 font-bold uppercase tracking-wider">{profileForm.specialty || 'General Practitioner'}</span>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{new Date().toDateString()}</span>
            </div>

            {/* TAB CONTENT: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                          {/* Stats widgets */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl"><Calendar className="h-5 w-5" /></div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Visits</span>
                      <h3 className="text-xl font-black text-slate-800 mt-1">{stats.todayAppointmentsCount}</h3>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle className="h-5 w-5" /></div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total Revenue</span>
                      <h3 className="text-xl font-black text-slate-800 mt-1">Rs. {Number(dbStats.totalRevenue || 0).toFixed(2)}</h3>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 bg-teal-50 text-teal-600 rounded-2xl"><BarChart3 className="h-5 w-5" /></div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Online Revenue</span>
                      <h3 className="text-xl font-black text-slate-850 mt-1">Rs. {Number(dbStats.onlineRevenue || 0).toFixed(2)}</h3>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl"><Users className="h-5 w-5" /></div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Offline Revenue</span>
                      <h3 className="text-xl font-black text-slate-800 mt-1">Rs. {Number(dbStats.offlineRevenue || 0).toFixed(2)}</h3>
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
                              onClick={() => {
                                setCompletingAppt(appt);
                                setConsultNotes(appt.notes || '');
                                setPrescriptionText(appt.prescriptionText || '');
                                setPrescriptionUrl(appt.prescriptionUrl || '');
                              }}
                              className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Mark as Completed
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
                          <div className="pt-2">
                            {appt.feedback ? (
                              <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5 text-xs text-slate-700">
                                <div className="flex items-center gap-1 text-amber-500 font-bold mb-1">
                                  <span>{'★'.repeat(appt.feedback.rating)}{'☆'.repeat(5 - appt.feedback.rating)}</span>
                                  <span className="text-[10px] text-slate-400 font-bold">({appt.feedback.rating}/5)</span>
                                </div>
                                <p className="italic">"{appt.feedback.feedbackText}"</p>
                              </div>
                            ) : (
                              <div className="text-center py-2 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-500 italic">
                                Waiting for patient review...
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
            {activeTab === 'calendar' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">My Clinical Bookings Calendar</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Visual monthly scheduler tracker</p>
                  </div>
                  <div className="flex gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    {(['month', 'week', 'day'] as const).map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setCalendarTab(tab)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                          calendarTab === tab ? 'bg-primary text-white shadow' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* MONTH VIEW */}
                {calendarTab === 'month' && (
                  <>
                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-2">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 35 }).map((_, idx) => {
                        const dayNum = (idx % 31) + 1;
                        const dateStr = `2026-07-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                        const dayAppts = appointments.filter(a => a.date === dateStr);
                        return (
                          <div key={idx} className="border border-slate-100 rounded-2xl p-3 min-h-[90px] bg-slate-50/50 flex flex-col justify-between hover:border-slate-350 transition-all">
                            <span className="text-[10px] font-black text-slate-400 self-start">{dayNum}</span>
                            <div className="space-y-1 overflow-y-auto max-h-[50px] scrollbar-none">
                              {dayAppts.map(appt => (
                                <div 
                                  key={appt._id}
                                  className={`p-1 rounded text-[9px] font-bold text-left truncate leading-tight ${
                                    appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    appt.status === 'completed' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                    appt.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                    'bg-amber-50 text-amber-600 border-amber-100'
                                  }`}
                                >
                                  {appt.time} - {appt.userId?.name}
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
                  <div className="grid grid-cols-7 gap-4">
                    {['Mon 13', 'Tue 14', 'Wed 15', 'Thu 16', 'Fri 17', 'Sat 18', 'Sun 19'].map((day, idx) => {
                      const dateStr = `2026-07-${13 + idx}`;
                      const dayAppts = appointments.filter(a => a.date === dateStr);
                      return (
                        <div key={day} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/40 min-h-[300px] flex flex-col gap-2">
                          <span className="text-xs font-bold text-slate-800 text-center pb-2 border-b border-slate-100">{day}</span>
                          <div className="flex-1 space-y-2 overflow-y-auto max-h-[250px] scrollbar-none">
                            {dayAppts.map(appt => (
                              <div 
                                key={appt._id} 
                                className={`p-2 rounded-xl text-[10px] font-bold border flex flex-col gap-1 ${
                                  appt.status === 'confirmed' ? 'bg-emerald-555/10 text-emerald-600 border-emerald-100' :
                                  appt.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                  appt.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                  'bg-amber-50 text-amber-600 border-amber-100'
                                }`}
                              >
                                <span>🕒 {appt.time}</span>
                                <span className="truncate">{appt.userId?.name}</span>
                              </div>
                            ))}
                            {dayAppts.length === 0 && <span className="text-[10px] text-slate-400 italic block text-center mt-10">No visits</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* DAY VIEW */}
                {calendarTab === 'day' && (
                  <div className="space-y-2 border border-slate-100 rounded-3xl p-4 bg-slate-50/20 max-h-[400px] overflow-y-auto">
                    {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(hour => {
                      const hourAppts = appointments.filter(a => a.date === '2026-07-15' && a.time.startsWith(hour.split(':')[0]));
                      return (
                        <div key={hour} className="flex gap-4 items-center py-2.5 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-400 w-16">{hour}</span>
                          <div className="flex-1 flex gap-2 overflow-x-auto">
                            {hourAppts.map(appt => (
                              <div 
                                key={appt._id}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-3 ${
                                  appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  appt.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                  appt.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                  'bg-amber-50 text-amber-600 border-amber-100'
                                }`}
                              >
                                <span>{appt.userId?.name}</span>
                                <span className="text-[10px] text-slate-400">Reason: {appt.reason}</span>
                              </div>
                            ))}
                            {hourAppts.length === 0 && <span className="text-xs text-slate-400 italic">No bookings scheduled for this hour</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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
                        <th className="p-4">Email</th>
                        <th className="p-4 text-center">Last Appointment</th>
                        <th className="p-4">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {getUniquePatients().map(p => (
                        <tr key={p._id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-bold text-slate-800">{p.name}</td>
                          <td className="p-4">{p.email}</td>
                          <td className="p-4 text-center font-bold text-indigo-650">{p.lastVisit}</td>
                          <td className="p-4 font-normal text-slate-555">{p.lastReason}</td>
                        </tr>
                      ))}
                      {getUniquePatients().length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-slate-400 italic">No patients listed in directory.</td>
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
                  <h2 className="text-base font-bold text-slate-800">Consultation Notes Writer</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Select a confirmed appointment to record diagnostic summaries and prescriptions</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Sidebar list of confirmed appointments */}
                  <div className="space-y-3 lg:col-span-1">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Confirmed Patients</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                      {appointments.filter(a => a.status === 'confirmed').map(appt => (
                        <div 
                          key={appt._id} 
                          onClick={() => {
                            setSelectedApptForNotes(appt);
                            setConsultNotes(appt.notes || '');
                            setPrescriptionText(appt.prescriptionText || '');
                            setPrescriptionUrl(appt.prescriptionUrl || '');
                          }}
                          className={`p-3 border rounded-2xl cursor-pointer transition-all ${
                            selectedApptForNotes?._id === appt._id 
                              ? 'border-primary bg-indigo-50/20 text-indigo-755' 
                              : 'border-slate-200 bg-white hover:border-slate-350 text-slate-700'
                          }`}
                        >
                          <h4 className="font-bold text-xs">{appt.userId?.name}</h4>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">🕒 {formatDate(appt.date)} at {appt.time}</span>
                        </div>
                      ))}
                      {appointments.filter(a => a.status === 'confirmed').length === 0 && (
                        <p className="text-xs text-slate-450 italic">No active confirmed appointments.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Form Editor */}
                  <div className="lg:col-span-2">
                    {selectedApptForNotes ? (
                      <form onSubmit={handleConsultNotesSubmit} className="bg-slate-50 border border-slate-150 rounded-3xl p-6 space-y-4">
                        <div className="pb-3 border-b border-slate-200">
                          <h4 className="font-bold text-sm text-slate-800">Consultation for {selectedApptForNotes.userId?.name}</h4>
                          <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">Reason: {selectedApptForNotes.reason}</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Clinical Notes / Diagnostics Summary <span className="text-rose-500">*</span></label>
                          <textarea 
                            required
                            value={consultNotes} 
                            onChange={e => setConsultNotes(e.target.value)}
                            rows={4}
                            className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none"
                            placeholder="Describe symptoms, assessment, diagnosis details... (Mandatory)"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Digital Prescription Text</label>
                          <textarea 
                            value={prescriptionText} 
                            onChange={e => setPrescriptionText(e.target.value)}
                            rows={3}
                            className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none"
                            placeholder="e.g. Paracetamol 500mg - Twice daily after meals - 5 days..."
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attached File / Prescription PDF URL (Optional)</label>
                          <input 
                            type="text" 
                            value={prescriptionUrl} 
                            onChange={e => setPrescriptionUrl(e.target.value)}
                            placeholder="http://example.com/prescription.pdf"
                            className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                          <button 
                            type="button" 
                            onClick={() => setSelectedApptForNotes(null)}
                            className="px-4 py-2 bg-slate-200 rounded-xl text-xs font-bold text-slate-655"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            disabled={savingNotes}
                            className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                          >
                            {savingNotes ? 'Saving...' : 'Submit Notes & Complete Visit'}
                          </button>
                        </div>

                      </form>
                    ) : (
                      <div className="border border-dashed border-slate-300 rounded-3xl p-10 text-center text-slate-400 text-xs py-20 bg-slate-50/50">
                        Choose a patient appointment card from the list to launch the consultation notes editor.
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in duration-200">
            <div className="flex items-center gap-2 text-primary">
              <FileText className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-800">Complete Consultation</h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Please enter consultation notes to complete the appointment with <strong>{completingAppt.userId?.name || 'patient'}</strong>.
            </p>

            <form onSubmit={handlePopupNotesSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                  Clinical Notes / Diagnostics Summary <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  required
                  value={consultNotes} 
                  onChange={e => setConsultNotes(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="Describe symptoms, assessment, diagnosis details... (Mandatory)"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                  Digital Prescription Text (Optional)
                </label>
                <textarea 
                  value={prescriptionText} 
                  onChange={e => setPrescriptionText(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="e.g. Paracetamol 500mg - Twice daily after meals - 5 days..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                  Attached File / Prescription PDF URL (Optional)
                </label>
                <input 
                  type="text" 
                  value={prescriptionUrl} 
                  onChange={e => setPrescriptionUrl(e.target.value)}
                  placeholder="http://example.com/prescription.pdf"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => {
                    setCompletingAppt(null);
                    setConsultNotes('');
                    setPrescriptionText('');
                    setPrescriptionUrl('');
                  }}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingNotes || !consultNotes.trim()}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {savingNotes ? 'Completing...' : 'Submit & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
