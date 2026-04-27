
import React, { useState } from 'react';
import { motion } from 'motion/react';

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
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-[3rem] shadow-2xl p-8 md:p-16 selection:bg-blue-600 selection:text-white overflow-hidden relative"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 -mr-32 -mt-32 rounded-full"></div>
      
      {!userEmail ? (
        <div className="text-center max-w-2xl mx-auto space-y-12 relative z-10">
          <div className="inline-block px-4 py-1.5 bg-blue-600/10 border border-blue-600/20 rounded-full mb-4">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em]">Phase 01: Intelligent Inquiry</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-sans font-light tracking-tight leading-[1.1] text-white">
            Unlock <span className="font-serif italic font-normal text-blue-400">Deep Insights.</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Access our advanced AI thinking engine to explore complex urban planning challenges through an interactive visual framework.
          </p>
          <button
            onClick={onLogin}
            className="group relative inline-flex items-center space-x-6 bg-white text-black font-black uppercase tracking-[0.2em] py-5 px-12 rounded-full hover:scale-105 transition-all duration-500 overflow-hidden"
          >
            <span className="relative z-10">Sign in with Google</span>
            <div className="w-8 h-8 rounded-full border border-black/20 flex items-center justify-center relative z-10 transition-transform group-hover:rotate-12">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-2.21 5.39-7.84 5.39-4.84 0-8.79-4.01-8.79-8.94s3.95-8.94 8.79-8.94c2.75 0 4.6 1.17 5.66 2.18l2.59-2.5c-1.66-1.55-3.82-2.5-8.25-2.5C5.38 1.18 0 6.56 0 13.18s5.38 12 12.48 12c7.41 0 12.32-5.21 12.32-12.55 0-.84-.09-1.49-.21-2.13l-12.11-.58z"/>
              </svg>
            </div>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto w-full space-y-24 relative z-10">
          <div className="space-y-20">
            <div className="flex flex-col space-y-6">
              <div className="flex items-center space-x-4">
                 <span className="w-8 h-px bg-blue-600/50"></span>
                 <label htmlFor="topic" className="text-[10px] font-medium tracking-[0.3em] uppercase text-white/40">Subject Architecture</label>
              </div>
              <div className="relative group">
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., The 15-Minute City Matrix..."
                  className="w-full bg-transparent text-4xl md:text-5xl font-sans font-light text-white placeholder-white/5 transition-all duration-300 focus:outline-none py-4 border-b border-white/10 focus:border-blue-600"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col space-y-6">
              <div className="flex items-center space-x-4">
                 <span className="w-8 h-px bg-white/20"></span>
                 <label htmlFor="context" className="text-[10px] font-medium tracking-[0.3em] uppercase text-white/40">Technical Context</label>
              </div>
              <div className="relative group">
                <textarea
                  id="context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Define local constraints, demographic shifts, or specific planning queries..."
                  rows={2}
                  className="w-full bg-transparent text-2xl md:text-3xl font-sans font-light text-white/70 placeholder-white/5 transition-all duration-300 resize-none focus:outline-none py-4 border-b border-white/10 focus:border-blue-600 leading-relaxed"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-12 border-t border-white/5 pt-16">
            <div className="flex flex-col items-start translate-y-1">
              <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-white/40 mb-2">Cognitive Capacity</span>
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-sans font-light text-white">{credits}</span>
                <span className="text-xs font-medium tracking-widest text-white/40 uppercase">Intelligence Units</span>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !topic.trim() || !context.trim() || credits < 10}
              className="group flex flex-col items-end text-right transition-all duration-500 disabled:opacity-20 translate-y-1"
            >
              <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-white/40 mb-1 group-hover:text-blue-400 transition-colors uppercase">
                {isLoading ? 'Synthesizing...' : 'Execute Concept'}
              </span>
              <div className="flex items-center space-x-6">
                <span className="text-xl md:text-3xl font-sans font-bold uppercase tracking-[0.1em] group-hover:-translate-x-2 transition-transform">
                  {isLoading ? 'Processing Insights...' : 'Initialize Thinking Board'}
                </span>
                <div className="w-16 h-[1px] bg-blue-600 group-hover:w-24 transition-all duration-500 shadow-[0_0_15px_rgba(37,99,235,0.8)]" />
              </div>
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
};

export default UrbanDeepUnderstandingInputForm;
