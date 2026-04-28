
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
    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-3xl shadow-2xl p-6 md:p-8 min-h-[600px] flex flex-col justify-between">
      {!userEmail ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                Masterplan <span className="text-blue-400">Synthesis.</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
                Connect your account to access our high-fidelity urban design engine. Generate site-specific subdivisions and frameworks in seconds.
            </p>
            <button
                onClick={onLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg shadow-blue-900/20 flex items-center space-x-2"
            >
                <span>Sign in with Google</span>
            </button>
        </div>
      ) : (
        <>
            {/* Navigation Rail */}
            <div className="flex items-center justify-center space-x-2 sm:space-x-6 mb-8">
                {steps.map((step, index) => (
                <button
                    key={step.id}
                    onClick={() => index <= currentStep && setCurrentStep(index)}
                    disabled={isLoading || index > currentStep}
                    className={`text-center py-2 px-4 text-sm font-medium transition-colors duration-300 disabled:opacity-50 ${
                    index === currentStep
                        ? 'bg-gray-700/80 text-white rounded-lg border border-gray-600/50 shadow-lg'
                        : 'text-gray-400 hover:text-white'
                    }`}
                >
                    {step.title}
                </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col justify-center min-h-[300px]">
                <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-5xl mx-auto"
                >
                    {steps[currentStep].id === 'boundary' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold text-white tracking-tight">
                                Context <span className="text-blue-400 italic">Imagery.</span>
                            </h2>
                            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                                Upload a high-resolution satellite perspective. Ensure the target area is clearly <span className="text-white font-bold italic">bounded by a red line</span> for AI context extraction.
                            </p>
                            <FileUpload files={uploadedFiles} setFiles={handleFileUpload} disabled={isLoading} />
                        </div>
                        {info.satelliteImage && (
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative aspect-video rounded-2xl overflow-hidden border border-gray-700 shadow-xl"
                        >
                            <img src={info.satelliteImage} alt="Site Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-4 left-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Geo-Context Reference Verified</span>
                            </div>
                        </motion.div>
                        )}
                    </div>
                    ) : steps[currentStep].id === 'program' ? (
                    <div className="space-y-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-800">
                            <h2 className="text-3xl font-bold text-white tracking-tight">
                                Urban <span className="text-blue-400 italic">Metabolism.</span>
                            </h2>
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Utilization</span>
                                <div className="flex items-baseline space-x-1">
                                    <span className={`text-4xl font-bold ${totalPercentage === 100 ? 'text-white' : 'text-orange-500'}`}>{totalPercentage}</span>
                                    <span className="text-xl font-medium text-gray-400">%</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {(info.landUseBreakdown || []).map((item, idx) => (
                            <div key={item.label} className="bg-black/20 p-4 rounded-xl border border-gray-800">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{item.label}</span>
                                    <span className="text-sm font-bold text-white">{item.percentage}%</span>
                                </div>
                                <input 
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={item.percentage}
                                    onChange={e => handleLandUseSliderChange(idx, parseInt(e.target.value))}
                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                        ))}
                        </div>
                        {totalPercentage !== 100 && (
                            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest text-center">
                                Adjust parameters to reach exactly 100% allocation
                            </p>
                        )}
                    </div>
                    ) : (
                    <div className="bg-black/40 rounded-xl border border-gray-800 overflow-hidden">
                        {steps[currentStep].fields.map(fieldId => {
                        const key = fieldId as keyof MasterplanProjectInfo;
                        const { suggestions, isLoading: isSuggestionsLoading } = suggestionState[fieldId] || { suggestions: [], isLoading: false };
                        
                        return (
                            <div key={fieldId} className="border-b border-gray-800 last:border-b-0 p-4">
                                <div className="flex items-center justify-between mb-1">
                                    <label htmlFor={fieldId} className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        {fieldConfig[fieldId].label}
                                    </label>
                                    <AISuggestionButton
                                        onClick={() => handleGetSuggestions(fieldId)}
                                        isLoading={isSuggestionsLoading}
                                    />
                                </div>
                                <textarea
                                    id={fieldId}
                                    value={(info[key as keyof MasterplanProjectInfo] as string) || ''}
                                    onChange={e => handleChange(key, e.target.value)}
                                    placeholder={fieldConfig[fieldId].placeholder}
                                    rows={fieldConfig[fieldId].rows || 1}
                                    className="w-full bg-transparent text-white placeholder-gray-500 transition duration-200 resize-none focus:outline-none focus:ring-0 text-xl font-medium"
                                    disabled={isLoading}
                                />
                                {suggestions.length > 0 && !isSuggestionsLoading && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {suggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleChange(key, s)}
                                                className="text-xs bg-gray-700/80 text-gray-200 py-1 px-3 rounded-full hover:bg-gray-600 transition"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                        })}
                    </div>
                    )}
                </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-800">
                <div className="flex flex-col items-start translate-y-1">
                    <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-white/40 mb-1">Intelligence Capacity</span>
                    <div className="flex items-center space-x-2">
                        <span className="text-xl font-sans font-bold text-white">{credits}</span>
                        <span className="text-[10px] font-medium uppercase tracking-widest text-white/30">Units Available</span>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {currentStep > 0 && (
                        <button 
                            onClick={handlePrev} 
                            disabled={isLoading}
                            className="text-gray-400 hover:text-white font-medium py-2 px-4 rounded-full transition duration-300"
                        >
                            Back
                        </button>
                    )}

                    <button
                        onClick={handleNext}
                        disabled={isLoading || !isCurrentStepValid() || (isLastStep && credits < 20)}
                        className="bg-gray-700/80 text-gray-200 font-semibold py-2 px-5 rounded-full hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50 flex items-center space-x-2"
                    >
                        <span>{isLoading && isLastStep ? 'Simulating Design...' : (isLastStep ? `Synthesize (-20IU)` : 'Next')}</span>
                        {isLastStep && !isLoading && <div className="w-8 h-[1px] bg-white transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />}
                    </button>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default MasterplanInputForm;
