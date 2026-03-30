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
        } catch (err: unknown) {
          console.error('Failed to load history:', err);
          setError(err instanceof Error ? err.message : 'Failed to load your generation history.');
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
          className="relative w-full max-w-2xl bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors rounded-full hover:bg-white/10 z-10"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="p-8 sm:p-10 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white tracking-tight">Generation History</h2>
                <p className="text-white/60 text-sm font-medium">Your successful AI generations</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <p className="text-white/40 text-sm font-medium animate-pulse">Loading history...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20 space-y-4">
                <p className="text-red-400 font-medium">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-semibold transition-colors"
                >
                  Try again
                </button>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-20 space-y-6">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20 border border-white/10">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-white">No history yet</p>
                  <p className="text-white/40 text-sm font-medium">Your successful generations will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <p className="text-white font-semibold leading-snug group-hover:text-blue-400 transition-colors">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-4 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                          {item.type && (
                            <span className="px-2 py-0.5 bg-white/5 rounded-md border border-white/10">
                              {item.type}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-bold border border-white/20">
                          <CreditCard className="w-3 h-3" />
                          -{item.credits_used}
                        </div>
                        {item.file_url && (
                          <a 
                            href={item.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1.5 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-white/5 text-center">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
              Only successful generations are shown here
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UsageHistoryModal;
