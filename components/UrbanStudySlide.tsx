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
    referenceText?: string,
    onReflectionUpdate?: (val: string) => void,
    onReferenceUpdate?: (val: string) => void,
    slideNumber?: number,
    hideFooter?: boolean,
    hideReflection?: boolean,
    hideReference?: boolean,
    hideSlideNumber?: boolean
}> = ({ 
    children, 
    className = '', 
    style, 
    reflectionText, 
    referenceText, 
    onReflectionUpdate, 
    onReferenceUpdate, 
    slideNumber,
    hideFooter = false,
    hideReflection = false,
    hideReference = false,
    hideSlideNumber = false
}) => {
    const { presentationTemplateUrl } = useBranding();
    
    const isImageUrl = presentationTemplateUrl && (presentationTemplateUrl.endsWith('.png') || presentationTemplateUrl.endsWith('.jpg') || presentationTemplateUrl.endsWith('.jpeg'));

    const showReflection = reflectionText !== undefined && !hideReflection;
    const showReference = referenceText !== undefined && !hideReference;
    const showSlideNumber = slideNumber !== undefined && !hideSlideNumber;

    return (
        <div className={`w-full h-full bg-[var(--color-bg-light)] flex flex-col overflow-hidden relative font-sans ${className}`} style={style}>
            {/* Background Image */}
            {isImageUrl && (
                <img 
                    src={presentationTemplateUrl} 
                    alt="Presentation Template" 
                    className="absolute inset-0 w-full h-full object-cover z-0" 
                    crossOrigin="anonymous" 
                    referrerPolicy="no-referrer"
                />
            )}
            {/* Dark overlay if using a custom background to ensure text readability */}
            {presentationTemplateUrl && <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none backdrop-blur-[1px]"></div>}
            
            <div className={`relative z-10 w-full flex-1 flex flex-col min-h-0 pt-24 pb-12 px-10 lg:px-16 ${showReflection ? 'pb-4' : 'pb-12'} overflow-hidden`}>
                {children}
            </div>

            {/* Global Footer Elements */}
            {!hideFooter && (
                <>
                    {showSlideNumber && (
                        <div className="absolute top-8 right-12 text-sm font-mono font-bold text-current opacity-50 z-30 slide-footer-text uppercase flex flex-col items-end">
                            <span>Slide {String(slideNumber).padStart(2, '0')}</span>
                            {showReference && (
                                <div className="mt-2 bg-white/5 border border-white/10 px-2 py-1 rounded text-[9px] font-mono opacity-60 max-w-[200px] truncate">
                                    <Editable value={referenceText} onUpdate={onReferenceUpdate || (() => {})} className="p-0 m-0" />
                                </div>
                            )}
                        </div>
                    )}
                    <div className="absolute top-6 left-12 z-30 opacity-20 slide-footer-logo hover:opacity-40 transition-opacity">
                        <TanmyaaLogoPPTX className="!text-[var(--color-primary-dark)]" />
                    </div>
                </>
            )}

            {showReflection && (
                <div className="relative z-20 px-8 pb-6 shrink-0">
                    <div className="bg-[var(--color-bg-light)] border border-[var(--color-primary-medium)]/20 rounded-2xl p-4 flex items-start shadow-2xl border-l-8 border-l-[var(--color-primary-dark)]">
                        <div className="bg-[var(--color-primary-dark)]/10 text-[var(--color-primary-dark)] text-[10px] font-black px-2 py-1 rounded-md mr-4 uppercase shrink-0 mt-0.5 tracking-widest">Principal Strategist Reflection</div>
                        <Editable value={reflectionText} onUpdate={onReflectionUpdate} className="text-sm text-current opacity-90 italic leading-relaxed font-light" />
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
                crossOrigin="anonymous"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-30">
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-current" fill="none" viewBox="0 0 24" stroke="currentColor">
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

const SlideHeader: React.FC<{ 
    label: string, 
    title: string | undefined | null, 
    onTitleUpdate: (val: string) => void,
    color?: string,
    style?: React.CSSProperties,
    className?: string
}> = ({ label, title, onTitleUpdate, color = 'var(--color-primary-medium)', style, className = '' }) => (
    <div style={style} className={`mb-10 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
            <div className="h-[2px] w-12" style={{ backgroundColor: color }}></div>
            <span className="text-[11px] font-black uppercase tracking-[0.3em] font-sans" style={{ color }}>{label}</span>
        </div>
        <h2 className="text-5xl font-black tracking-tighter uppercase leading-[0.95] text-left text-[var(--color-primary-dark)]">
            <Editable value={title} onUpdate={onTitleUpdate} />
        </h2>
    </div>
);

// --- REDESIGNED DOCTRINE-STYLE LAYOUTS ---

const CoverSlideLayout: React.FC<{ slide: CoverSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const subtitleAnim = getAnimationStyles(isActive, 400, 'fade-in-up', disableAnimations);
    const metaAnim = getAnimationStyles(isActive, 600, 'fade-in', disableAnimations);

    return (
        <SlideWrapper 
            className="justify-center items-center text-center relative overflow-hidden bg-black"
            hideReference
            hideSlideNumber
            slideNumber={slideNumber}
        >
            <EditableImage 
                src={slide.image_url || imageUrls['cover_image'] || 'https://picsum.photos/seed/urban/1920/1080'} 
                alt="Cover Background" 
                className="absolute inset-0 w-full h-full z-0 opacity-60 scale-105"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90 z-1"></div>
            
            <div className="relative z-10 max-w-6xl flex flex-col items-center px-12">
                <div style={metaAnim} className="flex items-center gap-8 mb-12">
                    <div className="h-[2px] w-24 bg-[var(--color-primary-medium)]"></div>
                    <span className="text-xs font-black tracking-[0.6em] uppercase text-white">
                        Strategic Masterplan Framework
                    </span>
                    <div className="h-[2px] w-24 bg-[var(--color-primary-medium)]"></div>
                </div>
                
                <h1 
                    style={titleAnim}
                    className="text-8xl lg:text-[11rem] font-black tracking-tighter leading-[0.8] mb-12 uppercase text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                >
                    <Editable value={slide.title} onUpdate={v => onUpdate('title', v)} />
                </h1>
                
                <div style={subtitleAnim} className="mb-24">
                    <p className="text-2xl lg:text-3xl text-white font-medium max-w-4xl leading-tight italic opacity-90">
                        <Editable value={slide.subtitle} onUpdate={v => onUpdate('subtitle', v)} />
                    </p>
                </div>

                <div style={metaAnim} className="grid grid-cols-3 gap-24 border-t border-white/30 pt-16 w-full">
                    <div className="flex flex-col items-center">
                        <span className="text-[11px] font-black text-[var(--color-primary-medium)] uppercase tracking-[0.5em] mb-3">Project Code</span>
                        <Editable value={slide.project_code || "TAN-2025-001"} onUpdate={v => onUpdate('project_code', v)} className="text-lg font-black text-white uppercase tracking-widest" />
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[11px] font-black text-[var(--color-primary-medium)] uppercase tracking-[0.5em] mb-3">Year</span>
                        <Editable value={slide.year || "2026"} onUpdate={v => onUpdate('year', v)} className="text-lg font-black text-white uppercase tracking-widest" />
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[11px] font-black text-[var(--color-primary-medium)] uppercase tracking-[0.5em] mb-3">Strategic Date</span>
                        <span className="text-lg font-black text-white uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>
            
            {/* Luxury Accents */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[var(--color-primary-medium)] to-transparent opacity-70 z-30"></div>
            <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[var(--color-primary-medium)] to-transparent opacity-70 z-30"></div>
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
            className="flex flex-col text-left relative overflow-hidden"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Urban Planning Framework (2025)"}
            onReferenceUpdate={v => onUpdate('reference_doc', v)}
            slideNumber={slideNumber}
        >
            {/* Subtle background accent */}
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[var(--color-primary-medium)]/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>
            
            <div className="grid grid-cols-12 gap-12 h-full relative z-10 overflow-hidden">
                <div className="col-span-7 flex flex-col justify-center text-left">
                    <SlideHeader 
                        label="Executive Summary & Strategic Intent"
                        title={slide.title}
                        onTitleUpdate={v => onUpdate('title', v)}
                        style={titleAnim}
                    />
                    <div 
                        style={contentAnim}
                        className="text-xl text-current opacity-90 font-medium leading-relaxed mb-12 border-l-8 border-[var(--color-primary-medium)] pl-8 text-left italic line-clamp-5"
                    >
                        <Editable value={slide.narrative} onUpdate={v => onUpdate('narrative', v)} useMarkdown />
                    </div>
                    <div style={pointsAnim} className="grid grid-cols-2 gap-6">
                        {ensureArray(slide.key_points).slice(0, 4).map((point, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md hover:bg-white/10 transition-all group shadow-lg">
                                <div className="text-[var(--color-primary-medium)] font-black text-[10px] uppercase mb-2 tracking-[0.3em] opacity-60 group-hover:opacity-100 transition-opacity">Strategic Pillar 0{idx + 1}</div>
                                <Editable 
                                    value={point} 
                                    onUpdate={v => onUpdate(`key_points[${idx}]`, v)} 
                                    className="text-sm text-current font-bold leading-snug line-clamp-3" 
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div style={imageAnim} className="col-span-5 relative rounded-[40px] overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10">
                    <EditableImage 
                        src={slide.image_url || imageUrls[slide.image_prompt] || 'https://picsum.photos/seed/urban-overview/1920/1080'} 
                        alt={slide.title} 
                        onUpdate={url => onUpdate('image_url', url)}
                        className="w-full h-full object-cover transition-all duration-1000 scale-110 group-hover:scale-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent"></div>
                    <div className="absolute bottom-12 left-12 right-12">
                        <div className="text-[var(--color-primary-medium)] font-black text-sm uppercase mb-3 tracking-[0.4em]">Contextual Visual</div>
                        <div className="text-current opacity-90 text-lg font-mono uppercase tracking-tighter leading-tight">Strategic Site Analysis Reference</div>
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
            className="flex flex-col justify-center"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <div className="max-w-5xl mb-8 overflow-hidden">
                <SlideHeader 
                    label="Critical Assessment & Problem Relevance"
                    title={slide.title}
                    onTitleUpdate={v => onUpdate('title', v)}
                    color="var(--color-accent-dark)"
                    style={titleAnim}
                />
                <div className="grid grid-cols-2 gap-8">
                    <div 
                        style={contentAnim}
                        className="text-sm text-current opacity-80 font-light leading-relaxed border-l-4 border-[var(--color-accent-dark)] pl-4 line-clamp-4"
                    >
                        <div className="mb-3 font-bold text-[var(--color-accent-medium)] uppercase text-xs">Problem Statement</div>
                        <Editable value={slide.problem_statement} onUpdate={v => onUpdate('problem_statement', v)} />
                    </div>
                    <div 
                        style={contentAnim}
                        className="text-sm text-current font-light leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/10 line-clamp-4"
                    >
                        <div className="mb-3 font-bold text-[var(--color-primary-medium)] uppercase text-xs">Strategic Relevance</div>
                        <Editable 
                            value={slide.analytic_reflection || "This study is critical because it addresses systemic urban failures that directly impact economic resilience and social equity. Failure to intervene now will lead to irreversible degradation of urban infrastructure and community wellbeing."} 
                            onUpdate={v => onUpdate('analytic_reflection', v)} 
                        />
                    </div>
                </div>
            </div>

            <div style={dataAnim} className="grid grid-cols-3 gap-6 pr-2 flex-grow items-center">
                {ensureArray(slide.key_data_points).slice(0, 3).map((point, idx) => (
                    <div key={idx} className="bg-white/5 border-l-4 border-[var(--color-accent-dark)] p-6 rounded-r-2xl backdrop-blur-md h-full flex flex-col justify-center">
                        <div className="text-4xl font-black tracking-tighter mb-1 text-current">
                            <MetricValueDisplay
                                value={point.value}
                                isActive={isActive}
                                numberClass="text-4xl font-black"
                                suffixClass="text-xl"
                                disableAnimations={disableAnimations}
                            />
                        </div>
                        <div className="text-xs font-bold uppercase text-[var(--color-accent-dark)] mb-2 truncate">
                            <Editable value={point.label} onUpdate={v => onUpdate(`key_data_points[${idx}].label`, v)} />
                        </div>
                        <div className="text-xs text-current opacity-80 leading-relaxed line-clamp-3">
                            <Editable value={point.description} onUpdate={v => onUpdate(`key_data_points[${idx}].description`, v)} />
                        </div>
                    </div>
                ))}
            </div>
        </SlideWrapper>
    );
};

const SWOTSection = ({ title, items, color, field, onUpdate }: { title: string, items: { title: string, description: string }[], color: string, field: string, onUpdate: (field: string, val: string) => void }) => (
    <div className={`bg-white/5 border-t-4 ${color} p-3 rounded-b-xl backdrop-blur-sm flex flex-col h-full`}>
        <h3 className="text-lg font-black tracking-tighter uppercase mb-2 flex items-center justify-between">
            {title}
            <span className={`w-1.5 h-1.5 rounded-full ${color.replace('border-', 'bg-')}`}></span>
        </h3>
        <div className="space-y-1.5 flex-grow pr-1">
            {ensureArray(items).slice(0, 4).map((item, idx) => (
                <div key={idx} className="group">
                    <div className="font-bold text-[10px] uppercase mb-0 text-current group-hover:text-[var(--color-primary-medium)] transition-colors truncate">
                        <Editable value={item.title} onUpdate={v => onUpdate(`${field}[${idx}].title`, v)} />
                    </div>
                    <div className="text-[10px] text-current opacity-80 leading-tight line-clamp-2">
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
            className="flex flex-col text-left"
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <div className="flex justify-between items-start mb-4">
                <h2 
                    style={titleAnim}
                    className="text-3xl font-black tracking-tighter uppercase text-left"
                >
                    <Editable value={slide.title || 'Strategic SWOT Analysis'} onUpdate={v => onUpdate('title', v)} />
                </h2>
                <div className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg backdrop-blur-md" style={titleAnim}>
                    <div className="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary-medium)] mb-0.5">Reference Documentation</div>
                    <div className="text-[10px] font-mono text-current opacity-80 uppercase">
                        <Editable value="Urban Planning Institute (2025) - Strategic Framework for Resilient Cities" onUpdate={v => onUpdate('reference', v)} />
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-12 gap-4 flex-grow overflow-hidden">
                <div className="col-span-9 grid grid-cols-2 grid-rows-2 gap-3 h-full">
                    <div style={sAnim} className="h-full"><SWOTSection title="Strengths" items={slide.strengths} color="border-[var(--color-success)]" field="strengths" onUpdate={onUpdate} /></div>
                    <div style={wAnim} className="h-full"><SWOTSection title="Weaknesses" items={slide.weaknesses} color="border-[var(--color-warning)]" field="weaknesses" onUpdate={onUpdate} /></div>
                    <div style={oAnim} className="h-full"><SWOTSection title="Opportunities" items={slide.opportunities} color="border-[var(--color-info)]" field="opportunities" onUpdate={onUpdate} /></div>
                    <div style={tAnim} className="h-full"><SWOTSection title="Threats" items={slide.threats} color="border-[var(--color-danger)]" field="threats" onUpdate={onUpdate} /></div>
                </div>
                
                <div style={listAnim} className="col-span-3 bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col">
                    <div className="text-[var(--color-primary-medium)] font-black text-[10px] uppercase mb-3 tracking-widest border-b border-white/10 pb-1.5">Prioritization List</div>
                    <div className="space-y-2 pr-1">
                        {ensureArray(slide.strengths).concat(ensureArray(slide.opportunities)).slice(0, 5).map((item, i) => (
                            <div key={i} className="flex gap-2 items-start">
                                <div className="w-4 h-4 rounded bg-[var(--color-primary-medium)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--color-primary-medium)] shrink-0">{i + 1}</div>
                                <div className="text-[10px] text-current opacity-80 leading-tight">
                                    <span className="font-bold block text-current truncate">{item.title}</span>
                                    <span className="opacity-60 line-clamp-1">{item.description.slice(0, 30)}...</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto pt-2 border-t border-white/10">
                        <div className="text-[10px] text-current opacity-80 uppercase font-mono">Priority Index: 0.84</div>
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
            className="flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <SlideHeader 
                label="Global, Regional & Local Benchmarks"
                title={slide.title || "Comparative Urban Benchmarking"}
                onTitleUpdate={v => onUpdate('title', v)}
                style={titleAnim}
            />
            <div className="grid grid-cols-4 gap-6 flex-grow overflow-hidden mt-4 pr-2">
                {ensureArray(slide.benchmarks).slice(0, 4).map((benchmark, i) => {
                    const benchmarkAnim = getAnimationStyles(isActive, 300 + i * 150, 'fade-in-up', disableAnimations);
                    const typeLabel = i === 0 ? 'Local' : i === 1 ? 'Regional' : 'Global';
                    return (
                        <div key={i} style={benchmarkAnim} className="group flex flex-col bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md hover:bg-white/10 transition-all duration-500 shadow-xl">
                            <div className="h-32 relative overflow-hidden">
                                <EditableImage 
                                    src={benchmark.image_url || imageUrls[benchmark.image_prompt] || `https://picsum.photos/seed/${benchmark.name}/800/600`} 
                                    alt={benchmark.name} 
                                    className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                                    onUpdate={(newUrl) => onUpdate(`benchmarks[${i}].image_url`, newUrl)}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute top-4 left-4 bg-[var(--color-primary-medium)] px-3 py-1 rounded-full text-[10px] font-black text-white uppercase border border-white/10 shadow-lg tracking-widest">
                                    {typeLabel}
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 text-white">
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{benchmark.location}</div>
                                    <h3 className="text-sm font-black tracking-tighter uppercase leading-tight truncate">
                                        <Editable value={benchmark.name} onUpdate={v => onUpdate(`benchmarks[${i}].name`, v)} />
                                    </h3>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col flex-grow">
                                <p className="text-sm text-current opacity-80 font-light leading-relaxed mb-4 line-clamp-3 italic">
                                    <Editable value={benchmark.introduction} onUpdate={v => onUpdate(`benchmarks[${i}].introduction`, v)} />
                                </p>
                                <div className="mt-auto space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {ensureArray(benchmark.interventions).slice(0, 3).map((item, j) => (
                                            <span key={j} className="text-[10px] font-black uppercase bg-white/10 px-2 py-1 rounded-lg text-current opacity-80 border border-white/5 tracking-tighter">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t border-white/10">
                                        <div className="text-[var(--color-primary-medium)] font-black text-[10px] uppercase mb-2 tracking-widest">Strategic Takeaway</div>
                                        <p className="text-xs text-current font-bold leading-snug line-clamp-2 tracking-tighter">
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
            className="flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <div className="grid grid-cols-12 gap-8 h-full overflow-hidden">
                <div className="col-span-12 lg:col-span-7 relative rounded-3xl overflow-hidden group">
                    <EditableImage 
                        src={slide.image_url || imageUrls[slide.image_prompt] || 'https://picsum.photos/seed/casestudy/1920/1080'} 
                        alt={slide.title} 
                        onUpdate={url => onUpdate('image_url', url)}
                        className="w-full h-full object-cover transition-all duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-8 left-8 right-8">
                        <div className="text-[var(--color-primary-medium)] font-bold text-[10px] uppercase mb-1 tracking-widest">Case Study Reference</div>
                        <h2 
                            style={titleAnim}
                            className="text-2xl font-black tracking-tighter uppercase text-current leading-tight"
                        >
                            <Editable value={slide.title} onUpdate={v => onUpdate('title', v)} />
                        </h2>
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-5 flex flex-col justify-center overflow-hidden">
                    <div 
                        style={contentAnim}
                        className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md"
                    >
                        <div className="text-sm text-current opacity-80 font-light leading-relaxed mb-4 italic border-l-2 border-[var(--color-primary-medium)] pl-3 line-clamp-3">
                            <Editable value={slide.introduction} onUpdate={v => onUpdate('introduction', v)} useMarkdown />
                        </div>
                        
                        <div className="space-y-3 mb-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary-medium)]">Key Strategic Findings</h3>
                            <div className="space-y-1.5">
                                {ensureArray(slide.key_findings).slice(0, 4).map((finding, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-[var(--color-primary-medium)] mt-1.5 flex-shrink-0"></div>
                                        <Editable 
                                            value={finding} 
                                            onUpdate={v => onUpdate(`key_findings[${idx}]`, v)} 
                                            className="text-[11px] text-current leading-relaxed line-clamp-1" 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <div className="text-base font-bold text-current leading-tight mb-2">
                                <Editable value={slide.conclusion} onUpdate={v => onUpdate('conclusion', v)} />
                            </div>
                            {slide.data_source && (
                                <div className="text-[10px] font-mono uppercase tracking-widest text-current opacity-60">
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
            className="flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <div className="grid grid-cols-12 gap-8 h-full">
                <div className="col-span-12 lg:col-span-5 flex flex-col justify-center">
                    <div style={titleAnim} className="flex items-center gap-3 mb-4">
                        <div className="h-px w-8 bg-[var(--color-primary-medium)]"></div>
                        <span className="text-xs font-bold uppercase text-[var(--color-primary-medium)]">Future State Vision</span>
                    </div>
                    <h2 
                        style={titleAnim}
                        className="text-3xl font-black tracking-tighter uppercase mb-3 leading-tight"
                    >
                        <Editable value={slide.title} onUpdate={v => onUpdate('title', v)} />
                    </h2>
                    <div 
                        style={visionAnim}
                        className="text-lg text-current opacity-90 font-light italic leading-tight mb-4"
                    >
                        &quot;<Editable value={slide.vision_statement} onUpdate={v => onUpdate('vision_statement', v)} />&quot;
                    </div>
                    <div style={pillarsAnim} className="space-y-3">
                        {ensureArray(slide.strategic_pillars).slice(0, 3).map((pillar, idx) => (
                            <div key={idx} className="group">
                                <div className="text-sm font-bold uppercase text-[var(--color-primary-medium)] mb-1 flex items-center gap-2">
                                    <span className="text-[10px] opacity-50 font-mono">Pillar 0{idx + 1}</span>
                                    <Editable value={pillar.title} onUpdate={v => onUpdate(`strategic_pillars[${idx}].title`, v)} />
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {ensureArray(pillar.initiatives).slice(0, 3).map((init, iidx) => (
                                        <span key={iidx} className="text-[10px] uppercase bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full text-current opacity-80">
                                            {init}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-7 relative rounded-2xl overflow-hidden shadow-2xl">
                    <EditableImage 
                        src={slide.image_url || imageUrls[slide.image_prompt] || 'https://picsum.photos/seed/crisis/1920/1080'} 
                        alt={slide.title} 
                        onUpdate={url => onUpdate('image_url', url)}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-transparent"></div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const MacroStrategySlideLayout: React.FC<{ slide: MacroStrategySlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <SlideHeader 
                label="Macro-Strategic Pillars"
                title={slide.title}
                onTitleUpdate={v => onUpdate('title', v)}
                style={titleAnimation}
            />
            <div className="relative z-20 mb-4">
                 <Editable as="p" value={slide.strategic_intent} className="text-sm text-current max-w-4xl leading-relaxed line-clamp-2 italic opacity-80" onUpdate={v => onUpdate('strategic_intent', v)} />
            </div>
            
            <div className="relative z-20 grid grid-cols-12 gap-8 flex-grow min-h-0">
                <div className="col-span-7 flex flex-col gap-4 overflow-hidden justify-center">
                    {ensureArray(slide.strategies).slice(0, 3).map((strategy, i) => {
                        const strategyAnimation = getAnimationStyles(isActive, 400 + i * 150, 'scale-in', disableAnimations);
                        return (
                            <div key={i} className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col transition-all hover:bg-white/10" style={strategyAnimation}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-[var(--color-primary-medium)] flex items-center justify-center text-xs font-bold text-current shadow-lg">0{i + 1}</div>
                                    <Editable as="h3" value={strategy.title} onUpdate={v => onUpdate(`strategies[${i}].title`, v)} className="font-black text-lg uppercase text-current tracking-tighter" />
                                </div>
                                <Editable as="p" value={strategy.description} onUpdate={v => onUpdate(`strategies[${i}].description`, v)} className="text-current opacity-80 text-xs leading-relaxed line-clamp-2 mb-3" useMarkdown />
                                <div className="pt-3 border-t border-white/10">
                                    <p className="text-[10px] font-black text-[var(--color-primary-medium)] uppercase tracking-widest mb-1">Strategic Rationale</p>
                                    <Editable as="p" value={strategy.rationale} onUpdate={v => onUpdate(`strategies[${i}].rationale`, v)} className="text-current opacity-90 text-xs italic leading-snug line-clamp-2"/>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="col-span-5 relative rounded-3xl overflow-hidden group shadow-2xl border border-white/10">
                    <EditableImage 
                        src={slide.image_url || imageUrls[slide.image_prompt] || 'https://picsum.photos/seed/strategy/800/1200'} 
                        alt="Perspective Visualization" 
                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
                        onUpdate={(newUrl) => onUpdate(`image_url`, newUrl)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                    <div className="absolute bottom-8 left-8 right-8">
                        <div className="text-[var(--color-primary-medium)] font-black text-xs uppercase mb-2 tracking-[0.3em]">Perspective Visualization</div>
                        <div className="text-current opacity-90 text-sm font-mono uppercase tracking-tighter">Strategic Implementation Reference</div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const EquityAnalysisSlideLayout: React.FC<{ slide: EquityAnalysisSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);
    const leftAnim = getAnimationStyles(isActive, 300, 'fade-in-right', disableAnimations);
    const centerAnim = getAnimationStyles(isActive, 400, 'fade-in-up', disableAnimations);
    const rightAnim = getAnimationStyles(isActive, 500, 'fade-in-left', disableAnimations);

    return (
        <SlideWrapper 
            className="flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <SlideHeader 
                label="Distributional Impact and Equity"
                title={slide.title}
                onTitleUpdate={v => onUpdate('title', v)}
                style={titleAnim}
            />
            <div className="grid grid-cols-12 gap-8 flex-grow min-h-0 overflow-hidden pr-2">
                <div style={leftAnim} className="col-span-4 flex flex-col gap-6 justify-center">
                    <div className="text-[var(--color-primary-medium)] font-black text-xs uppercase mb-2 tracking-widest border-b border-white/10 pb-2">Distributional Impacts</div>
                    <div className="space-y-4">
                        {ensureArray(slide.metrics).slice(0, 4).map((metric, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md transition-all hover:bg-white/10">
                                <h3 className="text-xs font-black uppercase text-current mb-2 leading-tight tracking-tighter">
                                    <Editable value={metric.dimension} onUpdate={v => onUpdate(`metrics[${i}].dimension`, v)} />
                                </h3>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="text-sm font-black text-current opacity-70 truncate max-w-[120px]">
                                        <Editable value={metric.current_state} onUpdate={v => onUpdate(`metrics[${i}].current_state`, v)} />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-[var(--color-primary-medium)] shrink-0" />
                                    <div className="text-sm font-black text-[var(--color-primary-medium)] truncate max-w-[120px]">
                                        <Editable value={metric.target_state} onUpdate={v => onUpdate(`metrics[${i}].target_state`, v)} />
                                    </div>
                                </div>
                                <div className="text-[11px] text-current opacity-60 italic leading-snug line-clamp-2">
                                    <Editable value={metric.impact_description} onUpdate={v => onUpdate(`metrics[${i}].impact_description`, v)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={centerAnim} className="col-span-4 relative rounded-3xl overflow-hidden border border-white/10 shadow-xl group">
                    <EditableImage 
                        src={slide.image_url || imageUrls['equity_image'] || 'https://picsum.photos/seed/equity/1920/1080'} 
                        alt={slide.title} 
                        onUpdate={url => onUpdate('image_url', url)}
                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                    <div className="absolute bottom-8 left-8 right-8">
                        <div className="text-[var(--color-primary-medium)] font-black text-xs uppercase mb-2 tracking-[0.3em]">Equity Context</div>
                        <div className="text-current opacity-90 text-sm font-mono uppercase tracking-tighter">Social Infrastructure Reference</div>
                    </div>
                </div>
                
                <div style={rightAnim} className="col-span-4 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md flex flex-col overflow-hidden shadow-xl">
                    <div className="text-[var(--color-primary-medium)] font-black text-xs uppercase mb-6 tracking-widest border-b border-white/10 pb-2 text-right">Mitigation Strategies</div>
                    <div className="space-y-4 flex-grow pr-2">
                        {ensureArray(slide.mitigation_strategies).slice(0, 4).map((item, i) => (
                            <div key={i} className="bg-black/20 p-5 rounded-2xl border border-white/5 text-right hover:bg-black/30 transition-all">
                                <div className="text-[11px] text-[var(--color-primary-medium)] font-black uppercase mb-2 tracking-widest">
                                    <Editable value={item.label || "Strategy"} onUpdate={v => onUpdate(`mitigation_strategies[${i}].label`, v)} />
                                </div>
                                <div className="text-sm font-black text-white leading-tight tracking-tighter">
                                    <Editable value={item.value || "Description"} onUpdate={v => onUpdate(`mitigation_strategies[${i}].value`, v)} />
                                </div>
                            </div>
                        ))}
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
    const contentAnimation = getAnimationStyles(isActive, 400, 'fade-in-up', disableAnimations);
    const conclusionAnimation = getAnimationStyles(isActive, 850, 'fade-in-up', disableAnimations);

    const overlayClassBefore = designSystem?.is_light_background ? "bg-white/10" : "bg-black/60";
    const overlayClassAfter = designSystem?.is_light_background ? "bg-white/10" : "bg-black/40";

    return (
        <SlideWrapper 
            className="p-0 text-center flex flex-col relative overflow-hidden"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <div className="absolute top-8 right-12 z-30 bg-[var(--color-primary-medium)]/20 text-[var(--color-primary-medium)] text-[10px] font-black px-4 py-1.5 rounded-full border border-[var(--color-primary-medium)]/30 uppercase tracking-[0.3em] backdrop-blur-md">
                Strategic Node Assessment
            </div>
            <div className="flex h-full relative z-10">
                <div className="w-1/2 h-full relative group overflow-hidden border-r border-white/10">
                    <EditableImage 
                        src={slide.before_image_url || imageUrls[slide.before_image_prompt] || 'https://picsum.photos/seed/urban-decay/800/600'} 
                        alt="Before" 
                        className="w-full h-full object-cover transition-all duration-1000 scale-110 group-hover:scale-100"
                        onUpdate={(newUrl) => onUpdate(`before_image_url`, newUrl)}
                    />
                    <div className={`absolute inset-0 ${overlayClassBefore} backdrop-blur-[1px]`}></div>
                    <div className="absolute top-10 left-10 bg-black/80 text-white px-4 py-1 text-[10px] font-black tracking-[0.4em] rounded-full border border-white/20">BASELINE</div>
                    <div className="absolute bottom-10 left-10 right-10 text-left">
                        <div className="text-[var(--color-primary-medium)] font-black text-[10px] uppercase mb-1 tracking-[0.2em]">Current State</div>
                        <div className="text-white text-sm font-medium opacity-80 italic">Legacy infrastructure and underutilized public realm.</div>
                    </div>
                </div>
                
                <div className="w-1/2 h-full relative group overflow-hidden">
                    <EditableImage 
                        src={slide.after_image_url || imageUrls[slide.after_image_prompt] || 'https://picsum.photos/seed/urban-future/800/600'} 
                        alt="After" 
                        className="w-full h-full object-cover transition-all duration-1000 scale-110 group-hover:scale-100"
                        onUpdate={(newUrl) => onUpdate(`after_image_url`, newUrl)}
                    />
                    <div className={`absolute inset-0 ${overlayClassAfter} backdrop-blur-[1px]`}></div>
                    <div className="absolute top-10 right-10 bg-[var(--color-primary-medium)] text-white px-4 py-1 text-[10px] font-black tracking-[0.4em] rounded-full border border-white/20">VISION</div>
                    <div className="absolute bottom-10 left-10 right-10 text-right">
                        <div className="text-[var(--color-primary-medium)] font-black text-[10px] uppercase mb-1 tracking-[0.2em]">Future Projection</div>
                        <div className="text-white text-sm font-medium opacity-80 italic">Integrated transit-oriented development and green corridors.</div>
                    </div>
                </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                <div style={titleAnimation} className="bg-black/60 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 max-w-2xl pointer-events-auto shadow-2xl">
                    <Editable as="h1" value={slide.title || "Node Assessment"} onUpdate={v => onUpdate('title', v)} className="text-4xl font-black tracking-tighter uppercase mb-4 text-[var(--color-accent-light)]" />
                    <div style={contentAnimation} className="space-y-4">
                        <div className="flex items-center justify-center gap-3">
                            <div className="h-px w-8 bg-white/20"></div>
                            <Editable as="p" value={slide.site_location} onUpdate={v => onUpdate('site_location', v)} className="text-sm font-bold text-white tracking-widest uppercase" />
                            <div className="h-px w-8 bg-white/20"></div>
                        </div>
                        <Editable as="p" value={slide.site_rationale} onUpdate={v => onUpdate('site_rationale', v)} className="text-xs md:text-sm text-white opacity-80 leading-relaxed italic" />
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-12 left-0 right-0 flex justify-center z-30 pointer-events-none">
                 <div style={conclusionAnimation} className="bg-[var(--color-primary-dark)] text-white p-4 px-8 rounded-full border border-white/10 max-w-2xl pointer-events-auto shadow-xl">
                    <Editable as="p" value={slide.conclusion} onUpdate={v => onUpdate('conclusion', v)} className="text-xs md:text-sm font-black uppercase tracking-widest" />
                </div>
            </div>
        </SlideWrapper>
    );
};

const ReferencesSlideLayout: React.FC<{ slide: ReferencesSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <h2 
                style={titleAnim}
                className="text-3xl font-black tracking-tighter uppercase mb-8"
            >
                <Editable value={slide.title || 'Strategic References & Data Sources'} onUpdate={v => onUpdate('title', v)} />
            </h2>
            <div className="grid grid-cols-2 gap-12 flex-grow overflow-hidden">
                <div className="space-y-4">
                    <div className="text-[var(--color-primary-medium)] font-bold text-sm uppercase mb-4">Academic & Policy References (APA Style)</div>
                    {ensureArray(slide.sources).slice(0, 6).map((source, i) => {
                        const refAnim = getAnimationStyles(isActive, 300 + i * 100, 'fade-in-left', disableAnimations);
                        const fullRef = `${source.author || 'Author'} (${source.year || 'Year'}). ${source.title || 'Title'}. ${source.relevance || 'Relevance'}`;
                        return (
                            <div key={i} style={refAnim} className="text-sm text-current leading-relaxed pl-4 border-l border-white/10 hover:border-[var(--color-primary-medium)] transition-colors">
                                <Editable value={fullRef} onUpdate={v => {
                                    // Simple heuristic to split back into parts if user edits the whole string
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
                                }} />
                            </div>
                        );
                    })}
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm flex flex-col">
                    <div className="text-[var(--color-primary-medium)] font-bold text-sm uppercase mb-6">Data Integrity Statement</div>
                    <p className="text-xs text-current opacity-90 font-light leading-relaxed italic mb-8">
                        All data presented in this study has been cross-referenced with official municipal records, satellite imagery analysis, and verified socio-economic indicators as of Q1 2025.
                    </p>
                    <div className="mt-auto space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-white/10">
                            <span className="text-sm text-current opacity-70 uppercase">Confidence Score</span>
                            <span className="text-lg font-black text-current">94%</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-white/10">
                            <span className="text-sm text-current opacity-70 uppercase">Data Sources</span>
                            <span className="text-lg font-black text-current">12+</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <span className="text-sm text-current opacity-70 uppercase">Last Verified</span>
                            <span className="text-lg font-black text-current">March 2026</span>
                        </div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const ScenarioComparisonSlideLayout: React.FC<{ slide: ScenarioComparisonSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="flex flex-col bg-[var(--color-bg-dark)]"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || "Scenario Comparison"} onUpdate={v => onUpdate('title', v)} className="text-2xl font-extrabold tracking-tighter mb-4 text-current" /></div>
            <div className="relative z-20 flex-grow grid grid-cols-3 gap-4 pr-2">
                {ensureArray(slide.scenarios).slice(0, 3).map((scenario, i) => {
                    const scenarioAnimation = getAnimationStyles(isActive, 350 + i * 150, 'scale-in', disableAnimations);
                    return (
                        <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col transition-all duration-300 hover:bg-white/10 hover:border-white/20" style={scenarioAnimation}>
                            <Editable as="h3" value={scenario.name} onUpdate={v => onUpdate(`scenarios[${i}].name`, v)} className="font-black text-base text-current text-center uppercase tracking-tighter mb-2" />
                            <div className="my-2 space-y-1">
                                {ensureArray(scenario.outcomes).slice(0, 3).map((outcome, j) => (
                                     <div key={j} className="flex justify-between items-center py-1 border-b border-white/5 text-[10px]">
                                        <Editable as="span" value={outcome.metric} onUpdate={v => onUpdate(`scenarios[${i}].outcomes[${j}].metric`, v)} className="text-current opacity-80 uppercase font-bold truncate max-w-[100px]" />
                                        <Editable as="span" value={outcome.value} onUpdate={v => onUpdate(`scenarios[${i}].outcomes[${j}].value`, v)} className="font-black text-current" />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-auto space-y-2">
                                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                    <div className="text-[10px] text-[var(--color-primary-medium)] font-bold uppercase mb-0.5">Risk & Mitigation</div>
                                    <div className="text-xs text-current leading-relaxed line-clamp-2">
                                        <Editable value={scenario.risk || "Implement phased zoning reforms and infrastructure upgrades."} onUpdate={v => onUpdate(`scenarios[${i}].risk`, v)} />
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-[10px] text-current opacity-60 uppercase font-bold">Est. Cost</div>
                                    <Editable as="p" value={scenario.cost} onUpdate={v => onUpdate(`scenarios[${i}].cost`, v)} className="font-black text-lg text-current" />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </SlideWrapper>
    );
};

const RiskAssessmentSlideLayout: React.FC<{ slide: RiskAssessmentSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/90";

    return (
        <SlideWrapper 
            className="flex flex-col relative overflow-hidden p-0"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <div className="absolute inset-0 z-0">
                <EditableImage 
                    src={slide.image_url || imageUrls['risk_image'] || 'https://picsum.photos/seed/risk-assessment/1920/1080'} 
                    alt="Risk background" 
                    className="absolute inset-0 w-full h-full object-cover"
                    onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
                />
                <div className={`absolute inset-0 ${overlayClass} backdrop-blur-md z-10 pointer-events-none`}></div>
            </div>
            
            <div className="relative z-20 flex flex-col h-full p-8">
                <div style={titleAnimation} className="mb-6 flex items-end justify-between border-b border-white/10 pb-4">
                    <div>
                        <div className="text-[var(--color-primary-medium)] font-black text-[10px] uppercase tracking-[0.4em] mb-1">Strategic Vulnerability Analysis</div>
                        <Editable as="h1" value={slide.title || "Risk Assessment"} onUpdate={v => onUpdate('title', v)} className="text-3xl font-black tracking-tighter uppercase text-white" />
                    </div>
                    <div className="text-right">
                        <div className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Assessment Matrix</div>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className={`h-1 w-4 rounded-full ${i <= 3 ? 'bg-[var(--color-accent-light)]' : 'bg-white/10'}`}></div>)}
                        </div>
                    </div>
                </div>
                
                <div className="flex-grow grid grid-cols-2 gap-4 overflow-hidden">
                    <div className="space-y-3 pr-2">
                        {ensureArray(slide.risks).slice(0, 3).map((risk, i) => {
                            const riskAnimation = getAnimationStyles(isActive, 350 + i * 100, 'fade-in-up', disableAnimations);
                            return (
                                <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 group" style={riskAnimation}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="text-[var(--color-primary-medium)] font-black text-[8px] uppercase tracking-[0.2em] mb-0.5">Category</div>
                                            <Editable as="p" value={risk.category} onUpdate={v => onUpdate(`risks[${i}].category`, v)} className="font-black text-base text-white uppercase tracking-tight" />
                                        </div>
                                        <div className="bg-white/10 px-2 py-0.5 rounded-full text-[8px] font-black text-white tracking-widest border border-white/10">
                                            {risk.impact_level || 'HIGH'}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <div className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-0.5">Description</div>
                                            <Editable as="p" value={risk.description} onUpdate={v => onUpdate(`risks[${i}].description`, v)} className="text-xs text-white opacity-80 leading-relaxed italic line-clamp-2" />
                                        </div>
                                        <div className="pt-2 border-t border-white/5">
                                            <div className="text-[var(--color-accent-light)] font-black text-[10px] uppercase tracking-widest mb-1">Mitigation Strategy</div>
                                            <Editable as="p" value={risk.mitigation} onUpdate={v => onUpdate(`risks[${i}].mitigation`, v)} className="text-xs text-white opacity-70 leading-relaxed" />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    
                    <div className="flex flex-col gap-6">
                        <div className="bg-[var(--color-primary-dark)]/40 p-8 rounded-[40px] border border-white/10 backdrop-blur-2xl flex-grow flex flex-col justify-center">
                            <div className="text-[var(--color-accent-light)] font-black text-[10px] uppercase tracking-[0.4em] mb-4 text-center">Strategic Conclusion</div>
                            <Editable as="p" value={slide.conclusion} onUpdate={v => onUpdate('conclusion', v)} className="text-xl md:text-2xl font-medium text-white text-center leading-tight italic" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
                                <div className="text-[var(--color-primary-medium)] font-black text-[10px] uppercase tracking-widest mb-2">Risk Index</div>
                                <div className="text-3xl font-black text-white">8.4<span className="text-sm opacity-40 ml-1">/10</span></div>
                            </div>
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
                                <div className="text-[var(--color-primary-medium)] font-black text-[10px] uppercase tracking-widest mb-2">Confidence</div>
                                <div className="text-3xl font-black text-white">92<span className="text-sm opacity-40 ml-1">%</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const ImplementationTimelineSlideLayout: React.FC<{ slide: RoadmapSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <SlideHeader 
                label="Implementation Roadmap & Strategic Timeline"
                title={slide.title}
                onTitleUpdate={v => onUpdate('title', v)}
                style={titleAnim}
            />
            <div className="flex-grow grid grid-cols-4 gap-8 items-stretch mt-4 pr-2">
                {ensureArray(slide.phases).slice(0, 4).map((phase, i) => {
                    const phaseAnim = getAnimationStyles(isActive, 300 + i * 150, 'fade-in-up', disableAnimations);
                    return (
                        <div key={i} style={phaseAnim} className="flex flex-col h-full group">
                            <div className="mb-6 pl-2 border-l-4 border-[var(--color-primary-medium)]">
                                <div className="text-xs font-black text-[var(--color-primary-medium)] uppercase mb-1 tracking-[0.2em]">
                                    <Editable value={phase.timeline} onUpdate={v => onUpdate(`phases[${i}].timeline`, v)} />
                                </div>
                                <h3 className="text-xl font-black tracking-tighter uppercase text-current leading-tight group-hover:text-[var(--color-accent-light)] transition-colors">
                                    <Editable value={phase.title} onUpdate={v => onUpdate(`phases[${i}].title`, v)} />
                                </h3>
                            </div>
                            
                            <div className="flex-grow bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md relative shadow-xl hover:bg-white/10 transition-all">
                                <div className="absolute -top-3 left-8 bg-[var(--color-primary-medium)] text-white text-[10px] font-black px-4 py-1 rounded-full uppercase shadow-lg tracking-widest">
                                    Phase 0{i + 1}
                                </div>
                                <div className="space-y-6 mt-4">
                                    <div className="text-[11px] font-black uppercase text-[var(--color-primary-medium)] tracking-[0.2em] border-b border-white/10 pb-2">Strategic Actions</div>
                                    <div className="space-y-4">
                                        {ensureArray(phase.action_steps).slice(0, 3).map((step, j) => (
                                            <div key={j} className="flex items-start gap-3 group/item">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-medium)] mt-1.5 shrink-0 group-hover/item:scale-150 transition-transform"></div>
                                                <div className="text-sm text-current opacity-80 leading-relaxed group-hover/item:opacity-100 transition-opacity">
                                                    <Editable value={step.action} onUpdate={v => onUpdate(`phases[${i}].action_steps[${j}].action`, v)} />
                                                </div>
                                            </div>
                                        ))}
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

const GanttChartRoadmapSlideLayout: React.FC<{ slide: GanttChartRoadmapSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem, slideNumber }) => {
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
                className="p-12 items-center justify-center text-current opacity-80"
                reflectionText={slide.analytic_reflection}
                onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
                referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
                onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
                slideNumber={slideNumber}
            >
                <div className="text-center">
                    <p className="mb-4">Invalid or missing timeline data.</p>
                    <div className="flex items-center justify-center space-x-4 bg-white/5 p-4 rounded-lg">
                        <div className="flex flex-col items-start">
                            <span className="text-sm uppercase opacity-50">Start Year</span>
                            <Editable value={String(slide.timeline_start_year || 2024)} onUpdate={v => onUpdate('timeline_start_year', parseInt(v) || 2024)} className="text-current font-bold" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-sm uppercase opacity-50">End Year</span>
                            <Editable value={String(slide.timeline_end_year || 2026)} onUpdate={v => onUpdate('timeline_end_year', parseInt(v) || 2026)} className="text-current font-bold" />
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

    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const yearHeaderAnimation = getAnimationStyles(isActive, 300, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper 
            className="flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <EditableImage 
                src={slide.image_url || imageUrls['gantt_image'] || 'https://picsum.photos/seed/gantt/1920/1080'} 
                alt="Gantt background" 
                className="absolute inset-0 w-full h-full z-0 opacity-10"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20 flex flex-col h-full overflow-hidden">
                <div style={titleAnimation} className="flex items-baseline justify-between mb-4">
                    <Editable as="h1" value={slide.title} onUpdate={v => onUpdate('title', v)} className="text-2xl font-black tracking-tighter uppercase text-current" />
                    <div className="flex items-center space-x-2 text-current opacity-70 text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                        <Editable value={String(startYear)} onUpdate={v => onUpdate('timeline_start_year', parseInt(v) || startYear)} className="hover:text-current transition-colors font-bold" />
                        <span className="opacity-30">&mdash;</span>
                        <Editable value={String(endYear)} onUpdate={v => onUpdate('timeline_end_year', parseInt(v) || endYear)} className="hover:text-current transition-colors font-bold" />
                    </div>
                </div>
                
                <div className="flex-grow flex flex-col min-h-0 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                    {/* Timeline Header */}
                    <div className="flex pl-[15%] border-b border-white/10 flex-shrink-0 bg-white/5">
                        <div className="w-full grid" style={{ gridTemplateColumns: `repeat(${years.length}, 1fr)` }}>
                            {years.map(year => (
                                <div key={year} className="text-center border-r border-white/10 last:border-0" style={yearHeaderAnimation}>
                                    <p className="font-black text-[var(--color-primary-medium)] text-[9px] py-1.5 uppercase tracking-[0.2em]">{year}</p>
                                    <div className="grid grid-cols-4 border-t border-white/5">
                                        {[1, 2, 3, 4].map(q => (
                                            <div key={q} className="text-[8px] font-bold text-current opacity-40 py-0.5 border-r border-white/5 last:border-0">Q{q}</div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chart Body */}
                    <div className="flex-grow pr-2 pb-2">
                        <div className="relative min-h-full flex flex-col">
                            {/* Vertical grid lines */}
                            <div className="absolute top-0 left-[20%] w-[80%] h-full grid" style={{ gridTemplateColumns: `repeat(${totalQuarters}, 1fr)` }}>
                                {Array.from({ length: totalQuarters }).map((_, i) => <div key={i} className={`h-full ${ (i + 1) % 4 === 0 ? 'border-r border-white/20' : 'border-r border-white/5'}`}></div>)}
                            </div>
        
                            {/* Labels and Bars */}
                            <div className="w-full relative z-10 space-y-0">
                                {ensureArray(slide.phases).length === 0 ? (
                                    <div className="flex items-center justify-center h-40 text-current opacity-50 italic text-sm">
                                        No timeline data available for the specified range.
                                    </div>
                                ) : (
                                    ensureArray(slide.phases).map((phase, pIndex) => 
                                        ensureArray(phase.deliverables).slice(0, 8).map((d, dIndex) => {
                                            const startIndex = parseQuarter(d.start_quarter);
                                            const endIndex = parseQuarter(d.end_quarter);
                                            if (startIndex < 0 || endIndex < 0 || startIndex > endIndex) return null;
                                            
                                            const duration = endIndex - startIndex + 1;
                                            const deliverablePath = `phases[${pIndex}].deliverables[${dIndex}]`;
                                            const deliverableAnimation = getAnimationStyles(isActive, 400 + (pIndex * (ensureArray(phase.deliverables).length) + dIndex) * 50, 'fade-in-up', disableAnimations);
            
                                            return (
                                                <div key={`${pIndex}-${dIndex}`} className="flex items-center h-8 relative group" style={deliverableAnimation}>
                                                    <div className="w-[15%] flex-shrink-0 pr-6 text-right">
                                                        <Editable as="p" value={d.name} onUpdate={v => onUpdate(`${deliverablePath}.name`, v)} className="text-[10px] font-black text-current opacity-90 truncate uppercase tracking-tighter" />
                                                    </div>
                                                    <div className="relative h-full flex-grow">
                                                        <div className="absolute h-4 top-1/2 -translate-y-1/2 rounded-full transition-all duration-300 group-hover:h-5 shadow-lg flex items-center px-3 z-30" style={{ 
                                                            left: `${(startIndex / totalQuarters) * 100}%`,
                                                            width: `${(duration / totalQuarters) * 100}%`,
                                                            backgroundColor: 'var(--color-primary-medium)',
                                                            opacity: 0.95
                                                        }}>
                                                            <div className="text-[9px] font-black text-white truncate w-full group-hover:opacity-100 transition-opacity drop-shadow-sm">
                                                                <Editable value={d.kpi} onUpdate={v => onUpdate(`${deliverablePath}.kpi`, v)} className="w-full" />
                                                            </div>
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
                </div>
            </div>
        </SlideWrapper>
    );
};

const ProjectedImpactSlideLayout: React.FC<{ slide: ProjectedImpactSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <h2 
                style={titleAnim}
                className="text-2xl font-black tracking-tighter uppercase mb-4"
            >
                <Editable value={slide.title || 'Projected Strategic Impact'} onUpdate={v => onUpdate('title', v)} />
            </h2>
            <div className="flex flex-col gap-3 flex-grow pr-2">
                {ensureArray(slide.impacts).slice(0, 3).map((impact, i) => {
                    const impactAnim = getAnimationStyles(isActive, 300 + i * 150, 'fade-in-right', disableAnimations);
                    return (
                        <div key={i} style={impactAnim} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-[var(--color-primary-medium)]/20 flex items-center justify-center text-[var(--color-primary-medium)] font-black text-xs border border-[var(--color-primary-medium)]/30">
                                    0{i + 1}
                                </div>
                                <h3 className="text-base font-black tracking-tighter uppercase text-current">
                                    <Editable value={impact.area} onUpdate={v => onUpdate(`impacts[${i}].area`, v)} />
                                </h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 items-start">
                                <div className="flex flex-col gap-0.5">
                                    <div className="text-[10px] font-bold text-[var(--color-danger)] uppercase">The Problem</div>
                                    <div className="text-xs text-current leading-snug bg-[var(--color-danger)]/5 p-2 rounded-lg border border-[var(--color-danger)]/10 line-clamp-2">
                                        <Editable value={impact.problem || "Identified critical gap in current urban infrastructure"} onUpdate={v => onUpdate(`impacts[${i}].problem`, v)} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <div className="text-[10px] font-bold text-[var(--color-info)] uppercase">The Solution</div>
                                    <div className="text-xs text-current leading-snug bg-[var(--color-info)]/5 p-2 rounded-lg border border-[var(--color-info)]/10 line-clamp-2">
                                        <Editable value={impact.solution || impact.description} onUpdate={v => onUpdate(`impacts[${i}].solution`, v)} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <div className="text-[10px] font-bold text-[var(--color-success)] uppercase">The Impact</div>
                                    <div className="text-xs text-current leading-snug bg-[var(--color-success)]/5 p-2 rounded-lg border border-[var(--color-success)]/10 line-clamp-2">
                                        <Editable value={impact.impact || impact.outcome} onUpdate={v => onUpdate(`impacts[${i}].impact`, v)} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <div className="text-[10px] font-bold text-[var(--color-warning)] uppercase">The Action</div>
                                    <div className="text-xs text-current leading-snug bg-[var(--color-warning)]/5 p-2 rounded-lg border border-[var(--color-warning)]/10 line-clamp-2">
                                        <Editable value={impact.action || "Immediate implementation of phase 1 protocols"} onUpdate={v => onUpdate(`impacts[${i}].action`, v)} />
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

const FiscalResponsibilitySlideLayout: React.FC<{ slide: FiscalFrameworkSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <SlideHeader 
                label="Fiscal Responsibility Matrix"
                title={slide.title}
                onTitleUpdate={v => onUpdate('title', v)}
                style={titleAnim}
            />
            
            <div className="grid grid-cols-2 gap-8 flex-grow min-h-0 overflow-hidden pr-2">
                <div className="flex flex-col gap-6 justify-center">
                    <div className="text-[var(--color-primary-medium)] font-black text-xs uppercase mb-2 tracking-widest border-b border-white/10 pb-2">Cost Breakdown & Funding</div>
                    <div className="space-y-4">
                        {ensureArray(slide.cost_items).slice(0, 3).map((item, i) => {
                            const sourceAnim = getAnimationStyles(isActive, 300 + i * 150, 'fade-in-left', disableAnimations);
                            return (
                                <div key={i} style={sourceAnim} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md transition-all hover:bg-white/10">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-lg font-black tracking-tighter uppercase text-current">
                                            <Editable value={item.component} onUpdate={v => onUpdate(`cost_items[${i}].component`, v)} />
                                        </h3>
                                        <div className="bg-[var(--color-primary-medium)]/20 px-4 py-1 rounded-full border border-[var(--color-primary-medium)]/30">
                                            <span className="text-[var(--color-primary-medium)] font-black text-sm">
                                                <Editable value={item.capex} onUpdate={v => onUpdate(`cost_items[${i}].capex`, v)} />
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-current opacity-80 leading-relaxed italic line-clamp-2">
                                        <Editable value={item.funding_source} onUpdate={v => onUpdate(`cost_items[${i}].funding_source`, v)} />
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md flex flex-col shadow-xl">
                    <div className="text-[var(--color-primary-medium)] font-black text-xs uppercase mb-8 tracking-widest border-b border-white/10 pb-2">Strategic Fiscal Matrix</div>
                    <div className="flex-grow grid grid-cols-2 grid-rows-2 gap-6">
                        <div className="border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center bg-[var(--color-primary-medium)]/10 hover:bg-[var(--color-primary-medium)]/20 transition-all group">
                            <div className="text-xs text-[var(--color-primary-medium)] font-black uppercase mb-2 tracking-widest group-hover:scale-110 transition-transform">High Impact</div>
                            <div className="text-xl text-current font-black uppercase tracking-tighter">Low Cost</div>
                        </div>
                        <div className="border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center bg-[var(--color-accent-light)]/10 hover:bg-[var(--color-accent-light)]/20 transition-all group">
                            <div className="text-xs text-[var(--color-accent-light)] font-black uppercase mb-2 tracking-widest group-hover:scale-110 transition-transform">High Impact</div>
                            <div className="text-xl text-current font-black uppercase tracking-tighter">High Cost</div>
                        </div>
                        <div className="border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center bg-[var(--color-primary-light)]/10 hover:bg-[var(--color-primary-light)]/20 transition-all group">
                            <div className="text-xs text-[var(--color-primary-light)] font-black uppercase mb-2 tracking-widest group-hover:scale-110 transition-transform">Low Impact</div>
                            <div className="text-xl text-current font-black uppercase tracking-tighter">Low Cost</div>
                        </div>
                        <div className="border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center bg-white/5 hover:bg-white/10 transition-all group">
                            <div className="text-xs text-current opacity-60 font-black uppercase mb-2 tracking-widest group-hover:scale-110 transition-transform">Low Impact</div>
                            <div className="text-xl text-current font-black uppercase tracking-tighter">High Cost</div>
                        </div>
                    </div>
                    <div className="mt-8 text-sm text-current opacity-70 italic text-center font-mono uppercase tracking-tighter">
                        <Editable value={slide.matrix_caption || "Fiscal prioritization based on ROI and strategic alignment."} onUpdate={v => onUpdate('matrix_caption', v)} />
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const PolicyLeversSlideLayout: React.FC<{ slide: PolicyLeversSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);
    const contentAnim = getAnimationStyles(isActive, 300, 'fade-in-up', disableAnimations);
    const imageAnim = getAnimationStyles(isActive, 500, 'fade-in-right', disableAnimations);

    return (
        <SlideWrapper 
            className="flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <SlideHeader 
                label="Actionable Policy Recommendations"
                title={slide.title}
                onTitleUpdate={v => onUpdate('title', v)}
                style={titleAnim}
            />
            
            <div className="grid grid-cols-12 gap-8 flex-grow min-h-0 pr-2">
                <div style={contentAnim} className="col-span-8 flex flex-col gap-6 justify-center">
                    {ensureArray(slide.recommendations).slice(0, 3).map((rec, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md flex flex-col hover:bg-white/10 transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-medium)]/20 flex items-center justify-center text-[var(--color-primary-medium)] font-black text-sm border border-[var(--color-primary-medium)]/30 group-hover:bg-[var(--color-primary-medium)] group-hover:text-white transition-all">
                                        0{i + 1}
                                    </div>
                                    <h3 className="text-xl font-black tracking-tighter uppercase text-current">
                                        <Editable value={rec.strategy} onUpdate={v => onUpdate(`recommendations[${i}].strategy`, v)} />
                                    </h3>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-medium)] opacity-60">Recommendation {i + 1}</div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <div className="text-[11px] font-black text-[var(--color-primary-medium)] uppercase tracking-widest">Strategic Impact</div>
                                    <p className="text-sm text-current leading-relaxed opacity-80 italic line-clamp-2">
                                        <Editable value={rec.expected_impact} onUpdate={v => onUpdate(`recommendations[${i}].expected_impact`, v)} />
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="text-[11px] font-black text-[var(--color-accent-medium)] uppercase tracking-widest">KPI Framework</div>
                                    <p className="text-sm font-mono text-current bg-white/5 p-3 rounded-xl border border-white/10 line-clamp-2">
                                        <Editable value={rec.measurement_framework} onUpdate={v => onUpdate(`recommendations[${i}].measurement_framework`, v)} />
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={imageAnim} className="col-span-4 relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                    <EditableImage 
                        src={slide.image_url || imageUrls['policy_image'] || 'https://picsum.photos/seed/policy/1920/1080'} 
                        alt={slide.title} 
                        onUpdate={url => onUpdate('image_url', url)}
                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-8 left-8 right-8">
                        <div className="text-[var(--color-primary-medium)] font-black text-xs uppercase mb-2 tracking-[0.3em]">Policy Context</div>
                        <div className="text-current opacity-90 text-sm font-mono uppercase tracking-tighter">Regulatory Framework Reference</div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};
const GovernanceFrameworkSlideLayout: React.FC<{ slide: GovernanceFrameworkSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);
    const leftAnim = getAnimationStyles(isActive, 300, 'fade-in-right', disableAnimations);
    const rightAnim = getAnimationStyles(isActive, 500, 'fade-in-left', disableAnimations);
    
    const stakeholderColors = ['#FF6321', '#FFC107', '#8BC34A', '#00BFA5', '#2196F3', '#9C27B0'];

    return (
        <SlideWrapper 
            className="flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <SlideHeader 
                label="Governance & Stakeholder Framework"
                title={slide.title}
                onTitleUpdate={v => onUpdate('title', v)}
                style={titleAnim}
            />
            
            <div className="grid grid-cols-12 gap-12 flex-grow min-h-0 overflow-hidden pr-2">
                <div style={leftAnim} className="col-span-7 flex flex-col gap-8 justify-center">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-md flex flex-col shadow-xl">
                        <div className="text-[var(--color-primary-medium)] font-black text-xs uppercase mb-8 tracking-widest border-b border-white/10 pb-4">Governance Architecture</div>
                        <div className="space-y-8">
                            <div className="bg-[var(--color-primary-medium)]/10 p-8 rounded-2xl border border-[var(--color-primary-medium)]/30">
                                <div className="text-[11px] text-[var(--color-primary-medium)] font-black uppercase mb-3 tracking-widest">Lead Agency</div>
                                <div className="text-2xl font-black text-white uppercase mb-3 tracking-tighter">
                                    <Editable value={slide.lead_agency?.name || "Metropolitan Development Authority"} onUpdate={v => onUpdate('lead_agency.name', v)} />
                                </div>
                                <div className="text-base text-white opacity-70 italic leading-relaxed line-clamp-3">
                                    <Editable value={slide.lead_agency?.rationale || "Primary regulatory body with cross-jurisdictional mandate."} onUpdate={v => onUpdate('lead_agency.rationale', v)} />
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="text-[11px] font-black uppercase text-[var(--color-primary-medium)] tracking-widest mb-4 opacity-60">Strategic Partners</div>
                                <div className="grid grid-cols-2 gap-6">
                                    {ensureArray(slide.stakeholders).slice(0, 4).map((stakeholder, i) => (
                                        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all group relative">
                                            <div className="absolute top-6 right-6 w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: stakeholderColors[i % stakeholderColors.length] }}></div>
                                            <h3 className="text-base font-black uppercase text-white mb-2 group-hover:text-[var(--color-primary-medium)] transition-colors tracking-tighter">
                                                <Editable value={stakeholder.name} onUpdate={v => onUpdate(`stakeholders[${i}].name`, v)} />
                                            </h3>
                                            <p className="text-xs text-white opacity-60 leading-tight italic truncate">
                                                <Editable value={stakeholder.role} onUpdate={v => onUpdate(`stakeholders[${i}].role`, v)} />
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style={rightAnim} className="col-span-5 bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-md flex flex-col overflow-hidden shadow-xl">
                    <div className="text-[var(--color-primary-medium)] font-black text-xs uppercase mb-10 tracking-widest border-b border-white/10 pb-4">Stakeholder Matrix</div>
                    <div className="flex-grow relative border-l border-b border-white/20 mb-16 mx-6">
                        {/* Matrix Labels */}
                        <div className="absolute -left-12 top-1/2 -rotate-90 text-[11px] text-white opacity-40 uppercase font-mono tracking-widest">Power Level</div>
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[11px] text-white opacity-40 uppercase font-mono tracking-widest">Interest Level</div>
                        
                        {/* Matrix Quadrants */}
                        <div className="grid grid-cols-2 grid-rows-2 h-full w-full opacity-10">
                            <div className="border-r border-b border-white/20"></div>
                            <div className="border-b border-white/20"></div>
                            <div className="border-r border-white/20"></div>
                            <div></div>
                        </div>
                        
                        {/* Stakeholder Dots */}
                        {ensureArray(slide.stakeholders).slice(0, 6).map((s, i) => {
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
                                    className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-help group z-20 hover:scale-150 transition-transform"
                                    style={{ 
                                        backgroundColor: stakeholderColors[i % stakeholderColors.length],
                                        top: top, 
                                        left: left, 
                                        transform: 'translate(-50%, -50%)',
                                        transitionDelay: `${500 + i * 100}ms`,
                                        opacity: isActive ? 1 : 0
                                    }}
                                >
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-black/95 text-white px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 font-mono shadow-2xl border border-white/20 transition-opacity pointer-events-none z-50">
                                        {s.name}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-6 text-[11px] text-white opacity-40 uppercase text-center font-mono tracking-widest">
                        Strategic Prioritization Map
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const ProcessSlideLayout: React.FC<{ slide: ProcessSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper 
            className="p-8 pb-24 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <div className="absolute inset-0 z-0">
                <EditableImage 
                    src={slide.image_url || imageUrls['process_image'] || 'https://picsum.photos/seed/process/1920/1080'} 
                    alt="Process background" 
                    className="absolute inset-0 w-full h-full object-cover"
                    onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
                />
                <div className={`absolute inset-0 ${overlayClass} backdrop-blur-sm z-10 pointer-events-none`}></div>
            </div>
            <div className="relative z-20" style={titleAnimation}>
                <Editable as="h1" value={slide.title} onUpdate={v => onUpdate('title', v)} className="text-2xl md:text-3xl font-extrabold tracking-tighter mb-0.5 text-[var(--color-accent-light)]" />
                <Editable as="p" value={slide.subtitle} onUpdate={v => onUpdate('subtitle', v)} className="text-[10px] md:text-xs text-current opacity-90 mb-3" />
            </div>
            <div className="relative z-20 flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pr-2 pb-2">
                {(slide.steps || []).slice(0, 4).map((step, i) => {
                    const stepAnimation = getAnimationStyles(isActive, 350 + i * 150, 'fade-in-up', disableAnimations);
                    return (
                        <div key={i} className="relative bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 flex flex-col min-h-[100px] transition-all duration-300 hover:bg-white/10 hover:border-white/20" style={stepAnimation}>
                            <div className="absolute -top-2 -left-2 w-6 h-6 bg-[var(--color-primary-medium)] rounded-full flex items-center justify-center text-current font-black shadow-lg text-[10px] border-2 border-white/10">
                                {step.step_number || i + 1}
                            </div>
                            <Editable as="h3" value={step.title} onUpdate={v => onUpdate(`steps[${i}].title`, v)} className="font-black text-xs md:text-sm text-current mb-1 mt-1 uppercase tracking-tighter truncate" />
                            <Editable as="p" value={step.description} onUpdate={v => onUpdate(`steps[${i}].description`, v)} className="text-[11px] md:text-[10px] text-current leading-tight line-clamp-3" />
                        </div>
                    )
                })}
            </div>
        </SlideWrapper>
    );
};

const ClosingSlideLayout: React.FC<{ slide: ClosingSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, slideNumber }) => {
    const taglineAnimation = getAnimationStyles(isActive, 300, 'fade-in-up', disableAnimations);
    const lineAnimation = getAnimationStyles(isActive, 600, 'scale-in', disableAnimations);
    const creditsAnimation = getAnimationStyles(isActive, 900, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="p-0 overflow-hidden"
            referenceText={slide.reference_doc || "Ref. Doc: Urban Strategy Framework v2.1"}
            onReferenceUpdate={v => onUpdate('reference_doc', v as string)}
            slideNumber={slideNumber}
        >
            <div className="absolute inset-0 flex z-0">
                {/* Left side: Image */}
                <div className="w-1/2 relative h-full">
                    <EditableImage 
                        src={slide.image_url || imageUrls[slide.image_prompt || 'closing_image'] || 'https://picsum.photos/seed/closing/1920/1080'} 
                        alt="Closing visual" 
                        className="absolute inset-0 w-full h-full object-cover"
                        onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--color-bg-light)] z-10"></div>
                </div>
                <div className="w-1/2 h-full bg-[var(--color-bg-light)]"></div>
            </div>

            {/* Right side: Content */}
            <div className="absolute inset-0 flex z-20 pointer-events-none">
                <div className="w-1/2"></div>
                <div className="w-1/2 p-12 flex flex-col justify-center text-right pointer-events-auto pr-24">
                    <div style={taglineAnimation}>
                        <Editable as="h2" value={slide.tagline} onUpdate={v => onUpdate('tagline', v)} className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight tracking-tighter text-[var(--color-primary-dark)]" />
                    </div>
                    <div style={lineAnimation}>
                        <div className="w-12 h-1 bg-[var(--color-primary-medium)] my-4 ml-auto"></div>
                    </div>
                    <div style={creditsAnimation}>
                        <Editable as="p" value={slide.credits} onUpdate={v => onUpdate('credits', v)} className="text-xs md:text-sm text-[var(--color-primary-medium)] font-medium" />
                    </div>
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

const ConclusionSlideLayout: React.FC<SlideLayoutProps> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const s = slide as ConclusionSlide;
    const contentAnim = getAnimationStyles(isActive, 300, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper slideNumber={slideNumber} className="bg-[#f5f2ed] text-gray-900">
            <div className="grid grid-cols-12 gap-16 h-full items-center">
                <div className="col-span-7" style={contentAnim}>
                    <SlideHeader label="Final Synthesis" title={s.title || "Strategic Conclusion & Path Forward"} onTitleUpdate={v => onUpdate('title', v)} />
                    
                    <div className="space-y-10 mt-12">
                        {ensureArray(s.summary_points).map((point, idx) => (
                            <div key={idx} className="flex gap-8 group">
                                <div className="text-5xl font-black text-gray-900 opacity-10 shrink-0 group-hover:opacity-30 transition-opacity leading-none">0{idx + 1}</div>
                                <div className="border-l-2 border-gray-300 pl-8">
                                    <h4 className="text-xl font-bold text-gray-900 uppercase tracking-tight mb-3">
                                        <Editable value={point.title} onUpdate={v => {
                                            const newPoints = [...ensureArray(s.summary_points)];
                                            newPoints[idx] = { ...newPoints[idx], title: v };
                                            onUpdate('summary_points', newPoints);
                                        }} />
                                    </h4>
                                    <p className="text-gray-600 text-base leading-relaxed italic">
                                        <Editable value={point.content} onUpdate={v => {
                                            const newPoints = [...ensureArray(s.summary_points)];
                                            newPoints[idx] = { ...newPoints[idx], content: v };
                                            onUpdate('summary_points', newPoints);
                                        }} />
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="col-span-5 flex flex-col gap-8" style={contentAnim}>
                    <div className="relative aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl border-8 border-white">
                        <EditableImage 
                            src={s.image_url || 'https://picsum.photos/seed/urban-vision/800/1000'} 
                            alt="Conclusion Visual" 
                            className="w-full h-full object-cover"
                            onUpdate={v => onUpdate('image_url', v)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-12 left-10 right-10">
                            <div className="h-1 w-12 bg-[var(--color-primary-medium)] mb-6 rounded-full"></div>
                            <p className="text-white text-2xl font-black leading-tight uppercase tracking-tighter italic">
                                Transforming urban landscapes through strategic precision and visionary leadership.
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-2 w-2 rounded-full bg-[var(--color-primary-medium)]"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Final Recommendation</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 leading-snug italic">
                            <Editable value={s.final_recommendation} onUpdate={v => onUpdate('final_recommendation', v)} />
                        </p>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const TableOfContentsSlideLayout: React.FC<SlideLayoutProps> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const s = slide as TableOfContentsSlide;
    const contentAnim = getAnimationStyles(isActive, 300, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper slideNumber={slideNumber} className="bg-[#f5f2ed] text-gray-900">
            <div className="grid grid-cols-12 gap-16 h-full">
                <div className="col-span-5 flex flex-col justify-center border-r border-gray-200 pr-16">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-1 w-12 bg-gray-900"></div>
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">Presentation Index</span>
                    </div>
                    <h2 className="text-8xl font-black tracking-tighter uppercase leading-[0.8] mb-12">
                        <Editable value={s.title || "Table of contents"} onUpdate={v => onUpdate('title', v)} />
                    </h2>
                    <p className="text-gray-500 text-lg font-medium italic leading-relaxed max-w-sm">
                        A comprehensive roadmap detailing the strategic evolution and analytical framework of the urban study.
                    </p>
                </div>
                
                <div className="col-span-7 flex flex-col justify-center gap-10 pl-16" style={contentAnim}>
                    {ensureArray(s.chapters).map((chapter, idx) => (
                        <div key={idx} className="flex items-start gap-10 group">
                            <span className="text-6xl font-black text-gray-900 opacity-10 group-hover:opacity-100 transition-opacity leading-none w-24">
                                {chapter.number || `0${idx + 1}`}
                            </span>
                            <div className="flex flex-col pt-2">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-tight group-hover:text-[var(--color-primary-medium)] transition-colors">
                                    <Editable value={chapter.title} onUpdate={v => {
                                        const newChapters = [...ensureArray(s.chapters)];
                                        newChapters[idx] = { ...newChapters[idx], title: v };
                                        onUpdate('chapters', newChapters);
                                    }} />
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 max-w-md">
                                    <Editable value={chapter.description} onUpdate={v => {
                                        const newChapters = [...ensureArray(s.chapters)];
                                        newChapters[idx] = { ...newChapters[idx], description: v };
                                        onUpdate('chapters', newChapters);
                                    }} />
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </SlideWrapper>
    );
};

const NextStepsSlideLayout: React.FC<SlideLayoutProps> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const s = slide as NextStepsSlide;
    const contentAnim = getAnimationStyles(isActive, 300, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper slideNumber={slideNumber} className="bg-white">
            <SlideHeader label="Implementation Roadmap" title={s.title || "Immediate Strategic Actions"} onTitleUpdate={v => onUpdate('title', v)} />
            
            <div className="grid grid-cols-12 gap-12 mt-12 h-full" style={contentAnim}>
                <div className="col-span-7 space-y-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-1 w-12 bg-[var(--color-primary-medium)] rounded-full"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary-medium)]">Action Timeline</span>
                    </div>
                    
                    <div className="relative pl-8 border-l-2 border-gray-100 space-y-12">
                        {ensureArray(s.immediate_actions).map((action, idx) => (
                            <div key={idx} className="relative">
                                <div className="absolute -left-[41px] top-0 h-6 w-6 rounded-full bg-[var(--color-primary-dark)] border-4 border-white shadow-md flex items-center justify-center text-[10px] font-black text-white">
                                    {idx + 1}
                                </div>
                                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all duration-300 group">
                                    <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2 group-hover:text-[var(--color-primary-medium)] transition-colors">
                                        <Editable value={action.title} onUpdate={v => {
                                            const newActions = [...ensureArray(s.immediate_actions)];
                                            newActions[idx] = { ...newActions[idx], title: v };
                                            onUpdate('immediate_actions', newActions);
                                        }} />
                                    </h4>
                                    <div className="flex gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Lead Responsibility</span>
                                            <span className="text-xs font-bold text-gray-700">
                                                <Editable value={action.owner} onUpdate={v => {
                                                    const newActions = [...ensureArray(s.immediate_actions)];
                                                    newActions[idx] = { ...newActions[idx], owner: v };
                                                    onUpdate('immediate_actions', newActions);
                                                }} />
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Target Deadline</span>
                                            <span className="text-xs font-bold text-[var(--color-primary-medium)]">
                                                <Editable value={action.deadline} onUpdate={v => {
                                                    const newActions = [...ensureArray(s.immediate_actions)];
                                                    newActions[idx] = { ...newActions[idx], deadline: v };
                                                    onUpdate('immediate_actions', newActions);
                                                }} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="col-span-5 flex flex-col gap-8">
                    <div className="bg-[var(--color-primary-dark)] p-10 rounded-3xl text-white shadow-2xl flex-grow flex flex-col">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="h-1 w-12 bg-[var(--color-primary-medium)] rounded-full"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary-medium)]">Strategic Milestones</span>
                        </div>
                        
                        <div className="space-y-8 flex-grow">
                            {ensureArray(s.strategic_milestones).map((milestone, idx) => (
                                <div key={idx} className="flex gap-6 items-start group">
                                    <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-[var(--color-primary-medium)] transition-colors">
                                        <ArrowRight className="w-4 h-4 text-white" />
                                    </div>
                                    <p className="text-lg font-medium leading-tight text-white/90 group-hover:text-white transition-colors">
                                        <Editable value={milestone} onUpdate={v => {
                                            const newMilestones = [...ensureArray(s.strategic_milestones)];
                                            newMilestones[idx] = v;
                                            onUpdate('strategic_milestones', newMilestones);
                                        }} />
                                    </p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-center">
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Status: Active</div>
                            <div className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-[var(--color-primary-medium)]">Strategic Priority</div>
                        </div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const ComparisonTableSlideLayout: React.FC<SlideLayoutProps> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const s = slide as ComparisonTableSlide;
    const contentAnim = getAnimationStyles(isActive, 300, 'fade-in-up', disableAnimations);
    
    const colors = ['#FF6321', '#FFC107', '#8BC34A', '#00BFA5', '#2196F3', '#9C27B0'];

    return (
        <SlideWrapper slideNumber={slideNumber} className="bg-white">
            <SlideHeader label="Comparison Analysis & Strategic Benchmarking" title={s.title || "Comparison Table"} onTitleUpdate={v => onUpdate('title', v)} />
            
            <div className="mt-12 overflow-hidden rounded-[32px] border border-gray-200 shadow-2xl" style={contentAnim}>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="p-8 text-left text-[11px] font-black uppercase tracking-[0.4em] text-gray-400 w-1/4 bg-gray-50/50">Analysis Dimension</th>
                            {ensureArray(s.headers).map((header, idx) => (
                                <th key={idx} className="p-8 text-center text-sm font-black uppercase tracking-[0.3em] text-white shadow-inner" style={{ backgroundColor: colors[idx % colors.length] }}>
                                    <Editable value={header} onUpdate={v => {
                                        const newHeaders = [...ensureArray(s.headers)];
                                        newHeaders[idx] = v;
                                        onUpdate('headers', newHeaders);
                                    }} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {ensureArray(s.rows).map((row, rowIdx) => (
                            <tr key={rowIdx} className="border-b border-gray-100 hover:bg-gray-50/80 transition-all group">
                                <td className="p-8 text-base font-bold text-gray-900 uppercase tracking-tight bg-gray-50/30 group-hover:bg-gray-50/50">
                                    <Editable value={row.label} onUpdate={v => {
                                        const newRows = [...ensureArray(s.rows)];
                                        newRows[rowIdx] = { ...newRows[rowIdx], label: v };
                                        onUpdate('rows', newRows);
                                    }} />
                                </td>
                                {ensureArray(row.values).map((val, valIdx) => (
                                    <td key={valIdx} className="p-8 text-center">
                                        <div className="flex justify-center items-center gap-3">
                                            {val.toLowerCase().includes('yes') || val.toLowerCase().includes('check') || val === '✓' ? (
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform" style={{ backgroundColor: colors[valIdx % colors.length] }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            ) : val.toLowerCase().includes('no') || val === '✗' ? (
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 border-2 border-gray-100">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                <div className="text-sm font-bold text-gray-700">
                                                    <Editable value={val} onUpdate={v => {
                                                        const newRows = [...ensureArray(s.rows)];
                                                        const newValues = [...ensureArray(newRows[rowIdx].values)];
                                                        newValues[valIdx] = v;
                                                        newRows[rowIdx] = { ...newRows[rowIdx], values: newValues };
                                                        onUpdate('rows', newRows);
                                                    }} />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="mt-12 flex justify-between items-center px-8">
                <div className="flex items-center gap-4">
                    <div className="h-1 w-12 bg-[var(--color-primary-medium)]"></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">Strategic Benchmarking Analysis</span>
                </div>
                <div className="flex gap-4">
                    {colors.slice(0, 3).map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }}></div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scenario 0{i + 1}</span>
                        </div>
                    ))}
                </div>
            </div>
        </SlideWrapper>
    );
};

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
        <div className="w-full h-full bg-[var(--color-bg-light)] flex items-center justify-center text-current opacity-50 italic">
            Invalid slide data.
        </div>
    );
  }

  const renderLayout = () => {
    const props = { onUpdate, imageUrls: imageUrls || {}, isActive, disableAnimations, designSystem, slideNumber };
    const layoutMap: { [key: string]: React.FC<SlideLayoutProps> } = {
        'Cover': CoverSlideLayout,
        'TableOfContents': TableOfContentsSlideLayout,
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
        'ComparisonTable': ComparisonTableSlideLayout,
        'RiskAssessment': RiskAssessmentSlideLayout,
        'Roadmap': ImplementationTimelineSlideLayout,
        'GanttChartRoadmap': GanttChartRoadmapSlideLayout,
        'ProjectedImpact': ProjectedImpactSlideLayout,
        'FiscalFramework': FiscalResponsibilitySlideLayout,
        'PolicyLevers': PolicyLeversSlideLayout,
        'GovernanceFramework': GovernanceFrameworkSlideLayout,
        'Process': ProcessSlideLayout,
        'NextSteps': NextStepsSlideLayout,
        'Conclusion': ConclusionSlideLayout,
        'Closing': ClosingSlideLayout,
        'References': ReferencesSlideLayout,
    };

    const Component = layoutMap[slide.layout];
    if (Component) return <Component slide={slide} {...props} />;
    
    return (
        <SlideWrapper 
            className="p-16 bg-[var(--color-bg-light)] text-current" 
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
                #slide-container-${slideNumber} {
                    color: #111827 !important;
                }
                #slide-container-${slideNumber} .opacity-60, 
                #slide-container-${slideNumber} .opacity-70, 
                #slide-container-${slideNumber} .opacity-50,
                #slide-container-${slideNumber} .opacity-40,
                #slide-container-${slideNumber} .opacity-30,
                #slide-container-${slideNumber} .opacity-80,
                #slide-container-${slideNumber} .opacity-90 {
                    color: inherit !important;
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