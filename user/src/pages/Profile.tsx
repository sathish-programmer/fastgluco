import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  ChevronRight, 
  LogOut, 
  Sliders, 
  Calculator, 
  BookOpen, 
  Sparkles, 
  Save,
  CreditCard,
  RefreshCw,
  Globe,
  Activity
} from 'lucide-react';
import { Educational } from './Educational'; // import the sub-view
import { Subscription } from './Subscription';

export const Profile: React.FC<{ onNavigateToTab?: (tab: string) => void }> = () => {
  const { user, token, apiUrl, logout, updateProfile, isLoading, error } = useAuth();
  const { showToast } = useToast();
  
  // Tabs for profile section: 'settings' or 'education' or 'subscription'
  const [subView, setSubView] = useState<'settings' | 'education' | 'subscription'>('settings');

  // Input states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [age, setAge] = useState(user?.age || 30);
  const [height, setHeight] = useState(user?.height || 170);
  const [weight, setWeight] = useState(user?.weight || 70);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(user?.gender || 'Male');
  const [activityLevel, setActivityLevel] = useState(user?.activityLevel || 'Moderately active');
  const [goal, setGoal] = useState(user?.goal || 'Maintain weight');
  const [spikeThreshold, setSpikeThreshold] = useState(user?.spikeThreshold || 90);
  const [currency, setCurrency] = useState<'INR' | 'USD'>((user?.currency as 'INR' | 'USD') || 'INR');
  
  // LibreLinkUp states
  const [libreEmail, setLibreEmail] = useState(user?.libreEmail || '');
  const [librePassword, setLibrePassword] = useState(user?.librePassword || '');
  const [libreRegion, setLibreRegion] = useState(user?.libreRegion || 'ap');
  const [libreActive, setLibreActive] = useState(user?.libreActive || false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    const success = await updateProfile({
      name,
      email,
      mobile,
      age,
      height,
      weight,
      gender,
      activityLevel,
      goal,
      spikeThreshold,
      currency,
      libreEmail,
      librePassword,
      libreRegion,
      libreActive
    });
    if (success) {
      showToast('Profile updated successfully!', 'success');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      showToast('Failed to update profile.', 'error');
    }
  };

  const handleTriggerSync = async () => {
    if (!token) return;
    setIsSyncing(true);
    try {
      const response = await fetch(`${apiUrl}/users/profile/sync-libre`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message || 'Sync completed successfully.', 'success');
      } else {
        showToast(data.message || 'Sync failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error during sync.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  if (subView === 'education') {
    return (
      <div>
        <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <button 
            onClick={() => setSubView('settings')}
            className="text-sm font-semibold text-primary"
          >
            ← Back to Profile
          </button>
          <span className="font-bold text-slate-800 text-sm">Education Center</span>
          <div className="w-12"></div>
        </div>
        <Educational />
      </div>
    );
  }

  if (subView === 'subscription') {
    return (
      <Subscription onBack={() => setSubView('settings')} />
    );
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto bg-white min-h-screen">
      {/* Profile Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex h-20 w-20 bg-primary-light text-primary rounded-full items-center justify-center text-3xl font-extrabold shadow-soft mb-3">
          {user?.name ? user.name.charAt(0) : 'P'}
        </div>
        <h2 className="text-xl font-bold text-slate-800">{user?.name || 'Patient'}</h2>
        <p className="text-xs text-slate-400 font-semibold">{user?.email} {user?.mobile && `• ${user.mobile}`}</p>
      </div>

      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-50 text-success text-xs font-semibold rounded-2xl border border-green-100">
          Profile updated & caloric targets recalculated successfully.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-danger text-xs font-semibold rounded-2xl border border-red-100">
          {error}
        </div>
      )}

      {/* TDEE Recommendation Card */}
      <div className="bg-primary/5 border border-primary/10 p-4 rounded-3xl shadow-soft mb-6 flex items-start space-x-3">
        <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-primary-dark uppercase tracking-wider mb-0.5">My Calorie Recommendation</h4>
          <span className="text-base font-extrabold text-slate-800 block">
            {user?.dailyCalorieTarget || 2000} kcal / day
          </span>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">
            Mifflin-St Jeor target calculated from your height, weight, activity, and {user?.goal?.toLowerCase()} goal.
          </p>
        </div>
      </div>

      {/* Navigation Buttons for Subviews */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => setSubView('education')}
          className="w-full bg-cardBg hover:bg-slate-100 p-4 rounded-2xl border border-slate-100 shadow-soft flex items-center justify-between transition-card"
        >
          <div className="flex items-center space-x-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-slate-700">Educational Guides & Videos</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>

        <button
          onClick={() => setSubView('subscription')}
          className="w-full bg-cardBg hover:bg-slate-100 p-4 rounded-2xl border border-slate-100 shadow-soft flex items-center justify-between transition-card"
        >
          <div className="flex items-center space-x-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-slate-700">My Subscription & Billing</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* Physical Profiling Update Form */}
      <div className="bg-cardBg p-5 rounded-3xl border border-slate-100 shadow-soft mb-6">
        <form onSubmit={handleSave} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5 mb-2">
            <Sliders className="h-4 w-4" />
            <span>Profile Configuration</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold text-slate-700 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold text-slate-700 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile Number</label>
            <input
              type="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold text-slate-700 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e: any) => setGender(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Age</label>
              <input
                type="number"
                required
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-slate-700 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Height (cm)</label>
              <input
                type="number"
                required
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-slate-700 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Weight (kg)</label>
              <input
                type="number"
                required
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-slate-700 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Activity Level</label>
            <select
              value={activityLevel}
              onChange={(e: any) => setActivityLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="Sedentary">Sedentary (no exercise)</option>
              <option value="Lightly active">Lightly active (1-2 days/wk)</option>
              <option value="Moderately active">Moderately active (3-5 days/wk)</option>
              <option value="Very active">Very active (6-7 days/wk)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Diet Goal</label>
            <select
              value={goal}
              onChange={(e: any) => setGoal(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="Lose weight">Lose weight</option>
              <option value="Maintain weight">Maintain weight</option>
              <option value="Gain weight">Gain weight</option>
            </select>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Calculator className="h-3.5 w-3.5" />
              <span>Spike Threshold (mg/dL)</span>
            </label>
            <input
              type="number"
              required
              value={spikeThreshold}
              onChange={(e) => setSpikeThreshold(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-slate-700 bg-white"
            />
            <p className="text-[10px] text-slate-400 font-semibold mt-1">
              Values above this peak will mark meals as "Moderate" or "Avoid". Default is 90 mg/dL.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Currency Preference</label>
            <select
              value={currency}
              onChange={(e: any) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold text-slate-700 bg-white"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
              <Activity className="h-4 w-4 text-primary" />
              <span>Abbott LibreLinkUp Sync</span>
            </h4>
            
            <label className="flex items-center space-x-2.5 text-xs font-bold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={libreActive}
                onChange={(e) => setLibreActive(e.target.checked)}
                className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary"
              />
              <span>Enable Automatic LibreLinkUp Syncing</span>
            </label>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              When enabled, our app will automatically fetch your real-time glucose measurements from Abbott cloud servers every 10 minutes.
            </p>

            {libreActive && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="w-full bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-left text-xs font-bold text-slate-700 flex items-center justify-between transition-all"
                >
                  <span>💡 How to connect your CGM sensor</span>
                  <span className="text-slate-400">{showGuide ? 'Hide instructions ▲' : 'Show instructions ▼'}</span>
                </button>
                {showGuide && (
                  <div className="bg-white p-3.5 border-t border-slate-100 space-y-2 text-[10px] text-slate-600 font-semibold leading-relaxed">
                    <ol className="list-decimal pl-4 space-y-1.5">
                      <li>Open the official <strong>FreeStyle Libre</strong> mobile app on your phone.</li>
                      <li>Open the side menu and go to <strong>Connected Apps</strong> → <strong>LibreLinkUp</strong>.</li>
                      <li>Tap <strong>Add Connection</strong> and invite a secondary email address that you own (must be different from your main LibreView email).</li>
                      <li>Check your secondary email inbox, download the <strong>LibreLinkUp mobile app</strong>, sign up with that email, and accept the caregiver invitation.</li>
                      <li>Enter that secondary email, caregiver password, and select your region in the fields below.</li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            {libreActive && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">LibreLinkUp Caregiver Email</label>
                  <input
                    type="email"
                    required={libreActive}
                    value={libreEmail}
                    onChange={(e) => setLibreEmail(e.target.value)}
                    placeholder="caregiver@email.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold text-slate-700 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">LibreLinkUp Caregiver Password</label>
                  <input
                    type="password"
                    required={libreActive}
                    value={librePassword}
                    onChange={(e) => setLibrePassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold text-slate-700 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <Globe className="h-3.5 w-3.5" />
                    <span>Abbott Cloud Region</span>
                  </label>
                  <select
                    value={libreRegion}
                    onChange={(e) => setLibreRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold text-slate-700 bg-white"
                  >
                    <option value="ap">Asia Pacific / India (AP)</option>
                    <option value="us">United States (US)</option>
                    <option value="eu">Europe (EU)</option>
                    <option value="de">Germany (DE)</option>
                    <option value="fr">France (FR)</option>
                    <option value="jp">Japan (JP)</option>
                    <option value="au">Australia (AU)</option>
                  </select>
                </div>

                {user?.libreActive && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleTriggerSync}
                      disabled={isSyncing}
                      className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all border border-slate-200"
                    >
                      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Syncing readings...' : 'Sync Now'}</span>
                    </button>
                    {user?.libreLastSyncAt && (
                      <p className="text-[9px] text-slate-400 font-bold text-center mt-1">
                        Last synced: {new Date(user.libreLastSyncAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-2xl shadow-soft flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            <span>Save Configuration</span>
          </button>
        </form>
      </div>

      {/* Logout button */}
      <button
        onClick={logout}
        className="w-full border border-red-200 hover:bg-red-50 text-danger font-bold py-3.5 px-4 rounded-3xl flex items-center justify-center space-x-2 transition-all"
      >
        <LogOut className="h-5 w-5" />
        <span>Sign Out Account</span>
      </button>
    </div>
  );
};
