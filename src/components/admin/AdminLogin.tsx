import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { AUTHORIZED_ADMIN_USERNAME } from '../../types';

interface AdminLoginProps {
  onSuccess: () => void;
  onNavigateHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onNavigateHome }) => {
  const { loginAdmin, isLoading } = useStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!username.trim()) {
      setErrorMsg('Please enter your admin username.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await loginAdmin(username.trim(), password);
      if (result.success) {
        onSuccess();
      } else {
        setErrorMsg(result.error || 'Invalid username or password.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] flex flex-col justify-center items-center p-4 relative font-sans text-neutral-100">
      {/* Background Accent Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#13487E]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-[#0d0d12] border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-[#13487E] to-[#0d3a66] text-white font-black text-2xl items-center justify-center shadow-lg shadow-[#13487E]/30 mb-2 font-['Space_Grotesk']">
            J
          </div>
          <h1 className="text-2xl font-black text-white font-['Space_Grotesk'] tracking-tight">
            Jakariya's Mart ADMIN
          </h1>
          <p className="text-xs text-neutral-400">
            Sign in to access store administration and management
          </p>
        </div>

        {/* Security Indicator */}
        <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-[11px] text-neutral-400 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#13487E] flex-shrink-0 mt-0.5" />
          <div>
            Restricted System: Authorized access is exclusively reserved for the designated administrator.
          </div>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Feedback */}
        {infoMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
            <Check className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Form: Username Input, Password Input, "Sign In as Admin" button */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Admin Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#13487E] transition-colors"
              />
              <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#13487E] transition-colors"
              />
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* "Sign In as Admin" button */}
          <button
            type="submit"
            disabled={submitting || isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#13487E] hover:bg-[#0d3a66] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#13487E]/25 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In as Admin</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>

        {/* Return to Customer Storefront */}
        <div className="text-center pt-1 border-t border-neutral-800/60">
          <button
            type="button"
            onClick={onNavigateHome}
            className="text-xs text-neutral-500 hover:text-white transition-colors"
          >
            ← Return to Jakariya's Mart Customer Store
          </button>
        </div>
      </div>
    </div>
  );
};
