
import React, { useState, useCallback, useEffect } from 'react';
import { generateRFP, getRFPSuggestions } from '@/services/geminiService';
import { exportRFPToDocx } from '@/services/docxGenerator';
import { useBranding } from '@/hooks/useBranding';
import type { RFPContent, BrandingInfo } from '@/types';
import FileUpload from './FileUpload';
import GeneratorShell from './GeneratorShell';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { useAuth } from '@/context/AuthContext';
import { TanmyaaLogoPPTX } from './TanmyaaLogo';
import AISuggestionButton from './AISuggestionButton';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

const Section: React.FC<{ number: number; title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ number, title, icon, children }) => (
  <section className="mb-10">
    <div className="flex items-center mb-5">
      <div className="w-10 h-10 flex-shrink-0 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center mr-4">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600">Section {number}</h2>
        <p className="text-2xl font-bold text-gray-800">{title}</p>
      </div>
    </div>
    <div className="pl-14 ml-5 border-l-2 border-gray-200">
        <div className="pl-6 text-gray-700 leading-relaxed space-y-4">{children}</div>
    </div>
  </section>
);

const SectionIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

const RFPReportDisplay: React.FC<{ content: RFPContent; reportRef?: React.RefObject<HTMLDivElement | null> }> = ({ content, reportRef }) => {
    return (
        <div ref={reportRef} className="bg-white p-8 md:p-12 rounded-lg shadow-2xl border border-gray-200 text-gray-800">
            <header className="text-center mb-16 border-b border-gray-100 pb-12">
                 <div className="flex justify-center items-center mb-6"><TanmyaaLogoPPTX /></div>
                 <p className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-4">Institutional Grade Report</p>
                 <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-2 max-w-4xl mx-auto leading-tight">{content.title}</h1>
                 <div className="mt-8 flex justify-center gap-8 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                    <span>Draft Version 1.0</span>
                    <span>•</span>
                    <span>{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
                 </div>
            </header>

            <div className="max-w-4xl mx-auto space-y-16">
                {/* 1. Executive Summary */}
                <Section number={1} title="Executive Summary" icon={<SectionIcon />}>
                    <p className="text-lg leading-relaxed text-gray-600 italic font-medium border-l-4 border-blue-500 pl-6 py-2">
                        {content.executiveSummary}
                    </p>
                    <div className="mt-8">
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Key Objectives</h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {content.objectives.map((obj, i) => (
                                <li key={i} className="flex items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <span className="w-6 h-6 flex-shrink-0 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-[10px] font-black mr-3 mt-0.5">{i + 1}</span>
                                    <span className="text-sm text-gray-700 leading-snug">{obj}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Section>

                {/* 2. Scope of Work */}
                <Section number={2} title="Technical Scope of Work" icon={<SectionIcon />}>
                    <p className="mb-8 text-gray-600">{content.scopeOfWork.intro}</p>
                    <div className="space-y-10">
                        {content.scopeOfWork.phases.map((phase, i) => (
                            <div key={i} className="relative group">
                                <div className="flex items-baseline gap-3 mb-4">
                                    <span className="text-lg font-black text-blue-600/30 group-hover:text-blue-600 transition-colors uppercase tracking-tighter">Phase {i + 1}</span>
                                    <h3 className="text-xl font-bold text-gray-900">{phase.title}</h3>
                                </div>
                                <p className="text-sm text-gray-500 mb-5 pl-4 border-l border-gray-100 italic">{phase.description}</p>
                                <ul className="space-y-4 pl-4">
                                    {phase.tasks.map((task, ti) => (
                                        <li key={ti} className="flex items-start text-sm text-gray-700 leading-relaxed">
                                            <span className="text-blue-500 mr-3 mt-1.5">•</span>
                                            <span>{task}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* 3. Timeframe */}
                <Section number={3} title="Project Timeline & Deliverables" icon={<SectionIcon />}>
                    <div className="mb-6 flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Total Project Duration</span>
                        <span className="text-lg font-black text-blue-900">{content.timeframe.totalDuration}</span>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Weeks</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Activity</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Key Deliverable</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {content.timeframe.milestones.map((m, i) => (
                                    <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-blue-600 whitespace-nowrap">{m.weeks}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700 font-medium">{m.activity}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 italic">{m.deliverable}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>

                {/* 4. Evaluation Criteria */}
                <Section number={4} title="Evaluation Framework" icon={<SectionIcon />}>
                    <p className="mb-8 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg inline-block font-medium">Evaluation Methodology: <span className="text-blue-600">{content.evaluationCriteria.method}</span></p>
                    <div className="space-y-4">
                        {content.evaluationCriteria.criteria.map((c, i) => (
                            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-blue-200 transition-all group">
                                <div className="flex-grow pr-8">
                                    <h4 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{c.label}</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">{c.description}</p>
                                </div>
                                <div className="mt-4 md:mt-0 flex-shrink-0 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-black text-lg">
                                    {c.weight}
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* 5. Technical Requirements */}
                <Section number={5} title="Submission & Compliance" icon={<SectionIcon />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Technical Standards</h4>
                            <ul className="space-y-4">
                                {content.technicalRequirements.map((req, i) => (
                                    <li key={i} className="flex items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-3 flex-shrink-0" />
                                        <span className="text-sm text-gray-700">{req}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Submission Details</h4>
                            <ul className="space-y-4">
                                {content.submissionInstructions.map((ins, i) => (
                                    <li key={i} className="flex items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 mr-3 flex-shrink-0" />
                                        <span className="text-sm text-gray-600 italic">{ins}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Section>
            </div>
            
            <footer className="mt-20 pt-12 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-medium">&copy; {new Date().getFullYear()} TANMYAA Urban Planning Consultancy. All technical rights reserved. Proprietary Methodology.</p>
            </footer>
        </div>
    );
};


interface RFPGeneratorProps {
  onUpgrade: () => void;
}

const RFPGenerator: React.FC<RFPGeneratorProps> = ({ onUpgrade }) => {
  const [taskDescription, setTaskDescription] = useState<string>(() => localStorage.getItem('rfp_task_description') || '');
  const [detailLevel, setDetailLevel] = useState<string>(() => localStorage.getItem('rfp_detail_level') || 'Standard');
  const [consultantBackground, setConsultantBackground] = useState<string>(() => localStorage.getItem('rfp_consultant_background') || 'International');

  useEffect(() => {
    localStorage.setItem('rfp_task_description', taskDescription);
  }, [taskDescription]);

  useEffect(() => {
    localStorage.setItem('rfp_detail_level', detailLevel);
  }, [detailLevel]);

  useEffect(() => {
    localStorage.setItem('rfp_consultant_background', consultantBackground);
  }, [consultantBackground]);

  const [files, setFiles] = useState<File[]>([]);
  const [generatedContent, setGeneratedContent] = useState<RFPContent | null>(null);
  const { logo } = useBranding();
  const { companyProfile } = useCompanyProfile();
  const { refreshProfile, profile, user, signInWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportRef = React.useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  const handleGetSuggestions = async () => {
    setIsSuggestionsLoading(true);
    try {
      const results = await getRFPSuggestions();
      setSuggestions(results);
    } catch (err) {
      console.error("Failed to get suggestions:", err);
    } finally {
      setIsSuggestionsLoading(false);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (profile && profile.credits < 10) {
      setError("Insufficient credits. Please upgrade your plan.");
      onUpgrade();
      return;
    }

    if (!taskDescription.trim()) {
      setError('Please provide a task description.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    
    try {
        const branding: BrandingInfo | undefined = profile?.branding_logo || profile?.branding_colors || profile?.branding_template ? {
            logo: profile.branding_logo,
            colors: profile.branding_colors,
            template: profile.branding_template
        } : undefined;

        const result = await generateRFP(taskDescription, detailLevel, consultantBackground, files, companyProfile, profile?.plan, branding);
        await refreshProfile();
        if (result) {
            setGeneratedContent(result);
        }
    } catch (err: unknown) {
        console.error("RFP generation failed:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred during RFP generation.");
    } finally {
        setIsLoading(false);
    }
  }, [taskDescription, detailLevel, consultantBackground, files, companyProfile, profile, refreshProfile, onUpgrade]);
  
  const handleDownload = () => {
    if (generatedContent) {
        exportRFPToDocx(generatedContent, logo);
    }
  };

  const handleExportPdf = async () => {
    const element = reportRef.current;
    if (!element) return;
    setIsExportingPdf(true);
    try {
        const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 1.5, backgroundColor: '#ffffff' });
        const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const img = new Image();
        await new Promise<void>(resolve => { img.onload = () => resolve(); img.src = dataUrl; });
        const ratio = img.width / pdfWidth;
        const scaledHeight = img.height / ratio;
        let position = 0;
        let heightLeft = scaledHeight;
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
        while (heightLeft > 0) {
            position -= pdf.internal.pageSize.getHeight();
            pdf.addPage();
            pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, scaledHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
        }
        pdf.save('Tanmyaa_RFP.pdf');
    } catch (err) {
        console.error('Failed to export PDF:', err);
        setError('Could not export the RFP as PDF. Please try again.');
    } finally {
        setIsExportingPdf(false);
    }
  };

  const renderInput = () => (
     <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-3xl shadow-2xl p-6 md:p-8">
        <div className="bg-black/40 rounded-xl border border-gray-800 overflow-hidden">
            <div className="border-b border-gray-800 p-4">
                <div className="flex items-center justify-between mb-1">
                    <label htmlFor="task-description" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Describe the Task</label>
                    <AISuggestionButton 
                        onClick={handleGetSuggestions} 
                        isLoading={isSuggestionsLoading} 
                    />
                </div>
                 <p className="text-gray-400 text-sm mb-3">Provide a clear description of the project or services you need an RFP/ToR for.</p>
                <textarea
                    id="task-description"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="e.g., 'Develop a comprehensive masterplan for the Western industrial district...'"
                    rows={4}
                    className="w-full bg-transparent text-white placeholder-gray-500 transition duration-200 resize-none focus:outline-none focus:ring-0"
                    disabled={isLoading}
                />
                {suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => setTaskDescription(s)}
                                className="text-xs bg-gray-700/80 text-gray-200 py-1 px-3 rounded-full hover:bg-gray-600 transition"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-b border-gray-800 p-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Add References (Optional)</label>
                <p className="text-gray-400 text-sm mb-4">Upload existing documents or examples to guide the content and tone.</p>
                <FileUpload files={files} setFiles={setFiles} disabled={isLoading} />
            </div>
            
            <div className="p-4 border-b border-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="detail-level" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Level of Detailing</label>
                        <p className="text-gray-400 text-[10px] mb-2 uppercase tracking-tight">Define the strategic depth of the output.</p>
                        <select
                            id="detail-level"
                            value={detailLevel}
                            onChange={(e) => setDetailLevel(e.target.value)}
                            className="w-full bg-gray-800 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700"
                            disabled={isLoading}
                        >
                            <option value="Standard">Standard (Concise & Efficient)</option>
                            <option value="High">High (Technical & Detailed)</option>
                            <option value="Ultra-Detailed">Ultra-Detailed (Institutional Grade)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="consultant-background" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Consultant Background</label>
                        <p className="text-gray-400 text-[10px] mb-2 uppercase tracking-tight">Profile the requirements for specific expertise.</p>
                        <select
                            id="consultant-background"
                            value={consultantBackground}
                            onChange={(e) => setConsultantBackground(e.target.value)}
                            className="w-full bg-gray-800 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700"
                            disabled={isLoading}
                        >
                            <option value="International">International (Global Standards)</option>
                            <option value="Local">Local (Regional Sensitivity)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-400">
                {profile?.credits || 0} credits remaining.
            </div>
            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="bg-gray-700/80 text-gray-200 font-semibold py-2 px-5 rounded-full hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50"
            >
                {isLoading ? 'Generating...' : 'Generate Document'}
            </button>
        </div>
      </div>
  );

  return (
    <GeneratorShell
      title="RFP & ToR Generator"
      description="Prepare comprehensive Request for Proposals and Terms of Reference documents. Your generated document will be previewed below."
      isLoading={isLoading}
      error={error}
      result={generatedContent}
      onUpdateResult={(updatedResult) => setGeneratedContent(updatedResult)}
      userEmail={user?.email || null}
      onLogin={signInWithGoogle}
      onUpgrade={onUpgrade}
      renderInputForm={renderInput}
       renderExportControls={() => (
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownload}
            className="bg-gray-700/80 text-gray-200 font-semibold py-1 px-4 rounded-full text-xs hover:bg-gray-700 transition duration-300 border border-gray-600/50 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Word (.docx)
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="bg-gray-700/80 text-gray-200 font-semibold py-1 px-4 rounded-full text-xs hover:bg-gray-700 disabled:opacity-50 transition duration-300 border border-gray-600/50 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            {isExportingPdf ? 'Exporting...' : 'PDF'}
          </button>
        </div>
      )}
      renderResult={(content) => <RFPReportDisplay content={content} reportRef={reportRef} />}
    />
  );
};

export default RFPGenerator;
