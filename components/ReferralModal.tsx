
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
          className="relative w-full max-w-lg bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
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
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                <Gift className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white tracking-tight">Invite Friends</h2>
                <p className="text-white/60 text-sm font-medium">Get Pro plan for free</p>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 text-purple-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-purple-500/20">
                  <Users className="w-3 h-3" />
                  Special Offer
                </div>
                <h3 className="text-2xl font-bold text-white leading-tight">
                  Invite 20 friends and get a <span className="text-purple-400">Pro Plan</span> as a gift!
                </h3>
                <p className="text-white/60 text-sm font-medium leading-relaxed">
                  Share your unique referral link with your colleagues and friends. Once 20 people sign up using your link, your account will be automatically upgraded.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Your Referral Link</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white/80 font-mono text-xs truncate">
                    {referralLink}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 bg-white text-black px-6 py-3.5 rounded-2xl font-bold hover:bg-white/90 transition-all active:scale-[0.98] whitespace-nowrap shadow-xl shadow-black/20"
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
                <div className="p-5 bg-white/5 border border-white/10 rounded-3xl text-center space-y-1">
                  <p className="text-2xl font-bold text-white">20</p>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Goal</p>
                </div>
                <div className="p-5 bg-purple-500/10 border border-purple-500/20 rounded-3xl text-center space-y-1">
                  <p className="text-2xl font-bold text-purple-400">Pro</p>
                  <p className="text-[10px] text-purple-400/40 uppercase font-bold tracking-widest">Reward</p>
                </div>
                <div className="p-5 bg-white/5 border border-white/10 rounded-3xl text-center space-y-1">
                  <p className="text-2xl font-bold text-white">600</p>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Credits</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-10 pt-8 border-t border-white/10 flex items-center justify-center">
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
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-semibold"
              >
                <Share2 className="w-4 h-4" />
                Share with others
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReferralModal;
