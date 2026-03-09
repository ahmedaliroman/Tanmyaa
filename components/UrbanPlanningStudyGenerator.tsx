import React, { useState, useCallback, useEffect } from 'react';
import { generatePresentation, generateImage, refinePresentation, getSlideRefinementSuggestions } from '../services/geminiService';
import type { PresentationSlide as SlideType, UrbanPlanningProjectInfo, CaseStudyDeepDiveSlide, VisionSlide, MacroStrategySlide, NodeAssessmentSlide } from '../types';
import UrbanStudyInputForm from './UrbanStudyInputForm';
import UrbanStudySlide from './UrbanStudySlide';
import SlideNavigator from './SlideNavigator';
import ChatPanel from './ChatPanel';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';

import { useCompanyProfile } from '../hooks/useCompanyProfile';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}



interface PresentationGeneratorProps {
  onUpgrade: () => void;
}

const PresentationGenerator: React.FC<PresentationGeneratorProps> = ({ onUpgrade }) => {
  const [projectInfo, setProjectInfo] = useState<UrbanPlanningProjectInfo | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [slides, setSlides] = useState<SlideType[] | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [isGeneratingImages, setIsGeneratingImages] = useState<boolean>(false);
  const [imageGenerationProgress, setImageGenerationProgress] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isEditorMode, setIsEditorMode] = useState<boolean>(false);
  
  const { companyProfile } = useCompanyProfile();
  const { refreshProfile, profile, user, signInWithGoogle } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExportProgress, setPdfExportProgress] = useState(0);

  const [chatSuggestions, setChatSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);


  useEffect(() => {
    if (!slides || !projectInfo) return;

    const promptsMap = new Map<string, string>();

    slides.forEach(slide => {
        switch (slide.layout) {
            case 'Cover':
                 promptsMap.set('cover_image', `Cinematic, photorealistic aerial shot of ${projectInfo.location} skyline at dusk, focusing on a ${projectInfo.scale} scale, with dramatic lighting.`);
                 break;
            case 'CaseStudyDeepDive':
                if ((slide as CaseStudyDeepDiveSlide).image_prompt) {
                    promptsMap.set((slide as CaseStudyDeepDiveSlide).image_prompt, (slide as CaseStudyDeepDiveSlide).image_prompt);
                }
                break;
            case 'Vision':
                if ((slide as VisionSlide).image_prompt) {
                    promptsMap.set((slide as VisionSlide).image_prompt, (slide as VisionSlide).image_prompt);
                }
                break;
            case 'MacroStrategy':
                if ((slide as MacroStrategySlide).image_prompt) {
                    promptsMap.set((slide as MacroStrategySlide).image_prompt, (slide as MacroStrategySlide).image_prompt);
                }
                break;
            case 'NodeAssessment': {
                const s = slide as NodeAssessmentSlide;
                if(s.before_image_prompt) promptsMap.set(s.before_image_prompt, s.before_image_prompt);
                if(s.after_image_prompt) promptsMap.set(s.after_image_prompt, s.after_image_prompt);
                break;
            }
             case 'Crisis':
                promptsMap.set('crisis_image', `High-contrast, dramatic photo of ${projectInfo.mainChallenge.toLowerCase()} in ${projectInfo.location}, sun-bleached city.`);
                break;
            case 'Closing':
                promptsMap.set('closing_image', `An inspiring, futuristic image of a green, vibrant ${projectInfo.location} with people enjoying public spaces, reflecting a successful project at a ${projectInfo.scale} scale.`);
                break;
        }
    });
    
    setTotalImages(promptsMap.size);

    if (promptsMap.size > 0) {
        const fetchImagesSequentially = async () => {
            setIsGeneratingImages(true);
            let current = 0;
            setImageGenerationProgress(0);

            for (const [key, prompt] of promptsMap.entries()) {
                if (!prompt || imageUrls[key]) {
                    current++;
                    setImageGenerationProgress(current);
                    continue;
                }
                
                try {
                    const url = await generateImage(prompt);
                    setImageUrls(prev => ({ ...prev, [key]: url }));
                } catch (err) {
                    console.error(`Failed to generate image for prompt: "${prompt}"`, err);
                    setImageUrls(prev => ({ ...prev, [key]: 'error' }));
                }
                current++;
                setImageGenerationProgress(current);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            setIsGeneratingImages(false);
        };
        fetchImagesSequentially();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides, projectInfo]);

  const handleGenerate = useCallback(async (finalProjectInfo: UrbanPlanningProjectInfo) => {
    if (profile && profile.credits < 20) {
        setError("Insufficient credits. Please upgrade your plan.");
        onUpgrade();
        return;
    }

    setIsLoading(true);
    setError(null);
    setSlides(null);
    setImageUrls({});
    setProjectInfo(finalProjectInfo);
    setChatMessages([{sender: 'ai', text: "Strategic deck generated. I can refine any slide or add technical depth upon request."}]);

    try {
        const generatedSlides = await generatePresentation(finalProjectInfo, files, companyProfile);
        await refreshProfile();
        if (generatedSlides && generatedSlides.length > 0) {
            setSlides(generatedSlides);
            setCurrentIndex(0);
            setIsEditorMode(true);
        } else {
            throw new Error("The AI failed to generate any slides. Please try again with more detailed parameters.");
        }
    } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
        setIsLoading(false);
    }
  }, [files, companyProfile, profile, onUpgrade, refreshProfile]);
  
  const handleChatSend = useCallback(async (message?: string) => {
    const messageToSend = message || chatInput;
    if (!messageToSend.trim() || !slides) return;

    if (profile && profile.credits < 5) {
        setChatMessages(prev => [...prev, { sender: 'user', text: messageToSend }, { sender: 'ai', text: "Insufficient credits. Please upgrade your plan." }]);
        onUpgrade();
        return;
    }

    const userMessage: ChatMessage = { sender: 'user', text: messageToSend };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatSuggestions([]);
    setIsChatLoading(true);

    try {
        const newSlides = await refinePresentation(slides, messageToSend, currentIndex, companyProfile);
        await refreshProfile();
        setSlides(newSlides);
        setChatMessages(prev => [...prev, { sender: 'ai', text: "Technical updates processed." }]);
    } catch {
        setChatMessages(prev => [...prev, { sender: 'ai', text: "Refinement error."}]);
    } finally {
        setIsChatLoading(false);
    }
  }, [chatInput, slides, currentIndex, companyProfile, refreshProfile, profile, onUpgrade]);

  const fetchSuggestions = useCallback(async () => {
    if (isChatOpen && slides && slides[currentIndex]) {
      setIsSuggestionsLoading(true);
      setChatSuggestions([]);
      try {
        const suggestions = await getSlideRefinementSuggestions(slides[currentIndex]);
        setChatSuggestions(suggestions);
      } catch (e) {
        console.error("Failed to get chat suggestions", e);
      } finally {
        setIsSuggestionsLoading(false);
      }
    }
  }, [isChatOpen, slides, currentIndex]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);


  const handleExportPdf = async () => {
    if (!slides) return;
    setIsExportingPdf(true);
    setPdfExportProgress(0);
    setError(null);

    // Allow React to render the off-screen export container
    await new Promise(resolve => setTimeout(resolve, 500));

    const slideWidth = 1280;
    const slideHeight = 720;

    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [slideWidth, slideHeight]
    });

    try {
        for (let i = 0; i < slides.length; i++) {
            setPdfExportProgress(i + 1);
            
            const slideElement = document.getElementById(`export-slide-container-${i}`);
            if (!slideElement) {
                console.warn(`Export slide element ${i} not found.`);
                continue;
            }

            const dataUrl = await toJpeg(slideElement, {
                quality: 0.90,
                cacheBust: true,
                width: slideWidth,
                height: slideHeight,
                pixelRatio: 1.5,
            });

            if (i > 0) {
                pdf.addPage([slideWidth, slideHeight], 'landscape');
            }
            pdf.addImage(dataUrl, 'JPEG', 0, 0, slideWidth, slideHeight);
        }
        pdf.save('Tanmyaa_Presentation.pdf');
    } catch (error) {
        console.error('Error during PDF export:', error);
        setError(`Failed to export slide ${pdfExportProgress}. Please try again.`);
    } finally {
        setIsExportingPdf(false);
        setPdfExportProgress(0);
    }
  };


  const handleSlideUpdate = (slideIndex: number, fieldPath: string, value: unknown) => {
    if (!fieldPath) return;
    setSlides(prevSlides => {
        if (!prevSlides) return null;
        
        const newSlides = JSON.parse(JSON.stringify(prevSlides));
        if (!newSlides[slideIndex]) return prevSlides;
        
        const path = fieldPath.replace(/\[(\d+)\]/g, '.$1').split('.');
        const lastKey = path.pop();
        
        if (!lastKey) {
            console.error("Invalid fieldPath for update:", fieldPath);
            return prevSlides;
        }

        let currentLevel = newSlides[slideIndex];
        
        for (const key of path) {
            if (!currentLevel[key] || typeof currentLevel[key] !== 'object') {
                currentLevel[key] = {};
            }
            currentLevel = currentLevel[key];
        }
        
        currentLevel[lastKey] = value;
        
        return newSlides;
    });
  };

  const goToPrevious = useCallback(() => {
    if (!slides) return;
    setCurrentIndex(currentIndex === 0 ? slides.length - 1 : currentIndex - 1);
  }, [currentIndex, slides]);

  const goToNext = useCallback(() => {
    if (!slides) return;
    setCurrentIndex(currentIndex === slides.length - 1 ? 0 : currentIndex + 1);
  }, [currentIndex, slides]);

  return (
    <div className="flex flex-col h-full">
      {/* PDF Export Container: Renders all slides off-screen when exporting */}
      {isExportingPdf && slides && (
          <div style={{ position: 'fixed', top: '100vh', left: 0, zIndex: -1, pointerEvents: 'none', opacity: 0 }}>
              <div style={{ width: '1280px' }}>
                  {slides.map((slide, index) => (
                      <div key={`export-${index}`} id={`export-slide-container-${index}`} style={{ width: '1280px', height: '720px' }}>
                          <UrbanStudySlide 
                              slide={slide} 
                              slideNumber={index + 1} 
                              imageUrls={imageUrls} 
                              onUpdate={() => {}} // Disable updates during export
                              isActive={true} // Force active state for consistent export rendering
                          />
                      </div>
                  ))}
              </div>
          </div>
      )}
      
      <div className={`transition-all duration-500 ease-in-out ${isEditorMode ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[2000px] opacity-100'}`}>
        <UrbanStudyInputForm
          initialProjectInfo={{ location: '', scale: '', mainChallenge: '', policyContext: '', targetUsers: '', authorRole: '', specificFocus: '' }}
          onSubmit={handleGenerate}
          isLoading={isLoading}
          files={files}
          setFiles={setFiles}
          credits={profile?.credits || 0}
          userEmail={user?.email || null}
          onLogin={signInWithGoogle}
        />
      </div>
      
      <div className="mt-8 flex-grow">
        {isLoading && <Loader />}
        {error && <ErrorMessage message={error} />}

        {isGeneratingImages && (
            <div className="text-center py-4 bg-black/40 rounded-3xl shadow-2xl border border-white/10 mb-8 animate-ios-reveal">
                <p className="text-lg font-bold text-gray-200 uppercase tracking-widest">Rendering AI Visuals... ({imageGenerationProgress} / {totalImages})</p>
                <div className="w-10/12 mx-auto bg-gray-800 rounded-full h-1.5 mt-4 overflow-hidden">
                    <div className="bg-tan-bright-blue h-full rounded-full transition-all duration-500" style={{ width: `${(imageGenerationProgress / totalImages) * 100}%` }}></div>
                </div>
            </div>
        )}

        {slides ? (
          <div className="bg-transparent shadow-2xl rounded-[3rem] overflow-hidden flex flex-col h-full">
             <div className="p-4 bg-black/40 backdrop-blur-xl border-b border-white/10 flex items-center justify-between">
              <button onClick={() => setIsEditorMode(!isEditorMode)} className="bg-gray-700/80 text-gray-200 font-semibold py-2 px-5 rounded-full text-xs uppercase tracking-wider hover:bg-gray-700 transition-all flex items-center border border-gray-600/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
                {isEditorMode ? 'Parameters' : 'Hide Form'}
              </button>
              <div className="flex items-center space-x-4">
                <button onClick={handleExportPdf} disabled={isExportingPdf} className="bg-gray-700/80 text-gray-200 font-semibold py-2 px-5 rounded-full text-xs uppercase tracking-wider hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-gray-600/50 flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                   {isExportingPdf ? `Exporting... (${pdfExportProgress}/${slides.length})` : 'Export PDF'}
                </button>
                <button onClick={() => setIsChatOpen(true)} className="bg-gray-700/80 text-gray-200 font-semibold py-2 px-5 rounded-full text-xs uppercase tracking-wider hover:bg-gray-700 transition-all duration-300 border border-gray-600/50 flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                   Co-Pilot
                </button>
              </div>
            </div>

            <div className="flex-grow p-4 md:p-8 relative flex items-center justify-center min-h-[700px]">
                <div className="w-full h-full max-w-7xl relative group">
                    <div className="aspect-[16/9] w-full mx-auto relative overflow-hidden rounded-2xl shadow-2xl border border-white/10 bg-gray-800">
                        <div className="flex transition-transform duration-700 cubic-bezier(0.23, 1, 0.32, 1) h-full" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                        {slides.map((slide, index) => (
                            <div key={index} id={`study-slide-container-${index}`} className="w-full flex-shrink-0 h-full">
                                <UrbanStudySlide 
                                    slide={slide} 
                                    slideNumber={index+1} 
                                    imageUrls={imageUrls} 
                                    onUpdate={(fieldPath, value) => handleSlideUpdate(index, fieldPath, value)}
                                    isActive={index === currentIndex} />
                            </div>
                        ))}
                        </div>
                    </div>
                    {slides.length > 1 && !isExportingPdf && (
                        <>
                        <button onClick={goToPrevious} className="absolute top-1/2 -left-8 transform -translate-y-1/2 bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-tan-bright-blue text-white rounded-full p-4 z-20 transition-all opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 shadow-2xl" aria-label="Previous"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></button>
                        <button onClick={goToNext} className="absolute top-1/2 -right-8 transform -translate-y-1/2 bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-tan-bright-blue text-white rounded-full p-4 z-20 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 shadow-2xl" aria-label="Next"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></button>
                        </>
                    )}
                </div>
            </div>
             <SlideNavigator slides={slides} currentIndex={currentIndex} onSelectSlide={setCurrentIndex} />
             {isChatOpen && (
                <ChatPanel 
                    messages={chatMessages} 
                    input={chatInput} 
                    setInput={setChatInput} 
                    onSend={handleChatSend} 
                    isLoading={isChatLoading} 
                    onClose={() => setIsChatOpen(false)}
                    suggestions={chatSuggestions}
                    isSuggestionsLoading={isSuggestionsLoading}
                />
             )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PresentationGenerator;