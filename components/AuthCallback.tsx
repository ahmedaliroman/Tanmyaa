import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthCallback: React.FC = () => {
  const { session } = useAuth();

  useEffect(() => {
    // If session is established, redirect to home to clear URL parameters
    if (session) {
      window.location.href = '/';
      return;
    }

    // If session is not yet established, we wait a moment for Supabase to process the URL.
    // If it takes too long or fails, we redirect to home anyway to avoid getting stuck.
    const timer = setTimeout(() => {
      window.location.href = '/';
    }, 2000);

    return () => clearTimeout(timer);
  }, [session]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050508] text-white">
      <div className="flex flex-col items-center animate-fade-in">
        <div className="w-12 h-12 border-4 border-[#456882] border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold text-white mb-2">Verifying Login...</h2>
        <p className="text-gray-400">Please wait a moment.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
