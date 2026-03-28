import React from 'react';
import { useBranding } from '../hooks/useBranding';

interface PreloaderProps {
  message?: string;
  isExiting?: boolean;
}

const Preloader: React.FC<PreloaderProps> = ({ message = "Loading...", isExiting = false }) => {
  const { logo, colors } = useBranding();

  // Extract primary color from branding or use default Tanmyaa blue
  let primaryColor = '#1B3C53';
  let secondaryColor = '#456882';
  let accentColor = '#D2C1B6';
  
  if (colors) {
      const hexRegex = /#([0-9A-F]{6})/gi;
      const matches = [...colors.matchAll(hexRegex)].map(m => '#' + m[1]);
      if (matches.length > 0) primaryColor = matches[0];
      if (matches.length > 1) secondaryColor = matches[1];
      if (matches.length > 2) accentColor = matches[2];
  }

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050508] transition-opacity duration-700 ease-in-out ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.4; transform: scale(1) rotate(0deg); }
            50% { opacity: 0.7; transform: scale(1.05) rotate(5deg); }
          }
          .text-shimmer {
            background: linear-gradient(
              to right,
              rgba(255, 255, 255, 0.3) 20%,
              rgba(255, 255, 255, 1) 40%,
              rgba(255, 255, 255, 1) 60%,
              rgba(255, 255, 255, 0.3) 80%
            );
            background-size: 200% auto;
            color: transparent;
            -webkit-background-clip: text;
            background-clip: text;
            animation: shimmer 2.5s linear infinite;
          }
        `}
      </style>
      
      <div className="relative flex flex-col items-center justify-center" style={{ animation: 'float 6s ease-in-out infinite' }}>
        {/* Ambient Background Glow matching brand colors */}
        <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] max-w-[250px] max-h-[250px] rounded-full blur-[50px]" 
            style={{ 
                background: `linear-gradient(to top right, ${primaryColor}66, ${secondaryColor}66, ${accentColor}66)`,
                animation: 'pulse-glow 5s ease-in-out infinite' 
            }}
        ></div>
        
        {/* Glassmorphic App Icon Container */}
        <div className="relative z-10 flex items-center justify-center w-20 h-20 mb-6 rounded-[1.5rem] bg-white/[0.03] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl overflow-hidden">
            {/* Diagonal light sweep reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50"></div>
            
            {/* Logo */}
            {logo ? (
                <img src={logo} alt="Brand Logo" className="w-12 h-12 object-contain drop-shadow-lg relative z-10" />
            ) : (
                <div className="text-white text-4xl font-black tracking-tighter drop-shadow-lg relative z-10">
                    T.
                </div>
            )}
        </div>
        
        {/* Status Message */}
        <p className="mt-2 text-gray-500 font-medium tracking-[0.2em] uppercase text-[9px] animate-pulse relative z-10">
          {message}
        </p>
      </div>
    </div>
  );
};

export default Preloader;
