
import React, { useState, useCallback, useRef } from 'react';
import { generatePolicyReport } from '../services/geminiService';
import type { PolicyBrief as PolicyBriefType } from '../types';
import GeneratorShell from './GeneratorShell';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { TanmyaaLogoPPTX } from './TanmyaaLogo';
import { useCompanyProfile } from '../hooks/useCompanyProfile';
import { useAuth } from '../context/AuthContext';
import FileUpload from './FileUpload';

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
    problem: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 3h.01" /></svg>,
    evidence: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    options: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" /></svg>,
    recommendation: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    implementation: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    takeaways: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7h2a2 2 0 012 2v10a2 2 0 01-2 2h-2m-6 0H7a2 2 0 01-2-2V9a2 2 0 012-2h2m4 0h2a2 2 0 012 2v3.5a2.5 2.5 0 01-5 0V9a2 2 0 012-2z" /></svg>,
    sources: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
};

const FallbackText: React.FC = () => <span className="text-gray-500 italic">Not provided</span>;

const PolicyBriefDisplay: React.FC<{ brief: PolicyBriefType }> = ({ brief }) => (
  <div className="bg-white p-8 md:p-12 rounded-lg shadow-2xl border border-gray-200 text-gray-800">
    <header className="text-center mb-12 border-b border-gray-200 pb-8">
      <div className="flex justify-center items-center mb-4"><TanmyaaLogoPPTX /></div>
      <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest">Policy Brief</p>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-2 max-w-4xl mx-auto">{brief.title || <FallbackText />}</h1>
    </header>

    <div className="max-w-5xl mx-auto">
        <div className="mb-10 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
             <h2 className="text-xl font-bold text-gray-800 mb-3">Executive Summary</h2>
             <p className="text-lg italic text-gray-600">{brief.executiveSummary || <FallbackText />}</p>
        </div>

      <Section number={1} title="Policy Problem" icon={SectionIcons.problem}>
        <p><strong>Definition:</strong> {brief.policyProblem?.definition || <FallbackText />}</p>
        <p><strong>Affected Parties:</strong> {brief.policyProblem?.affectedParties || <FallbackText />}</p>
        <p><strong>Urgency:</strong> {brief.policyProblem?.urgency || <FallbackText />}</p>
      </Section>

      <Section number={2} title="Evidence & Key Findings" icon={SectionIcons.evidence}>
        <p>{brief.evidenceAndFindings?.summary || <FallbackText />}</p>
        <ul className="list-disc list-inside pl-2 space-y-1">
          {(brief.evidenceAndFindings?.findings || []).length > 0 ? (
            (brief.evidenceAndFindings?.findings || []).map((finding, index) => <li key={index}>{typeof finding === 'object' ? JSON.stringify(finding) : finding}</li>)
          ) : (
            <li className="list-none italic text-gray-500">No specific findings were provided.</li>
          )}
        </ul>
      </Section>

      <Section number={3} title="Policy Options" icon={SectionIcons.options}>
        <div className="grid md:grid-cols-2 gap-6">
          {(brief.policyOptions || []).length > 0 ? (
            (brief.policyOptions || []).map((option, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-5 bg-white transition-all duration-300 hover:border-blue-400 hover:shadow-lg">
                <h3 className="font-bold text-lg text-gray-900">Option {index + 1}: {option.description || <FallbackText />}</h3>
                <div className="mt-4 text-sm space-y-3">
                    <p><strong className="text-green-600">Benefits:</strong> {option.benefits || <FallbackText />}</p>
                    <p><strong className="text-red-600">Risks:</strong> {option.risks || <FallbackText />}</p>
                    <p><strong className="text-yellow-600">Feasibility:</strong> {option.feasibility || <FallbackText />}</p>
                </div>
                </div>
            ))
          ) : (
            <div className="md:col-span-2 text-center text-gray-500 italic py-8">
                <p>[No policy options were generated.]</p>
            </div>
          )}
        </div>
      </Section>

      <Section number={4} title="Recommended Action" icon={SectionIcons.recommendation}>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg shadow-sm">
          <h3 className="font-bold text-2xl text-blue-800">{brief.recommendedAction?.option || <FallbackText />}</h3>
          <p className="mt-3"><strong>Justification:</strong> {brief.recommendedAction?.justification || <FallbackText />}</p>
          <p className="mt-2"><strong>Impacts:</strong> {brief.recommendedAction?.impacts || <FallbackText />}</p>
        </div>
      </Section>

      <Section number={5} title="Implementation Considerations" icon={SectionIcons.implementation}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
            <div className="p-4 bg-gray-100 rounded-md border border-gray-200"><strong>Institutional Responsibility:</strong> {brief.implementationConsiderations?.responsibility || <FallbackText />}</div>
            <div className="p-4 bg-gray-100 rounded-md border border-gray-200"><strong>Capacity & Resources:</strong> {brief.implementationConsiderations?.capacity || <FallbackText />}</div>
            <div className="p-4 bg-gray-100 rounded-md border border-gray-200"><strong>Timeline:</strong> {brief.implementationConsiderations?.timeline || <FallbackText />}</div>
            <div className="p-4 bg-gray-100 rounded-md border border-gray-200"><strong>Risks & Mitigation:</strong> {brief.implementationConsiderations?.risks || <FallbackText />}</div>
        </div>
      </Section>

      <Section number={6} title="Key Takeaways" icon={SectionIcons.takeaways}>
        <ul className="list-none space-y-3">
          {(brief.keyTakeaways || []).length > 0 ? (
            (brief.keyTakeaways || []).map((takeaway, index) => (
                <li key={index} className="flex items-start bg-gray-50 p-3 rounded-md border border-gray-200">
                <svg className="w-6 h-6 mr-4 text-blue-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className="text-gray-800">{typeof takeaway === 'object' ? JSON.stringify(takeaway) : takeaway}</span>
                </li>
            ))
          ) : (
            <li className="flex items-start bg-gray-50 p-3 rounded-md border border-gray-200 italic text-gray-500">
                No key takeaways were provided.
            </li>
          )}
        </ul>
      </Section>

        {brief.groundingSources && brief.groundingSources.length > 0 && (
            <Section number={7} title="Sources" icon={SectionIcons.sources}>
                <p className="text-xs text-gray-500 mb-3">This brief was generated with the assistance of Google Search to provide up-to-date information. The following sources were consulted:</p>
                <ul className="list-decimal list-inside space-y-2">
                    {brief.groundingSources.map((source, index) => (
                        <li key={index} className="truncate">
                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm" title={source.uri}>
                                {source.title}
                            </a>
                        </li>
                    ))}
                </ul>
            </Section>
        )}
    </div>
  </div>
);

