
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { MasterplanProjectInfo, LandUseItem } from '@/types';
import FileUpload from './FileUpload';
import { 
  getMasterplanLocationSuggestions, 
  getMasterplanScaleSuggestions, 
  getMasterplanTypeSuggestions,
  getBuildingCoverageSuggestions,
  getGreenSpaceSuggestions,
  getMaxHeightSuggestions,
  getLandUseBalanceSuggestions
} from '@/services/geminiService';
import AISuggestionButton from './AISuggestionButton';

interface MasterplanInputFormProps {
  initialInfo: MasterplanProjectInfo;
  onSubmit: (info: MasterplanProjectInfo) => void;
  isLoading: boolean;
  credits: number;
  userEmail: string | null;
  onLogin: () => void;
}

const steps = [
    { 
        id: 'context',
        title: 'Context',
        fields: ['country', 'city', 'scale', 'type'],
    },
    { 
        id: 'program', 
        title: 'Program Balance', 
        fields: ['landUseBalance'],
    },
    {
        id: 'boundary',
        title: 'Site Vision',
        fields: [],
    }
];

const fieldConfig: Record<string, { label: string; placeholder: string; rows: number }> = {
    country: { label: 'Location Country', placeholder: 'Specify country...', rows: 1 },
    city: { label: 'Primary City', placeholder: 'Specify city...', rows: 1 },
    scale: { label: 'Project Scale', placeholder: 'e.g. 50 Hectares...', rows: 1 },
    type: { label: 'Typology', placeholder: 'e.g. Luxury Residential...', rows: 1 },
    landUseBalance: { label: 'Area Allocation', placeholder: 'Define zone percentages', rows: 2 },
};

type SuggestionState = {
    [key: string]: {
        suggestions: string[];
        isLoading: boolean;
    }
}

const LAND_USE_CATEGORIES = [
    'Residential',
    'Mixed-Use',
    'Commercial',
    'Public Facilities',
    'Green Area',
    'Industrial'
];

