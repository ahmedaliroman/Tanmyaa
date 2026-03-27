
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Share2, Users, Gift } from 'lucide-react';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !profile) return null;

  const referralLink = `${window.location.origin}?ref=${profile.referral_code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Invite Friends</h2>
                <p className="text-sm text-zinc-400">Get Pro plan for free</p>
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
          <div className="p-8 space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-full text-sm font-bold border border-purple-500/20">
                <Users className="w-4 h-4" />
                Special Offer
              </div>
              <h3 className="text-2xl font-bold text-white leading-tight">
                Invite 20 friends and get a <span className="text-purple-500">Pro Plan</span> as a gift!
              </h3>
              <p className="text-zinc-400">
                Share your unique referral link with your colleagues and friends. Once 20 people sign up using your link, your account will be automatically upgraded.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Your Referral Link</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-black/40 border border-zinc-800 rounded-2xl px-4 py-3 text-zinc-300 font-mono text-sm truncate">
                  {referralLink}
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-bold hover:bg-zinc-200 transition-all active:scale-95 whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-800/50 rounded-2xl text-center space-y-1">
                <p className="text-2xl font-bold text-white">20</p>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Goal</p>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-2xl text-center space-y-1 border border-purple-500/20">
                <p className="text-2xl font-bold text-purple-500">Pro</p>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Reward</p>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-2xl text-center space-y-1">
                <p className="text-2xl font-bold text-white">600</p>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Credits</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-center gap-4">
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Join me on Urban Planning AI',
                    text: 'Check out this amazing AI tool for urban planners!',
                    url: referralLink,
                  });
                } else {
                  handleCopy();
                }
              }}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              Share with others
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReferralModal;
