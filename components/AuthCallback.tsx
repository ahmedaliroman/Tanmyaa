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
    <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-[420px] bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center gap-8 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
            <Loader className="w-10 h-10 text-white animate-spin" />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold text-white tracking-tight">Authenticating</h2>
          <p className="text-white/60 text-sm font-medium">Please wait while we complete your sign-in.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
