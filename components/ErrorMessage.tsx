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
          displayMessage = "The AI service is currently under heavy load or you've reached a temporary rate limit. We've attempted to retry automatically, but the limit persists. Please wait 30-60 seconds and try again.";
        }
      }
    }
  } catch {
    // Not a JSON string or parsing failed, use original message
  }

  return (
    <div className="bg-rose-900/40 border border-rose-500/50 text-rose-200 p-4 rounded-xl flex items-start space-x-4 animate-fade-in" role="alert">
      <div className="flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p className="font-bold text-white">{isQuotaError ? 'Service Temporarily Busy' : 'An Error Occurred'}</p>
        <p className="text-sm mt-1">{displayMessage}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
