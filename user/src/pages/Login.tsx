import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, AlertCircle, Heart } from 'lucide-react';

interface LoginProps {
  onNavigateToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigateToRegister }) => {
  const { login, error, clearError, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    await login(email, password);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      const { apiUrl } = useAuth();
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (response.ok) {
        setResetMessage('A mock reset token has been dispatched in server console logs.');
      }
    } catch (err) {
      console.error(err);
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">FastGluco</h1>
          <p className="text-slate-500 mt-2 font-medium">Diabetes & Glucose Tracking Platform</p>
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

        {/* Normal Login Forms */}
        {!showForgot ? (
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-800 placeholder:text-slate-400 font-medium"
                />
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
              Enter your registered email and we'll dispatch a mock recovery token key to the server log.
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
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-2xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-2xl shadow-soft"
              >
                Reset Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
