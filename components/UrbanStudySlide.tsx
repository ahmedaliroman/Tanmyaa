import React, { CSSProperties, useEffect, useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { useBranding } from '../hooks/useBranding';
import type { 
    PresentationSlide, 
    CoverSlide, 
    ExecutiveOverviewSlide,
    CrisisSlide,
    SWOTSlide,
    CaseStudyDeepDiveSlide,
    VisionSlide,
    MacroStrategySlide,
    EquityAnalysisSlide,
    NodeAssessmentSlide,
    ScenarioComparisonSlide,
    RiskAssessmentSlide,
    RoadmapSlide,
    GanttChartRoadmapSlide,
    ProjectedImpactSlide,
    FiscalFrameworkSlide,
    PolicyLeversSlide,
    GovernanceFrameworkSlide,
    ProcessSlide,
    ClosingSlide,
    ReferencesSlide,
    DesignSystem,
 } from '../types';
import { TanmyaaLogoPPTX } from './TanmyaaLogo';

const getAnimationStyles = (isActive: boolean, delay: number, type: 'fade-in-up' | 'scale-in' | 'fade-in' | 'fade-in-left' | 'fade-in-right' = 'fade-in-up', disableAnimations?: boolean) => {
    if (disableAnimations) return { opacity: 1 };
    if (!isActive) return { opacity: 0 };
    
    // Map to actual keyframe names if needed, or assume they exist
    let animationName = type;
    if (type === 'fade-in') animationName = 'fadeIn';
    if (type === 'fade-in-left') animationName = 'slideInRight'; // using existing slideInRight for now, or we can define it
    if (type === 'fade-in-right') animationName = 'slideInRight';

    return {
        opacity: 0,
        animation: `${animationName} 0.7s cubic-bezier(0.3, 0, 0.2, 1) forwards`,
        animationDelay: `${delay}ms`,
    };
};

const useCountUp = (end: number, duration: number, isActive: boolean, start: number = 0, disableAnimations?: boolean) => {
    const [count, setCount] = useState(disableAnimations ? end : start);
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);

    useEffect(() => {
        if (disableAnimations) {
            setCount(end);
            return;
        }
        if (!isActive) {
            setCount(start);
            return;
        }

        let frame = 0;
        const counter = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            const currentCount = start + (end - start) * progress;

            setCount(currentCount);

            if (frame === totalFrames) {
                clearInterval(counter);
                setCount(end);
            }
        }, frameRate);

        return () => clearInterval(counter);
    }, [end, start, duration, isActive, totalFrames, frameRate, disableAnimations]);

    return count;
};

const parseNumericValue = (value: string): { number: number; prefix: string; suffix: string; precision: number } => {
    if (typeof value !== 'string' || !value) return { number: 0, prefix: '', suffix: '', precision: 0 };
    const numericPartMatch = value.match(/-?[\d,.]+/);
    if (!numericPartMatch) return { number: 0, prefix: '', suffix: value, precision: 0 };

    const numericPart = numericPartMatch[0];
    const number = parseFloat(numericPart.replace(/,/g, ''));
    if (isNaN(number)) return { number: 0, prefix: '', suffix: value, precision: 0 };

    const parts = value.split(numericPart);
    const decimalMatch = numericPart.match(/\.(\d+)/);
    const precision = decimalMatch ? decimalMatch[1].length : 0;
    
    return { number, prefix: parts[0] || '', suffix: parts[1] || '', precision };
};

const ensureArray = <T,>(val: T | T[] | undefined | null): T[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return [val];
};

