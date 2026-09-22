import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Store,
  User,
  Mail,
  Phone,
  Lock,
  Sparkles,
  AlertCircle,
  CheckCircle,
  LogIn,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  defaultRole?: 'customer' | 'vendor';
}

export default function AuthModal({
  isOpen,
  onClose,
  defaultMode = 'register',
  defaultRole = 'customer',
}: AuthModalProps) {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerCustomerWithEmail,
    registerVendorWithEmail,
    error: authError,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [role, setRole] = useState<'customer' | 'vendor'>(defaultRole);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleModeChange = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setLocalError(null);
    clearError();
  };

  const handleRoleChange = (newRole: 'customer' | 'vendor') => {
    setRole(newRole);
    setLocalError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          setLocalError('অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড প্রদান করুন।');
          setIsSubmitting(false);
          return;
        }
        await loginWithEmail(email, password);
        setSuccessMsg('সফলভাবে লগইন সম্পন্ন হয়েছে!');
        setTimeout(() => {
          onClose();
          setSuccessMsg(null);
        }, 800);
      } else {
        // Register mode
        if (role === 'customer') {
          if (!fullName.trim() || !phone.trim() || !email.trim() || !password) {
            setLocalError('অনুগ্রহ করে সকল ফিল্ড পূরণ করুন (নাম, ফোন, জিমেইল ও পাসওয়ার্ড)।');
            setIsSubmitting(false);
            return;
          }
          await registerCustomerWithEmail(fullName, email, phone, password);
          setSuccessMsg('অভিনন্দন! আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।');
          setTimeout(() => {
            onClose();
            setSuccessMsg(null);
          }, 900);
        } else {
          // Vendor Register
          if (!storeName.trim() || !phone.trim() || !email.trim() || !password) {
            setLocalError('অনুগ্রহ করে সকল ফিল্ড পূরণ করুন (দোকানের নাম, ফোন, জিমেইল ও পাসওয়ার্ড)।');
            setIsSubmitting(false);
            return;
          }
          await registerVendorWithEmail(email, password, storeName, phone);
          setSuccessMsg('অভিনন্দন! আপনার ভেন্ডর স্টোর সফলভাবে তৈরি হয়েছে।');
          setTimeout(() => {
            onClose();
            setSuccessMsg(null);
          }, 900);
        }
      }
    } catch (err: any) {
      console.error('Auth submission error:', err);
      // Clean, friendly error message
      let msg = err.message || 'অ্যাকাউন্ট প্রক্রিয়াকরণ করা সম্ভব হয়নি।';
      if (err.message?.includes('popup-closed')) {
        msg = 'গুগল সাইন-ইন উইন্ডো বন্ধ করা হয়েছিল। আপনি নিচে ইমেইল ও পাসওয়ার্ড দিয়ে সরাসরি তৈরি করতে পারেন।';
      }
      setLocalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    setLocalError(null);
    clearError();
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.log('Google login error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="auth-modal-container"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden"
      >
        {/* Header Ribbon */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              {role === 'vendor' ? 'দোকানী ভেন্ডর পোর্টাল' : 'দোকানী কাস্টমার অ্যাকাউন্ট'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {mode === 'register'
              ? role === 'vendor'
                ? 'নতুন ভেন্ডর স্টোর নিবন্ধন'
                : 'নতুন অ্যাকাউন্ট তৈরি করুন'
              : 'অ্যাকাউন্টে সাইন-ইন করুন'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {mode === 'register'
              ? 'নিরাপদ এবং দ্রুত কেনাকাটার জন্য আপনার তথ্য দিন'
              : 'আপনার ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন'}
          </p>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => handleModeChange('register')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            অ্যাকাউন্ট তৈরি (Sign Up)
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            লগইন (Sign In)
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Role selector in Register Mode */}
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleRoleChange('customer')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  role === 'customer'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>ক্রেতা (Customer)</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('vendor')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  role === 'vendor'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span>বিক্রেতা (Vendor)</span>
              </button>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {(localError || authError) && !successMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{localError || authError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Registration specific fields */}
            {mode === 'register' && (
              <>
                {role === 'customer' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      পূর্ণ নাম (Full Name) *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-input-fullname"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="যেমন: তানভীর আহমেদ"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      দোকান বা ব্র্যান্ডের নাম (Store Name) *
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-input-storename"
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="যেমন: Silk & Loom BD"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল / হোয়াটসঅ্যাপ নাম্বার (BD Mobile Number) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-input-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  জিমেইল অ্যাড্রেস (Gmail Address) *
                </label>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  @gmail.com
                </span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                পাসওয়ার্ড (Password) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-input-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষর (••••••••)"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="auth-submit-primary-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'register' ? (
                <span>
                  {role === 'vendor'
                    ? 'ভেন্ডর স্টোর তৈরি করুন'
                    : 'অ্যাকাউন্ট তৈরি করুন (Create Account)'}
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>সাইন-ইন করুন (Sign In)</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-medium">অথবা</span>
            </div>
          </div>

          {/* Continue with Google */}
          <button
            id="auth-continue-google-btn"
            type="button"
            onClick={handleGoogleClick}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2.5 shadow-xs transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>গুগল অ্যাকাউন্ট দিয়ে চালিয়ে যান (Google)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
