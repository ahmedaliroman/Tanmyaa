
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Lock, Eye, EyeOff, Loader } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const { updatePassword, session } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no session, the link might be expired or invalid
    if (!session) {
      setError('Invalid or expired reset link. Please try again.');
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await updatePassword(password);
      setIsSuccess(true);
    } catch (err: unknown) {
      console.error('Update password error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-[420px] w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] space-y-8"
        >
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight">Password Updated</h1>
            <p className="text-white/60 text-sm font-medium leading-relaxed">
              Your password has been successfully updated. You can now use your new password to sign in.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-white/90 transition-all active:scale-[0.98] shadow-xl shadow-black/20"
          >
            Go to Homepage
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[420px] w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Set New Password</h1>
          <p className="text-white/60 text-sm font-medium">
            Please enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium"
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading || !session}
            className="w-full bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-black/20"
          >
            {isLoading ? (
              <Loader className="animate-spin" size={20} />
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
