
import React, { useState, useEffect, useRef } from 'react';
import { TanmyaaLogo } from './TanmyaaLogo';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from './AuthModal';
import { LogOut, CreditCard, Clock, Gift, Mail, MessageSquare, Info } from 'lucide-react';
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
      showHomeButton && isScrolled 
      ? 'bg-black/30 backdrop-blur-xl border-b border-white/10 shadow-lg' 
      : 'bg-transparent border-b border-transparent'
  }`;
  
  const containerClasses = `container mx-auto px-4 md:px-8 flex justify-between items-center transition-all duration-300 ease-in-out ${
      showHomeButton && isScrolled 
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
                {/* Who We Are Interactive Box */}
                <div 
                  className="relative"
                  onMouseEnter={() => setShowWhoWeAre(true)}
                  onMouseLeave={() => setShowWhoWeAre(false)}
                >
                  <button className="text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-full transition-all">
                    <Info size={12} className="text-blue-400" />
                    Who we are?
                  </button>
                  <AnimatePresence>
                    {showWhoWeAre && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 mt-3 w-80 bg-[#0A0A0C]/90 backdrop-blur-[40px] border border-white/10 rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden z-[100]"
                      >
                        <div className="p-6">
                          <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-white/5 mb-4 overflow-hidden shadow-2xl border border-white/10 relative">
                              <img 
                                src="https://dwuxqhdczbrlxhqxipgm.supabase.co/storage/v1/object/public/Tanmyaa%20Logo/Roman%20A.%20Photo%20copy.png" 
                                alt="Ahmed Roman" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h3 className="text-lg font-black text-white tracking-tight leading-none mb-1">Ahmed Roman</h3>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-4">Urban Strategic Advisor</p>
                            
                            <p className="text-[11px] text-white/60 leading-relaxed font-medium mb-5 px-2">
                              Ahmed Roman is an urban planner and designer specializing in inclusive and resilient cities. With over six years of experience across the Middle East, Europe, and North Africa, he works at the intersection of spatial planning, urban policy, and community-focused design.
                            </p>

                            <div className="w-full flex flex-col gap-2">
                              {['Strategic Urban Planning', 'Policy Advisor', 'Placemaking'].map((tag) => (
                                <div key={tag} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold text-white/80 tracking-wide">
                                  {tag}
                                </div>
                              ))}
                            </div>
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
                  <button className="text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-full transition-all">
                    <Mail size={12} className="text-blue-400" />
                    Contact Us
                  </button>
                  <AnimatePresence>
                    {showContact && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 mt-3 w-64 bg-[#0A0A0C]/90 backdrop-blur-[40px] border border-white/10 rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] p-6 z-[100]"
                      >
                        <div className="space-y-4">
                          <a href="mailto:ahmedroman@tanmyaa.com" className="group flex items-center gap-4 p-3 bg-white/5 rounded-2xl hover:bg-blue-500/10 transition-all border border-white/5">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                              <Mail size={14} className="text-blue-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">E-Mail</span>
                              <span className="text-[10px] font-bold text-white/90">ahmedroman@tanmyaa.com</span>
                            </div>
                          </a>
                          <a href="https://wa.me/201018960176" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 p-3 bg-white/5 rounded-2xl hover:bg-green-500/10 transition-all border border-white/5">
                            <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center">
                              <MessageSquare size={14} className="text-green-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">WhatsApp</span>
                              <span className="text-[10px] font-bold text-white/90">+201018960176</span>
                            </div>
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
