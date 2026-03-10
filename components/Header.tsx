
import React, { useState, useEffect, useRef } from 'react';
import { TanmyaaLogo } from './TanmyaaLogo';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { LogOut, CreditCard, Clock } from 'lucide-react';
import UsageHistoryModal from './UsageHistoryModal';

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
            {user ? (
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
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
                  <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-fade-in z-50">
                    <div className="p-3 border-b border-white/5">
                      <p className="text-sm font-medium text-white truncate">{user.email}</p>
                      <p className="text-xs text-gray-500">{profile?.plan || 'Free'} Plan</p>
                    </div>
                    <button 
                      onClick={() => {
                        setIsHistoryModalOpen(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                    >
                      <Clock size={14} />
                      Generation History
                    </button>
                    <button 
                      onClick={() => onNavigate('subscription')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                    >
                      <CreditCard size={14} />
                      Buy Credits
                    </button>
                    <button 
                      onClick={() => {
                        signOut();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
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
      />

      <UsageHistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
      />
    </>
  );
};

export default Header;
