
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { sendMessageToInstantChatStream } from '@/services/geminiService';
import { GenerateContentResponse } from '@google/genai';
import { useAuth } from '@/context/AuthContext';
import { BrandingInfo } from '@/types';
import { motion } from 'motion/react';

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
                setMessages([{ sender: 'ai', text: "Welcome. I am Tanmyaa Bot, the advanced AI Urban Planning Consultant. Developed in 2025 by Ahmed Roman, I triangulate technical data from multiple global resources to provide high-quality strategic advisory. How can I support your mission today?" }]);
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
            const success = await deductCredits(5, `Instant Chat: ${currentInput.substring(0, 50)}...`, undefined, 'CHAT');
            if (!success) {
                throw new Error("Failed to deduct credits.");
            }

            // Prepare history for multi-turn chat
            const history = messages.map(msg => ({
                role: (msg.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
                parts: [{ text: msg.text }]
            }));

            const branding: BrandingInfo = {
                logo: profile?.branding_logo || '',
                colors: profile?.branding_colors || '',
                presentation_template: profile?.branding_presentation_template || '',
                presentation_template_url: profile?.branding_presentation_template_url || '',
                report_template: profile?.branding_report_template || '',
                report_template_url: profile?.branding_report_template_url || ''
            };

            const stream = await sendMessageToInstantChatStream(currentInput, history, profile?.plan, branding);
            
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
    }, [input, isLoading, deductCredits, profile, onUpgrade, messages]);

    return (
        <>
            <div className="fixed bottom-6 right-0 w-full pointer-events-none z-50">
                <div className="container mx-auto px-4 md:px-8 flex justify-end">
                    <div className="flex items-center gap-4 pointer-events-auto">
                        <motion.div 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ 
                                opacity: isOpen ? 0 : 1, 
                                x: isOpen ? 10 : 0 
                            }}
                            transition={{ duration: 0.5 }}
                            className="hidden lg:flex flex-col items-end select-none text-right"
                        >
                            <motion.div className="flex flex-col leading-tight">
                                <div className="flex justify-end">
                                    {"REQUEST IMMEDIATE".split("").map((char, index) => (
                                        <motion.span
                                            key={`row1-${index}`}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{
                                                duration: 0.1,
                                                delay: index * 0.05,
                                                repeat: Infinity,
                                                repeatDelay: 5,
                                                repeatType: "reverse"
                                            }}
                                            className="text-white text-[10px] font-bold tracking-widest"
                                        >
                                            {char === " " ? "\u00A0" : char}
                                        </motion.span>
                                    ))}
                                </div>
                                <div className="flex justify-end">
                                    {"URBAN CONSULTATION".split("").map((char, index) => (
                                        <motion.span
                                            key={`row2-${index}`}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{
                                                duration: 0.1,
                                                delay: (index + 17) * 0.05, // Stagger after first row
                                                repeat: Infinity,
                                                repeatDelay: 5,
                                                repeatType: "reverse"
                                            }}
                                            className="text-white text-[10px] font-bold tracking-widest"
                                        >
                                            {char === " " ? "\u00A0" : char}
                                        </motion.span>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                        
                        <button
                            onClick={() => setIsOpen(true)}
                            className={`relative w-11 h-11 transition-all duration-500 flex items-center justify-center hover:scale-110 active:scale-90 ${isOpen ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}`}
                            aria-label="Open Urban Consultation"
                        >
                            <img 
                                src="https://dwuxqhdczbrlxhqxipgm.supabase.co/storage/v1/object/public/Tanmyaa%20Logo/Hi!s.png" 
                                alt="Consultation Icon"
                                className="w-full h-full object-contain filter grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                            />
                        </button>
                    </div>
                </div>
            </div>

            <div className={`fixed bottom-4 right-4 z-50 w-[90vw] max-w-md h-[70vh] flex flex-col bg-black/40 backdrop-blur-xl rounded-xl shadow-2xl border-white/20 transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                 <div className="p-4 border-b border-white/10 flex justify-between items-center flex-shrink-0 bg-gradient-to-b from-black/50 to-transparent">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/10 overflow-hidden">
                            <img 
                                src="https://dwuxqhdczbrlxhqxipgm.supabase.co/storage/v1/object/public/Tanmyaa%20Logo/Hi!s.png" 
                                alt="Consultation"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Consult with Tanmyaa Bot</h2>
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
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/10 overflow-hidden">
                                       <img 
                                            src="https://dwuxqhdczbrlxhqxipgm.supabase.co/storage/v1/object/public/Tanmyaa%20Logo/Hi!s.png" 
                                            alt="Rom"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className={`px-4 py-2 rounded-xl max-w-xs md:max-w-sm ${msg.sender === 'user' ? 'bg-white/20 backdrop-blur-md text-white' : 'bg-gray-800 text-gray-200'}`}>
                                    <div className="prose prose-sm prose-invert max-w-none">
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && messages[messages.length-1]?.sender === 'user' && (
                             <div className="flex items-end gap-3 justify-start">
                                 <div className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/10 overflow-hidden">
                                       <img 
                                            src="https://dwuxqhdczbrlxhqxipgm.supabase.co/storage/v1/object/public/Tanmyaa%20Logo/Hi!s.png" 
                                            alt="Rom"
                                            className="w-full h-full object-cover"
                                        />
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
                            placeholder={"Ask Tanmyaa Bot..."}
                            dir="auto"
                            className="flex-1 min-w-0 py-3 bg-black/20 border border-white/10 rounded-full text-white placeholder-gray-400 focus:ring-2 focus:ring-white/50 focus:border-white/50 px-4 transition-shadow leading-normal outline-none"
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
