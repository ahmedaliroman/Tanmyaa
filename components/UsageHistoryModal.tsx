import React, { useEffect, useState } from 'react';
import { fetchUsageHistory } from '../services/geminiService';
import { UsageHistory } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, CreditCard, CheckCircle2 } from 'lucide-react';

interface UsageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UsageHistoryModal: React.FC<UsageHistoryModalProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<UsageHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loadHistory = async () => {
        setIsLoading(true);
        try {
          const data = await fetchUsageHistory();
          setHistory(data);
        } catch (err) {
          console.error('Failed to load history:', err);
          setError('Failed to load your generation history.');
        } finally {
          setIsLoading(false);
        }
      };
      loadHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
          className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Generation History</h2>
                <p className="text-sm text-zinc-400">Your successful AI generations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-400 animate-pulse">Loading history...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-400">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 text-emerald-500 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-white font-medium">No history yet</p>
                  <p className="text-zinc-500 text-sm">Your successful generations will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl hover:bg-zinc-800 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-zinc-100 font-medium leading-tight group-hover:text-emerald-400 transition-colors">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold border border-emerald-500/20">
                          <CreditCard className="w-3 h-3" />
                          -{item.credits_used}
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold">Success</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 text-center">
            <p className="text-xs text-zinc-500">
              Only successful generations that deducted credits are shown here.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UsageHistoryModal;
