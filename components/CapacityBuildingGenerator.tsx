
import React, { useState, useCallback, useRef } from 'react';
import { generateCapacityBuildingProgram, getCapacityBuildingSuggestions } from '../services/geminiService';
import type { CapacityBuildingProgram } from '../types';
import GeneratorShell from './GeneratorShell';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { TanmyaaLogoPPTX } from './TanmyaaLogo';
import { useCompanyProfile } from '../hooks/useCompanyProfile';
import { useAuth } from '../context/AuthContext';
import AISuggestionButton from './AISuggestionButton';

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

const SectionIcons = {
    overview: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    modules: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    logistics: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};


const CapacityBuildingReportDisplay: React.FC<{ program: CapacityBuildingProgram }> = ({ program }) => {
    return (
        <div className="bg-white p-8 md:p-12 rounded-lg shadow-2xl border border-gray-200 text-gray-800">
            <header className="text-center mb-12 border-b border-gray-200 pb-8">
                 <div className="flex justify-center items-center mb-4"><TanmyaaLogoPPTX /></div>
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest">Capacity-Building Program</p>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-2 max-w-4xl mx-auto">{program.programTitle}</h1>
            </header>

            <div className="max-w-5xl mx-auto">
                <Section number={1} title="Program Overview" icon={SectionIcons.overview}>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Target Audience</h3>
                    <p className="mb-4">{program.targetAudience || <span className="italic text-gray-500">Not specified.</span>}</p>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Learning Objectives</h3>
                    <ul className="list-disc list-inside space-y-2">
                        {(program.learningObjectives || []).length > 0 ? (
                            program.learningObjectives.map((obj, i) => <li key={i}>{typeof obj === 'object' ? JSON.stringify(obj) : obj}</li>)
                        ) : (
                            <li className="list-none italic text-gray-500">No learning objectives were generated.</li>
                        )}
                    </ul>
                </Section>
                
                <Section number={2} title="Program Modules" icon={SectionIcons.modules}>
                    <div className="space-y-6">
                        {(program.modules || []).length > 0 ? (
                            program.modules.map((module, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-5 bg-white transition-all duration-300 hover:border-blue-400 hover:shadow-lg">
                                    <h3 className="font-bold text-lg text-gray-900">{`Module ${index + 1}: ${module.title}`}</h3>
                                    <p className="text-sm text-gray-500 mt-1 italic">{module.objective}</p>
                                    <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-1">Topics Covered</h4>
                                            <ul className="list-disc list-inside">
                                                {(module.topics || []).length > 0 ? (
                                                    module.topics.map((topic, i) => <li key={i}>{typeof topic === 'object' ? JSON.stringify(topic) : topic}</li>)
                                                ) : (
                                                    <li className="list-none italic text-gray-500">No topics listed.</li>
                                                )}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-1">Methodology & Outcome</h4>
                                            <p><strong className="text-gray-600">Method:</strong> {module.methodology || <span className="italic text-gray-500">Not specified.</span>}</p>
                                            <p><strong className="text-gray-600">Outcome:</strong> {module.outcome || <span className="italic text-gray-500">Not specified.</span>}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="italic text-gray-500">No modules were generated.</p>
                        )}
                    </div>
                </Section>

                <Section number={3} title="Program Logistics" icon={SectionIcons.logistics}>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Delivery Method</h3>
                    <p className="mb-4">{program.deliveryMethod || <span className="italic text-gray-500">Not specified.</span>}</p>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Evaluation Plan</h3>
                    <p>{program.evaluationPlan || <span className="italic text-gray-500">Not specified.</span>}</p>
                </Section>
            </div>
        </div>
    );
};


interface CapacityBuildingGeneratorProps {
  onUpgrade: () => void;
}

const CapacityBuildingGenerator: React.FC<CapacityBuildingGeneratorProps> = ({ onUpgrade }) => {
  const [inputs, setInputs] = useState({
    audience: '',
    skillLevel: '',
    challenges: '',
  });
  const [program, setProgram] = useState<CapacityBuildingProgram | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { companyProfile } = useCompanyProfile();
  const { deductCredits, profile, user, signInWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  const handleGetSuggestions = async () => {
    setIsSuggestionsLoading(true);
    try {
      const results = await getCapacityBuildingSuggestions();
      setSuggestions(results);
    } catch (err) {
      console.error("Failed to get suggestions:", err);
    } finally {
      setIsSuggestionsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setInputs(prev => ({ ...prev, [id]: value }));
  };

  const handleGenerate = useCallback(async () => {
    if (profile && profile.credits < 10) {
      setError("Insufficient credits. Please upgrade your plan.");
      onUpgrade();
      return;
    }

    if (!inputs.audience.trim() || !inputs.skillLevel.trim() || !inputs.challenges.trim()) {
      setError('Please fill in all fields to generate a program.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgram(null);
    
    try {
        const success = await deductCredits(10);
        if (!success) {
            throw new Error("Failed to deduct credits.");
        }

        const generatedProgram = await generateCapacityBuildingProgram(inputs.audience, inputs.skillLevel, inputs.challenges, companyProfile);
        if (generatedProgram) {
            setProgram(generatedProgram);
        }
    } catch (err: unknown) {
        console.error("Generation failed:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred during generation.");
    } finally {
        setIsLoading(false);
    }
  }, [inputs, companyProfile, deductCredits, profile, onUpgrade]);
  
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
        pdf.save('Capacity_Building_Program.pdf');
    } catch (err) {
        console.error('Failed to export PDF:', err);
        setError('Could not export the program. Please try again.');
    } finally {
        setIsExporting(false);
    }
  };

  const renderInputForm = () => (
    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-3xl shadow-2xl p-6 md:p-8">
        <div className="bg-black/40 rounded-xl border border-gray-800 overflow-hidden">
            <div className="border-b border-gray-800 p-4">
                <div className="flex items-center justify-between mb-1">
                    <label htmlFor="audience" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Target Audience</label>
                    <AISuggestionButton 
                        onClick={handleGetSuggestions} 
                        isLoading={isSuggestionsLoading} 
                    />
                </div>
                <textarea
                    id="audience"
                    value={inputs.audience}
                    onChange={handleInputChange}
                    placeholder="e.g., Junior urban planners, mid-level policy advisors, GIS technicians"
                    rows={2}
                    className="w-full bg-transparent text-white placeholder-gray-500 transition duration-200 resize-none focus:outline-none focus:ring-0"
                    disabled={isLoading}
                />
                {suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => setInputs(prev => ({ ...prev, audience: s }))}
                                className="text-xs bg-gray-700/80 text-gray-200 py-1 px-3 rounded-full hover:bg-gray-600 transition"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="border-b border-gray-800 p-4">
                <label htmlFor="skillLevel" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Skill Level</label>
                <textarea
                    id="skillLevel"
                    value={inputs.skillLevel}
                    onChange={handleInputChange}
                    placeholder="e.g., Beginners with no AI experience, intermediate with strong analytical backgrounds"
                    rows={2}
                    className="w-full bg-transparent text-white placeholder-gray-500 transition duration-200 resize-none focus:outline-none focus:ring-0"
                    disabled={isLoading}
                />
            </div>
            <div className="p-4">
                <label htmlFor="challenges" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Planning Challenges to Address</label>
                <textarea
                    id="challenges"
                    value={inputs.challenges}
                    onChange={handleInputChange}
                    placeholder="e.g., Improving public transport accessibility, integrating climate resilience into zoning codes, enhancing community engagement with data"
                    rows={3}
                    className="w-full bg-transparent text-white placeholder-gray-500 transition duration-200 resize-none focus:outline-none focus:ring-0"
                    disabled={isLoading}
                />
            </div>
        </div>
        <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-400">
                {profile?.credits || 0} credits remaining.
            </div>
            <button
                onClick={handleGenerate}
                disabled={isLoading || !inputs.audience.trim() || !inputs.skillLevel.trim() || !inputs.challenges.trim()}
                className="bg-gray-700/80 text-gray-200 font-semibold py-2 px-5 rounded-full hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50"
            >
                {isLoading ? 'Generating...' : 'Generate Program'}
            </button>
        </div>
    </div>
  );

  return (
    <GeneratorShell
        title="Capacity Building Program Generator"
        description="This tool designs tailored training curricula. Define the audience, their current skill level, and the challenges they face to generate a comprehensive program with modules, objectives, and outcomes."
        icon={
            <svg className="w-full h-full" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.274-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.274.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        }
        isLoading={isLoading}
        error={error}
        result={program}
        onUpdateResult={(updatedResult) => setProgram(updatedResult)}
        userEmail={user?.email || null}
        onLogin={signInWithGoogle}
        onUpgrade={onUpgrade}
        renderInputForm={renderInputForm}
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
        renderResult={(p) => (
            <div ref={reportRef}>
                <CapacityBuildingReportDisplay program={p} />
            </div>
        )}
    />
  );
};

export default CapacityBuildingGenerator;
