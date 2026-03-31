
import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { generateDeepUnderstanding, refineDeepUnderstanding } from '@/services/geminiService';
import type { UrbanDeepUnderstanding, BrandingInfo } from '@/types';
import GeneratorShell from './GeneratorShell';
import UrbanDeepUnderstandingInputForm from './UrbanDeepUnderstandingInputForm';
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
            const dataUrl = await toPng(boardRef.current, { quality: 0.95, backgroundColor: '#0a0a0a' });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, imgHeight);
            pdf.save(`Thinking-Board-${data?.topic.replace(/\s+/g, '-')}.pdf`);
        } catch (err) {
            console.error('Export failed', err);
        } finally {
            setIsExporting(false);
        }
    };

    const getCategoryStyles = (category: UrbanDeepUnderstanding['stickyNotes'][0]['category']) => {
        switch (category) {
            case 'Core Concept': return 'bg-yellow-200 text-yellow-900 border-yellow-300 rotate-1';
            case 'Data Insight': return 'bg-blue-200 text-blue-900 border-blue-300 -rotate-1';
            case 'Case Study': return 'bg-green-200 text-green-900 border-green-300 rotate-2';
            case 'Strategic Move': return 'bg-purple-200 text-purple-900 border-purple-300 -rotate-2';
            case 'Critical Risk': return 'bg-red-200 text-red-900 border-red-300 rotate-1';
            default: return 'bg-gray-200 text-gray-900 border-gray-300';
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
            <div ref={boardRef} className="p-8 md:p-12 rounded-[3rem] bg-[#0a0a0a] border border-white/5 shadow-2xl">
                {/* Tanmyaa Branding Header */}
                <div className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-blue-600/20">T</div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tight">TANMYAA</h1>
                            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Deep Understanding Module</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-400 font-medium">Strategic Urban Planning</p>
                        <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Teacher Intro */}
                <div className="max-w-3xl mx-auto mb-16 text-center">
                    <div className="inline-flex items-center space-x-3 bg-blue-600/20 px-4 py-2 rounded-full mb-6 border border-blue-500/30">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">Professor&apos;s Insight</span>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-6 tracking-tighter">{result.topic}</h2>
                    <p className="text-xl text-gray-300 leading-relaxed font-serif italic">
                        &ldquo;{result.teacherPersona.intro}&rdquo;
                    </p>
                </div>

                {/* Thinking Board Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    {result.stickyNotes.map((note) => (
                        <div 
                            key={note.id}
                            className={`p-6 shadow-xl border-t-4 transition-transform hover:scale-105 hover:z-10 ${getCategoryStyles(note.category)}`}
                            style={{ minHeight: '200px' }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{note.category}</span>
                                <div className="flex space-x-1 flex-wrap justify-end gap-y-1">
                                    {note.tags.map((tag, i) => (
                                        <span key={i} className="text-[9px] font-bold px-1.5 py-0.5 bg-black/10 rounded">#{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <h3 className="text-xl font-black mb-3 leading-tight uppercase">{note.title}</h3>
                            <p className="text-base font-medium leading-relaxed opacity-90">{note.content}</p>
                        </div>
                    ))}
                </div>

                {/* Interactive Lesson */}
                <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-[2rem] p-8 md:p-12">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/20">?</div>
                        <h3 className="text-2xl font-bold text-white">Professor&apos;s Question</h3>
                    </div>
                    
                    <p className="text-xl text-gray-200 mb-8 font-medium">{result.lessonInteraction.question}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {result.lessonInteraction.choices.map((choice) => (
                            <button
                                key={choice}
                                onClick={() => setSelectedChoice(choice)}
                                className={`p-4 rounded-2xl text-sm font-bold transition-all border-2 ${
                                    selectedChoice === choice 
                                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/40 scale-[1.02]' 
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/10'
                                }`}
                            >
                                {choice}
                            </button>
                        ))}
                    </div>

                    {selectedChoice && (
                        <div className="animate-slide-up bg-blue-600/10 border border-blue-500/30 p-6 rounded-2xl">
                            <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Professor&apos;s Feedback</p>
                            <p className="text-blue-100 italic leading-relaxed text-lg">
                                {result.lessonInteraction.feedback[selectedChoice]}
                            </p>
                        </div>
                    )}
                </div>

                {/* Teacher Closing */}
                <div className="mt-16 pt-16 border-t border-white/5 text-center max-w-2xl mx-auto">
                    <p className="text-xl text-gray-400 font-serif italic mb-4">
                        &ldquo;{result.teacherPersona.closing}&rdquo;
                    </p>
                    <div className="h-px w-12 bg-blue-600/50 mx-auto"></div>
                </div>
            </div>

            {/* Interactive Refinement Section */}
            <div className="mt-16 bg-gray-900/70 border border-gray-700/50 rounded-[3rem] p-8 md:p-12 shadow-2xl">
                <div className="max-w-2xl mx-auto text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Ask the Professor</h3>
                    <p className="text-gray-400">
                        Need more detail on a specific note? Or want to explore a new angle? Ask your question below.
                    </p>
                </div>
                
                <div className="relative max-w-3xl mx-auto">
                    <textarea
                        value={refinementRequest}
                        onChange={(e) => setRefinementRequest(e.target.value)}
                        placeholder="e.g., Can you explain the 'Critical Risk' note in more detail? Or add a note about sustainable financing..."
                        rows={3}
                        className="w-full bg-black/40 border border-gray-800 rounded-3xl py-4 px-6 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition duration-200 resize-none pr-32"
                        disabled={isRefining}
                    />
                    <button
                        onClick={handleRefine}
                        disabled={isRefining || !refinementRequest.trim()}
                        className="absolute right-3 bottom-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-2xl transition-all disabled:bg-gray-800 disabled:text-gray-500"
                    >
                        {isRefining ? 'Asking...' : 'Ask'}
                    </button>
                </div>
                <p className="text-center text-[10px] text-gray-600 mt-4 uppercase tracking-[0.2em]">Refinement costs 5 credits</p>
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

export default UrbanDeepUnderstandingGenerator;
