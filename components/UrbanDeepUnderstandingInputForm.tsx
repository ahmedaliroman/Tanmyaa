
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
    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-[3rem] shadow-2xl p-8 md:p-12">
      {!userEmail ? (
        <div className="text-center py-8">
          <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Enter the Virtual Classroom</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
            Sign in to start your interactive thinking board session with our AI Urban Planning Professor.
          </p>
          <button
            onClick={onLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full transition-all duration-300 shadow-xl shadow-blue-900/40 flex items-center space-x-3 mx-auto group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-2.21 5.39-7.84 5.39-4.84 0-8.79-4.01-8.79-8.94s3.95-8.94 8.79-8.94c2.75 0 4.6 1.17 5.66 2.18l2.59-2.5c-1.66-1.55-3.82-2.5-8.25-2.5C5.38 1.18 0 6.56 0 13.18s5.38 12 12.48 12c7.41 0 12.32-5.21 12.32-12.55 0-.84-.09-1.49-.21-2.13l-12.11-.58z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="inline-block bg-blue-600/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full mb-4 border border-blue-500/20">
                    New Lesson
                </div>
                <h2 className="text-3xl font-black text-white tracking-tighter">What shall we explore today?</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="topic" className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-2">Lesson Topic</label>
                  <input
                    id="topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., The 15-Minute City, Transit-Oriented Development, Urban Heat Islands"
                    className="w-full bg-black/40 border border-gray-800 rounded-3xl py-4 px-6 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition duration-200 text-lg font-medium"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="context" className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-2">Specific Context or Question</label>
                  <textarea
                    id="context"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g., How can we implement these principles in a sprawling suburban environment? What are the key financial risks?"
                    rows={4}
                    className="w-full bg-black/40 border border-gray-800 rounded-3xl py-4 px-6 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition duration-200 resize-none leading-relaxed"
                    disabled={isLoading}
                    required
                  />
                </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-4 border-t border-white/5">
            <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {credits} Credits Available
              </span>
            </div>
            <button
              type="submit"
              disabled={isLoading || !topic.trim() || !context.trim() || credits < 10}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-12 rounded-full disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-xl shadow-blue-900/20 uppercase tracking-widest text-xs"
            >
              {isLoading ? 'Preparing Board...' : 'Start Thinking Board'}
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-600 uppercase tracking-[0.2em]">Generation costs 10 credits</p>
        </form>
      )}
    </div>
  );
};

export default UrbanDeepUnderstandingInputForm;
