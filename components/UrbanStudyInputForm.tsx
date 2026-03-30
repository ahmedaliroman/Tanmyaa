
import React, { useState, useEffect } from 'react';
import type { UrbanPlanningProjectInfo } from '../types';
import FileUpload from './FileUpload';
import { getSceneSuggestions, getLocationSuggestions, getChallengeSuggestions, getScaleSuggestions, getPolicyContextSuggestions, getSpecificFocusSuggestions, getAudienceSuggestions, getAuthorRoleSuggestions } from '../services/geminiService';
import AISuggestionButton from './AISuggestionButton';

interface InputFormProps {
  initialProjectInfo: UrbanPlanningProjectInfo;
  onSubmit: (finalProjectInfo: UrbanPlanningProjectInfo) => void;
  isLoading: boolean;
  files: File[];
  setFiles: (files: File[] | ((prevFiles: File[]) => File[])) => void;
  credits: number;
  userEmail: string | null;
  onLogin: () => void;
}

const steps = [
    { 
        id: 'scene',
        title: 'Set The Scene',
        fields: ['location', 'scale'],
    },
    { 
        id: 'challenge', 
        title: 'Define The Challenge', 
        fields: ['mainChallenge', 'policyContext', 'specificFocus'],
    },
    { 
        id: 'audience',
        title: 'Identify The Audience',
        fields: ['targetUsers', 'authorRole'],
    },
    {
        id: 'sources',
        title: 'Provide Sources',
        fields: [],
    }
];

const fieldConfig: Record<string, { label: string; placeholder: string; rows: number }> = {
    location: { label: 'Location', placeholder: 'e.g., Downtown Riverfront, Springfield', rows: 1 },
    scale: { label: 'Scale', placeholder: 'e.g., City Corridor / District', rows: 1 },
    mainChallenge: { label: 'Main Challenge', placeholder: 'e.g., Mobility inequality, urban sprawl, heritage loss', rows: 2 },
    policyContext: { label: 'Policy Context', placeholder: 'e.g., City Vision 2040, climate action goals', rows: 4 },
    targetUsers: { label: 'Presentation Audience', placeholder: 'e.g., City Council, Investors, Academic Supervisor', rows: 3 },
    authorRole: { label: 'Your Role (Optional)', placeholder: 'e.g., Student, Urban Planner, Consultant. This helps tailor the content.', rows: 2 },
    specificFocus: { label: 'Specific Focus or Questions', placeholder: 'e.g., How can we integrate smart city tech? What are the precedents for public-private partnerships in this context?', rows: 2 },
};

type SuggestionState = {
    [key: string]: {
        suggestions: string[];
        isLoading: boolean;
    }
}

