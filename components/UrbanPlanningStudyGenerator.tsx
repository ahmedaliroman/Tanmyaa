import React, { useState, useCallback, useEffect } from 'react';
import { generatePresentation, generateImage, refinePresentation, getSlideRefinementSuggestions } from '@/services/geminiService';
import type { PresentationSlide as SlideType, UrbanPlanningProjectInfo, CaseStudyDeepDiveSlide, VisionSlide, MacroStrategySlide, NodeAssessmentSlide, BrandingInfo } from '@/types';
import UrbanStudyInputForm from './UrbanStudyInputForm';
import UrbanStudySlide from './UrbanStudySlide';
import SlideNavigator from './SlideNavigator';
import ChatPanel from './ChatPanel';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';
import GeneratorWelcome from './Welcome';

import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { useAuth } from '@/context/AuthContext';
import jsPDF from 'jspdf';
import { domToPng } from 'modern-screenshot';
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
        if (!slides || slides.length === 0) {
            throw new Error("No slides available to export.");
        }

        for (let i = 0; i < slides.length; i++) {
            setPdfExportProgress(i + 1);
            
            const slideElement = document.getElementById(`export-slide-container-${i}`);
            if (!slideElement) {
                throw new Error(`Slide ${i + 1} container not found in the DOM.`);
            }

            // Use modern-screenshot for better reliability with modern CSS (oklch)
            const dataUrl = await domToPng(slideElement, {
                width: slideWidth,
                height: slideHeight,
                scale: 1.2, // Reduced scale for smaller file size
                backgroundColor: '#0A0A0A',
                features: {
                    removeControlCharacter: true
                }
            });

            if (i > 0) {
                pdf.addPage([slideWidth, slideHeight], 'landscape');
            }
            pdf.addImage(dataUrl, 'PNG', 0, 0, slideWidth, slideHeight);
        }
        pdf.save('Tanmyaa_Presentation.pdf');
    } catch (error) {
        console.error('Error during PDF export:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(`Export Failed: ${errorMessage}. Please try again.`);
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

        const logoUrl = profile?.branding_logo || '';

        slides.forEach((slide, index) => {
            const pptxSlide = pptx.addSlide();
            pptxSlide.background = { color: '0A0A0A' };

            // Determine background image
            let bgImage = slide.image_url;
            if (!bgImage) {
                switch (slide.layout) {
                    case 'Cover': bgImage = imageUrls['cover_image']; break;
                    case 'Crisis': bgImage = imageUrls['crisis_image']; break;
                    case 'Closing': bgImage = imageUrls['closing_image']; break;
                    case 'CaseStudyDeepDive': bgImage = imageUrls[(slide as CaseStudyDeepDiveSlide).image_prompt]; break;
                    case 'Vision': bgImage = imageUrls[(slide as VisionSlide).image_prompt]; break;
                    case 'MacroStrategy': bgImage = imageUrls[(slide as MacroStrategySlide).image_prompt]; break;
                }
            }

            if (bgImage && bgImage !== 'error' && !bgImage.includes('placeholder')) {
                pptxSlide.addImage({
                    path: bgImage,
                    x: 0, y: 0, w: '100%', h: '100%',
                    sizing: { type: 'cover' }
                });
                // Add a dark overlay for readability
                pptxSlide.addShape(pptx.ShapeType.rect, {
                    x: 0, y: 0, w: '100%', h: '100%',
                    fill: { color: '000000', transparency: 70 }
                });
            }

            // Add Logo if exists
            if (logoUrl && !logoUrl.includes('placeholder')) {
                pptxSlide.addImage({
                    path: logoUrl,
                    x: 12.2, y: 0.3, w: 0.8, h: 0.8,
                    sizing: { type: 'contain' }
                });
            }

            // Add Title
            pptxSlide.addText(slide.title || 'Slide ' + (index + 1), {
                x: 0.5,
                y: 0.5,
                w: '85%',
                fontSize: 32,
                color: '3B82F6',
                bold: true,
                fontFace: 'Arial',
                margin: 0
            });

            // Add Content based on layout
            let contentY = 1.3;
            if (slide.subtitle) {
                pptxSlide.addText(slide.subtitle, {
                    x: 0.5,
                    y: contentY,
                    w: '90%',
                    fontSize: 18,
                    color: 'FFFFFF',
                    fontFace: 'Arial'
                });
                contentY += 0.5;
            }

            if (slide.description) {
                pptxSlide.addText(slide.description, {
                    x: 0.5,
                    y: contentY,
                    w: '90%',
                    fontSize: 12,
                    color: 'CCCCCC',
                    fontFace: 'Arial'
                });
                contentY += 0.7;
            }

            // Layout specific content
            switch (slide.layout) {
                case 'Cover': {
                    const s = slide as CoverSlide;
                    pptxSlide.addText(s.project_code || 'TAN-2026', { x: 0.5, y: 6.2, w: 3, fontSize: 14, color: '3B82F6', bold: true });
                    pptxSlide.addText(s.year || '2026', { x: 0.5, y: 6.5, w: 3, fontSize: 12, color: 'FFFFFF' });
                    break;
                }
                case 'ExecutiveOverview': {
                    const s = slide as ExecutiveOverviewSlide;
                    pptxSlide.addText(s.narrative, { x: 0.5, y: 2.5, w: 6, fontSize: 11, color: 'FFFFFF', margin: 10 });
                    s.key_points?.forEach((point, i) => {
                        pptxSlide.addText("• " + point, { x: 7.0, y: 2.5 + (i * 0.4), w: 5.5, fontSize: 11, color: '3B82F6' });
                    });
                    break;
                }
                case 'Crisis': {
                    const s = slide as CrisisSlide;
                    if (s.problem_statement) {
                        pptxSlide.addText("Problem Statement", { x: 0.5, y: contentY, w: '90%', fontSize: 12, color: 'EF4444', bold: true });
                        pptxSlide.addText(s.problem_statement, { x: 0.5, y: contentY + 0.3, w: '90%', fontSize: 14, color: 'FFFFFF' });
                    }
                    s.key_data_points?.forEach((dp, i) => {
                        const xPos = 0.5 + (i * 4.2);
                        pptxSlide.addShape(pptx.ShapeType.rect, { x: xPos, y: 5.0, w: 4, h: 1.5, fill: { color: 'FFFFFF', transparency: 95 }, line: { color: 'EF4444', width: 1 } });
                        pptxSlide.addText(dp.value, { x: xPos + 0.2, y: 5.2, w: 3.6, fontSize: 24, color: 'EF4444', bold: true, align: 'center' });
                        pptxSlide.addText(dp.label, { x: xPos + 0.2, y: 5.8, w: 3.6, fontSize: 10, color: 'FFFFFF', align: 'center' });
                    });
                    break;
                }
                case 'Roadmap': {
                    const s = slide as RoadmapSlide;
                    s.phases?.forEach((phase, i) => {
                        const xPos = 0.5 + (i * 4.2);
                        pptxSlide.addShape(pptx.ShapeType.rect, { x: xPos, y: 2.5, w: 4, h: 4, fill: { color: 'FFFFFF', transparency: 95 }, line: { color: '3B82F6', width: 1 } });
                        pptxSlide.addText(phase.title, { x: xPos + 0.2, y: 2.7, w: 3.6, fontSize: 16, color: '3B82F6', bold: true });
                        pptxSlide.addText(phase.timeline, { x: xPos + 0.2, y: 3.1, w: 3.6, fontSize: 11, color: 'AAAAAA', italic: true });
                        
                        let stepY = 3.5;
                        phase.action_steps?.slice(0, 4).forEach(step => {
                            pptxSlide.addText("• " + step.action, { x: xPos + 0.2, y: stepY, w: 3.6, fontSize: 10, color: 'FFFFFF' });
                            stepY += 0.3;
                        });
                        pptxSlide.addText("Outcome: " + phase.outcome, { x: xPos + 0.2, y: 6.0, w: 3.6, fontSize: 9, color: '10B981', italic: true });
                    });
                    break;
                }
                case 'GanttChartRoadmap': {
                    const s = slide as GanttChartRoadmapSlide;
                    pptxSlide.addText(`Timeline: ${s.timeline_start_year} - ${s.timeline_end_year}`, { x: 0.5, y: 2.0, w: 12, fontSize: 12, color: '3B82F6' });
                    s.phases?.forEach((phase, i) => {
                        const yPos = 2.5 + (i * 1.5);
                        pptxSlide.addText(phase.name, { x: 0.5, y: yPos, w: 3, fontSize: 14, color: 'FFFFFF', bold: true });
                        phase.deliverables?.forEach((del, j) => {
                            const xPos = 4.0 + (j * 3.0);
                            pptxSlide.addShape(pptx.ShapeType.rect, { x: xPos, y: yPos, w: 2.8, h: 1.2, fill: { color: '3B82F6', transparency: 80 } });
                            pptxSlide.addText(del.name, { x: xPos + 0.1, y: yPos + 0.1, w: 2.6, fontSize: 9, color: 'FFFFFF', bold: true });
                            pptxSlide.addText(`Q${del.start_quarter}-Q${del.end_quarter}`, { x: xPos + 0.1, y: yPos + 0.5, w: 2.6, fontSize: 8, color: 'CCCCCC' });
                        });
                    });
                    break;
                }
                case 'SWOT': {
                    const s = slide as SWOTSlide;
                    const categories = [
                        { label: 'Strengths', data: s.strengths, x: 0.5, y: 2.5, color: '10B981' },
                        { label: 'Weaknesses', data: s.weaknesses, x: 6.8, y: 2.5, color: 'EF4444' },
                        { label: 'Opportunities', data: s.opportunities, x: 0.5, y: 4.8, color: '3B82F6' },
                        { label: 'Threats', data: s.threats, x: 6.8, y: 4.8, color: 'F59E0B' }
                    ];
                    categories.forEach(cat => {
                        pptxSlide.addText(cat.label, { x: cat.x, y: cat.y, w: 6, fontSize: 18, color: cat.color, bold: true });
                        let itemY = cat.y + 0.4;
                        cat.data?.slice(0, 3).forEach(item => {
                            pptxSlide.addText("• " + item.title, { x: cat.x, y: itemY, w: 6, fontSize: 11, color: 'FFFFFF', bold: true });
                            pptxSlide.addText(item.description, { x: cat.x + 0.2, y: itemY + 0.25, w: 5.8, fontSize: 9, color: 'CCCCCC' });
                            itemY += 0.6;
                        });
                    });
                    break;
                }
                case 'PolicyLevers': {
                    const s = slide as PolicyLeversSlide;
                    s.recommendations?.slice(0, 3).forEach((rec, i) => {
                        const yPos = 2.5 + (i * 1.5);
                        pptxSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: yPos, w: 12.3, h: 1.3, fill: { color: 'FFFFFF', transparency: 95 }, line: { color: '3B82F6', width: 1 } });
                        pptxSlide.addText(rec.title, { x: 0.7, y: yPos + 0.1, w: 11.9, fontSize: 14, color: '3B82F6', bold: true });
                        pptxSlide.addText(rec.strategy, { x: 0.7, y: yPos + 0.4, w: 6, fontSize: 10, color: 'FFFFFF' });
                        pptxSlide.addText("Impact: " + rec.expected_impact, { x: 0.7, y: yPos + 0.9, w: 6, fontSize: 10, color: '10B981', bold: true });
                        pptxSlide.addText("Measurement: " + rec.measurement_framework, { x: 7.0, y: yPos + 0.4, w: 5.5, fontSize: 10, color: 'AAAAAA' });
                    });
                    break;
                }
                case 'GovernanceFramework': {
                    const s = slide as GovernanceFrameworkSlide;
                    pptxSlide.addText("Lead Agency: " + (s.lead_agency?.name || ''), { x: 0.5, y: 2.5, w: 6, fontSize: 14, color: '3B82F6', bold: true });
                    pptxSlide.addText(s.lead_agency?.rationale || '', { x: 0.5, y: 2.8, w: 6, fontSize: 10, color: 'CCCCCC' });
                    
                    pptxSlide.addText("Funding Model", { x: 0.5, y: 3.8, w: 6, fontSize: 14, color: '3B82F6', bold: true });
                    pptxSlide.addText(s.funding_model || '', { x: 0.5, y: 4.1, w: 6, fontSize: 11, color: 'FFFFFF' });

                    pptxSlide.addText("Stakeholder Roles", { x: 7.0, y: 2.5, w: 5.8, fontSize: 14, color: '3B82F6', bold: true });
                    let sY = 2.9;
                    s.stakeholders?.slice(0, 8).forEach(st => {
                        pptxSlide.addText(st.name + ": " + st.role, { x: 7.0, y: sY, w: 5.8, fontSize: 10, color: 'FFFFFF' });
                        sY += 0.3;
                    });
                    break;
                }
                case 'References': {
                    const s = slide as ReferencesSlide;
                    s.sources?.slice(0, 8).forEach((source, i) => {
                        const col = i < 4 ? 0 : 1;
                        const row = i % 4;
                        const xPos = 0.5 + (col * 6.5);
                        const yPos = 2.2 + (row * 1.2);
                        pptxSlide.addShape(pptx.ShapeType.rect, { x: xPos, y: yPos, w: 6, h: 1.1, fill: { color: 'FFFFFF', transparency: 95 } });
                        pptxSlide.addText(source.title, { x: xPos + 0.1, y: yPos + 0.1, w: 5.8, fontSize: 11, color: '3B82F6', bold: true });
                        pptxSlide.addText(source.author + " (" + source.year + ")", { x: xPos + 0.1, y: yPos + 0.4, w: 5.8, fontSize: 9, color: 'AAAAAA' });
                        pptxSlide.addText(source.relevance, { x: xPos + 0.1, y: yPos + 0.65, w: 5.8, fontSize: 8, color: 'CCCCCC', italic: true });
                    });
                    break;
                }
                case 'Closing': {
                    pptxSlide.addText("Thank You", { x: 0, y: 3.0, w: '100%', fontSize: 48, color: '3B82F6', bold: true, align: 'center' });
                    pptxSlide.addText("Strategic Urban Planning Doctrine", { x: 0, y: 4.0, w: '100%', fontSize: 18, color: 'FFFFFF', align: 'center' });
                    break;
                }
            }

            // Add a footer
            pptxSlide.addText(`${index + 1}`, {
                x: 0.5,
                y: 7.0,
                w: '90%',
                fontSize: 10,
                color: '999999',
                align: 'right'
            });
        });

        await pptx.writeFile({ fileName: 'Tanmyaa_Presentation.pptx' });
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


  const handleModifySlide = useCallback(async () => {
    setIsChatOpen(true);
    const slide = slides?.[currentIndex];
    const slideSummary = slide ? `(Current Title: "${slide.title || 'Untitled'}")` : '';
    setChatInput(`I want to modify slide ${currentIndex + 1} ${slideSummary}: `);
    
    if (slides && slides[currentIndex]) {
        setIsSuggestionsLoading(true);
        try {
            const suggestions = await getSlideRefinementSuggestions(slides[currentIndex]);
            setChatSuggestions(suggestions);
        } catch (err) {
            console.error("Failed to fetch suggestions:", err);
        } finally {
            setIsSuggestionsLoading(false);
        }
    }
  }, [currentIndex, slides]);

  useEffect(() => {
    if (isChatOpen && slides && slides[currentIndex]) {
        const fetchSuggestions = async () => {
            setIsSuggestionsLoading(true);
            try {
                const suggestions = await getSlideRefinementSuggestions(slides[currentIndex]);
                setChatSuggestions(suggestions);
            } catch (err) {
                console.error("Failed to fetch suggestions:", err);
            } finally {
                setIsSuggestionsLoading(false);
            }
        };
        fetchSuggestions();
    }
  }, [isChatOpen, currentIndex, slides]);

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
                              disableAnimations={true}
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