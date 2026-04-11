
import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { generateDeepUnderstanding, refineDeepUnderstanding } from '@/services/geminiService';
import type { UrbanDeepUnderstanding, BrandingInfo } from '@/types';
import GeneratorShell from './GeneratorShell';
import { TanmyaaLogo } from './TanmyaaLogo';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

interface GeneratorProps {
    onUpgrade: () => void;
}

const UrbanDeepUnderstandingGenerator: React.FC<GeneratorProps> = ({ onUpgrade }) => {
    const { user, profile, loading, refreshProfile, signInWithGoogle } = useAuth();
    const { companyProfile } = useCompanyProfile();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<UrbanDeepUnderstanding | null>(null);
    const [refinementRequest, setRefinementRequest] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const boardRef = useRef<HTMLDivElement>(null);

    const handleGenerate = async (topic: string, context: string) => {
        setIsLoading(true);
        setError(null);
        setSelectedChoice(null);
        try {
            const branding: BrandingInfo | undefined = profile?.branding_logo || profile?.branding_colors || profile?.branding_template ? {
                logo: profile.branding_logo,
                colors: profile.branding_colors,
                template: profile.branding_template
            } : undefined;

            const result = await generateDeepUnderstanding(topic, context, companyProfile, profile?.plan, branding);
            setData(result);
            await refreshProfile();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to generate deep understanding.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefine = async () => {
        if (!data || !refinementRequest.trim()) return;
        setIsRefining(true);
        setError(null);
        try {
            const branding: BrandingInfo | undefined = profile?.branding_logo || profile?.branding_colors || profile?.branding_template ? {
                logo: profile.branding_logo,
                colors: profile.branding_colors,
                template: profile.branding_template
            } : undefined;

            const result = await refineDeepUnderstanding(data, refinementRequest, companyProfile, profile?.plan, branding);
            setData(result);
            setRefinementRequest('');
            setSelectedChoice(null);
            await refreshProfile();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to refine deep understanding.');
        } finally {
            setIsRefining(false);
        }
    };

    const exportBoard = async () => {
        if (!boardRef.current) return;
        setIsExporting(true);
        try {
            const dataUrl = await toPng(boardRef.current, { quality: 0.95, backgroundColor: '#ffffff' });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, imgHeight);
            pdf.save(`Strategic-Board-${data?.topic.replace(/\s+/g, '-')}.pdf`);
        } catch (err) {
            console.error('Export failed', err);
        } finally {
            setIsExporting(false);
        }
    };

    const getCategoryAccent = (category: string) => {
        switch (category) {
            case 'Core Concept': return 'bg-blue-600';
            case 'Critical Tension': return 'bg-red-600';
            case 'Opportunity Node': return 'bg-green-600';
            case 'Risk Factor': return 'bg-orange-600';
            case 'Strategic Lever': return 'bg-purple-600';
            case 'Data Insight': return 'bg-cyan-600';
            default: return 'bg-gray-900';
        }
    };

    const renderInputForm = () => (
        <UrbanDeepUnderstandingInputForm
            onSubmit={handleGenerate}
            isLoading={isLoading}
            credits={profile?.credits || 0}
            userEmail={user?.email || null}
            onLogin={signInWithGoogle}
        />
    );

    const renderResult = (result: UrbanDeepUnderstanding) => (
        <div className="space-y-12 animate-fade-in">
            <div 
                ref={boardRef} 
                className="p-8 md:p-20 rounded-none bg-[#F8F9FA] border-t-[12px] border-gray-900 shadow-2xl relative overflow-hidden"
                style={{
                    backgroundImage: `
                        radial-gradient(#cbd5e1 1px, transparent 1px)
                    `,
                    backgroundSize: '30px 30px'
                }}
            >
                {/* Technical Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
                    backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                    backgroundSize: '100px 100px'
                }}></div>

                {/* Technical Border Accents */}
                <div className="absolute top-10 left-6 text-[9px] font-mono text-gray-400 uppercase tracking-[0.5em] vertical-text hidden md:block" style={{ writingMode: 'vertical-rl' }}>
                    TANMYA_STRATEGIC_DOC_REF_01 // CONFIDENTIAL // PROPERTY_OF_TANMYA
                </div>
                <div className="absolute top-10 right-6 text-[9px] font-mono text-gray-400 uppercase tracking-[0.5em] vertical-text hidden md:block" style={{ writingMode: 'vertical-rl' }}>
                    URBAN_PLANNING_STRATEGY_BOARD // V2.0 // INTELLECTUAL_ASSET
                </div>

                {/* Tanmyaa Branding Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-24 border-b border-gray-200 pb-12 relative z-10">
                    <div className="flex items-center space-x-10 mb-8 md:mb-0">
                        <div className="bg-gray-900 p-5 shadow-xl">
                            <TanmyaaLogo className="scale-[1.8] text-white" />
                        </div>
                        <div className="h-20 w-px bg-gray-300 hidden md:block"></div>
                        <div>
                            <h1 className="text-5xl font-extrabold text-gray-900 tracking-tighter uppercase leading-none mb-3">Deep Understanding</h1>
                            <div className="flex items-center space-x-4">
                                <span className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 uppercase tracking-[0.2em]">Strategic Doctrine</span>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.4em]">Urban Planning Intelligence Board</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-left md:text-right font-mono border-l-2 md:border-l-0 md:border-r-2 border-gray-200 pl-6 md:pl-0 md:pr-6">
                        <p className="text-sm text-gray-900 font-bold uppercase tracking-widest">REF: {result.topic.substring(0, 12).toUpperCase()}</p>
                        <p className="text-[11px] text-gray-400 mt-2 uppercase font-medium">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}</p>
                    </div>
                </div>

                {/* Teacher Intro */}
                <div className="max-w-6xl mx-auto mb-32 relative z-10">
                    <div className="flex items-center space-x-6 mb-12">
                        <div className="w-16 h-1.5 bg-blue-600"></div>
                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.5em]">Principal Strategist Opening</span>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                        <div className="lg:col-span-8">
                            <h2 className="text-6xl md:text-8xl font-extrabold text-gray-900 mb-12 tracking-tighter leading-[0.85] uppercase">
                                {result.topic}
                            </h2>
                            <div className="relative pl-16 border-l-[6px] border-blue-600 py-4">
                                <p className="text-3xl md:text-4xl text-gray-800 leading-tight font-serif italic font-medium">
                                    &ldquo;{result.teacherPersona.intro}&rdquo;
                                </p>
                            </div>
                        </div>
                        <div className="lg:col-span-4 bg-white p-10 border border-gray-200 shadow-xl rounded-none relative">
                            <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-600"></div>
                            <div className="flex items-center space-x-3 mb-8">
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Intelligence Status: Verified</span>
                            </div>
                            <p className="text-sm font-medium text-gray-600 leading-relaxed">
                                This session is curated by Tanmya&apos;s Strategic Intelligence Unit. All insights are technically defensible and grounded in contemporary urban planning doctrine.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Thinking Board Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32 relative z-10">
                    {result.stickyNotes.map((note, idx) => (
                        <div 
                            key={note.id}
                            className={`group relative p-12 bg-white border border-gray-100 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 flex flex-col`}
                            style={{ minHeight: '380px' }}
                        >
                            {/* Technical Index */}
                            <div className="absolute top-8 right-10 text-[10px] font-mono text-gray-300 font-bold tracking-widest">
                                NODE_{String(idx + 1).padStart(2, '0')}
                            </div>
                            
                            <div className="flex flex-col h-full">
                                <div className="mb-10">
                                    <div className={`h-1.5 w-16 mb-5 ${getCategoryAccent(note.category)}`}></div>
                                    <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400">{note.category}</span>
                                </div>
                                
                                <h3 className="text-3xl font-extrabold mb-8 leading-none text-gray-900 uppercase tracking-tighter group-hover:text-blue-600 transition-colors duration-300">
                                    {note.title}
                                </h3>
                                
                                <p className="text-xl font-medium leading-snug text-gray-700 mb-10 flex-grow">
                                    {note.content}
                                </p>
                                
                                <div className="flex flex-wrap gap-3 mt-auto">
                                    {note.tags.map((tag, i) => (
                                        <span key={i} className="text-[10px] font-bold px-3 py-1.5 bg-gray-50 text-gray-500 border border-gray-100 rounded-none uppercase tracking-widest group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all duration-300">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Interactive Lesson */}
                <div className="max-w-6xl mx-auto bg-white border border-gray-100 p-10 md:p-20 shadow-2xl relative z-10 mb-32 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 -mr-32 -mt-32 rounded-full"></div>
                    
                    <div className="flex flex-col md:flex-row md:items-center gap-12 mb-20 relative z-10">
                        <div className="w-28 h-28 bg-gray-900 flex items-center justify-center text-white font-extrabold text-6xl shadow-2xl shrink-0">?</div>
                        <div>
                            <h3 className="text-5xl font-extrabold text-gray-900 uppercase tracking-tighter leading-none mb-3">Strategic Inquiry</h3>
                            <p className="text-blue-600 font-bold text-[12px] uppercase tracking-[0.5em]">Field Challenge for Decision Makers</p>
                        </div>
                    </div>
                    
                    <p className="text-4xl md:text-5xl text-gray-900 mb-20 font-extrabold leading-[1.05] tracking-tighter uppercase relative z-10">
                        {result.lessonInteraction.question}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20 relative z-10">
                        {result.lessonInteraction.choices.map((choice) => (
                            <button
                                key={choice}
                                onClick={() => setSelectedChoice(choice)}
                                className={`p-10 rounded-none text-xl font-bold transition-all border-2 text-left flex flex-col justify-between h-full group ${
                                    selectedChoice === choice 
                                    ? 'bg-gray-900 border-gray-900 text-white shadow-2xl scale-[1.03]' 
                                    : 'bg-white border-gray-100 text-gray-900 hover:border-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                <span className={`text-[10px] uppercase tracking-[0.3em] mb-8 ${selectedChoice === choice ? 'text-gray-400' : 'text-gray-300 group-hover:text-gray-500'}`}>Selection_Node</span>
                                {choice}
                            </button>
                        ))}
                    </div>

                    {selectedChoice && (
                        <div className="animate-slide-up bg-blue-600 p-12 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <svg className="w-40 h-40 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3L21.017 3V15C21.017 18.3137 18.3307 21 15.017 21H14.017ZM3.017 21L3.017 18C3.017 16.8954 3.91243 16 5.017 16H8.017C8.56928 16 9.017 15.5523 9.017 15V9C9.017 8.44772 8.56928 8 8.017 8H5.017C3.91243 8 3.017 7.10457 3.017 6V3L10.017 3V15C10.017 18.3137 7.33072 21 4.017 21H3.017Z" /></svg>
                            </div>
                            <p className="text-[11px] font-bold text-white/70 uppercase tracking-[0.5em] mb-8">Strategic Analysis Feedback</p>
                            <p className="text-white font-serif italic leading-tight text-4xl relative z-10 font-medium">
                                &ldquo;{result.lessonInteraction.feedback[selectedChoice]}&rdquo;
                            </p>
                        </div>
                    )}
                </div>

                {/* Technical Footer Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 border-t border-gray-200 pt-16 relative z-10">
                    <div className="space-y-3">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Document Scale</p>
                        <div className="flex items-end space-x-1.5">
                            <div className="w-10 h-5 bg-gray-900"></div>
                            <div className="w-10 h-5 border border-gray-300"></div>
                            <div className="w-10 h-5 bg-gray-900"></div>
                            <span className="text-sm font-bold text-gray-900 ml-3">1:2500</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Orientation</p>
                        <div className="flex items-center space-x-3">
                            <svg className="w-8 h-8 text-gray-900 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                            <span className="text-sm font-bold text-gray-900 uppercase tracking-widest">North Point</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Sheet Number</p>
                        <p className="text-2xl font-extrabold text-gray-900 uppercase tracking-tighter">DU-STRAT-001</p>
                    </div>
                    <div className="space-y-3 text-right">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Approval Stamp</p>
                        <div className="inline-block border-2 border-blue-600 text-blue-600 px-5 py-2 text-[11px] font-black uppercase tracking-[0.3em] rotate-[-3deg] shadow-lg">
                            Verified by Tanmya
                        </div>
                    </div>
                </div>

                {/* Teacher Closing */}
                <div className="mt-24 text-center max-w-4xl mx-auto relative z-10">
                    <p className="text-3xl text-gray-400 font-serif italic mb-8 leading-relaxed font-medium">
                        &ldquo;{result.teacherPersona.closing}&rdquo;
                    </p>
                    <div className="w-24 h-px bg-gray-200 mx-auto"></div>
                </div>
            </div>

            {/* Interactive Refinement Section */}
            <div className="mt-16 bg-white border-2 border-gray-900 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-bl-full"></div>
                <div className="max-w-2xl mx-auto text-center mb-10 relative z-10">
                    <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter uppercase">Consult the Professor</h3>
                    <p className="text-gray-600 text-lg">
                        Deepen your understanding or pivot the analysis. Your mentor is ready for further inquiry.
                    </p>
                </div>
                
                <div className="relative max-w-3xl mx-auto z-10">
                    <textarea
                        value={refinementRequest}
                        onChange={(e) => setRefinementRequest(e.target.value)}
                        placeholder="Ask for clarification, more data, or a different perspective..."
                        rows={3}
                        className="w-full bg-gray-50 border-2 border-gray-200 rounded-[2rem] py-6 px-8 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 transition duration-300 resize-none pr-32 text-lg font-medium"
                        disabled={isRefining}
                    />
                    <button
                        onClick={handleRefine}
                        disabled={isRefining || !refinementRequest.trim()}
                        className="absolute right-4 bottom-4 bg-gray-900 hover:bg-blue-600 text-white font-black py-3 px-8 rounded-2xl transition-all disabled:bg-gray-200 disabled:text-gray-400 shadow-xl"
                    >
                        {isRefining ? 'CONSULTING...' : 'CONSULT'}
                    </button>
                </div>
                <div className="flex items-center justify-center space-x-3 mt-6">
                    <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Consultation Fee: 5 Credits</span>
                </div>
            </div>
        </div>
    );

    return (
        <GeneratorShell
            title="Deep Understanding"
            description="Interactive Thinking Board guided by an AI Urban Planning Professor."
            isLoading={isLoading || loading}
            error={error}
            result={data}
            onUpdateResult={(updated) => setData(updated)}
            userEmail={user?.email || null}
            onLogin={signInWithGoogle}
            onUpgrade={onUpgrade}
            renderInputForm={renderInputForm}
            renderExportControls={() => (
                <button
                    onClick={exportBoard}
                    disabled={isExporting}
                    className="bg-gray-700/80 text-gray-200 font-semibold py-1 px-4 rounded-full text-xs hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50 flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    {isExporting ? 'Exporting...' : 'Export PDF'}
                </button>
            )}
            renderResult={renderResult}
        />
    );
};

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
        if (topic.trim()) {
            onSubmit(topic, context);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Strategic Topic</label>
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Transit-Oriented Development in Riyadh"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition duration-300"
                    required
                />
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Context & Objectives (Optional)</label>
                <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Provide specific details, constraints, or goals..."
                    rows={4}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition duration-300 resize-none"
                />
            </div>
            
            <div className="pt-4">
                {userEmail ? (
                    <button
                        type="submit"
                        disabled={isLoading || credits < 10}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                    >
                        {isLoading ? 'Generating Strategy Board...' : credits < 10 ? 'Insufficient Credits (10 Required)' : 'Generate Strategy Board'}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onLogin}
                        className="w-full bg-white text-gray-900 font-bold py-4 px-6 rounded-xl hover:bg-gray-100 transition duration-300 flex items-center justify-center space-x-3 shadow-lg"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Sign in with Google to Generate</span>
                    </button>
                )}
                <p className="text-center text-xs text-gray-500 mt-4 uppercase tracking-widest">Generation Cost: 10 Credits</p>
            </div>
        </form>
    );
};

export default UrbanDeepUnderstandingGenerator;
