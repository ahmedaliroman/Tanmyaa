
import React, { useState, useCallback, useRef } from 'react';
import { generateVisionFramework } from '../services/geminiService';
import type { VisionFramework } from '../types';
import GeneratorShell from './GeneratorShell';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
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

const SectionIcons = {
    pillars: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
};


const VisionFrameworkReportDisplay: React.FC<{ framework: VisionFramework, city: string }> = ({ framework, city }) => {
  return (
    <div className="bg-white p-8 md:p-12 rounded-lg shadow-2xl border border-gray-200 text-gray-800">
      <header className="text-center mb-12 border-b border-gray-200 pb-8">
        <div className="flex justify-center items-center mb-4"><TanmyaaLogoPPTX /></div>
        <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest">Vision & Strategic Framework for {city}</p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-4 max-w-4xl mx-auto leading-tight">&quot;{framework.visionStatement}&quot;</h1>
        <p className="mt-4 text-xl font-bold text-gray-500 italic">~ {framework.tagline} ~</p>
      </header>

      <div className="max-w-5xl mx-auto">
        <Section number={1} title="Strategic Pillars" icon={SectionIcons.pillars}>
            <div className="grid md:grid-cols-2 gap-6">
                {(framework.strategicPillars || []).length > 0 ? (
                    framework.strategicPillars.map((pillar, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-5 bg-white transition-all duration-300 hover:border-blue-400 hover:shadow-lg">
                            <h3 className="font-bold text-lg text-gray-900">{pillar.title}</h3>
                            <p className="text-sm text-gray-500 mt-2">{pillar.description}</p>
                            <div className="mt-4">
                            <h4 className="font-semibold text-gray-800 mb-2 text-sm">Key Initiatives:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {(pillar.keyInitiatives || []).map((initiative, i) => <li key={i}>{typeof initiative === 'object' ? JSON.stringify(initiative) : initiative}</li>)}
                            </ul>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="md:col-span-2 text-center italic text-gray-500 py-8">No strategic pillars were generated.</p>
                )}
            </div>
        </Section>
      </div>
    </div>
  );
};


interface VisionFrameworkGeneratorProps {
  onUpgrade: () => void;
}

const VisionFrameworkGenerator: React.FC<VisionFrameworkGeneratorProps> = ({ onUpgrade }) => {
  const [inputs, setInputs] = useState({
    city: '',
    aspirations: '',
    timeframe: '',
  });
  const [framework, setFramework] = useState<VisionFramework | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { companyProfile } = useCompanyProfile();
  const { deductCredits, profile, user, signInWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setInputs(prev => ({ ...prev, [id]: value }));
  };

  const handleGenerate = useCallback(async () => {
    if (profile && profile.credits < 10) {
      setError("Insufficient credits. Please upgrade your plan.");
      onUpgrade();
      return;
    }

    if (!inputs.city.trim() || !inputs.aspirations.trim() || !inputs.timeframe.trim()) {
      setError('Please fill in all fields to generate a framework.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFramework(null);
    
    try {
        const success = await deductCredits(10);
        if (!success) {
            throw new Error("Failed to deduct credits.");
        }

        const generatedFramework = await generateVisionFramework(inputs.city, inputs.aspirations, inputs.timeframe, companyProfile);
        if (generatedFramework) {
            setFramework(generatedFramework);
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
        pdf.save('Vision_Strategic_Framework.pdf');
    } catch (err) {
        console.error('Failed to export PDF:', err);
        setError('Could not export the framework. Please try again.');
    } finally {
        setIsExporting(false);
    }
  };
  
  const renderInputForm = () => (
    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-3xl shadow-2xl p-6 md:p-8">
      <div className="bg-black/40 rounded-xl border border-gray-800 overflow-hidden">
        <div className="border-b border-gray-800 p-4">
          <label htmlFor="city" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">City or Region</label>
          <input
            id="city"
            type="text"
            value={inputs.city}
            onChange={handleInputChange}
            placeholder="e.g., Springfield, North District"
            disabled={isLoading}
            className="w-full bg-transparent text-white placeholder-gray-500 transition duration-200 resize-none focus:outline-none focus:ring-0"
          />
        </div>
        <div className="border-b border-gray-800 p-4">
          <label htmlFor="aspirations" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Key Aspirations</label>
          <textarea
            id="aspirations"
            value={inputs.aspirations}
            onChange={handleInputChange}
            placeholder="e.g., A hub for green technology, a vibrant cultural center, a family-friendly community"
            disabled={isLoading}
            rows={3}
            className="w-full bg-transparent text-white placeholder-gray-500 transition duration-200 resize-none focus:outline-none focus:ring-0"
          />
        </div>
        <div className="p-4">
          <label htmlFor="timeframe" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Timeframe</label>
          <input
            id="timeframe"
            type="text"
            value={inputs.timeframe}
            onChange={handleInputChange}
            placeholder="e.g., Vision 2040, The Next Decade"
            disabled={isLoading}
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
            disabled={isLoading || !inputs.city.trim() || !inputs.aspirations.trim() || !inputs.timeframe.trim()}
            className="bg-gray-700/80 text-gray-200 font-semibold py-2 px-5 rounded-full hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50"
        >
            {isLoading ? 'Generating...' : 'Generate Framework'}
        </button>
      </div>
    </div>
  );

  return (
    <GeneratorShell
      title="Vision & Strategic Framework"
      description="This tool helps you craft a high-level vision for the future. By defining a place, its aspirations, and a timeframe, the system will generate a cohesive strategic framework to guide development."
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.657-6.657l-1.414 1.414M6.757 17.243l-1.414 1.414m12.728 0l-1.414-1.414M6.757 6.757l-1.414-1.414" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15l-3-3 3-3 3 3-3 3z" />
        </svg>
      }
      isLoading={isLoading}
      error={error}
      result={framework}
      onUpdateResult={(updatedResult) => setFramework(updatedResult)}
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
      renderResult={(fw) => (
        <div ref={reportRef}>
            <VisionFrameworkReportDisplay framework={fw} city={inputs.city} />
        </div>
      )}
    />
  );
};

export default VisionFrameworkGenerator;
