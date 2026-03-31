import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'signin' | 'signup';
  onForgotPassword?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'signin', onForgotPassword }) => {
  const [view, setView] = useState<'signin' | 'signup'>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (view === 'signup') {
        const referralCode = localStorage.getItem('referral_code');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: fullName,
              referral_code: referralCode
            },
          },
        });
        if (error) throw error;
        
        localStorage.removeItem('referral_code');
        
        if (data.session) {
            onClose();
        } else {
            setSuccessMessage('Account created successfully! Please check your inbox to verify your email.');
            setTimeout(() => {
                onClose();
            }, 5000);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-[420px] bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors rounded-full hover:bg-white/10 z-10"
          >
            <X size={20} />
          </button>

          <div className="p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold text-white tracking-tight mb-2">
                {view === 'signin' ? 'Welcome' : 'Join Us'}
              </h2>
              <p className="text-white/60 text-sm font-medium">
                {view === 'signin' 
                  ? 'Sign in to your account' 
                  : 'Create your professional profile'}
              </p>
            </div>

            {/* View Toggle (iOS Style) */}
            <div className="flex p-1 mb-8 bg-white/5 rounded-2xl border border-white/10">
              <button
                onClick={() => setView('signin')}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  view === 'signin' 
                    ? 'bg-white text-black shadow-lg' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setView('signup')}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  view === 'signup' 
                    ? 'bg-white text-black shadow-lg' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-5">
              {view === 'signup' && (
                <div className="space-y-1.5">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm"
                      placeholder="Full Name"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm"
                    placeholder="Email Address"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm"
                    placeholder="Password"
                    required
                    minLength={6}
                  />
                </div>
                {view === 'signin' && onForgotPassword && (
                  <div className="flex justify-end px-1">
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      className="text-xs font-semibold text-white/40 hover:text-white transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              {/* Status Messages */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium"
                  >
                    <AlertCircle size={14} />
                    {error}
                  </motion.div>
                )}

                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-medium"
                  >
                    <CheckCircle2 size={14} />
                    {successMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-bold py-3.5 rounded-2xl hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 shadow-xl shadow-black/20"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {view === 'signin' ? 'Sign In' : 'Sign Up'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                <span className="bg-transparent px-4 text-white/30">Or continue with</span>
              </div>
            </div>

            {/* Google Auth */}
            <button
              onClick={handleGoogleAuth}
              className="w-full bg-white/5 border border-white/10 text-white font-semibold py-3.5 rounded-2xl hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