interface PolicyStrategyGeneratorProps {
  onUpgrade: () => void;
}

const PolicyStrategyGenerator: React.FC<PolicyStrategyGeneratorProps> = ({ onUpgrade }) => {
  const [projectBrief, setProjectBrief] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [policyBrief, setPolicyBrief] = useState<PolicyBriefType | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { companyProfile } = useCompanyProfile();
  const { deductCredits, profile, login } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (profile && profile.credits < 10) {
      setError("Insufficient credits. Please upgrade your plan.");
      onUpgrade();
      return;
    }

    if (!projectBrief.trim()) {
      setError('Please enter a project brief.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPolicyBrief(null);
    
    try {
        const success = await deductCredits(10);
        if (!success) {
            throw new Error("Failed to deduct credits.");
        }

        const generatedBrief = await generatePolicyReport(projectBrief, files, companyProfile);
        if (generatedBrief) {
          setPolicyBrief(generatedBrief);
        }
    } catch (err: unknown) {
        console.error("Generation failed:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred during generation.");
    } finally {
        setIsLoading(false);
    }
  }, [projectBrief, files, companyProfile, deductCredits, profile, onUpgrade]);

  const handleExportPdf = async () => {
    const element = reportRef.current;
    if (!element) return;

    setIsExporting(true);

    try {
        const dataUrl = await toPng(element, {
            cacheBust: true,
            pixelRatio: 1.5,
            backgroundColor: '#ffffff',
        });

        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const img = new Image();
        await new Promise<void>(resolve => { 
            img.onload = () => resolve(); 
            img.src = dataUrl;
        });

        const imgWidth = img.width;
        const imgHeight = img.height;
        
        const ratio = imgWidth / pdfWidth;
        const scaledHeight = imgHeight / ratio;

        let heightLeft = scaledHeight;
        let position = 0;

        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position -= pdfHeight;
            pdf.addPage();
            pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, scaledHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save('policy-brief.pdf');

    } catch (error) {
        console.error('Failed to export policy brief:', error);
        setError('Could not export the policy brief. Please try again.');
    } finally {
        setIsExporting(false);
    }
  };

  const renderInputForm = () => (
    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-3xl shadow-2xl p-6 md:p-8">
      <div className="bg-black/40 rounded-xl border border-gray-800 overflow-hidden">
        <div className="border-b border-gray-800 p-4">
          <label htmlFor="project-brief" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Project Brief
          </label>
          <p className="text-gray-400 text-sm mb-3">
              Describe the policy issue or project requiring analysis. Example: &quot;Analyze policy options for increasing affordable housing supply in the North District.&quot;
          </p>
          <textarea
            id="project-brief"
            value={projectBrief}
            onChange={(e) => setProjectBrief(e.target.value)}
            placeholder="Enter your project brief here..."
            rows={5}
            className="w-full bg-transparent text-white placeholder-gray-500 transition duration-200 resize-none focus:outline-none focus:ring-0"
            disabled={isLoading}
          />
        </div>
        <div className="p-4">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Add References (Optional)
          </label>
           <p className="text-gray-400 text-sm mb-4">
              Upload scholarly articles, research papers, or official reports to inform the generation.
            </p>
          <FileUpload files={files} setFiles={setFiles} disabled={isLoading} />
        </div>
      </div>
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          {profile?.credits || 0} credits remaining.
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading || !projectBrief.trim()}
          className="bg-gray-700/80 text-gray-200 font-semibold py-2 px-5 rounded-full hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50"
        >
          {isLoading ? 'Generating...' : 'Generate Policy Brief'}
        </button>
      </div>
    </div>
  );

  return (
    <GeneratorShell
      title="Policy Brief Generator"
      description="This tool provides policy analysis to generate a concise, decision-oriented policy brief. Provide a project brief and the system will produce a structured report intended for senior decision-makers."
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      isLoading={isLoading}
      error={error}
      result={policyBrief}
      onUpdateResult={(updatedResult) => setPolicyBrief(updatedResult)}
      userEmail={profile?.email || null}
      onLogin={login}
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
      renderResult={(brief) => (
        <div ref={reportRef}>
          <PolicyBriefDisplay brief={brief} />
        </div>
      )}
    />
  );
};

export default PolicyStrategyGenerator;
