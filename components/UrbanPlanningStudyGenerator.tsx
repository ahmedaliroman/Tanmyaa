import React, { useState, useCallback, useEffect } from 'react';
import { generatePresentation, generateImage, refinePresentation, getSlideRefinementSuggestions } from '../services/geminiService';
import type { PresentationSlide as SlideType, UrbanPlanningProjectInfo, CaseStudyDeepDiveSlide, VisionSlide, MacroStrategySlide, NodeAssessmentSlide, BrandingInfo } from '../types';
import UrbanStudyInputForm from './UrbanStudyInputForm';
import UrbanStudySlide from './UrbanStudySlide';
import SlideNavigator from './SlideNavigator';
import ChatPanel from './ChatPanel';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';
import GeneratorWelcome from './Welcome';

import { useCompanyProfile } from '../hooks/useCompanyProfile';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../hooks/useBranding';
import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';
import pptxgen from 'pptxgenjs';

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
  const { colors, presentationTemplateUrl } = useBranding();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
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
        const branding: BrandingInfo | undefined = profile ? {
            logo: profile.branding_logo || '',
            colors: profile.branding_colors || '',
            presentation_template: profile.branding_presentation_template || '',
            presentation_template_url: profile.branding_presentation_template_url || '',
            report_template: profile.branding_report_template || '',
            report_template_url: profile.branding_report_template_url || ''
        } : undefined;

        const generatedSlides = await generatePresentation(finalProjectInfo, files, companyProfile, profile?.plan, branding);
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
        const branding: BrandingInfo | undefined = profile ? {
            logo: profile.branding_logo || '',
            colors: profile.branding_colors || '',
            presentation_template: profile.branding_presentation_template || '',
            presentation_template_url: profile.branding_presentation_template_url || '',
            report_template: profile.branding_report_template || '',
            report_template_url: profile.branding_report_template_url || ''
        } : undefined;

        const newSlides = await refinePresentation(slides, messageToSend, currentIndex, companyProfile, profile?.plan, branding);
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
        pdf.save('Presentation.pdf');
    } catch (error) {
        console.error('Error during PDF export:', error);
        setError(`Failed to export slide ${pdfExportProgress}. Please try again.`);
    } finally {
        setIsExportingPdf(false);
        setPdfExportProgress(0);
    }
  };

  const handleExportPptx = async () => {
    if (!slides) return;
    setIsExportingPptx(true);
    
    try {
        const pptx = new pptxgen();
        pptx.layout = 'LAYOUT_16x9';
        pptx.defineLayout({ name: 'TANMYAA', width: 13.33, height: 7.5 });
        pptx.layout = 'TANMYAA';

        // Extract colors from branding or use defaults
        let primaryColor = 'FFFFFF';
        let secondaryColor = '3B82F6';
        let textColor = 'CCCCCC';
        
        if (colors) {
            const hexRegex = /#([0-9A-F]{6})/gi;
            const matches = [...colors.matchAll(hexRegex)].map(m => m[1]);
            if (matches.length > 0) primaryColor = matches[0];
            if (matches.length > 1) secondaryColor = matches[1];
            if (matches.length > 2) textColor = matches[2];
        }

        const coverSlide = slides.find(s => s.layout === 'Cover') as CoverSlide | undefined;
        const globalBgSvg = coverSlide?.design_system_svg;

        slides.forEach((slide, index) => {
            const pptxSlide = pptx.addSlide();
            
            // Apply branded template background if available and is an image
            if (presentationTemplateUrl && (presentationTemplateUrl.endsWith('.png') || presentationTemplateUrl.endsWith('.jpg') || presentationTemplateUrl.endsWith('.jpeg'))) {
                pptxSlide.background = { path: presentationTemplateUrl };
            } else if (globalBgSvg) {
                const svgBase64 = btoa(unescape(encodeURIComponent(globalBgSvg)));
                pptxSlide.background = { data: `image/svg+xml;base64,${svgBase64}` };
            } else {
                pptxSlide.background = { color: '0A0A0A' };
            }

            // Add Title with animation
            pptxSlide.addText(slide.title || 'Slide ' + (index + 1), {
                x: 0.5,
                y: 0.5,
                w: '90%',
                fontSize: 32,
                color: primaryColor,
                bold: true,
                fontFace: 'Arial',
                // @ts-expect-error - pptxgenjs types might not include anim in all versions, but it works
                anim: { type: 'fade', duration: 1 }
            });

            // Add Content based on layout (simplified)
            let contentY = 1.5;
            if (slide.subtitle) {
                pptxSlide.addText(slide.subtitle, {
                    x: 0.5,
                    y: contentY,
                    w: '90%',
                    fontSize: 18,
                    color: secondaryColor,
                    fontFace: 'Arial',
                    // @ts-expect-error - pptxgenjs types might not include anim in all versions, but it works
                    anim: { type: 'fly', dir: 'b', duration: 1, delay: 0.5 }
                });
                contentY += 0.8;
            }

            if (slide.description) {
                pptxSlide.addText(slide.description, {
                    x: 0.5,
                    y: contentY,
                    w: '90%',
                    fontSize: 14,
                    color: textColor,
                    fontFace: 'Arial',
                    // @ts-expect-error - pptxgenjs types might not include anim in all versions, but it works
                    anim: { type: 'fade', duration: 1.5, delay: 1 }
                });
            }

            // Add a footer
            pptxSlide.addText(`Strategic Planning | ${index + 1}`, {
                x: 0.5,
                y: 7.0,
                w: '90%',
                fontSize: 10,
                color: '666666',
                align: 'right'
            });
        });

        await pptx.writeFile({ fileName: 'Presentation.pptx' });
    } catch (error) {
        console.error('Error during PPTX export:', error);
        setError('Failed to export PPTX. Please try again.');
    } finally {
        setIsExportingPptx(false);
    }
  };

  const handleDeleteSlide = useCallback(() => {
    if (!slides || slides.length <= 1) return;
    
    const newSlides = [...slides];
    newSlides.splice(currentIndex, 1);
    setSlides(newSlides);
    
    // Adjust current index if needed
    if (currentIndex >= newSlides.length) {
        setCurrentIndex(newSlides.length - 1);
    }
  }, [slides, currentIndex]);

  const handleAddSlide = useCallback(async () => {
    const prompt = window.prompt("What should the new slide be about? (e.g., 'Add a slide about traffic impact analysis')");
    if (!prompt || !slides) return;

    setIsChatLoading(true);
    try {
        const newSlides = await refinePresentation(slides, `Add a new slide: ${prompt}`, currentIndex, companyProfile);
        setSlides(newSlides);
        setCurrentIndex(newSlides.length - 1); // Go to the newly added slide
        setChatMessages(prev => [...prev, { sender: 'ai', text: `New slide added: ${prompt}` }]);
    } catch (err) {
        console.error("Failed to add slide:", err);
        setError("Failed to add slide. Please try again.");
    } finally {
        setIsChatLoading(false);
    }
  }, [slides, currentIndex, companyProfile]);


  const handleModifySlide = useCallback(() => {
    setIsChatOpen(true);
    setChatInput(`I want to modify slide ${currentIndex + 1}: `);
  }, [currentIndex]);

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
                  {slides.map((slide, index) => {
                      const coverSlide = slides.find(s => s.layout === 'Cover') as CoverSlide | undefined;
                      const globalBgSvg = coverSlide?.design_system_svg;
                      return (
                      <div key={`export-${index}`} id={`export-slide-container-${index}`} style={{ width: '1280px', height: '720px' }}>
                          <UrbanStudySlide 
                              slide={slide} 
                              slideNumber={index + 1} 
                              imageUrls={imageUrls} 
                              onUpdate={() => {}} // Disable updates during export
                              isActive={true} // Force active state for consistent export rendering
                              disableAnimations={true}
                              globalBgSvg={globalBgSvg}
                          />
                      </div>
                      );
                  })}
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

        {!isLoading && !error && !slides && (
          <GeneratorWelcome 
            title="Urban Planning Presentation"
            description="Generate a comprehensive, structured presentation from problem to implementation. This tool creates a multi-slide presentation covering case studies, vision, macro strategies, and node assessments."
          />
        )}

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
                <button onClick={handleDeleteSlide} disabled={slides.length <= 1} className="bg-red-900/40 text-red-200 font-semibold py-2 px-5 rounded-full text-xs uppercase tracking-wider hover:bg-red-800 transition-all duration-300 border border-red-700/30 flex items-center disabled:opacity-30">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   Delete
                </button>
                <button onClick={handleModifySlide} className="bg-blue-900/40 text-blue-200 font-semibold py-2 px-5 rounded-full text-xs uppercase tracking-wider hover:bg-blue-800 transition-all duration-300 border border-blue-700/30 flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                   Modify
                </button>
                <button onClick={handleAddSlide} className="bg-green-900/40 text-green-200 font-semibold py-2 px-5 rounded-full text-xs uppercase tracking-wider hover:bg-green-800 transition-all duration-300 border border-green-700/30 flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                   Add Slide
                </button>
                <button onClick={handleExportPdf} disabled={isExportingPdf} className="bg-gray-700/80 text-gray-200 font-semibold py-2 px-5 rounded-full text-xs uppercase tracking-wider hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-gray-600/50 flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                   {isExportingPdf ? `Exporting... (${pdfExportProgress}/${slides.length})` : 'PDF'}
                </button>
                <button onClick={handleExportPptx} disabled={isExportingPptx} className="bg-gray-700/80 text-gray-200 font-semibold py-2 px-5 rounded-full text-xs uppercase tracking-wider hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-gray-600/50 flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                   {isExportingPptx ? 'Exporting...' : 'PPTX'}
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
                        {slides.map((slide, index) => {
                            const coverSlide = slides.find(s => s.layout === 'Cover') as CoverSlide | undefined;
                            const globalBgSvg = coverSlide?.design_system_svg;
                            return (
                            <div key={index} id={`study-slide-container-${index}`} className="w-full flex-shrink-0 h-full">
                                <UrbanStudySlide 
                                    slide={slide} 
                                    slideNumber={index+1} 
                                    imageUrls={imageUrls} 
                                    onUpdate={(fieldPath, value) => handleSlideUpdate(index, fieldPath, value)}
                                    isActive={index === currentIndex}
                                    globalBgSvg={globalBgSvg} />
                            </div>
                            );
                        })}
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