import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, AlertCircle, Heart, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface LoginProps {
  onNavigateToRegister: () => void;
  resetToken?: string | null;
  onClearResetToken?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigateToRegister, resetToken, onClearResetToken }) => {
  const { login, error, clearError, isLoading, apiUrl } = useAuth();
  const { showToast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const success = await login(email, password);
    if (success) {
      showToast('Logged in successfully!', 'success');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSendingReset(true);
    try {
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (response.ok) {
        showToast('Password reset link sent to your email!', 'success');
        setResetMessage('A password reset link has been dispatched to your email.');
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to send reset link.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword || !resetToken) return;
    
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Password reset successfully!', 'success');
        setResetMessage('Password reset successfully! Please log in with your new password.');
        if (onClearResetToken) onClearResetToken();
      } else {
        showToast(data.message || 'Failed to reset password.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary-light text-primary rounded-2xl mb-3 shadow-soft">
            <Heart className="h-8 w-8 fill-primary" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mito_Reboot</h1>
          <p className="text-slate-500 mt-2 font-medium">The circadian fasting app</p>
        </div>

        {/* Auth Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-danger rounded-2xl flex items-start space-x-3 text-sm font-medium border border-red-100">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
              <button onClick={clearError} className="block mt-1 underline hover:text-red-700">Clear error</button>
            </div>
          </div>
        )}

        {/* Forgot password feedback */}
        {resetMessage && (
          <div className="mb-6 p-4 bg-green-50 text-success rounded-2xl text-sm font-medium border border-green-100">
            {resetMessage}
          </div>
        )}

        {/* Normal Login / Forgot Password / Reset Password Forms */}
        {resetToken ? (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Create New Password</h2>
            <p className="text-sm text-slate-500 mb-4">
              Please enter your new password below.
            </p>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-800 placeholder:text-slate-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-800 placeholder:text-slate-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  if (onClearResetToken) onClearResetToken();
                }}
                disabled={isResetting}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-2xl disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isResetting}
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-2xl shadow-soft disabled:opacity-50 flex items-center justify-center animate-pulse-slow"
              >
                {isResetting ? 'Saving Password...' : 'Save Password'}
              </button>
            </div>
          </form>
        ) : !showForgot ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email or Mobile Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email or mobile number"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-800 placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-800 placeholder:text-slate-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg shadow-primary-light transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-sm text-slate-500 font-medium mt-6">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="text-primary font-semibold hover:underline"
              >
                Register here
              </button>
            </p>
          </form>
        ) : (
          /* Forgot Password form view */
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Recover Password</h2>
            <p className="text-sm text-slate-500 mb-4">
              Enter your registered email and we'll dispatch a recovery link to your inbox.
            </p>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-800"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForgot(false);
                  setResetMessage(null);
                }}
                disabled={isSendingReset}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-2xl disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSendingReset}
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-2xl shadow-soft disabled:opacity-50 flex items-center justify-center"
              >
                {isSendingReset ? 'Sending...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

