import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  let displayMessage = message;
  let isQuotaError = false;

  try {
    if (typeof message === 'string' && message.trim().startsWith('{')) {
      const parsed = JSON.parse(message);
      if (parsed.error && parsed.error.message) {
        displayMessage = parsed.error.message;
        if (parsed.error.code === 429 || parsed.error.status === 'RESOURCE_EXHAUSTED') {
          isQuotaError = true;
          displayMessage = "The AI service is currently under heavy load. I'm curious to help, but I need a moment to breathe. Please wait 30-60 seconds and try again.";
        }
      }
    }
  } catch {
    // Not a JSON string or parsing failed, use original message
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 animate-ios-reveal">
      <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-6 shadow-2xl flex items-start gap-5 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
        
        <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 relative">
          <div className="absolute inset-0 bg-rose-500 blur-lg opacity-20 animate-pulse" />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <div className="flex-1 relative z-10">
          <h3 className="text-white font-black text-sm uppercase tracking-[0.2em] mb-2">
            {isQuotaError ? 'Service Breath' : 'Insight Interrupted'}
          </h3>
          <p className="text-gray-300 text-xs leading-relaxed font-medium">
            {displayMessage}
          </p>
          
          <div className="mt-4 flex items-center gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="text-[10px] font-black uppercase tracking-widest text-white hover:text-rose-400 transition-colors"
            >
              Refresh
            </button>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Curious to resolve
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
