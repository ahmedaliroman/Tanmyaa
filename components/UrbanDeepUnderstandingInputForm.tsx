
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
            To prevent misuse and track your generation credits, please sign in with your Gmail account.
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
          <div className="space-y-4">
            <div>
              <label htmlFor="topic" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Urban Topic</label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., 15-Minute City, Transit-Oriented Development, Urban Heat Island"
                className="w-full bg-black/40 border border-gray-800 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition duration-200"
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <label htmlFor="context" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Context & Specific Focus</label>
              <textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Describe the specific context or questions you want to explore. e.g., How can we implement 15-minute city principles in a sprawling suburban environment like Springfield?"
                rows={4}
                className="w-full bg-black/40 border border-gray-800 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition duration-200 resize-none"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-gray-400">
              {credits} credits remaining.
            </div>
            <button
              type="submit"
              disabled={isLoading || !topic.trim() || !context.trim() || credits < 10}
              className="bg-gray-700/80 text-gray-200 font-semibold py-3 px-8 rounded-full hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50"
            >
              {isLoading ? 'Generating...' : 'Generate Deep Understanding'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UrbanDeepUnderstandingInputForm;
