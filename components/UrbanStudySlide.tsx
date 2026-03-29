import React, { CSSProperties, useEffect, useState, useRef } from 'react';
import { } from 'lucide-react';
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

const getAnimationStyles = (isActive: boolean, delay: number, type: 'fade-in-up' | 'scale-in' = 'fade-in-up', disableAnimations?: boolean) => {
    if (disableAnimations) return { opacity: 1 };
    if (!isActive) return { opacity: 0 };
    return {
        opacity: 0,
        animation: `${type} 0.7s cubic-bezier(0.3, 0, 0.2, 1) forwards`,
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
        <div className={`w-full h-full bg-[var(--color-bg-light)] text-black flex flex-col overflow-hidden relative font-sans ${className}`} style={backgroundStyle}>
            {/* Dark overlay if using a custom background to ensure text readability */}
            {presentationTemplateUrl && <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none backdrop-blur-[1px]"></div>}
            
            <div className={`relative z-10 w-full flex-grow flex flex-col p-8 lg:p-12 ${reflectionText !== undefined ? 'pb-32' : 'pb-16'} overflow-hidden`}>
                {children}
            </div>

            {/* Global Footer Elements */}
            {slideNumber !== undefined && (
                <div className="absolute bottom-8 left-12 text-[10px] font-mono font-bold text-gray-400 z-30 slide-footer-text tracking-[0.5em] uppercase">
                    Section 01 / Slide {String(slideNumber).padStart(2, '0')}
                </div>
            )}
            <div className="absolute bottom-6 right-12 z-30 opacity-20 slide-footer-logo hover:opacity-40 transition-opacity">
                <TanmyaaLogoPPTX className="!text-[var(--color-primary-dark)]" />
            </div>

            {reflectionText !== undefined && (
                <div className="absolute bottom-6 left-12 right-12 z-20">
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start shadow-xl border-l-4 border-l-[var(--color-primary-dark)]">
                        <div className="bg-[var(--color-primary-dark)]/10 text-[var(--color-primary-dark)] text-[10px] font-black px-2 py-1 rounded-md mr-4 tracking-widest uppercase shrink-0 mt-1">Principal Strategist Reflection</div>
                        <Editable value={reflectionText} onUpdate={onReflectionUpdate} className="text-sm text-gray-600 italic leading-relaxed font-light" />
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

const CoverSlideLayout: React.FC<{ slide: CoverSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const subtitleAnim = getAnimationStyles(isActive, 400, 'fade-in-up', disableAnimations);
    const metaAnim = getAnimationStyles(isActive, 600, 'fade-in', disableAnimations);

    return (
        <SlideWrapper 
            className="justify-center items-start relative overflow-hidden"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            {slide.design_system_svg && (
                <div className="absolute inset-0 z-0 opacity-40" dangerouslySetInnerHTML={{ __html: slide.design_system_svg }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-transparent z-1"></div>
            
            <div className="relative z-10 max-w-3xl">
                <div style={metaAnim} className="flex items-center gap-3 mb-4">
                    <div className="h-px w-8 bg-[var(--color-primary-medium)]"></div>
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-primary-medium)]">
                        Strategic Doctrine {slide.year}
                    </span>
                </div>
                
                <h1 
                    style={titleAnim}
                    className="text-5xl lg:text-6xl font-black tracking-tighter leading-[0.9] mb-4 uppercase"
                >
                    <Editable value={slide.title} onUpdate={v => onUpdate('title', v)} />
                </h1>
                
                <p 
                    style={subtitleAnim}
                    className="text-lg lg:text-xl text-white/70 font-light max-w-xl leading-relaxed mb-8"
                >
                    <Editable value={slide.subtitle} onUpdate={v => onUpdate('subtitle', v)} />
                </p>

                <div style={metaAnim} className="flex items-center gap-8 text-xs font-mono tracking-widest text-white/40">
                    <div className="flex flex-col gap-1">
                        <span className="uppercase opacity-50">Project Code</span>
                        <span className="text-white/80 font-bold">{slide.project_code}</span>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="flex flex-col gap-1">
                        <span className="uppercase opacity-50">Confidentiality</span>
                        <span className="text-white/80 font-bold uppercase">Internal Use Only</span>
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

    return (
        <SlideWrapper 
            className="flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="grid grid-cols-12 gap-8 h-full">
                <div className="col-span-7 flex flex-col justify-center">
                    <h2 
                        style={titleAnim}
                        className="text-3xl font-black tracking-tighter uppercase mb-4 leading-tight"
                    >
                        <Editable value={slide.title} onUpdate={v => onUpdate('title', v)} />
                    </h2>
                    <div 
                        style={contentAnim}
                        className="text-base text-white/80 font-light leading-relaxed mb-6 border-l-4 border-[var(--color-primary-medium)] pl-4"
                    >
                        <Editable value={slide.narrative} onUpdate={v => onUpdate('narrative', v)} useMarkdown />
                    </div>
                    <div style={pointsAnim} className="grid grid-cols-2 gap-3">
                        {ensureArray(slide.key_points).slice(0, 4).map((point, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-sm">
                                <div className="text-[var(--color-primary-medium)] font-bold text-[8px] uppercase mb-0.5 tracking-widest">Strategic Pillar {idx + 1}</div>
                                <Editable 
                                    value={point} 
                                    onUpdate={v => onUpdate(`key_points[${idx}]`, v)} 
                                    className="text-[10px] text-white/90 leading-snug" 
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="col-span-5 relative rounded-2xl overflow-hidden group">
                    <EditableImage 
                        src={slide.image_url || imageUrls['overview_image'] || ''} 
                        alt={slide.title} 
                        onUpdate={url => onUpdate('image_url', url)}
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-8 left-8 right-8">
                        <div className="text-[var(--color-primary-medium)] font-bold text-xs uppercase mb-1 tracking-widest">Contextual Visual</div>
                        <div className="text-white/60 text-[10px] font-mono uppercase">Strategic Site Analysis Reference</div>
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
            slideNumber={slideNumber}
        >
            <div className="max-w-4xl mb-16">
                <div style={titleAnim} className="flex items-center gap-4 mb-6">
                    <div className="h-px w-12 bg-red-500"></div>
                    <span className="text-sm font-bold tracking-[0.3em] uppercase text-red-500">Critical Assessment</span>
                </div>
                <h2 
                    style={titleAnim}
                    className="text-4xl font-black tracking-tighter uppercase mb-4 leading-tight"
                >
                    <Editable value={slide.title} onUpdate={v => onUpdate('title', v)} />
                </h2>
                <div 
                    style={contentAnim}
                    className="text-lg text-white/70 font-light leading-relaxed"
                >
                    <Editable value={slide.problem_statement} onUpdate={v => onUpdate('problem_statement', v)} />
                </div>
            </div>

            <div style={dataAnim} className="grid grid-cols-3 gap-6">
                {ensureArray(slide.key_data_points).slice(0, 3).map((point, idx) => (
                    <div key={idx} className="bg-white/5 border-l-4 border-red-500 p-5 rounded-r-2xl backdrop-blur-md">
                        <div className="text-3xl font-black tracking-tighter mb-1 text-white">
                            <MetricValueDisplay
                                value={point.value}
                                isActive={isActive}
                                numberClass="text-3xl font-black"
                                suffixClass="text-lg"
                                disableAnimations={disableAnimations}
                            />
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2">
                            <Editable value={point.label} onUpdate={v => onUpdate(`key_data_points[${idx}].label`, v)} />
                        </div>
                        <div className="text-xs text-white/50 leading-relaxed line-clamp-3">
                            <Editable value={point.description} onUpdate={v => onUpdate(`key_data_points[${idx}].description`, v)} />
                        </div>
                    </div>
                ))}
            </div>
        </SlideWrapper>
    );
};

const SWOTSection = ({ title, items, color, field, onUpdate }: { title: string, items: { title: string, description: string }[], color: string, field: string, onUpdate: (field: string, val: string) => void }) => (
    <div className={`bg-white/5 border-t-4 ${color} p-4 rounded-b-2xl backdrop-blur-sm flex flex-col h-full`}>
        <h3 className="text-xl font-black tracking-tighter uppercase mb-3 flex items-center justify-between">
            {title}
            <span className={`w-2 h-2 rounded-full ${color.replace('border-', 'bg-')}`}></span>
        </h3>
        <div className="space-y-3 flex-grow overflow-hidden">
            {ensureArray(items).slice(0, 4).map((item, idx) => (
                <div key={idx} className="group">
                    <div className="font-bold text-[10px] uppercase tracking-wider mb-0.5 text-white group-hover:text-[var(--color-primary-medium)] transition-colors truncate">
                        <Editable value={item.title} onUpdate={v => onUpdate(`${field}[${idx}].title`, v)} />
                    </div>
                    <div className="text-[9px] text-white/50 leading-relaxed line-clamp-2">
                        <Editable value={item.description} onUpdate={v => onUpdate(`${field}[${idx}].description`, v)} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const SWOTSlideLayout: React.FC<{ slide: SWOTSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean, disableAnimations?: boolean, slideNumber: number }> = ({ slide, onUpdate, isActive, disableAnimations, slideNumber }) => {
    const titleAnim = getAnimationStyles(isActive, 100, 'fade-in-up', disableAnimations);
    const gridAnim = getAnimationStyles(isActive, 300, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper 
            className="flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <h2 
                style={titleAnim}
                className="text-4xl font-black tracking-tighter uppercase mb-12"
            >
                <Editable value={slide.title || 'Strategic SWOT Analysis'} onUpdate={v => onUpdate('title', v)} />
            </h2>
            <div style={gridAnim} className="grid grid-cols-4 gap-6 flex-grow">
                <SWOTSection title="Strengths" items={slide.strengths} color="border-emerald-500" field="strengths" onUpdate={onUpdate} />
                <SWOTSection title="Weaknesses" items={slide.weaknesses} color="border-amber-500" field="weaknesses" onUpdate={onUpdate} />
                <SWOTSection title="Opportunities" items={slide.opportunities} color="border-blue-500" field="opportunities" onUpdate={onUpdate} />
                <SWOTSection title="Threats" items={slide.threats} color="border-rose-500" field="threats" onUpdate={onUpdate} />
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
            slideNumber={slideNumber}
        >
            <h2 
                style={titleAnim}
                className="text-3xl font-black tracking-tighter uppercase mb-6"
            >
                <Editable value="Global Benchmarks & Precedents" onUpdate={v => onUpdate('title', v)} />
            </h2>
            <div className="grid grid-cols-3 gap-6 flex-grow">
                {ensureArray(slide.benchmarks).slice(0, 3).map((benchmark, i) => {
                    const benchmarkAnim = getAnimationStyles(isActive, 300 + i * 150, 'fade-in-up', disableAnimations);
                    return (
                        <div key={i} style={benchmarkAnim} className="group flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm hover:bg-white/10 transition-all duration-500">
                            <div className="h-32 relative overflow-hidden">
                                <EditableImage 
                                    src={benchmark.image_url || imageUrls[benchmark.image_prompt] || `https://picsum.photos/seed/${benchmark.name}/800/600`} 
                                    alt={benchmark.name} 
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                    onUpdate={(newUrl) => onUpdate(`benchmarks[${i}].image_url`, newUrl)}
                                />
                                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] font-bold text-white uppercase tracking-widest border border-white/10">
                                    {benchmark.location}
                                </div>
                            </div>
                            <div className="p-5 flex flex-col flex-grow">
                                <h3 className="text-lg font-black tracking-tighter uppercase mb-2 text-white">
                                    <Editable value={benchmark.name} onUpdate={v => onUpdate(`benchmarks[${i}].name`, v)} />
                                </h3>
                                <p className="text-[11px] text-white/60 font-light leading-relaxed mb-4 line-clamp-2">
                                    <Editable value={benchmark.introduction} onUpdate={v => onUpdate(`benchmarks[${i}].introduction`, v)} />
                                </p>
                                <div className="mt-auto space-y-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {ensureArray(benchmark.interventions).slice(0, 3).map((item, j) => (
                                            <span key={j} className="text-[8px] uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded text-white/40 border border-white/5">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="pt-3 border-t border-white/10">
                                        <div className="text-[var(--color-primary-medium)] font-bold text-[9px] uppercase tracking-widest mb-0.5">Strategic Takeaway</div>
                                        <p className="text-[10px] text-white/80 italic leading-snug line-clamp-2">
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
            slideNumber={slideNumber}
        >
            <div className="grid grid-cols-12 gap-12 h-full">
                <div className="col-span-12 lg:col-span-7 relative rounded-[40px] overflow-hidden group">
                    <EditableImage 
                        src={slide.image_url || imageUrls[slide.image_prompt] || ''} 
                        alt={slide.title} 
                        onUpdate={url => onUpdate('image_url', url)}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-12 left-12 right-12">
                        <div className="text-[var(--color-primary-medium)] font-bold text-xs uppercase mb-2 tracking-widest">Case Study Reference</div>
                        <h2 
                            style={titleAnim}
                            className="text-4xl font-black tracking-tighter uppercase text-white leading-tight"
                        >
                            <Editable value={slide.title} onUpdate={v => onUpdate('title', v)} />
                        </h2>
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-5 flex flex-col justify-center">
                    <div 
                        style={contentAnim}
                        className="bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-md"
                    >
                        <div className="text-base text-white/80 font-light leading-relaxed mb-6 italic border-l-2 border-[var(--color-primary-medium)] pl-4">
                            <Editable value={slide.introduction} onUpdate={v => onUpdate('introduction', v)} useMarkdown />
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            <h3 className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-primary-medium)]">Key Strategic Findings</h3>
                            <div className="space-y-2">
                                {ensureArray(slide.key_findings).slice(0, 4).map((finding, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1 h-1 rounded-full bg-[var(--color-primary-medium)] mt-1.5 flex-shrink-0"></div>
                                        <Editable 
                                            value={finding} 
                                            onUpdate={v => onUpdate(`key_findings[${idx}]`, v)} 
                                            className="text-xs text-white/70 leading-relaxed" 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10">
                            <div className="text-lg font-bold text-white leading-tight mb-3">
                                <Editable value={slide.conclusion} onUpdate={v => onUpdate('conclusion', v)} />
                            </div>
                            {slide.data_source && (
                                <div className="text-[8px] font-mono uppercase tracking-widest text-white/30">
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
            slideNumber={slideNumber}
        >
            <div className="grid grid-cols-12 gap-12 h-full">
                <div className="col-span-12 lg:col-span-5 flex flex-col justify-center">
                    <div style={titleAnim} className="flex items-center gap-4 mb-6">
                        <div className="h-px w-12 bg-[var(--color-primary-medium)]"></div>
                        <span className="text-sm font-bold tracking-[0.3em] uppercase text-[var(--color-primary-medium)]">Future State Vision</span>
                    </div>
                    <h2 
                        style={titleAnim}
                        className="text-4xl font-black tracking-tighter uppercase mb-4 leading-tight"
                    >
                        <Editable value={slide.title} onUpdate={v => onUpdate('title', v)} />
                    </h2>
                    <div 
                        style={visionAnim}
                        className="text-xl text-white/90 font-light italic leading-tight mb-6"
                    >
                        &quot;<Editable value={slide.vision_statement} onUpdate={v => onUpdate('vision_statement', v)} />&quot;
                    </div>
                    <div style={pillarsAnim} className="space-y-4">
                        {ensureArray(slide.strategic_pillars).slice(0, 3).map((pillar, idx) => (
                            <div key={idx} className="group">
                                <div className="text-base font-bold uppercase tracking-widest text-[var(--color-primary-medium)] mb-2 flex items-center gap-3">
                                    <span className="text-[10px] opacity-50 font-mono">0{idx + 1}</span>
                                    <Editable value={pillar.title} onUpdate={v => onUpdate(`strategic_pillars[${idx}].title`, v)} />
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {ensureArray(pillar.initiatives).slice(0, 4).map((init, iidx) => (
                                        <span key={iidx} className="text-[8px] uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/50">
                                            {init}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-7 relative rounded-[32px] overflow-hidden shadow-2xl">
                    <EditableImage 
                        src={slide.image_url || imageUrls[slide.image_prompt] || ''} 
                        alt={slide.title} 
                        onUpdate={url => onUpdate('image_url', url)}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6 backdrop-blur-md bg-white/5 border border-white/10 p-5 rounded-2xl">
                        <div className="text-[var(--color-primary-medium)] font-bold text-[10px] uppercase mb-1 tracking-widest">Strategic Visualization</div>
                        <div className="text-white/70 text-xs font-light leading-relaxed italic">
                            Conceptual rendering of the proposed urban transformation, emphasizing human-centric design and ecological integration.
                        </div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const MacroStrategySlideLayout: React.FC<{ slide: MacroStrategySlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/70";

    return (
        <SlideWrapper 
            className="p-8 pb-24 flex flex-col justify-between"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <EditableImage 
                src={slide.image_url || imageUrls[slide.image_prompt] || ''} 
                alt="Strategy map" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate(`image_url`, newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}>
                 <Editable as="h1" value={slide.title} className="text-2xl md:text-3xl font-extrabold tracking-tighter" onUpdate={v => onUpdate('title', v)} />
                 <Editable as="p" value={slide.strategic_intent} className="text-xs md:text-sm text-white/70 max-w-2xl mt-1" onUpdate={v => onUpdate('strategic_intent', v)} />
            </div>
            <div className="relative z-20 grid grid-cols-3 gap-4 pr-2 pb-2">
                {ensureArray(slide.strategies).slice(0, 3).map((strategy, i) => {
                    const strategyAnimation = getAnimationStyles(isActive, 400 + i * 150, 'scale-in', disableAnimations);
                    return (
                        <div key={i} className="bg-black/50 backdrop-blur-md p-3 rounded-lg border border-white/10 flex flex-col" style={strategyAnimation}>
                            <Editable as="h3" value={strategy.title} onUpdate={v => onUpdate(`strategies[${i}].title`, v)} className="font-bold text-base text-[var(--color-accent-light)]" />
                            <Editable as="p" value={strategy.description} onUpdate={v => onUpdate(`strategies[${i}].description`, v)} className="text-white/80 mt-1.5 text-[10px]" useMarkdown />
                            <div className="mt-1.5 pt-1.5 border-t border-white/10">
                                <p className="text-[8px] font-bold text-white/50 uppercase tracking-wider">Rationale</p>
                                <Editable as="p" value={strategy.rationale} onUpdate={v => onUpdate(`strategies[${i}].rationale`, v)} className="text-white/70 mt-0.5 text-[9px] italic"/>
                            </div>
                        </div>
                    )
                })}
            </div>
        </SlideWrapper>
    );
};

const EquityAnalysisSlideLayout: React.FC<{ slide: EquityAnalysisSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const impactsAnimation = getAnimationStyles(isActive, 350, 'fade-in-up', disableAnimations);
    const strategiesAnimation = getAnimationStyles(isActive, 500, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper 
            className="p-8 pb-24 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <EditableImage 
                src={slide.image_url || imageUrls['equity_image'] || ''} 
                alt="Equity background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || "Equity Analysis"} onUpdate={v => onUpdate('title', v)} className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-4 text-[var(--color-accent-light)]" /></div>
            <div className="relative z-20 grid grid-cols-2 gap-8 flex-grow min-h-0">
                <div style={impactsAnimation} className="flex flex-col min-h-0">
                    <h3 className="font-bold text-sm text-[var(--color-accent-light)] border-b border-white/20 pb-1.5 mb-3">Distributional Impacts</h3>
                    <div className="space-y-3 pr-2 overflow-hidden">
                        {ensureArray(slide.distributional_impacts).slice(0, 3).length > 0 ? ensureArray(slide.distributional_impacts).slice(0, 3).map((item, i) => (
                            <div key={i} className="bg-white/5 p-3 rounded-lg">
                                <Editable as="p" value={item.group} onUpdate={v => onUpdate(`distributional_impacts[${i}].group`, v)} className="font-semibold text-white text-xs" />
                                <Editable as="p" value={item.impact} onUpdate={v => onUpdate(`distributional_impacts[${i}].impact`, v)} className="text-[10px] text-white/70 mt-0.5" />
                            </div>
                        )) : (
                            <p className="text-white/40 italic text-xs">No distributional impacts identified.</p>
                        )}
                    </div>
                </div>
                <div style={strategiesAnimation} className="flex flex-col min-h-0">
                    <h3 className="font-bold text-sm text-[var(--color-accent-light)] border-b border-white/20 pb-1.5 mb-3">Mitigation Strategies</h3>
                     <ul className="list-disc list-inside space-y-1.5 mt-1 text-xs text-white/90 pr-2">
                        {ensureArray(slide.mitigation_strategies).slice(0, 5).length > 0 ? ensureArray(slide.mitigation_strategies).slice(0, 5).map((strat, i) => (
                            <li key={i}><Editable as="span" value={strat} onUpdate={v => onUpdate(`mitigation_strategies[${i}]`, v)} className="text-xs" /></li>
                        )) : (
                            <p className="text-white/40 italic text-xs list-none">No mitigation strategies defined.</p>
                        )}
                    </ul>
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

    const overlayClassBefore = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";
    const overlayClassAfter = designSystem?.is_light_background ? "bg-white/10" : "bg-black/75";

    return (
        <SlideWrapper 
            className="p-0 text-center flex flex-col pb-24"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="w-1/2 h-full absolute left-0 top-0">
                <EditableImage 
                    src={slide.before_image_url || imageUrls[slide.before_image_prompt] || ''} 
                    alt="Before" 
                    className="w-full h-full"
                    onUpdate={(newUrl) => onUpdate(`before_image_url`, newUrl)}
                />
                <div className={`absolute inset-0 ${overlayClassBefore}`}></div>
                <div className="absolute top-3 left-3 bg-black/60 text-white px-2 py-0.5 text-[8px] rounded font-black tracking-widest z-10">BEFORE</div>
            </div>
            <div className="w-1/2 h-full absolute right-0 top-0">
                <EditableImage 
                    src={slide.after_image_url || imageUrls[slide.after_image_prompt] || ''} 
                    alt="After" 
                    className="w-full h-full"
                    onUpdate={(newUrl) => onUpdate(`after_image_url`, newUrl)}
                />
                <div className={`absolute inset-0 ${overlayClassAfter}`}></div>
                <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-0.5 text-[8px] rounded font-black tracking-widest z-10">AFTER</div>
            </div>
            <div className="relative z-20 flex-grow flex flex-col justify-between p-6 pb-2">
                <div style={titleAnimation} className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 max-w-xl mx-auto mb-2">
                    <Editable as="h2" value={slide.title} className="text-lg md:text-xl font-extrabold tracking-tighter break-words leading-tight" onUpdate={v => onUpdate('title', v)} />
                    <Editable as="p" value={slide.site_rationale} onUpdate={v => onUpdate('site_rationale', v)} className="text-[8px] md:text-[9px] text-white/70 mt-0.5 italic" />
                </div>
                <div className="grid grid-cols-3 gap-3 w-full max-w-3xl mx-auto mb-2">
                    {ensureArray(slide.metrics).slice(0, 3).map((metric, i) => {
                        const metricAnimation = getAnimationStyles(isActive, 400 + i * 150, 'fade-in-up', disableAnimations);
                        return (
                            <div key={i} className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-xl px-3 py-3 flex flex-col items-center justify-center text-center shadow-2xl transition-transform hover:scale-105" style={metricAnimation}>
                                <MetricValueDisplay
                                    value={metric.value}
                                    isActive={isActive}
                                    numberClass="text-lg md:text-xl font-black text-white"
                                    suffixClass="text-xs text-white/80"
                                    disableAnimations={disableAnimations}
                                />
                                <Editable as="p" value={metric.label} onUpdate={v => onUpdate(`metrics[${i}].label`, v)} className="text-[6px] text-white/50 uppercase tracking-[0.2em] font-bold mt-0.5" />
                            </div>
                        )
                    })}
                </div>
                 <div style={conclusionAnimation} className="bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10 max-w-2xl mx-auto">
                    <Editable as="p" value={slide.conclusion} onUpdate={v => onUpdate('conclusion', v)} className="text-xs md:text-sm font-bold text-[var(--color-accent-light)] leading-snug" useMarkdown />
                </div>
            </div>
        </SlideWrapper>
    );
};

const ReferencesSlideLayout: React.FC<{ slide: ReferencesSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const sourcesAnimation = getAnimationStyles(isActive, 400, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper 
            className="p-8 pb-24 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <EditableImage 
                src={slide.image_url || imageUrls['references_image'] || ''} 
                alt="References background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || 'Strategic References'} className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-4 text-[var(--color-accent-light)]" onUpdate={v => onUpdate('title', v)} /></div>
            <div className="relative z-20 flex-grow pr-2 pb-2 overflow-hidden" style={sourcesAnimation}>
                <div className="grid grid-cols-2 gap-3">
                    {ensureArray(slide.sources).slice(0, 6).map((source, i) => (
                        <div key={i} className="bg-black/40 backdrop-blur-md p-2.5 rounded-lg border border-white/10 hover:bg-white/10 transition-all group">
                            <div className="flex items-start justify-between mb-0.5">
                                <div className="flex-grow">
                                    <Editable as="p" value={source.title} onUpdate={v => onUpdate(`sources[${i}].title`, v)} className="text-xs font-bold text-gray-100 group-hover:text-[var(--color-primary-medium)] transition-colors truncate" />
                                    <div className="flex items-center space-x-2 mt-0.5">
                                        <Editable as="span" value={source.author} onUpdate={v => onUpdate(`sources[${i}].author`, v)} className="text-[8px] text-white/40" />
                                        <span className="text-white/20">•</span>
                                        <Editable as="span" value={source.year} onUpdate={v => onUpdate(`sources[${i}].year`, v)} className="text-[8px] text-white/40" />
                                    </div>
                                </div>
                                {source.link && (
                                    <a href={source.link} target="_blank" rel="noopener noreferrer" className="p-1 bg-white/5 rounded-full hover:bg-[var(--color-primary-medium)]/20 text-white/40 hover:text-[var(--color-primary-medium)] transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                            <div className="mt-0.5 pl-2 border-l-2 border-[var(--color-primary-medium)]/30">
                                <p className="text-[7px] uppercase tracking-widest text-white/40 mb-0.5">Strategic Relevance</p>
                                <Editable as="p" value={source.relevance} onUpdate={v => onUpdate(`sources[${i}].relevance`, v)} className="text-[9px] text-white/70 italic leading-tight line-clamp-2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </SlideWrapper>
    );
};

const ScenarioComparisonSlideLayout: React.FC<{ slide: ScenarioComparisonSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper 
            className="p-8 pb-24 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <EditableImage 
                src={slide.image_url || imageUrls['scenario_image'] || ''} 
                alt="Scenario background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || "Scenario Comparison"} onUpdate={v => onUpdate('title', v)} className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-4 text-[var(--color-accent-light)]" /></div>
            <div className="relative z-20 flex-grow grid grid-cols-3 gap-4 pr-2">
                {ensureArray(slide.scenarios).slice(0, 3).map((scenario, i) => {
                    const scenarioAnimation = getAnimationStyles(isActive, 350 + i * 150, 'scale-in', disableAnimations);
                    return (
                        <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/10 flex flex-col transition-all duration-300 hover:bg-white/10 hover:border-white/20" style={scenarioAnimation}>
                            <Editable as="h3" value={scenario.name} onUpdate={v => onUpdate(`scenarios[${i}].name`, v)} className="font-bold text-sm md:text-base text-white text-center" />
                            <div className="my-2 border-t border-white/10">
                                {ensureArray(scenario.outcomes).slice(0, 4).map((outcome, j) => (
                                     <div key={j} className="flex justify-between items-center py-1 border-b border-white/10 text-[8px] md:text-[9px]">
                                        <Editable as="span" value={outcome.metric} onUpdate={v => onUpdate(`scenarios[${i}].outcomes[${j}].metric`, v)} className="text-white/70" />
                                        <Editable as="span" value={outcome.value} onUpdate={v => onUpdate(`scenarios[${i}].outcomes[${j}].value`, v)} className="font-bold text-white" />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-auto space-y-1 text-[8px]">
                                 <p className="font-bold text-white/50">RISK</p>
                                <Editable as="p" value={scenario.risk} onUpdate={v => onUpdate(`scenarios[${i}].risk`, v)} className="text-white/80 leading-tight line-clamp-2" />
                                <p className="font-bold text-white/50 mt-1">COST</p>
                                <Editable as="p" value={scenario.cost} onUpdate={v => onUpdate(`scenarios[${i}].cost`, v)} className="font-extrabold text-sm text-[var(--color-accent-light)]" />
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

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper 
            className="p-8 pb-24 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <EditableImage 
                src={slide.image_url || imageUrls['risk_image'] || ''} 
                alt="Risk background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || "Risk Assessment"} onUpdate={v => onUpdate('title', v)} className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-4 text-[var(--color-accent-light)]" /></div>
            <div className="relative z-20 flex-grow space-y-2 pr-2 overflow-hidden">
                {ensureArray(slide.risks).slice(0, 5).map((risk, i) => {
                    const riskAnimation = getAnimationStyles(isActive, 350 + i * 100, 'fade-in-up', disableAnimations);
                    return (
                        <div key={i} className="bg-white/5 p-2.5 rounded-lg grid grid-cols-3 gap-4 items-start transition-all duration-200 hover:bg-white/10 border border-white/5" style={riskAnimation}>
                            <Editable as="p" value={risk.category} onUpdate={v => onUpdate(`risks[${i}].category`, v)} className="font-bold text-[9px] md:text-[10px] text-[var(--color-accent-light)] uppercase tracking-wider" />
                            <div>
                                <p className="text-[8px] font-bold text-white/50 mb-0.5">Description</p>
                                <Editable as="p" value={risk.description} onUpdate={v => onUpdate(`risks[${i}].description`, v)} className="text-[9px] md:text-[10px] text-white/80 leading-snug line-clamp-2" />
                            </div>
                             <div>
                                <p className="text-[8px] font-bold text-white/50 mb-0.5">Mitigation</p>
                                <Editable as="p" value={risk.mitigation} onUpdate={v => onUpdate(`risks[${i}].mitigation`, v)} className="text-[9px] md:text-[10px] text-white/80 leading-snug line-clamp-2" />
                            </div>
                        </div>
                    )
                })}
            </div>
        </SlideWrapper>
    );
};

const RoadmapSlideLayout: React.FC<{ slide: RoadmapSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper 
            className="p-8 pb-24 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <EditableImage 
                src={slide.image_url || imageUrls['roadmap_image'] || ''} 
                alt="Roadmap background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || "Implementation Doctrine"} className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-4 text-[var(--color-accent-light)]" onUpdate={v => onUpdate('title', v)} /></div>
            <div className="relative z-20 flex justify-between items-stretch gap-4 flex-grow min-h-0">
                {ensureArray(slide.phases).slice(0, 3).map((phase, i) => {
                    const phaseAnimation = getAnimationStyles(isActive, 350 + i * 150, 'scale-in', disableAnimations);
                    return (
                        <div key={i} className="w-1/3 bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 flex flex-col flex-1 min-h-0" style={phaseAnimation}>
                            <div className="flex items-center mb-2 flex-shrink-0">
                                <div className="w-6 h-6 bg-[var(--color-primary-medium)] text-white rounded-full flex items-center justify-center font-bold text-xs mr-2">{String(i + 1).padStart(2, '0')}</div>
                                <div>
                                    <Editable as="h3" value={phase.title} onUpdate={v => onUpdate(`phases[${i}].title`, v)} className="font-extrabold text-sm text-white" />
                                    <Editable as="p" value={phase.timeline} onUpdate={v => onUpdate(`phases[${i}].timeline`, v)} className="text-[8px] text-white/50 font-semibold uppercase" />
                                </div>
                            </div>
                            <div className="flex-grow min-h-0 pr-1 overflow-hidden">
                                <p className="text-[8px] font-semibold mt-1.5 text-white/60 uppercase tracking-wider">Action Steps & KPIs:</p>
                                <ul className="text-[9px] space-y-1.5 mt-1 text-white/80">
                                    {ensureArray(phase.action_steps).slice(0, 3).map((step, j) => (
                                        <li key={j} className="text-[9px]">
                                            <Editable as="span" value={step.action} onUpdate={v => onUpdate(`phases[${i}].action_steps[${j}].action`, v)} className="line-clamp-1" />
                                            <div className="flex items-center mt-0.5">
                                                <span className="text-[8px] font-bold text-blue-400/80 mr-1.5">KPI:</span>
                                                <Editable as="span" value={step.kpi} onUpdate={v => onUpdate(`phases[${i}].action_steps[${j}].kpi`, v)} className="text-[8px] text-white/60 italic truncate" />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-auto pt-2 border-t border-white/10 flex-shrink-0">
                                <p className="font-bold text-[8px] text-[var(--color-primary-medium)] uppercase tracking-wider">Outcome</p>
                                <Editable as="p" value={phase.outcome} onUpdate={v => onUpdate('phases[' + i + '].outcome', v)} className="text-[9px] text-white font-semibold leading-tight line-clamp-2" />
                            </div>
                        </div>
                    )
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

    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const yearHeaderAnimation = getAnimationStyles(isActive, 300, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper 
            className="p-6 pb-24 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <EditableImage 
                src={slide.image_url || imageUrls['gantt_image'] || ''} 
                alt="Gantt background" 
                className="absolute inset-0 w-full h-full z-0 opacity-20"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20 flex flex-col h-full overflow-hidden">
                <div style={titleAnimation} className="flex items-baseline justify-between mb-2">
                    <Editable as="h1" value={slide.title} onUpdate={v => onUpdate('title', v)} className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--color-accent-light)]" />
                    <div className="flex items-center space-x-2 text-white/40 text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded-full">
                        <Editable value={String(startYear)} onUpdate={v => onUpdate('timeline_start_year', parseInt(v) || startYear)} className="hover:text-white transition-colors" />
                        <span className="opacity-30">&mdash;</span>
                        <Editable value={String(endYear)} onUpdate={v => onUpdate('timeline_end_year', parseInt(v) || endYear)} className="hover:text-white transition-colors" />
                    </div>
                </div>
                
                <div className="flex-grow flex flex-col min-h-0 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                    {/* Timeline Header */}
                    <div className="flex pl-[25%] border-b border-white/10 flex-shrink-0">
                        <div className="w-full grid" style={{ gridTemplateColumns: `repeat(${years.length}, 1fr)` }}>
                            {years.map(year => (
                                <div key={year} className="text-center border-r border-white/10 last:border-0" style={yearHeaderAnimation}>
                                    <p className="font-bold text-white/60 text-[9px] py-0.5 bg-white/5 uppercase tracking-widest">{year}</p>
                                    <div className="grid grid-cols-4">
                                        {[1, 2, 3, 4].map(q => (
                                            <div key={q} className="text-[7px] text-white/30 py-0.5 border-r border-white/5 last:border-0">Q{q}</div>
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
                            <div className="absolute top-0 left-[25%] w-[75%] h-full grid" style={{ gridTemplateColumns: `repeat(${totalQuarters}, 1fr)` }}>
                                {Array.from({ length: totalQuarters }).map((_, i) => <div key={i} className={`h-full ${ (i + 1) % 4 === 0 ? 'border-r border-white/20' : 'border-r border-white/10'}`}></div>)}
                            </div>
        
                            {/* Labels and Bars */}
                            <div className="w-full relative z-10 space-y-0">
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
                                            const deliverablePath = `phases[${pIndex}].deliverables[${dIndex}]`;
                                            const deliverableAnimation = getAnimationStyles(isActive, 400 + (pIndex * (ensureArray(phase.deliverables).length) + dIndex) * 50, 'fade-in-up', disableAnimations);
            
                                            return (
                                                <div key={`${pIndex}-${dIndex}`} className="flex items-center h-6 relative group" style={deliverableAnimation}>
                                                    <div className="w-[25%] flex-shrink-0 pr-3 text-right">
                                                        <Editable as="p" value={d.name} onUpdate={v => onUpdate(`${deliverablePath}.name`, v)} className="text-[8px] font-semibold text-white/90 truncate" />
                                                        <div className="text-[6px] text-white/50 italic truncate flex justify-end items-center">
                                                            <span className="mr-1">KPI:</span>
                                                            <Editable as="span" value={d.kpi} onUpdate={v => onUpdate(`${deliverablePath}.kpi`, v)} />
                                                        </div>
                                                    </div>
                                                    <div className="absolute h-2 transition-all duration-300 group-hover:h-3" style={{ 
                                                        left: `calc(25% + ${(startIndex / totalQuarters) * 75}%)`, 
                                                        width: `calc(${(duration / totalQuarters) * 75}%)`, 
                                                        top: '50%', 
                                                        transform: 'translateY(-50%)' 
                                                    }}>
                                                        <div className="h-full bg-[var(--color-primary-medium)] rounded-sm flex items-center justify-end px-1 shadow-lg transition-all duration-300 group-hover:brightness-125"
                                                             style={{ background: 'linear-gradient(90deg, var(--color-primary-medium), var(--color-primary-light))' }}
                                                        >
                                                            <div className="w-0.5 h-0.5 bg-white/80 rounded-full shadow-sm"></div>
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

const ProjectedImpactSlideLayout: React.FC<{ slide: ProjectedImpactSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const subtitleAnimation = getAnimationStyles(isActive, 350, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper 
            className="p-8 pb-24 flex flex-col items-center text-center"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <EditableImage 
                src={slide.image_url || imageUrls['impact_image'] || ''} 
                alt="Impact background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}>
                <Editable as="h1" value={slide.title || 'Projected Impact'} onUpdate={v => onUpdate('title', v)} className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-1 text-[var(--color-accent-light)]" />
            </div>
            <div className="relative z-20" style={subtitleAnimation}>
                <Editable as="p" value={slide.subtitle || "The quantified outcomes of the doctrine."} onUpdate={v => onUpdate('subtitle', v)} className="text-xs md:text-sm text-white/60 mb-4 max-w-3xl mx-auto" />
            </div>
            <div className="relative z-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-7xl pr-2 pb-2">
                {(slide.metrics || []).map((metric, i) => {
                    const baselineMatch = (metric.baseline || '').match(/(.*?)\s*\((.*)\)/);
                    const baselineValue = baselineMatch ? baselineMatch[1].trim() : metric.baseline;
                    const baselineDescription = baselineMatch ? `(${baselineMatch[2]})` : null;

                    const projectedMatch = (metric.projected || '').match(/(.*?)\s*\((.*)\)/);
                    const projectedValue = projectedMatch ? projectedMatch[1].trim() : metric.projected;
                    const projectedDescription = projectedMatch ? `(${projectedMatch[2]})` : null;
                    const metricAnimation = getAnimationStyles(isActive, 500 + i * 150, 'scale-in', disableAnimations);
                    
                    return (
                        <div key={i} className="bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10 flex flex-col text-left" style={metricAnimation}>
                            <Editable as="p" value={metric.label} onUpdate={v => onUpdate(`metrics[${i}].label`, v)} className="text-xs font-bold text-[var(--color-accent-light)] mb-2 h-8 overflow-hidden" />
                            
                            <div className="flex-grow grid grid-cols-[1fr_auto_1fr] items-center gap-1 mb-2">
                                <div className="text-center">
                                    <p className="text-[8px] text-white/50 uppercase tracking-widest">Baseline</p>
                                    <MetricValueDisplay
                                        value={baselineValue}
                                        isActive={isActive}
                                        numberClass="text-lg text-white/70"
                                        suffixClass="text-sm" 
                                        disableAnimations={disableAnimations}
                                    />
                                    {baselineDescription && <p className="text-[9px] font-bold text-white/70 mt-0.5">{baselineDescription}</p>}
                                </div>
                                <div className="text-base text-[var(--color-primary-medium)] font-light">&rarr;</div>
                                <div className="text-center">
                                    <p className="text-[8px] text-[var(--color-primary-medium)] uppercase font-bold tracking-widest">Projected</p>
                                    <MetricValueDisplay 
                                        value={projectedValue}
                                        isActive={isActive}
                                        numberClass="text-xl text-[var(--color-accent-cream)]"
                                        suffixClass="text-base"
                                        disableAnimations={disableAnimations}
                                    />
                                    {projectedDescription && <p className="text-[9px] font-bold text-white/80 mt-0.5">{projectedDescription}</p>}
                                </div>
                            </div>

                            <div className="text-[8px] text-white/60 mt-auto border-t border-white/10 pt-2 space-y-0.5">
                                <p><strong>Timeframe:</strong> <Editable as="span" value={metric.timeframe} onUpdate={v => onUpdate(`metrics[${i}].timeframe`, v)}/></p>
                                <p><strong>Assumption:</strong> <Editable as="span" value={metric.assumption} onUpdate={v => onUpdate(`metrics[${i}].assumption`, v)}/></p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </SlideWrapper>
    );
};

const FiscalFrameworkSlideLayout: React.FC<{ slide: FiscalFrameworkSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper 
            className="p-8 pb-24 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <EditableImage 
                src={slide.image_url || imageUrls['fiscal_image'] || ''} 
                alt="Fiscal background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || "Fiscal Framework"} onUpdate={v => onUpdate('title', v)} className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-4 text-[var(--color-accent-light)]" /></div>
            <div className="relative z-20 flex-grow bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-1 pr-2 flex flex-col overflow-hidden">
                <div className="grid grid-cols-5 text-[8px] font-bold text-white/60 uppercase p-2 border-b border-white/10 tracking-wider flex-shrink-0">
                    <span>Component</span>
                    <span className="text-center">CapEx</span>
                    <span className="text-center">OpEx</span>
                    <span>Funding Source</span>
                    <span>Recovery Mechanism</span>
                </div>
                <div className="divide-y divide-white/10 overflow-hidden">
                    {(slide.cost_items || []).length > 0 ? (slide.cost_items || []).slice(0, 6).map((item, i) => {
                        const itemAnimation = getAnimationStyles(isActive, 350 + i * 100, 'fade-in-up', disableAnimations);
                        return (
                            <div key={i} className="grid grid-cols-5 gap-3 p-2 items-center text-[9px] md:text-[10px] transition-all duration-200 hover:bg-white/10" style={itemAnimation}>
                                <Editable as="p" value={item.component} onUpdate={v => onUpdate(`cost_items[${i}].component`, v)} className="font-semibold text-white truncate" />
                                <Editable as="p" value={item.capex} onUpdate={v => onUpdate(`cost_items[${i}].capex`, v)} className="text-center text-white/80" />
                                <Editable as="p" value={item.opex} onUpdate={v => onUpdate(`cost_items[${i}].opex`, v)} className="text-center text-white/80" />
                                <Editable as="p" value={item.funding_source} onUpdate={v => onUpdate(`cost_items[${i}].funding_source`, v)} className="text-white/80 text-[8px] truncate" />
                                <Editable as="p" value={item.recovery_mechanism} onUpdate={v => onUpdate(`cost_items[${i}].recovery_mechanism`, v)} className="text-white/80 text-[8px] truncate" />
                            </div>
                        )
                    }) : (
                        <div className="p-8 text-center text-white/40 italic text-xs">
                            No fiscal framework items defined.
                        </div>
                    )}
                </div>
            </div>
        </SlideWrapper>
    );
};

const PolicyLeversSlideLayout: React.FC<{ slide: PolicyLeversSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper 
            className="p-8 pb-24 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <EditableImage 
                src={slide.image_url || imageUrls['policy_image'] || ''} 
                alt="Policy background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || "Required Policy Levers"} className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-4 text-[var(--color-accent-light)]" onUpdate={v => onUpdate('title', v)} /></div>
            <div className="relative z-20 space-y-3 flex-grow pr-2 pb-2 overflow-hidden">
                {(slide.recommendations || []).slice(0, 3).length > 0 ? (slide.recommendations || []).slice(0, 3).map((rec, i) => {
                    const recommendationAnimation = getAnimationStyles(isActive, 350 + i * 150, 'fade-in-up', disableAnimations);
                    return (
                        <div key={i} className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10" style={recommendationAnimation}>
                            <Editable as="h3" value={rec.title} onUpdate={v => onUpdate(`recommendations[${i}].title`, v)} className="font-bold text-sm text-white mb-2" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                <div>
                                    <p className="text-[8px] font-bold uppercase text-white/50 mb-1">Strategy & Impact</p>
                                    <Editable as="p" value={rec.strategy} onUpdate={v => onUpdate(`recommendations[${i}].strategy`, v)} className="text-[9px] mb-1 text-white/80 line-clamp-2" useMarkdown />
                                    <Editable as="p" value={rec.expected_impact} onUpdate={v => onUpdate(`recommendations[${i}].expected_impact`, v)} className="text-[9px] font-semibold text-white truncate" useMarkdown />
                                </div>
                                <div>
                                     <p className="text-[8px] font-bold uppercase text-white/50 mb-1">Measurement Framework</p>
                                    <Editable as="p" value={rec.measurement_framework} onUpdate={v => onUpdate(`recommendations[${i}].measurement_framework`, v)} className="text-[9px] text-white/80 line-clamp-3" />
                                </div>
                            </div>
                        </div>
                    )
                }) : (
                    <div className="flex items-center justify-center h-full text-white/40 italic text-sm">
                        No policy recommendations generated.
                    </div>
                )}
            </div>
        </SlideWrapper>
    );
};

const GovernanceFrameworkSlideLayout: React.FC<{ slide: GovernanceFrameworkSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem, slideNumber: number }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem, slideNumber }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const leadAgencyAnimation = getAnimationStyles(isActive, 350, 'fade-in-up', disableAnimations);
    const fundingModelAnimation = getAnimationStyles(isActive, 500, 'fade-in-up', disableAnimations);
    const regulatoryChangesAnimation = getAnimationStyles(isActive, 650, 'fade-in-up', disableAnimations);
    const stakeholderRolesAnimation = getAnimationStyles(isActive, 350, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper 
            className="p-8 pb-24 flex flex-col"
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <EditableImage 
                src={slide.image_url || imageUrls['governance_image'] || ''} 
                alt="Governance background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || "Governance Framework"} onUpdate={v => onUpdate('title', v)} className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-4 text-[var(--color-accent-light)]" /></div>
            <div className="relative z-20 flex-grow grid grid-cols-2 gap-6 min-h-0">
                <div className="space-y-2 pr-2">
                    <div className="bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10" style={leadAgencyAnimation}>
                        <h3 className="font-bold text-xs text-[var(--color-accent-light)] mb-1">Lead Agency</h3>
                        <Editable as="p" value={slide.lead_agency?.name} onUpdate={v => onUpdate('lead_agency.name', v)} className="text-[11px] font-semibold text-white truncate" />
                        <Editable as="p" value={slide.lead_agency?.rationale} onUpdate={v => onUpdate('lead_agency.rationale', v)} className="text-[9px] text-white/70 mt-0.5 line-clamp-2" />
                    </div>
                     <div className="bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10" style={fundingModelAnimation}>
                        <h3 className="font-bold text-xs text-[var(--color-accent-light)] mb-1">Funding Model</h3>
                        <Editable as="p" value={slide.funding_model} onUpdate={v => onUpdate('funding_model', v)} className="text-[9px] text-white line-clamp-2" />
                    </div>
                     <div className="bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10" style={regulatoryChangesAnimation}>
                        <h3 className="font-bold text-xs text-[var(--color-accent-light)] mb-1">Regulatory Changes</h3>
                         <ul className="list-disc list-inside space-y-0.5 text-[9px] text-white/90">
                            {(slide.regulatory_changes || []).slice(0, 3).length > 0 ? (slide.regulatory_changes || []).slice(0, 3).map((change, i) => <li key={i} className="truncate"><Editable as="span" value={change} onUpdate={v => onUpdate(`regulatory_changes[${i}]`, v)} /></li>) : (
                                <p className="text-white/40 italic list-none">No regulatory changes identified.</p>
                            )}
                        </ul>
                    </div>
                </div>
                 <div className="flex flex-col min-h-0">
                    <h3 className="font-bold text-xs text-[var(--color-accent-light)] mb-1 flex-shrink-0" style={stakeholderRolesAnimation}>Key Stakeholder Roles</h3>
                    <div className="space-y-0.5 pr-2 flex-grow overflow-hidden">
                        {(slide.stakeholders || []).slice(0, 8).length > 0 ? (slide.stakeholders || []).slice(0, 8).map((s, i) => {
                            const stakeholderAnimation = getAnimationStyles(isActive, 500 + i * 75, 'fade-in-up', disableAnimations);
                            return (
                                <div key={i} className="flex items-start text-[9px] border-b border-white/10 py-1" style={stakeholderAnimation}>
                                    <Editable as="p" value={s.name} onUpdate={v => onUpdate(`stakeholders[${i}].name`, v)} className="w-1/3 font-semibold text-white/90 truncate mr-2" />
                                    <Editable as="p" value={s.role} onUpdate={v => onUpdate(`stakeholders[${i}].role`, v)} className="w-2/3 text-white/70 truncate" />
                                </div>
                            )
                        }) : (
                            <p className="text-white/40 italic text-xs">No stakeholder roles defined.</p>
                        )}
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
            slideNumber={slideNumber}
        >
            <EditableImage 
                src={slide.image_url || imageUrls['process_image'] || ''} 
                alt="Process background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}>
                <Editable as="h1" value={slide.title} onUpdate={v => onUpdate('title', v)} className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-1 text-[var(--color-accent-light)]" />
                <Editable as="p" value={slide.subtitle} onUpdate={v => onUpdate('subtitle', v)} className="text-xs md:text-sm text-white/60 mb-4" />
            </div>
            <div className="relative z-20 flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pr-2 pb-2">
                {(slide.steps || []).slice(0, 4).map((step, i) => {
                    const stepAnimation = getAnimationStyles(isActive, 350 + i * 150, 'fade-in-up', disableAnimations);
                    return (
                        <div key={i} className="relative bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10 flex flex-col min-h-[120px]" style={stepAnimation}>
                            <div className="absolute -top-2 -left-2 w-6 h-6 bg-[var(--color-primary-medium)] rounded-full flex items-center justify-center text-white font-bold shadow-lg text-[10px]">
                                {step.step_number || i + 1}
                            </div>
                            <Editable as="h3" value={step.title} onUpdate={v => onUpdate(`steps[${i}].title`, v)} className="font-bold text-xs md:text-sm text-white mb-1 mt-1 truncate" />
                            <Editable as="p" value={step.description} onUpdate={v => onUpdate(`steps[${i}].description`, v)} className="text-[9px] md:text-[10px] text-white/70 leading-relaxed line-clamp-4" />
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
            reflectionText={slide.analytic_reflection}
            onReflectionUpdate={v => onUpdate('analytic_reflection', v as string)}
            slideNumber={slideNumber}
        >
            <div className="flex h-full w-full">
                {/* Left side: Image */}
                <div className="w-1/2 relative">
                    <EditableImage 
                        src={slide.image_url || imageUrls[slide.image_prompt || 'closing_image'] || ''} 
                        alt="Closing visual" 
                        className="absolute inset-0 w-full h-full z-0"
                        onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-black via-transparent to-transparent z-10"></div>
                </div>

                {/* Right side: Content */}
                <div className="w-1/2 p-8 flex flex-col justify-center text-right relative z-20">
                    <div style={taglineAnimation}>
                        <Editable as="h2" value={slide.tagline} onUpdate={v => onUpdate('tagline', v)} className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight tracking-tighter text-white" />
                    </div>
                    <div style={lineAnimation}>
                        <div className="w-12 h-1 bg-[var(--color-primary-medium)] my-4 ml-auto"></div>
                    </div>
                    <div style={creditsAnimation}>
                        <Editable as="p" value={slide.credits} onUpdate={v => onUpdate('credits', v)} className="text-xs md:text-sm text-white/60" />
                    </div>
                    <div className="mt-8 flex justify-end">
                        <TanmyaaLogoPPTX className="h-6 opacity-50" />
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
        'Roadmap': RoadmapSlideLayout,
        'GanttChartRoadmap': GanttChartRoadmapSlideLayout,
        'ProjectedImpact': ProjectedImpactSlideLayout,
        'FiscalFramework': FiscalFrameworkSlideLayout,
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