const MasterplanInputForm: React.FC<MasterplanInputFormProps> = ({ initialInfo, onSubmit, isLoading, credits, userEmail, onLogin }) => {
  const [info, setInfo] = useState<MasterplanProjectInfo>(() => {
    const baseInfo = { ...initialInfo };
    if (!baseInfo.landUseBreakdown || baseInfo.landUseBreakdown.length === 0) {
        baseInfo.landUseBreakdown = LAND_USE_CATEGORIES.map(label => ({
            label,
            percentage: label === 'Residential' ? 100 : 0
        }));
    }
    return baseInfo;
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [suggestionState, setSuggestionState] = useState<SuggestionState>({
    country: { suggestions: [], isLoading: false },
    city: { suggestions: [], isLoading: false },
    scale: { suggestions: [], isLoading: false },
    type: { suggestions: [], isLoading: false },
    buildingCoverage: { suggestions: [], isLoading: false },
    greenSpaceRatio: { suggestions: [], isLoading: false },
    maxHeight: { suggestions: [], isLoading: false },
    landUseBalance: { suggestions: [], isLoading: false },
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSubmit(info);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
    
  const handleChange = (id: keyof MasterplanProjectInfo, value: string | number | LandUseItem[]) => {
    setInfo({ ...info, [id]: value });
  };

  const handleLandUseSliderChange = (index: number, value: number) => {
    const newBreakdown = [...(info.landUseBreakdown || [])];
    const otherTotal = newBreakdown.reduce((sum, item, idx) => idx === index ? sum : sum + item.percentage, 0);
    
    if (otherTotal + value > 100) {
        newBreakdown[index].percentage = 100 - otherTotal;
    } else {
        newBreakdown[index].percentage = value;
    }
    
    setInfo({ ...info, landUseBreakdown: newBreakdown });
  };

  const totalPercentage = (info.landUseBreakdown || []).reduce((sum, item) => sum + item.percentage, 0);

  const handleFileUpload = (files: File[] | ((prev: File[]) => File[])) => {
    const newFiles = typeof files === 'function' ? files([]) : files;
    setUploadedFiles(newFiles);
    
    if (newFiles.length > 0) {
      const file = newFiles[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setInfo(prev => ({ ...prev, satelliteImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const requiredFields: (keyof MasterplanProjectInfo)[] = ['country', 'city', 'scale', 'type'];

  const isCurrentStepValid = () => {
      const step = steps[currentStep];
      if (step.id === 'boundary') {
          return !!info.satelliteImage;
      }

      if (step.id === 'program') {
          return totalPercentage === 100;
      }

      return step.fields.every(fieldId => {
          const key = fieldId as keyof MasterplanProjectInfo;
          if (requiredFields.includes(key)) {
            const value = info[key as keyof MasterplanProjectInfo];
            return typeof value === 'string' && value.trim() !== '';
          }
          return true;
      });
  };
  
  const handleGetSuggestions = async (fieldId: string) => {
    setSuggestionState(prev => ({...prev, [fieldId]: { suggestions: [], isLoading: true }}));
    try {
        let suggestions: string[] = [];
        switch(fieldId) {
            case 'country':
            case 'city':
                suggestions = await getMasterplanLocationSuggestions();
                break;
            case 'scale':
                suggestions = await getMasterplanScaleSuggestions(`${info.city}, ${info.country}`);
                break;
            case 'type':
                suggestions = await getMasterplanTypeSuggestions(`${info.city}, ${info.country}`);
                break;
            case 'buildingCoverage':
                suggestions = await getBuildingCoverageSuggestions(info.type || 'Residential');
                break;
            case 'greenSpaceRatio':
                suggestions = await getGreenSpaceSuggestions(info.type || 'Residential');
                break;
            case 'maxHeight':
                suggestions = await getMaxHeightSuggestions(info.type || 'Residential');
                break;
            case 'landUseBalance':
                suggestions = await getLandUseBalanceSuggestions(info.type || 'Residential');
                break;
        }
        setSuggestionState(prev => ({...prev, [fieldId]: { suggestions, isLoading: false }}));
    } catch (e) {
        console.error(`Failed to get suggestions for ${fieldId}`, e);
        setSuggestionState(prev => ({...prev, [fieldId]: { suggestions: [], isLoading: false }}));
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="bg-black text-white min-h-[600px] flex flex-col justify-between p-8 md:p-16 selection:bg-white selection:text-black">
      {!userEmail ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-12">
            <h2 className="text-5xl md:text-7xl font-sans font-light tracking-tight leading-[1.1]">
                Masterplan <span className="font-serif italic font-normal text-blue-400">Synthesis.</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
                Connect your account to access our high-fidelity urban design engine. Generate site-specific subdivisions and frameworks in seconds.
            </p>
            <button
                onClick={onLogin}
                className="group relative inline-flex items-center space-x-6 bg-white text-black font-black uppercase tracking-[0.2em] py-5 px-12 rounded-full hover:scale-105 transition-all duration-500 overflow-hidden"
            >
                <span className="relative z-10 transition-colors group-hover:text-black">Sign in with Google</span>
                <div className="w-8 h-8 rounded-full border border-black/20 flex items-center justify-center relative z-10">
                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-2.21 5.39-7.84 5.39-4.84 0-8.79-4.01-8.79-8.94s3.95-8.94 8.79-8.94c2.75 0 4.6 1.17 5.66 2.18l2.59-2.5c-1.66-1.55-3.82-2.5-8.25-2.5C5.38 1.18 0 6.56 0 13.18s5.38 12 12.48 12c7.41 0 12.32-5.21 12.32-12.55 0-.84-.09-1.49-.21-2.13l-12.11-.58z"/>
                </svg>
                </div>
            </button>
        </div>
      ) : (
        <>
            {/* Navigation Rail */}
            <div className="flex items-center space-x-12 mb-20 overflow-x-auto no-scrollbar">
                {steps.map((step, index) => (
                <button
                    key={step.id}
                    onClick={() => index <= currentStep && setCurrentStep(index)}
                    disabled={isLoading || index > currentStep}
                    className={`group relative flex flex-col items-start transition-all duration-500 disabled:opacity-30 flex-shrink-0 ${
                    index === currentStep ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                    }`}
                >
                    <span className="text-[10px] font-medium tracking-[0.3em] uppercase mb-2">0{index + 1}</span>
                    <span className="text-xs font-bold uppercase tracking-widest">{step.title}</span>
                    {index === currentStep && (
                    <motion.div 
                        layoutId="step-indicator"
                        className="absolute -bottom-4 left-0 w-8 h-[2px] bg-white text-3xl"
                    />
                    )}
                </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col justify-center">
                <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-5xl mx-auto"
                >
                    {steps[currentStep].id === 'boundary' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-8">
                        <h2 className="text-5xl md:text-7xl font-sans font-light tracking-tight leading-[1.1]">
                            Context <span className="font-serif italic font-normal text-blue-400">Imagery.</span>
                        </h2>
                        <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                            Upload a high-resolution satellite perspective. Ensure the target area is clearly <span className="text-white font-bold italic">bounded by a red line</span> for AI context extraction.
                        </p>
                        <FileUpload files={uploadedFiles} setFiles={handleFileUpload} disabled={isLoading} />
                        </div>
                        {info.satelliteImage && (
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl group"
                        >
                            <img src={info.satelliteImage} alt="Site Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                            <div className="absolute bottom-8 left-8">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Geo-Context Reference Verified</span>
                            </div>
                        </motion.div>
                        )}
                    </div>
                    ) : steps[currentStep].id === 'program' ? (
                    <div className="space-y-16">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/10 pb-12">
                        <h2 className="text-5xl md:text-7xl font-sans font-light tracking-tight leading-[1.1]">
                            Urban <span className="font-serif italic font-normal text-blue-400">Metabolism.</span>
                        </h2>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-white/40 mb-2">Total Utilization</span>
                            <div className="flex items-baseline space-x-1">
                            <span className={`text-6xl font-sans font-light ${totalPercentage === 100 ? 'text-white' : 'text-orange-500'}`}>{totalPercentage}</span>
                            <span className="text-2xl font-sans font-light text-white/40">%</span>
                            </div>
                        </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
                        {(info.landUseBreakdown || []).map((item, idx) => (
                            <div key={item.label} className="group flex flex-col space-y-6">
                            <div className="flex justify-between items-end border-b border-white/10 pb-4 group-focus-within:border-white transition-colors duration-500">
                                <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/50">{item.label}</span>
                                <span className="text-2xl font-sans font-light">{item.percentage}%</span>
                            </div>
                            <input 
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={item.percentage}
                                onChange={e => handleLandUseSliderChange(idx, parseInt(e.target.value))}
                                className="w-full h-[2px] bg-white/10 appearance-none cursor-pointer accent-white transition-all hover:bg-white/20"
                            />
                            </div>
                        ))}
                        </div>
                        {totalPercentage !== 100 && (
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-orange-500 font-bold uppercase tracking-widest text-center"
                        >
                            Adjust parameters to reach exactly 100% allocation
                        </motion.p>
                        )}
                    </div>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-20">
                        {steps[currentStep].fields.map(fieldId => {
                        const key = fieldId as keyof MasterplanProjectInfo;
                        const { suggestions, isLoading: isSuggestionsLoading } = suggestionState[fieldId] || { suggestions: [], isLoading: false };
                        
                        return (
                            <div key={fieldId} className="flex flex-col space-y-6">
                            <div className="flex items-center justify-between">
                                <label htmlFor={fieldId} className="text-[10px] font-medium tracking-[0.3em] uppercase text-white/40">
                                {fieldConfig[fieldId].label}
                                </label>
                                <AISuggestionButton
                                onClick={() => handleGetSuggestions(fieldId)}
                                isLoading={isSuggestionsLoading}
                                />
                            </div>
                            
                            <div className="relative group">
                                <textarea
                                id={fieldId}
                                value={(info[key as keyof MasterplanProjectInfo] as string) || ''}
                                onChange={e => handleChange(key, e.target.value)}
                                placeholder={fieldConfig[fieldId].placeholder}
                                rows={fieldConfig[fieldId].rows || 1}
                                className="w-full bg-transparent text-4xl md:text-5xl font-sans font-light text-white placeholder-white/10 transition-all duration-300 resize-none focus:outline-none py-2 border-b border-white/10 focus:border-white"
                                disabled={isLoading}
                                />
                                
                                <AnimatePresence>
                                {suggestions.length > 0 && !isSuggestionsLoading && (
                                    <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 flex flex-wrap gap-3"
                                    >
                                    {suggestions.map((s, i) => (
                                        <button
                                        key={i}
                                        onClick={() => handleChange(key, s)}
                                        className="text-[10px] font-medium uppercase tracking-widest text-white/50 border border-white/10 py-2.5 px-6 rounded-full hover:border-white hover:text-white transition-all duration-300 backdrop-blur-sm"
                                        >
                                        {s}
                                        </button>
                                    ))}
                                    </motion.div>
                                )}
                                </AnimatePresence>
                            </div>
                            </div>
                        );
                        })}
                    </div>
                    )}
                </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="mt-20 flex justify-between items-center border-t border-white/5 pt-12">
                <div className="flex flex-col items-start">
                    <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-white/40 mb-1">Intelligence Capacity</span>
                    <div className="flex items-center space-x-2">
                        <span className="text-xl font-sans font-bold text-white">{credits}</span>
                        <span className="text-[10px] font-medium uppercase tracking-widest text-white/30">Units Available</span>
                    </div>
                </div>

                <div className="flex items-center space-x-8">
                    <button 
                    onClick={handlePrev} 
                    disabled={currentStep === 0 || isLoading}
                    className={`flex flex-col group transition-all duration-500 ${currentStep === 0 ? 'pointer-events-none opacity-0' : 'opacity-100 hover:opacity-100'}`}
                    >
                    <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-white/40 mb-1 group-hover:text-white transition-colors">Previous</span>
                    <span className="text-sm font-bold uppercase tracking-widest group-hover:-translate-x-1 transition-transform">Chapter Back</span>
                    </button>

                    <button
                    onClick={handleNext}
                    disabled={isLoading || !isCurrentStepValid() || (isLastStep && credits < 20)}
                    className="group flex flex-col items-end text-right transition-all duration-500 disabled:opacity-20"
                    >
                    <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-white/40 mb-1 group-hover:text-white transition-colors">
                        {isLastStep ? 'Finalize Synthesis' : 'Proceed'}
                    </span>
                    <div className="flex items-center space-x-6">
                        <span className="text-xl md:text-3xl font-sans font-bold uppercase tracking-[0.1em] group-hover:-translate-x-2 transition-transform">
                        {isLoading && isLastStep ? 'Simulating Design...' : (isLastStep ? `Synthesize (-20IU)` : 'Next Stage')}
                        </span>
                        <div className="w-16 h-[1px] bg-white group-hover:w-24 transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    </div>
                    </button>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default MasterplanInputForm;
