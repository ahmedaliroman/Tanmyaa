
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Key, CheckCircle2, AlertCircle } from 'lucide-react';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ isOpen, onClose }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await resetPassword(email);
      setIsSuccess(true);
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Key className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white">Reset Password</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            {isSuccess ? (
              <div className="text-center space-y-6 py-4">
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Check your email</h3>
                  <p className="text-zinc-400">
                    We&apos;ve sent a password reset link to <span className="text-white font-medium">{email}</span>.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full bg-white text-black px-6 py-3 rounded-2xl font-bold hover:bg-zinc-200 transition-all active:scale-95"
                >
                  Got it
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <p className="text-zinc-400 text-sm">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-black/40 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
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
                    disabled={isLoading}
                    className="w-full bg-white text-black px-6 py-3 rounded-2xl font-bold hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PasswordResetModal;
