import React, { useState } from 'react';
import { useAuthStore } from '../../state/useAuthStore';
import { 
  X, 
  ShieldCheck, 
  User as UserIcon, 
  Lock, 
  Mail, 
  Building2, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  KeyRound
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalTab, 
    openAuthModal, 
    login, 
    signup, 
    isLoading, 
    error, 
    clearError 
  } = useAuthStore();

  const [tab, setTab] = useState<'login' | 'signup'>(authModalTab);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupRole, setSignupRole] = useState<'citizen' | 'admin'>('citizen');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupOrg, setSignupOrg] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleTabSwitch = (newTab: 'login' | 'signup') => {
    setTab(newTab);
    clearError();
    setSuccessMessage(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;
    try {
      await login(loginEmail.trim(), loginPassword);
    } catch {
      // Handled in store
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail.trim() || !signupName.trim()) return;
    try {
      const res = await signup({
        email: signupEmail.trim(),
        name: signupName.trim(),
        password: signupPassword,
        role: signupRole,
        organization: signupOrg.trim(),
      });
      setSuccessMessage(res.message);
      if (signupRole === 'admin') {
        // Clear fields for admin
        setSignupName('');
        setSignupEmail('');
        setSignupPassword('');
        setSignupOrg('');
      }
    } catch {
      // Handled in store
    }
  };

  const handleQuickLogin = async (email: string) => {
    clearError();
    setSuccessMessage(null);
    setLoginEmail(email);
    setLoginPassword('DemoAdminPass123');
    try {
      await login(email, 'DemoAdminPass123');
    } catch {
      // Handled in store
    }
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 leading-tight">National 3D Cadastre</h2>
              <p className="text-xs text-slate-500">Geospatial Identity & Access Portal</p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 mx-6 mt-4 bg-slate-100 rounded-xl">
          <button
            onClick={() => handleTabSwitch('login')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => handleTabSwitch('signup')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'signup'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Status Alerts */}
        <div className="px-6 pt-3">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 pt-3 overflow-y-auto max-h-[70vh]">
          {tab === 'login' ? (
            <div className="space-y-4">
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email / Cadastral ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. officer.verma@cadastre.gov.in"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  {isLoading ? 'Signing In...' : 'Sign In to Cadastre'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Role Profiles */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold tracking-wide uppercase text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Quick Role Access</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('superadmin@cadastre.gov.in')}
                    className="p-2.5 text-left rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100/60 hover:border-purple-200 transition-all text-xs"
                  >
                    <div className="flex items-center gap-1.5 text-purple-700 font-bold mb-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Super Admin</span>
                    </div>
                    <div className="text-[10px] text-purple-600/80 truncate">Approve Admins & View Stats</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('officer.verma@cadastre.gov.in')}
                    className="p-2.5 text-left rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100/60 hover:border-blue-200 transition-all text-xs"
                  >
                    <div className="flex items-center gap-1.5 text-blue-700 font-bold mb-0.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Cadastral Admin</span>
                    </div>
                    <div className="text-[10px] text-blue-600/80 truncate">Add 3D Buildings & ULPIN</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('citizen.shukla@gmail.com')}
                    className="p-2.5 text-left rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/60 hover:border-emerald-200 transition-all text-xs"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-0.5">
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Citizen</span>
                    </div>
                    <div className="text-[10px] text-emerald-600/80 truncate">View & Verify Properties</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('sharma.admin@gmail.com')}
                    className="p-2.5 text-left rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-100/60 hover:border-amber-200 transition-all text-xs"
                    title="Test Pending Approval Guard"
                  >
                    <div className="flex items-center gap-1.5 text-amber-700 font-bold mb-0.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Pending Admin</span>
                    </div>
                    <div className="text-[10px] text-amber-600/80 truncate">Test Approval Gating</div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Privilege Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignupRole('citizen')}
                    className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                      signupRole === 'citizen'
                        ? 'border-blue-500 bg-blue-50 text-blue-800 font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Citizen</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">Instant Access</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignupRole('admin')}
                    className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                      signupRole === 'admin'
                        ? 'border-purple-500 bg-purple-50 text-purple-800 font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Cadastral Admin</span>
                    </div>
                    <div className="text-[10px] text-purple-600 font-normal">Requires Approval</div>
                  </button>
                </div>
              </div>

              {signupRole === 'admin' && (
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-[11px] text-purple-800 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Super Admin Verification Required: </span>
                    Admin accounts are locked until verified and approved by the Super Admin from the Super Admin Dashboard.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Officer Sunita Rao"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. sunita.admin@gmail.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization / Department
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. State Cadastre & Land Records Dept"
                    value={signupOrg}
                    onChange={(e) => setSignupOrg(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Choose a password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 px-4 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all ${
                  signupRole === 'admin'
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                }`}
              >
                {isLoading
                  ? 'Submitting...'
                  : signupRole === 'admin'
                  ? 'Request Admin Authorization'
                  : 'Complete Citizen Registration'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>3D National Cadastre Portal</span>
          <span>Bhu-Aadhaar ULPIN Enabled</span>
        </div>
      </div>
    </div>
  );
};