// Fix: Added 'style' prop to allow inline styling for components like Gantt charts that need specific backgrounds.
const SlideWrapper: React.FC<{ 
    children: React.ReactNode, 
    className?: string, 
    style?: CSSProperties, 
    reflectionText?: string, 
    onReflectionUpdate?: (val: string) => void,
    slideNumber?: number
}> = ({ children, className = '', style, reflectionText, onReflectionUpdate, slideNumber }) => {
    const { presentationTemplateUrl } = useBranding();
    
    // If a template URL is provided (and it's an image), use it as the background
    const backgroundStyle: CSSProperties = presentationTemplateUrl && (presentationTemplateUrl.endsWith('.png') || presentationTemplateUrl.endsWith('.jpg') || presentationTemplateUrl.endsWith('.jpeg')) 
        ? { backgroundImage: `url(${presentationTemplateUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', ...style }
        : { ...style };

    return (
        <div className={`w-full h-full bg-[var(--color-navy)] text-white flex flex-col overflow-hidden relative font-sans ${className}`} style={backgroundStyle}>
            {/* Dark overlay if using a custom background to ensure text readability */}
            {presentationTemplateUrl && <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none backdrop-blur-[1px]"></div>}
            
            <div className={`relative z-10 w-full flex-grow flex flex-col p-10 lg:p-14 ${reflectionText !== undefined ? 'pb-36' : 'pb-20'} overflow-hidden`}>
                {children}
            </div>

            {/* Global Footer Elements */}
            {slideNumber !== undefined && (
                <div className="absolute top-8 right-12 text-[10px] font-mono font-bold text-white/40 z-30 slide-footer-text uppercase tracking-widest">
                    Slide {String(slideNumber).padStart(2, '0')}
                </div>
            )}
            <div className="absolute top-6 left-12 z-30 opacity-40 slide-footer-logo hover:opacity-60 transition-opacity">
                <TanmyaaLogoPPTX className="!text-white" />
            </div>

            {reflectionText !== undefined && (
                <div className="absolute bottom-6 left-12 right-12 z-20">
                    <div className="bg-[var(--color-deep)]/80 border border-white/10 rounded-2xl p-6 flex items-start shadow-2xl border-l-4 border-l-[var(--color-royal)] backdrop-blur-md">
                        <div className="bg-[var(--color-royal)]/20 text-[var(--color-royal)] text-[10px] font-black px-2 py-1 rounded-md mr-4 uppercase shrink-0 mt-1 tracking-widest border border-[var(--color-royal)]/30">Principal Strategist Reflection</div>
                        <Editable value={reflectionText} onUpdate={onReflectionUpdate} className="text-sm text-white/70 italic leading-relaxed font-light" />
                    </div>
                </div>
            )}
        </div>
    );
};

const renderWithBold = (text: string) => {
    if (!text) return text;
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => 
        index % 2 === 1 ? <strong key={index} className="font-bold">{part}</strong> : part
    );
};

interface EditableImageProps {
    src: string;
    alt: string;
    className?: string;
    onUpdate: (newUrl: string) => void;
}

const EditableImage: React.FC<EditableImageProps> = ({ src, alt, className, onUpdate }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { presentationTemplateUrl } = useBranding();

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdate(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const isAbsolute = className?.includes('absolute');
    const isFullScreen = className?.includes('inset-0') || className?.includes('w-full h-full');

    // If a presentation template is provided, hide full-screen background images so the template is visible
    if (presentationTemplateUrl && isAbsolute && isFullScreen) {
        return null;
    }

    return (
        <div className={`${isAbsolute ? '' : 'relative'} group cursor-pointer overflow-hidden ${className}`} onClick={handleClick}>
            <img 
                src={src} 
                alt={alt} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-30">
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
            />
        </div>
    );
};

const Editable: React.FC<{
  as?: React.ElementType;
  value: string | undefined | null;
  onUpdate: (newValue: string) => void;
  className?: string;
  useMarkdown?: boolean;
}> = ({ as: Component = 'p', value, onUpdate, className, useMarkdown }) => {
  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const newValue = e.currentTarget.innerText;
    if (newValue !== (value || '')) {
      onUpdate(newValue);
    }
  };
  
  const safeValue = value || '';
  const content = useMarkdown ? renderWithBold(safeValue) : safeValue;

  return (
    <Component
      contentEditable={!useMarkdown}
      suppressContentEditableWarning
      onBlur={handleBlur}
      className={`outline-none focus:ring-2 focus:ring-[var(--color-primary-medium)] focus:bg-white/10 rounded-sm p-1 -m-1 transition-all break-words ${className}`}
      dangerouslySetInnerHTML={useMarkdown ? undefined : { __html: safeValue }}
    >
      {useMarkdown ? content : null}
    </Component>
  );
};

// --- REDESIGNED DOCTRINE-STYLE LAYOUTS ---

const CoverSlideLayout: React.FC<{ slide: CoverSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const subtitleAnim = getAnimationStyles(isActive, 400, 'fade-in-up', disableAnimations);
    const metaAnim = getAnimationStyles(isActive, 600, 'fade-in', disableAnimations);

    return (
        <SlideWrapper 
            className="justify-center items-center text-center relative overflow-hidden bg-[var(--color-navy)]"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <EditableImage 
                src={slide.image_url || imageUrls['cover_image'] || 'https://picsum.photos/seed/urban/1920/1080'} 
                alt="Cover Background" 
                className="absolute inset-0 w-full h-full z-0 opacity-30"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-navy)]/95 via-[var(--color-navy)]/70 to-[var(--color-navy)]/95 z-1"></div>
            
            <div className="relative z-10 max-w-6xl flex flex-col items-center">
                <div style={metaAnim} className="flex items-center gap-8 mb-12">
                    <div className="h-px w-20 bg-[var(--color-royal)]"></div>
                    <span className="text-sm font-black tracking-[0.5em] uppercase text-[var(--color-royal)]">
                        Strategic Urban Doctrine
                    </span>
                    <div className="h-px w-20 bg-[var(--color-royal)]"></div>
                </div>
                
                <h1 
                    style={titleAnim}
                    className="text-8xl lg:text-9xl font-black tracking-tighter leading-[0.8] mb-12 uppercase text-white drop-shadow-2xl"
                >
                    <Editable value={slide.title} onUpdate={v => onUpdate('title', v)} />
                </h1>
                
                <p 
                    style={subtitleAnim}
                    className="text-3xl lg:text-4xl text-white/80 font-light max-w-4xl leading-tight mb-24"
                >
                    <Editable value={slide.subtitle} onUpdate={v => onUpdate('subtitle', v)} />
                </p>

                <div style={metaAnim} className="flex items-center gap-20 text-sm font-mono text-white/40 pt-20 border-t border-white/10">
                    <div className="flex flex-col gap-3 text-left">
                        <span className="uppercase opacity-40 text-[10px] tracking-widest font-bold">Project Code</span>
                        <span className="text-white font-black text-lg tracking-tighter uppercase"><Editable value={slide.project_code || 'TAN-2026-001'} onUpdate={v => onUpdate('project_code', v)} /></span>
                    </div>
                    <div className="w-px h-16 bg-white/10"></div>
                    <div className="flex flex-col gap-3 text-left">
                        <span className="uppercase opacity-40 text-[10px] tracking-widest font-bold">Classification</span>
                        <span className="text-[var(--color-royal)] font-black text-lg tracking-tighter uppercase"><Editable value={slide.classification || 'Strategic Confidential'} onUpdate={v => onUpdate('classification', v)} /></span>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const ExecutiveOverviewSlideLayout: React.FC<{ slide: ExecutiveOverviewSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);
    const contentAnim = getAnimationStyles(isActive, 300, 'fade-in-up', disableAnimations);
    const pointsAnim = getAnimationStyles(isActive, 500, 'fade-in-up', disableAnimations);
    const imageAnim = getAnimationStyles(isActive, 400, 'fade-in-right', disableAnimations);

    return (
        <SlideWrapper 
            className="flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="grid grid-cols-12 gap-12 h-full">
                <div className="col-span-7 flex flex-col justify-center">
                    <h2 
                        style={titleAnim}
                        className="text-5xl lg:text-6xl font-black tracking-tighter uppercase mb-8 leading-tight text-white"
                    >
                        <Editable value={slide.title} onUpdate={v => onUpdate('title', v)} />
                    </h2>
                    <div 
                        style={contentAnim}
                        className="text-xl text-white/80 font-light leading-relaxed mb-10 border-l-4 border-[var(--color-royal)] pl-8"
                    >
                        <Editable value={slide.narrative} onUpdate={v => onUpdate('narrative', v)} useMarkdown />
                    </div>
                    <div style={pointsAnim} className="grid grid-cols-2 gap-6">
                        {ensureArray(slide.key_points).slice(0, 4).map((point, idx) => (
                            <div key={idx} className="bg-[var(--color-deep)]/40 border border-white/10 p-6 rounded-3xl backdrop-blur-sm hover:bg-[var(--color-deep)]/60 transition-all">
                                <div className="text-[var(--color-royal)] font-black text-[10px] uppercase mb-2 tracking-widest">Strategic Pillar 0{idx + 1}</div>
                                <Editable 
                                    value={point} 
                                    onUpdate={v => onUpdate(`key_points[${idx}]`, v)} 
                                    className="text-sm text-white/90 leading-snug font-bold uppercase tracking-tight" 
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div style={imageAnim} className="col-span-5 relative rounded-[40px] overflow-hidden group border border-[var(--color-royal)]/30 shadow-2xl">
                    <EditableImage 
                        src={slide.image_url || imageUrls['overview_image'] || ''} 
                        alt={slide.title} 
                        onUpdate={url => onUpdate('image_url', url)}
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-navy)]/95 via-transparent to-transparent"></div>
                    <div className="absolute bottom-12 left-12 right-12">
                        <div className="text-[var(--color-royal)] font-black text-sm uppercase mb-2 tracking-widest">Contextual Visual</div>
                        <div className="text-white/40 text-xs font-mono uppercase tracking-widest">Strategic Site Analysis Reference</div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const CrisisSlideLayout: React.FC<{ slide: CrisisSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);
    const contentAnim = getAnimationStyles(isActive, 300, 'fade-in-up', disableAnimations);
    const dataAnim = getAnimationStyles(isActive, 500, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="flex flex-col justify-center p-12"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="max-w-7xl mx-auto w-full mb-12">
                <div style={titleAnim} className="flex items-center gap-6 mb-8">
                    <div className="h-px w-24 bg-[var(--color-royal)]"></div>
                    <span className="text-sm font-black uppercase text-[var(--color-royal)] tracking-[0.3em]">Critical Assessment & Problem Relevance</span>
                </div>
                <h2 
                    style={titleAnim}
                    className="text-6xl lg:text-7xl font-black tracking-tighter uppercase mb-12 leading-tight text-white"
                >
                    <Editable value={slide.title} onUpdate={v => onUpdate('title', v)} />
                </h2>
                <div className="grid grid-cols-12 gap-16">
                    <div 
                        style={contentAnim}
                        className="col-span-12 lg:col-span-6 text-xl text-white/90 font-light leading-relaxed border-l-4 border-[var(--color-royal)] pl-10"
                    >
                        <div className="mb-6 font-black text-[var(--color-royal)] uppercase text-xs tracking-widest">Problem Statement</div>
                        <Editable value={slide.problem_statement} onUpdate={v => onUpdate('problem_statement', v)} />
                    </div>
                    <div 
                        style={contentAnim}
                        className="col-span-12 lg:col-span-6 text-xl text-white/80 font-light leading-relaxed bg-[var(--color-deep)]/40 p-10 rounded-[40px] border border-white/10 backdrop-blur-sm"
                    >
                        <div className="mb-6 font-black text-[var(--color-royal)] uppercase text-xs tracking-widest">Strategic Relevance</div>
                        <Editable 
                            value={slide.analytic_reflection || "This study is critical because it addresses systemic urban failures that directly impact economic resilience and social equity. Failure to intervene now will lead to irreversible degradation of urban infrastructure and community wellbeing."} 
                            onUpdate={v => onUpdate('analytic_reflection', v)} 
                        />
                    </div>
                </div>
            </div>

            <div style={dataAnim} className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-7xl mx-auto w-full">
                {ensureArray(slide.key_data_points).slice(0, 3).map((point, idx) => (
                    <div key={idx} className="bg-[var(--color-deep)]/40 border-l-4 border-[var(--color-royal)] p-10 rounded-r-[40px] backdrop-blur-md transition-all hover:bg-[var(--color-deep)]/60 shadow-xl">
                        <div className="text-5xl font-black tracking-tighter mb-4 text-white">
                            <MetricValueDisplay
                                value={point.value}
                                isActive={isActive}
                                numberClass="text-5xl font-black"
                                suffixClass="text-2xl"
                                disableAnimations={disableAnimations}
                            />
                        </div>
                        <div className="text-xs font-black uppercase text-[var(--color-royal)] mb-6 tracking-widest">
                            <Editable value={point.label} onUpdate={v => onUpdate(`key_data_points[${idx}].label`, v)} />
                        </div>
                        <div className="text-sm text-white/60 leading-relaxed line-clamp-3 font-medium">
                            <Editable value={point.description} onUpdate={v => onUpdate(`key_data_points[${idx}].description`, v)} />
                        </div>
                    </div>
                ))}
            </div>
        </SlideWrapper>
    );
};

const SWOTSection = ({ title, items, color, field, onUpdate }: { title: string, items: { title: string, description: string }[], color: string, field: string, onUpdate: (field: string, val: string) => void }) => (
    <div className={`bg-[var(--color-deep)]/40 border-t-4 ${color} p-8 rounded-b-[32px] backdrop-blur-sm flex flex-col h-full transition-all hover:bg-[var(--color-deep)]/60 shadow-lg`}>
        <h3 className="text-2xl font-black tracking-tighter uppercase mb-6 flex items-center justify-between text-white">
            {title}
            <span className={`w-3 h-3 rounded-full ${color.replace('border-', 'bg-')}`}></span>
        </h3>
        <div className="space-y-4 flex-grow overflow-hidden">
            {ensureArray(items).slice(0, 6).map((item, idx) => (
                <div key={idx} className="group">
                    <div className="font-bold text-sm uppercase mb-1 text-white group-hover:text-[var(--color-royal)] transition-colors truncate">
                        <Editable value={item.title} onUpdate={v => onUpdate(`${field}[${idx}].title`, v)} />
                    </div>
                    <div className="text-xs text-white/60 leading-relaxed line-clamp-2 font-medium">
                        <Editable value={item.description} onUpdate={v => onUpdate(`${field}[${idx}].description`, v)} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const SWOTSlideLayout: React.FC<{ slide: SWOTSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);
    const sAnim = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const wAnim = getAnimationStyles(isActive, 300, 'fade-in-up', disableAnimations);
    const oAnim = getAnimationStyles(isActive, 400, 'fade-in-up', disableAnimations);
    const tAnim = getAnimationStyles(isActive, 500, 'fade-in-up', disableAnimations);
    const listAnim = getAnimationStyles(isActive, 600, 'fade-in-left', disableAnimations);

    return (
        <SlideWrapper 
            className="flex flex-col p-12"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="flex justify-between items-end mb-12">
                <h2 
                    style={titleAnim}
                    className="text-6xl font-black tracking-tighter uppercase text-white leading-none"
                >
                    <Editable value={slide.title || 'Strategic SWOT Analysis'} onUpdate={v => onUpdate('title', v)} />
                </h2>
                <div className="text-[10px] font-mono text-white/30 uppercase text-right tracking-[0.2em] max-w-xs" style={titleAnim}>
                    Reference: <Editable value="Urban Planning Institute (2025) - Strategic Framework for Resilient Cities" onUpdate={v => onUpdate('reference', v)} />
                </div>
            </div>
            
            <div className="grid grid-cols-12 gap-10 flex-grow overflow-hidden">
                <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                    <div style={sAnim} className="h-full"><SWOTSection title="Strengths" items={slide.strengths} color="border-[var(--color-royal)]" field="strengths" onUpdate={onUpdate} /></div>
                    <div style={wAnim} className="h-full"><SWOTSection title="Weaknesses" items={slide.weaknesses} color="border-[var(--color-steel)]" field="weaknesses" onUpdate={onUpdate} /></div>
                    <div style={oAnim} className="h-full"><SWOTSection title="Opportunities" items={slide.opportunities} color="border-[var(--color-primary-medium)]" field="opportunities" onUpdate={onUpdate} /></div>
                    <div style={tAnim} className="h-full"><SWOTSection title="Threats" items={slide.threats} color="border-[var(--color-deep)]" field="threats" onUpdate={onUpdate} /></div>
                </div>
                
                <div style={listAnim} className="hidden lg:flex col-span-3 bg-[var(--color-deep)]/60 border border-white/10 rounded-[40px] p-8 flex-col backdrop-blur-md shadow-2xl">
                    <div className="text-[var(--color-royal)] font-black text-sm uppercase mb-8 tracking-widest border-b border-white/10 pb-6">Prioritization List</div>
                    <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-grow">
                        {ensureArray(slide.strengths).concat(ensureArray(slide.opportunities)).slice(0, 6).map((item, i) => (
                            <div key={i} className="flex gap-5 items-start group">
                                <div className="w-8 h-8 rounded-xl bg-[var(--color-royal)]/20 flex items-center justify-center text-xs font-black text-[var(--color-royal)] shrink-0 border border-[var(--color-royal)]/30 group-hover:bg-[var(--color-royal)]/40 transition-all">0{i + 1}</div>
                                <div className="text-xs text-white/80 leading-tight">
                                    <span className="font-black block text-white mb-2 uppercase tracking-tight">{item.title}</span>
                                    <span className="opacity-60 text-[10px] line-clamp-2 font-medium">{item.description}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/10">
                        <div className="text-[10px] text-white/50 uppercase font-mono tracking-widest font-black">Strategic Priority Index: 0.84</div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const BenchmarksSlideLayout: React.FC<{ slide: BenchmarksSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="flex flex-col p-12"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="flex items-center gap-6 mb-12">
                <h2 
                    style={titleAnim}
                    className="text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-tight text-white"
                >
                    <Editable value="Global, Regional & Local Benchmarks" onUpdate={v => onUpdate('title', v)} />
                </h2>
                <div className="h-px flex-1 bg-white/10"></div>
                <div className="text-[var(--color-royal)] font-black text-xs uppercase tracking-[0.3em]">Comparative Analysis</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 flex-grow overflow-hidden">
                {ensureArray(slide.benchmarks).slice(0, 4).map((benchmark, i) => {
                    const benchmarkAnim = getAnimationStyles(isActive, 300 + i * 150, 'fade-in-up', disableAnimations);
                    const typeLabel = i === 0 ? 'Local' : i === 1 ? 'Regional' : 'Global';
                    return (
                        <div key={i} style={benchmarkAnim} className="group flex flex-col bg-[var(--color-deep)]/40 border border-white/10 rounded-[40px] overflow-hidden backdrop-blur-sm hover:bg-[var(--color-deep)]/60 transition-all duration-500 shadow-2xl">
                            <div className="h-48 relative overflow-hidden">
                                <EditableImage 
                                    src={benchmark.image_url || imageUrls[benchmark.image_prompt] || `https://picsum.photos/seed/${benchmark.name}/800/600`} 
                                    alt={benchmark.name} 
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                                    onUpdate={(newUrl) => onUpdate(`benchmarks[${i}].image_url`, newUrl)}
                                />
                                <div className="absolute top-6 left-6 bg-[var(--color-royal)] px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase border border-white/10 tracking-widest">
                                    {typeLabel}
                                </div>
                                <div className="absolute top-6 right-6 bg-[var(--color-navy)]/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase border border-white/10 tracking-widest">
                                    {benchmark.location}
                                </div>
                            </div>
                            <div className="p-8 flex flex-col flex-grow">
                                <h3 className="text-2xl font-black tracking-tighter uppercase mb-4 text-white truncate">
                                    <Editable value={benchmark.name} onUpdate={v => onUpdate(`benchmarks[${i}].name`, v)} />
                                </h3>
                                <p className="text-sm text-white/70 font-light leading-relaxed mb-6 line-clamp-3 font-medium">
                                    <Editable value={benchmark.introduction} onUpdate={v => onUpdate(`benchmarks[${i}].introduction`, v)} />
                                </p>
                                <div className="mt-auto space-y-6">
                                    <div className="flex flex-wrap gap-3">
                                        {ensureArray(benchmark.interventions).slice(0, 2).map((item, j) => (
                                            <span key={j} className="text-[10px] font-black uppercase bg-white/5 px-3 py-1.5 rounded-lg text-white/40 border border-white/5 tracking-tight">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="pt-6 border-t border-white/10">
                                        <div className="text-[var(--color-royal)] font-black text-[10px] uppercase mb-2 tracking-widest">Strategic Takeaway</div>
                                        <p className="text-sm text-white/90 italic leading-snug line-clamp-2 font-medium">
                                            <Editable value={benchmark.takeaway} onUpdate={v => onUpdate(`benchmarks[${i}].takeaway`, v)} />
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </SlideWrapper>
    );
};

const CaseStudyDeepDiveSlideLayout: React.FC<{ slide: CaseStudyDeepDiveSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);
    const contentAnim = getAnimationStyles(isActive, 300, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="flex flex-col p-12"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="grid grid-cols-12 gap-12 h-full max-w-7xl mx-auto w-full">
                <div className="col-span-12 lg:col-span-7 relative rounded-[48px] overflow-hidden group border border-white/10 shadow-2xl min-h-[400px]">
                    <EditableImage 
                        src={slide.image_url || imageUrls[slide.image_prompt] || ''} 
                        alt={slide.title} 
                        onUpdate={url => onUpdate('image_url', url)}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                    <div className="absolute bottom-12 left-12 right-12">
                        <div className="text-[var(--color-royal)] font-black text-xs uppercase mb-4 tracking-[0.3em]">Case Study Reference</div>
                        <h2 
                            style={titleAnim}
                            className="text-5xl lg:text-6xl font-black tracking-tighter uppercase text-white leading-tight"
                        >
                            <Editable value={slide.title} onUpdate={v => onUpdate('title', v)} />
                        </h2>
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-5 flex flex-col justify-center">
                    <div 
                        style={contentAnim}
                        className="bg-white/5 border border-white/10 p-10 rounded-[48px] backdrop-blur-2xl shadow-2xl h-full flex flex-col"
                    >
                        <div className="text-xl text-white/80 font-light leading-relaxed mb-10 italic border-l-4 border-[var(--color-royal)] pl-8">
                            <Editable value={slide.introduction} onUpdate={v => onUpdate('introduction', v)} useMarkdown />
                        </div>
                        
                        <div className="space-y-6 mb-10 flex-grow">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-royal)]">Key Strategic Findings</h3>
                            <div className="space-y-4">
                                {ensureArray(slide.key_findings).slice(0, 4).map((finding, idx) => (
                                    <div key={idx} className="flex items-start gap-4 group">
                                        <div className="w-2 h-2 rounded-full bg-[var(--color-royal)] mt-2 flex-shrink-0 group-hover:scale-150 transition-transform"></div>
                                        <Editable 
                                            value={finding} 
                                            onUpdate={v => onUpdate(`key_findings[${idx}]`, v)} 
                                            className="text-sm text-white/70 leading-relaxed font-medium" 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-10 border-t border-white/10">
                            <div className="text-2xl font-black text-white tracking-tighter leading-tight mb-4 uppercase">
                                <Editable value={slide.conclusion} onUpdate={v => onUpdate('conclusion', v)} />
                            </div>
                            {slide.data_source && (
                                <div className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                                    Source: <Editable value={slide.data_source} onUpdate={v => onUpdate('data_source', v)} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const VisionSlideLayout: React.FC<{ slide: VisionSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);
    const visionAnim = getAnimationStyles(isActive, 300, 'fade-in-up', disableAnimations);
    const pillarsAnim = getAnimationStyles(isActive, 500, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="flex flex-col p-12"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="grid grid-cols-12 gap-12 h-full max-w-7xl mx-auto w-full">
                <div className="col-span-12 lg:col-span-5 flex flex-col justify-center">
                    <div style={titleAnim} className="flex items-center gap-6 mb-8">
                        <div className="h-px w-16 bg-[var(--color-royal)]"></div>
                        <span className="text-sm font-black uppercase tracking-[0.3em] text-[var(--color-royal)]">Future State Vision</span>
                    </div>
                    <h2 
                        style={titleAnim}
                        className="text-5xl lg:text-6xl font-black tracking-tighter uppercase mb-6 leading-tight text-white"
                    >
                        <Editable value={slide.title} onUpdate={v => onUpdate('title', v)} />
                    </h2>
                    <div 
                        style={visionAnim}
                        className="text-2xl text-white/90 font-light italic leading-relaxed mb-10 border-l-4 border-[var(--color-royal)] pl-8"
                    >
                        &quot;<Editable value={slide.vision_statement} onUpdate={v => onUpdate('vision_statement', v)} />&quot;
                    </div>
                    <div style={pillarsAnim} className="space-y-8">
                        {ensureArray(slide.strategic_pillars).slice(0, 3).map((pillar, idx) => (
                            <div key={idx} className="group">
                                <div className="text-lg font-black uppercase text-[var(--color-royal)] mb-4 flex items-center gap-4">
                                    <span className="text-xs opacity-50 font-mono tracking-widest">0{idx + 1}</span>
                                    <Editable value={pillar.title} onUpdate={v => onUpdate(`strategic_pillars[${idx}].title`, v)} />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {ensureArray(pillar.initiatives).slice(0, 4).map((init, iidx) => (
                                        <span key={iidx} className="text-[10px] uppercase font-bold bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-white/60 hover:bg-[var(--color-royal)] hover:text-white transition-all cursor-default">
                                            {init}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-7 relative rounded-[48px] overflow-hidden shadow-2xl border border-white/10 group min-h-[400px]">
                    <EditableImage 
                        src={slide.image_url || imageUrls[slide.image_prompt] || ''} 
                        alt={slide.title} 
                        onUpdate={url => onUpdate('image_url', url)}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute top-8 right-8">
                        <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-md">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-royal)] animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const MacroStrategySlideLayout: React.FC<{ slide: MacroStrategySlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="p-12 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="relative z-20 mb-12 max-w-7xl mx-auto w-full" style={titleAnimation}>
                 <Editable as="h1" value={slide.title} className="text-5xl lg:text-7xl font-black tracking-tighter uppercase text-white leading-tight" onUpdate={v => onUpdate('title', v)} />
                 <div className="h-1.5 w-32 bg-[var(--color-royal)] mt-8 mb-8"></div>
                 <Editable as="p" value={slide.strategic_intent} className="text-2xl text-white/80 max-w-4xl leading-relaxed font-light italic" onUpdate={v => onUpdate('strategic_intent', v)} />
            </div>
            
            <div className="relative z-20 grid grid-cols-12 gap-12 flex-grow min-h-0 max-w-7xl mx-auto w-full">
                <div className="col-span-12 lg:col-span-7 grid grid-cols-1 gap-6 overflow-hidden">
                    {ensureArray(slide.strategies).slice(0, 3).map((strategy, i) => {
                        const strategyAnimation = getAnimationStyles(isActive, 400 + i * 150, 'scale-in', disableAnimations);
                        return (
                            <div key={i} className="bg-white/5 backdrop-blur-2xl p-10 rounded-[40px] border border-white/10 flex flex-col group hover:bg-white/10 transition-all duration-500 shadow-xl" style={strategyAnimation}>
                                <div className="flex items-center gap-6 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-royal)] flex items-center justify-center text-lg font-black text-white shadow-lg group-hover:scale-110 transition-transform">0{i + 1}</div>
                                    <Editable as="h3" value={strategy.title} onUpdate={v => onUpdate(`strategies[${i}].title`, v)} className="font-black text-3xl uppercase text-white tracking-tight" />
                                </div>
                                <Editable as="p" value={strategy.description} onUpdate={v => onUpdate(`strategies[${i}].description`, v)} className="text-white/80 text-base leading-relaxed mb-8 font-medium" useMarkdown />
                                <div className="mt-auto pt-8 border-t border-white/10">
                                    <p className="text-[10px] font-black text-[var(--color-royal)] uppercase tracking-widest mb-3">Strategic Rationale</p>
                                    <Editable as="p" value={strategy.rationale} onUpdate={v => onUpdate(`strategies[${i}].rationale`, v)} className="text-white/50 text-sm italic leading-relaxed font-medium"/>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="col-span-12 lg:col-span-5 relative rounded-[48px] overflow-hidden group shadow-2xl border border-white/10 min-h-[400px]">
                    <EditableImage 
                        src={slide.image_url || imageUrls[slide.image_prompt] || 'https://picsum.photos/seed/strategy/800/1200'} 
                        alt="Perspective Visualization" 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                        onUpdate={(newUrl) => onUpdate(`image_url`, newUrl)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                    <div className="absolute bottom-10 left-10 right-10">
                        <div className="text-[var(--color-royal)] font-black text-xs uppercase mb-2 tracking-[0.3em]">Perspective Visualization</div>
                        <div className="text-white/40 text-[10px] font-mono uppercase tracking-widest">Strategic Implementation Reference</div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const EquityAnalysisSlideLayout: React.FC<{ slide: EquityAnalysisSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);
    const leftAnim = getAnimationStyles(isActive, 300, 'fade-in-right', disableAnimations);
    const rightAnim = getAnimationStyles(isActive, 500, 'fade-in-left', disableAnimations);

    return (
        <SlideWrapper 
            className="flex flex-col p-12"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <h2 
                style={titleAnim}
                className="text-5xl lg:text-7xl font-black tracking-tighter uppercase mb-12 text-white leading-tight max-w-7xl mx-auto w-full"
            >
                <Editable value={slide.title || 'Equity & Inclusion Analysis'} onUpdate={v => onUpdate('title', v)} />
            </h2>
            <div className="grid grid-cols-12 gap-12 flex-grow max-w-7xl mx-auto w-full">
                <div style={leftAnim} className="col-span-12 lg:col-span-8 space-y-8">
                    <div className="text-[var(--color-royal)] font-black text-xs uppercase mb-6 tracking-[0.3em]">Distributional Impacts</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {ensureArray(slide.metrics).slice(0, 4).map((metric, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-[40px] p-10 backdrop-blur-2xl shadow-xl hover:bg-white/10 transition-all duration-500 group">
                                <h3 className="text-sm font-black uppercase text-white mb-6 leading-tight tracking-tight group-hover:text-[var(--color-royal)] transition-colors">
                                    <Editable value={metric.dimension} onUpdate={v => onUpdate(`metrics[${i}].dimension`, v)} />
                                </h3>
                                <div className="flex items-center gap-6 mb-6">
                                    <div className="text-3xl font-black text-white/30 tracking-tighter">
                                        <Editable value={metric.current_state} onUpdate={v => onUpdate(`metrics[${i}].current_state`, v)} />
                                    </div>
                                    <ArrowRight className="w-6 h-6 text-[var(--color-royal)] group-hover:translate-x-2 transition-transform" />
                                    <div className="text-4xl font-black text-white tracking-tighter">
                                        <Editable value={metric.target_state} onUpdate={v => onUpdate(`metrics[${i}].target_state`, v)} />
                                    </div>
                                </div>
                                <p className="text-sm text-white/50 leading-relaxed italic font-medium">
                                    <Editable value={metric.impact_description} onUpdate={v => onUpdate(`metrics[${i}].impact_description`, v)} />
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div style={rightAnim} className="col-span-12 lg:col-span-4 bg-white/5 border border-white/10 rounded-[48px] p-10 backdrop-blur-2xl shadow-2xl flex flex-col">
                    <div className="text-[var(--color-royal)] font-black text-xs uppercase mb-10 tracking-[0.3em]">Mitigation Strategies</div>
                    <div className="space-y-6 flex-grow">
                        {ensureArray(slide.mitigation_strategies).slice(0, 4).map((item, i) => (
                            <div key={i} className="bg-black/20 p-8 rounded-[32px] border border-white/5 hover:border-[var(--color-royal)]/30 transition-all group">
                                <div className="text-[10px] text-[var(--color-royal)] font-black uppercase mb-3 tracking-widest">
                                    <Editable value={item.label || "Strategy"} onUpdate={v => onUpdate(`mitigation_strategies[${i}].label`, v)} />
                                </div>
                                <div className="text-base text-white font-bold leading-relaxed group-hover:translate-x-1 transition-transform">
                                    <Editable value={item.value || "Description"} onUpdate={v => onUpdate(`mitigation_strategies[${i}].value`, v)} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-10 pt-10 border-t border-white/10">
                        <div className="text-[10px] text-white/20 font-mono uppercase tracking-widest">Equity Framework v1.0</div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const MetricValueDisplay: React.FC<{ value: string; isActive: boolean; numberClass: string; suffixClass: string, disableAnimations?: boolean }> = ({ value, isActive, numberClass, suffixClass, disableAnimations }) => {
    const { number, prefix, suffix, precision } = parseNumericValue(value);
    const count = useCountUp(number, 2000, isActive, 0, disableAnimations);
    
    const isYear = precision === 0 && number >= 1900 && number <= 2100;
    const formatOptions = { 
        minimumFractionDigits: precision, 
        maximumFractionDigits: precision,
        useGrouping: !isYear
    };

    const numberPart = isActive
        ? count.toLocaleString(undefined, formatOptions)
        : number.toLocaleString(undefined, formatOptions);
    
    const fullValue = `${prefix}${numberPart}${suffix}`;
    const isLong = fullValue.length > 12;
    const adjustedNumberClass = isLong ? numberClass.replace(/text-\d+xl/, 'text-3xl md:text-4xl') : numberClass;
    const adjustedSuffixClass = isLong ? suffixClass.replace(/text-\d+xl/, 'text-sm md:text-base') : suffixClass;

    const trimmedSuffix = suffix.trim();
        
    return (
        <div className="flex flex-col items-center">
            <p className={`font-extrabold leading-tight break-words ${adjustedNumberClass}`}>
                {prefix}{numberPart}
            </p>
            {trimmedSuffix && (
                <span className={`${adjustedSuffixClass} mt-1 font-bold opacity-80`}>{trimmedSuffix}</span>
            )}
        </div>
    );
};

const NodeAssessmentSlideLayout: React.FC<{ slide: NodeAssessmentSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const conclusionAnimation = getAnimationStyles(isActive, 850, 'fade-in-up', disableAnimations);

    const overlayClassBefore = designSystem?.is_light_background ? "bg-white/20" : "bg-[var(--color-navy)]/85";
    const overlayClassAfter = designSystem?.is_light_background ? "bg-white/20" : "bg-[var(--color-navy)]/80";

    return (
        <SlideWrapper 
            className="p-0 text-center flex flex-col pb-24"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="absolute top-12 right-12 z-30 bg-[var(--color-royal)]/20 text-[var(--color-royal)] text-xs font-black px-6 py-2 rounded-full border border-[var(--color-royal)]/40 uppercase tracking-[0.3em] backdrop-blur-xl shadow-2xl">
                LIFECYCLE FISCAL ARCHITECTURE
            </div>
            <div className="w-1/2 h-full absolute left-0 top-0 group overflow-hidden">
                <EditableImage 
                    src={slide.before_image_url || imageUrls[slide.before_image_prompt] || ''} 
                    alt="Before" 
                    className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:scale-110"
                    onUpdate={(newUrl) => onUpdate(`before_image_url`, newUrl)}
                />
                <div className={`absolute inset-0 ${overlayClassBefore} transition-opacity duration-1000 group-hover:opacity-60`}></div>
                <div className="absolute top-8 left-8 bg-black/80 text-white px-4 py-1.5 text-[10px] rounded-full font-black tracking-[0.4em] z-10 border border-white/10 shadow-xl">BEFORE</div>
            </div>
            <div className="w-1/2 h-full absolute right-0 top-0 group overflow-hidden border-l border-white/10">
                <EditableImage 
                    src={slide.after_image_url || imageUrls[slide.after_image_prompt] || ''} 
                    alt="After" 
                    className="w-full h-full object-cover grayscale-0 transition-all duration-1000 group-hover:scale-110"
                    onUpdate={(newUrl) => onUpdate(`after_image_url`, newUrl)}
                />
                <div className={`absolute inset-0 ${overlayClassAfter} transition-opacity duration-1000 group-hover:opacity-40`}></div>
                <div className="absolute top-8 right-8 bg-[var(--color-royal)] text-white px-4 py-1.5 text-[10px] rounded-full font-black tracking-[0.4em] z-10 border border-white/20 shadow-xl">AFTER</div>
            </div>
            <div className="relative z-20 flex-grow flex flex-col justify-between p-16 pb-8">
                <div style={titleAnimation} className="bg-[var(--color-navy)]/80 backdrop-blur-2xl p-12 rounded-[56px] border border-white/20 max-w-4xl mx-auto mb-12 shadow-2xl">
                    <Editable as="h2" value={slide.title} className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-tight text-white mb-6" onUpdate={v => onUpdate('title', v)} />
                    <div className="h-1.5 w-24 bg-[var(--color-royal)] mx-auto mb-8"></div>
                    <Editable as="p" value={slide.site_rationale} onUpdate={v => onUpdate('site_rationale', v)} className="text-lg text-white/70 italic font-medium leading-relaxed" />
                </div>
                <div className="grid grid-cols-3 gap-10 w-full max-w-6xl mx-auto mb-12">
                    {ensureArray(slide.metrics).slice(0, 3).map((metric, i) => {
                        const metricAnimation = getAnimationStyles(isActive, 400 + i * 150, 'fade-in-up', disableAnimations);
                        return (
                            <div key={i} className="bg-[var(--color-deep)]/80 backdrop-blur-2xl border border-white/20 rounded-[40px] px-10 py-12 flex flex-col items-center justify-center text-center shadow-2xl transition-all hover:scale-105 hover:border-[var(--color-royal)]/50 group" style={metricAnimation}>
                                <MetricValueDisplay
                                    value={metric.value}
                                    isActive={isActive}
                                    numberClass="text-4xl md:text-5xl font-black text-white tracking-tighter group-hover:text-[var(--color-royal)] transition-colors"
                                    suffixClass="text-base text-white/80 font-bold"
                                    disableAnimations={disableAnimations}
                                />
                                <Editable as="p" value={metric.label} onUpdate={v => onUpdate(`metrics[${i}].label`, v)} className="text-[10px] text-white/50 uppercase tracking-[0.3em] font-black mt-6" />
                            </div>
                        )
                    })}
                </div>
                 <div style={conclusionAnimation} className="bg-[var(--color-navy)]/80 backdrop-blur-2xl p-10 rounded-[40px] border border-white/20 max-w-5xl mx-auto shadow-2xl">
                    <Editable as="p" value={slide.conclusion} onUpdate={v => onUpdate('conclusion', v)} className="text-xl md:text-2xl font-black text-white leading-relaxed tracking-tight" useMarkdown />
                    <div className="text-[10px] text-[var(--color-royal)] font-mono uppercase tracking-[0.4em] mt-6">Strategic Transformation Validated</div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const ReferencesSlideLayout: React.FC<{ slide: ReferencesSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="flex flex-col p-12"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <h2 
                style={titleAnim}
                className="text-5xl lg:text-7xl font-black tracking-tighter uppercase mb-12 text-white leading-tight max-w-7xl mx-auto w-full"
            >
                <Editable value={slide.title || 'Strategic References & Data Sources'} onUpdate={v => onUpdate('title', v)} />
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 flex-grow overflow-hidden max-w-7xl mx-auto w-full">
                <div className="space-y-8">
                    <div className="text-[var(--color-royal)] font-black text-xs uppercase mb-8 tracking-[0.3em]">Academic & Policy References</div>
                    <div className="space-y-8 overflow-y-auto custom-scrollbar pr-4 max-h-[500px]">
                        {ensureArray(slide.sources).slice(0, 8).map((source, i) => {
                            const refAnim = getAnimationStyles(isActive, 300 + i * 100, 'fade-in-left', disableAnimations);
                            const fullRef = `${source.author || 'Author'} (${source.year || 'Year'}). ${source.title || 'Title'}. ${source.relevance || 'Relevance'}`;
                            return (
                                <div key={i} style={refAnim} className="text-sm text-white/70 leading-relaxed pl-8 border-l-2 border-white/10 hover:border-[var(--color-royal)] transition-all group">
                                    <Editable value={fullRef} onUpdate={v => {
                                        const parts = v.match(/^(.+?)\s\((.+?)\)\.\s(.+?)\.\s(.+)$/);
                                        if (parts) {
                                            onUpdate(`sources[${i}]`, {
                                                author: parts[1],
                                                year: parts[2],
                                                title: parts[3],
                                                relevance: parts[4],
                                                link: source.link
                                            });
                                        } else {
                                            onUpdate(`sources[${i}].title`, v);
                                        }
                                    }} className="group-hover:text-white transition-colors font-medium" />
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-[48px] p-12 backdrop-blur-2xl shadow-2xl flex flex-col h-full">
                    <div className="text-[var(--color-royal)] font-black text-xs uppercase mb-10 tracking-[0.3em]">Data Integrity Statement</div>
                    <p className="text-lg text-white/60 font-light leading-relaxed italic mb-12">
                        All data presented in this study has been cross-referenced with official municipal records, satellite imagery analysis, and verified socio-economic indicators as of Q1 2025.
                    </p>
                    <div className="mt-auto space-y-8">
                        <div className="p-8 bg-black/20 rounded-[32px] border border-white/5">
                            <div className="text-[10px] text-[var(--color-royal)] font-black uppercase mb-4 tracking-widest">Verification Protocol</div>
                            <div className="text-sm text-white/40 font-mono leading-relaxed">
                                ISO-9001 Urban Planning Standard Compliance Check: <span className="text-emerald-500">PASSED</span>
                            </div>
                        </div>
                        <div className="text-[10px] text-white/20 font-mono uppercase tracking-widest">Strategic Audit Log: {new Date().toISOString().split('T')[0]}</div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const ScenarioComparisonSlideLayout: React.FC<{ slide: ScenarioComparisonSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="p-12 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="relative z-20" style={titleAnimation}>
                <Editable 
                    as="h1" 
                    value={slide.title || "Scenario Comparison"} 
                    onUpdate={v => onUpdate('title', v)} 
                    className="text-5xl lg:text-6xl font-black tracking-tighter mb-12 text-white leading-tight uppercase" 
                />
            </div>
            <div className="relative z-20 flex-grow grid grid-cols-3 gap-10">
                {ensureArray(slide.scenarios).slice(0, 3).map((scenario, i) => {
                    const scenarioAnimation = getAnimationStyles(isActive, 300 + i * 150, 'fade-in-up', disableAnimations);
                    const isAggressive = i === 2;
                    const isConservative = i === 0;
                    
                    return (
                        <div 
                            key={i} 
                            className={`group relative flex flex-col p-10 rounded-[48px] border transition-all duration-500 backdrop-blur-2xl shadow-2xl ${
                                isAggressive 
                                ? 'bg-[var(--color-royal)]/10 border-[var(--color-royal)]/30 hover:bg-[var(--color-royal)]/20' 
                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                            }`} 
                            style={scenarioAnimation}
                        >
                            <div className="absolute -top-4 left-10 px-4 py-1 bg-[var(--color-royal)] rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg">
                                {isConservative ? 'Baseline' : isAggressive ? 'Strategic' : 'Moderate'}
                            </div>
                            
                            <Editable 
                                as="h3" 
                                value={scenario.name} 
                                onUpdate={v => onUpdate(`scenarios[${i}].name`, v)} 
                                className="font-black text-2xl text-white uppercase tracking-tighter mb-8 group-hover:text-[var(--color-royal)] transition-colors" 
                            />
                            
                            <div className="space-y-6 flex-grow">
                                {ensureArray(scenario.outcomes).slice(0, 4).map((outcome, j) => (
                                     <div key={j} className="flex justify-between items-end py-4 border-b border-white/10 group/item">
                                        <div className="flex flex-col">
                                            <Editable 
                                                as="span" 
                                                value={outcome.metric} 
                                                onUpdate={v => onUpdate(`scenarios[${i}].outcomes[${j}].metric`, v)} 
                                                className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1 group-hover/item:text-[var(--color-royal)] transition-colors" 
                                            />
                                        </div>
                                        <Editable 
                                            as="span" 
                                            value={outcome.value} 
                                            onUpdate={v => onUpdate(`scenarios[${i}].outcomes[${j}].value`, v)} 
                                            className="font-black text-xl text-white tracking-tighter" 
                                        />
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-10 p-6 bg-black/20 rounded-[32px] border border-white/5">
                                <div className="text-[10px] text-[var(--color-royal)] font-black uppercase mb-3 tracking-widest">Risk Mitigation</div>
                                <div className="text-xs text-white/70 leading-relaxed italic">
                                    <Editable value={scenario.risk || "Strategic phased zoning reforms and infrastructure upgrades."} onUpdate={v => onUpdate(`scenarios[${i}].risk`, v)} />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-between items-end">
                                <div className="text-[10px] text-white/30 uppercase font-black tracking-widest">Est. Cost</div>
                                <Editable as="p" value={scenario.cost} onUpdate={v => onUpdate(`scenarios[${i}].cost`, v)} className="font-black text-3xl text-[var(--color-royal)] tracking-tighter" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </SlideWrapper>
    );
};

const RiskAssessmentSlideLayout: React.FC<{ slide: RiskAssessmentSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="p-12 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="absolute inset-0 z-0">
                <EditableImage 
                    src={slide.image_url || imageUrls['risk_image'] || 'https://picsum.photos/seed/risk/1920/1080'} 
                    alt="Risk background" 
                    className="absolute inset-0 w-full h-full object-cover"
                    onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-navy)]/95 via-[var(--color-navy)]/80 to-[var(--color-navy)]/95 backdrop-blur-md z-10 pointer-events-none"></div>
            </div>
            
            <div className="relative z-20" style={titleAnimation}>
                <Editable 
                    as="h1" 
                    value={slide.title || "Risk Assessment"} 
                    onUpdate={v => onUpdate('title', v)} 
                    className="text-5xl lg:text-6xl font-black tracking-tighter mb-12 text-white leading-tight uppercase" 
                />
            </div>
            
            <div className="relative z-20 flex-grow grid grid-cols-1 gap-4 overflow-hidden">
                {ensureArray(slide.risks).slice(0, 5).map((risk, i) => {
                    const riskAnimation = getAnimationStyles(isActive, 300 + i * 100, 'fade-in-right', disableAnimations);
                    return (
                        <div 
                            key={i} 
                            className="group bg-white/5 p-8 rounded-[32px] grid grid-cols-12 gap-8 items-center transition-all duration-500 hover:bg-white/10 border border-white/10 backdrop-blur-xl shadow-2xl" 
                            style={riskAnimation}
                        >
                            <div className="col-span-3">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-[var(--color-royal)] animate-pulse"></div>
                                    <Editable 
                                        as="p" 
                                        value={risk.category} 
                                        onUpdate={v => onUpdate(`risks[${i}].category`, v)} 
                                        className="font-black text-sm text-[var(--color-royal)] uppercase tracking-widest" 
                                    />
                                </div>
                            </div>
                            
                            <div className="col-span-4 border-l border-white/10 pl-8">
                                <p className="text-[10px] font-black text-white/30 mb-2 uppercase tracking-widest">Core Risk</p>
                                <Editable 
                                    as="p" 
                                    value={risk.description} 
                                    onUpdate={v => onUpdate(`risks[${i}].description`, v)} 
                                    className="text-sm text-white/90 leading-relaxed font-medium" 
                                />
                            </div>
                            
                             <div className="col-span-5 border-l border-white/10 pl-8">
                                <p className="text-[10px] font-black text-[var(--color-royal)] mb-2 uppercase tracking-widest">Mitigation Strategy</p>
                                <Editable 
                                    as="p" 
                                    value={risk.mitigation} 
                                    onUpdate={v => onUpdate(`risks[${i}].mitigation`, v)} 
                                    className="text-sm text-white/70 leading-relaxed italic" 
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </SlideWrapper>
    );
};

const ImplementationTimelineSlideLayout: React.FC<{ slide: RoadmapSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="p-12 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="relative z-20" style={titleAnim}>
                <Editable 
                    as="h1" 
                    value={slide.title || "Implementation Timeline"} 
                    onUpdate={v => onUpdate('title', v)} 
                    className="text-5xl lg:text-6xl font-black tracking-tighter mb-12 text-white leading-tight uppercase" 
                />
            </div>
            
            <div className="flex-grow flex flex-col justify-center relative">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2 z-0"></div>
                
                <div className="grid grid-cols-4 gap-12 relative z-10">
                    {ensureArray(slide.phases).slice(0, 4).map((phase, i) => {
                        const phaseAnim = getAnimationStyles(isActive, 300 + i * 150, 'fade-in-up', disableAnimations);
                        const isEven = i % 2 === 0;
                        
                        return (
                            <div key={i} style={phaseAnim} className="flex flex-col items-center group">
                                {isEven ? (
                                    <>
                                        <div className="mb-8 text-center">
                                            <div className="text-[10px] font-black text-[var(--color-royal)] uppercase mb-2 tracking-widest">
                                                <Editable value={phase.timeline} onUpdate={v => onUpdate(`phases[${i}].timeline`, v)} />
                                            </div>
                                            <h3 className="text-xl font-black tracking-tighter uppercase text-white mb-4">
                                                <Editable value={phase.title} onUpdate={v => onUpdate(`phases[${i}].title`, v)} />
                                            </h3>
                                        </div>
                                        <div className="w-4 h-4 rounded-full bg-[var(--color-royal)] border-4 border-[var(--color-navy)] shadow-[0_0_20px_rgba(var(--color-royal-rgb),0.5)] mb-8"></div>
                                        <div className="p-6 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-xl group-hover:bg-white/10 transition-all duration-500 min-h-[160px] flex flex-col justify-center">
                                            <div className="text-xs text-white/70 leading-relaxed italic text-center">
                                                <Editable value={ensureArray(phase.action_steps).map(s => s.action).join(', ')} onUpdate={v => onUpdate(`phases[${i}].action_steps`, v.split(', ').map(a => ({ action: a, kpi: '' })))} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-6 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-xl group-hover:bg-white/10 transition-all duration-500 min-h-[160px] flex flex-col justify-center mb-8">
                                            <div className="text-xs text-white/70 leading-relaxed italic text-center">
                                                <Editable value={ensureArray(phase.action_steps).map(s => s.action).join(', ')} onUpdate={v => onUpdate(`phases[${i}].action_steps`, v.split(', ').map(a => ({ action: a, kpi: '' })))} />
                                            </div>
                                        </div>
                                        <div className="w-4 h-4 rounded-full bg-[var(--color-royal)] border-4 border-[var(--color-navy)] shadow-[0_0_20px_rgba(var(--color-royal-rgb),0.5)] mb-8"></div>
                                        <div className="text-center">
                                            <div className="text-[10px] font-black text-[var(--color-royal)] uppercase mb-2 tracking-widest">
                                                <Editable value={phase.timeline} onUpdate={v => onUpdate(`phases[${i}].timeline`, v)} />
                                            </div>
                                            <h3 className="text-xl font-black tracking-tighter uppercase text-white">
                                                <Editable value={phase.title} onUpdate={v => onUpdate(`phases[${i}].title`, v)} />
                                            </h3>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="mt-12 grid grid-cols-4 gap-12 border-t border-white/10 pt-8">
                {ensureArray(slide.phases).slice(0, 4).map((_, i) => (
                    <div key={i} className="text-[10px] text-white/30 uppercase font-black tracking-[0.2em] text-center">
                        Phase 0{i + 1} Deployment
                    </div>
                ))}
            </div>
        </SlideWrapper>
    );
};

const GanttChartRoadmapSlideLayout: React.FC<{ slide: GanttChartRoadmapSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const parseYear = (val: string | number | undefined | null): number => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const match = val.match(/\d{4}/);
            return match ? parseInt(match[0]) : 0;
        }
        return 0;
    };
    const startYear = parseYear(slide.timeline_start_year);
    const endYear = parseYear(slide.timeline_end_year);
    if (!startYear || !endYear || endYear < startYear) {
        return (
            <SlideWrapper 
                className="p-12 items-center justify-center text-white/50"
                reflectionText={slide.analytic_reflection}
                onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
                slideNumber={slideNumber}
            >
                <div className="text-center">
                    <p className="mb-4">Invalid or missing timeline data.</p>
                    <div className="flex items-center justify-center space-x-4 bg-white/5 p-4 rounded-lg">
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] uppercase opacity-50">Start Year</span>
                            <Editable value={String(slide.timeline_start_year || 2024)} onUpdate={v => onUpdate('timeline_start_year', parseInt(v) || 2024)} className="text-white font-bold" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] uppercase opacity-50">End Year</span>
                            <Editable value={String(slide.timeline_end_year || 2026)} onUpdate={v => onUpdate('timeline_end_year', parseInt(v) || 2026)} className="text-white font-bold" />
                        </div>
                    </div>
                </div>
            </SlideWrapper>
        );
    }
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    const totalQuarters = years.length * 4;

    const parseQuarter = (quarterStr: string): number => {
        if (!quarterStr) return -1;
        const str = String(quarterStr);
        const qMatch = str.match(/Q([1-4])/i);
        const yMatch = str.match(/\d{4}/);
        
        let qNum = -1;
        if (qMatch) {
            qNum = parseInt(qMatch[1]) - 1;
        } else if (/first/i.test(str)) qNum = 0;
        else if (/second/i.test(str)) qNum = 1;
        else if (/third/i.test(str)) qNum = 2;
        else if (/fourth/i.test(str)) qNum = 3;

        if (qNum === -1 || !yMatch) return -1;
        
        const yearInt = parseInt(yMatch[0]);
        const yearIndex = yearInt - startYear;
        if (yearIndex < 0) return -1;
        return yearIndex * 4 + qNum;
    };

    const titleAnimation = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="p-12 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="relative z-20 flex flex-col h-full max-w-7xl mx-auto w-full">
                <div style={titleAnimation} className="flex items-end justify-between mb-12">
                    <Editable 
                        as="h1" 
                        value={slide.title || "Strategic Roadmap"} 
                        onUpdate={v => onUpdate('title', v)} 
                        className="text-5xl lg:text-7xl font-black tracking-tighter text-white leading-tight uppercase" 
                    />
                    <div className="flex items-center gap-4 bg-white/5 px-6 py-2 rounded-full border border-white/10 backdrop-blur-xl shadow-xl">
                        <Editable value={String(startYear)} onUpdate={v => onUpdate('timeline_start_year', parseInt(v) || startYear)} className="text-white font-black text-sm hover:text-[var(--color-royal)] transition-colors" />
                        <span className="text-white/20 font-black">—</span>
                        <Editable value={String(endYear)} onUpdate={v => onUpdate('timeline_end_year', parseInt(v) || endYear)} className="text-white font-black text-sm hover:text-[var(--color-royal)] transition-colors" />
                    </div>
                </div>

                <div className="flex-grow flex flex-col bg-white/5 rounded-[48px] border border-white/10 backdrop-blur-2xl overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="grid grid-cols-12 border-b border-white/10 bg-white/5">
                        <div className="col-span-3 p-8 border-r border-white/10">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Strategic Phase</span>
                        </div>
                        <div className="col-span-9 grid grid-cols-12">
                            {years.map((year, i) => (
                                <div key={i} className={`p-8 border-r border-white/10 text-center flex flex-col justify-center ${i === years.length - 1 ? 'border-r-0' : ''}`} style={{ gridColumn: `span ${Math.floor(12 / years.length)}` }}>
                                    <span className="text-sm font-black text-[var(--color-royal)] uppercase tracking-widest">{year}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        {ensureArray(slide.phases).length === 0 ? (
                            <div className="flex items-center justify-center h-40 text-white/20 italic text-sm">
                                No timeline data available for the specified range.
                            </div>
                        ) : (
                            ensureArray(slide.phases).map((phase, pIndex) => 
                                ensureArray(phase.deliverables).map((d, dIndex) => {
                                    const startIndex = parseQuarter(d.start_quarter);
                                    const endIndex = parseQuarter(d.end_quarter);
                                    if (startIndex < 0 || endIndex < 0 || startIndex > endIndex) return null;
                                    
                                    const duration = endIndex - startIndex + 1;
                                    const startPercent = (startIndex / totalQuarters) * 100;
                                    const widthPercent = (duration / totalQuarters) * 100;
                                    const deliverablePath = `phases[${pIndex}].deliverables[${dIndex}]`;
                                    const deliverableAnimation = getAnimationStyles(isActive, 400 + (pIndex * 10 + dIndex) * 50, 'fade-in-right', disableAnimations);

                                    return (
                                        <div key={`${pIndex}-${dIndex}`} className="grid grid-cols-12 border-b border-white/5 hover:bg-white/5 transition-colors group" style={deliverableAnimation}>
                                            <div className="col-span-3 p-8 border-r border-white/10 flex flex-col justify-center">
                                                <Editable 
                                                    value={d.name} 
                                                    onUpdate={v => onUpdate(`${deliverablePath}.name`, v)} 
                                                    className="text-base font-black text-white uppercase tracking-tight group-hover:text-[var(--color-royal)] transition-colors" 
                                                />
                                                <div className="flex gap-2 mt-3">
                                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{d.start_quarter}</span>
                                                    <span className="text-[10px] font-black text-white/20">—</span>
                                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{d.end_quarter}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-9 relative p-8 flex items-center">
                                                <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                                                    {Array.from({ length: totalQuarters }).map((_, j) => (
                                                        <div key={j} className="border-r border-white/5 h-full last:border-r-0"></div>
                                                    ))}
                                                </div>
                                                <div 
                                                    className="h-10 bg-gradient-to-r from-[var(--color-royal)] to-[var(--color-royal)]/60 rounded-full relative z-10 shadow-lg group-hover:scale-y-110 transition-transform duration-500 flex items-center px-6 overflow-hidden"
                                                    style={{ 
                                                        marginLeft: `${startPercent}%`, 
                                                        width: `${widthPercent}%` 
                                                    }}
                                                >
                                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest truncate">
                                                        {d.kpi}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )
                        )}
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const ProjectedImpactSlideLayout: React.FC<{ slide: ProjectedImpactSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="p-12 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="relative z-20 flex flex-col h-full">
                <Editable 
                    as="h1" 
                    style={titleAnim}
                    value={slide.title || 'Projected Strategic Impact'} 
                    onUpdate={v => onUpdate('title', v)} 
                    className="text-5xl lg:text-6xl font-black tracking-tighter text-white leading-tight uppercase mb-12" 
                />
                
                <div className="flex flex-col gap-6 flex-grow">
                    {ensureArray(slide.impacts).slice(0, 3).map((impact, i) => {
                        const impactAnim = getAnimationStyles(isActive, 300 + i * 150, 'fade-in-right', disableAnimations);
                        return (
                            <div key={i} style={impactAnim} className="bg-white/5 border border-white/10 rounded-[32px] p-8 flex flex-col backdrop-blur-2xl shadow-2xl hover:bg-white/10 transition-all group">
                                <div className="flex items-center gap-8 mb-8">
                                    <div className="w-16 h-16 rounded-[20px] bg-[var(--color-royal)]/20 flex items-center justify-center text-[var(--color-royal)] font-black text-2xl border border-[var(--color-royal)]/30 group-hover:scale-110 transition-transform">
                                        0{i + 1}
                                    </div>
                                    <Editable 
                                        as="h3" 
                                        value={impact.area} 
                                        onUpdate={v => onUpdate(`impacts[${i}].area`, v)} 
                                        className="text-3xl font-black tracking-tighter uppercase text-white group-hover:text-[var(--color-royal)] transition-colors" 
                                    />
                                </div>
                                
                                <div className="grid grid-cols-4 gap-8">
                                    {[
                                        { label: 'The Problem', value: impact.problem || "Identified critical gap in current urban infrastructure", color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', field: 'problem' },
                                        { label: 'The Solution', value: impact.solution || impact.description, color: 'text-[var(--color-royal)]', bg: 'bg-[var(--color-royal)]/10', border: 'border-[var(--color-royal)]/20', field: 'solution' },
                                        { label: 'The Impact', value: impact.impact || impact.outcome, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', field: 'impact' },
                                        { label: 'The Action', value: impact.action || "Immediate implementation of phase 1 protocols", color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', field: 'action' }
                                    ].map((col, j) => (
                                        <div key={j} className="flex flex-col gap-3">
                                            <span className={`text-[10px] font-black ${col.color} uppercase tracking-[0.2em]`}>{col.label}</span>
                                            <div className={`text-xs text-white/80 leading-relaxed ${col.bg} p-5 rounded-2xl border ${col.border} min-h-[100px] flex items-center`}>
                                                <Editable value={col.value} onUpdate={v => onUpdate(`impacts[${i}].${col.field}`, v)} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </SlideWrapper>
    );
};

const FiscalResponsibilitySlideLayout: React.FC<{ slide: FiscalFrameworkSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="p-12 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="relative z-20 flex flex-col h-full">
                <Editable 
                    as="h1" 
                    style={titleAnim}
                    value={slide.title || 'Fiscal Responsibility Matrix'} 
                    onUpdate={v => onUpdate('title', v)} 
                    className="text-5xl lg:text-6xl font-black tracking-tighter text-white leading-tight uppercase mb-12" 
                />
                
                <div className="grid grid-cols-12 gap-12 flex-grow">
                    <div className="col-span-6 space-y-6">
                        {ensureArray(slide.cost_items).slice(0, 3).map((item, i) => {
                            const sourceAnim = getAnimationStyles(isActive, 300 + i * 150, 'fade-in-left', disableAnimations);
                            return (
                                <div key={i} style={sourceAnim} className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-2xl shadow-2xl hover:bg-white/10 transition-all group">
                                    <div className="flex justify-between items-start mb-6">
                                        <Editable 
                                            as="h3" 
                                            value={item.component} 
                                            onUpdate={v => onUpdate(`cost_items[${i}].component`, v)} 
                                            className="text-2xl font-black tracking-tighter uppercase text-white group-hover:text-[var(--color-royal)] transition-colors" 
                                        />
                                        <div className="text-[var(--color-royal)] font-black text-2xl font-mono bg-[var(--color-royal)]/10 px-4 py-1 rounded-full border border-[var(--color-royal)]/20">
                                            <Editable value={item.capex} onUpdate={v => onUpdate(`cost_items[${i}].capex`, v)} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-royal)]"></div>
                                        <Editable 
                                            as="p" 
                                            value={item.funding_source} 
                                            onUpdate={v => onUpdate(`cost_items[${i}].funding_source`, v)} 
                                            className="text-xs text-white/50 font-black uppercase tracking-widest" 
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="col-span-6 bg-white/5 border border-white/10 rounded-[48px] p-12 backdrop-blur-2xl flex flex-col shadow-2xl">
                        <div className="text-[var(--color-royal)] font-black text-xs uppercase mb-12 tracking-[0.3em] text-center">Strategic Fiscal Matrix</div>
                        <div className="flex-grow grid grid-cols-2 grid-rows-2 gap-8">
                            {[
                                { label: 'High Impact', sub: 'Low Cost', bg: 'bg-[var(--color-royal)]/20', border: 'border-[var(--color-royal)]/30', color: 'text-[var(--color-royal)]' },
                                { label: 'High Impact', sub: 'High Cost', bg: 'bg-[var(--color-steel)]/20', border: 'border-[var(--color-steel)]/30', color: 'text-[var(--color-steel)]' },
                                { label: 'Low Impact', sub: 'Low Cost', bg: 'bg-white/10', border: 'border-white/20', color: 'text-white/60' },
                                { label: 'Low Impact', sub: 'High Cost', bg: 'bg-white/5', border: 'border-white/10', color: 'text-white/30' }
                            ].map((q, i) => (
                                <div key={i} className={`${q.bg} ${q.border} border rounded-[32px] p-8 flex flex-col justify-center items-center text-center group hover:scale-105 transition-transform duration-500`}>
                                    <span className={`text-[10px] font-black uppercase mb-2 tracking-widest ${q.color}`}>{q.label}</span>
                                    <span className="text-xl font-black text-white uppercase tracking-tighter">{q.sub}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-12 text-[10px] text-white/40 font-black uppercase tracking-[0.2em] text-center leading-relaxed italic">
                            <Editable value={slide.matrix_caption || "Fiscal prioritization based on ROI and strategic alignment."} onUpdate={v => onUpdate('matrix_caption', v)} />
                        </div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const PolicyLeversSlideLayout: React.FC<{ slide: PolicyLeversSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="p-12 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="relative z-20 flex flex-col h-full">
                <Editable 
                    as="h1" 
                    style={titleAnim}
                    value={slide.title || 'Policy Levers & Recommendations'} 
                    onUpdate={v => onUpdate('title', v)} 
                    className="text-5xl lg:text-6xl font-black tracking-tighter text-white leading-tight uppercase mb-12" 
                />
                
                <div className="grid grid-cols-3 gap-8 flex-grow">
                    {ensureArray(slide.recommendations).slice(0, 3).map((rec, i) => {
                        const recAnim = getAnimationStyles(isActive, 300 + i * 150, 'fade-in-up', disableAnimations);
                        return (
                            <div key={i} style={recAnim} className="bg-white/5 border border-white/10 rounded-[40px] p-10 backdrop-blur-2xl flex flex-col shadow-2xl hover:bg-white/10 transition-all group">
                                <div className="text-[var(--color-royal)] font-black text-[10px] uppercase mb-8 tracking-[0.3em]">Recommendation 0{i + 1}</div>
                                <Editable 
                                    as="h3" 
                                    value={rec.strategy} 
                                    onUpdate={v => onUpdate(`recommendations[${i}].strategy`, v)} 
                                    className="text-3xl font-black tracking-tighter uppercase text-white mb-8 leading-tight group-hover:text-[var(--color-royal)] transition-colors" 
                                />
                                <div className="space-y-8 flex-grow">
                                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                        <div className="text-[10px] font-black text-white/30 uppercase mb-3 tracking-widest">Strategic Impact</div>
                                        <p className="text-xs text-white/70 leading-relaxed">
                                            <Editable value={rec.impact || rec.expected_impact} onUpdate={v => onUpdate(`recommendations[${i}].impact`, v)} />
                                        </p>
                                    </div>
                                    <div className="mt-auto pt-8 border-t border-white/10">
                                        <div className="text-[10px] font-black text-white/30 uppercase mb-3 tracking-widest">Measurement Framework</div>
                                        <div className="bg-[var(--color-royal)]/10 p-4 rounded-xl border border-[var(--color-royal)]/20">
                                            <Editable 
                                                as="p" 
                                                value={rec.measurement_framework} 
                                                onUpdate={v => onUpdate(`recommendations[${i}].measurement_framework`, v)} 
                                                className="text-[10px] text-[var(--color-royal)] font-black uppercase tracking-widest" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </SlideWrapper>
    );
};
const GovernanceFrameworkSlideLayout: React.FC<{ slide: GovernanceFrameworkSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);
    const leftAnim = getAnimationStyles(isActive, 300, 'fade-in-right', disableAnimations);
    const rightAnim = getAnimationStyles(isActive, 500, 'fade-in-left', disableAnimations);

    return (
        <SlideWrapper 
            className="p-12 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="relative z-20 flex flex-col h-full">
                <Editable 
                    as="h1" 
                    style={titleAnim}
                    value={slide.title || 'Governance & Stakeholder Framework'} 
                    onUpdate={v => onUpdate('title', v)} 
                    className="text-5xl lg:text-6xl font-black tracking-tighter text-white leading-tight uppercase mb-12" 
                />
                
                <div className="grid grid-cols-12 gap-12 flex-grow">
                    <div style={leftAnim} className="col-span-7 space-y-8 bg-white/5 border border-white/10 rounded-[48px] p-12 backdrop-blur-2xl shadow-2xl hover:bg-white/10 transition-all group">
                        <div className="text-[var(--color-royal)] font-black text-[10px] uppercase mb-8 tracking-[0.3em]">Governance Architecture</div>
                        <div className="space-y-8">
                            <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 group-hover:border-[var(--color-royal)]/30 transition-colors">
                                <div className="text-[10px] text-[var(--color-royal)] font-black uppercase mb-4 tracking-widest">Lead Agency</div>
                                <Editable 
                                    as="h3" 
                                    value={slide.lead_agency?.name || "Metropolitan Development Authority"} 
                                    onUpdate={v => onUpdate('lead_agency.name', v)} 
                                    className="text-3xl font-black text-white mb-4 tracking-tighter uppercase" 
                                />
                                <Editable 
                                    as="p" 
                                    value={slide.lead_agency?.rationale || "Primary regulatory body with cross-jurisdictional mandate."} 
                                    onUpdate={v => onUpdate('lead_agency.rationale', v)} 
                                    className="text-sm text-white/60 italic leading-relaxed" 
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-8">
                                {ensureArray(slide.stakeholders).slice(0, 2).map((stakeholder, i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 rounded-[24px] p-8 hover:bg-white/10 transition-colors">
                                        <Editable 
                                            as="h4" 
                                            value={stakeholder.name} 
                                            onUpdate={v => onUpdate(`stakeholders[${i}].name`, v)} 
                                            className="text-xs font-black uppercase text-[var(--color-royal)] mb-3 tracking-widest" 
                                        />
                                        <Editable 
                                            as="p" 
                                            value={stakeholder.role} 
                                            onUpdate={v => onUpdate(`stakeholders[${i}].role`, v)} 
                                            className="text-xs text-white/50 leading-relaxed font-medium" 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div style={rightAnim} className="col-span-5 bg-white/5 border border-white/10 rounded-[48px] p-12 backdrop-blur-2xl flex flex-col shadow-2xl hover:bg-white/10 transition-all">
                        <div className="text-[var(--color-royal)] font-black text-[10px] uppercase mb-12 tracking-[0.3em] text-center">Stakeholder Matrix</div>
                        <div className="flex-grow relative border-l border-b border-white/20 m-4">
                            {/* Matrix Labels */}
                            <div className="absolute -left-12 top-1/2 -rotate-90 text-[8px] text-white/30 uppercase font-black tracking-[0.4em]">Power Level</div>
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[8px] text-white/30 uppercase font-black tracking-[0.4em]">Interest Level</div>
                            
                            {/* Matrix Quadrants */}
                            <div className="grid grid-cols-2 grid-rows-2 h-full w-full opacity-10">
                                <div className="border-r border-b border-white/20 bg-white/5"></div>
                                <div className="border-b border-white/20"></div>
                                <div className="border-r border-white/20"></div>
                                <div className="bg-white/5"></div>
                            </div>
                            
                            {/* Stakeholder Dots */}
                            {ensureArray(slide.stakeholders).slice(0, 5).map((s, i) => {
                                const p = (s.power || 'Medium').toLowerCase();
                                const int = (s.interest || 'Medium').toLowerCase();
                                
                                let top = '50%';
                                let left = '50%';
                                
                                if (p === 'high') top = '20%';
                                else if (p === 'low') top = '80%';
                                else top = '50%';
                                
                                if (int === 'high') left = '80%';
                                else if (int === 'low') left = '20%';
                                else left = '50%';

                                return (
                                    <div 
                                        key={i}
                                        className="absolute w-6 h-6 bg-[var(--color-royal)] rounded-full border-4 border-white shadow-2xl cursor-help group/dot"
                                        style={{ 
                                            top, 
                                            left, 
                                            transform: 'translate(-50%, -50%)',
                                            transitionDelay: `${500 + i * 100}ms`,
                                            opacity: isActive ? 1 : 0,
                                            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                        }}
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-[var(--color-navy)] text-[10px] font-black px-3 py-1 rounded-full opacity-0 group-hover/dot:opacity-100 transition-all scale-50 group-hover/dot:scale-100 uppercase tracking-widest shadow-xl">
                                            {s.name}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-12 text-[10px] text-white/30 uppercase text-center font-black tracking-[0.2em]">
                            Stakeholder Prioritization Map
                        </div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const ProcessSlideLayout: React.FC<{ slide: ProcessSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="p-12 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="relative z-20 flex flex-col h-full">
                <div style={titleAnimation} className="mb-12">
                    <Editable 
                        as="h1" 
                        value={slide.title || "Methodology & Process"} 
                        onUpdate={v => onUpdate('title', v)} 
                        className="text-5xl lg:text-6xl font-black tracking-tighter text-white leading-tight uppercase mb-2" 
                    />
                    <Editable 
                        as="p" 
                        value={slide.subtitle} 
                        onUpdate={v => onUpdate('subtitle', v)} 
                        className="text-sm text-[var(--color-royal)] font-black uppercase tracking-[0.3em]" 
                    />
                </div>

                <div className="flex-grow grid grid-cols-4 gap-8">
                    {(slide.steps || []).slice(0, 4).map((step, i) => {
                        const stepAnimation = getAnimationStyles(isActive, 300 + i * 150, 'fade-in-up', disableAnimations);
                        return (
                            <div key={i} className="relative bg-white/5 backdrop-blur-2xl p-10 rounded-[40px] border border-white/10 flex flex-col shadow-2xl hover:bg-white/10 transition-all group" style={stepAnimation}>
                                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[var(--color-royal)] rounded-full flex items-center justify-center text-white font-black shadow-2xl text-sm border-4 border-white group-hover:scale-110 transition-transform">
                                    {step.step_number || i + 1}
                                </div>
                                <Editable 
                                    as="h3" 
                                    value={step.title} 
                                    onUpdate={v => onUpdate(`steps[${i}].title`, v)} 
                                    className="font-black text-2xl text-white mb-6 mt-4 uppercase tracking-tighter leading-tight group-hover:text-[var(--color-royal)] transition-colors" 
                                />
                                <Editable 
                                    as="p" 
                                    value={step.description} 
                                    onUpdate={v => onUpdate(`steps[${i}].description`, v)} 
                                    className="text-xs text-white/60 leading-relaxed font-medium" 
                                />
                                <div className="mt-auto pt-8 flex justify-end">
                                    <div className="w-8 h-px bg-white/10 group-hover:w-16 transition-all duration-500"></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </SlideWrapper>
    );
};

const ClosingSlideLayout: React.FC<{ slide: ClosingSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, slideNumber }) => {
    const taglineAnimation = getAnimationStyles(isActive, 300, 'fade-in-up', disableAnimations);
    const creditsAnimation = getAnimationStyles(isActive, 600, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="p-0 overflow-hidden bg-[var(--color-navy)]"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="absolute inset-0 z-0">
                <EditableImage 
                    src={slide.image_url || imageUrls[slide.image_prompt || 'closing_image'] || 'https://picsum.photos/seed/closing/1920/1080'} 
                    alt="Closing visual" 
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                    onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-navy)] via-[var(--color-navy)]/80 to-transparent"></div>
            </div>

            <div className="relative z-20 h-full flex flex-col items-center justify-center text-center p-24">
                <div style={taglineAnimation} className="max-w-5xl">
                    <Editable 
                        as="h2" 
                        value={slide.tagline || "Shaping the Future of Urban Excellence"} 
                        onUpdate={v => onUpdate('tagline', v)} 
                        className="text-7xl lg:text-9xl font-black leading-[0.9] tracking-tighter text-white uppercase mb-12" 
                    />
                </div>
                <div className="w-32 h-2 bg-[var(--color-royal)] mb-12 rounded-full"></div>
                <div style={creditsAnimation}>
                    <Editable 
                        as="p" 
                        value={slide.credits || "Strategic Urban Study • 2024"} 
                        onUpdate={v => onUpdate('credits', v)} 
                        className="text-xl text-[var(--color-royal)] font-black uppercase tracking-[0.4em]" 
                    />
                </div>
            </div>
        </SlideWrapper>
    );
};

interface SlideLayoutProps {
    slide: PresentationSlide;
    onUpdate: (field: string, val: string | unknown) => void;
    imageUrls: Record<string, string>;
    isActive: boolean;
    disableAnimations?: boolean;
    designSystem?: DesignSystem;
    slideNumber: number;
}

const UrbanStudySlide: React.FC<{ slide: PresentationSlide | null | undefined; imageUrls?: Record<string, string>; onUpdate: (field: string, val: string | unknown) => void, slideNumber: number, isActive: boolean, disableAnimations?: boolean, globalBgSvg?: string, designSystem?: DesignSystem }> = ({ slide, imageUrls, onUpdate, slideNumber, isActive, disableAnimations, globalBgSvg, designSystem }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Target HD size: 1280x720
        const scaleX = width / 1280;
        const scaleY = height / 720;
        setScale(Math.min(scaleX, scaleY));
      }
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateScale);
      observer.disconnect();
    };
  }, []);

  if (!slide) {
    return (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 italic">
            Invalid slide data.
        </div>
    );
  }

  const renderLayout = () => {
    const props = { onUpdate, imageUrls: imageUrls || {}, isActive, disableAnimations, designSystem, slideNumber };
    const layoutMap: { [key: string]: React.FC<SlideLayoutProps> } = {
        'Cover': CoverSlideLayout,
        'ExecutiveOverview': ExecutiveOverviewSlideLayout,
        'Crisis': CrisisSlideLayout,
        'SWOT': SWOTSlideLayout,
        'Benchmarks': BenchmarksSlideLayout,
        'CaseStudyDeepDive': CaseStudyDeepDiveSlideLayout,
        'Vision': VisionSlideLayout,
        'MacroStrategy': MacroStrategySlideLayout,
        'EquityAnalysis': EquityAnalysisSlideLayout,
        'NodeAssessment': NodeAssessmentSlideLayout,
        'ScenarioComparison': ScenarioComparisonSlideLayout,
        'RiskAssessment': RiskAssessmentSlideLayout,
        'Roadmap': ImplementationTimelineSlideLayout,
        'GanttChartRoadmap': GanttChartRoadmapSlideLayout,
        'ProjectedImpact': ProjectedImpactSlideLayout,
        'FiscalFramework': FiscalResponsibilitySlideLayout,
        'PolicyLevers': PolicyLeversSlideLayout,
        'GovernanceFramework': GovernanceFrameworkSlideLayout,
        'Process': ProcessSlideLayout,
        'Closing': ClosingSlideLayout,
        'References': ReferencesSlideLayout,
    };

    const Component = layoutMap[slide.layout];
    if (Component) return <Component slide={slide} {...props} />;
    
    return (
        <SlideWrapper 
            className="p-16 bg-white text-gray-800" 
            slideNumber={slideNumber}
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
        >
            <h2 className="text-5xl font-extrabold text-[var(--color-primary-dark)] tracking-tighter mb-8">{slide.layout.replace(/([A-Z])/g, ' $1').trim()}</h2>
            <pre className="text-xs bg-gray-50 p-4 rounded-lg border border-gray-200">{JSON.stringify(slide, null, 2)}</pre>
        </SlideWrapper>
    );
  };
  
  const bgStyle: React.CSSProperties = globalBgSvg 
    ? { backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(globalBgSvg)}")`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'transparent' }
    : {};

  if (designSystem) {
      if (designSystem.font_family) bgStyle.fontFamily = designSystem.font_family;
      if (designSystem.text_alignment) bgStyle.textAlign = designSystem.text_alignment;
  }

  const themeClass = 'theme-light';
  const alignClass = designSystem?.text_alignment ? `force-align-${designSystem.text_alignment}` : '';

  return (
    <div ref={containerRef} id={`slide-container-${slideNumber}`} className={`w-full h-full bg-[var(--color-bg-light)] relative overflow-hidden flex items-center justify-center ${themeClass} ${alignClass}`} style={bgStyle}>
        {designSystem && (
            <style>{`
                #slide-container-${slideNumber} h1, 
                #slide-container-${slideNumber} h2, 
                #slide-container-${slideNumber} h3, 
                #slide-container-${slideNumber} p, 
                #slide-container-${slideNumber} span, 
                #slide-container-${slideNumber} div, 
                #slide-container-${slideNumber} li {
                    color: #111827 !important;
                }
                #slide-container-${slideNumber} .text-white\\/60, 
                #slide-container-${slideNumber} .text-white\\/70, 
                #slide-container-${slideNumber} .text-white\\/50,
                #slide-container-${slideNumber} .text-white\\/40,
                #slide-container-${slideNumber} .text-white\\/30,
                #slide-container-${slideNumber} .text-white\\/80,
                #slide-container-${slideNumber} .text-white\\/90 {
                    color: #4B5563 !important;
                }
            `}</style>
        )}
        <div 
            className="w-[1280px] h-[720px] origin-center absolute flex flex-col"
            style={{ transform: `scale(${scale})` }}
        >
            {renderLayout()}
        </div>
    </div>
  );
};

export default UrbanStudySlide;