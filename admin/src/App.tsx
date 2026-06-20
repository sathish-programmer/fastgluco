import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const getEmbedUrl = (url: string) => {
  if (url.includes('youtube.com/watch?v=')) {
    return url.replace('watch?v=', 'embed/').split('&')[0];
  }
  if (url.includes('youtu.be/')) {
    return url.replace('youtu.be/', 'youtube.com/embed/').split('?')[0];
  }
  return url;
};
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import {
  Users,
  LayoutDashboard,
  Utensils,
  Video,
  BookOpen,
  Bell,
  LogOut,
  ShieldAlert,
  Search,
  Plus,
  Trash2,
  Edit,
  Calendar,
  Send,
  Loader2,
  CheckCircle,
  Activity,
  UserCheck,
  UserX,
  CreditCard,
  DollarSign,
  Percent,
  Award,
  FileUp,
  HelpCircle,
  FileText,
  Save,
  MessageSquare,
  Crown,
  Bot,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const AdminPanelContent: React.FC = () => {
  const { admin, token, isAuthenticated, login, register, logout, error, clearError, apiUrl } = useAdminAuth();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Registration form state
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<'Admin' | 'Editor'>('Admin');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Active view: 'dashboard' | 'users' | 'foods' | 'videos' | 'guides' | 'notifications'
  const [activeView, setActiveView] = useState<string>('dashboard');

  // API Data states
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [foodPagination, setFoodPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [foods, setFoods] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [founders, setFounders] = useState<any[]>([]);
  const [showFounderModal, setShowFounderModal] = useState(false);
  const [editingFounderId, setEditingFounderId] = useState<string | null>(null);
  const [founderForm, setFounderForm] = useState({
    name: '',
    role: '',
    background: '',
    workDone: '',
    achievements: '',
    tryingToSolve: '',
    videoUrl: ''
  });

  // CRUD Form states
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [foodForm, setFoodForm] = useState({
    name: '',
    category: 'South Indian' as any,
    calories: 100,
    carbs: 20,
    protein: 5,
    fat: 2,
    fiber: 0,
    servingSize: 100,
    servingUnit: 'g',
    isActive: true
  });

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    url: '',
    thumbnailUrl: '',
    category: 'CGM Guide',
    targetPlatform: 'Both' as any
  });

  const [faqs, setFaqs] = useState<any[]>([]);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    platform: 'Both' as any,
    category: 'General',
    isActive: true,
    order: 0
  });

  const [tickets, setTickets] = useState<any[]>([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketAnswer, setTicketAnswer] = useState('');

  // Health Insights state
  const [healthInsights, setHealthInsights] = useState<any[]>([]);
  const [activeInsightText, setActiveInsightText] = useState('');
  const [insightSaving, setInsightSaving] = useState(false);

  // Legal Docs state
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [termsOfService, setTermsOfService] = useState('');
  const [legalSaving, setLegalSaving] = useState(false);

  const fetchLegalDocuments = async () => {
    try {
      const [priv, term] = await Promise.all([
        fetch(`${apiUrl}/legal/PrivacyPolicy`).then(r => r.json()).catch(() => ({ content: '' })),
        fetch(`${apiUrl}/legal/TermsOfService`).then(r => r.json()).catch(() => ({ content: '' }))
      ]);
      if (priv.content) setPrivacyPolicy(priv.content);
      if (term.content) setTermsOfService(term.content);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveLegal = async (type: string, content: string) => {
    try {
      setLegalSaving(true);
      const res = await fetch(`${apiUrl}/admin/legal/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ documentType: type, content })
      });
      if (res.ok) {
        alert('Legal Document saved successfully.');
      } else {
        alert('Error saving document.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLegalSaving(false);
    }
  };

  const [showGuideModal, setShowGuideModal] = useState(false);
  const [editingGuideId, setEditingGuideId] = useState<string | null>(null);
  const [guideForm, setGuideForm] = useState({
    title: '',
    content: '',
    category: 'Diet',
    readTime: 5
  });

  // Push notifications form state
  const [pushForm, setPushForm] = useState({
    userId: '',
    title: '',
    body: '',
    scheduledFor: ''
  });
  const [emailForm, setEmailForm] = useState({
    userId: '',
    title: '',
    body: ''
  });
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  // User activity modal states
  const [selectedUserActivity, setSelectedUserActivity] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [userModalTab, setUserModalTab] = useState<'overview' | 'food' | 'glucose' | 'reports' | 'coaching' | 'notify'>('overview');
  const [coachingSessions, setCoachingSessions] = useState<any[]>([]);
  const [userModalNotify, setUserModalNotify] = useState({ title: '', body: '' });

  // Subscription & Payment states
  const [plans, setPlans] = useState<any[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    code: '',
    description: '',
    monthlyPrice: 99,
    yearlyPrice: 999,
    trialDays: 7,
    displayOrder: 1,
    badge: 'None' as any,
    color: '#2563EB',
    isActive: true,
    features: {
      unlimitedReports: false,
      advancedAnalysis: false,
      premiumVideos: false,
      foodInsights: false,
      exportReports: false,
      notifications: false,
      aiCoaching: false,
      foodScanner: false
    }
  });

  // Coupon states
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    expiryDate: '',
    maxRedemptions: '',
    isActive: true
  });

  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [savingPaymentConfig, setSavingPaymentConfig] = useState(false);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txPagination, setTxPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState('');
  const [overrideForm, setOverrideForm] = useState({
    action: 'cancel' as 'cancel' | 'extend' | 'change-plan',
    days: 30,
    planId: '',
    billingCycle: 'monthly' as 'monthly' | 'yearly'
  });
  const [paymentTab, setPaymentTab] = useState<'billing' | 'common' | 'transactions' | 'branding'>('billing');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Fetch data depending on active view
  useEffect(() => {
    if (isAuthenticated) {
      if (activeView === 'dashboard') fetchStats();
      if (activeView === 'users') fetchUsers(1);
      if (activeView === 'foods') fetchFoods(1);
      if (activeView === 'videos') fetchVideos();
      if (activeView === 'guides') fetchGuides();
      if (activeView === 'faqs') fetchFaqs();
      if (activeView === 'tickets') fetchTickets();
      if (activeView === 'plans') fetchPlans();
      if (activeView === 'coupons') fetchCoupons();
      if (activeView === 'legal') fetchLegalDocuments();
      if (activeView === 'healthInsights') fetchHealthInsights();
      if (activeView === 'founders') fetchFounders();
      if (activeView === 'payments') {
        fetchPaymentConfig();
        fetchPaymentStats();
        fetchTransactions(1);
        fetchPlans();
      }
      if (activeView === 'aicoach') {
        fetchPaymentConfig();
      }
    }
  }, [isAuthenticated, activeView, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPaymentConfig();
    }
  }, [isAuthenticated]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setLoggingIn(true);
    await login(email, password);
    setLoggingIn(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (regPassword !== regConfirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }
    setLoggingIn(true);
    const success = await register(regName, regEmail, regRole, regPassword);
    setLoggingIn(false);
    if (success) {
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setIsRegistering(false);
    }
  };

  // --- API OPERATIONS ---

  const fetchStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async (pageNumber = 1) => {
    try {
      const res = await fetch(`${apiUrl}/admin/users?q=${encodeURIComponent(searchQuery)}&page=${pageNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleUserBlock = async (userId: string, currentBlockStatus: boolean) => {
    let reason = '';
    if (!currentBlockStatus) {
      // Prompt for reason only when blocking the user
      const promptReason = prompt('Please enter the reason for blocking this user account:');
      if (promptReason === null) return; // Cancel if prompt is cancelled
      reason = promptReason.trim();
      if (!reason) {
        alert('A block reason is required.');
        return;
      }
    }

    try {
      const response = await fetch(`${apiUrl}/admin/users/${userId}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isBlocked: !currentBlockStatus, reason })
      });
      if (response.ok) {
        fetchUsers(pagination.page);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user and all their food logs, reports, and notifications? This action cannot be undone.')) return;
    try {
      const response = await fetch(`${apiUrl}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        alert('User account deleted successfully.');
        fetchUsers(pagination.page);
      } else {
        const err = await response.json();
        alert(err.message || 'Error deleting user.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchUsers = () => {
    fetchUsers(1);
  };

  const fetchUserActivity = async (userId: string) => {
    try {
      setUserModalTab('overview');
      setSelectedUserActivity(null);
      setCoachingSessions([]);
      setActiveView('patient-details');
      const res = await fetch(`${apiUrl}/admin/users/${userId}/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedUserActivity(data);
        setUserModalNotify({
          title: 'Glucose & Food Alert',
          body: `Hi ${data.user.name || 'Patient'}, please check your glucose readings. Let's make sure we log our meals today to avoid any blood sugar spikes!`
        });
      }
      const coachRes = await fetch(`${apiUrl}/admin/users/${userId}/coaching`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (coachRes.ok) {
        const coachData = await coachRes.json();
        setCoachingSessions(coachData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendUserDirectNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserActivity?.user?._id) return;
    try {
      const response = await fetch(`${apiUrl}/admin/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUserActivity.user._id,
          title: userModalNotify.title,
          body: userModalNotify.body
        })
      });
      if (response.ok) {
        alert('Alert push notification dispatched successfully!');
      } else {
        alert('Failed to dispatch alert push notification.');
      }
    } catch (e) {
      console.error(e);
      alert('Error dispatching alert notification.');
    }
  };

  const fetchFoods = async (pageNumber = 1) => {
    try {
      const res = await fetch(`${apiUrl}/admin/food-library?q=${encodeURIComponent(searchQuery)}&page=${pageNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFoods(data.foods);
        setFoodPagination(data.pagination);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchFoods = () => {
    fetchFoods(1);
  };

  const handleFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingFoodId ? 'PUT' : 'POST';
      const endpoint = editingFoodId ? `${apiUrl}/admin/food-library/${editingFoodId}` : `${apiUrl}/admin/food-library`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(foodForm)
      });

      if (response.ok) {
        setShowFoodModal(false);
        setEditingFoodId(null);
        setFoodForm({ name: '', category: 'South Indian', calories: 100, carbs: 20, protein: 5, fat: 2, fiber: 0, servingSize: 100, servingUnit: 'g', isActive: true });
        fetchFoods();
      } else {
        const data = await response.json();
        alert(data.message || 'Error saving food.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`${apiUrl}/admin/food-library/bulk-import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        fetchFoods();
      } else {
        alert(data.message || 'Bulk import failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleDeleteFood = async (foodId: string) => {
    if (!confirm('Are you sure you want to delete this food template?')) return;
    try {
      const response = await fetch(`${apiUrl}/admin/food-library/${foodId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchFoods();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVideos = async () => {
    try {
      const res = await fetch(`${apiUrl}/videos`);
      if (res.ok) setVideos(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingVideoId ? 'PUT' : 'POST';
      const endpoint = editingVideoId ? `${apiUrl}/admin/videos/${editingVideoId}` : `${apiUrl}/admin/videos`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(videoForm)
      });

      if (response.ok) {
        setShowVideoModal(false);
        setEditingVideoId(null);
        setVideoForm({ title: '', description: '', url: '', thumbnailUrl: '', category: 'CGM Guide', targetPlatform: 'Both' as any });
        fetchVideos();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Delete this video?')) return;
    try {
      const response = await fetch(`${apiUrl}/admin/videos/${videoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchVideos();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGuides = async () => {
    try {
      const res = await fetch(`${apiUrl}/guides`);
      if (res.ok) setGuides(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleGuideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingGuideId ? 'PUT' : 'POST';
      const endpoint = editingGuideId ? `${apiUrl}/admin/guides/${editingGuideId}` : `${apiUrl}/admin/guides`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(guideForm)
      });

      if (response.ok) {
        setShowGuideModal(false);
        setEditingGuideId(null);
        setGuideForm({ title: '', content: '', category: 'Diet', readTime: 5 });
        fetchGuides();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGuide = async (guideId: string) => {
    if (!confirm('Delete this guide?')) return;
    try {
      const response = await fetch(`${apiUrl}/admin/guides/${guideId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchGuides();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setPushStatus(null);
    try {
      const isScheduled = !!pushForm.scheduledFor;
      const endpoint = isScheduled ? `${apiUrl}/admin/notifications/schedule` : `${apiUrl}/admin/notifications/send`;

      const payload = {
        title: pushForm.title,
        body: pushForm.body,
        userId: pushForm.userId || undefined,
        scheduledFor: pushForm.scheduledFor ? new Date(pushForm.scheduledFor).toISOString() : undefined
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setPushStatus(isScheduled ? 'Push notification scheduled successfully!' : 'Push notification broadcasted successfully!');
        setPushForm({ userId: '', title: '', body: '', scheduledFor: '' });
      } else {
        alert(data.message || 'Error occurred.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendManualEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setPushStatus(null);
    try {
      const payload = {
        title: emailForm.title,
        body: emailForm.body,
        userId: emailForm.userId || undefined
      };

      const response = await fetch(`${apiUrl}/admin/notifications/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        setPushStatus('Email dispatched successfully!');
        setEmailForm({ userId: '', title: '', body: '' });
      } else {
        alert(data.message || 'Error sending email.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- FAQs API ---
  const fetchFaqs = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/faqs`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setFaqs(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingFaqId ? 'PUT' : 'POST';
      const endpoint = editingFaqId ? `${apiUrl}/admin/faqs/${editingFaqId}` : `${apiUrl}/admin/faqs`;
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(faqForm)
      });
      if (response.ok) {
        setShowFaqModal(false);
        setEditingFaqId(null);
        setFaqForm({ question: '', answer: '', platform: 'Both', category: 'General', isActive: true, order: 0 });
        fetchFaqs();
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      const response = await fetch(`${apiUrl}/admin/faqs/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) fetchFaqs();
    } catch (e) { console.error(e); }
  };

  // --- Health Insights API ---
  const fetchHealthInsights = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/health-insights`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setHealthInsights(data);
        const active = data.find((insight: any) => insight.isActive);
        if (active) {
          setActiveInsightText(active.content);
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleSetInsightActive = async (id: string) => {
    try {
      setInsightSaving(true);
      const res = await fetch(`${apiUrl}/admin/health-insights/set-active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        alert('Active insight updated successfully!');
        fetchHealthInsights();
      }
    } catch (e) { console.error(e); } finally {
      setInsightSaving(false);
    }
  };

  const handleCustomInsightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInsightText.trim()) return;
    try {
      setInsightSaving(true);
      const res = await fetch(`${apiUrl}/admin/health-insights/set-active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: activeInsightText })
      });
      if (res.ok) {
        alert('Custom active health insight set successfully!');
        fetchHealthInsights();
      }
    } catch (e) { console.error(e); } finally {
      setInsightSaving(false);
    }
  };

  // --- FOUNDERS API ---
  const fetchFounders = async () => {
    try {
      const res = await fetch(`${apiUrl}/founders`);
      if (res.ok) setFounders(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleFounderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingFounderId ? 'PUT' : 'POST';
      const endpoint = editingFounderId ? `${apiUrl}/admin/founders/${editingFounderId}` : `${apiUrl}/admin/founders`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(founderForm)
      });

      if (response.ok) {
        setShowFounderModal(false);
        setEditingFounderId(null);
        setFounderForm({
          name: '',
          role: '',
          background: '',
          workDone: '',
          achievements: '',
          tryingToSolve: '',
          videoUrl: ''
        });
        fetchFounders();
      } else {
        const data = await response.json();
        alert(data.message || 'Error saving founder.');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving founder.');
    }
  };

  const handleDeleteFounder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this founder?')) return;
    try {
      const response = await fetch(`${apiUrl}/admin/founders/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchFounders();
      } else {
        const data = await response.json();
        alert(data.message || 'Error deleting founder.');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting founder.');
    }
  };

  // --- TICKETS API ---
  const fetchTickets = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/support/tickets`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setTickets(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleTicketAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      const res = await fetch(`${apiUrl}/admin/support/tickets/${selectedTicket._id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ answer: ticketAnswer })
      });
      if (res.ok) {
        alert('Answer sent to user via email.');
        setShowTicketModal(false);
        setSelectedTicket(null);
        setTicketAnswer('');
        fetchTickets();
      } else {
        const data = await res.json();
        alert(data.message || 'Error sending answer.');
      }
    } catch (e) { console.error(e); }
  };

  // --- SUBSCRIPTIONS & PAYMENTS API OPERATIONS ---

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/payments/plans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setPlans(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPaymentConfig = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/payments/config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setPaymentConfig(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/payments/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setPaymentStats(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTransactions = async (pageNumber = 1) => {
    try {
      const res = await fetch(`${apiUrl}/admin/payments/transactions?q=${encodeURIComponent(searchQuery)}&page=${pageNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setTxPagination(data.pagination);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingPlanId ? 'PUT' : 'POST';
      const endpoint = editingPlanId ? `${apiUrl}/admin/payments/plans/${editingPlanId}` : `${apiUrl}/admin/payments/plans`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(planForm)
      });

      if (response.ok) {
        setShowPlanModal(false);
        setEditingPlanId(null);
        setPlanForm({
          name: '',
          code: '',
          description: '',
          monthlyPrice: 99,
          yearlyPrice: 999,
          trialDays: 7,
          displayOrder: 1,
          badge: 'None',
          color: '#2563EB',
          isActive: true,
          features: {
            unlimitedReports: false,
            advancedAnalysis: false,
            premiumVideos: false,
            foodInsights: false,
            exportReports: false,
            notifications: false,
            aiCoaching: false,
            foodScanner: false
          }
        });
        fetchPlans();
      } else {
        const data = await response.json();
        alert(data.message || 'Error saving plan template.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      const response = await fetch(`${apiUrl}/admin/payments/plans/${planId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchPlans();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/payments/coupons?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingCouponId ? 'PUT' : 'POST';
      const url = editingCouponId
        ? `${apiUrl}/admin/payments/coupons/${editingCouponId}`
        : `${apiUrl}/admin/payments/coupons`;

      const bodyData = {
        code: couponForm.code,
        discountType: couponForm.discountType,
        discountValue: couponForm.discountValue,
        expiryDate: couponForm.expiryDate || undefined,
        maxRedemptions: couponForm.maxRedemptions !== '' ? parseInt(couponForm.maxRedemptions, 10) : undefined,
        isActive: couponForm.isActive
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        setShowCouponModal(false);
        setEditingCouponId(null);
        setCouponForm({
          code: '',
          discountType: 'percentage',
          discountValue: 10,
          expiryDate: '',
          maxRedemptions: '',
          isActive: true
        });
        fetchCoupons();
      } else {
        const data = await res.json();
        alert(data.message || 'Error processing coupon.');
      }
    } catch (err) {
      console.error('Error submitting coupon:', err);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`${apiUrl}/admin/payments/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCoupons();
      }
    } catch (err) {
      console.error('Error deleting coupon:', err);
    }
  };

  const toggleCouponStatus = async (coupon: any) => {
    try {
      const res = await fetch(`${apiUrl}/admin/payments/coupons/${coupon._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !coupon.isActive })
      });
      if (res.ok) {
        fetchCoupons();
      }
    } catch (err) {
      console.error('Error toggling coupon status:', err);
    }
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPaymentConfig(true);
    try {
      const response = await fetch(`${apiUrl}/admin/payments/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentConfig)
      });

      if (response.ok) {
        alert('Payment configurations updated successfully.');
        fetchPaymentConfig();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to save settings.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingPaymentConfig(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('logo', file);

    setUploadingLogo(true);
    try {
      const response = await fetch(`${apiUrl}/admin/branding/upload-logo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        setPaymentConfig({ ...paymentConfig, appLogoUrl: data.logoUrl });
        alert('Logo uploaded successfully! Click Save Settings to apply changes.');
      } else {
        alert(data.message || 'Logo upload failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;
    try {
      const response = await fetch(`${apiUrl}/admin/payments/transactions/${selectedTx._id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: refundAmount ? parseFloat(refundAmount) : undefined })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Refund processed successfully.');
        setSelectedTx(null);
        fetchTransactions(txPagination.page);
        fetchPaymentStats();
      } else {
        alert(data.message || 'Failed to process refund.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubId) return;
    try {
      let endpoint = '';
      let payload = {};

      if (overrideForm.action === 'cancel') {
        endpoint = `${apiUrl}/admin/payments/subscriptions/${selectedSubId}/cancel`;
      } else if (overrideForm.action === 'extend') {
        endpoint = `${apiUrl}/admin/payments/subscriptions/${selectedSubId}/extend`;
        payload = { days: overrideForm.days };
      } else if (overrideForm.action === 'change-plan') {
        endpoint = `${apiUrl}/admin/payments/subscriptions/${selectedSubId}/change-plan`;
        payload = { planId: overrideForm.planId, billingCycle: overrideForm.billingCycle };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        alert('Manual subscription override applied.');
        setShowOverrideModal(false);
        fetchTransactions(txPagination.page);
        fetchPaymentStats();
      } else {
        alert(data.message || 'Failed to apply override.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // RENDER SPLIT FOR AUTHENTICATION
  if (!isAuthenticated) {
    const displayedError = validationError || error;
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-200 w-full max-w-md">
          <div className="text-center mb-6">
            <span className="inline-flex items-center justify-center p-3 bg-blue-50 text-primary rounded-2xl mb-3">
              <ShieldAlert className="h-8 w-8 text-primary" />
            </span>
            <h2 className="text-2xl font-bold text-slate-800">
              {isRegistering ? 'Create Admin Account' : 'Admin Console'}
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              {isRegistering ? 'Register a new administrative console user' : 'Central Management Portal'}
            </p>
          </div>

          {displayedError && (
            <div className="mb-4 p-3 bg-red-50 text-danger text-xs font-semibold rounded-xl border border-red-100 flex justify-between items-center">
              <span>{displayedError}</span>
              <button 
                onClick={() => { setValidationError(null); clearError(); }} 
                className="text-red-500 hover:text-red-700 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={isRegistering ? handleRegisterSubmit : handleLoginSubmit} className="space-y-4">
            {isRegistering ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="admin@mitoreboot.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Role Type</label>
                  <select
                    value={regRole}
                    onChange={(e: any) => setRegRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium bg-white"
                  >
                    <option value="Admin">Admin (Full Control)</option>
                    <option value="Editor">Editor (Limited Control)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 font-semibold"
                    >
                      {showRegPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? "text" : "password"}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 font-semibold"
                    >
                      {showRegConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@mitoreboot.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Admin Password</label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 font-semibold"
                    >
                      {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl shadow-soft flex items-center justify-center space-x-2"
            >
              {loggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{isRegistering ? 'Registering...' : 'Logging in...'}</span>
                </>
              ) : (
                <span>{isRegistering ? 'Console Register' : 'Console Sign In'}</span>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setValidationError(null);
                clearError();
              }}
              className="text-xs font-bold text-primary hover:underline focus:outline-none"
            >
              {isRegistering ? 'Already have an account? Sign In' : 'Create Admin Account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // COLORS FOR CHART LEGEND
  const PIE_COLORS = ['#2563EB', '#14B8A6', '#F97316', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* 1. LEFT SIDEBAR PANEL */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center space-x-2">
            {paymentConfig?.appLogoUrl ? (
              <img src={paymentConfig.appLogoUrl} alt="Logo" className="h-6 w-6 object-contain rounded-md" />
            ) : (
              <Activity className="h-6 w-6 text-primary" />
            )}
            <h1 className="text-lg font-bold text-white tracking-tight">
              {paymentConfig?.appName || 'Mito_Reboot'} Admin
            </h1>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => { setActiveView('dashboard'); setSearchQuery(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'dashboard' ? 'bg-primary text-white' : 'hover:bg-slate-800'
                }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Overview Stats</span>
            </button>

            <button
              onClick={() => { setActiveView('users'); setSearchQuery(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'users' ? 'bg-primary text-white' : 'hover:bg-slate-800'
                }`}
            >
              <Users className="h-5 w-5" />
              <span>User Base</span>
            </button>

            <button
              onClick={() => { setActiveView('foods'); setSearchQuery(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'foods' ? 'bg-primary text-white' : 'hover:bg-slate-800'
                }`}
            >
              <Utensils className="h-5 w-5" />
              <span>Food Master Library</span>
            </button>

            <button
              onClick={() => { setActiveView('videos'); setSearchQuery(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'videos' ? 'bg-primary text-white' : 'hover:bg-slate-800'
                }`}
            >
              <Video className="h-5 w-5" />
              <span>Educational Videos</span>
            </button>

            <button
              onClick={() => { setActiveView('guides'); setSearchQuery(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'guides' ? 'bg-primary text-white' : 'hover:bg-slate-800'
                }`}
            >
              <BookOpen className="h-5 w-5" />
              <span>Educational Guides</span>
            </button>

            <button
              onClick={() => { setActiveView('notifications'); setSearchQuery(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'notifications' ? 'bg-primary text-white' : 'hover:bg-slate-800'
                }`}
            >
              <Bell className="h-5 w-5" />
              <span>Communications</span>
            </button>

            <button
              onClick={() => { setActiveView('faqs'); setSearchQuery(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'faqs' ? 'bg-primary text-white' : 'hover:bg-slate-800'
                }`}
            >
              <HelpCircle className="h-5 w-5" />
              <span>Dynamic FAQs</span>
            </button>

            <button
              onClick={() => { setActiveView('healthInsights'); setSearchQuery(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'healthInsights' ? 'bg-primary text-white' : 'hover:bg-slate-800'
                }`}
            >
              <Activity className="h-5 w-5" />
              <span>Health Insights</span>
            </button>

            <button
              onClick={() => { setActiveView('tickets'); setSearchQuery(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'tickets' ? 'bg-primary text-white' : 'hover:bg-slate-800'
                }`}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Support Q&A</span>
            </button>

            <button
              onClick={() => { setActiveView('plans'); setSearchQuery(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'plans' ? 'bg-primary text-white' : 'hover:bg-slate-800'
                }`}
            >
              <Crown className="h-5 w-5" />
              <span>Subscription Plans</span>
            </button>

            <button
              onClick={() => { setActiveView('aicoach'); setSearchQuery(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'aicoach' ? 'bg-primary text-white' : 'hover:bg-slate-800'
                }`}
            >
              <Bot className="h-5 w-5" />
              <span>AI Coach Settings</span>
            </button>

            <button
              onClick={() => { setActiveView('payments'); setSearchQuery(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'payments' ? 'bg-primary text-white' : 'hover:bg-slate-800'
                }`}
            >
              <DollarSign className="h-5 w-5" />
              <span>Branding & Payments</span>
            </button>

            <button
              onClick={() => { setActiveView('coupons'); setSearchQuery(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'coupons' ? 'bg-primary text-white' : 'hover:bg-slate-800'
                }`}
            >
              <Percent className="h-5 w-5" />
              <span>Promo Coupons</span>
            </button>

            <div className="pt-4 mt-4 border-t border-slate-700/50">
              <span className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Configuration</span>
            </div>

            <button
              onClick={() => { setActiveView('founders'); setSearchQuery(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'founders' ? 'bg-primary text-white' : 'hover:bg-slate-800'
                }`}
            >
              <Users className="h-5 w-5" />
              <span>Founders Section</span>
            </button>

            <button
              onClick={() => { setActiveView('legal'); setSearchQuery(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'legal' ? 'bg-primary text-white' : 'hover:bg-slate-800'
                }`}
            >
              <FileText className="h-5 w-5" />
              <span>Legal Documents</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3 text-xs font-semibold px-2">
            <div>
              <span className="block text-white truncate max-w-[120px]">{admin?.name}</span>
              <span className="text-[10px] text-slate-400 capitalize">{admin?.role}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl text-sm font-semibold text-slate-300 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN ADMIN VIEW AREA */}
      <main className="flex-1 min-w-0 overflow-y-auto px-8 py-6">

        {/* VIEW 1: DASHBOARD STATS */}
        {activeView === 'dashboard' && stats && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">System Dashboard</h2>

            {/* Counts Grid */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex items-center space-x-4">
                <div className="p-3 bg-blue-50 text-primary rounded-xl">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Patients</span>
                  <span className="text-2xl font-extrabold text-slate-800">{stats.totalUsers}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex items-center space-x-4">
                <div className="p-3 bg-teal-50 text-secondary rounded-xl">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Users (7d)</span>
                  <span className="text-2xl font-extrabold text-slate-800">{stats.activeUsers}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex items-center space-x-4">
                <div className="p-3 bg-orange-50 text-warning rounded-xl">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Reports Processed</span>
                  <span className="text-2xl font-extrabold text-slate-800">{stats.reportsUploaded}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex items-center space-x-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <Utensils className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Food Logs</span>
                  <span className="text-2xl font-extrabold text-slate-800">{stats.foodLogs}</span>
                </div>
              </div>
            </div>

            {/* Visual Analytics Graphs */}
            <div className="grid grid-cols-2 gap-6">
              {/* Category distribution Pie chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">Meal Category Distribution</h3>
                <div className="h-64 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categoryBreakdown}
                        dataKey="count"
                        nameKey="_id"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ _id, percent }) => `${_id}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {stats.categoryBreakdown.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Analytics Activity Bar chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">Database Log Totals</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Reports', count: stats.reportsUploaded },
                      { name: 'Meal Logs', count: stats.foodLogs },
                      { name: 'Total Patients', count: stats.totalUsers }
                    ]}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'semibold' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fontWeight: 'semibold' }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563EB" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: USER BASE MANAGEMENT */}
        {activeView === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Patient Directory</h2>
              <div className="relative w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                  placeholder="Search by name/email..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider text-left">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Daily Target</th>
                    <th className="px-6 py-4">Goal</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">No users found matching query.</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-800">
                          <button
                            onClick={() => fetchUserActivity(u._id)}
                            className="hover:underline hover:text-primary text-left font-bold text-slate-800 focus:outline-none"
                          >
                            {u.name}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{u.email}</td>
                        <td className="px-6 py-4">
                          {u.isBlocked ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-danger border border-red-100">
                              Blocked
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-success border border-green-100">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">{u.dailyCalorieTarget ? `${u.dailyCalorieTarget} kcal` : '--'}</td>
                        <td className="px-6 py-4 font-medium text-slate-500">{u.goal || '--'}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => fetchUserActivity(u._id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center space-x-1"
                            >
                              <Activity className="h-3.5 w-3.5" />
                              <span>Details</span>
                            </button>
                            <button
                              onClick={() => handleToggleUserBlock(u._id, u.isBlocked)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${u.isBlocked
                                ? 'bg-green-50 hover:bg-green-100 text-success border border-green-100'
                                : 'bg-red-50 hover:bg-red-100 text-danger border border-red-100'
                                }`}
                            >
                              {u.isBlocked ? (
                                <>
                                  <UserCheck className="h-4 w-4" />
                                  <span>Unblock</span>
                                </>
                              ) : (
                                <>
                                  <UserX className="h-4 w-4" />
                                  <span>Block</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 bg-red-100 hover:bg-red-200 text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-bold text-slate-400">Total: {pagination.total} patients</span>
                <div className="flex space-x-2">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => fetchUsers(pagination.page - 1)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-bold text-slate-600 px-3 py-1">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    disabled={pagination.page === pagination.pages}
                    onClick={() => fetchUsers(pagination.page + 1)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: FOOD MASTER LIBRARY TEMPLATES */}
        {activeView === 'foods' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Food Templates Library</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Define master items for patient quick logging.</p>
              </div>
              <div className="flex space-x-3">
                <div className="relative w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchFoods()}
                    placeholder="Search master foods..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
                  />
                </div>
                <div className="relative">
                  <input type="file" accept=".csv" onChange={handleBulkImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Bulk Import CSV" />
                  <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl text-sm flex items-center space-x-1.5 shadow-soft">
                    <FileUp className="h-4.5 w-4.5" />
                    <span>Import CSV</span>
                  </button>
                </div>
                <button
                  onClick={() => { setEditingFoodId(null); setFoodForm({ name: '', category: 'South Indian', calories: 100, carbs: 20, protein: 5, fat: 2, fiber: 0, servingSize: 100, servingUnit: 'g', isActive: true }); setShowFoodModal(true); }}
                  className="bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center space-x-1.5 shadow-soft"
                >
                  <Plus className="h-4.5 w-4.5" />
                  <span>Add Template</span>
                </button>
              </div>
            </div>

            {/* Foods Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider text-left">
                  <tr>
                    <th className="px-6 py-4">Food Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Calories</th>
                    <th className="px-6 py-4">Carbs</th>
                    <th className="px-6 py-4">Protein</th>
                    <th className="px-6 py-4">Fat</th>
                    <th className="px-6 py-4">Fiber</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {foods.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">No food templates seeded. Add one.</td>
                    </tr>
                  ) : (
                    foods.map((f) => (
                      <tr key={f._id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-800">{f.name}</td>
                        <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-500">{f.category}</span></td>
                        <td className="px-6 py-4 text-orange-600">{f.calories} kcal</td>
                        <td className="px-6 py-4 text-blue-600">{f.carbs}g</td>
                        <td className="px-6 py-4 text-teal-600">{f.protein}g</td>
                        <td className="px-6 py-4 text-slate-500">{f.fat}g</td>
                        <td className="px-6 py-4 text-emerald-600">{f.fiber || 0}g</td>
                        <td className="px-6 py-4 text-slate-500">
                          {f.isActive ? <span className="bg-green-50 text-success px-2 py-0.5 rounded text-[10px] font-bold border border-green-100">Active</span> : <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">Inactive</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => { setEditingFoodId(f._id); setFoodForm({ name: f.name, category: f.category, calories: f.calories, carbs: f.carbs, protein: f.protein, fat: f.fat, fiber: f.fiber || 0, servingSize: f.servingSize, servingUnit: f.servingUnit, isActive: f.isActive !== false }); setShowFoodModal(true); }}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-primary transition-all"
                            >
                              <Edit className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFood(f._id)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-danger transition-all"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls for Foods */}
            {foodPagination.pages > 1 && (
              <div className="flex justify-between items-center py-4 bg-slate-50 px-6 border border-slate-200 rounded-2xl">
                <span className="text-xs font-bold text-slate-500">
                  Showing {(foodPagination.page - 1) * foodPagination.limit + 1} to {Math.min(foodPagination.page * foodPagination.limit, foodPagination.total)} of {foodPagination.total} foods
                </span>
                <div className="flex space-x-2">
                  <button
                    disabled={foodPagination.page === 1}
                    onClick={() => fetchFoods(foodPagination.page - 1)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-bold text-slate-600 px-3 py-1">
                    Page {foodPagination.page} of {foodPagination.pages}
                  </span>
                  <button
                    disabled={foodPagination.page === foodPagination.pages}
                    onClick={() => fetchFoods(foodPagination.page + 1)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Food Modal Form */}
            {showFoodModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-md w-full shadow-lg">
                  <h3 className="text-base font-bold text-slate-800 mb-4">{editingFoodId ? 'Update Food Template' : 'Add Food Template'}</h3>
                  <form onSubmit={handleFoodSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Food Name</label>
                      <input
                        type="text"
                        required
                        value={foodForm.name}
                        onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                        <select
                          value={foodForm.category}
                          onChange={(e: any) => setFoodForm({ ...foodForm, category: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                        >
                          <option value="South Indian">South Indian</option>
                          <option value="North Indian">North Indian</option>
                          <option value="Snacks">Snacks</option>
                          <option value="Fruits">Fruits</option>
                          <option value="Vegetables">Vegetables</option>
                          <option value="Beverages">Beverages</option>
                          <option value="Dairy">Dairy</option>
                          <option value="Non-Veg">Non-Veg</option>
                          <option value="Sweets">Sweets</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Calories (kcal)</label>
                        <input
                          type="number"
                          required
                          value={foodForm.calories}
                          onChange={(e) => setFoodForm({ ...foodForm, calories: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Carbs (g)</label>
                        <input
                          type="number"
                          required
                          value={foodForm.carbs}
                          onChange={(e) => setFoodForm({ ...foodForm, carbs: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-2 border border-slate-200 rounded-xl text-center text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Protein (g)</label>
                        <input
                          type="number"
                          required
                          value={foodForm.protein}
                          onChange={(e) => setFoodForm({ ...foodForm, protein: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-2 border border-slate-200 rounded-xl text-center text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fat (g)</label>
                        <input
                          type="number"
                          required
                          value={foodForm.fat}
                          onChange={(e) => setFoodForm({ ...foodForm, fat: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-2 border border-slate-200 rounded-xl text-center text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fiber (g)</label>
                        <input
                          type="number"
                          required
                          value={foodForm.fiber}
                          onChange={(e) => setFoodForm({ ...foodForm, fiber: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-2 border border-slate-200 rounded-xl text-center text-sm font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Serving Size</label>
                        <input
                          type="number"
                          required
                          value={foodForm.servingSize}
                          onChange={(e) => setFoodForm({ ...foodForm, servingSize: parseFloat(e.target.value) || 100 })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Unit</label>
                        <input
                          type="text"
                          required
                          value={foodForm.servingUnit}
                          onChange={(e) => setFoodForm({ ...foodForm, servingUnit: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                        <select
                          value={foodForm.isActive ? 'true' : 'false'}
                          onChange={(e) => setFoodForm({ ...foodForm, isActive: e.target.value === 'true' })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold bg-white"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowFoodModal(false)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm"
                      >
                        Save Template
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: EDUCATIONAL VIDEO EDITOR */}
        {activeView === 'videos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Educational Video Tutorials</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Upload streaming URLs or YouTube embed references.</p>
              </div>
              <button
                onClick={() => { setEditingVideoId(null); setVideoForm({ title: '', description: '', url: '', thumbnailUrl: '', category: 'CGM Guide', targetPlatform: 'Both' as any }); setShowVideoModal(true); }}
                className="bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center space-x-1.5 shadow-soft"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Upload Video</span>
              </button>
            </div>

            {/* Videos Listing Grid */}
            <div className="grid grid-cols-3 gap-6">
              {videos.length === 0 ? (
                <div className="col-span-3 text-center p-8 bg-white border border-slate-200 rounded-2xl text-sm text-slate-400">No videos configured.</div>
              ) : (
                videos.map((vid) => (
                  <div key={vid._id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-soft flex flex-col justify-between">
                    <div className="aspect-video w-full bg-slate-100 relative">
                      <iframe src={getEmbedUrl(vid.url)} className="w-full h-full border-none" />
                    </div>
                    <div className="p-4 flex-1">
                      <span className="text-[10px] font-bold text-primary bg-primary-light/50 px-2 py-0.5 rounded-full">{vid.category}</span>
                      <h4 className="text-sm font-bold text-slate-800 mt-2">{vid.title}</h4>
                      <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">{vid.description}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
                      <button
                        onClick={() => { setEditingVideoId(vid._id); setVideoForm({ title: vid.title, description: vid.description || '', url: vid.url, thumbnailUrl: vid.thumbnailUrl || '', category: vid.category, targetPlatform: vid.targetPlatform || 'Both' }); setShowVideoModal(true); }}
                        className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(vid._id)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-danger rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Video Modal Form */}
            {showVideoModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-md w-full shadow-lg">
                  <h3 className="text-base font-bold text-slate-800 mb-4">{editingVideoId ? 'Edit Video Link' : 'Add Video Link'}</h3>
                  <form onSubmit={handleVideoSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Title</label>
                      <input
                        type="text"
                        required
                        value={videoForm.title}
                        onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                      <textarea
                        value={videoForm.description}
                        onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium h-20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Video Stream URL</label>
                      <input
                        type="text"
                        required
                        value={videoForm.url}
                        onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })}
                        placeholder="https://www.youtube.com/embed/XXXXX"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Thumbnail link</label>
                        <input
                          type="text"
                          value={videoForm.thumbnailUrl}
                          onChange={(e) => setVideoForm({ ...videoForm, thumbnailUrl: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                        <input
                          type="text"
                          required
                          value={videoForm.category}
                          onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                          placeholder="CGM Guide, Dietary Tips"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowVideoModal(false)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl"
                      >
                        Save Video
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: EDUCATIONAL ARTICLES/GUIDES EDITOR */}
        {activeView === 'guides' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Educational Guide Articles</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Write guidelines and diet recommendations in plain text/markdown.</p>
              </div>
              <button
                onClick={() => { setEditingGuideId(null); setGuideForm({ title: '', content: '', category: 'Diet', readTime: 5 }); setShowGuideModal(true); }}
                className="bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center space-x-1.5 shadow-soft"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Create Guide</span>
              </button>
            </div>

            {/* Guides Grid */}
            <div className="grid grid-cols-2 gap-6">
              {guides.length === 0 ? (
                <div className="col-span-2 text-center p-8 bg-white border border-slate-200 rounded-2xl text-sm text-slate-400">No guides configured.</div>
              ) : (
                guides.map((g) => (
                  <div key={g._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-soft flex flex-col justify-between h-56">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-secondary bg-secondary-light/50 px-2 py-0.5 rounded-full">{g.category}</span>
                        <span className="text-[10px] font-semibold text-slate-400">{g.readTime} min read</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{g.title}</h4>
                      <p className="text-xs text-slate-400 font-medium mt-2 line-clamp-3 leading-relaxed">{g.content}</p>
                    </div>
                    <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 mt-4">
                      <button
                        onClick={() => { setEditingGuideId(g._id); setGuideForm({ title: g.title, content: g.content, category: g.category, readTime: g.readTime }); setShowGuideModal(true); }}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGuide(g._id)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-danger rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Guide Modal Form */}
            {showGuideModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-xl w-full shadow-lg">
                  <h3 className="text-base font-bold text-slate-800 mb-4">{editingGuideId ? 'Update Guide Article' : 'Create Guide Article'}</h3>
                  <form onSubmit={handleGuideSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Title</label>
                      <input
                        type="text"
                        required
                        value={guideForm.title}
                        onChange={(e) => setGuideForm({ ...guideForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Content (Markdown / Text)</label>
                      <textarea
                        required
                        value={guideForm.content}
                        onChange={(e) => setGuideForm({ ...guideForm, content: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium h-48 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Write content..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                        <input
                          type="text"
                          required
                          value={guideForm.category}
                          onChange={(e) => setGuideForm({ ...guideForm, category: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Read Time (minutes)</label>
                        <input
                          type="number"
                          required
                          value={guideForm.readTime}
                          onChange={(e) => setGuideForm({ ...guideForm, readTime: parseInt(e.target.value, 10) || 5 })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowGuideModal(false)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm"
                      >
                        Save Guide
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 6: PUSH NOTIFICATION SENDER AND SCHEDULER */}
        {activeView === 'notifications' && (
          <>
            <div className="space-y-6 max-w-xl mx-auto bg-white p-6 rounded-3xl border border-slate-200 shadow-soft mt-8">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Dispatch Push Alert</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Send custom FCM push alerts immediately or schedule them for the future.</p>
              </div>

              {pushStatus && (
                <div className="p-4 bg-green-50 border border-green-100 text-success rounded-xl flex items-center space-x-2 text-xs font-semibold">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  <span>{pushStatus}</span>
                </div>
              )}

              <form onSubmit={handleSendPush} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Recipient User ID (Optional)</label>
                  <input
                    type="text"
                    value={pushForm.userId}
                    onChange={(e) => setPushForm({ ...pushForm, userId: e.target.value })}
                    placeholder="Broadcast to all users if left blank"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notification Title</label>
                  <input
                    type="text"
                    required
                    value={pushForm.title}
                    onChange={(e) => setPushForm({ ...pushForm, title: e.target.value })}
                    placeholder="Daily Glucose Summary, Log Reminder"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notification Message</label>
                  <textarea
                    required
                    value={pushForm.body}
                    onChange={(e) => setPushForm({ ...pushForm, body: e.target.value })}
                    placeholder="Remember to log your meals every 3 hours to maintain healthy profiles."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium h-24 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Schedule Dispatch (Optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={pushForm.scheduledFor}
                    onChange={(e) => setPushForm({ ...pushForm, scheduledFor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500"
                  />
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Leave blank to dispatch immediately.</p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-4 rounded-xl shadow-soft flex items-center justify-center space-x-2"
                >
                  <Send className="h-4.5 w-4.5" />
                  <span>{pushForm.scheduledFor ? 'Schedule Notification' : 'Broadcast Instantly'}</span>
                </button>
              </form>
            </div>

            <div className="space-y-6 max-w-xl mx-auto bg-white p-6 rounded-3xl border border-slate-200 shadow-soft mt-8">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Dispatch Manual Email</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Send custom email to a specific user or all users.</p>
              </div>

              <form onSubmit={handleSendManualEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Recipient User ID (Optional)</label>
                  <input
                    type="text"
                    value={emailForm.userId}
                    onChange={(e) => setEmailForm({ ...emailForm, userId: e.target.value })}
                    placeholder="Broadcast to all users with email if left blank"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Subject</label>
                  <input
                    type="text"
                    required
                    value={emailForm.title}
                    onChange={(e) => setEmailForm({ ...emailForm, title: e.target.value })}
                    placeholder="Subject"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Body</label>
                  <textarea
                    required
                    value={emailForm.body}
                    onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                    placeholder="Email text..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium h-24 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-soft flex items-center justify-center space-x-2"
                >
                  <Send className="h-4.5 w-4.5" />
                  <span>Send Email</span>
                </button>
              </form>
            </div>
          </>
        )}

        {/* VIEW 6.1: FAQS */}
        {activeView === 'faqs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Dynamic FAQs</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage frequently asked questions for both Website and App.</p>
              </div>
              <button
                onClick={() => { setEditingFaqId(null); setFaqForm({ question: '', answer: '', platform: 'Both', category: 'General', isActive: true, order: 0 }); setShowFaqModal(true); }}
                className="bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center space-x-1.5 shadow-soft"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Add FAQ</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider text-left">
                  <tr>
                    <th className="px-6 py-4">Question</th>
                    <th className="px-6 py-4">Platform</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {faqs.map(f => (
                    <tr key={f._id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-slate-800"><div className="w-64 truncate">{f.question}</div></td>
                      <td className="px-6 py-4"><span className="bg-blue-50 text-primary px-2 py-1 rounded text-xs">{f.platform}</span></td>
                      <td className="px-6 py-4">{f.category}</td>
                      <td className="px-6 py-4">{f.isActive ? 'Active' : 'Inactive'}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => { setEditingFaqId(f._id); setFaqForm({ question: f.question, answer: f.answer, platform: f.platform, category: f.category, isActive: f.isActive, order: f.order }); setShowFaqModal(true); }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><Edit className="h-4.5 w-4.5" /></button>
                        <button onClick={() => handleDeleteFaq(f._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400"><Trash2 className="h-4.5 w-4.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showFaqModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-2xl w-full shadow-lg">
                  <h3 className="text-base font-bold text-slate-800 mb-4">{editingFaqId ? 'Edit FAQ' : 'Add FAQ'}</h3>
                  <form onSubmit={handleFaqSubmit} className="space-y-4">
                    <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Question</label><input type="text" required value={faqForm.question} onChange={e => setFaqForm({ ...faqForm, question: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" /></div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Answer</label>
                      <ReactQuill
                        theme="snow"
                        value={faqForm.answer}
                        onChange={value => setFaqForm({ ...faqForm, answer: value })}
                        className="bg-white rounded-xl overflow-hidden border border-slate-200"
                        style={{ height: '220px', marginBottom: '45px' }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Platform</label><select value={faqForm.platform} onChange={e => setFaqForm({ ...faqForm, platform: e.target.value as any })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"><option value="App">App</option><option value="Website">Website</option><option value="Both">Both</option></select></div>
                      <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label><input type="text" required value={faqForm.category} onChange={e => setFaqForm({ ...faqForm, category: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" /></div>
                    </div>
                    <div className="flex space-x-3 pt-2">
                      <button type="button" onClick={() => setShowFaqModal(false)} className="flex-1 py-2 bg-slate-100 rounded-xl font-semibold">Cancel</button>
                      <button type="submit" className="flex-1 py-2 bg-primary text-white font-bold rounded-xl">Save FAQ</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 6.1b: HEALTH INSIGHTS */}
        {activeView === 'healthInsights' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Health Insights</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage the daily health insight shown on the patient dashboard.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Daily Insight Form */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-soft">
                <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span>Active Daily Insight</span>
                </h3>
                <form onSubmit={handleCustomInsightSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Insight Text Content</label>
                    <textarea
                      required
                      value={activeInsightText}
                      onChange={(e) => setActiveInsightText(e.target.value)}
                      placeholder="Type a custom daily tip or select one from the templates..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium h-32 focus:outline-none focus:border-primary transition-all leading-relaxed"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={insightSaving}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-4 rounded-xl shadow-soft flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {insightSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    <span>{insightSaving ? 'Saving...' : 'Set Active for Patients'}</span>
                  </button>
                </form>
              </div>

              {/* Templated / Prefilled Insights */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60">
                <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center space-x-2">
                  <Award className="h-5 w-5 text-secondary" />
                  <span>Easy Access Templates</span>
                </h3>
                <p className="text-xs text-slate-400 font-semibold mb-4">Click any template below to load it into the editor or activate it directly.</p>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {healthInsights.map((insight) => (
                    <div
                      key={insight._id}
                      onClick={() => setActiveInsightText(insight.content)}
                      className={`p-3.5 rounded-2xl border text-xs font-semibold leading-relaxed transition-all cursor-pointer ${
                        insight.isActive
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          insight.isActive ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {insight.isActive ? 'Active Now' : insight.isTemplate ? 'Template' : 'Custom'}
                        </span>
                        {!insight.isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetInsightActive(insight._id);
                            }}
                            className="text-[9px] font-extrabold text-primary hover:underline"
                          >
                            Set Active
                          </button>
                        )}
                      </div>
                      <p>{insight.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6.2: TICKETS */}
        {activeView === 'tickets' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Support Q&A</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Answer questions submitted from the website or app.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {tickets.map(t => (
                <div key={t._id} className="bg-white rounded-2xl border border-slate-200 shadow-soft p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{t.name} <span className="text-slate-400 font-medium text-xs">({t.email})</span></h4>
                      <p className="text-xs text-slate-500 mt-1">{new Date(t.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${t.status === 'Open' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-success'}`}>{t.status}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl mt-2">
                    <p className="text-sm font-semibold text-slate-700">Q: {t.question}</p>
                  </div>
                  {t.status === 'Answered' ? (
                    <div className="bg-blue-50 p-3 rounded-xl mt-2 border border-blue-100">
                      <p className="text-sm font-semibold text-primary">A: {t.answer}</p>
                    </div>
                  ) : (
                    <div className="mt-3 flex justify-end">
                      <button onClick={() => { setSelectedTicket(t); setTicketAnswer(''); setShowTicketModal(true); }} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold flex items-center space-x-1"><MessageSquare className="h-4 w-4" /> <span>Answer & Email</span></button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {showTicketModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-md w-full shadow-lg">
                  <h3 className="text-base font-bold text-slate-800 mb-4">Reply to Ticket</h3>
                  <div className="bg-slate-50 p-3 rounded-xl mb-4"><p className="text-xs font-bold text-slate-600">{selectedTicket?.question}</p></div>
                  <form onSubmit={handleTicketAnswer} className="space-y-4">
                    <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Your Answer</label><textarea required value={ticketAnswer} onChange={e => setTicketAnswer(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm h-32" placeholder="This will be emailed to the user..." /></div>
                    <div className="flex space-x-3 pt-2">
                      <button type="button" onClick={() => setShowTicketModal(false)} className="flex-1 py-2 bg-slate-100 rounded-xl font-semibold">Cancel</button>
                      <button type="submit" className="flex-1 py-2 bg-primary text-white font-bold rounded-xl">Send Answer</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 7: SUBSCRIPTION PLANS MANAGEMENT */}
        {activeView === 'plans' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Subscription Plans Master</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Configure billing tiers and feature-level access controls.</p>
              </div>
              <button
                onClick={() => {
                  setEditingPlanId(null);
                  setPlanForm({
                    name: '',
                    code: '',
                    description: '',
                    monthlyPrice: 99,
                    yearlyPrice: 999,
                    trialDays: 7,
                    displayOrder: 1,
                    badge: 'None',
                    color: '#2563EB',
                    isActive: true,
                    features: {
                      unlimitedReports: false,
                      advancedAnalysis: false,
                      premiumVideos: false,
                      foodInsights: false,
                      exportReports: false,
                      notifications: false,
                      aiCoaching: false,
                      foodScanner: false
                    }
                  });
                  setShowPlanModal(true);
                }}
                className="bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center space-x-1.5 shadow-soft"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Create Plan</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider text-left">
                  <tr>
                    <th className="px-6 py-4">Plan Name</th>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Prices</th>
                    <th className="px-6 py-4">Trial Period</th>
                    <th className="px-6 py-4">Features Check</th>
                    <th className="px-6 py-4">Display Order</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {plans.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">No subscription plans seeded. Create one.</td>
                    </tr>
                  ) : (
                    plans.map((p) => {
                      const activeFeatures = Object.entries(p.features || {})
                        .filter(([_, enabled]) => !!enabled)
                        .map(([key]) => key);

                      return (
                        <tr key={p._id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-800 flex items-center space-x-2">
                            <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: p.color || '#2563EB' }}></span>
                            <span className="whitespace-nowrap">{p.name}</span>
                            {p.badge && p.badge !== 'None' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold text-white whitespace-nowrap shrink-0" style={{ backgroundColor: p.color || '#2563EB' }}>
                                {p.badge}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-bold uppercase">{p.code}</td>
                          <td className="px-6 py-4">
                            <span className="text-slate-800 block">₹{p.monthlyPrice}/mo</span>
                            <span className="text-[10px] text-slate-400 font-bold block">₹{p.yearlyPrice}/yr</span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500">{p.trialDays} days</td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-primary font-bold bg-blue-50 px-2 py-1 rounded">
                              {activeFeatures.length} / 8 features
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500">{p.displayOrder}</td>
                          <td className="px-6 py-4">
                            {p.isActive ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-success border border-green-100">
                                Active
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-400 border border-slate-100">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => {
                                  setEditingPlanId(p._id);
                                  setPlanForm({
                                    name: p.name,
                                    code: p.code,
                                    description: p.description || '',
                                    monthlyPrice: p.monthlyPrice,
                                    yearlyPrice: p.yearlyPrice,
                                    trialDays: p.trialDays,
                                    displayOrder: p.displayOrder,
                                    badge: p.badge || 'None',
                                    color: p.color || '#2563EB',
                                    isActive: p.isActive,
                                    features: {
                                      unlimitedReports: !!p.features?.unlimitedReports,
                                      advancedAnalysis: !!p.features?.advancedAnalysis,
                                      premiumVideos: !!p.features?.premiumVideos,
                                      foodInsights: !!p.features?.foodInsights,
                                      exportReports: !!p.features?.exportReports,
                                      notifications: !!p.features?.notifications,
                                      aiCoaching: !!p.features?.aiCoaching,
                                      foodScanner: !!p.features?.foodScanner
                                    }
                                  });
                                  setShowPlanModal(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-primary transition-all"
                              >
                                <Edit className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePlan(p._id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-danger transition-all"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 7.5: PROMO COUPONS MANAGEMENT */}
        {activeView === 'coupons' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Promo Discount Coupons</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage and issue promotional discount coupon codes for plans.</p>
              </div>
              <button
                onClick={() => {
                  setEditingCouponId(null);
                  setCouponForm({
                    code: '',
                    discountType: 'percentage',
                    discountValue: 10,
                    expiryDate: '',
                    maxRedemptions: '',
                    isActive: true
                  });
                  setShowCouponModal(true);
                }}
                className="bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center space-x-1.5 shadow-soft"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Create Coupon</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider text-left">
                  <tr>
                    <th className="px-6 py-4">Coupon Code</th>
                    <th className="px-6 py-4">Discount Type</th>
                    <th className="px-6 py-4">Discount Value</th>
                    <th className="px-6 py-4">Redemptions</th>
                    <th className="px-6 py-4">Expiry Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">No discount coupons found. Create one.</td>
                    </tr>
                  ) : (
                    coupons.map((c) => {
                      const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
                      const isLimitReached = c.maxRedemptions !== undefined && c.redemptionsCount >= c.maxRedemptions;

                      return (
                        <tr key={c._id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-800 tracking-wider">
                            {c.code}
                          </td>
                          <td className="px-6 py-4 capitalize text-xs">
                            {c.discountType}
                          </td>
                          <td className="px-6 py-4 text-slate-800 font-extrabold">
                            {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium">
                            <span className="text-slate-800 font-bold">{c.redemptionsCount}</span>
                            {c.maxRedemptions !== undefined ? ` / ${c.maxRedemptions} max` : ' (unlimited)'}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-400">
                            {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'Never'}
                            {isExpired && <span className="text-[10px] text-red-500 font-bold ml-1.5">(Expired)</span>}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleCouponStatus(c)}
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all ${c.isActive && !isExpired && !isLimitReached
                                ? 'bg-green-50 text-success border-green-100 hover:bg-green-100'
                                : 'bg-red-50 text-danger border-red-100 hover:bg-red-100'
                                }`}
                            >
                              {c.isActive && !isExpired && !isLimitReached ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center space-x-1.5">
                              <button
                                onClick={() => {
                                  setEditingCouponId(c._id);
                                  setCouponForm({
                                    code: c.code,
                                    discountType: c.discountType,
                                    discountValue: c.discountValue,
                                    expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().split('T')[0] : '',
                                    maxRedemptions: c.maxRedemptions !== undefined ? c.maxRedemptions.toString() : '',
                                    isActive: c.isActive
                                  });
                                  setShowCouponModal(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-primary transition-all"
                              >
                                <Edit className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(c._id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-danger transition-all"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 8: PAYMENTS AND SUBSCRIPTIONS AUDIT & WIDGETS */}
        {activeView === 'payments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Branding & Payments Control</h2>
              {/* Sub-tab navigation */}
              <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => setPaymentTab('billing')}
                  className={`py-1.5 px-4 font-bold text-xs rounded-lg uppercase tracking-wider transition-all ${
                    paymentTab === 'billing'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Billing & Gateway
                </button>
                <button
                  onClick={() => setPaymentTab('common')}
                  className={`py-1.5 px-4 font-bold text-xs rounded-lg uppercase tracking-wider transition-all ${
                    paymentTab === 'common'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  General App Config
                </button>
                <button
                  onClick={() => setPaymentTab('transactions')}
                  className={`py-1.5 px-4 font-bold text-xs rounded-lg uppercase tracking-wider transition-all ${
                    paymentTab === 'transactions'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Transactions & Manual Control
                </button>
                <button
                  onClick={() => setPaymentTab('branding')}
                  className={`py-1.5 px-4 font-bold text-xs rounded-lg uppercase tracking-wider transition-all ${
                    paymentTab === 'branding'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  App Branding
                </button>
              </div>
            </div>

            {/* TAB 1: BILLING & GATEWAY SETTINGS */}
            {paymentTab === 'billing' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Gateway Toggle Config Form (Billing Only) */}
                {paymentConfig && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
                    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                      <CreditCard className="h-4 w-4" />
                      <span>Gateway Integrations Settings</span>
                    </h3>
                    <form onSubmit={handleConfigSubmit} className="space-y-4">
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <label className="flex items-center space-x-2.5 text-xs font-bold text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={paymentConfig.enableSubscriptions}
                              onChange={(e) => setPaymentConfig({ ...paymentConfig, enableSubscriptions: e.target.checked })}
                              className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary"
                            />
                            <span>Enforce Subscription Wall globally</span>
                          </label>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">If unchecked, all app premium sections are available freely.</p>
                        </div>

                        <div>
                          <label className="flex items-center space-x-2.5 text-xs font-bold text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={paymentConfig.enablePayments}
                              onChange={(e) => setPaymentConfig({ ...paymentConfig, enablePayments: e.target.checked })}
                              className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary"
                            />
                            <span>Enable Live Razorpay checkout</span>
                          </label>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">If unchecked, checkout runs mock success modes.</p>
                        </div>

                        <div>
                          <label className="flex items-center space-x-2.5 text-xs font-bold text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!paymentConfig.isSandbox}
                              onChange={(e) => setPaymentConfig({ ...paymentConfig, isSandbox: !e.target.checked })}
                              className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary"
                            />
                            <span>Production Live Gateway Mode</span>
                          </label>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">Sandbox toggle for API client runs.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-6 pt-3 border-t border-slate-100">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">GST Tax Percentage (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            required
                            value={paymentConfig.gstPercentage !== undefined ? paymentConfig.gstPercentage : 18}
                            onChange={(e) => setPaymentConfig({ ...paymentConfig, gstPercentage: parseInt(e.target.value) || 0 })}
                            placeholder="18"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                          />
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">Calculated as exclusive tax on top of subscription prices.</p>
                        </div>
                      </div>

                      {paymentConfig.enablePayments && (
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Razorpay Key ID</label>
                            <input
                              type="text"
                              required
                              value={paymentConfig.razorpayKeyId || ''}
                              onChange={(e) => setPaymentConfig({ ...paymentConfig, razorpayKeyId: e.target.value })}
                              placeholder="rzp_test_..."
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Razorpay Key Secret</label>
                            <input
                              type="password"
                              required
                              value={paymentConfig.razorpayKeySecret || ''}
                              onChange={(e) => setPaymentConfig({ ...paymentConfig, razorpayKeySecret: e.target.value })}
                              placeholder="••••••••••••"
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-xl text-xs shadow-soft transition-all"
                        >
                          Save Integration Settings
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Aggregates Dashboard widgets */}
                {paymentStats && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-4 gap-6">
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex items-center space-x-4">
                        <div className="p-3 bg-blue-50 text-primary rounded-xl">
                          <DollarSign className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
                          <span className="text-2xl font-extrabold text-slate-800">₹{paymentStats.totalRevenue}</span>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex items-center space-x-4">
                        <div className="p-3 bg-teal-50 text-secondary rounded-xl">
                          <Users className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Subscribers</span>
                          <span className="text-2xl font-extrabold text-slate-800">{paymentStats.activeSubscribers}</span>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex items-center space-x-4">
                        <div className="p-3 bg-orange-50 text-warning rounded-xl">
                          <Percent className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Revenue</span>
                          <span className="text-2xl font-extrabold text-slate-800">₹{paymentStats.monthlyRevenue}</span>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex items-center space-x-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                          <Award className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Today's Sales</span>
                          <span className="text-2xl font-extrabold text-slate-800">₹{paymentStats.todayRevenue}</span>
                        </div>
                      </div>
                    </div>

                    {/* Graphs for analytics */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Revenue Trend line */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
                        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">6-Month Revenue Trend (INR)</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={paymentStats.revenueTrend}>
                              <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 'semibold' }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 11, fontWeight: 'semibold' }} axisLine={false} tickLine={false} />
                              <Tooltip />
                              <Bar dataKey="revenue" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Plan share distributions */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
                        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">Plan Share Distribution</h3>
                        <div className="h-64 flex justify-center items-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={paymentStats.planWiseRevenue}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {paymentStats.planWiseRevenue.map((_: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: GENERAL APP CONFIG (Glucose Limits & Alerts) */}
            {paymentTab === 'common' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft animate-fadeIn">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                  <Activity className="h-4 w-4 text-primary" />
                  <span>General App Configuration Settings</span>
                </h3>
                {paymentConfig ? (
                  <form onSubmit={handleConfigSubmit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Safe Glucose Limit (mg/dL)</label>
                        <input
                          type="number"
                          min="50"
                          max="200"
                          required
                          value={paymentConfig.safeGlucoseThreshold !== undefined ? paymentConfig.safeGlucoseThreshold : 90}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, safeGlucoseThreshold: parseInt(e.target.value) || 0 })}
                          placeholder="90"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                        />
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Blood sugar levels at or below this are marked as Safe.</p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Moderate Glucose Limit (mg/dL)</label>
                        <input
                          type="number"
                          min="50"
                          max="300"
                          required
                          value={paymentConfig.moderateGlucoseThreshold !== undefined ? paymentConfig.moderateGlucoseThreshold : 110}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, moderateGlucoseThreshold: parseInt(e.target.value) || 0 })}
                          placeholder="110"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                        />
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Levels above this are Avoid; levels in between are Moderate.</p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Alert Min Interval (hours)</label>
                        <input
                          type="number"
                          min="1"
                          max="24"
                          required
                          value={paymentConfig.glucoseAlertMinIntervalHours !== undefined ? paymentConfig.glucoseAlertMinIntervalHours : 2}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, glucoseAlertMinIntervalHours: parseInt(e.target.value) || 2 })}
                          placeholder="2"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                        />
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Prevents alert emails from spamming; consecutive alerts wait at least this long.</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingPaymentConfig}
                        className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-xl text-xs shadow-soft transition-all"
                      >
                        {savingPaymentConfig ? 'Saving Settings...' : 'Save Settings'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-xs font-bold text-slate-400">Loading configurations...</p>
                )}
              </div>
            )}

            {/* TAB: APP BRANDING CONFIG */}
            {paymentTab === 'branding' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft animate-fadeIn">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                  <Award className="h-4 w-4 text-primary" />
                  <span>App Branding Settings</span>
                </h3>
                {paymentConfig ? (
                  <form onSubmit={handleConfigSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Application Name</label>
                        <input
                          type="text"
                          required
                          value={paymentConfig.appName !== undefined ? paymentConfig.appName : 'Mito_Reboot'}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, appName: e.target.value })}
                          placeholder="Mito_Reboot"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                        />
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Displayed in headers, sidebars, emails, and notifications. Fallback is Mito_Reboot.</p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Application Tagline</label>
                        <input
                          type="text"
                          required
                          value={paymentConfig.appTagline !== undefined ? paymentConfig.appTagline : 'The circadian fasting app'}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, appTagline: e.target.value })}
                          placeholder="The circadian fasting app"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                        />
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Displayed in user app, website pages, and footer areas.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">App Logo URL</label>
                        <div className="flex space-x-3">
                          <input
                            type="text"
                            value={paymentConfig.appLogoUrl || ''}
                            onChange={(e) => setPaymentConfig({ ...paymentConfig, appLogoUrl: e.target.value })}
                            placeholder="https://example.com/logo.png"
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                          />
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              id="logo-upload-input"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            <label
                              htmlFor="logo-upload-input"
                              className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs border border-slate-200 shadow-soft transition-all inline-block"
                            >
                              {uploadingLogo ? 'Uploading...' : 'Upload Image'}
                            </label>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Enter a direct image link or upload a logo file. Leave blank to default to the red heart icon.</p>
                      </div>
                    </div>

                    {paymentConfig.appLogoUrl && (
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Logo Preview</label>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 inline-block">
                          <img src={paymentConfig.appLogoUrl} alt="App Logo Preview" className="h-12 w-auto object-contain rounded-md" />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cancer Treatment Disclaimer</label>
                        <textarea
                          rows={3}
                          value={paymentConfig.cancerTreatmentDisclaimer !== undefined ? paymentConfig.cancerTreatmentDisclaimer : ''}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, cancerTreatmentDisclaimer: e.target.value })}
                          placeholder="Disclaimer: This app is for informational purposes only. If you are undergoing active cancer treatment, please consult with your oncologist before starting any circadian fasting protocols."
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                        />
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">This disclaimer popup is shown to users during registration if they select "CANCER TREATMENT".</p>
                      </div>

                      <div className="pt-4 border-t border-slate-100/50">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cancer Secondary Prevention Disclaimer</label>
                        <textarea
                          rows={3}
                          value={paymentConfig.cancerSecondaryDisclaimer !== undefined ? paymentConfig.cancerSecondaryDisclaimer : ''}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, cancerSecondaryDisclaimer: e.target.value })}
                          placeholder="Disclaimer: This app is for informational purposes only. If you have a previous history of cancer (secondary prevention), please consult with your medical team before starting any circadian fasting protocols."
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                        />
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">This disclaimer popup is shown to users during registration if they select "CANCER SECONDARY PREVENTION".</p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={savingPaymentConfig}
                        className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-xl text-xs shadow-soft transition-all"
                      >
                        {savingPaymentConfig ? 'Saving Settings...' : 'Save Settings'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-xs font-bold text-slate-400">Loading configurations...</p>
                )}
              </div>
            )}

            {/* TAB 3: TRANSACTIONS DIRECTORY & MANUAL OVERRIDES */}
            {paymentTab === 'transactions' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Transaction Records & Manual Controls</h3>
                  <div className="relative w-64">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search order or email..."
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider text-left">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Plan & Cycle</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Gateway Info</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Manage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400">No payment transaction logs matching criteria.</td>
                        </tr>
                      ) : (
                        transactions.map((tx) => (
                          <tr key={tx._id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4">
                              <span className="text-slate-800 font-bold block">{tx.userId?.name || 'Mito_Reboot Patient'}</span>
                              <span className="text-[10px] text-slate-400 block">{tx.userId?.email || '--'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-slate-800 uppercase font-bold block">{tx.planId?.name || '--'}</span>
                              <span className="text-[10px] text-slate-400 capitalize block">{tx.billingCycle || 'monthly'}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-800 font-extrabold">₹{tx.amount}</td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-400">
                              {new Date(tx.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-slate-500 font-semibold block">Order: {tx.gatewayOrderId || '--'}</span>
                              <span className="text-[9px] text-slate-400 font-semibold block">Pay ID: {tx.gatewayPaymentId || '--'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${tx.status === 'success' ? 'bg-green-50 text-success border-green-100' :
                                tx.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  tx.status === 'refunded' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                    'bg-red-50 text-danger border-red-100'
                                }`}>
                                {tx.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center space-x-2">
                                {tx.status === 'success' && (
                                  <button
                                    onClick={() => {
                                      setSelectedTx(tx);
                                      setRefundAmount(tx.amount.toString());
                                    }}
                                    className="px-2 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-lg text-xs font-bold text-purple-700 transition-all"
                                  >
                                    Refund
                                  </button>
                                )}
                                {tx.subscriptionId && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedSubId(tx.subscriptionId);
                                        setOverrideForm({
                                          action: 'extend',
                                          days: 30,
                                          planId: plans[0]?._id || '',
                                          billingCycle: 'monthly'
                                        });
                                        setShowOverrideModal(true);
                                      }}
                                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg text-xs font-bold text-primary transition-all"
                                    >
                                      Override
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (confirm('Are you sure you want to cancel and force-expire this user subscription immediately?')) {
                                          try {
                                            const response = await fetch(`${apiUrl}/admin/payments/subscriptions/${tx.subscriptionId}/cancel`, {
                                              method: 'POST',
                                              headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                              }
                                            });
                                            const data = await response.json();
                                            if (response.ok) {
                                              alert('Subscription cancelled successfully.');
                                              fetchTransactions(txPagination.page);
                                              fetchPaymentStats();
                                            } else {
                                              alert(data.message || 'Failed to cancel subscription.');
                                            }
                                          } catch (err) {
                                            console.error(err);
                                            alert('Error cancelling subscription.');
                                          }
                                        }
                                      }}
                                      className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg text-xs font-bold text-danger transition-all"
                                    >
                                      Cancel Sub
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Tx Pagination */}
                {txPagination.pages > 1 && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-bold text-slate-400">Total: {txPagination.total} payments</span>
                    <div className="flex space-x-2">
                      <button
                        disabled={txPagination.page === 1}
                        onClick={() => fetchTransactions(txPagination.page - 1)}
                        className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <span className="text-xs font-bold text-slate-600 px-3 py-1">
                        Page {txPagination.page} of {txPagination.pages}
                      </span>
                      <button
                        disabled={txPagination.page === txPagination.pages}
                        onClick={() => fetchTransactions(txPagination.page + 1)}
                        className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: CREATE / EDIT PLAN DIALOG */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                  {editingPlanId ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
                </h3>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handlePlanSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plan Name</label>
                    <input
                      type="text"
                      required
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      placeholder="Premium Plan"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plan Code</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingPlanId}
                      value={planForm.code}
                      onChange={(e) => setPlanForm({ ...planForm, code: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      placeholder="premium"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:outline-none disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                  <textarea
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    placeholder="Provide description of what is included in this tier."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium h-16 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monthly Price (INR)</label>
                    <input
                      type="number"
                      required
                      value={planForm.monthlyPrice}
                      onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Yearly Price (INR)</label>
                    <input
                      type="number"
                      required
                      value={planForm.yearlyPrice}
                      onChange={(e) => setPlanForm({ ...planForm, yearlyPrice: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Trial Period (Days)</label>
                    <input
                      type="number"
                      required
                      value={planForm.trialDays}
                      onChange={(e) => setPlanForm({ ...planForm, trialDays: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Badge</label>
                    <select
                      value={planForm.badge}
                      onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    >
                      <option value="None">None</option>
                      <option value="Popular">Popular</option>
                      <option value="Recommended">Recommended</option>
                      <option value="Best Value">Best Value</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plan Accent Color</label>
                    <input
                      type="color"
                      value={planForm.color}
                      onChange={(e) => setPlanForm({ ...planForm, color: e.target.value })}
                      className="w-full h-8 border border-slate-200 rounded-xl cursor-pointer p-0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Display Order</label>
                    <input
                      type="number"
                      required
                      value={planForm.displayOrder}
                      onChange={(e) => setPlanForm({ ...planForm, displayOrder: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Features Entitlements Checklist</span>
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.features.unlimitedReports}
                        onChange={(e) => setPlanForm({ ...planForm, features: { ...planForm.features, unlimitedReports: e.target.checked } })}
                        className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary"
                      />
                      <span>Unlimited Report Uploads</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.features.advancedAnalysis}
                        onChange={(e) => setPlanForm({ ...planForm, features: { ...planForm.features, advancedAnalysis: e.target.checked } })}
                        className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary"
                      />
                      <span>Advanced Spikes Analysis</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.features.premiumVideos}
                        onChange={(e) => setPlanForm({ ...planForm, features: { ...planForm.features, premiumVideos: e.target.checked } })}
                        className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary"
                      />
                      <span>Premium Guides & Videos</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.features.foodInsights}
                        onChange={(e) => setPlanForm({ ...planForm, features: { ...planForm.features, foodInsights: e.target.checked } })}
                        className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary"
                      />
                      <span>Top Foods Glycemic Insights</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.features.exportReports}
                        onChange={(e) => setPlanForm({ ...planForm, features: { ...planForm.features, exportReports: e.target.checked } })}
                        className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary"
                      />
                      <span>Export Comprehensive PDF Reports</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.features.notifications}
                        onChange={(e) => setPlanForm({ ...planForm, features: { ...planForm.features, notifications: e.target.checked } })}
                        className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary"
                      />
                      <span>Custom Reminders & Alerts</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.features.aiCoaching}
                        onChange={(e) => setPlanForm({ ...planForm, features: { ...planForm.features, aiCoaching: e.target.checked } })}
                        className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary"
                      />
                      <span>AI Coaching Assistant</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.features.foodScanner}
                        onChange={(e) => setPlanForm({ ...planForm, features: { ...planForm.features, foodScanner: e.target.checked } })}
                        className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary"
                      />
                      <span>AI Photo Food Scanner</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.isActive}
                      onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                      className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary"
                    />
                    <span>Active Plan Template</span>
                  </label>
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-soft transition-all"
                  >
                    Save Plan Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: TRANSACTION REFUND DIALOG */}
        {selectedTx && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                  Refund Payment Order
                </h3>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-600 space-y-2">
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="text-slate-800 font-bold">{selectedTx.gatewayOrderId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Original Amount:</span>
                  <span className="text-slate-800 font-bold">₹{selectedTx.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Billing Name:</span>
                  <span className="text-slate-800 font-bold">{selectedTx.userId?.name || 'Mito_Reboot User'}</span>
                </div>
              </div>

              <form onSubmit={handleRefundSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Refund Amount (INR)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={selectedTx.amount}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    Defaults to maximum amount: ₹{selectedTx.amount}. Will trigger automatic API SDK refunds if active.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-soft transition-all"
                >
                  Process Cryptographic Refund
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: MANUAL SUBSCRIPTION OVERRIDE DIALOG */}
        {showOverrideModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                  Manual Subscription Override
                </h3>
                <button
                  onClick={() => setShowOverrideModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleOverrideSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Action</label>
                  <select
                    value={overrideForm.action}
                    onChange={(e) => setOverrideForm({ ...overrideForm, action: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="extend">Extend Subscription Expiry Date</option>
                    <option value="change-plan">Upgrade / Downgrade Plan Tier</option>
                    <option value="cancel">Force Expire / Cancel Plan</option>
                  </select>
                </div>

                {overrideForm.action === 'extend' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Extend Period by (Days)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={overrideForm.days}
                      onChange={(e) => setOverrideForm({ ...overrideForm, days: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>
                )}

                {overrideForm.action === 'change-plan' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Target Plan</label>
                      <select
                        value={overrideForm.planId}
                        onChange={(e) => setOverrideForm({ ...overrideForm, planId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                      >
                        {plans.map((p) => (
                          <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Billing Cycle</label>
                      <select
                        value={overrideForm.billingCycle}
                        onChange={(e) => setOverrideForm({ ...overrideForm, billingCycle: e.target.value as any })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-semibold focus:outline-none"
                      >
                        <option value="monthly">Monthly Cycle (30 days)</option>
                        <option value="yearly">Yearly Cycle (365 days)</option>
                      </select>
                    </div>
                  </div>
                )}

                {overrideForm.action === 'cancel' && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-2 text-[10px] font-bold text-danger">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-danger mt-0.5" />
                    <span>Warning: Forcefully expiring a user subscription cuts off premium feature access immediately. An FCM notification will be sent.</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl text-xs shadow-soft transition-all"
                >
                  Apply Subscription Override
                </button>
              </form>
            </div>
          </div>
        )}
        {/* MODAL 4: CREATE / EDIT COUPON DIALOG */}
        {showCouponModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                  {editingCouponId ? 'Edit Coupon Code' : 'Create Promo Coupon'}
                </h3>
                <button
                  onClick={() => setShowCouponModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleCouponSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCouponId}
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                    placeholder="E.G. WELCOME50"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:outline-none disabled:bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Discount Type</label>
                    <select
                      value={couponForm.discountType}
                      onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Discount Value</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={couponForm.discountType === 'percentage' ? 100 : undefined}
                      value={couponForm.discountValue}
                      onChange={(e) => setCouponForm({ ...couponForm, discountValue: parseFloat(e.target.value) })}
                      placeholder={couponForm.discountType === 'percentage' ? '50' : '99'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-extrabold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={couponForm.expiryDate}
                      onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Redemptions (Optional)</label>
                    <input
                      type="number"
                      min={1}
                      value={couponForm.maxRedemptions}
                      onChange={(e) => setCouponForm({ ...couponForm, maxRedemptions: e.target.value })}
                      placeholder="Unlimited"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCoupon"
                    checked={couponForm.isActive}
                    onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                    className="h-4.5 w-4.5 border-slate-200 rounded-md focus:ring-primary text-primary"
                  />
                  <label htmlFor="isActiveCoupon" className="text-xs font-bold text-slate-600 uppercase select-none">
                    Coupon Active
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl text-xs shadow-soft transition-all"
                >
                  {editingCouponId ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 5: USER ACTIVITY DETAILS DIALOG */}
        {showUserModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 shrink-0">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                    Patient Details & Activity Log
                  </h3>
                  {selectedUserActivity?.user && (
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{selectedUserActivity.user.name} ({selectedUserActivity.user.email})</p>
                  )}
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Close
                </button>
              </div>

              {!selectedUserActivity ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                  <span className="font-semibold text-xs">Loading patient history...</span>
                </div>
              ) : (
                <>
                  {/* Tab Navigation */}
                  <div className="flex border-b border-slate-100 mb-4 shrink-0 overflow-x-auto no-scrollbar">
                    {(['overview', 'food', 'glucose', 'reports', 'coaching', 'notify'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setUserModalTab(tab)}
                        className={`px-4 py-2 text-xs font-extrabold uppercase border-b-2 transition-all -mb-[2px] whitespace-nowrap ${userModalTab === tab
                          ? 'border-primary text-primary'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                      >
                        {tab === 'notify' ? 'Send Alert' : tab}
                      </button>
                    ))}
                  </div>

                  {/* Scrollable Content Container */}
                  <div className="flex-1 overflow-y-auto pr-1 text-xs text-slate-700 font-semibold space-y-4">
                    {/* TAB 1: OVERVIEW */}
                    {userModalTab === 'overview' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Age</span>
                            <span className="text-slate-800 font-bold">{selectedUserActivity.user.age ?? '--'} yrs</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Gender</span>
                            <span className="text-slate-800 font-bold capitalize">{selectedUserActivity.user.gender ?? '--'}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Height / Weight</span>
                            <span className="text-slate-800 font-bold">
                              {selectedUserActivity.user.height ? `${selectedUserActivity.user.height} cm` : '--'} / {selectedUserActivity.user.weight ? `${selectedUserActivity.user.weight} kg` : '--'}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Activity Level</span>
                            <span className="text-slate-800 font-bold capitalize">{selectedUserActivity.user.activityLevel?.replace('-', ' ') ?? '--'}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 col-span-1">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Target Calories</span>
                            <span className="text-slate-800 font-extrabold text-sm">{selectedUserActivity.user.dailyCalorieTarget ? `${selectedUserActivity.user.dailyCalorieTarget} kcal` : '--'}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 col-span-1">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Diabetes Goal</span>
                            <span className="text-slate-800 font-bold capitalize">{selectedUserActivity.user.goal?.replace('-', ' ') ?? '--'}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 col-span-1">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">TDEE / BMR</span>
                            <span className="text-slate-800 font-bold">
                              {selectedUserActivity.user.tdee ? `${Math.round(selectedUserActivity.user.tdee)} kcal` : '--'} / {selectedUserActivity.user.bmr ? `${Math.round(selectedUserActivity.user.bmr)} kcal` : '--'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-blue-50/30 border border-blue-100/50 p-4 rounded-3xl space-y-2">
                          <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Activity Summary</h4>
                          <ul className="space-y-1 text-slate-600 font-medium text-[11px]">
                            <li>• Total Meals Logged: <strong className="text-slate-800">{selectedUserActivity.foodLogs?.length ?? 0}</strong></li>
                            <li>• Glucose Readings: <strong className="text-slate-800">{selectedUserActivity.glucoseReadings?.length ?? 0}</strong></li>
                            <li>• CGM Reports Uploaded: <strong className="text-slate-800">{selectedUserActivity.cgmReports?.length ?? 0}</strong></li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: FOOD LOGS */}
                    {userModalTab === 'food' && (
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-[11px]">
                          <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-left">
                            <tr>
                              <th className="px-4 py-3">Logged At</th>
                              <th className="px-4 py-3">Meal Name</th>
                              <th className="px-4 py-3">Category</th>
                              <th className="px-4 py-3">Meal Type</th>
                              <th className="px-4 py-3">Calories</th>
                              <th className="px-4 py-3">Macros (C/P/F)</th>
                              <th className="px-4 py-3">Spike Status</th>
                              <th className="px-4 py-3">User Feedback</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {!selectedUserActivity.foodLogs || selectedUserActivity.foodLogs.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="text-center py-6 text-slate-400">No meals logged yet.</td>
                              </tr>
                            ) : (
                              selectedUserActivity.foodLogs.map((log: any) => (
                                <tr key={log._id}>
                                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                                    {new Date(log.loggedAt).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 font-bold text-slate-800">{log.name}</td>
                                  <td className="px-4 py-3">{log.category}</td>
                                  <td className="px-4 py-3 capitalize">{log.mealType}</td>
                                  <td className="px-4 py-3 text-orange-600 font-bold">{log.calories} kcal</td>
                                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                    {log.carbs}g / {log.protein}g / {log.fat}g
                                  </td>
                                  <td className="px-4 py-3">
                                    {log.glucoseAnalysis ? (
                                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${log.glucoseAnalysis.status === 'Safe'
                                        ? 'bg-green-50 text-success border border-green-100'
                                        : log.glucoseAnalysis.status === 'Moderate'
                                          ? 'bg-orange-50 text-warning border border-orange-100'
                                          : 'bg-red-50 text-danger border border-red-100'
                                        }`}>
                                        {log.glucoseAnalysis.status} ({log.glucoseAnalysis.peakGlucose} mg/dL)
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 text-[10px]">No reading overlap</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {log.feedback ? (
                                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${log.feedback.isAccurate ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'
                                        }`}>
                                        {log.feedback.isAccurate ? 'Accurate' : 'Inaccurate'}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 text-[10px]">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* TAB 3: GLUCOSE READINGS */}
                    {userModalTab === 'glucose' && (
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-[11px]">
                          <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-left">
                            <tr>
                              <th className="px-4 py-3">Timestamp</th>
                              <th className="px-4 py-3">Glucose Level</th>
                              <th className="px-4 py-3">Source</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {!selectedUserActivity.glucoseReadings || selectedUserActivity.glucoseReadings.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="text-center py-6 text-slate-400">No glucose readings logged yet.</td>
                              </tr>
                            ) : (
                              selectedUserActivity.glucoseReadings.map((r: any) => (
                                <tr key={r._id}>
                                  <td className="px-4 py-3 text-slate-400">
                                    {new Date(r.timestamp).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 font-bold text-slate-800 text-sm">
                                    {r.value} mg/dL
                                  </td>
                                  <td className="px-4 py-3 text-slate-500">{r.source || 'Manual'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* TAB 4: CGM REPORTS */}
                    {userModalTab === 'reports' && (
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-[11px]">
                          <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-left">
                            <tr>
                              <th className="px-4 py-3">Uploaded At</th>
                              <th className="px-4 py-3">Report File Name</th>
                              <th className="px-4 py-3">Data Records</th>
                              <th className="px-4 py-3">Analysis Range</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {!selectedUserActivity.cgmReports || selectedUserActivity.cgmReports.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="text-center py-6 text-slate-400">No reports uploaded yet.</td>
                              </tr>
                            ) : (
                              selectedUserActivity.cgmReports.map((rep: any) => (
                                <tr key={rep._id}>
                                  <td className="px-4 py-3 text-slate-400">
                                    {new Date(rep.createdAt).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 font-bold text-slate-800">{rep.fileName}</td>
                                  <td className="px-4 py-3 text-slate-500">{rep.recordCount ?? 0} rows</td>
                                  <td className="px-4 py-3 text-slate-600">
                                    {rep.startDate ? new Date(rep.startDate).toLocaleDateString() : '--'} to {rep.endDate ? new Date(rep.endDate).toLocaleDateString() : '--'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {/* TAB 5: COACHING */}
                    {userModalTab === 'coaching' && (
                      <div className="space-y-4">
                        {coachingSessions.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 font-semibold text-xs border-2 border-dashed border-slate-100 rounded-2xl">
                            No AI coaching sessions triggered yet.
                          </div>
                        ) : (
                          coachingSessions.map((session: any) => (
                            <div key={session._id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                              <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100">
                                <div>
                                  <span className="text-xs font-bold text-slate-800">
                                    Trigger: {session.foodName || session.foodLogId?.name || 'Unknown Food'}
                                  </span>
                                  <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600">
                                    Spike: {session.peakGlucose} mg/dL
                                  </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${session.status === 'resolved' ? 'bg-green-50 text-success' : 'bg-amber-50 text-amber-600'
                                  }`}>
                                  {session.status}
                                </span>
                              </div>
                              <div className="space-y-3">
                                {session.messages.map((msg: any, i: number) => (
                                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] font-medium ${msg.role === 'user'
                                      ? 'bg-primary text-white rounded-tr-sm'
                                      : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-sm'
                                      }`}>
                                      <span className="block text-[9px] font-bold uppercase mb-1 opacity-70">
                                        {msg.role === 'user' ? 'Patient' : 'AI Assistant'}
                                      </span>
                                      {msg.content}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* TAB 6: SEND ALERT */}
                    {userModalTab === 'notify' && (
                      <form onSubmit={handleSendUserDirectNotification} className="space-y-4 max-w-md">
                        <div className="bg-blue-50/30 border border-blue-100/50 p-3 rounded-2xl text-[10px] text-primary">
                          This alert will dispatch a real-time push notification directly to the user's mobile device via FCM to advise them on their food intake or glycemic spike management.
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Alert Title</label>
                          <input
                            type="text"
                            required
                            value={userModalNotify.title}
                            onChange={(e) => setUserModalNotify({ ...userModalNotify, title: e.target.value })}
                            placeholder="E.G. High Glucose Warning"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-bold text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Message Content</label>
                          <textarea
                            required
                            rows={3}
                            value={userModalNotify.body}
                            onChange={(e) => setUserModalNotify({ ...userModalNotify, body: e.target.value })}
                            placeholder="Enter the alert advice instructions..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-semibold text-xs"
                          />
                        </div>

                        <button
                          type="submit"
                          className="bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2.5 rounded-xl shadow-soft flex items-center space-x-1.5 transition-all text-xs"
                        >
                          <Send className="h-4 w-4" />
                          <span>Dispatch Alert FCM</span>
                        </button>
                      </form>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {/* VIEW 9: LEGAL DOCUMENTS */}
        {activeView === 'legal' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Legal Documents</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage Privacy Policy and Terms of Service content (Markdown supported).</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-soft space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">Privacy Policy</h3>
                <button
                  onClick={() => handleSaveLegal('PrivacyPolicy', privacyPolicy)}
                  disabled={legalSaving}
                  className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center space-x-1.5 shadow-soft transition-all"
                >
                  <Save className="h-4 w-4" />
                  <span>{legalSaving ? 'Saving...' : 'Save Privacy Policy'}</span>
                </button>
              </div>
              <div className="bg-white [&_.ql-container]:rounded-b-2xl [&_.ql-toolbar]:rounded-t-2xl [&_.ql-editor]:min-h-[200px]">
                <ReactQuill
                  theme="snow"
                  value={privacyPolicy}
                  onChange={setPrivacyPolicy}
                  placeholder="Enter Privacy Policy content..."
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-soft space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">Terms of Service</h3>
                <button
                  onClick={() => handleSaveLegal('TermsOfService', termsOfService)}
                  disabled={legalSaving}
                  className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center space-x-1.5 shadow-soft transition-all"
                >
                  <Save className="h-4 w-4" />
                  <span>{legalSaving ? 'Saving...' : 'Save Terms'}</span>
                </button>
              </div>
              <div className="bg-white [&_.ql-container]:rounded-b-2xl [&_.ql-toolbar]:rounded-t-2xl [&_.ql-editor]:min-h-[200px]">
                <ReactQuill
                  theme="snow"
                  value={termsOfService}
                  onChange={setTermsOfService}
                  placeholder="Enter Terms of Service content..."
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 9.5: FOUNDERS SECTION */}
        {activeView === 'founders' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Founders Management</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage details and YouTube video links of your company's founders.</p>
              </div>
              <button
                onClick={() => {
                  setEditingFounderId(null);
                  setFounderForm({
                    name: '',
                    role: '',
                    background: '',
                    workDone: '',
                    achievements: '',
                    tryingToSolve: '',
                    videoUrl: ''
                  });
                  setShowFounderModal(true);
                }}
                className="bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center space-x-1.5 shadow-soft"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Add Founder</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {founders.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-400 font-semibold text-xs border-2 border-dashed border-slate-100 rounded-2xl">
                  No founders found. Click "Add Founder" to create one.
                </div>
              ) : (
                founders.map(f => (
                  <div key={f._id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">{f.name}</h3>
                          <p className="text-xs font-semibold text-primary">{f.role}</p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => {
                              setEditingFounderId(f._id);
                              setFounderForm({
                                name: f.name,
                                role: f.role,
                                background: f.background,
                                workDone: f.workDone,
                                achievements: f.achievements,
                                tryingToSolve: f.tryingToSolve,
                                videoUrl: f.videoUrl || ''
                              });
                              setShowFounderModal(true);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                          >
                            <Edit className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFounder(f._id)}
                            className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-xs text-slate-600">
                        <p><strong>Background:</strong> {f.background?.length > 150 ? f.background.slice(0, 150) + '...' : f.background}</p>
                        <p><strong>Work Done:</strong> {f.workDone?.length > 150 ? f.workDone.slice(0, 150) + '...' : f.workDone}</p>
                        {f.videoUrl && (
                          <div className="mt-3 p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-2 text-[11px] text-slate-500">
                            <span className="text-red-500">🎥</span>
                            <span className="truncate max-w-[280px] font-mono">{f.videoUrl}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {showFounderModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-2xl w-full shadow-lg my-8">
                  <h3 className="text-base font-bold text-slate-800 mb-4">{editingFounderId ? 'Edit Founder' : 'Add Founder'}</h3>
                  <form onSubmit={handleFounderSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Name</label>
                        <input
                          type="text"
                          required
                          value={founderForm.name}
                          onChange={e => setFounderForm({ ...founderForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Role / Designation</label>
                        <input
                          type="text"
                          required
                          value={founderForm.role}
                          onChange={e => setFounderForm({ ...founderForm, role: e.target.value })}
                          placeholder="e.g. Co-Founder & Chief Medical Officer"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Background Bio</label>
                      <textarea
                        required
                        rows={3}
                        value={founderForm.background}
                        onChange={e => setFounderForm({ ...founderForm, background: e.target.value })}
                        placeholder="Explain the founder's background, education, and credentials..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Work Done</label>
                      <textarea
                        required
                        rows={3}
                        value={founderForm.workDone}
                        onChange={e => setFounderForm({ ...founderForm, workDone: e.target.value })}
                        placeholder="Describe their past and current work, research, or clinical experience..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Achievements</label>
                      <textarea
                        required
                        rows={3}
                        value={founderForm.achievements}
                        onChange={e => setFounderForm({ ...founderForm, achievements: e.target.value })}
                        placeholder="List their major milestones, awards, or recognized contributions..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">What are we trying to solve?</label>
                      <textarea
                        required
                        rows={3}
                        value={founderForm.tryingToSolve}
                        onChange={e => setFounderForm({ ...founderForm, tryingToSolve: e.target.value })}
                        placeholder="Explain the vision/problems the founder is dedicated to solving with this platform..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">YouTube / Video URL (Optional)</label>
                      <input
                        type="url"
                        value={founderForm.videoUrl}
                        onChange={e => setFounderForm({ ...founderForm, videoUrl: e.target.value })}
                        placeholder="e.g. https://www.youtube.com/watch?v=..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                      />
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowFounderModal(false)}
                        className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors"
                      >
                        Save Founder
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI COACH SETTINGS TAB */}
        {activeView === 'aicoach' && (
          <div className="max-w-3xl">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                  <Bot className="h-6 w-6 text-primary mr-2" />
                  Advanced AI Coach Configuration
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Manage sequential chatbot questions and trigger limits for Premium users.
                </p>
              </div>
            </div>

            {paymentConfig ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <form onSubmit={handleConfigSubmit} className="space-y-6">

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">AI Trigger Threshold (mg/dL)</label>
                    <input
                      type="number"
                      min="50"
                      max="300"
                      required
                      value={paymentConfig.aiSpikeThreshold !== undefined ? paymentConfig.aiSpikeThreshold : 110}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, aiSpikeThreshold: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold bg-white focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="text-[11px] text-slate-400 font-semibold mt-1">If a food logs causes a spike above this value, the AI Coaching Chat will be initiated.</p>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sequential AI Questions</label>
                        <p className="text-[11px] text-slate-400 font-semibold mt-1">These questions will be asked one-by-one by the AI assistant.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newQ = [...(paymentConfig.aiQuestions || [])];
                          newQ.push('');
                          setPaymentConfig({ ...paymentConfig, aiQuestions: newQ });
                        }}
                        className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20"
                      >
                        + Add Question
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(paymentConfig.aiQuestions || []).map((q: string, i: number) => (
                        <div key={i} className="flex space-x-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={q}
                              placeholder={`Question ${i + 1}`}
                              onChange={(e) => {
                                const newQ = [...paymentConfig.aiQuestions];
                                newQ[i] = e.target.value;
                                setPaymentConfig({ ...paymentConfig, aiQuestions: newQ });
                              }}
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold bg-white focus:ring-2 focus:ring-primary/20"
                              required
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newQ = paymentConfig.aiQuestions.filter((_: any, idx: number) => idx !== i);
                              setPaymentConfig({ ...paymentConfig, aiQuestions: newQ });
                            }}
                            className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">AI Completion / Final Response</label>
                    <textarea
                      required
                      rows={3}
                      value={paymentConfig.aiCompletionMessage || ''}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, aiCompletionMessage: e.target.value })}
                      placeholder="Thank you for sharing this context. Remember to stay hydrated and walk 15 mins after heavy meals!"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold bg-white resize-none focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="text-[11px] text-slate-400 font-semibold mt-1">The automated response sent immediately after the user answers the final question.</p>
                  </div>

                  {/* Hydration Tracker Settings */}
                  <div className="border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center space-x-2">
                      <span>💧</span>
                      <span>Hydration Tracker Configuration</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Enable Hydration Tracker</label>
                        <div className="flex items-center space-x-3 mt-1">
                          <input
                            type="checkbox"
                            checked={paymentConfig.enableHydrationTracker !== false}
                            onChange={(e) => setPaymentConfig({ ...paymentConfig, enableHydrationTracker: e.target.checked })}
                            className="h-5 w-5 text-primary border-slate-300 rounded focus:ring-primary"
                            id="enableHydrationTracker"
                          />
                          <label htmlFor="enableHydrationTracker" className="text-xs font-bold text-slate-600">
                            {paymentConfig.enableHydrationTracker !== false ? 'Enabled (ON)' : 'Disabled (OFF)'}
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Daily Hydration Target Goal (ml)</label>
                        <input
                          type="number"
                          min="500"
                          max="10000"
                          step="50"
                          required
                          value={paymentConfig.hydrationDailyLimitMl !== undefined ? paymentConfig.hydrationDailyLimitMl : 3000}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, hydrationDailyLimitMl: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold bg-white focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Workout Tracker Settings */}
                  <div className="border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center space-x-2">
                      <span>🏃</span>
                      <span>Workout Tracker Configuration</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Enable Workout Tracker</label>
                        <div className="flex items-center space-x-3 mt-1">
                          <input
                            type="checkbox"
                            checked={paymentConfig.enableWorkoutTracker !== false}
                            onChange={(e) => setPaymentConfig({ ...paymentConfig, enableWorkoutTracker: e.target.checked })}
                            className="h-5 w-5 text-primary border-slate-300 rounded focus:ring-primary"
                            id="enableWorkoutTracker"
                          />
                          <label htmlFor="enableWorkoutTracker" className="text-xs font-bold text-slate-600">
                            {paymentConfig.enableWorkoutTracker !== false ? 'Enabled (ON)' : 'Disabled (OFF)'}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={savingPaymentConfig}
                      className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center"
                    >
                      {savingPaymentConfig ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                      {savingPaymentConfig ? 'Saving...' : 'Save AI Settings'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            )}
          </div>
        )}

        {/* VIEW 10: PATIENT DETAILS & ACTIVITY LOG — DEDICATED FULL PAGE */}
        {activeView === 'patient-details' && (
          <div className="space-y-6">
            {/* Back + Header */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveView('users')}
                className="flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-primary bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm transition-all hover:border-primary/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                <span>Back to Users</span>
              </button>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Patient Details &amp; Activity Log</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Full clinical overview, glucose tracking, meal logs, and AI coaching history.</p>
              </div>
            </div>

            {!selectedUserActivity ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-slate-400 font-semibold text-sm">Loading patient data...</p>
              </div>
            ) : (
              <>
                {/* HERO PATIENT CARD */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-primary rounded-3xl p-6 shadow-2xl text-white">
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)'}} />
                  <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-2xl font-black shadow-lg">
                        {(selectedUserActivity.user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-black">{selectedUserActivity.user.name || 'Unknown Patient'}</h3>
                        <p className="text-white/70 text-xs font-semibold">{selectedUserActivity.user.email}</p>
                        <div className="flex items-center space-x-2 mt-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${selectedUserActivity.user.isBlocked ? 'bg-red-400/30 text-red-100' : 'bg-green-400/30 text-green-100'}`}>
                            {selectedUserActivity.user.isBlocked ? '⛔ Blocked' : '✅ Active'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
                            ID: {selectedUserActivity.user._id?.slice(-8)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Age', value: selectedUserActivity.user.age ? `${selectedUserActivity.user.age} yrs` : '--' },
                        { label: 'Weight', value: selectedUserActivity.user.weight ? `${selectedUserActivity.user.weight} kg` : '--' },
                        { label: 'Height', value: selectedUserActivity.user.height ? `${selectedUserActivity.user.height} cm` : '--' },
                        { label: 'Goal', value: selectedUserActivity.user.goal?.replace('-', ' ') || '--' },
                      ].map((stat: any) => (
                        <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
                          <span className="block text-[9px] font-bold uppercase text-white/60">{stat.label}</span>
                          <span className="block text-sm font-black text-white capitalize">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* STAT CARDS ROW */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Meals Logged', value: selectedUserActivity.foodLogs?.length ?? 0, icon: <Utensils className="h-5 w-5" />, gradient: 'from-orange-400 to-amber-500', text: 'text-amber-600' },
                    { label: 'Glucose Readings', value: selectedUserActivity.glucoseReadings?.length ?? 0, icon: <Activity className="h-5 w-5" />, gradient: 'from-blue-400 to-indigo-500', text: 'text-blue-600' },
                    { label: 'CGM Reports', value: selectedUserActivity.cgmReports?.length ?? 0, icon: <FileUp className="h-5 w-5" />, gradient: 'from-purple-400 to-violet-500', text: 'text-purple-600' },
                    { label: 'AI Sessions', value: coachingSessions.length ?? 0, icon: <Bot className="h-5 w-5" />, gradient: 'from-green-400 to-emerald-500', text: 'text-green-600' },
                  ].map((card: any) => (
                    <div key={card.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center space-x-3">
                      <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-md shrink-0`}>
                        {card.icon}
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-slate-400">{card.label}</span>
                        <span className={`block text-2xl font-black ${card.text}`}>{card.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* TABBED CONTENT CARD */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
                  {/* Tab Bar */}
                  <div className="flex border-b border-slate-100 overflow-x-auto">
                    {[
                      { key: 'overview', label: '📋 Overview' },
                      { key: 'food', label: '🍽 Food Logs' },
                      { key: 'glucose', label: '📈 Glucose' },
                      { key: 'reports', label: '📄 CGM Reports' },
                      { key: 'coaching', label: '🤖 AI Coaching' },
                      { key: 'notify', label: '🔔 Send Alert' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setUserModalTab(tab.key as any)}
                        className={`px-5 py-3.5 text-[11px] font-bold whitespace-nowrap transition-all border-b-2 ${
                          userModalTab === tab.key
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-6">

                    {/* OVERVIEW TAB */}
                    {userModalTab === 'overview' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Health Profile</h4>
                          <div className="bg-slate-50/70 rounded-2xl p-4 space-y-0">
                            {[
                              { label: 'Gender', value: selectedUserActivity.user.gender || '--' },
                              { label: 'Activity Level', value: selectedUserActivity.user.activityLevel?.replace('-', ' ') || '--' },
                              { label: 'Daily Calorie Target', value: selectedUserActivity.user.dailyCalorieTarget ? `${selectedUserActivity.user.dailyCalorieTarget} kcal` : '--' },
                              { label: 'TDEE / BMR', value: `${selectedUserActivity.user.tdee ? Math.round(selectedUserActivity.user.tdee) + ' kcal' : '--'} / ${selectedUserActivity.user.bmr ? Math.round(selectedUserActivity.user.bmr) + ' kcal' : '--'}` },
                              { label: 'Health Goal', value: selectedUserActivity.user.goal?.replace('-', ' ') || '--' },
                            ].map((item: any) => (
                              <div key={item.label} className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
                                <span className="text-[11px] font-semibold text-slate-500 uppercase">{item.label}</span>
                                <span className="text-xs font-bold text-slate-800 capitalize">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Activity Summary</h4>
                          <div className="bg-slate-50/70 rounded-2xl p-4 space-y-0">
                            {[
                              { label: 'Total Meals Logged', value: `${selectedUserActivity.foodLogs?.length ?? 0} meals` },
                              { label: 'Glucose Readings', value: `${selectedUserActivity.glucoseReadings?.length ?? 0} readings` },
                              { label: 'CGM Reports Uploaded', value: `${selectedUserActivity.cgmReports?.length ?? 0} files` },
                              { label: 'AI Coaching Sessions', value: `${coachingSessions.length} sessions` },
                              { label: 'Active AI Sessions', value: `${coachingSessions.filter((s: any) => s.status === 'active').length} active` },
                            ].map((item: any) => (
                              <div key={item.label} className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
                                <span className="text-[11px] font-semibold text-slate-500 uppercase">{item.label}</span>
                                <span className="text-xs font-black text-primary">{item.value}</span>
                              </div>
                            ))}
                          </div>
                          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-4 text-white">
                            <p className="text-[10px] font-bold uppercase text-white/50 mb-1">Member Since</p>
                            <p className="text-sm font-black">{selectedUserActivity.user.createdAt ? new Date(selectedUserActivity.user.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' }) : '--'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* FOOD LOGS TAB */}
                    {userModalTab === 'food' && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Meal Logs ({selectedUserActivity.foodLogs?.length ?? 0})</h4>
                        {!selectedUserActivity.foodLogs || selectedUserActivity.foodLogs.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 font-semibold text-xs border-2 border-dashed border-slate-100 rounded-2xl">No meal logs found.</div>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-slate-100">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50">
                                <tr>
                                  {['Food', 'Meal Type', 'Quantity', 'Calories', 'Carbs', 'Protein', 'Fat', 'Glucose Status', 'User Feedback', 'Logged At'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left font-extrabold text-slate-500 uppercase text-[10px] whitespace-nowrap">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {selectedUserActivity.foodLogs.map((log: any) => (
                                  <tr key={log._id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{log.name}</td>
                                    <td className="px-4 py-3 text-slate-500 capitalize whitespace-nowrap">{log.mealType}</td>
                                    <td className="px-4 py-3 text-slate-600 font-semibold whitespace-nowrap">{log.quantity} {log.unit}</td>
                                    <td className="px-4 py-3 font-bold text-amber-600 whitespace-nowrap">{log.calories} kcal</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{log.carbs}g</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{log.protein}g</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{log.fat}g</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      {log.glucoseAnalysis ? (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${log.glucoseAnalysis.status === 'Safe' ? 'bg-green-50 text-green-700' : log.glucoseAnalysis.status === 'Moderate' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                                          {log.glucoseAnalysis.status} ({log.glucoseAnalysis.peakGlucose} mg/dL)
                                        </span>
                                      ) : <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      {log.feedback ? (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${log.feedback.isAccurate ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                          {log.feedback.isAccurate ? '👍 Accurate' : '👎 Inaccurate'}
                                        </span>
                                      ) : <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 font-medium whitespace-nowrap">{log.loggedAt ? new Date(log.loggedAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '--'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* GLUCOSE TAB */}
                    {userModalTab === 'glucose' && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Glucose Readings ({selectedUserActivity.glucoseReadings?.length ?? 0})</h4>
                        {!selectedUserActivity.glucoseReadings || selectedUserActivity.glucoseReadings.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 font-semibold text-xs border-2 border-dashed border-slate-100 rounded-2xl">No glucose readings found.</div>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-slate-100">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50">
                                <tr>
                                  {['Value', 'Status', 'Timestamp', 'Source'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left font-extrabold text-slate-500 uppercase text-[10px]">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {selectedUserActivity.glucoseReadings.slice(0, 100).map((r: any) => (
                                  <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 py-3">
                                      <span className={`font-black text-sm ${r.value > 140 ? 'text-red-500' : r.value > 100 ? 'text-amber-500' : 'text-green-600'}`}>
                                        {r.value} <span className="text-[10px] font-semibold text-slate-400">mg/dL</span>
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${r.value > 140 ? 'bg-red-50 text-red-600' : r.value > 100 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                                        {r.value > 140 ? 'High' : r.value > 100 ? 'Moderate' : 'Normal'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">
                                      {r.timestamp ? new Date(r.timestamp).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '--'}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 capitalize">{r.source || 'cgm'}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {selectedUserActivity.glucoseReadings.length > 100 && (
                              <p className="text-center text-[10px] text-slate-400 font-semibold py-3 border-t border-slate-100">
                                Showing latest 100 of {selectedUserActivity.glucoseReadings.length} readings.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* CGM REPORTS TAB */}
                    {userModalTab === 'reports' && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">CGM Reports ({selectedUserActivity.cgmReports?.length ?? 0})</h4>
                        {!selectedUserActivity.cgmReports || selectedUserActivity.cgmReports.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 font-semibold text-xs border-2 border-dashed border-slate-100 rounded-2xl">No CGM reports uploaded.</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedUserActivity.cgmReports.map((rep: any) => (
                              <div key={rep._id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-start">
                                <div>
                                  <p className="font-bold text-slate-800 text-xs mb-1 flex items-center space-x-1.5">
                                    <FileText className="h-3.5 w-3.5 text-primary" />
                                    <span>{rep.fileName || 'CGM Report'}</span>
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-semibold">
                                    {rep.parsedReadingsCount ?? rep.readingsCount ?? '--'} readings · {rep.createdAt ? new Date(rep.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '--'}
                                  </p>
                                  <span className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${rep.status === 'Processed' ? 'bg-green-50 text-green-600' : rep.status === 'Processing' ? 'bg-amber-50 text-amber-600' : rep.status === 'Failed' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                                    {rep.status || 'pending'}
                                  </span>
                                </div>
                                <button
                                  onClick={async () => {
                                    if (!window.confirm(`Delete "${rep.fileName}"? This cannot be undone.`)) return;
                                    try {
                                      const userId = selectedUserActivity.user._id;
                                      // Admin uses the user's report — call generic delete (admin can also use user's token-less route via admin proxy if added, for now show info)
                                      const r = await fetch(`${apiUrl}/admin/reports/${rep._id}`, {
                                        method: 'DELETE',
                                        headers: { 'Authorization': `Bearer ${token}` }
                                      });
                                      if (r.ok) {
                                        fetchUserActivity(userId);
                                      } else {
                                        alert('Could not delete report.');
                                      }
                                    } catch { alert('Error deleting report.'); }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-red-50 transition-all ml-2 shrink-0"
                                  title="Delete Report"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}


                    {/* AI COACHING TAB */}
                    {userModalTab === 'coaching' && (
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">AI Coaching Sessions ({coachingSessions.length})</h4>
                        {coachingSessions.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 font-semibold text-xs border-2 border-dashed border-slate-100 rounded-2xl">No AI coaching sessions triggered yet.</div>
                        ) : (
                          coachingSessions.map((session: any) => (
                            <div key={session._id} className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                              <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <Bot className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-extrabold text-slate-800">
                                      {session.foodName || session.foodLogId?.name || 'Unknown Food'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 mt-1.5">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600">
                                      Spike: {session.peakGlucose} mg/dL
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                      {session.createdAt ? new Date(session.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : ''}
                                    </span>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${session.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {session.status}
                                </span>
                              </div>
                              <div className="space-y-2.5">
                                {session.messages.map((msg: any, i: number) => (
                                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[11px] font-medium shadow-sm ${
                                      msg.role === 'user'
                                        ? 'bg-gradient-to-r from-primary to-indigo-600 text-white rounded-br-sm'
                                        : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'
                                    }`}>
                                      <span className="block text-[8px] font-black uppercase mb-0.5 opacity-60">{msg.role === 'user' ? '👤 Patient' : '🤖 AI Assistant'}</span>
                                      {msg.content}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* SEND ALERT TAB */}
                    {userModalTab === 'notify' && (
                      <form onSubmit={handleSendUserDirectNotification} className="space-y-4 max-w-lg">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-2xl">
                          <p className="text-xs text-primary font-semibold">
                            📣 This will dispatch a real-time FCM push notification directly to the patient's mobile device. Use this to advise them on glucose spikes or meal timing.
                          </p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5">Alert Title</label>
                          <input
                            type="text"
                            required
                            value={userModalNotify.title}
                            onChange={(e) => setUserModalNotify({ ...userModalNotify, title: e.target.value })}
                            placeholder="E.G. High Glucose Warning"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5">Message Content</label>
                          <textarea
                            required
                            rows={4}
                            value={userModalNotify.body}
                            onChange={(e) => setUserModalNotify({ ...userModalNotify, body: e.target.value })}
                            placeholder="Enter the alert advice..."
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-semibold text-xs resize-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-dark hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 transition-all text-xs"
                        >
                          <Send className="h-4 w-4" />
                          <span>Dispatch Alert to Patient</span>
                        </button>
                      </form>
                    )}

                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AdminAuthProvider>
      <AdminPanelContent />
    </AdminAuthProvider>
  );
}
