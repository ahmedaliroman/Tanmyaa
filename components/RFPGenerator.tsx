
import React, { useState, useCallback } from 'react';
import { generateRFP } from '../services/geminiService';
import { exportRFPToDocx } from '../services/docxGenerator';
import { useBranding } from '../hooks/useBranding';
import type { RFPContent } from '../types';
import FileUpload from './FileUpload';
import GeneratorShell from './GeneratorShell';
import { useCompanyProfile } from '../hooks/useCompanyProfile';
import { useAuth } from '../context/AuthContext';
import { TanmyaaLogoPPTX } from './TanmyaaLogo';

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



const RFPReportDisplay: React.FC<{ content: RFPContent }> = ({ content }) => {
    return (
        <div className="bg-white p-8 md:p-12 rounded-lg shadow-2xl border border-gray-200 text-gray-800">
            <header className="text-center mb-12 border-b border-gray-200 pb-8">
                 <div className="flex justify-center items-center mb-4"><TanmyaaLogoPPTX /></div>
                 <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest">Request for Proposal / Terms of Reference</p>
                 <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-2 max-w-4xl mx-auto">{content.title}</h1>
            </header>
            <div className="max-w-5xl mx-auto">
                {(content.sections || []).length > 0 ? (
                    content.sections.map((section, sectionIndex) => (
                        <Section key={sectionIndex} number={sectionIndex + 1} title={section.title} icon={<SectionIcon />}>
                            {(section.content || []).length > 0 ? (
                                section.content.map((part, partIndex) => {
                                    if (part.paragraph) {
                                        return <p key={partIndex} className="mb-4">{part.paragraph}</p>;
                                    }
                                    if (Array.isArray(part.list) && part.list.length > 0) {
                                        return (
                                            <ul key={partIndex} className="list-disc list-inside space-y-2">
                                                {part.list.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                                            </ul>
                                        );
                                    }
                                    return null;
                                })
                            ) : (
                                <p className="italic text-gray-500">No content was generated for this section.</p>
                            )}
                        </Section>
                    ))
                ) : (
                    <p className="text-center italic text-gray-500 py-8">No sections were generated for this document.</p>
                )}
            </div>
        </div>
    );
};


interface RFPGeneratorProps {
  onUpgrade: () => void;
}

const RFPGenerator: React.FC<RFPGeneratorProps> = () => {
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [pageRange, setPageRange] = useState<string>('5-10');
  const [files, setFiles] = useState<File[]>([]);
  const [generatedContent, setGeneratedContent] = useState<RFPContent | null>(null);
  const { logo } = useBranding();
  const { companyProfile } = useCompanyProfile();
  const { deductCredits, profile, user, signInWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (profile && profile.credits < 10) {
      setError("Insufficient credits. Please upgrade your plan.");
      return;
    }

    if (!taskDescription.trim()) {
      setError('Please provide a task description.');
      return;
    }
     if (!pageRange.trim()) {
      setError('Please specify a page range.');
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

        const result = await generateRFP(taskDescription, pageRange, files, companyProfile);
        if (result) {
            setGeneratedContent(result);
        }
    } catch (err: unknown) {
        console.error("RFP generation failed:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred during RFP generation.");
    } finally {
        setIsLoading(false);
    }
  }, [taskDescription, pageRange, files, companyProfile, deductCredits, profile]);
  
  const handleDownload = () => {
    if (generatedContent) {
        exportRFPToDocx(generatedContent, logo);
    }
  };

  const renderInput = () => (
     <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-3xl shadow-2xl p-6 md:p-8">
        <div className="bg-black/40 rounded-xl border border-gray-800 overflow-hidden">
            <div className="border-b border-gray-800 p-4">
                <label htmlFor="task-description" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Describe the Task</label>
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
            </div>

            <div className="border-b border-gray-800 p-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Add References (Optional)</label>
                <p className="text-gray-400 text-sm mb-4">Upload existing documents or examples to guide the content and tone.</p>
                <FileUpload files={files} setFiles={setFiles} disabled={isLoading} />
            </div>
            
            <div className="p-4">
                <label htmlFor="page-range" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Define Page Range</label>
                 <p className="text-gray-400 text-sm mb-3">Specify the approximate length of the document to control the level of detail.</p>
                <input
                    id="page-range"
                    type="text"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="e.g., 5-10"
                    className="w-full bg-transparent text-white placeholder-gray-500 transition duration-200 focus:outline-none focus:ring-0"
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
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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
          onClick={handleDownload}
          className="bg-gray-700/80 text-gray-200 font-semibold py-1 px-4 rounded-full text-xs hover:bg-gray-700 transition duration-300 border border-gray-600/50 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          Download as Word (.docx)
        </button>
      )}
      renderResult={(content) => <RFPReportDisplay content={content} />}
    />
  );
};

export default RFPGenerator;
