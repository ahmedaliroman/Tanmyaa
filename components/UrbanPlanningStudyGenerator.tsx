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

const ResponsiveSlideContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;
            const parent = containerRef.current.parentElement;
            if (!parent) return;

            const parentWidth = parent.clientWidth;
            const parentHeight = parent.clientHeight;
            
            // Design size (16:9)
            const designWidth = 1280;
            const designHeight = 720;

            const scaleX = parentWidth / designWidth;
            const scaleY = parentHeight / designHeight;
            
            // Use the smaller scale factor to ensure it fits both ways
            setScale(Math.min(scaleX, scaleY, 1)); // Don't scale up beyond 1:1 if space is massive
        };

        const observer = new ResizeObserver(updateScale);
        if (containerRef.current?.parentElement) {
            observer.observe(containerRef.current.parentElement);
        }
        updateScale();

        return () => observer.disconnect();
    }, []);

    return (
        <div 
            ref={containerRef}
            className="origin-center flex items-center justify-center"
            style={{ 
                width: '1280px', 
                height: '720px', 
                transform: `scale(${scale})`,
                flexShrink: 0
            }}
        >
            {children}
        </div>
    );
};

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
  const [exportProgress, setExportProgress] = useState(0);

  const [chatSuggestions, setChatSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);


  useEffect(() => {
    if (!slides || !projectInfo) return;

    const promptsMap = new Map<string, string>();

    slides.forEach(slide => {
        switch (slide.layout) {
            case 'Cover':
                if ((slide as CoverSlide).image_prompt) {
                    promptsMap.set((slide as CoverSlide).image_prompt, (slide as CoverSlide).image_prompt);
                } else {
                    promptsMap.set('cover_image', `Professional architectural rendering of ${projectInfo.location} at a ${projectInfo.scale} scale, focusing on ${projectInfo.mainChallenge.toLowerCase()}.`);
                }
                break;
            case 'ExecutiveOverview':
                if ((slide as ExecutiveOverviewSlide).image_prompt) {
                    promptsMap.set((slide as ExecutiveOverviewSlide).image_prompt, (slide as ExecutiveOverviewSlide).image_prompt);
                } else {
                    promptsMap.set('overview_image', `Professional, clean architectural rendering of a master plan for ${projectInfo.location}, focusing on ${projectInfo.scale} scale.`);
                }
                break;
            case 'Crisis':
                if ((slide as CrisisSlide).image_prompt) {
                    promptsMap.set((slide as CrisisSlide).image_prompt, (slide as CrisisSlide).image_prompt);
                } else {
                    promptsMap.set('crisis_image', `High-contrast, dramatic photo of ${projectInfo.mainChallenge.toLowerCase()} in ${projectInfo.location}, sun-bleached city.`);
                }
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
            case 'Closing':
                if ((slide as ClosingSlide).image_prompt) {
                    promptsMap.set((slide as ClosingSlide).image_prompt, (slide as ClosingSlide).image_prompt);
                } else {
                    promptsMap.set('closing_image', `An inspiring, futuristic image of a green, vibrant ${projectInfo.location} with people enjoying public spaces, reflecting a successful project at a ${projectInfo.scale} scale.`);
                }
                break;
            default:
                // No image generation for other layouts
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
    setExportProgress(0);
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
            setExportProgress(i + 1);
            
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
        setExportProgress(0);
    }
  };

  const handleExportPptx = async () => {
    if (!slides) return;
    setIsExportingPptx(true);
    setExportProgress(0);
    setError(null);
    
    try {
        const pptx = new pptxgen();
        pptx.layout = 'LAYOUT_16x9';
        pptx.defineLayout({ name: 'TANMYAA', width: 13.33, height: 7.5 });
        pptx.layout = 'TANMYAA';

        const logoUrl = profile?.branding_logo || '';
        const accentLight = 'D2C1B6';
        const accentCream = 'F5F5DC';
        const primaryMedium = '456882';

        for (let i = 0; i < slides.length; i++) {
            setExportProgress(i + 1);
            const slide = slides[i];
            const pptxSlide = pptx.addSlide();
            pptxSlide.background = { color: '0A0A0A' };

            // Determine background image
            let bgImage = slide.image_url;
            if (!bgImage) {
                switch (slide.layout) {
                    case 'Cover': bgImage = imageUrls['cover_image']; break;
                    case 'ExecutiveOverview': bgImage = imageUrls['overview_image']; break;
                    case 'Crisis': bgImage = imageUrls['crisis_image']; break;
                    case 'SWOT': bgImage = imageUrls['swot_image']; break;
                    case 'CaseStudyDeepDive': bgImage = imageUrls[(slide as CaseStudyDeepDiveSlide).image_prompt]; break;
                    case 'Vision': bgImage = imageUrls[(slide as VisionSlide).image_prompt]; break;
                    case 'MacroStrategy': bgImage = imageUrls[(slide as MacroStrategySlide).image_prompt]; break;
                    case 'EquityAnalysis': bgImage = imageUrls['equity_image']; break;
                    case 'References': bgImage = imageUrls['references_image']; break;
                    case 'ScenarioComparison': bgImage = imageUrls['scenario_image']; break;
                    case 'RiskAssessment': bgImage = imageUrls['risk_image']; break;
                    case 'Roadmap': bgImage = imageUrls['roadmap_image']; break;
                    case 'ProjectedImpact': bgImage = imageUrls['impact_image']; break;
                    case 'FiscalFramework': bgImage = imageUrls['fiscal_image']; break;
                    case 'PolicyLevers': bgImage = imageUrls['policy_image']; break;
                    case 'GovernanceFramework': bgImage = imageUrls['governance_image']; break;
                    case 'Process': bgImage = imageUrls['process_image']; break;
                    case 'Closing': bgImage = imageUrls['closing_image']; break;
                }
            }

            // Node Assessment has two images
            if (slide.layout === 'NodeAssessment') {
                const s = slide as NodeAssessmentSlide;
                const beforeImg = s.before_image_url || imageUrls[s.before_image_prompt];
                const afterImg = s.after_image_url || imageUrls[s.after_image_prompt];
                
                if (beforeImg) {
                    const imgProps = beforeImg.startsWith('data:') ? { data: beforeImg } : { path: beforeImg };
                    pptxSlide.addImage({ ...imgProps, x: 0, y: 0, w: 6.66, h: 7.5, sizing: { type: 'cover' } });
                    pptxSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 6.66, h: 7.5, fill: { color: '000000', transparency: 80 } });
                }
                if (afterImg) {
                    const imgProps = afterImg.startsWith('data:') ? { data: afterImg } : { path: afterImg };
                    pptxSlide.addImage({ ...imgProps, x: 6.66, y: 0, w: 6.67, h: 7.5, sizing: { type: 'cover' } });
                    pptxSlide.addShape(pptx.ShapeType.rect, { x: 6.66, y: 0, w: 6.67, h: 7.5, fill: { color: '000000', transparency: 75 } });
                }
            } else if (bgImage && bgImage !== 'error' && !bgImage.includes('placeholder')) {
                const imgProps = bgImage.startsWith('data:') ? { data: bgImage } : { path: bgImage };
                pptxSlide.addImage({ ...imgProps, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover' } });
                pptxSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '000000', transparency: 75 } });
            }

            // Add Logo if exists
            if (logoUrl && !logoUrl.includes('placeholder')) {
                const imgProps = logoUrl.startsWith('data:') ? { data: logoUrl } : { path: logoUrl };
                pptxSlide.addImage({ ...imgProps, x: 12.2, y: 0.3, w: 0.8, h: 0.8, sizing: { type: 'contain' } });
            }

            // Layout specific content
            switch (slide.layout) {
                case 'Cover': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'Slide ' + (i + 1), { x: 0.5, y: 2.5, w: 12.33, fontSize: 54, color: accentCream, bold: true, align: 'center' });
                    pptxSlide.addText(s.subtitle || '', { x: 0.5, y: 3.8, w: 12.33, fontSize: 24, color: accentLight, align: 'center' });
                    pptxSlide.addShape(pptx.ShapeType.rect, { x: 6.16, y: 4.8, w: 1, h: 0.05, fill: { color: primaryMedium } });
                    pptxSlide.addText(`${s.project_code || 'TAN-2026'} • ${s.year || '2026'}`, { x: 0.5, y: 5.2, w: 12.33, fontSize: 14, color: accentLight, bold: true, align: 'center' });
                    break;
                }
                case 'ExecutiveOverview': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'Executive Overview', { x: 0.8, y: 0.5, w: 11.73, h: 1.2, fontSize: 36, color: accentLight, bold: true });
                    pptxSlide.addText(s.narrative || '', { x: 0.8, y: 1.8, w: 5.5, h: 5.0, fontSize: 16, color: accentCream, margin: 10 });
                    const keyPoints = s.key_points || [];
                    const pointSpacing = Math.min(1.0, 5.0 / Math.max(1, keyPoints.length));
                    keyPoints.forEach((point: string, idx: number) => {
                        const yPos = 1.8 + (idx * pointSpacing);
                        const ellipseSize = Math.min(0.4, pointSpacing * 0.8);
                        pptxSlide.addShape(pptx.ShapeType.ellipse, { x: 6.8, y: yPos, w: ellipseSize, h: ellipseSize, fill: { color: primaryMedium } });
                        pptxSlide.addText(`${idx + 1}`, { x: 6.8, y: yPos, w: ellipseSize, h: ellipseSize, fontSize: Math.max(8, Math.min(12, ellipseSize * 30)), color: accentCream, bold: true, align: 'center' });
                        pptxSlide.addText(point, { x: 6.8 + ellipseSize + 0.2, y: yPos, w: 5.5 - ellipseSize - 0.2, h: pointSpacing, fontSize: Math.max(10, Math.min(16, pointSpacing * 20)), color: accentCream });
                    });
                    break;
                }
                case 'NodeAssessment': {
                    const s = slide as NodeAssessmentSlide;
                    pptxSlide.addText(s.title || 'Node Assessment', { x: 0.8, y: 0.8, w: 11.73, h: 0.6, fontSize: 36, color: accentLight, bold: true, align: 'center' });
                    pptxSlide.addText(s.site_rationale || '', { x: 0.8, y: 1.5, w: 11.73, h: 0.8, fontSize: 18, color: accentCream, italic: true, align: 'center' });
                    
                    const metrics = s.metrics || [];
                    const metricCount = metrics.length;
                    
                    // Adjust sizing based on count
                    let ellipseSize = 2.2;
                    let fontSizeVal = 24;
                    let fontSizeLabel = 10;
                    let cols = 3;
                    
                    if (metricCount > 4) {
                        ellipseSize = 1.6;
                        fontSizeVal = 18;
                        fontSizeLabel = 8;
                        cols = 4;
                    } else if (metricCount > 3) {
                        ellipseSize = 1.8;
                        fontSizeVal = 20;
                        fontSizeLabel = 9;
                        cols = 4;
                    }
                    
                    const colWidth = 11.73 / cols;
                    
                    metrics.forEach((m, idx) => {
                        const row = Math.floor(idx / cols);
                        const col = idx % cols;
                        const xPos = 0.8 + (col * colWidth) + (colWidth - ellipseSize) / 2;
                        const yPos = 2.5 + (row * (ellipseSize + 0.5));
                        
                        pptxSlide.addShape(pptx.ShapeType.ellipse, { 
                            x: xPos, y: yPos, w: ellipseSize, h: ellipseSize, 
                            fill: { color: 'FFFFFF', transparency: 90 }, 
                            line: { color: 'FFFFFF', width: 1 } 
                        });
                        pptxSlide.addText(m.value, { 
                            x: xPos, y: yPos + (ellipseSize * 0.3), w: ellipseSize, h: ellipseSize * 0.3,
                            fontSize: fontSizeVal, color: accentCream, bold: true, align: 'center' 
                        });
                        pptxSlide.addText(m.label, { 
                            x: xPos, y: yPos + (ellipseSize * 0.6), w: ellipseSize, h: ellipseSize * 0.3,
                            fontSize: fontSizeLabel, color: accentCream, align: 'center', bold: true 
                        });
                    });
                    
                    pptxSlide.addText(s.conclusion || '', { x: 0.8, y: 6.5, w: 11.73, h: 0.6, fontSize: 20, color: accentLight, bold: true, align: 'center' });
                    break;
                }
                case 'SWOT': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'SWOT Analysis', { x: 0.8, y: 0.8, w: 11.73, h: 0.8, fontSize: 36, color: accentLight, bold: true });
                    const cats = [
                        { label: 'STRENGTHS', data: s.strengths, x: 0.8, y: 1.8, color: '10B981' },
                        { label: 'WEAKNESSES', data: s.weaknesses, x: 6.8, y: 1.8, color: 'EF4444' },
                        { label: 'OPPORTUNITIES', data: s.opportunities, x: 0.8, y: 4.5, color: '3B82F6' },
                        { label: 'THREATS', data: s.threats, x: 6.8, y: 4.5, color: 'F59E0B' }
                    ];
                    cats.forEach(cat => {
                        pptxSlide.addText(cat.label, { x: cat.x, y: cat.y, w: 5.7, h: 0.4, fontSize: 18, color: cat.color, bold: true });
                        pptxSlide.addShape(pptx.ShapeType.line, { x: cat.x, y: cat.y + 0.4, w: 5.7, h: 0, line: { color: primaryMedium, width: 1 } });
                        const items = cat.data || [];
                        const itemSpacing = Math.min(0.8, 2.4 / Math.max(1, items.length));
                        items.forEach((item: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                            const yPos = cat.y + 0.6 + (idx * itemSpacing);
                            pptxSlide.addText(item.title, { x: cat.x, y: yPos, w: 5.7, h: itemSpacing * 0.3, fontSize: Math.max(10, Math.min(14, itemSpacing * 20)), color: accentCream, bold: true });
                            pptxSlide.addText(item.description, { x: cat.x, y: yPos + (itemSpacing * 0.3), w: 5.7, h: itemSpacing * 0.7, fontSize: Math.max(8, Math.min(12, itemSpacing * 15)), color: 'CCCCCC' });
                        });
                    });
                    break;
                }

                case 'CaseStudyDeepDive': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'Case Study', { x: 0.8, y: 0.5, w: 11.73, h: 1.2, fontSize: 36, color: accentLight, bold: true });
                    pptxSlide.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.8, w: 6, h: 5.0, fill: { color: '000000', transparency: 50 } });
                    pptxSlide.addText(s.introduction || '', { x: 1.0, y: 2.0, w: 5.6, h: 1.5, fontSize: 16, color: accentCream });
                    pptxSlide.addText('PROVEN APPLICATION', { x: 1.0, y: 3.5, w: 5.6, h: 0.4, fontSize: 14, color: accentLight, bold: true });
                    const findings = s.key_findings || [];
                    const findingSpacing = Math.min(0.8, 2.0 / Math.max(1, findings.length));
                    findings.forEach((finding: string, idx: number) => {
                        pptxSlide.addText(`• ${finding}`, { x: 1.0, y: 3.9 + (idx * findingSpacing), w: 5.6, h: findingSpacing, fontSize: Math.max(10, Math.min(14, findingSpacing * 40)), color: accentCream });
                    });
                    pptxSlide.addText(s.conclusion || '', { x: 1.0, y: 6.0, w: 5.6, h: 0.8, fontSize: 16, color: accentLight, bold: true });
                    break;
                }
                case 'Vision': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'Vision', { x: 0.8, y: 0.8, w: 11.73, h: 1.5, fontSize: 36, color: accentLight, bold: true, align: 'center' });
                    pptxSlide.addText(s.vision_statement || '', { x: 0.8, y: 2.5, w: 11.73, h: 4.0, fontSize: 36, color: accentCream, bold: true, align: 'center' });
                    break;
                }
                case 'MacroStrategy': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'Macro Strategy', { x: 0.8, y: 0.5, w: 11.73, h: 1.2, fontSize: 36, color: accentLight, bold: true });
                    pptxSlide.addText(s.strategic_intent || '', { x: 0.8, y: 1.5, w: 11.73, h: 1.0, fontSize: 18, color: accentCream, italic: true });
                    const strats = s.strategies || [];
                    const colWidth = 11.73 / Math.max(1, strats.length);
                    strats.forEach((strat: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const xPos = 0.8 + (idx * colWidth);
                        pptxSlide.addShape(pptx.ShapeType.rect, { x: xPos, y: 2.5, w: colWidth - 0.2, h: 4.5, fill: { color: '000000', transparency: 50 } });
                        pptxSlide.addText(strat.title, { x: xPos + 0.2, y: 2.7, w: colWidth - 0.6, h: 0.8, fontSize: Math.max(12, Math.min(20, colWidth * 5)), color: accentLight, bold: true });
                        pptxSlide.addText(strat.description, { x: xPos + 0.2, y: 3.5, w: colWidth - 0.6, h: 2.0, fontSize: Math.max(10, Math.min(14, colWidth * 4)), color: accentCream });
                        pptxSlide.addText('RATIONALE', { x: xPos + 0.2, y: 5.5, w: colWidth - 0.6, h: 0.3, fontSize: Math.max(8, Math.min(12, colWidth * 3)), color: 'CCCCCC', bold: true });
                        pptxSlide.addText(strat.rationale, { x: xPos + 0.2, y: 5.8, w: colWidth - 0.6, h: 1.0, fontSize: Math.max(8, Math.min(12, colWidth * 3)), color: accentCream, italic: true });
                    });
                    break;
                }
                case 'EquityAnalysis': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'Equity Analysis', { x: 0.8, y: 0.5, w: 11.73, h: 1.2, fontSize: 36, color: accentLight, bold: true });
                    pptxSlide.addText('Distributional Impacts', { x: 0.8, y: 1.8, w: 5.5, h: 0.5, fontSize: 20, color: accentLight, bold: true });
                    const impacts = s.distributional_impacts || [];
                    const impactSpacing = Math.min(1.5, 4.5 / Math.max(1, impacts.length));
                    impacts.forEach((imp: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        pptxSlide.addText(imp.group, { x: 0.8, y: 2.5 + (idx * impactSpacing), w: 5.5, h: 0.4, fontSize: Math.max(12, Math.min(16, impactSpacing * 14)), color: accentCream, bold: true });
                        pptxSlide.addText(imp.impact, { x: 0.8, y: 2.5 + (idx * impactSpacing) + 0.4, w: 5.5, h: impactSpacing - 0.4, fontSize: Math.max(10, Math.min(14, impactSpacing * 12)), color: 'CCCCCC' });
                    });
                    
                    pptxSlide.addText('Mitigation Strategies', { x: 6.8, y: 1.8, w: 5.5, h: 0.5, fontSize: 20, color: accentLight, bold: true });
                    const strats = s.mitigation_strategies || [];
                    const stratSpacing = Math.min(1.0, 4.5 / Math.max(1, strats.length));
                    strats.forEach((strat: string, idx: number) => {
                        pptxSlide.addText(`• ${strat}`, { x: 6.8, y: 2.5 + (idx * stratSpacing), w: 5.5, h: stratSpacing, fontSize: Math.max(10, Math.min(16, stratSpacing * 20)), color: accentCream });
                    });
                    break;
                }
                case 'ScenarioComparison': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'Scenario Comparison', { x: 0.8, y: 0.5, w: 11.73, h: 1.2, fontSize: 36, color: accentLight, bold: true });
                    const scenarios = s.scenarios || [];
                    const colWidth = 11.73 / Math.max(1, scenarios.length);
                    scenarios.forEach((scen: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const xPos = 0.8 + (idx * colWidth);
                        pptxSlide.addShape(pptx.ShapeType.rect, { x: xPos, y: 1.8, w: colWidth - 0.2, h: 5.0, fill: { color: '000000', transparency: 50 } });
                        pptxSlide.addText(scen.title, { x: xPos + 0.2, y: 2.0, w: colWidth - 0.6, h: 0.8, fontSize: Math.max(12, Math.min(20, colWidth * 5)), color: accentCream, bold: true, align: 'center' });
                        pptxSlide.addText(scen.description, { x: xPos + 0.2, y: 2.8, w: colWidth - 0.6, h: 1.5, fontSize: Math.max(8, Math.min(14, colWidth * 4)), color: 'CCCCCC' });
                        pptxSlide.addText(`Cost: ${scen.cost}`, { x: xPos + 0.2, y: 4.5, w: colWidth - 0.6, h: 0.5, fontSize: Math.max(10, Math.min(16, colWidth * 4)), color: accentLight, bold: true });
                        pptxSlide.addText(`Risk: ${scen.risk}`, { x: xPos + 0.2, y: 5.0, w: colWidth - 0.6, h: 0.5, fontSize: Math.max(8, Math.min(14, colWidth * 4)), color: 'EF4444' });
                        pptxSlide.addText(`ROI: ${scen.roi}`, { x: xPos + 0.2, y: 5.5, w: colWidth - 0.6, h: 0.5, fontSize: Math.max(8, Math.min(14, colWidth * 4)), color: '10B981' });
                    });
                    break;
                }
                case 'RiskAssessment': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'Risk Assessment', { x: 0.8, y: 0.8, w: 11.73, h: 0.8, fontSize: 36, color: accentLight, bold: true });
                    const risks = s.risks || [];
                    const rows = Math.ceil(risks.length / 2);
                    const rowHeight = Math.min(2.6, 5.5 / Math.max(1, rows));
                    risks.forEach((risk: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const row = Math.floor(idx / 2);
                        const col = idx % 2;
                        const xPos = 0.8 + (col * 6.0);
                        const yPos = 1.8 + (row * rowHeight);
                        pptxSlide.addShape(pptx.ShapeType.rect, { x: xPos, y: yPos, w: 5.7, h: rowHeight - 0.3, fill: { color: '000000', transparency: 50 } });
                        pptxSlide.addText(risk.category, { x: xPos + 0.2, y: yPos + (rowHeight * 0.05), w: 5.3, h: rowHeight * 0.15, fontSize: Math.max(12, Math.min(16, rowHeight * 6)), color: accentLight, bold: true });
                        pptxSlide.addText(risk.description, { x: xPos + 0.2, y: yPos + (rowHeight * 0.2), w: 5.3, h: rowHeight * 0.35, fontSize: Math.max(10, Math.min(14, rowHeight * 5)), color: accentCream });
                        pptxSlide.addText('MITIGATION:', { x: xPos + 0.2, y: yPos + (rowHeight * 0.55), w: 5.3, h: rowHeight * 0.15, fontSize: Math.max(8, Math.min(12, rowHeight * 4)), color: 'CCCCCC', bold: true });
                        pptxSlide.addText(risk.mitigation, { x: xPos + 0.2, y: yPos + (rowHeight * 0.7), w: 5.3, h: rowHeight * 0.25, fontSize: Math.max(10, Math.min(14, rowHeight * 5)), color: '10B981' });
                    });
                    break;
                }
                case 'Roadmap': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'Implementation Doctrine', { x: 0.8, y: 0.8, w: 11.73, h: 0.8, fontSize: 36, color: accentLight, bold: true });
                    const phases = s.phases || [];
                    const colWidth = 11.73 / Math.max(1, phases.length);
                    phases.forEach((phase: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const xPos = 0.8 + (idx * colWidth);
                        pptxSlide.addShape(pptx.ShapeType.rect, { x: xPos, y: 1.8, w: colWidth - 0.2, h: 5.0, fill: { color: '000000', transparency: 50 } });
                        pptxSlide.addText(phase.title || `Phase ${idx + 1}`, { x: xPos + 0.2, y: 2.0, w: colWidth - 0.6, h: 0.3, fontSize: Math.max(12, Math.min(18, colWidth * 5)), color: accentCream, bold: true });
                        pptxSlide.addText(phase.timeline || phase.timeframe || '', { x: xPos + 0.2, y: 2.3, w: colWidth - 0.6, h: 0.3, fontSize: Math.max(10, Math.min(14, colWidth * 4)), color: 'CCCCCC', bold: true });
                        
                        let currentY = 2.7;
                        pptxSlide.addText('Action Steps & KPIs:', { x: xPos + 0.2, y: currentY, w: colWidth - 0.6, h: 0.3, fontSize: Math.max(10, Math.min(14, colWidth * 4)), color: 'CCCCCC', bold: true });
                        currentY += 0.3;
                        
                        const actionSteps = phase.action_steps || [];
                        let totalLines = 0;
                        const charsPerLine = Math.max(15, (colWidth - 0.6) * 12);
                        const estimatedLines = actionSteps.map((step: string | { action: string; kpi?: string }) => {
                            const actionText = typeof step === 'string' ? step : step.action;
                            const kpiText = typeof step === 'string' ? '' : step.kpi;
                            const lines = Math.ceil(actionText.length / charsPerLine) + (kpiText ? Math.ceil(kpiText.length / charsPerLine) : 0);
                            totalLines += lines;
                            return lines;
                        });
                        
                        const availableHeight = 2.5;
                        const heightPerLine = Math.min(0.25, availableHeight / Math.max(1, totalLines));
                        const fontSize = Math.max(6, Math.min(11, heightPerLine * 50));
                        
                        actionSteps.forEach((step: string | { action: string; kpi?: string }, sIdx: number) => {
                            const actionText = typeof step === 'string' ? step : step.action;
                            const kpiText = typeof step === 'string' ? '' : step.kpi;
                            const lines = estimatedLines[sIdx];
                            const stepHeight = lines * heightPerLine;
                            const actionLines = Math.ceil(actionText.length / charsPerLine);
                            
                            pptxSlide.addText(`• ${actionText}`, { x: xPos + 0.2, y: currentY, w: colWidth - 0.6, h: actionLines * heightPerLine, fontSize: fontSize, color: accentCream });
                            if (kpiText) {
                                pptxSlide.addText(`KPI: ${kpiText}`, { x: xPos + 0.4, y: currentY + (actionLines * heightPerLine), w: colWidth - 0.8, h: (lines - actionLines) * heightPerLine, fontSize: Math.max(5, fontSize - 2), color: '3B82F6', italic: true });
                            }
                            currentY += stepHeight;
                        });
                        
                        pptxSlide.addText('OUTCOME:', { x: xPos + 0.2, y: 5.5, w: colWidth - 0.6, h: 0.3, fontSize: Math.max(8, Math.min(12, colWidth * 3)), color: 'CCCCCC', bold: true });
                        pptxSlide.addText(phase.outcome || '', { x: xPos + 0.2, y: 5.8, w: colWidth - 0.6, h: 0.8, fontSize: Math.max(10, Math.min(14, colWidth * 4)), color: accentCream, bold: true });
                    });
                    break;
                }
                case 'ProjectedImpact': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'Projected Impact', { x: 0.8, y: 0.5, w: 11.73, h: 1.2, fontSize: 36, color: accentLight, bold: true });
                    const metrics = s.metrics || [];
                    const colWidth = 11.73 / Math.max(1, metrics.length);
                    metrics.forEach((metric: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const xPos = 0.8 + (idx * colWidth);
                        pptxSlide.addShape(pptx.ShapeType.rect, { x: xPos, y: 1.8, w: colWidth - 0.2, h: 5.0, fill: { color: '000000', transparency: 50 } });
                        pptxSlide.addText(metric.label, { x: xPos + 0.2, y: 2.0, w: colWidth - 0.6, h: 0.8, fontSize: Math.max(12, Math.min(18, colWidth * 5)), color: accentLight, bold: true });
                        pptxSlide.addText('BASELINE', { x: xPos + 0.2, y: 3.0, w: (colWidth - 0.6) / 2, h: 0.3, fontSize: Math.max(8, Math.min(12, colWidth * 3)), color: 'CCCCCC' });
                        pptxSlide.addText(metric.baseline, { x: xPos + 0.2, y: 3.3, w: (colWidth - 0.6) / 2, h: 1.0, fontSize: Math.max(14, Math.min(24, colWidth * 6)), color: accentCream, bold: true });
                        pptxSlide.addText('PROJECTED', { x: xPos + 0.2 + (colWidth - 0.6) / 2, y: 3.0, w: (colWidth - 0.6) / 2, h: 0.3, fontSize: Math.max(8, Math.min(12, colWidth * 3)), color: 'CCCCCC' });
                        pptxSlide.addText(metric.projected, { x: xPos + 0.2 + (colWidth - 0.6) / 2, y: 3.3, w: (colWidth - 0.6) / 2, h: 1.0, fontSize: Math.max(14, Math.min(24, colWidth * 6)), color: '10B981', bold: true });
                        pptxSlide.addText(`Timeframe: ${metric.timeframe}`, { x: xPos + 0.2, y: 4.5, w: colWidth - 0.6, h: 0.4, fontSize: Math.max(10, Math.min(14, colWidth * 4)), color: 'CCCCCC' });
                        pptxSlide.addText(`Assumption: ${metric.assumption}`, { x: xPos + 0.2, y: 5.0, w: colWidth - 0.6, h: 1.5, fontSize: Math.max(8, Math.min(12, colWidth * 3)), color: 'CCCCCC', italic: true });
                    });
                    break;
                }
                case 'FiscalFramework': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'Capital Allocation & Value Capture Mechanism', { x: 0.8, y: 0.5, w: 11.73, h: 1.2, fontSize: 36, color: accentLight, bold: true });
                    const comps = s.components || [];
                    const rowHeight = Math.min(1.0, 4.5 / Math.max(1, comps.length));
                    
                    // Header
                    pptxSlide.addText('COMPONENT', { x: 0.8, y: 1.8, w: 3, h: 0.5, fontSize: 14, color: 'CCCCCC', bold: true });
                    pptxSlide.addText('CAPEX', { x: 3.8, y: 1.8, w: 2, h: 0.5, fontSize: 14, color: 'CCCCCC', bold: true });
                    pptxSlide.addText('OPEX', { x: 5.8, y: 1.8, w: 2, h: 0.5, fontSize: 14, color: 'CCCCCC', bold: true });
                    pptxSlide.addText('FUNDING SOURCE', { x: 7.8, y: 1.8, w: 2.5, h: 0.5, fontSize: 14, color: 'CCCCCC', bold: true });
                    pptxSlide.addText('RECOVERY MECHANISM', { x: 10.3, y: 1.8, w: 2.2, h: 0.5, fontSize: 14, color: 'CCCCCC', bold: true });
                    
                    comps.forEach((comp: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const yPos = 2.5 + (idx * rowHeight);
                        pptxSlide.addShape(pptx.ShapeType.line, { x: 0.8, y: yPos - 0.2, w: 11.73, h: 0, line: { color: '333333', width: 1 } });
                        pptxSlide.addText(comp.component, { x: 0.8, y: yPos, w: 3, h: rowHeight, fontSize: Math.max(10, Math.min(14, rowHeight * 20)), color: accentCream, bold: true });
                        pptxSlide.addText(comp.capex, { x: 3.8, y: yPos, w: 2, h: rowHeight, fontSize: Math.max(10, Math.min(14, rowHeight * 20)), color: accentCream });
                        pptxSlide.addText(comp.opex, { x: 5.8, y: yPos, w: 2, h: rowHeight, fontSize: Math.max(10, Math.min(14, rowHeight * 20)), color: accentCream });
                        pptxSlide.addText(comp.funding_source, { x: 7.8, y: yPos, w: 2.5, h: rowHeight, fontSize: Math.max(10, Math.min(14, rowHeight * 20)), color: accentCream });
                        pptxSlide.addText(comp.recovery_mechanism, { x: 10.3, y: yPos, w: 2.2, h: rowHeight, fontSize: Math.max(9, Math.min(12, rowHeight * 18)), color: 'CCCCCC' });
                    });
                    break;
                }
                case 'PolicyLevers': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'Policy Levers', { x: 0.8, y: 0.5, w: 11.73, h: 1.2, fontSize: 36, color: accentLight, bold: true });
                    const levers = s.levers || [];
                    const rowHeight = Math.min(1.5, 5.5 / Math.max(1, levers.length));
                    levers.forEach((lever: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const yPos = 1.8 + (idx * rowHeight);
                        pptxSlide.addShape(pptx.ShapeType.rect, { x: 0.8, y: yPos, w: 10.93, h: rowHeight - 0.2, fill: { color: '000000', transparency: 50 } });
                        pptxSlide.addText(lever.policy, { x: 1.0, y: yPos + (rowHeight * 0.1), w: 3.5, h: rowHeight - 0.4, fontSize: Math.max(12, Math.min(18, rowHeight * 12)), color: accentLight, bold: true });
                        pptxSlide.addText('MECHANISM:', { x: 4.7, y: yPos + (rowHeight * 0.1), w: 3.5, h: rowHeight * 0.2, fontSize: Math.max(8, Math.min(12, rowHeight * 8)), color: 'CCCCCC', bold: true });
                        pptxSlide.addText(lever.mechanism, { x: 4.7, y: yPos + (rowHeight * 0.3), w: 3.5, h: rowHeight * 0.6, fontSize: Math.max(10, Math.min(14, rowHeight * 10)), color: accentCream });
                        pptxSlide.addText('IMPACT:', { x: 8.4, y: yPos + (rowHeight * 0.1), w: 3.1, h: rowHeight * 0.2, fontSize: Math.max(8, Math.min(12, rowHeight * 8)), color: 'CCCCCC', bold: true });
                        pptxSlide.addText(lever.impact, { x: 8.4, y: yPos + (rowHeight * 0.3), w: 3.1, h: rowHeight * 0.6, fontSize: Math.max(10, Math.min(14, rowHeight * 10)), color: '10B981' });
                    });
                    break;
                }
                case 'GovernanceFramework': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'Governance Framework', { x: 0.8, y: 0.8, w: 11.73, h: 0.8, fontSize: 36, color: accentLight, bold: true });
                    pptxSlide.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.8, w: 5.5, h: 5.0, fill: { color: '000000', transparency: 50 } });
                    pptxSlide.addText('Lead Agency', { x: 1.0, y: 2.0, w: 5.1, h: 0.4, fontSize: 16, color: accentLight, bold: true });
                    pptxSlide.addText(s.lead_agency || '', { x: 1.0, y: 2.4, w: 5.1, h: 0.8, fontSize: 18, color: accentCream, bold: true });
                    
                    pptxSlide.addText('Funding Model', { x: 1.0, y: 3.4, w: 5.1, h: 0.4, fontSize: 16, color: accentLight, bold: true });
                    pptxSlide.addText(s.funding_model || '', { x: 1.0, y: 3.8, w: 5.1, h: 0.8, fontSize: 16, color: accentCream });
                    
                    pptxSlide.addText('Regulatory Changes', { x: 1.0, y: 4.8, w: 5.1, h: 0.4, fontSize: 16, color: accentLight, bold: true });
                    pptxSlide.addText(s.regulatory_changes || '', { x: 1.0, y: 5.2, w: 5.1, h: 1.4, fontSize: 16, color: accentCream });
                    
                    pptxSlide.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.8, w: 5.73, h: 5.0, fill: { color: '000000', transparency: 50 } });
                    pptxSlide.addText('Key Stakeholder Roles', { x: 7.0, y: 2.0, w: 5.33, h: 0.4, fontSize: 18, color: accentLight, bold: true });
                    const roles = s.stakeholder_roles || [];
                    const roleSpacing = Math.min(0.8, 4.0 / Math.max(1, roles.length));
                    roles.forEach((role: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const yPos = 2.6 + (idx * roleSpacing);
                        pptxSlide.addText(role.stakeholder, { x: 7.0, y: yPos, w: 2.2, h: roleSpacing, fontSize: Math.max(10, Math.min(14, roleSpacing * 20)), color: accentCream, bold: true });
                        pptxSlide.addText(role.role, { x: 9.4, y: yPos, w: 3.0, h: roleSpacing, fontSize: Math.max(10, Math.min(14, roleSpacing * 20)), color: 'CCCCCC' });
                    });
                    break;
                }

                case 'GanttChartRoadmap': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'Implementation Timeline', { x: 0.8, y: 0.5, w: 11.73, fontSize: 32, color: accentLight, bold: true });
                    
                    const startYear = parseInt(s.timeline_start_year) || 2024;
                    const endYear = parseInt(s.timeline_end_year) || 2026;
                    const yearsCount = Math.max(1, endYear - startYear + 1);
                    const totalQuarters = yearsCount * 4;
                    
                    // Draw Timeline Header
                    const chartX = 2.5;
                    const chartW = 10.0;
                    const quarterW = chartW / totalQuarters;
                    
                    for (let i = 0; i < yearsCount; i++) {
                        const xPos = chartX + (i * (chartW / yearsCount));
                        pptxSlide.addText(String(startYear + i), { x: xPos, y: 1.2, w: chartW / yearsCount, fontSize: 14, color: accentCream, bold: true, align: 'center' });
                        pptxSlide.addShape(pptx.ShapeType.line, { x: xPos, y: 1.1, w: 0, h: 6.5, line: { color: 'FFFFFF', transparency: 80, width: 1 } });
                    }
                    pptxSlide.addShape(pptx.ShapeType.line, { x: chartX + chartW, y: 1.1, w: 0, h: 6.5, line: { color: 'FFFFFF', transparency: 80, width: 1 } });

                    const phases = s.phases || [];
                    const phaseColors = ['3B82F6', '10B981', 'F59E0B', '8B5CF6', 'EF4444', '06B6D4'];
                    
                    const availableHeight = 5.5; // from 1.6 to 7.1
                    const phaseHeight = Math.min(1.8, availableHeight / Math.max(1, phases.length));

                    phases.forEach((phase: any, pIdx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const yPos = 1.6 + (pIdx * phaseHeight);
                        const color = phaseColors[pIdx % phaseColors.length];
                        
                        // Phase Name
                        const phaseNameFontSize = Math.max(8, Math.min(14, phaseHeight * 15));
                        pptxSlide.addText(phase.name, { x: 0.5, y: yPos, w: 1.8, h: phaseHeight, fontSize: phaseNameFontSize, color: 'FFFFFF', bold: true, align: 'right', valign: 'middle' });
                        
                        // Calculate Phase Start/End
                        const deliverables = phase.deliverables || [];
                        let minQ = totalQuarters;
                        let maxQ = 0;
                        
                        const parseQ = (qStr: string) => {
                            const qMatch = qStr.match(/Q(\d)/i);
                            const yMatch = qStr.match(/(\d{4})/);
                            if (qMatch && yMatch) {
                                const q = parseInt(qMatch[1]) - 1;
                                const y = parseInt(yMatch[1]);
                                return (y - startYear) * 4 + q;
                            }
                            return -1;
                        };

                        deliverables.forEach((d: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                            const sQ = parseQ(d.start_quarter);
                            const eQ = parseQ(d.end_quarter);
                            if (sQ !== -1) minQ = Math.min(minQ, sQ);
                            if (eQ !== -1) maxQ = Math.max(maxQ, eQ);
                        });

                        if (minQ <= maxQ) {
                            const barX = chartX + (minQ * quarterW);
                            const barW = (maxQ - minQ + 1) * quarterW;
                            const barH = Math.min(0.4, phaseHeight * 0.25);
                            pptxSlide.addShape(pptx.ShapeType.rect, { x: barX, y: yPos, w: barW, h: barH, fill: { color: color } });
                            
                            // Deliverables as small tags below
                            const maxDeliverableHeight = phaseHeight - barH - 0.1;
                            const deliverableSpacing = maxDeliverableHeight / Math.max(1, deliverables.length);
                            const deliverableH = Math.min(0.25, deliverableSpacing * 0.8);

                            deliverables.forEach((d: any, dIdx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                                const dsQ = parseQ(d.start_quarter);
                                const deQ = parseQ(d.end_quarter);
                                if (dsQ !== -1) {
                                    const dBarX = chartX + (dsQ * quarterW);
                                    const dBarW = (deQ - dsQ + 1) * quarterW;
                                    const dyPos = yPos + barH + 0.1 + (dIdx * deliverableSpacing);
                                    
                                    pptxSlide.addShape(pptx.ShapeType.rect, { x: dBarX, y: dyPos, w: Math.max(dBarW, 1.5), h: deliverableH, fill: { color: '000000', transparency: 40 }, line: { color: color, width: 1 } });
                                    pptxSlide.addText(d.name, { x: dBarX + 0.1, y: dyPos, w: Math.max(dBarW, 1.5) - 0.1, h: deliverableH, fontSize: Math.max(6, Math.min(9, deliverableH * 40)), color: 'FFFFFF', bold: true, valign: 'middle' });
                                }
                            });
                        }
                    });
                    break;
                }
                case 'References': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'References', { x: 0.8, y: 0.8, w: 11.73, fontSize: 36, color: accentLight, bold: true });
                    const sources = s.sources || [];
                    const rows = Math.ceil(sources.length / 2);
                    const rowHeight = Math.min(1.5, 5.5 / Math.max(1, rows));
                    sources.forEach((source: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const row = Math.floor(idx / 2);
                        const col = idx % 2;
                        const xPos = 0.8 + (col * 6.0);
                        const yPos = 1.8 + (row * rowHeight);
                        pptxSlide.addShape(pptx.ShapeType.rect, { x: xPos, y: yPos, w: 5.7, h: rowHeight - 0.2, fill: { color: '000000', transparency: 50 } });
                        pptxSlide.addText(source.title, { x: xPos + 0.2, y: yPos + (rowHeight * 0.05), w: 5.3, h: rowHeight * 0.35, fontSize: Math.max(10, Math.min(14, rowHeight * 10)), color: accentCream, bold: true });
                        pptxSlide.addText(`${source.author} • ${source.year}`, { x: xPos + 0.2, y: yPos + (rowHeight * 0.4), w: 5.3, h: rowHeight * 0.2, fontSize: Math.max(8, Math.min(12, rowHeight * 8)), color: 'CCCCCC' });
                        pptxSlide.addText(source.relevance, { x: xPos + 0.2, y: yPos + (rowHeight * 0.6), w: 5.3, h: rowHeight * 0.35, fontSize: Math.max(8, Math.min(12, rowHeight * 8)), color: '10B981', italic: true });
                    });
                    break;
                }
                case 'Crisis': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'Problem Statement', { x: 0.8, y: 0.8, w: 11.73, fontSize: 36, color: accentLight, bold: true });
                    pptxSlide.addText(s.problem_statement || '', { x: 0.8, y: 1.8, w: 11.73, h: 1.5, fontSize: 24, color: accentCream, italic: true });
                    const points = s.key_data_points || [];
                    const colWidth = 11.73 / Math.max(1, points.length);
                    points.forEach((pt: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const xPos = 0.8 + (idx * colWidth);
                        pptxSlide.addText(pt.value, { x: xPos, y: 3.5, w: colWidth - 0.2, fontSize: Math.max(16, Math.min(48, colWidth * 12)), color: accentCream, bold: true, align: 'center' });
                        pptxSlide.addText(pt.label, { x: xPos, y: 4.5, w: colWidth - 0.2, fontSize: Math.max(10, Math.min(16, colWidth * 4)), color: accentCream, bold: true, align: 'center' });
                        pptxSlide.addText(pt.description, { x: xPos, y: 5.0, w: colWidth - 0.2, h: 1.5, fontSize: Math.max(8, Math.min(12, colWidth * 3)), color: 'CCCCCC', align: 'center' });
                    });
                    break;
                }
                case 'Process': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'Process', { x: 0.8, y: 0.8, w: 11.73, fontSize: 36, color: accentLight, bold: true });
                    pptxSlide.addText(s.subtitle || '', { x: 0.8, y: 1.5, w: 11.73, fontSize: 18, color: 'CCCCCC' });
                    
                    const steps = s.steps || [];
                    const colWidth = 11.73 / Math.max(1, steps.length);
                    steps.forEach((step: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const xPos = 0.8 + (idx * colWidth);
                        pptxSlide.addShape(pptx.ShapeType.rect, { x: xPos, y: 2.2, w: colWidth - 0.2, h: 4.0, fill: { color: '000000', transparency: 50 } });
                        pptxSlide.addShape(pptx.ShapeType.ellipse, { x: xPos - 0.2, y: 2.0, w: 0.6, h: 0.6, fill: { color: primaryMedium } });
                        pptxSlide.addText(`${step.step_number || idx + 1}`, { x: xPos - 0.2, y: 2.0, w: 0.6, h: 0.6, fontSize: 14, color: 'FFFFFF', bold: true, align: 'center' });
                        pptxSlide.addText(step.title, { x: xPos + 0.2, y: 2.3, w: colWidth - 0.6, h: 0.8, fontSize: Math.max(10, Math.min(18, colWidth * 5)), color: accentCream, bold: true });
                        pptxSlide.addText(step.description, { x: xPos + 0.2, y: 3.2, w: colWidth - 0.6, h: 2.8, fontSize: Math.max(8, Math.min(14, colWidth * 4)), color: 'CCCCCC' });
                    });
                    
                    if (s.analytic_reflection) {
                        pptxSlide.addShape(pptx.ShapeType.rect, { x: 0.8, y: 6.5, w: 11.73, h: 0.8, fill: { color: '000000', transparency: 70 } });
                        pptxSlide.addText(s.analytic_reflection, { x: 1.0, y: 6.6, w: 11.33, h: 0.6, fontSize: 14, color: '10B981', italic: true });
                    }
                    break;
                }
                case 'Closing': {
                    const s = slide as any; // eslint-disable-line @typescript-eslint/no-explicit-any
                    pptxSlide.addText(s.title || 'Closing', { x: 0.8, y: 2.5, w: 11.73, h: 1.0, fontSize: 54, color: accentCream, bold: true, align: 'center' });
                    pptxSlide.addText(s.subtitle || '', { x: 0.8, y: 3.8, w: 11.73, h: 1.0, fontSize: 28, color: accentLight, align: 'center' });
                    pptxSlide.addText(s.contact_info || '', { x: 0.8, y: 6.5, w: 11.73, h: 0.5, fontSize: 16, color: 'CCCCCC', align: 'center' });
                    break;
                }
                default: {
                    pptxSlide.addText(slide.title || 'Slide ' + (i + 1), { x: 0.8, y: 0.8, w: 11.73, h: 0.8, fontSize: 36, color: accentLight, bold: true });
                    pptxSlide.addText(slide.description || '', { x: 0.8, y: 1.8, w: 11.73, h: 5.0, fontSize: 18, color: accentCream });
                }
            }
        }

        await pptx.writeFile({ fileName: 'Tanmyaa_Presentation.pptx' });
    } catch (error) {
        console.error('Error during PPTX export:', error);
        setError(`PPTX Export Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        setIsExportingPptx(false);
        setExportProgress(0);
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
      {/* PDF/PPTX Export Container: Renders all slides off-screen when exporting */}
      {(isExportingPdf || isExportingPptx) && slides && (
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
                   {isExportingPdf ? `Exporting... (${exportProgress}/${slides.length})` : 'PDF'}
                </button>
                <button onClick={handleExportPptx} disabled={isExportingPptx} className="bg-gray-700/80 text-gray-200 font-semibold py-2 px-5 rounded-full text-xs uppercase tracking-wider hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-gray-600/50 flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                   {isExportingPptx ? `Exporting... (${exportProgress}/${slides.length})` : 'PPTX'}
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
                            <div key={index} id={`study-slide-container-${index}`} className="w-full flex-shrink-0 h-full flex items-center justify-center overflow-hidden">
                                <ResponsiveSlideContainer>
                                    <UrbanStudySlide 
                                        slide={slide} 
                                        slideNumber={index+1} 
                                        imageUrls={imageUrls} 
                                        onUpdate={(fieldPath, value) => handleSlideUpdate(index, fieldPath, value)}
                                        isActive={index === currentIndex} />
                                </ResponsiveSlideContainer>
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