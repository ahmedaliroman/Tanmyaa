
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { sendMessageToInstantChatStream } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';
import { useAuth } from '../context/AuthContext';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

interface InstantChatProps {
    onUpgrade: () => void;
}

const InstantChat: React.FC<InstantChatProps> = ({ onUpgrade }) => {
    const { deductCredits, profile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
             if (messages.length === 0) {
                setMessages([{ sender: 'ai', text: "I'm Rom, your real-time planning consultant. How can I assist you?" }]);
            }
        }
    }, [isOpen, messages.length]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;
        
        if (profile && profile.credits < 5) {
            setMessages(prev => [...prev, { sender: 'user', text: input }, { sender: 'ai', text: "Insufficient credits. Please upgrade your plan." }]);
            onUpgrade();
            setInput('');
            return;
        }

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const success = await deductCredits(5);
            if (!success) {
                throw new Error("Failed to deduct credits.");
            }

            const stream = await sendMessageToInstantChatStream(currentInput);
            
            setMessages(prev => [...prev, { sender: 'ai', text: '' }]);
            let responseReceived = false;

            for await (const chunk of stream) {
                 const c = chunk as GenerateContentResponse;
                 const chunkText = c.text;
                if (chunkText) {
                    responseReceived = true;
                    setMessages(prev => {
                        const newMessages = [...prev];
                        if (newMessages.length > 0 && newMessages[newMessages.length - 1].sender === 'ai') {
                            newMessages[newMessages.length - 1].text += chunkText;
                        }
                        return newMessages;
                    });
                }
            }

            if (!responseReceived) {
                 setMessages(prev => {
                    const newMessages = [...prev];
                    if (newMessages.length > 0 && newMessages[newMessages.length - 1].sender === 'ai') {
                         newMessages[newMessages.length - 1].text = "I'm sorry, I couldn't generate a response. Please try again.";
                    }
                    return newMessages;
                });
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages.length > 0 && newMessages[newMessages.length - 1].sender === 'ai') {
                     newMessages[newMessages.length - 1].text = "Apologies, I've encountered an error. Please try again.";
                     return newMessages;
                }
                return [...newMessages, { sender: 'ai', text: "Apologies, I've encountered an error. Please try again." }];
            });
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, deductCredits, profile, onUpgrade]);

    return (
        <>
            <div className={`fixed bottom-5 right-5 z-50 transition-all duration-300 ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative w-16 h-16 bg-white/5 backdrop-blur-lg text-white rounded-full shadow-lg hover:bg-white/15 transition-all duration-300 flex items-center justify-center border border-white/10"
                    aria-label="Open Instant Chat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </button>
            </div>

            <div className={`fixed bottom-4 right-4 z-50 w-[90vw] max-w-md h-[70vh] flex flex-col bg-black/40 backdrop-blur-xl rounded-xl shadow-2xl border-white/20 transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                 <div className="p-4 border-b border-white/10 flex justify-between items-center flex-shrink-0 bg-gradient-to-b from-black/50 to-transparent">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center border border-white/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-white">Consult with Rom</h2>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white" aria-label="Close chat">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="flex-grow p-4 overflow-y-auto">
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'ai' && (
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center border border-white/20">
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                       </svg>
                                    </div>
                                )}
                                <div className={`px-4 py-2 rounded-xl max-w-xs md:max-w-sm ${msg.sender === 'user' ? 'bg-white/20 backdrop-blur-md text-white' : 'bg-gray-800 text-gray-200'}`}>
                                    <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && messages[messages.length-1]?.sender === 'user' && (
                             <div className="flex items-end gap-3 justify-start">
                                 <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center border border-white/20">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                       </svg>
                                 </div>
                                <div className="px-4 py-2 rounded-xl bg-gray-800 text-gray-200">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 rounded-full animate-pulse bg-gray-300"></div>
                                        <div className="w-2 h-2 rounded-full animate-pulse bg-gray-300" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 rounded-full animate-pulse bg-gray-300" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
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
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={"Ask Rom..."}
                            className="w-full p-2 bg-black/20 border border-white/10 rounded-full text-white placeholder-gray-400 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all px-4"
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={isLoading || !input.trim()} className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white/10 text-white rounded-full hover:bg-white/20 disabled:bg-white/5 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" transform="rotate(90 12 12)" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default InstantChat;
