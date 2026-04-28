import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { generateDeepUnderstanding, refineDeepUnderstanding } from '@/services/geminiService';
import type { UrbanDeepUnderstanding, BrandingInfo } from '@/types';
import GeneratorShell from './GeneratorShell';
import { TanmyaaLogo } from './TanmyaaLogo';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { exportDeepUnderstandingToDocx } from '@/services/docxGenerator';
import UrbanDeepUnderstandingInputForm from './UrbanDeepUnderstandingInputForm';

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
    const [isExportingDocx, setIsExportingDocx] = useState(false);
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const boardRef = useRef<HTMLDivElement>(null);

    const handleGenerate = async (topic: string, context: string) => {
        setIsLoading(true);
        setError(null);
        setSelectedChoice(null);
        try {
            const branding: BrandingInfo | undefined = profile ? {
                logo: profile.branding_logo || '',
                colors: profile.branding_colors || '',
                presentation_template: profile.branding_presentation_template || '',
                presentation_template_url: profile.branding_presentation_template_url || '',
                report_template: profile.branding_report_template || '',
                report_template_url: profile.branding_report_template_url || ''
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
            const branding: BrandingInfo | undefined = profile ? {
                logo: profile.branding_logo || '',
                colors: profile.branding_colors || '',
                presentation_template: profile.branding_presentation_template || '',
                presentation_template_url: profile.branding_presentation_template_url || '',
                report_template: profile.branding_report_template || '',
                report_template_url: profile.branding_report_template_url || ''
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

    const handleExportDocx = async () => {
        if (!data) return;
        setIsExportingDocx(true);
        try {
            await exportDeepUnderstandingToDocx(data, profile?.branding_logo || null);
        } catch (error) {
            console.error('Failed to export to Word:', error);
            setError('Could not export to Word. Please try again.');
        } finally {
            setIsExportingDocx(false);
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
        <div className="space-y-12 animate-fade-in font-sans">
            <div 
                ref={boardRef} 
                className="p-8 md:p-16 rounded-3xl bg-white border border-gray-200 shadow-xl relative overflow-hidden"
            >
                {/* Subtle Branding Accents */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 -mr-48 -mt-48 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-50/50 -ml-48 -mb-48 rounded-full blur-3xl"></div>

                {/* Tanmyaa Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 pb-8 border-b border-gray-100 relative z-10">
                    <div className="flex items-center space-x-6 mb-6 md:mb-0">
                        <div className="bg-gray-900 p-4 rounded-xl shadow-lg">
                            <TanmyaaLogo className="scale-[1.2] text-white" />
                        </div>
                        <div className="h-12 w-px bg-gray-200 hidden md:block"></div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">Urban Deep Understanding</h1>
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em] mt-1 font-sans">Strategic Intelligence Series</p>
                        </div>
                    </div>
                    <div className="text-left md:text-right font-sans">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Document ID: {result.topic.substring(0, 8).toUpperCase()}-{Math.floor(Math.random() * 1000)}</p>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</p>
                    </div>
                </div>

                {/* Main Subject & Intro */}
                <div className="max-w-4xl mx-auto mb-20 relative z-10">
                    <div className="mb-12">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-full mb-4 font-sans">Subject Architecture</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight leading-tight font-sans uppercase">
                            {result.topic}
                        </h2>
                        <div className="w-20 h-1 bg-gray-900 rounded-full"></div>
                    </div>
                    
                    <div className="relative pl-8 md:pl-12 border-l-4 border-blue-500 py-2">
                        <p className="text-2xl md:text-3xl text-gray-700 leading-relaxed font-serif italic">
                            &ldquo;{result.teacherPersona.intro}&rdquo;
                        </p>
                        <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest font-sans">— Strategic Perspective</p>
                    </div>
                </div>

                {/* Analysis Grid */}
                <div className="mb-24 relative z-10">
                    <div className="flex items-center space-x-4 mb-8">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-[0.3em] font-sans">Structural Analysis Nodes</h3>
                        <div className="h-px bg-gray-100 flex-grow"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {result.stickyNotes.map((note, idx) => (
                            <div 
                                key={note.id}
                                className="group bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex flex-col">
                                        <div className={`h-1 w-10 mb-2 ${getCategoryAccent(note.category)} rounded-full`}></div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{note.category}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-300">0{idx + 1}</span>
                                </div>
                                
                                <h4 className="text-xl font-bold text-gray-900 mb-4 leading-tight font-sans">
                                    {note.title}
                                </h4>
                                
                                <p className="text-gray-600 text-[15px] leading-relaxed mb-6 flex-grow font-sans">
                                    {note.content}
                                </p>
                                
                                <div className="flex flex-wrap gap-2 mt-auto">
                                    {note.tags.map((tag, i) => (
                                        <span key={i} className="text-[9px] font-bold px-2 py-1 bg-gray-50 text-gray-500 rounded uppercase tracking-wider border border-gray-100 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Strategic Challenge Interaction */}
                <div className="max-w-4xl mx-auto ios-card p-8 md:p-12 mb-20 relative z-10 border-blue-50 shadow-blue-900/[0.02]">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-bold">?</div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 font-sans tracking-tight">Strategic Inquiry</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-sans">Field Challenge</p>
                        </div>
                    </div>
                    
                    <p className="text-2xl font-bold text-gray-900 mb-10 leading-tight font-sans">
                        {result.lessonInteraction.question}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 relative z-10">
                        {result.lessonInteraction.choices.map((choice) => (
                            <button
                                key={choice}
                                onClick={() => setSelectedChoice(choice)}
                                className={`p-6 rounded-2xl text-sm font-bold transition-all border text-left flex flex-col justify-between min-h-[140px] font-sans ${
                                    selectedChoice === choice 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                                    : 'bg-white border-gray-100 text-gray-900 hover:border-gray-200 hover:bg-gray-50 shadow-sm'
                                }`}
                            >
                                <span className={`text-[9px] uppercase tracking-widest mb-4 ${selectedChoice === choice ? 'text-white/60' : 'text-gray-400'}`}>Decision Option</span>
                                {choice}
                            </button>
                        ))}
                    </div>

                    {selectedChoice && (
                        <div className="animate-slide-up bg-gray-900 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3L21.017 3V15C21.017 18.3137 18.3307 21 15.017 21H14.017ZM3.017 21L3.017 18C3.017 16.8954 3.91243 16 5.017 16H8.017C8.56928 16 9.017 15.5523 9.017 15V9C9.017 8.44772 8.56928 8 8.017 8H5.017C3.91243 8 3.017 7.10457 3.017 6V3L10.017 3V15C10.017 18.3137 7.33072 21 4.017 21H3.017Z" /></svg>
                            </div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 font-sans">Strategic Analysis Feedback</p>
                            <p className="text-white font-serif italic leading-relaxed text-xl font-medium">
                                &ldquo;{result.lessonInteraction.feedback[selectedChoice]}&rdquo;
                            </p>
                        </div>
                    )}
                </div>

                {/* Closing Perspective */}
                <div className="text-center max-w-3xl mx-auto mb-16 relative z-10 border-t border-gray-100 pt-16">
                    <p className="text-xl text-gray-500 font-serif italic mb-8 leading-relaxed font-medium">
                        &ldquo;{result.teacherPersona.closing}&rdquo;
                    </p>
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-0.5 bg-blue-600 rounded-full mb-4"></div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-sans">Academic & Strategic Conclusion</p>
                    </div>
                </div>

                {/* Brief Footer */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-gray-100 pt-12 relative z-10">
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Doc Reference</p>
                        <p className="text-xs font-bold text-gray-900 font-sans uppercase">TANMYA-UDU-V2.1</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Confidentiality</p>
                        <p className="text-xs font-bold text-gray-900 font-sans uppercase">Level 1 Restricted</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Security Pin</p>
                        <p className="text-xs font-bold text-blue-600 font-sans uppercase tracking-widest">X9-22-J04</p>
                    </div>
                    <div className="text-right flex flex-col items-end justify-center">
                         <div className="border border-blue-600 text-blue-600 px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded">
                            Verified Analysis
                        </div>
                    </div>
                </div>
            </div>

            {/* Consulting Bar */}
            <div className="ios-card p-6 md:p-8 relative overflow-hidden font-sans border-gray-200">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="text-center md:text-left shrink-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">Consulting Support</h3>
                        <p className="text-xs text-gray-500">Refine this analysis or pivot the perspective.</p>
                    </div>
                    
                    <div className="relative flex-grow w-full">
                        <textarea
                            value={refinementRequest}
                            onChange={(e) => setRefinementRequest(e.target.value)}
                            placeholder="Ask for clarification or deeper insights..."
                            rows={1}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-6 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition duration-300 resize-none pr-28 text-sm font-medium font-sans"
                            disabled={isRefining}
                        />
                        <button
                            onClick={handleRefine}
                            disabled={isRefining || !refinementRequest.trim()}
                            className="absolute right-2 top-1.5 bg-gray-900 hover:bg-blue-600 text-white font-bold py-1.5 px-5 rounded-xl transition-all disabled:opacity-50 text-xs shadow-md font-sans"
                        >
                            {isRefining ? '...' : 'CONSULT'}
                        </button>
                    </div>
                    
                    <div className="shrink-0">
                         <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Cost: 5 IU</span>
                    </div>
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
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleExportDocx}
                        disabled={isExportingDocx}
                        className="bg-gray-700/80 text-gray-200 font-semibold py-1 px-4 rounded-full text-xs hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50 flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        {isExportingDocx ? 'Exporting Word...' : 'Word'}
                    </button>
                    <button
                        onClick={exportBoard}
                        disabled={isExporting}
                        className="bg-gray-700/80 text-gray-200 font-semibold py-1 px-4 rounded-full text-xs hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50 flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        {isExporting ? 'Exporting PDF...' : 'PDF'}
                    </button>
                </div>
            )}
            renderResult={renderResult}
        />
    );
};

export default UrbanDeepUnderstandingGenerator;
