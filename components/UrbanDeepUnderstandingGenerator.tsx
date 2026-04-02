
import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { generateDeepUnderstanding, refineDeepUnderstanding } from '@/services/geminiService';
import type { UrbanDeepUnderstanding, BrandingInfo } from '@/types';
import GeneratorShell from './GeneratorShell';
import { TanmyaaLogo } from './TanmyaaLogo';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import KnowledgeBaseSelector from './KnowledgeBaseSelector';
import { supabase } from '@/lib/supabase';

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
    const [selectedKBFileIds, setSelectedKBFileIds] = useState<string[]>([]);
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

            // Fetch selected KB files
            let kbFiles: { name: string; content: string }[] = [];
            if (selectedKBFileIds.length > 0) {
                const { data: filesData, error: filesError } = await supabase
                    .from('knowledge_base')
                    .select('name, content')
                    .in('id', selectedKBFileIds);
                
                if (filesError) throw filesError;
                kbFiles = filesData || [];
            }

            const result = await generateDeepUnderstanding(topic, context, kbFiles, companyProfile, profile?.plan, branding);
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
            selectedKBFileIds={selectedKBFileIds}
            setSelectedKBFileIds={setSelectedKBFileIds}
        />
    );

    const renderResult = (result: UrbanDeepUnderstanding) => (
        <div className="space-y-12 animate-fade-in">
            <div 
                ref={boardRef} 
                className="p-8 md:p-16 rounded-3xl bg-white border border-gray-100 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden"
            >
                {/* Subtle Identity Pattern */}
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03] pointer-events-none" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 relative z-10 border-b border-gray-50 pb-10">
                    <div className="flex items-center gap-6 mb-6 md:mb-0">
                        <div className="w-16 h-16 bg-[#1B3C53] rounded-2xl flex items-center justify-center shadow-lg shadow-[#1B3C53]/20">
                            <TanmyaaLogo className="text-white scale-125" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.3em]">Strategic Intelligence</span>
                            </div>
                            <h1 className="text-3xl font-black text-[#1B3C53] tracking-tight uppercase">Deep Understanding</h1>
                        </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end font-sans">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Session Reference</span>
                        <span className="text-sm font-bold text-[#1B3C53] bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                            {result.topic.substring(0, 15).toUpperCase().replace(/\s+/g, '_')}_{new Date().getTime().toString().slice(-6)}
                        </span>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-5xl mx-auto mb-20 relative z-10">
                    <div className="mb-12">
                        <h2 className="text-5xl md:text-7xl font-black text-[#1B3C53] mb-8 tracking-tighter leading-[0.9] uppercase max-w-4xl">
                            {result.topic}
                        </h2>
                        
                        <div className="relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
                            <div className="pl-10 py-2">
                                <p className="text-2xl md:text-3xl text-gray-600 leading-relaxed font-medium italic font-serif">
                                    &ldquo;{result.teacherPersona.intro}&rdquo;
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Strategic Nodes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20 relative z-10">
                    {result.stickyNotes.map((note, idx) => (
                        <div 
                            key={note.id}
                            className="group relative p-8 bg-white border border-gray-100 rounded-[2rem] transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] hover:-translate-y-1 flex flex-col"
                            style={{ minHeight: '340px' }}
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white ${getCategoryAccent(note.category)}`}>
                                    {note.category}
                                </div>
                                <span className="text-[10px] font-mono text-gray-300 font-bold">NODE_{String(idx + 1).padStart(2, '0')}</span>
                            </div>
                            
                            <h3 className="text-2xl font-bold mb-4 text-[#1B3C53] leading-tight tracking-tight group-hover:text-blue-600 transition-colors">
                                {note.title}
                            </h3>
                            
                            <p className="text-base text-gray-500 leading-relaxed mb-8 flex-grow font-medium">
                                {note.content}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 mt-auto">
                                {note.tags.map((tag, i) => (
                                    <span key={i} className="text-[9px] font-bold px-3 py-1 bg-gray-50 text-gray-400 rounded-lg uppercase tracking-wider border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-all">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Interactive Inquiry Section */}
                <div className="max-w-5xl mx-auto bg-[#1B3C53] rounded-[3rem] p-10 md:p-16 shadow-2xl relative z-10 mb-20 overflow-hidden text-white">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 -mr-32 -mt-32 rounded-full blur-3xl"></div>
                    
                    <div className="flex items-center gap-6 mb-12">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl font-black">?</div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tight">Strategic Inquiry</h3>
                            <p className="text-blue-300 text-[10px] font-bold uppercase tracking-[0.3em]">Decision Maker Challenge</p>
                        </div>
                    </div>
                    
                    <p className="text-3xl md:text-4xl font-bold mb-12 leading-tight tracking-tight uppercase">
                        {result.lessonInteraction.question}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                        {result.lessonInteraction.choices.map((choice) => (
                            <button
                                key={choice}
                                onClick={() => setSelectedChoice(choice)}
                                className={`p-6 rounded-2xl text-sm font-bold transition-all border-2 text-left flex flex-col justify-between h-full group ${
                                    selectedChoice === choice 
                                    ? 'bg-white border-white text-[#1B3C53] shadow-xl scale-[1.02]' 
                                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                                }`}
                            >
                                <span className={`text-[8px] uppercase tracking-widest mb-4 ${selectedChoice === choice ? 'text-blue-600' : 'text-white/40'}`}>Option_Node</span>
                                {choice}
                            </button>
                        ))}
                    </div>

                    {selectedChoice && (
                        <div className="animate-slide-up bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Analysis Feedback</span>
                            </div>
                            <p className="text-xl font-medium italic font-serif leading-relaxed">
                                &ldquo;{result.lessonInteraction.feedback[selectedChoice]}&rdquo;
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-gray-100 relative z-10">
                    <div className="flex items-center gap-12">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</span>
                            <span className="text-xs font-bold text-green-600 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                VERIFIED_STRATEGY
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Authority</span>
                            <span className="text-xs font-bold text-[#1B3C53]">TANMYA_INTEL_UNIT</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Generated On</p>
                            <p className="text-xs font-bold text-[#1B3C53]">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</p>
                        </div>
                        <div className="h-10 w-px bg-gray-100 mx-2 hidden md:block"></div>
                        <div className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl">
                            <span className="text-[10px] font-black text-[#1B3C53] tracking-tighter">T. STRATEGIC BOARD</span>
                        </div>
                    </div>
                </div>

                {/* Closing Statement */}
                <div className="mt-16 text-center max-w-3xl mx-auto relative z-10">
                    <p className="text-xl text-gray-400 font-serif italic leading-relaxed font-medium">
                        &ldquo;{result.teacherPersona.closing}&rdquo;
                    </p>
                </div>
            </div>

            {/* Refinement Section */}
            <div className="mt-16 bg-[#F8F9FA] border border-gray-100 rounded-[3rem] p-8 md:p-12 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-bl-full"></div>
                <div className="max-w-2xl mx-auto text-center mb-10 relative z-10">
                    <h3 className="text-2xl font-black text-[#1B3C53] mb-3 tracking-tight uppercase">Consult the Strategist</h3>
                    <p className="text-gray-500 text-base font-medium">
                        Deepen your understanding or pivot the analysis. Your mentor is ready for further inquiry.
                    </p>
                </div>
                
                <div className="relative max-w-3xl mx-auto z-10">
                    <textarea
                        value={refinementRequest}
                        onChange={(e) => setRefinementRequest(e.target.value)}
                        placeholder="Ask for clarification, more data, or a different perspective..."
                        rows={3}
                        className="w-full bg-white border border-gray-200 rounded-[2rem] py-6 px-8 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition duration-300 resize-none pr-32 text-lg font-medium shadow-sm"
                        disabled={isRefining}
                    />
                    <button
                        onClick={handleRefine}
                        disabled={isRefining || !refinementRequest.trim()}
                        className="absolute right-4 bottom-4 bg-[#1B3C53] hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-2xl transition-all disabled:bg-gray-200 disabled:text-gray-400 shadow-lg"
                    >
                        {isRefining ? 'CONSULTING...' : 'CONSULT'}
                    </button>
                </div>
                <div className="flex items-center justify-center space-x-3 mt-6">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">Consultation Fee: 5 Credits</span>
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
    selectedKBFileIds: string[];
    setSelectedKBFileIds: (ids: string[]) => void;
}

const UrbanDeepUnderstandingInputForm: React.FC<InputFormProps> = ({ 
    onSubmit, 
    isLoading, 
    credits, 
    userEmail, 
    onLogin,
    selectedKBFileIds,
    setSelectedKBFileIds
}) => {
    const [topic, setTopic] = useState('');
    const [context, setContext] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (topic.trim()) {
            onSubmit(topic, context);
        }
    };

    const toggleKBFile = (id: string) => {
        setSelectedKBFileIds(
            selectedKBFileIds.includes(id)
                ? selectedKBFileIds.filter(fid => fid !== id)
                : [...selectedKBFileIds, id]
        );
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

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Knowledge Base Sources</label>
                <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
                    <KnowledgeBaseSelector 
                        selectedFileIds={selectedKBFileIds}
                        onToggleFile={toggleKBFile}
                    />
                </div>
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
