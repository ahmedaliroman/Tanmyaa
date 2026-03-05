
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { streamAssistantResponse } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';
import { useAuth } from '../context/AuthContext';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

interface AIAssistantProps<T> {
  contextData: T;
  onRefine: (refinedJson: Partial<T>) => void;
  onUpgrade: () => void;
}

const GenerateIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.5 2.25a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0v-3zM6.28 4.93a.75.75 0 0 0-1.06-1.06l-2.12 2.12a.75.75 0 0 0 1.06 1.06l2.12-2.12zM21.89 8.11a.75.75 0 0 0-1.06-1.06l-2.12 2.12a.75.75 0 0 0 1.06 1.06l2.12-2.12zM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM2.25 11.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3zM21.75 11.25a.75.75 0 0 0 0 1.5h-3a.75.75 0 0 0 0-1.5h3zM9.22 17.69a.75.75 0 0 0-1.06 1.06l2.12 2.12a.75.75 0 0 0 1.06-1.06l-2.12-2.12zM18.31 16.63a.75.75 0 0 0-1.06 1.06l2.12 2.12a.75.75 0 0 0 1.06-1.06l-2.12-2.12z" />
    </svg>
);

const AIAssistant = <T extends object>({ contextData, onRefine, onUpgrade }: AIAssistantProps<T>) => {
    const { refreshProfile, deductCredits, profile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: "How can I refine this document for you?" }
    ]);
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
        }
    }, [isOpen]);

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

        let accumulatedJsonString = '';
        try {
            const success = await deductCredits(5);
            await refreshProfile();
            if (!success) {
                throw new Error("Failed to deduct credits.");
            }

            const stream = await streamAssistantResponse(contextData, currentInput);

            setMessages(prev => [...prev, { sender: 'ai', text: "Applying changes..." }]);

            for await (const chunk of stream) {
                const c = chunk as GenerateContentResponse;
                const chunkText = c.text;
                if (chunkText) {
                    accumulatedJsonString += chunkText;
                }
            }
            
            // Now that the stream is finished, parse the complete JSON
            if (accumulatedJsonString) {
                const cleanedJson = accumulatedJsonString.replace(/^```json\s*/, '').replace(/```$/, '');
                const parsed = JSON.parse(cleanedJson);
                onRefine(parsed);

                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = "I've updated the document. What's next?";
                    return newMessages;
                });
            } else {
                 setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = "I received an empty response. Please try rephrasing.";
                    return newMessages;
                });
            }

        } catch (err) {
            console.error("AI Assistant Error:", err);
            let errorMessage = "Apologies, I've encountered an error. Please try again.";
            // Try to see if the accumulated string contains a JSON error message from the server
            try {
                if (accumulatedJsonString) {
                    const errorJson = JSON.parse(accumulatedJsonString);
                    if (errorJson.error && errorJson.error.message) {
                        errorMessage = `API Error: ${errorJson.error.message}`;
                    }
                }
            } catch { // parseError is unused
                // Ignore if it's not valid JSON, stick to the generic error.
            }

            setMessages(prev => {
                 const newMessages = [...prev];
                 // Update the last "Applying changes..." message to be the error message
                 if(newMessages.length > 0 && newMessages[newMessages.length - 1].sender === 'ai') {
                     newMessages[newMessages.length - 1].text = errorMessage;
                     return newMessages;
                 }
                 // Otherwise, just add the error message
                 return [...newMessages, { sender: 'ai', text: errorMessage }];
            });
        } finally {
            setIsLoading(false);
        }
    }, [contextData, input, isLoading, onRefine, deductCredits, profile, refreshProfile, onUpgrade]);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg hover:scale-105 transition-transform duration-300 flex items-center justify-center ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
                aria-label="Open AI Assistant"
            >
                <GenerateIcon className="w-8 h-8" />
            </button>

            <div 
                className={`fixed bottom-24 right-4 z-50 w-[90vw] max-w-sm h-[60vh] flex flex-col bg-black/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 transition-all duration-300 ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex-shrink-0 flex items-center justify-center border border-blue-400/50">
                            <GenerateIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white" aria-label="Close chat">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Message Area */}
                <div className="flex-grow p-4 overflow-y-auto">
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'ai' && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex-shrink-0 flex items-center justify-center border border-blue-400/50">
                                        <GenerateIcon className="w-5 h-5 text-white" />
                                    </div>
                                )}
                                <div className={`px-4 py-2 rounded-xl max-w-xs ${msg.sender === 'user' ? 'bg-white/15 text-white' : 'bg-gray-800 text-gray-200'}`}>
                                    <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-end gap-3 justify-start">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex-shrink-0 flex items-center justify-center border border-blue-400/50">
                                    <GenerateIcon className="w-5 h-5 text-white" />
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

                {/* Input Area */}
                <div className="p-3 border-t border-white/10 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="e.g., 'Make it more concise...'"
                            className="w-full p-2 bg-black/20 border border-white/10 rounded-full text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-4"
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={isLoading || !input.trim()} className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:bg-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors border border-blue-400/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" transform="rotate(90 12 12)" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AIAssistant;
