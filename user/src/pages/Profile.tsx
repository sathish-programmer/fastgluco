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
  Activity,
  Heart
} from 'lucide-react';
import { Educational } from './Educational'; // import the sub-view
import { Subscription } from './Subscription';

export const Profile: React.FC<{ onNavigateToTab?: (tab: string) => void }> = () => {
  const { user, token, apiUrl, logout, requestProfileUpdate, isLoading, error, branding } = useAuth();
  const { showToast } = useToast();
  
  // Tabs for profile section: 'settings' or 'education' or 'subscription'
  const [subView, setSubView] = useState<'settings' | 'education' | 'subscription'>('settings');

  // Input states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobileNumber || '');
  const [age, setAge] = useState(user?.age || 30);
  const [height, setHeight] = useState(user?.height || 170);
  const [weight, setWeight] = useState(user?.weight || 70);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(user?.gender || 'Male');
  const [activityLevel, setActivityLevel] = useState(user?.activityLevel || 'Moderately active');
  const [goal, setGoal] = useState(user?.goal || 'Maintain weight');
  const [spikeThreshold, setSpikeThreshold] = useState(user?.spikeThreshold || 90);
  const [currency, setCurrency] = useState<'INR' | 'USD'>((user?.currency as 'INR' | 'USD') || 'INR');
  
  // Cancer Care Journey states
  const [cancerJourney, setCancerJourney] = useState<'PREVENTION' | 'TREATMENT' | 'SECONDARY_PREVENTION'>(user?.cancerJourney || 'PREVENTION');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(user?.cancerDisclaimerAccepted || false);

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
    if ((cancerJourney === 'TREATMENT' || cancerJourney === 'SECONDARY_PREVENTION') && !disclaimerAccepted) {
      showToast('You must accept the medical disclaimer to select this cancer care journey.', 'error');
      return;
    }
    setSaveSuccess(false);
    const success = await requestProfileUpdate({
      name,
      email,
      mobileNumber: mobile,
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
      libreActive,
      cancerJourney,
      cancerDisclaimerAccepted: cancerJourney === 'PREVENTION' ? true : disclaimerAccepted,
      cancerDisclaimerAcceptedAt: cancerJourney === 'PREVENTION' ? undefined : (disclaimerAccepted ? new Date().toISOString() : undefined)
    });
    if (success) {
      showToast('Profile edits submitted for review!', 'success');
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
    <div className="pb-24 pt-4 px-4 max-w-5xl mx-auto bg-slate-50/70 min-h-screen font-sans antialiased text-slate-800">
      {/* Profile Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex h-16 w-16 bg-primary/10 text-primary rounded-full items-center justify-center text-2xl font-bold shadow-sm mb-3">
          {user?.name ? user.name.charAt(0) : 'P'}
        </div>
        <h2 className="text-lg font-bold text-slate-850">{user?.name || 'Patient'}</h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">{user?.email} {user?.mobileNumber && `• ${user.mobileNumber}`}</p>
        {user?.cancerJourney && (
          <div className="mt-2">
            <span className="inline-block px-3 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
              {user.cancerJourney === 'PREVENTION' && 'Cancer Prevention'}
              {user.cancerJourney === 'TREATMENT' && 'Active Cancer Treatment'}
              {user.cancerJourney === 'SECONDARY_PREVENTION' && 'Cancer Secondary Prevention'}
            </span>
          </div>
        )}
      </div>

      {user?.pendingProfileEdits && (
        <div className="mb-6 p-4 bg-amber-50 rounded-3xl border border-amber-200 shadow-sm flex items-start space-x-3">
          <div className="mt-0.5">
            <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-800">Pending Review</h4>
            <p className="text-[10px] text-amber-700 font-semibold mt-0.5 leading-relaxed">
              Your recent profile updates are under review by our team. They will be applied once approved.
            </p>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-100 shadow-sm animate-in fade-in duration-200">
          Profile changes submitted for admin review successfully.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-2xl border border-red-100 shadow-sm animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {/* TDEE Recommendation Card */}
      <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-[0_12px_24px_rgba(0,0,0,0.02)] mb-6 flex items-start space-x-3">
        <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">My Calorie Recommendation</h4>
          <span className="text-base font-bold text-slate-800 block">
            {user?.dailyCalorieTarget || 2000} kcal / day
          </span>
          <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-relaxed">
            Mifflin-St Jeor target calculated from your height, weight, activity, and {user?.goal?.toLowerCase()} goal.
          </p>
        </div>
      </div>

      {/* Navigation Buttons for Subviews */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => setSubView('education')}
          className="w-full bg-white hover:bg-slate-50/50 p-4 rounded-3xl border border-slate-100 shadow-[0_12px_24px_rgba(0,0,0,0.02)] flex items-center justify-between transition-all"
        >
          <div className="flex items-center space-x-3">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-slate-700">Educational Guides & Videos</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>

        <button
          onClick={() => setSubView('subscription')}
          className="w-full bg-white hover:bg-slate-50/50 p-4 rounded-3xl border border-slate-100 shadow-[0_12px_24px_rgba(0,0,0,0.02)] flex items-center justify-between transition-all"
        >
          <div className="flex items-center space-x-3">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-slate-700">My Subscription & Billing</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* Physical Profiling Update Form */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_12px_24px_rgba(0,0,0,0.02)] mb-6">
        <form onSubmit={handleSave} className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center space-x-1.5 mb-2">
            <Sliders className="h-4 w-4 text-primary" />
            <span>Profile Configuration</span>
          </h3>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile Number</label>
            <input
              type="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e: any) => setGender(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-705 bg-white cursor-pointer transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Age</label>
              <input
                type="number"
                required
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-bold text-slate-700 bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Height (cm)</label>
              <input
                type="number"
                required
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-bold text-slate-700 bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Weight (kg)</label>
              <input
                type="number"
                required
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-bold text-slate-700 bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Activity Level</label>
            <select
              value={activityLevel}
              onChange={(e: any) => setActivityLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-700 bg-white cursor-pointer transition-all"
            >
              <option value="Sedentary">Sedentary (no exercise)</option>
              <option value="Lightly active">Lightly active (1-2 days/wk)</option>
              <option value="Moderately active">Moderately active (3-5 days/wk)</option>
              <option value="Very active">Very active (6-7 days/wk)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Diet Goal</label>
            <select
              value={goal}
              onChange={(e: any) => setGoal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-700 bg-white cursor-pointer transition-all"
            >
              <option value="Lose weight">Lose weight</option>
              <option value="Maintain weight">Maintain weight</option>
              <option value="Gain weight">Gain weight</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span>Cancer Care Journey</span>
            </label>
            <select
              value={cancerJourney}
              onChange={(e: any) => {
                const val = e.target.value;
                setCancerJourney(val);
                if (val === user?.cancerJourney && user?.cancerDisclaimerAccepted) {
                  setDisclaimerAccepted(true);
                } else {
                  setDisclaimerAccepted(false);
                  if (val === 'TREATMENT' || val === 'SECONDARY_PREVENTION') {
                    setShowDisclaimer(true);
                  }
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-700 bg-white cursor-pointer transition-all"
            >
              <option value="PREVENTION">CANCER PREVENTION [NO HISTORY OF CANCER]</option>
              <option value="TREATMENT">CANCER TREATMENT</option>
              <option value="SECONDARY_PREVENTION">CANCER SECONDARY PREVENTION [PREVIOUS HISTORY OF CANCER]</option>
            </select>
            {(cancerJourney === 'TREATMENT' || cancerJourney === 'SECONDARY_PREVENTION') && (
              <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold">
                <span className={disclaimerAccepted ? 'text-emerald-600' : 'text-rose-500'}>
                  {disclaimerAccepted ? '✓ Disclaimer Accepted' : '✗ Disclaimer Declined / Not Accepted'}
                </span>
                {!disclaimerAccepted && (
                  <button
                    type="button"
                    onClick={() => setShowDisclaimer(true)}
                    className="text-primary hover:underline"
                  >
                    Read Disclaimer
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Calculator className="h-3.5 w-3.5 text-primary" />
              <span>Spike Threshold (mg/dL)</span>
            </label>
            <input
              type="number"
              required
              value={spikeThreshold}
              onChange={(e) => setSpikeThreshold(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-bold text-slate-700 bg-white transition-all"
            />
            <p className="text-[9px] text-slate-400 font-semibold mt-1 leading-relaxed">
              Values above this peak will mark meals as "Moderate" or "Avoid". Default is 90 mg/dL.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Currency Preference</label>
            <select
              value={currency}
              onChange={(e: any) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-700 bg-white cursor-pointer transition-all"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 space-y-4">
            <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center space-x-1.5">
              <Activity className="h-4 w-4 text-primary" />
              <span>Abbott LibreLinkUp Sync</span>
            </h4>
            
            <label className="flex items-center space-x-2.5 text-xs font-bold text-slate-655 cursor-pointer">
              <input
                type="checkbox"
                checked={libreActive}
                onChange={(e) => setLibreActive(e.target.checked)}
                className="h-4 w-4 text-primary rounded border-slate-200/80 focus:ring-primary/20"
              />
              <span>Enable Automatic LibreLinkUp Syncing</span>
            </label>
            <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
              When enabled, our app will automatically fetch your real-time glucose measurements from Abbott cloud servers every 10 minutes.
            </p>

            {libreActive && (
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.01)]">
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="w-full bg-slate-50/50 hover:bg-slate-50 px-4 py-2.5 text-left text-[10px] font-bold text-slate-605 flex items-center justify-between transition-all"
                >
                  <span>💡 How to connect your CGM sensor</span>
                  <span className="text-slate-400">{showGuide ? 'Hide instructions ▲' : 'Show instructions ▼'}</span>
                </button>
                {showGuide && (
                  <div className="bg-white p-3.5 border-t border-slate-100 space-y-2 text-[10px] text-slate-655 font-semibold leading-relaxed">
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
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">LibreLinkUp Caregiver Email</label>
                  <input
                    type="email"
                    required={libreActive}
                    value={libreEmail}
                    onChange={(e) => setLibreEmail(e.target.value)}
                    placeholder="caregiver@email.com"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">LibreLinkUp Caregiver Password</label>
                  <input
                    type="password"
                    required={libreActive}
                    value={librePassword}
                    onChange={(e) => setLibrePassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    <span>Abbott Cloud Region</span>
                  </label>
                  <select
                    value={libreRegion}
                    onChange={(e) => setLibreRegion(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 bg-white cursor-pointer transition-all"
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
                      className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-2xl flex items-center justify-center space-x-2 transition-all border border-slate-200/80 shadow-sm"
                    >
                      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Syncing readings...' : 'Sync Now'}</span>
                    </button>
                    {user?.libreLastSyncAt && (
                      <p className="text-[9px] text-slate-400 font-bold text-center mt-1.5">
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
            disabled={isLoading || ((cancerJourney === 'TREATMENT' || cancerJourney === 'SECONDARY_PREVENTION') && !disclaimerAccepted)}
            className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3 rounded-2xl shadow-soft flex items-center justify-center space-x-2 transition-all hover:shadow-md disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>Submit for Review</span>
          </button>
        </form>
      </div>

      {/* Logout button */}
      <button
        onClick={logout}
        className="w-full border border-rose-250 hover:bg-rose-50/50 text-rose-600 font-bold py-3 px-4 rounded-3xl flex items-center justify-center space-x-2 transition-all mb-4"
      >
        <LogOut className="h-4 w-4" />
        <span>Sign Out Account</span>
      </button>

      {/* Delete Account button */}
      <button
        onClick={() => window.location.href = '/delete-account'}
        className="w-full text-slate-400 hover:text-rose-500 font-bold py-3 px-4 rounded-3xl flex items-center justify-center space-x-2 transition-all mb-6 text-xs hover:bg-slate-50"
      >
        <span>Request Account Deletion</span>
      </button>

      {/* Disclaimer Modal Overlay */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-xl animate-scaleIn">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
              <span>Medical Disclaimer</span>
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed mb-6">
              {cancerJourney === 'TREATMENT' 
                ? (branding.cancerTreatmentDisclaimer || 'Disclaimer: This app is for informational purposes only. If you are undergoing active cancer treatment, please consult with your oncologist before starting any circadian fasting protocols.')
                : (branding.cancerSecondaryDisclaimer || 'Disclaimer: This app is for informational purposes only. If you have a previous history of cancer (secondary prevention), please consult with your medical team before starting any circadian fasting protocols.')
              }
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDisclaimerAccepted(false);
                  setShowDisclaimer(false);
                  setCancerJourney(user?.cancerJourney || 'PREVENTION');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => {
                  setDisclaimerAccepted(true);
                  setShowDisclaimer(false);
                }}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-soft"
              >
                I Understand & Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
