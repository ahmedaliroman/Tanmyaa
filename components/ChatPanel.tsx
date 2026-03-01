
import React, { useEffect, useRef, useState } from 'react';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

interface ChatPanelProps {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  onSend: (message?: string) => void;
  isLoading: boolean;
  onClose: () => void;
  suggestions: string[];
  isSuggestionsLoading: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, input, setInput, onSend, isLoading, onClose, suggestions, isSuggestionsLoading }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleClose = () => {
        setIsClosing(true);
    };
    
    const handleAnimationEnd = () => {
        if (isClosing) {
            onClose();
        }
    };


    return (
        <div 
            className={`fixed top-0 right-0 h-full w-[420px] max-w-[90vw] z-50 flex flex-col bg-black/60 backdrop-blur-xl border-l border-white/20 shadow-2xl ${isClosing ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right'}`}
            onAnimationEnd={handleAnimationEnd}
        >
             <div className="p-4 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-900/50 flex-shrink-0 flex items-center justify-center border border-blue-500/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-white">AI Co-Pilot</h2>
                </div>
                <button onClick={handleClose} className="text-gray-400 hover:text-white" aria-label="Close chat">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             <div className="flex-grow p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                             {msg.sender === 'ai' && (
                                <div className="w-6 h-6 rounded-full bg-blue-900/50 flex-shrink-0 flex items-center justify-center border border-blue-500/50">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                            <div className={`px-3 py-2 rounded-xl max-w-xs ${msg.sender === 'user' ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-200'}`}>
                                <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-end gap-2 justify-start">
                             <div className="w-6 h-6 rounded-full bg-blue-900/50 flex-shrink-0 flex items-center justify-center border border-blue-500/50">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                   </svg>
                             </div>
                            <div className="px-4 py-3 rounded-xl bg-gray-800 text-gray-200">
                                <div className="flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-gray-300"></div>
                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-gray-300" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-gray-300" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                     {!isLoading && (isSuggestionsLoading || suggestions.length > 0) &&
                        <div className="animate-fade-in pl-8 pt-2">
                            {isSuggestionsLoading ? (
                                <p className="text-xs text-gray-400 italic">Thinking of suggestions...</p>
                            ) : (
                                <div className="flex flex-col items-start gap-2">
                                    {suggestions.map((s, i) => (
                                        <button key={i} onClick={() => onSend(s)} className="text-left text-sm bg-gray-700/50 hover:bg-gray-600/50 p-2 rounded-lg transition-colors border border-gray-600/50">
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    }
                    <div ref={messagesEndRef} />
                </div>
            </div>
             <div className="p-3 border-t border-white/10 flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && onSend()}
                        placeholder="e.g., 'Add a slide after this one...'"
                        className="w-full p-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm"
                        disabled={isLoading}
                    />
                    <button onClick={() => onSend()} disabled={isLoading || !input.trim()} className="bg-blue-600/50 text-white p-2 rounded-lg hover:bg-blue-500/50 disabled:bg-white/10 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" transform="rotate(90 12 12)" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;
