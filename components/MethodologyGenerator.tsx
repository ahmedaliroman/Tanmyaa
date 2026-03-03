
import React, { useState, useCallback, useRef } from 'react';
import { generateMethodology, getMethodologySuggestions } from '../services/geminiService';
import type { Methodology } from '../types';
import GeneratorShell from './GeneratorShell';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { useCompanyProfile } from '../hooks/useCompanyProfile';
import { useAuth } from '../context/AuthContext';
import { TanmyaaLogoPPTX } from './TanmyaaLogo';
import AISuggestionButton from './AISuggestionButton';

const Section: React.FC<{ number: string; title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ number, title, icon, children }) => (
  <section className="mb-10">
    <div className="flex items-center mb-5">
      <div className="w-10 h-10 flex-shrink-0 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center mr-4">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600">{number}</h2>
        <p className="text-2xl font-bold text-gray-800">{title}</p>
      </div>
    </div>
    <div className="pl-14 ml-5 border-l-2 border-gray-200">
        <div className="pl-6 text-gray-700 leading-relaxed space-y-4">{children}</div>
    </div>
  </section>
);

const SectionIcons = {
    phase: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
};

const MethodologyReportDisplay: React.FC<{ content: Methodology }> = ({ content }) => {
    return (
        <div className="bg-white p-8 md:p-12 rounded-lg shadow-2xl border border-gray-200 text-gray-800">
            <header className="text-center mb-12 border-b border-gray-200 pb-8">
                 <div className="flex justify-center items-center mb-4"><TanmyaaLogoPPTX /></div>
                 <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest">Project Methodology</p>
                 <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-2 max-w-4xl mx-auto">{content.title || "Methodology Report"}</h1>
            </header>
            <div className="max-w-5xl mx-auto">
                <div className="mb-10 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-3">Introduction</h2>
                    <p className="text-base text-gray-600">{content.introduction || "No introduction was provided."}</p>
                </div>

                {(content.phases || []).map((phase, phaseIndex) => (
                    <Section key={phaseIndex} number={`Phase ${phase.phase_number}`} title={phase.title} icon={SectionIcons.phase}>
                        <p className="mb-4 text-gray-600">{phase.description}</p>
                        <div className="space-y-6">
                            {(phase.steps || []).map((step, stepIndex) => (
                                <div key={stepIndex} className="border border-gray-200 rounded-lg p-5 bg-white transition-all duration-300 hover:border-blue-400 hover:shadow-md">
                                    <h3 className="font-bold text-lg text-gray-900">{step.step_number}: {step.title}</h3>
                                    <p className="text-sm text-gray-600 mt-2">{step.description}</p>
                                    <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-1">Deliverable</h4>
                                            <p>{step.deliverable}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-1">Tools & Techniques</h4>
                                            {(step.tools_and_techniques?.length > 0) ? (
                                                <ul className="list-disc list-inside">
                                                    {step.tools_and_techniques.map((tool, i) => <li key={i}>{tool}</li>)}
                                                </ul>
                                            ) : (
                                                <p className="italic text-gray-500">None specified.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                ))}

                 <div className="mt-10 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-3">Conclusion</h2>
                    <p className="text-base text-gray-600">{content.conclusion || "No conclusion was provided."}</p>
                </div>
            </div>
        </div>
    );
};

interface MethodologyGeneratorProps {
  onUpgrade: () => void;
}

const MethodologyGenerator: React.FC<MethodologyGeneratorProps> = ({ onUpgrade }) => {
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<Methodology | null>(null);
  const { companyProfile } = useCompanyProfile();
  const { deductCredits, profile, user, signInWithGoogle } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  const handleGetSuggestions = async () => {
    setIsSuggestionsLoading(true);
    try {
      const results = await getMethodologySuggestions();
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
        const success = await deductCredits(10);
        if (!success) {
            throw new Error("Failed to deduct credits.");
        }

        const result = await generateMethodology(taskDescription, companyProfile);
        if (result) {
            setGeneratedContent(result);
        }
    } catch (err: unknown) {
        console.error("Methodology generation failed:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred during generation.");
    } finally {
        setIsLoading(false);
    }
  }, [taskDescription, companyProfile, deductCredits, profile, onUpgrade]);
  
   const handleExportPdf = async () => {
    const element = reportRef.current;
    if (!element) return;

    setIsExporting(true);

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
        pdf.save('Methodology.pdf');
    } catch (err) {
        console.error('Failed to export PDF:', err);
        setError('Could not export the methodology. Please try again.');
    } finally {
        setIsExporting(false);
    }
  };


  const renderInput = () => (
     <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-3xl shadow-2xl p-6 md:p-8">
        <div className="bg-black/40 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                    <label htmlFor="task-description" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Urban Planning Task</label>
                    <AISuggestionButton 
                        onClick={handleGetSuggestions} 
                        isLoading={isSuggestionsLoading} 
                    />
                </div>
                <p className="text-gray-400 text-sm mb-3">
                    Provide a clear description of the task for which you need a methodology. Be as specific as possible.
                </p>
                <textarea
                    id="task-description"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="e.g., 'Create a climate adaptation plan for a coastal community vulnerable to sea-level rise.'"
                    rows={5}
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
        </div>
        <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-400">
                {profile?.credits || 0} credits remaining.
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !taskDescription.trim()}
              className="bg-gray-700/80 text-gray-200 font-semibold py-2 px-5 rounded-full hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50"
            >
              {isLoading ? 'Generating...' : 'Generate Methodology'}
            </button>
        </div>
      </div>
  );

  return (
    <GeneratorShell
      title="Methodology Generator"
      description="This tool creates a detailed, step-by-step methodology for executing complex urban planning tasks. Describe your task to generate a professional guide covering all phases from inception to completion."
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      }
      isLoading={isLoading}
      error={error}
      result={generatedContent}
      onUpdateResult={(updatedResult) => setGeneratedContent(updatedResult)}
      userEmail={user?.email || null}
      onLogin={signInWithGoogle}
      onUpgrade={onUpgrade}
      renderInputForm={renderInput}
       renderExportControls={() => (
        <button
          onClick={handleExportPdf}
          disabled={isExporting}
          className="bg-gray-700/80 text-gray-200 font-semibold py-1 px-4 rounded-full text-xs hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          {isExporting ? 'Exporting...' : 'Export PDF'}
        </button>
      )}
      renderResult={(content) => (
        <div ref={reportRef}>
            <MethodologyReportDisplay content={content} />
        </div>
      )}
    />
  );
};

export default MethodologyGenerator;
