
import React from 'react';
import { useBranding } from '../hooks/useBranding';

interface TanmyaaLogoProps {
  className?: string;
}

const LogoSvg: React.FC<{className?: string}> = ({className}) => (
    <div className={`text-4xl font-black tracking-tighter ${className}`}>
        T.
    </div>
);


export const TanmyaaLogo: React.FC<TanmyaaLogoProps> = ({ className = '' }) => {
  const { logo, isLoaded } = useBranding();

  if (!isLoaded) {
    return <div className="w-8 h-8 bg-gray-500/20 rounded animate-pulse"></div>;
  }

  if (logo) {
    return (
      <div className={`flex items-center ${className}`}>
        <img src={logo} alt="Custom user logo" className="h-8 w-auto object-contain" />
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <LogoSvg className="text-white" />
    </div>
  );
};

export const TanmyaaLogoPPTX: React.FC = () => {
    const { logo, isLoaded } = useBranding();

    if (!isLoaded) return null;
    if (logo) return <img src={logo} alt="Custom user logo" className="h-8 object-contain" />;

    return (
        <div className="text-4xl font-black tracking-tighter text-[#1B3C53]">
            T.
        </div>
    );
}