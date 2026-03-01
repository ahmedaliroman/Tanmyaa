import React, { useState, useEffect } from 'react';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';
import GeneratorWelcome from './Welcome';
import AIAssistant from './AIAssistant';

interface GeneratorShellProps<T> {
  title: string;
  description: string;
  icon: React.ReactNode;
  isLoading: boolean;
  error: string | null;
  result: T | null;
  renderInputForm: () => React.ReactNode;
  renderResult: (result: T) => React.ReactNode;
  renderExportControls?: (result: T) => React.ReactNode;
  onUpdateResult?: (updatedResult: T) => void;
  userEmail: string | null;
  onLogin: () => void;
  onUpgrade: () => void;
}

const GeneratorShell = <T extends object>({
  title,
  description,
  icon,
  isLoading,
  error,
  result,
  renderInputForm,
  renderResult,
  renderExportControls,
  onUpdateResult,
  userEmail,
  onLogin,
  onUpgrade,
}: GeneratorShellProps<T>) => {
  const [internalResult, setInternalResult] = useState<T | null>(result);

  useEffect(() => {
    setInternalResult(result);
  }, [result]);

  const handleRefine = (refinedJson: Partial<T>) => {
    const updatedResult = { ...internalResult, ...refinedJson } as T;
    setInternalResult(updatedResult);
    if (onUpdateResult) {
      onUpdateResult(updatedResult);
    }
  };

  return (
    <>
      {userEmail ? (
        renderInputForm()
      ) : (
        <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sign in Required</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            To prevent misuse and track your generation credits, please sign in with your Gmail account.
          </p>
          <button
            onClick={onLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg shadow-blue-900/20 flex items-center space-x-2 mx-auto"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      )}
      <div className="mt-12">
        {isLoading && <Loader />}
        {error && <ErrorMessage message={error} />}
        {internalResult ? (
          <div className="relative animate-fade-in">
            {renderExportControls && (
              <div className="my-4 p-4 bg-black/30 rounded-lg flex justify-between items-center border border-white/10">
                <h3 className="text-lg font-semibold text-white">{title} Generated</h3>
                <div>{renderExportControls(internalResult)}</div>
              </div>
            )}
            {renderResult(internalResult)}
            <AIAssistant<T>
              contextData={internalResult}
              onRefine={handleRefine}
              onUpgrade={onUpgrade}
            />
          </div>
        ) : (
          !isLoading && !error && (
            <GeneratorWelcome
              title={title}
              description={description}
              icon={icon}
            />
          )
        )}
      </div>
    </>
  );
};

export default GeneratorShell;