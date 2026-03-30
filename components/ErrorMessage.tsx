import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="bg-rose-900/40 border border-rose-500/50 text-rose-200 p-4 rounded-xl flex items-start space-x-4 animate-fade-in" role="alert">
      <div className="flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p className="font-bold text-white">An Error Occurred</p>
        <p className="text-sm mt-1">{message}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
