import React, { useEffect } from 'react';
import { Loader } from 'lucide-react';

const AuthCallback: React.FC = () => {
  useEffect(() => {
    // Supabase handles the session automatically from the URL hash
    // We just need to wait a moment and then redirect to home
    const timeout = setTimeout(() => {
      window.location.href = '/';
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
      <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-2xl backdrop-blur-xl flex flex-col items-center gap-6 max-w-md w-full text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
          <Loader className="w-12 h-12 text-emerald-500 animate-spin relative" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Authenticating...</h2>
          <p className="text-zinc-400">Please wait while we complete your sign-in.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
