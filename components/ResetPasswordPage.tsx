
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';

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
      <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">Password Updated</h1>
            <p className="text-zinc-400">
              Your password has been successfully updated. You can now use your new password to sign in.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all active:scale-95"
          >
            Go to Homepage
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold">Set New Password</h1>
          <p className="text-zinc-400">
            Please enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-4 rounded-2xl border border-red-400/20">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !session}
            className="w-full bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
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
