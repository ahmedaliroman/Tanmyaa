
import React, { useState, useCallback, useRef } from 'react';
import { generateStakeholderPlan, getStakeholderContextSuggestions } from '../services/geminiService';
import type { StakeholderPlan, StakeholderGroup } from '../types';
import GeneratorShell from './GeneratorShell';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { useCompanyProfile } from '../hooks/useCompanyProfile';
import { useAuth } from '../context/AuthContext';
import { TanmyaaLogoPPTX } from './TanmyaaLogo';
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
    goals: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    analysis: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.274-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.274.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    strategies: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
    timeline: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
};

const StakeholderMatrix: React.FC<{ stakeholders: StakeholderGroup[] }> = ({ stakeholders }) => {
    const getPosition = (level: 'High' | 'Medium' | 'Low') => {
        if (level === 'High') return '80%';
        if (level === 'Medium') return '50%';
        return '20%';
    };

    const getColor = (category: StakeholderGroup['category']) => {
        const colors = {
            'Government': 'bg-blue-500',
            'Community': 'bg-green-500',
            'Private Sector': 'bg-purple-500',
            'Expert/NGO': 'bg-orange-500',
            'Other': 'bg-gray-500'
        };
        return colors[category] || 'bg-gray-500';
    }

    return (
        <div className="relative aspect-square w-full max-w-xl mx-auto my-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
            {/* Axis Labels */}
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-bold text-gray-700">Influence</div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-bold text-gray-700">Interest</div>
            
            {/* Grid Lines */}
            <div className="absolute top-0 left-[50%] w-px h-full bg-gray-200"></div>
            <div className="absolute left-0 top-[50%] h-px w-full bg-gray-200"></div>
            
             {/* Quadrant Labels */}
            <div className="absolute top-2 left-2 text-xs text-gray-400">Keep Satisfied</div>
            <div className="absolute top-2 right-2 text-xs text-gray-400">Manage Closely</div>
            <div className="absolute bottom-2 left-2 text-xs text-gray-400">Monitor</div>
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">Keep Informed</div>

            {/* Stakeholder Points */}
            <div className="w-full h-full relative">
                {(stakeholders && stakeholders.length > 0) ? (
                    stakeholders.map((s, i) => (
                        <div
                            key={i}
                            className="absolute -translate-x-1/2 -translate-y-1/2 group"
                            style={{ left: getPosition(s.interest), top: `calc(100% - ${getPosition(s.influence)})` }}
                        >
                        <div className={`w-3 h-3 rounded-full ${getColor(s.category)} transition-all group-hover:scale-150 border-2 border-white shadow`}></div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {s.name}
                        </div>
                        </div>
                    ))
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-500 italic p-4 text-center">No stakeholders were provided to populate the matrix.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const StakeholderPlanReportDisplay: React.FC<{ plan: StakeholderPlan }> = ({ plan }) => {
    const renderEmptyState = (message: string) => (
        <div className="bg-gray-100 p-6 rounded-md text-center text-gray-500 italic my-4 border border-gray-200">
            {message}
        </div>
    );

    return (
        <div className="bg-white p-8 md:p-12 rounded-lg shadow-2xl border border-gray-200 text-gray-800">
            <header className="text-center mb-12 border-b border-gray-200 pb-8">
                 <div className="flex justify-center items-center mb-4"><TanmyaaLogoPPTX /></div>
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest">Stakeholder Engagement Plan</p>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-2 max-w-4xl mx-auto">{plan.planTitle}</h1>
            </header>

            <div className="max-w-5xl mx-auto">
                <Section number={1} title="Engagement Goals" icon={SectionIcons.goals}>
                    {(plan.engagementGoals || []).length > 0 ? (
                        <ul className="list-disc list-inside space-y-2">
                            {plan.engagementGoals.map((goal, i) => <li key={i}>{typeof goal === 'object' ? JSON.stringify(goal) : goal}</li>)}
                        </ul>
                    ) : (
                        renderEmptyState("No engagement goals were generated.")
                    )}
                </Section>
                
                <Section number={2} title="Stakeholder Analysis" icon={SectionIcons.analysis}>
                     <p className="text-sm text-center text-gray-500 max-w-3xl mx-auto">The matrix below maps identified stakeholders by their level of interest in the project and their influence over its outcome.</p>
                    <StakeholderMatrix stakeholders={plan.stakeholderGroups || []} />
                </Section>

                <Section number={3} title="Engagement Strategies" icon={SectionIcons.strategies}>
                    {(plan.stakeholderGroups || []).length > 0 ? (
                        <div className="space-y-6">
                            {plan.stakeholderGroups.map((group, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-5 bg-white transition-all duration-300 hover:border-blue-400 hover:shadow-lg">
                                    <h3 className="font-bold text-lg text-gray-900">{group.name}</h3>
                                    <div className="mt-4 grid md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-2">Engagement Strategy</h4>
                                            <p>{group.engagementStrategy || <span className="italic text-gray-500">Not specified.</span>}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-2">Communication Methods</h4>
                                            <ul className="list-disc list-inside">
                                                {(group.communicationMethods || []).length > 0 ? (
                                                    group.communicationMethods.map((method, i) => <li key={i}>{typeof method === 'object' ? JSON.stringify(method) : method}</li>)
                                                ) : (
                                                    <li className="list-none italic text-gray-500">No methods listed.</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        renderEmptyState("No stakeholder groups were generated.")
                    )}
                </Section>
                
                <Section number={4} title="Engagement Timeline" icon={SectionIcons.timeline}>
                    {(plan.timeline || []).length > 0 ? (
                        <div className="space-y-4">
                            {plan.timeline.map((item, i) => (
                                <div key={i} className="flex items-start bg-gray-50 p-4 rounded-md border border-gray-200">
                                    <div className="mr-4 flex-shrink-0 w-24">
                                        <p className="font-bold text-blue-600">{item.phase}</p>
                                        <p className="text-xs text-gray-500">{item.duration}</p>
                                    </div>
                                    <div className="border-l border-gray-200 pl-4">
                                        <p className="text-sm">{item.activities}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         renderEmptyState("No timeline was generated.")
                    )}
                </Section>
            </div>
        </div>
    );
};

interface StakeholderPlanGeneratorProps {
  onUpgrade: () => void;
}

const StakeholderPlanGenerator: React.FC<StakeholderPlanGeneratorProps> = ({ onUpgrade }) => {
  const [inputs, setInputs] = useState({ projectContext: '', projectGoals: '' });
  const [plan, setPlan] = useState<StakeholderPlan | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { companyProfile } = useCompanyProfile();
  const { refreshProfile, profile, user, signInWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  const handleGetSuggestions = async () => {
    setIsSuggestionsLoading(true);
    try {
      const results = await getStakeholderContextSuggestions();
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

    if (!inputs.projectContext.trim() || !inputs.projectGoals.trim()) {
      setError('Please fill in all fields to generate a plan.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPlan(null);
    
    try {
        const generatedPlan = await generateStakeholderPlan(inputs.projectContext, inputs.projectGoals, companyProfile);
        await refreshProfile();
        if (generatedPlan) {
            setPlan(generatedPlan);
        }
    } catch (err: unknown) {
        console.error("Generation failed:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred during generation.");
    } finally {
        setIsLoading(false);
    }
  }, [inputs, companyProfile, profile, onUpgrade, refreshProfile]);
  
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
        pdf.save('Stakeholder_Engagement_Plan.pdf');
    } catch (err) {
        console.error('Failed to export PDF:', err);
        setError('Could not export the plan. Please try again.');
    } finally {
        setIsExporting(false);
    }
  };

  const renderInputForm = () => (
     <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-3xl shadow-2xl p-6 md:p-8">
        <div className="bg-black/40 rounded-xl border border-gray-800 overflow-hidden">
            <div className="border-b border-gray-800 p-4">
                <div className="flex items-center justify-between mb-1">
                    <label htmlFor="projectContext" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Project Context</label>
                    <AISuggestionButton 
                        onClick={handleGetSuggestions} 
                        isLoading={isSuggestionsLoading} 
                    />
                </div>
                <textarea
                    id="projectContext"
                    value={inputs.projectContext}
                    onChange={handleInputChange}
                    placeholder="e.g., A proposed light rail transit (LRT) line through the city's western suburbs."
                    disabled={isLoading}
                    rows={3}
                    className="w-full bg-transparent text-white placeholder-gray-500 transition duration-200 resize-none focus:outline-none focus:ring-0"
                />
                {suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => setInputs(prev => ({ ...prev, projectContext: s }))}
                                className="text-xs bg-gray-700/80 text-gray-200 py-1 px-3 rounded-full hover:bg-gray-600 transition"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="p-4">
                <label htmlFor="projectGoals" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Key Project Goals</label>
                <textarea
                    id="projectGoals"
                    value={inputs.projectGoals}
                    onChange={handleInputChange}
                    placeholder="e.g., Improve public transit access, reduce traffic congestion, and spur economic development along the corridor."
                    disabled={isLoading}
                    rows={3}
                    className="w-full bg-transparent text-white placeholder-gray-500 transition duration-200 resize-none focus:outline-none focus:ring-0"
                />
            </div>
        </div>
        <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-400">
                {profile?.credits || 0} credits remaining.
            </div>
            <button
                onClick={handleGenerate}
                disabled={isLoading || !inputs.projectContext.trim() || !inputs.projectGoals.trim()}
                className="bg-gray-700/80 text-gray-200 font-semibold py-2 px-5 rounded-full hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50"
            >
                {isLoading ? 'Generating...' : 'Generate Plan'}
            </button>
        </div>
      </div>
  );

  return (
    <GeneratorShell
        title="Stakeholder Engagement Plan"
        description="This tool helps you build a comprehensive strategy for managing project stakeholders. Provide your project's context and goals to generate a plan that identifies key groups, analyzes their needs, and outlines effective communication strategies."
        icon={
            <svg className="w-full h-full" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663l.005-.004c.291.246.617.452.97.612m-6.276-8.486A3.375 3.375 0 0112 5.625a3.375 3.375 0 013.375 3.375c0 1.122-.553 2.11-1.357 2.712M9.375 9.375a3.375 3.375 0 00-3.375-3.375m0 0A3.375 3.375 0 012.625 9.375c0 1.122.553 2.11 1.357 2.712m-3.07-5.422c.291-.246.617-.452.97-.612" />
            </svg>
        }
        isLoading={isLoading}
        error={error}
        result={plan}
        onUpdateResult={(updatedResult) => setPlan(updatedResult)}
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
                <StakeholderPlanReportDisplay plan={p} />
            </div>
        )}
    />
  );
};

export default StakeholderPlanGenerator;
