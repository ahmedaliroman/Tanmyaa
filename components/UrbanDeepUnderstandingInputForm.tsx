
import React, { useState } from 'react';

interface InputFormProps {
  onSubmit: (topic: string, context: string) => void;
  isLoading: boolean;
  credits: number;
  userEmail: string | null;
  onLogin: () => void;
}

const UrbanDeepUnderstandingInputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, credits, userEmail, onLogin }) => {
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && context.trim()) {
      onSubmit(topic, context);
    }
  };

  return (
    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-3xl shadow-2xl p-6 md:p-8">
      {!userEmail ? (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-white mb-2">Sign in Required</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Access our advanced AI thinking engine to explore complex urban planning challenges. Please sign in to continue.
          </p>
          <button
            onClick={onLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg shadow-blue-900/20 flex items-center space-x-2 mx-auto"
          >
            <span>Sign in with Google</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-black/40 rounded-xl border border-gray-800 overflow-hidden">
            <div className="border-b border-gray-800 p-4">
              <label htmlFor="topic" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Subject Architecture</label>
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., The 15-Minute City Matrix..."
                rows={1}
                className="w-full bg-transparent text-white placeholder-gray-500 transition duration-200 resize-none focus:outline-none focus:ring-0 text-xl font-medium"
                disabled={isLoading}
                required
              />
            </div>

            <div className="p-4">
              <label htmlFor="context" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Technical Context</label>
              <textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Define local constraints, demographic shifts, or specific planning queries..."
                rows={4}
                className="w-full bg-transparent text-white placeholder-gray-500 transition duration-200 resize-none focus:outline-none focus:ring-0"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-4">
            <div className="flex flex-col items-start translate-y-1">
              <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-white/40 mb-1">Intelligence Capacity</span>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-sans font-bold text-white">{credits}</span>
                <span className="text-[10px] font-medium uppercase tracking-widest text-white/30">Units Available</span>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !topic.trim() || !context.trim() || credits < 10}
              className="bg-gray-700/80 text-gray-200 font-semibold py-2 px-6 rounded-full hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50 flex items-center space-x-2"
            >
              <span>{isLoading ? 'Processing Insights...' : 'Initialize Thinking Board'}</span>
              {!isLoading && <div className="w-8 h-[1px] bg-white group-hover:w-12 transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UrbanDeepUnderstandingInputForm;
