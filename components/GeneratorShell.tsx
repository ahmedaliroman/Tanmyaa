import React, { useState, useEffect } from 'react';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';
import GeneratorWelcome from './Welcome';
import AIAssistant from './AIAssistant';

interface GeneratorShellProps<T> {
  title: string;
  description: string;
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
          <h2 className="text-2xl font-bold text-white mb-2">Sign in Required</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            To prevent misuse and track your generation credits, please sign in with your Gmail account.
          </p>
          <button
            onClick={onLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg shadow-blue-900/20 flex items-center space-x-2 mx-auto"
          >
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
            />
          )
        )}
      </div>
    </>
  );
};

export default GeneratorShell;