const UrbanStudyInputForm: React.FC<InputFormProps> = ({ initialProjectInfo, onSubmit, isLoading, files, setFiles, credits, userEmail, onLogin }) => {
  const [projectInfo, setProjectInfo] = useState<UrbanPlanningProjectInfo>(() => {
    const saved = localStorage.getItem('urban_study_form_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved form data", e);
      }
    }
    return initialProjectInfo;
  });

  useEffect(() => {
    localStorage.setItem('urban_study_form_data', JSON.stringify(projectInfo));
  }, [projectInfo]);

  const [currentStep, setCurrentStep] = useState(0);

  const [suggestionState, setSuggestionState] = useState<SuggestionState>({
    scene: { suggestions: [], isLoading: false },
    location: { suggestions: [], isLoading: false },
    scale: { suggestions: [], isLoading: false },
    mainChallenge: { suggestions: [], isLoading: false },
    policyContext: { suggestions: [], isLoading: false },
    specificFocus: { suggestions: [], isLoading: false },
    targetUsers: { suggestions: [], isLoading: false },
    authorRole: { suggestions: [], isLoading: false },
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSubmit(projectInfo);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
    
  const handleChange = (id: keyof UrbanPlanningProjectInfo, value: string) => {
    setProjectInfo({ ...projectInfo, [id]: value });
  };

  const requiredFields: (keyof UrbanPlanningProjectInfo)[] = ['location', 'scale', 'mainChallenge', 'policyContext', 'targetUsers'];

  const isCurrentStepValid = () => {
      const step = steps[currentStep];
      if (step.id === 'sources') {
          return true;
      }

      return step.fields.every(fieldId => {
          const key = fieldId as keyof UrbanPlanningProjectInfo;
          if (requiredFields.includes(key)) {
            const value = projectInfo[key];
            return value && value.trim() !== '';
          }
          return true;
      });
  };
  
  const handleGetSuggestions = async (fieldId: keyof UrbanPlanningProjectInfo) => {
    setSuggestionState(prev => ({...prev, [fieldId]: { suggestions: [], isLoading: true }}));
    try {
        let suggestions: string[] = [];
        switch(fieldId) {
            case 'scene':
                suggestions = await getSceneSuggestions();
                break;
            case 'location':
                suggestions = await getLocationSuggestions();
                break;
            case 'scale':
                if (projectInfo.location) suggestions = await getScaleSuggestions(projectInfo.location);
                break;
            case 'mainChallenge':
                if (projectInfo.location && projectInfo.scale) suggestions = await getChallengeSuggestions(projectInfo.location, projectInfo.scale);
                break;
            case 'policyContext':
                if (projectInfo.location && projectInfo.mainChallenge) suggestions = await getPolicyContextSuggestions(projectInfo.location, projectInfo.mainChallenge);
                break;
            case 'specificFocus':
                if (projectInfo.location && projectInfo.mainChallenge) suggestions = await getSpecificFocusSuggestions(projectInfo.location, projectInfo.mainChallenge);
                break;
            case 'targetUsers':
                 if (projectInfo.location && projectInfo.mainChallenge) suggestions = await getAudienceSuggestions(projectInfo.location, projectInfo.mainChallenge);
                break;
            case 'authorRole':
                suggestions = await getAuthorRoleSuggestions();
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
    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-3xl shadow-2xl p-6 md:p-8">
      {!userEmail ? (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-white mb-2">Sign in Required</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            To prevent misuse and track your generation credits, please sign in with your Gmail account.
          </p>
          <button
            onClick={onLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg shadow-blue-900/20 flex items-center space-x-2 mx-auto"
          >
            <span>Sign in with Google</span>
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center space-x-2 sm:space-x-6 mb-8">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(index)}
            disabled={isLoading}
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

      <div key={currentStep} className="min-h-[250px] animate-fade-in">
        <div className="bg-black/40 rounded-xl border border-gray-800 overflow-hidden">
            {steps[currentStep].id !== 'sources' ? (
                steps[currentStep].fields.map(fieldId => {
                    const key = fieldId as keyof UrbanPlanningProjectInfo;
                    const { suggestions, isLoading: isSuggestionsLoading } = suggestionState[key] || { suggestions: [], isLoading: false };

                    const canSuggest = () => {
                        switch(key) {
                            case 'scene':
                            case 'location':
                                return true;
                            case 'scale': return !!projectInfo.location;
                            case 'mainChallenge': return !!projectInfo.location && !!projectInfo.scale;
                            case 'policyContext': 
                            case 'specificFocus': 
                            case 'targetUsers': return !!projectInfo.location && !!projectInfo.mainChallenge;
                            case 'authorRole': return true;
                            default: return false;
                        }
                    }

                    return (
                        <div key={fieldId} className="border-b border-gray-800 last:border-b-0 p-4">
                             <div className="flex items-center justify-between mb-1">
                                <label htmlFor={fieldId} className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{fieldConfig[key].label}</label>
                                {suggestionState[key] && (
                                     <AISuggestionButton
                                        onClick={() => handleGetSuggestions(key)}
                                        isLoading={isSuggestionsLoading}
                                        disabled={!canSuggest()}
                                    />
                                )}
                            </div>
                            <textarea
                                id={fieldId}
                                value={projectInfo[key] || ''}
                                onChange={e => handleChange(key, e.target.value)}
                                placeholder={fieldConfig[key].placeholder}
                                rows={fieldConfig[key].rows || 1}
                                className="w-full bg-transparent text-white placeholder-gray-500 transition duration-200 resize-none focus:outline-none focus:ring-0"
                                disabled={isLoading}
                            />
                             {isSuggestionsLoading ? <p className="text-xs text-gray-400 italic mt-2">Thinking of suggestions...</p> : suggestions.length > 0 && (
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
                })
            ) : (
              <div className="p-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Provide Information Sources</label>
                <p className="text-gray-400 text-sm mb-4">
                  Upload documents or reports. The system will treat these as primary sources and triangulate findings with its internal knowledge base.
                </p>
                <FileUpload files={files} setFiles={setFiles} disabled={isLoading} />
              </div>
            )}
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center">
        <div>
          {currentStep > 0 && (
            <button onClick={handlePrev} className="text-gray-400 hover:text-white font-medium py-2 px-4 rounded-full transition duration-300">
              Back
            </button>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            {credits} credits remaining.
          </div>
          <button
            onClick={handleNext}
            disabled={isLoading || !isCurrentStepValid() || (isLastStep && credits < 20)}
            className="bg-gray-700/80 text-gray-200 font-semibold py-2 px-5 rounded-full hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50"
          >
            {isLoading && isLastStep ? 'Generating...' : (isLastStep ? 'Generate Study' : 'Next')}
          </button>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default UrbanStudyInputForm;