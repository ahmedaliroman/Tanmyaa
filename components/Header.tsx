
import React, { useState, useEffect, useRef } from 'react';
import { TanmyaaLogo } from './TanmyaaLogo';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from './AuthModal';
import { LogOut, CreditCard, Clock, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import UsageHistoryModal from './UsageHistoryModal';
import ReferralModal from './ReferralModal';
import PasswordResetModal from './PasswordResetModal';

interface HeaderProps {
    onNavigate: (page: 'home' | 'subscription') => void;
    showHomeButton: boolean;
    hasApiKey?: boolean;
    onSelectKey?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, showHomeButton }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');
  const { user, profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [showFounder, setShowFounder] = useState(false);
  const [showWhoWeAre, setShowWhoWeAre] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openAuth = (view: 'signin' | 'signup') => {
    setAuthView(view);
    setIsAuthModalOpen(true);
  };

  const headerClasses = `sticky top-0 z-50 transition-all duration-500 ease-in-out ${
      isScrolled 
      ? 'bg-[#050505]/60 backdrop-blur-3xl border-b border-white/5 shadow-2xl' 
      : 'bg-transparent border-b border-transparent'
  }`;
  
  const containerClasses = `container mx-auto px-4 md:px-8 flex justify-between items-center transition-all duration-300 ease-in-out ${
      isScrolled 
      ? 'py-3' 
      : 'py-5'
  }`;

  return (
    <>
      <header className={headerClasses}>
        <div className={containerClasses}>
          <div className="flex items-center space-x-6">
            {showHomeButton ? (
              <button
                onClick={() => onNavigate('home')}
                aria-label="Go to homepage"
                className="w-10 h-10 flex items-center justify-center bg-gray-700/40 hover:bg-gray-600/60 text-gray-300 hover:text-white rounded-full transition-all duration-300 border border-gray-600/80 backdrop-blur-sm"
              >
                <svg xmlns="http://www.w.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.5 1.5 0 012.182 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
                </svg>
              </button>
            ) : <TanmyaaLogo />}
          </div>
          <div className="flex items-center space-x-4">
            {!showHomeButton && (
              <div className="hidden lg:flex items-center space-x-2 mr-4">
                {/* Who We Are Interactive Box (Organization) */}
                <div 
                  className="relative"
                  onMouseEnter={() => setShowWhoWeAre(true)}
                  onMouseLeave={() => setShowWhoWeAre(false)}
                >
                  <button className="text-sm font-medium text-gray-300 hover:text-white transition-all flex items-center gap-2 py-2 px-2 rounded-full">
                    Who we are?
                  </button>
                  <AnimatePresence>
                    {showWhoWeAre && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-[360px] bg-[#0A0A0B] border border-white/10 rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden z-[100]"
                      >
                        <div className="p-10 flex flex-col items-center">
                          <div className="w-20 h-20 mb-8 flex-shrink-0">
                            <img 
                              src="https://dwuxqhdczbrlxhqxipgm.supabase.co/storage/v1/object/public/Tanmyaa%20Logo/Website%20Icon.png" 
                              alt="Tanmyaa Logo" 
                              className="w-full h-full object-contain"
                              loading="eager"
                            />
                          </div>
                          
                          <div className="text-center space-y-1 mb-6">
                            <h3 className="text-2xl font-bold text-white tracking-tight">Tanmyaa</h3>
                            <p className="text-[11px] font-semibold text-white/40 tracking-normal">Founded December 2025</p>
                          </div>
                          
                          <p className="text-[13px] text-white/70 leading-relaxed text-center font-normal">
                            Tanmyaa is an organization founded in December 2025, dedicated to helping cities and communities grow in smarter, fairer, and more sustainable ways. Guided by its ethos of advancing cities together, it works across urban development, planning, and policy, rooted in a simple belief: growth should better serve people and place.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Founder Interactive Box */}
                <div 
                  className="relative"
                  onMouseEnter={() => setShowFounder(true)}
                  onMouseLeave={() => setShowFounder(false)}
                >
                  <button className="text-sm font-medium text-gray-300 hover:text-white transition-all flex items-center gap-2 py-2 px-2 rounded-full">
                    Founder
                  </button>
                  <AnimatePresence>
                    {showFounder && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-[360px] bg-[#0A0A0B] border border-white/10 rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden z-[100]"
                      >
                        <div className="p-10 flex flex-col items-center">
                          <div className="w-28 h-28 rounded-full mb-6 overflow-hidden shadow-2xl relative flex-shrink-0 bg-white">
                            <img 
                              src="https://dwuxqhdczbrlxhqxipgm.supabase.co/storage/v1/object/public/Tanmyaa%20Logo/Roman%20A..jpg" 
                              alt="Ahmed Roman" 
                              className="w-full h-full object-cover"
                              loading="eager"
                              onError={(e) => {
                                // Fallback if image fails to load
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                          
                          <div className="text-center space-y-1 mb-6">
                            <h3 className="text-2xl font-bold text-white tracking-tight">Ahmed Roman</h3>
                            <p className="text-[11px] font-semibold text-white/40 tracking-normal">Urban Strategic Advisor</p>
                          </div>
                          
                          <p className="text-[13px] text-white/60 leading-relaxed text-center font-normal mb-8">
                            Ahmed Roman is an urban planner and designer specializing in inclusive and resilient cities. With over six years of experience across the Middle East, Europe, and North Africa, he works at the intersection of spatial planning, urban policy, and community-focused design.
                          </p>

                          <div className="w-full flex flex-col gap-2.5">
                             {[
                               'Strategic Urban Planning',
                               'Policy Advisor',
                               'Placemaking'
                             ].map((label) => (
                               <div key={label} className="px-5 py-3 bg-white/[0.03] border border-white/5 rounded-xl text-[12px] font-medium text-white/80 flex items-center justify-center">
                                 {label}
                               </div>
                             ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Contact Us Interactive Box */}
                <div 
                  className="relative"
                  onMouseEnter={() => setShowContact(true)}
                  onMouseLeave={() => setShowContact(false)}
                >
                  <button className="text-sm font-medium text-gray-300 hover:text-white transition-all flex items-center gap-2 py-2 px-2 rounded-full">
                    Contact Us
                  </button>
                  <AnimatePresence>
                    {showContact && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-80 bg-[#0A0A0B] border border-white/10 rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.9)] p-8 z-[100]"
                      >
                         <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-white/50 px-2 tracking-normal">General Inquiries</h4>
                            
                            <a href="mailto:ahmedroman@tanmyaa.com" className="flex flex-col gap-1 p-4 bg-white/[0.03] rounded-2xl hover:bg-white/[0.06] transition-all border border-white/5">
                               <span className="text-[10px] font-bold text-white/30 tracking-normal">Email</span>
                               <span className="text-[13px] font-medium text-white">ahmedroman@tanmyaa.com</span>
                            </a>
                            
                            <a href="https://wa.me/201018960176" target="_blank" rel="noopener noreferrer" className="flex flex-col gap-1 p-4 bg-white/[0.03] rounded-2xl hover:bg-white/[0.06] transition-all border border-white/5">
                               <span className="text-[10px] font-bold text-white/30 tracking-normal">WhatsApp</span>
                               <span className="text-[13px] font-medium text-white">+201018960176</span>
                            </a>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
            {user ? (
              <div 
                className="relative" 
                ref={menuRef}
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  onMouseEnter={() => setShowUserMenu(true)}
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-1 pr-4 py-1 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-medium text-white leading-none mb-0.5">
                      {profile?.full_name || user.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1">
                      <CreditCard size={10} />
                      {profile?.credits ?? 0} Credits
                    </span>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-0 w-56 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden animate-fade-in z-50">
                    <div className="p-5 border-b border-white/10 bg-white/5">
                      <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mt-1">{profile?.plan || 'Free'} Plan</p>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          setIsReferralModalOpen(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-purple-400 hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors"
                      >
                        <Gift size={16} />
                        <span className="font-medium">Invite Friends</span>
                      </button>
                      <button 
                        onClick={() => {
                          setIsHistoryModalOpen(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors"
                      >
                        <Clock size={16} />
                        <span className="font-medium">Generation History</span>
                      </button>
                      <button 
                        onClick={() => {
                          onNavigate('subscription');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors"
                      >
                        <CreditCard size={16} />
                        <span className="font-medium">Buy Credits</span>
                      </button>
                      <div className="h-px bg-white/10 my-2 mx-2" />
                      <button 
                        onClick={() => {
                          signOut();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-3 transition-colors"
                      >
                        <LogOut size={16} />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => openAuth('signin')}
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Log In
                </button>
                <button 
                  onClick={() => openAuth('signup')}
                  className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialView={authView} 
        onForgotPassword={() => {
          setIsAuthModalOpen(false);
          setIsResetModalOpen(true);
        }}
      />

      <UsageHistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
      />

      <ReferralModal 
        isOpen={isReferralModalOpen} 
        onClose={() => setIsReferralModalOpen(false)} 
      />

      <PasswordResetModal 
        isOpen={isResetModalOpen} 
        onClose={() => setIsResetModalOpen(false)} 
      />
    </>
  );
};

export default Header;
