import React, { CSSProperties, useEffect, useState } from 'react';
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

const ensureArray = <T,>(val: T | T[] | undefined | null): T[] => Array.isArray(val) ? val : [];

// Fix: Added 'style' prop to allow inline styling for components like Gantt charts that need specific backgrounds.
const SlideWrapper: React.FC<{ children: React.ReactNode, className?: string, style?: CSSProperties }> = ({ children, className = '', style }) => {
    const { presentationTemplateUrl } = useBranding();
    
    // If a template URL is provided (and it's an image), use it as the background
    const backgroundStyle: CSSProperties = presentationTemplateUrl && (presentationTemplateUrl.endsWith('.png') || presentationTemplateUrl.endsWith('.jpg') || presentationTemplateUrl.endsWith('.jpeg')) 
        ? { backgroundImage: `url(${presentationTemplateUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', ...style }
        : { ...style };

    return (
        <div className={`w-full h-full text-[var(--color-accent-cream)] flex flex-col overflow-hidden relative font-sans ${className}`} style={backgroundStyle}>
            {/* Dark overlay if using a custom background to ensure text readability */}
            {presentationTemplateUrl && <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none"></div>}
            <div className="relative z-10 w-full h-full flex flex-col">
                {children}
            </div>
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

const AnalyticReflection: React.FC<{ text: string, onUpdate: (newValue: string) => void, animationStyle: CSSProperties, disableAnimations?: boolean }> = ({ text, onUpdate, animationStyle, disableAnimations }) => (
    <div className="w-full max-w-4xl mx-auto px-6 py-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-2xl" style={disableAnimations ? { opacity: 1 } : animationStyle}>
        <div className="flex items-center gap-4">
            <div className="flex-shrink-0 px-2 py-1 bg-[var(--color-primary-medium)] rounded text-[10px] font-black uppercase tracking-tighter text-white">Reflection</div>
            <Editable as="p" value={text} onUpdate={onUpdate} className="italic text-xs md:text-sm text-white/80 leading-tight flex-grow" />
        </div>
    </div>
);


// --- REDESIGNED DOCTRINE-STYLE LAYOUTS ---

const CoverSlideLayout: React.FC<{ slide: CoverSlide, onUpdate: (field: string, val: string) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const lineAnimation = getAnimationStyles(isActive, 400, 'scale-in', disableAnimations);
    const subtitleAnimation = getAnimationStyles(isActive, 500, 'fade-in-up', disableAnimations);

    return (
    <SlideWrapper className="justify-center p-16 text-center">
        <EditableImage 
            src={slide.image_url || imageUrls['cover_image'] || ''} 
            alt="Cover background" 
            className="absolute inset-0 w-full h-full z-0"
            onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
        />
        <div className="absolute inset-0 bg-black/60 z-10 pointer-events-none"></div>
        <div className="relative z-20 w-full max-w-5xl mx-auto">
            <div style={titleAnimation}>
                <Editable as="h1" value={slide.title} onUpdate={v => onUpdate('title', v)} className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-tight" />
            </div>
            <div style={lineAnimation}>
                <div className="w-20 h-1.5 bg-[var(--color-primary-medium)] my-8 mx-auto"></div>
            </div>
            <div style={subtitleAnimation}>
                <Editable as="p" value={slide.subtitle} onUpdate={v => onUpdate('subtitle', v)} className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto" />
            </div>
        </div>
    </SlideWrapper>
)};

const ExecutiveOverviewSlideLayout: React.FC<{ slide: ExecutiveOverviewSlide, onUpdate: (field: string, val: string | string[]) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const narrativeAnimation = getAnimationStyles(isActive, 350, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/75";

    return (
        <SlideWrapper className="p-12 pb-28 flex flex-col">
            <EditableImage 
                src={slide.image_url || imageUrls['overview_image'] || ''} 
                alt="Overview background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title} className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-6 text-[var(--color-accent-light)]" onUpdate={v => onUpdate('title', v)} /></div>
            <div className="relative z-20 grid grid-cols-2 gap-12 flex-grow min-h-0">
                <div className="flex flex-col pr-4" style={narrativeAnimation}>
                    <Editable as="p" value={slide.narrative} onUpdate={v => onUpdate('narrative', v)} className="text-sm md:text-base leading-relaxed text-white/80" useMarkdown />
                </div>
                <div className="flex flex-col justify-center pr-4">
                    <ul className="space-y-4">
                        {ensureArray(slide.key_points).map((point, i) => {
                            const keyPointAnimation = getAnimationStyles(isActive, 500 + i * 150, 'fade-in-up', disableAnimations);
                            return (
                                <li key={i} className="flex items-start" style={keyPointAnimation}>
                                     <div className="w-8 h-8 rounded-full bg-[var(--color-primary-medium)] text-[var(--color-accent-cream)] text-xs font-bold flex items-center justify-center mr-4 flex-shrink-0">{String(i+1).padStart(2, '0')}</div>
                                    <Editable value={point} onUpdate={v => onUpdate(`key_points[${i}]`, v)} className="text-sm md:text-base font-semibold pt-1" />
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
        </SlideWrapper>
    );
};

const CrisisSlideLayout: React.FC<{ slide: CrisisSlide, onUpdate: (field: string, val: string | {label: string, value: string, description: string}[]) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
    const titleAnim = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const problemAnim = getAnimationStyles(isActive, 350, 'fade-in-up', disableAnimations);
    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
    <SlideWrapper className="p-12 pb-24 flex flex-col justify-between text-center">
        <EditableImage 
            src={slide.image_url || imageUrls['crisis_image'] || ''} 
            alt="Crisis background" 
            className="absolute inset-0 w-full h-full z-0"
            onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
        />
        <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
        <div className="relative z-20 pt-4">
            <div style={titleAnim}><Editable as="h1" value={slide.title} className="text-4xl md:text-5xl font-extrabold tracking-tighter leading-tight" onUpdate={v => onUpdate('title', v)} /></div>
            <div style={problemAnim}><Editable as="p" value={slide.problem_statement} className="text-sm md:text-base text-white/80 max-w-4xl mx-auto mt-4 leading-relaxed" onUpdate={v => onUpdate('problem_statement', v)} /></div>
        </div>
        <div className="relative z-20 w-full grid grid-cols-3 gap-8 pb-8">
            {ensureArray(slide.key_data_points).map((point, i) => {
                return (
                    <div key={i} className="flex flex-col items-center" style={getAnimationStyles(isActive, 500 + i * 150, 'fade-in-up', disableAnimations)}>
                        <div className="mb-2">
                            <MetricValueDisplay
                                value={point.value}
                                isActive={isActive}
                                numberClass="text-4xl md:text-6xl font-black text-[var(--color-accent-cream)]"
                                suffixClass="text-xl md:text-2xl text-[var(--color-accent-cream)]/80"
                                disableAnimations={disableAnimations}
                            />
                        </div>
                        <Editable as="p" value={point.label} onUpdate={v => onUpdate(`key_data_points[${i}].label`, v)} className="text-white/90 uppercase tracking-[0.2em] font-bold text-[10px] md:text-xs" />
                        <Editable as="p" value={point.description} onUpdate={v => onUpdate(`key_data_points[${i}].description`, v)} className="text-white/60 text-[9px] md:text-[10px] mt-2 max-w-[30ch] leading-snug" />
                    </div>
                );
            })}
        </div>
    </SlideWrapper>
)};

const SWOTCategory: React.FC<{ title: string; items: { title: string; description: string }[]; onUpdate: (field: string, val: string) => void; type: 'strengths' | 'weaknesses' | 'opportunities' | 'threats'; animationStyle: CSSProperties }> = ({ title, items, onUpdate, type, animationStyle }) => (
    <div className="min-h-0" style={animationStyle}>
        <h3 className="font-bold text-lg mb-3 text-[var(--color-accent-light)] border-b border-white/20 pb-2">{title}</h3>
        <div className="space-y-4 mt-4">
            {ensureArray(items).map((item, i) => (
                <div key={i}>
                    <Editable as="p" value={item.title} onUpdate={v => onUpdate(`${type}[${i}].title`, v)} className="font-semibold text-white text-sm" useMarkdown/>
                    <Editable as="p" value={item.description} onUpdate={v => onUpdate(`${type}[${i}].description`, v)} className={`${item.description.length > 100 ? 'text-[10px]' : 'text-xs'} text-white/70 mt-1`} />
                </div>
            ))}
        </div>
    </div>
);

const SWOTSlideLayout: React.FC<{ slide: SWOTSlide, onUpdate: (field: string, val: string) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const strengthsAnimation = getAnimationStyles(isActive, 350, 'fade-in-up', disableAnimations);
    const weaknessesAnimation = getAnimationStyles(isActive, 400, 'fade-in-up', disableAnimations);
    const opportunitiesAnimation = getAnimationStyles(isActive, 500, 'fade-in-up', disableAnimations);
    const threatsAnimation = getAnimationStyles(isActive, 550, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper className="p-12 pb-28 flex flex-col">
            <EditableImage 
                src={slide.image_url || imageUrls['swot_image'] || ''} 
                alt="SWOT background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || "SWOT Analysis"} className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-6 text-[var(--color-accent-light)]" onUpdate={v => onUpdate('title', v)} /></div>
            <div className="relative z-20 flex-grow grid grid-cols-2 gap-x-12 min-h-0">
                <div className="space-y-4 flex flex-col min-h-0">
                    <div className="flex-1 pr-2">
                        <SWOTCategory title="Strengths" items={slide.strengths} onUpdate={onUpdate} type="strengths" animationStyle={strengthsAnimation} />
                    </div>
                    <div className="flex-1 pr-2">
                        <SWOTCategory title="Opportunities" items={slide.opportunities} onUpdate={onUpdate} type="opportunities" animationStyle={opportunitiesAnimation} />
                    </div>
                </div>
                <div className="space-y-4 flex flex-col min-h-0">
                    <div className="flex-1 pr-2">
                        <SWOTCategory title="Weaknesses" items={slide.weaknesses} onUpdate={onUpdate} type="weaknesses" animationStyle={weaknessesAnimation} />
                    </div>
                    <div className="flex-1 pr-2">
                        <SWOTCategory title="Threats" items={slide.threats} onUpdate={onUpdate} type="threats" animationStyle={threatsAnimation} />
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const BenchmarksSlideLayout: React.FC<{ slide: BenchmarksSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper className="p-8 pb-24 flex flex-col h-full">
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20 mb-4" style={titleAnimation}>
                <Editable as="h1" value="Global Benchmarks & Precedents" onUpdate={v => onUpdate('title', v)} className="text-3xl md:text-4xl font-extrabold tracking-tighter text-[var(--color-accent-light)]" />
            </div>
            <div className="relative z-20 grid grid-cols-3 gap-4 flex-grow min-h-0">
                {ensureArray(slide.benchmarks).slice(0, 3).map((benchmark, i) => {
                    const benchmarkAnimation = getAnimationStyles(isActive, 400 + i * 150, 'scale-in', disableAnimations);
                    return (
                        <div key={i} className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex flex-col overflow-hidden" style={benchmarkAnimation}>
                            <div className="h-32 relative overflow-hidden">
                                <EditableImage 
                                    src={benchmark.image_url || imageUrls[benchmark.image_prompt] || `https://picsum.photos/seed/${benchmark.name}/800/600`} 
                                    alt={benchmark.name} 
                                    className="w-full h-full object-cover"
                                    onUpdate={(newUrl) => onUpdate(`benchmarks[${i}].image_url`, newUrl)}
                                />
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                                    {benchmark.location}
                                </div>
                            </div>
                            <div className="p-4 flex-grow flex flex-col justify-between">
                                <div>
                                    <Editable as="h3" value={benchmark.name} onUpdate={v => onUpdate(`benchmarks[${i}].name`, v)} className="font-bold text-base text-[var(--color-accent-light)] leading-tight mb-2" />
                                    <Editable as="p" value={benchmark.introduction} onUpdate={v => onUpdate(`benchmarks[${i}].introduction`, v)} className="text-[10px] text-white/80 leading-snug mb-3" />
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Key Interventions</p>
                                        <ul className="list-disc list-inside text-[9px] text-white/70 space-y-0.5">
                                            {ensureArray(benchmark.interventions).slice(0, 3).map((item, j) => (
                                                <li key={j} className="truncate"><Editable as="span" value={item} onUpdate={v => onUpdate(`benchmarks[${i}].interventions[${j}]`, v)} /></li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <p className="text-[9px] font-bold text-[var(--color-accent-cream)] uppercase tracking-widest mb-1">Strategic Takeaway</p>
                                    <Editable as="p" value={benchmark.takeaway} onUpdate={v => onUpdate(`benchmarks[${i}].takeaway`, v)} className="text-[10px] text-white/90 italic leading-tight" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </SlideWrapper>
    );
};

const CaseStudyDeepDiveSlideLayout: React.FC<{ slide: CaseStudyDeepDiveSlide, onUpdate: (field: string, val: string | string[]) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const contentAnimation = getAnimationStyles(isActive, 350, 'scale-in', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/60";

    return (
        <SlideWrapper className="p-0">
            <div className="absolute inset-0 bg-black z-0"></div>
            <EditableImage 
                src={slide.image_url || imageUrls[slide.image_prompt] || ''} 
                alt="Case study background" 
                className="absolute inset-0 w-full h-full opacity-40"
                onUpdate={(newUrl) => onUpdate(`image_url`, newUrl)}
            />
            <div className="relative z-10 flex flex-col h-full p-8 pb-28">
                <div style={titleAnimation}>
                    <Editable as="h1" value={slide.title} className="text-3xl md:text-4xl font-extrabold tracking-tighter leading-tight max-w-4xl" onUpdate={v => onUpdate('title', v)} />
                </div>
                <div className="w-full flex-grow flex flex-col justify-center mt-4 min-h-0">
                    <div className={`${overlayClass} backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col max-w-5xl mx-auto w-full`} style={disableAnimations ? { opacity: 1 } : contentAnimation}>
                        <div className="pr-2">
                            <Editable as="p" value={slide.introduction} onUpdate={v => onUpdate('introduction', v)} className="text-xs md:text-sm text-white/90 mb-4 leading-relaxed" useMarkdown />
                            <div className="grid grid-cols-2 gap-8 border-t border-white/20 pt-4">
                                <div>
                                    <h3 className="font-bold text-[9px] uppercase tracking-widest text-[var(--color-primary-medium)] mb-2">Proven Application</h3>
                                    <ul className="space-y-1">
                                        {ensureArray(slide.key_findings).map((finding, i) => (
                                            <li key={i} className="flex items-start gap-2 text-[10px] md:text-xs text-white/80">
                                                <span className="text-[var(--color-primary-medium)] mt-1">•</span>
                                                <Editable as="span" value={finding} onUpdate={v => onUpdate(`key_findings[${i}]`, v)} useMarkdown/>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <Editable as="p" value={slide.conclusion} onUpdate={v => onUpdate('conclusion', v)} className="text-[var(--color-accent-light)] font-bold text-base md:text-lg leading-tight" />
                                    {slide.data_source && <Editable value={slide.data_source} onUpdate={v => onUpdate('data_source', v)} className="text-[7px] text-white/40 italic mt-3 uppercase tracking-widest" />}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const VisionSlideLayout: React.FC<{ slide: VisionSlide, onUpdate: (field: string, val: string) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const statementAnimation = getAnimationStyles(isActive, 400, 'fade-in-up', disableAnimations);
    
    const textLength = slide.vision_statement?.length || 0;
    const fontSizeClass = textLength > 250 ? 'text-lg md:text-xl lg:text-2xl' : 
                          textLength > 150 ? 'text-xl md:text-2xl lg:text-3xl' : 
                          textLength > 80 ? 'text-2xl md:text-3xl lg:text-4xl' : 
                          'text-3xl md:text-4xl lg:text-5xl';

    return (
        <SlideWrapper className="p-0 overflow-hidden">
            <div className="flex h-full w-full">
                {/* Left side: Content */}
                <div className="w-1/2 p-12 flex flex-col justify-center relative z-20">
                    <div style={titleAnimation}>
                        <Editable as="h2" value={slide.title} className="text-sm font-bold text-[var(--color-primary-medium)] uppercase tracking-[0.3em] mb-4" onUpdate={v => onUpdate('title', v)} />
                    </div>
                    <div style={statementAnimation}>
                        <Editable as="p" value={slide.vision_statement} onUpdate={v => onUpdate('vision_statement', v)} className={`${fontSizeClass} font-extrabold leading-tight tracking-tighter whitespace-pre-line text-white`} />
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/10">
                         <div className="grid grid-cols-1 gap-4">
                            {ensureArray(slide.strategic_pillars).slice(0, 2).map((pillar, i) => (
                                <div key={i} className="flex flex-col">
                                    <Editable as="h4" value={pillar.title} onUpdate={v => onUpdate(`strategic_pillars[${i}].title`, v)} className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1" />
                                    <div className="flex flex-wrap gap-2">
                                        {ensureArray(pillar.initiatives).map((init, j) => (
                                            <span key={j} className="text-[9px] px-2 py-0.5 bg-white/5 rounded-full text-white/60 border border-white/10">{init}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>

                {/* Right side: Image */}
                <div className="w-1/2 relative">
                    <EditableImage 
                        src={slide.image_url || imageUrls[slide.image_prompt] || ''} 
                        alt="Vision visual" 
                        className="absolute inset-0 w-full h-full z-0"
                        onUpdate={(newUrl) => onUpdate(`image_url`, newUrl)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent z-10"></div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const MacroStrategySlideLayout: React.FC<{ slide: MacroStrategySlide, onUpdate: (field: string, val: string) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/70";

    return (
        <SlideWrapper className="p-12 pb-28 flex flex-col justify-between">
            <EditableImage 
                src={slide.image_url || imageUrls[slide.image_prompt] || ''} 
                alt="Strategy map" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate(`image_url`, newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}>
                 <Editable as="h1" value={slide.title} className="text-3xl md:text-4xl font-extrabold tracking-tighter" onUpdate={v => onUpdate('title', v)} />
                 <Editable as="p" value={slide.strategic_intent} className="text-sm md:text-base text-white/70 max-w-3xl mt-2" onUpdate={v => onUpdate('strategic_intent', v)} />
            </div>
            <div className="relative z-20 grid grid-cols-3 gap-4 pr-2 pb-4">
                {ensureArray(slide.strategies).slice(0, 3).map((strategy, i) => {
                    const strategyAnimation = getAnimationStyles(isActive, 400 + i * 150, 'scale-in', disableAnimations);
                    return (
                        <div key={i} className="bg-black/50 backdrop-blur-md p-4 rounded-lg border border-white/10 flex flex-col" style={strategyAnimation}>
                            <Editable as="h3" value={strategy.title} onUpdate={v => onUpdate(`strategies[${i}].title`, v)} className="font-bold text-lg text-[var(--color-accent-light)]" />
                            <Editable as="p" value={strategy.description} onUpdate={v => onUpdate(`strategies[${i}].description`, v)} className="text-white/80 mt-2 text-xs" useMarkdown />
                            <div className="mt-2 pt-2 border-t border-white/10">
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Rationale</p>
                                <Editable as="p" value={strategy.rationale} onUpdate={v => onUpdate(`strategies[${i}].rationale`, v)} className="text-white/70 mt-1 text-[10px] italic"/>
                            </div>
                        </div>
                    )
                })}
            </div>
        </SlideWrapper>
    );
};

const EquityAnalysisSlideLayout: React.FC<{ slide: EquityAnalysisSlide, onUpdate: (field: string, val: string | string[]) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const impactsAnimation = getAnimationStyles(isActive, 350, 'fade-in-up', disableAnimations);
    const strategiesAnimation = getAnimationStyles(isActive, 500, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper className="p-12 pb-28 flex flex-col">
            <EditableImage 
                src={slide.image_url || imageUrls['equity_image'] || ''} 
                alt="Equity background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || "Equity Analysis"} onUpdate={v => onUpdate('title', v)} className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-6 text-[var(--color-accent-light)]" /></div>
            <div className="relative z-20 grid grid-cols-2 gap-12 flex-grow min-h-0">
                <div style={impactsAnimation} className="flex flex-col min-h-0">
                    <h3 className="font-bold text-base text-[var(--color-accent-light)] border-b border-white/20 pb-2 mb-4">Distributional Impacts</h3>
                    <div className="space-y-4 pr-2">
                        {ensureArray(slide.distributional_impacts).slice(0, 3).length > 0 ? ensureArray(slide.distributional_impacts).slice(0, 3).map((item, i) => (
                            <div key={i} className="bg-white/5 p-4 rounded-lg">
                                <Editable as="p" value={item.group} onUpdate={v => onUpdate(`distributional_impacts[${i}].group`, v)} className="font-semibold text-white text-sm" />
                                <Editable as="p" value={item.impact} onUpdate={v => onUpdate(`distributional_impacts[${i}].impact`, v)} className="text-xs text-white/70 mt-1" />
                            </div>
                        )) : (
                            <p className="text-white/40 italic text-sm">No distributional impacts identified.</p>
                        )}
                    </div>
                </div>
                <div style={strategiesAnimation} className="flex flex-col min-h-0">
                    <h3 className="font-bold text-base text-[var(--color-accent-light)] border-b border-white/20 pb-2 mb-4">Mitigation Strategies</h3>
                     <ul className="list-disc list-inside space-y-2 mt-2 text-sm text-white/90 pr-2">
                        {ensureArray(slide.mitigation_strategies).slice(0, 5).length > 0 ? ensureArray(slide.mitigation_strategies).slice(0, 5).map((strat, i) => (
                            <li key={i}><Editable as="span" value={strat} onUpdate={v => onUpdate(`mitigation_strategies[${i}]`, v)} className="text-sm" /></li>
                        )) : (
                            <p className="text-white/40 italic text-sm list-none">No mitigation strategies defined.</p>
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

const NodeAssessmentSlideLayout: React.FC<{ slide: NodeAssessmentSlide, onUpdate: (field: string, val: string | {label: string, value: string}[]) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const conclusionAnimation = getAnimationStyles(isActive, 850, 'fade-in-up', disableAnimations);

    const overlayClassBefore = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";
    const overlayClassAfter = designSystem?.is_light_background ? "bg-white/10" : "bg-black/75";

    return (
        <SlideWrapper className="p-0 text-center flex flex-col pb-28">
            <div className="w-1/2 h-full absolute left-0 top-0">
                <EditableImage 
                    src={slide.before_image_url || imageUrls[slide.before_image_prompt] || ''} 
                    alt="Before" 
                    className="w-full h-full"
                    onUpdate={(newUrl) => onUpdate(`before_image_url`, newUrl)}
                />
                <div className={`absolute inset-0 ${overlayClassBefore}`}></div>
                <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 text-[10px] rounded font-black tracking-widest z-10">BEFORE</div>
            </div>
            <div className="w-1/2 h-full absolute right-0 top-0">
                <EditableImage 
                    src={slide.after_image_url || imageUrls[slide.after_image_prompt] || ''} 
                    alt="After" 
                    className="w-full h-full"
                    onUpdate={(newUrl) => onUpdate(`after_image_url`, newUrl)}
                />
                <div className={`absolute inset-0 ${overlayClassAfter}`}></div>
                <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 text-[10px] rounded font-black tracking-widest z-10">AFTER</div>
            </div>
            <div className="relative z-20 flex-grow flex flex-col justify-between p-8 pb-4">
                <div style={titleAnimation} className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-2xl mx-auto mb-4">
                    <Editable as="h2" value={slide.title} className="text-xl md:text-2xl font-extrabold tracking-tighter break-words leading-tight" onUpdate={v => onUpdate('title', v)} />
                    <Editable as="p" value={slide.site_rationale} onUpdate={v => onUpdate('site_rationale', v)} className="text-[9px] md:text-[10px] text-white/70 mt-1 italic" />
                </div>
                <div className="grid grid-cols-3 gap-4 w-full max-w-4xl mx-auto mb-4">
                    {ensureArray(slide.metrics).map((metric, i) => {
                        const metricAnimation = getAnimationStyles(isActive, 400 + i * 150, 'fade-in-up', disableAnimations);
                        return (
                            <div key={i} className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-4 flex flex-col items-center justify-center text-center shadow-2xl transition-transform hover:scale-105" style={metricAnimation}>
                                <MetricValueDisplay
                                    value={metric.value}
                                    isActive={isActive}
                                    numberClass="text-xl md:text-2xl font-black text-white"
                                    suffixClass="text-sm text-white/80"
                                    disableAnimations={disableAnimations}
                                />
                                <Editable as="p" value={metric.label} onUpdate={v => onUpdate(`metrics[${i}].label`, v)} className="text-[7px] text-white/50 uppercase tracking-[0.2em] font-bold mt-1" />
                            </div>
                        )
                    })}
                </div>
                 <div style={conclusionAnimation} className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 max-w-3xl mx-auto">
                    <Editable as="p" value={slide.conclusion} onUpdate={v => onUpdate('conclusion', v)} className="text-sm md:text-base font-bold text-[var(--color-accent-light)] leading-snug" useMarkdown />
                </div>
            </div>
        </SlideWrapper>
    );
};

const ReferencesSlideLayout: React.FC<{ slide: ReferencesSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const sourcesAnimation = getAnimationStyles(isActive, 400, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper className="p-12 pb-28 flex flex-col">
            <EditableImage 
                src={slide.image_url || imageUrls['references_image'] || ''} 
                alt="References background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || 'Strategic References'} className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-6 text-[var(--color-accent-light)]" onUpdate={v => onUpdate('title', v)} /></div>
            <div className="relative z-20 flex-grow pr-4 pb-4" style={sourcesAnimation}>
                <div className="grid grid-cols-2 gap-4">
                    {ensureArray(slide.sources).map((source, i) => (
                        <div key={i} className="bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10 hover:bg-white/10 transition-all group">
                            <div className="flex items-start justify-between mb-1">
                                <div className="flex-grow">
                                    <Editable as="p" value={source.title} onUpdate={v => onUpdate(`sources[${i}].title`, v)} className="text-sm font-bold text-gray-100 group-hover:text-[var(--color-primary-medium)] transition-colors" />
                                    <div className="flex items-center space-x-3 mt-0.5">
                                        <Editable as="span" value={source.author} onUpdate={v => onUpdate(`sources[${i}].author`, v)} className="text-[9px] text-white/40" />
                                        <span className="text-white/20">•</span>
                                        <Editable as="span" value={source.year} onUpdate={v => onUpdate(`sources[${i}].year`, v)} className="text-[9px] text-white/40" />
                                    </div>
                                </div>
                                {source.link && (
                                    <a href={source.link} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white/5 rounded-full hover:bg-[var(--color-primary-medium)]/20 text-white/40 hover:text-[var(--color-primary-medium)] transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                            <div className="mt-1 pl-3 border-l-2 border-[var(--color-primary-medium)]/30">
                                <p className="text-[8px] uppercase tracking-widest text-white/40 mb-0.5">Strategic Relevance</p>
                                <Editable as="p" value={source.relevance} onUpdate={v => onUpdate(`sources[${i}].relevance`, v)} className="text-[10px] text-white/70 italic leading-tight" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </SlideWrapper>
    );
};

const ScenarioComparisonSlideLayout: React.FC<{ slide: ScenarioComparisonSlide, onUpdate: (field: string, val: string | {name: string, outcomes: {metric: string, value: string}[], risk: string, cost: string}[]) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper className="p-12 pb-28 flex flex-col">
            <EditableImage 
                src={slide.image_url || imageUrls['scenario_image'] || ''} 
                alt="Scenario background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || "Scenario Comparison"} onUpdate={v => onUpdate('title', v)} className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-6 text-[var(--color-accent-light)]" /></div>
            <div className="relative z-20 flex-grow grid grid-cols-3 gap-6 pr-2">
                {ensureArray(slide.scenarios).map((scenario, i) => {
                    const scenarioAnimation = getAnimationStyles(isActive, 350 + i * 150, 'scale-in', disableAnimations);
                    return (
                        <div key={i} className="bg-white/5 p-4 rounded-lg border border-white/10 flex flex-col transition-all duration-300 hover:bg-white/10 hover:border-white/20" style={scenarioAnimation}>
                            <Editable as="h3" value={scenario.name} onUpdate={v => onUpdate(`scenarios[${i}].name`, v)} className="font-bold text-base md:text-lg text-white text-center" />
                            <div className="my-3 border-t border-white/10">
                                {ensureArray(scenario.outcomes).map((outcome, j) => (
                                     <div key={j} className="flex justify-between items-center py-1.5 border-b border-white/10 text-[9px] md:text-[10px]">
                                        <Editable as="span" value={outcome.metric} onUpdate={v => onUpdate(`scenarios[${i}].outcomes[${j}].metric`, v)} className="text-white/70" />
                                        <Editable as="span" value={outcome.value} onUpdate={v => onUpdate(`scenarios[${i}].outcomes[${j}].value`, v)} className="font-bold text-white" />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-auto space-y-1.5 text-[9px]">
                                 <p className="font-bold text-white/50">RISK</p>
                                <Editable as="p" value={scenario.risk} onUpdate={v => onUpdate(`scenarios[${i}].risk`, v)} className="text-white/80 leading-tight" />
                                <p className="font-bold text-white/50 mt-1.5">COST</p>
                                <Editable as="p" value={scenario.cost} onUpdate={v => onUpdate(`scenarios[${i}].cost`, v)} className="font-extrabold text-base text-[var(--color-accent-light)]" />
                            </div>
                        </div>
                    )
                })}
            </div>
        </SlideWrapper>
    );
};

const RiskAssessmentSlideLayout: React.FC<{ slide: RiskAssessmentSlide, onUpdate: (field: string, val: string | {category: string, description: string, mitigation: string}[]) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper className="p-12 pb-28 flex flex-col">
            <EditableImage 
                src={slide.image_url || imageUrls['risk_image'] || ''} 
                alt="Risk background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || "Risk Assessment"} onUpdate={v => onUpdate('title', v)} className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-6 text-[var(--color-accent-light)]" /></div>
            <div className="relative z-20 flex-grow space-y-3 pr-2">
                {ensureArray(slide.risks).map((risk, i) => {
                    const riskAnimation = getAnimationStyles(isActive, 350 + i * 100, 'fade-in-up', disableAnimations);
                    return (
                        <div key={i} className="bg-white/5 p-3 rounded-lg grid grid-cols-3 gap-4 items-start transition-all duration-200 hover:bg-white/10 border border-white/5" style={riskAnimation}>
                            <Editable as="p" value={risk.category} onUpdate={v => onUpdate(`risks[${i}].category`, v)} className="font-bold text-[10px] md:text-xs text-[var(--color-accent-light)] uppercase tracking-wider" />
                            <div>
                                <p className="text-[9px] font-bold text-white/50 mb-0.5">Description</p>
                                <Editable as="p" value={risk.description} onUpdate={v => onUpdate(`risks[${i}].description`, v)} className="text-[10px] md:text-xs text-white/80 leading-snug" />
                            </div>
                             <div>
                                <p className="text-[9px] font-bold text-white/50 mb-0.5">Mitigation</p>
                                <Editable as="p" value={risk.mitigation} onUpdate={v => onUpdate(`risks[${i}].mitigation`, v)} className="text-[10px] md:text-xs text-white/80 leading-snug" />
                            </div>
                        </div>
                    )
                })}
            </div>
        </SlideWrapper>
    );
};

const RoadmapSlideLayout: React.FC<{ slide: RoadmapSlide, onUpdate: (field: string, val: string | {title: string, timeline: string, action_steps: {action: string, kpi: string}[], outcome: string}[]) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper className="p-12 pb-28 flex flex-col">
            <EditableImage 
                src={slide.image_url || imageUrls['roadmap_image'] || ''} 
                alt="Roadmap background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || "Implementation Doctrine"} className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-6 text-[var(--color-accent-light)]" onUpdate={v => onUpdate('title', v)} /></div>
            <div className="relative z-20 flex justify-between items-stretch gap-6 flex-grow min-h-0">
                {ensureArray(slide.phases).map((phase, i) => {
                    const phaseAnimation = getAnimationStyles(isActive, 350 + i * 150, 'scale-in', disableAnimations);
                    return (
                        <div key={i} className="w-1/3 bg-black/40 backdrop-blur-md p-5 rounded-xl border border-white/10 flex flex-col flex-1 min-h-0" style={phaseAnimation}>
                            <div className="flex items-center mb-3 flex-shrink-0">
                                <div className="w-7 h-7 bg-[var(--color-primary-medium)] text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">{String(i + 1).padStart(2, '0')}</div>
                                <div>
                                    <Editable as="h3" value={phase.title} onUpdate={v => onUpdate(`phases[${i}].title`, v)} className="font-extrabold text-base text-white" />
                                    <Editable as="p" value={phase.timeline} onUpdate={v => onUpdate(`phases[${i}].timeline`, v)} className="text-[9px] text-white/50 font-semibold uppercase" />
                                </div>
                            </div>
                            <div className="flex-grow min-h-0 pr-2">
                                <p className="text-[9px] font-semibold mt-2 text-white/60 uppercase tracking-wider">Action Steps & KPIs:</p>
                                <ul className="text-[10px] space-y-2 mt-1.5 text-white/80">
                                    {ensureArray(phase.action_steps).map((step, j) => (
                                        <li key={j} className="text-[10px]">
                                            <Editable as="span" value={step.action} onUpdate={v => onUpdate(`phases[${i}].action_steps[${j}].action`, v)} />
                                            <div className="flex items-center mt-0.5">
                                                <span className="text-[9px] font-bold text-blue-400/80 mr-2">KPI:</span>
                                                <Editable as="span" value={step.kpi} onUpdate={v => onUpdate(`phases[${i}].action_steps[${j}].kpi`, v)} className="text-[9px] text-white/60 italic" />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-auto pt-3 border-t border-white/10 flex-shrink-0">
                                <p className="font-bold text-[9px] text-[var(--color-primary-medium)] uppercase tracking-wider">Outcome</p>
                                <Editable as="p" value={phase.outcome} onUpdate={v => onUpdate('phases[' + i + '].outcome', v)} className="text-[10px] text-white font-semibold leading-tight" />
                            </div>
                        </div>
                    )
                })}
            </div>
        </SlideWrapper>
    );
};

const GanttChartRoadmapSlideLayout: React.FC<{ slide: GanttChartRoadmapSlide, onUpdate: (field: string, val: string | number | {name: string, start_quarter: string, end_quarter: string, kpi: string}[]) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
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
            <SlideWrapper className="p-12 items-center justify-center text-white/50">
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
        if (typeof quarterStr !== 'string') return -1;
        const qMatch = quarterStr.match(/Q([1-4])/i);
        const yMatch = quarterStr.match(/\d{4}/);
        if (!qMatch || !yMatch) return -1;
        const quarterIndex = parseInt(qMatch[1]) - 1;
        const yearInt = parseInt(yMatch[0]);
        const yearIndex = yearInt - startYear;
        if (yearIndex < 0) return -1;
        return yearIndex * 4 + quarterIndex;
    };

    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const yearHeaderAnimation = getAnimationStyles(isActive, 300, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper className="p-10 pb-28 flex flex-col">
            <EditableImage 
                src={slide.image_url || imageUrls['gantt_image'] || ''} 
                alt="Gantt background" 
                className="absolute inset-0 w-full h-full z-0 opacity-20"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20 flex flex-col h-full overflow-hidden">
                <div style={titleAnimation} className="flex items-baseline justify-between mb-4">
                    <Editable as="h1" value={slide.title} onUpdate={v => onUpdate('title', v)} className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-accent-light)]" />
                    <div className="flex items-center space-x-2 text-white/40 text-[10px] font-mono bg-white/5 px-3 py-1 rounded-full">
                        <Editable value={String(startYear)} onUpdate={v => onUpdate('timeline_start_year', parseInt(v) || startYear)} className="hover:text-white transition-colors" />
                        <span className="opacity-30">&mdash;</span>
                        <Editable value={String(endYear)} onUpdate={v => onUpdate('timeline_end_year', parseInt(v) || endYear)} className="hover:text-white transition-colors" />
                    </div>
                </div>
                
                <div className="flex-grow flex flex-col min-h-0 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                    {/* Timeline Header */}
                    <div className="flex pl-[30%] border-b border-white/10 flex-shrink-0">
                        <div className="w-full grid" style={{ gridTemplateColumns: `repeat(${years.length}, 1fr)` }}>
                            {years.map(year => (
                                <div key={year} className="text-center border-r border-white/10 last:border-0" style={yearHeaderAnimation}>
                                    <p className="font-bold text-white/60 text-[10px] py-1 bg-white/5 uppercase tracking-widest">{year}</p>
                                    <div className="grid grid-cols-4">
                                        {[1, 2, 3, 4].map(q => (
                                            <div key={q} className="text-[8px] text-white/30 py-0.5 border-r border-white/5 last:border-0">Q{q}</div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chart Body */}
                    <div className="flex-grow pr-2 pb-4">
                        <div className="relative min-h-full flex flex-col">
                            {/* Vertical grid lines */}
                            <div className="absolute top-0 left-[30%] w-[70%] h-full grid" style={{ gridTemplateColumns: `repeat(${totalQuarters}, 1fr)` }}>
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
                                            const deliverableAnimation = getAnimationStyles(isActive, 400 + (pIndex * (phase.deliverables.length) + dIndex) * 50, 'fade-in-up', disableAnimations);
            
                                            return (
                                                <div key={`${pIndex}-${dIndex}`} className="flex items-center h-8 relative group" style={deliverableAnimation}>
                                                    <div className="w-[30%] flex-shrink-0 pr-4 text-right">
                                                        <Editable as="p" value={d.name} onUpdate={v => onUpdate(`${deliverablePath}.name`, v)} className="text-[9px] font-semibold text-white/90 truncate" />
                                                        <div className="text-[7px] text-white/50 italic truncate flex justify-end items-center">
                                                            <span className="mr-1">KPI:</span>
                                                            <Editable as="span" value={d.kpi} onUpdate={v => onUpdate(`${deliverablePath}.kpi`, v)} />
                                                        </div>
                                                    </div>
                                                    <div className="absolute h-3 transition-all duration-300 group-hover:h-4" style={{ 
                                                        left: `calc(30% + ${(startIndex / totalQuarters) * 70}%)`, 
                                                        width: `calc(${(duration / totalQuarters) * 70}%)`, 
                                                        top: '50%', 
                                                        transform: 'translateY(-50%)' 
                                                    }}>
                                                        <div className="h-full bg-[var(--color-primary-medium)] rounded-sm flex items-center justify-end px-1.5 shadow-lg transition-all duration-300 group-hover:brightness-125"
                                                             style={{ background: 'linear-gradient(90deg, #456882, #60829d)' }}
                                                        >
                                                            <div className="w-1 h-1 bg-white/80 rounded-full shadow-sm"></div>
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

const ProjectedImpactSlideLayout: React.FC<{ slide: ProjectedImpactSlide, onUpdate: (field: string, val: string | {label: string, baseline: string, projected: string, timeframe: string, assumption: string}[]) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const subtitleAnimation = getAnimationStyles(isActive, 350, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper className="p-12 pb-28 flex flex-col items-center text-center">
            <EditableImage 
                src={slide.image_url || imageUrls['impact_image'] || ''} 
                alt="Impact background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}>
                <Editable as="h1" value={slide.title || 'Projected Impact'} onUpdate={v => onUpdate('title', v)} className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-2 text-[var(--color-accent-light)]" />
            </div>
            <div className="relative z-20" style={subtitleAnimation}>
                <Editable as="p" value={slide.subtitle || "The quantified outcomes of the doctrine."} onUpdate={v => onUpdate('subtitle', v)} className="text-sm md:text-base text-white/60 mb-8 max-w-3xl mx-auto" />
            </div>
            <div className="relative z-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl pr-2 pb-4">
                {(slide.metrics || []).map((metric, i) => {
                    const baselineMatch = (metric.baseline || '').match(/(.*?)\s*\((.*)\)/);
                    const baselineValue = baselineMatch ? baselineMatch[1].trim() : metric.baseline;
                    const baselineDescription = baselineMatch ? `(${baselineMatch[2]})` : null;

                    const projectedMatch = (metric.projected || '').match(/(.*?)\s*\((.*)\)/);
                    const projectedValue = projectedMatch ? projectedMatch[1].trim() : metric.projected;
                    const projectedDescription = projectedMatch ? `(${projectedMatch[2]})` : null;
                    const metricAnimation = getAnimationStyles(isActive, 500 + i * 150, 'scale-in', disableAnimations);
                    
                    return (
                        <div key={i} className="bg-black/40 backdrop-blur-md p-5 rounded-lg border border-white/10 flex flex-col text-left" style={metricAnimation}>
                            <Editable as="p" value={metric.label} onUpdate={v => onUpdate(`metrics[${i}].label`, v)} className="text-sm font-bold text-[var(--color-accent-light)] mb-3 h-10 overflow-hidden" />
                            
                            <div className="flex-grow grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-3">
                                <div className="text-center">
                                    <p className="text-[9px] text-white/50 uppercase tracking-widest">Baseline</p>
                                    <MetricValueDisplay
                                        value={baselineValue}
                                        isActive={isActive}
                                        numberClass="text-xl text-white/70"
                                        suffixClass="text-base" 
                                        disableAnimations={disableAnimations}
                                    />
                                    {baselineDescription && <p className="text-[10px] font-bold text-white/70 mt-0.5">{baselineDescription}</p>}
                                </div>
                                <div className="text-lg text-[var(--color-primary-medium)] font-light">&rarr;</div>
                                <div className="text-center">
                                    <p className="text-[9px] text-[var(--color-primary-medium)] uppercase font-bold tracking-widest">Projected</p>
                                    <MetricValueDisplay 
                                        value={projectedValue}
                                        isActive={isActive}
                                        numberClass="text-2xl text-[var(--color-accent-cream)]"
                                        suffixClass="text-lg"
                                        disableAnimations={disableAnimations}
                                    />
                                    {projectedDescription && <p className="text-[10px] font-bold text-white/80 mt-0.5">{projectedDescription}</p>}
                                </div>
                            </div>

                            <div className="text-[9px] text-white/60 mt-auto border-t border-white/10 pt-3 space-y-0.5">
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

const FiscalFrameworkSlideLayout: React.FC<{ slide: FiscalFrameworkSlide, onUpdate: (field: string, val: string | {component: string, capex: string, opex: string, funding_source: string, recovery_mechanism: string}[]) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper className="p-12 pb-28 flex flex-col">
            <EditableImage 
                src={slide.image_url || imageUrls['fiscal_image'] || ''} 
                alt="Fiscal background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || "Fiscal Framework"} onUpdate={v => onUpdate('title', v)} className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-6 text-[var(--color-accent-light)]" /></div>
            <div className="relative z-20 flex-grow bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-1 pr-2 flex flex-col">
                <div className="grid grid-cols-5 text-[9px] font-bold text-white/60 uppercase p-3 border-b border-white/10 tracking-wider flex-shrink-0">
                    <span>Component</span>
                    <span className="text-center">CapEx</span>
                    <span className="text-center">OpEx</span>
                    <span>Funding Source</span>
                    <span>Recovery Mechanism</span>
                </div>
                <div className="divide-y divide-white/10">
                    {(slide.cost_items || []).length > 0 ? (slide.cost_items || []).map((item, i) => {
                        const itemAnimation = getAnimationStyles(isActive, 350 + i * 100, 'fade-in-up', disableAnimations);
                        return (
                            <div key={i} className="grid grid-cols-5 gap-4 p-3 items-center text-[10px] md:text-xs transition-all duration-200 hover:bg-white/10" style={itemAnimation}>
                                <Editable as="p" value={item.component} onUpdate={v => onUpdate(`cost_items[${i}].component`, v)} className="font-semibold text-white" />
                                <Editable as="p" value={item.capex} onUpdate={v => onUpdate(`cost_items[${i}].capex`, v)} className="text-center text-white/80" />
                                <Editable as="p" value={item.opex} onUpdate={v => onUpdate(`cost_items[${i}].opex`, v)} className="text-center text-white/80" />
                                <Editable as="p" value={item.funding_source} onUpdate={v => onUpdate(`cost_items[${i}].funding_source`, v)} className="text-white/80 text-[9px]" />
                                <Editable as="p" value={item.recovery_mechanism} onUpdate={v => onUpdate(`cost_items[${i}].recovery_mechanism`, v)} className="text-white/80 text-[9px]" />
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

const PolicyLeversSlideLayout: React.FC<{ slide: PolicyLeversSlide, onUpdate: (field: string, val: string | {title: string, strategy: string, expected_impact: string, measurement_framework: string}[]) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper className="p-12 pb-28 flex flex-col">
            <EditableImage 
                src={slide.image_url || imageUrls['policy_image'] || ''} 
                alt="Policy background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || "Required Policy Levers"} className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-6 text-[var(--color-accent-light)]" onUpdate={v => onUpdate('title', v)} /></div>
            <div className="relative z-20 space-y-4 flex-grow pr-4 pb-4">
                {(slide.recommendations || []).length > 0 ? (slide.recommendations || []).map((rec, i) => {
                    const recommendationAnimation = getAnimationStyles(isActive, 350 + i * 150, 'fade-in-up', disableAnimations);
                    return (
                        <div key={i} className="bg-black/40 backdrop-blur-md p-5 rounded-lg border border-white/10" style={recommendationAnimation}>
                            <Editable as="h3" value={rec.title} onUpdate={v => onUpdate(`recommendations[${i}].title`, v)} className="font-bold text-base text-white mb-3" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <div>
                                    <p className="text-[9px] font-bold uppercase text-white/50 mb-1.5">Strategy & Impact</p>
                                    <Editable as="p" value={rec.strategy} onUpdate={v => onUpdate(`recommendations[${i}].strategy`, v)} className="text-[10px] mb-1.5 text-white/80" useMarkdown />
                                    <Editable as="p" value={rec.expected_impact} onUpdate={v => onUpdate(`recommendations[${i}].expected_impact`, v)} className="text-[10px] font-semibold text-white" useMarkdown />
                                </div>
                                <div>
                                     <p className="text-[9px] font-bold uppercase text-white/50 mb-1.5">Measurement Framework</p>
                                    <Editable as="p" value={rec.measurement_framework} onUpdate={v => onUpdate(`recommendations[${i}].measurement_framework`, v)} className="text-[10px] text-white/80" />
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

const GovernanceFrameworkSlideLayout: React.FC<{ slide: GovernanceFrameworkSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);
    const leadAgencyAnimation = getAnimationStyles(isActive, 350, 'fade-in-up', disableAnimations);
    const fundingModelAnimation = getAnimationStyles(isActive, 500, 'fade-in-up', disableAnimations);
    const regulatoryChangesAnimation = getAnimationStyles(isActive, 650, 'fade-in-up', disableAnimations);
    const stakeholderRolesAnimation = getAnimationStyles(isActive, 350, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper className="p-12 pb-28 flex flex-col">
            <EditableImage 
                src={slide.image_url || imageUrls['governance_image'] || ''} 
                alt="Governance background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}><Editable as="h1" value={slide.title || "Governance Framework"} onUpdate={v => onUpdate('title', v)} className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-6 text-[var(--color-accent-light)]" /></div>
            <div className="relative z-20 flex-grow grid grid-cols-2 gap-8 min-h-0">
                <div className="space-y-3 pr-2">
                    <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10" style={leadAgencyAnimation}>
                        <h3 className="font-bold text-sm text-[var(--color-accent-light)] mb-1.5">Lead Agency</h3>
                        <Editable as="p" value={slide.lead_agency?.name} onUpdate={v => onUpdate('lead_agency.name', v)} className="text-xs font-semibold text-white" />
                        <Editable as="p" value={slide.lead_agency?.rationale} onUpdate={v => onUpdate('lead_agency.rationale', v)} className="text-[9px] text-white/70 mt-0.5" />
                    </div>
                     <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10" style={fundingModelAnimation}>
                        <h3 className="font-bold text-sm text-[var(--color-accent-light)] mb-1.5">Funding Model</h3>
                        <Editable as="p" value={slide.funding_model} onUpdate={v => onUpdate('funding_model', v)} className="text-[10px] text-white" />
                    </div>
                     <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10" style={regulatoryChangesAnimation}>
                        <h3 className="font-bold text-sm text-[var(--color-accent-light)] mb-1.5">Regulatory Changes</h3>
                         <ul className="list-disc list-inside space-y-0.5 text-[10px] text-white/90">
                            {(slide.regulatory_changes || []).length > 0 ? (slide.regulatory_changes || []).map((change, i) => <li key={i}><Editable as="span" value={change} onUpdate={v => onUpdate(`regulatory_changes[${i}]`, v)} /></li>) : (
                                <p className="text-white/40 italic list-none">No regulatory changes identified.</p>
                            )}
                        </ul>
                    </div>
                </div>
                 <div className="flex flex-col min-h-0">
                    <h3 className="font-bold text-sm text-[var(--color-accent-light)] mb-1.5 flex-shrink-0" style={stakeholderRolesAnimation}>Key Stakeholder Roles</h3>
                    <div className="space-y-1 pr-2 flex-grow">
                        {(slide.stakeholders || []).length > 0 ? (slide.stakeholders || []).map((s, i) => {
                            const stakeholderAnimation = getAnimationStyles(isActive, 500 + i * 75, 'fade-in-up', disableAnimations);
                            return (
                                <div key={i} className="flex items-start text-[10px] border-b border-white/10 py-1.5" style={stakeholderAnimation}>
                                    <Editable as="p" value={s.name} onUpdate={v => onUpdate(`stakeholders[${i}].name`, v)} className="w-1/3 font-semibold text-white/90" />
                                    <Editable as="p" value={s.role} onUpdate={v => onUpdate(`stakeholders[${i}].role`, v)} className="w-2/3 text-white/70" />
                                </div>
                            )
                        }) : (
                            <p className="text-white/40 italic text-sm">No stakeholder roles defined.</p>
                        )}
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const ProcessSlideLayout: React.FC<{ slide: ProcessSlide, onUpdate: (field: string, val: string | {step_number: number, title: string, description: string}[]) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean, designSystem?: DesignSystem }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations, designSystem }) => {
    const titleAnimation = getAnimationStyles(isActive, 200, 'fade-in-up', disableAnimations);

    const overlayClass = designSystem?.is_light_background ? "bg-white/10" : "bg-black/80";

    return (
        <SlideWrapper className="p-12 pb-28 flex flex-col">
            <EditableImage 
                src={slide.image_url || imageUrls['process_image'] || ''} 
                alt="Process background" 
                className="absolute inset-0 w-full h-full z-0"
                onUpdate={(newUrl) => onUpdate('image_url', newUrl)}
            />
            <div className={`absolute inset-0 ${overlayClass} z-10 pointer-events-none`}></div>
            <div className="relative z-20" style={titleAnimation}>
                <Editable as="h1" value={slide.title} onUpdate={v => onUpdate('title', v)} className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-2 text-[var(--color-accent-light)]" />
                <Editable as="p" value={slide.subtitle} onUpdate={v => onUpdate('subtitle', v)} className="text-sm md:text-base text-white/60 mb-8" />
            </div>
            <div className="relative z-20 flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pr-2 pb-4">
                {(slide.steps || []).map((step, i) => {
                    const stepAnimation = getAnimationStyles(isActive, 350 + i * 150, 'fade-in-up', disableAnimations);
                    return (
                        <div key={i} className="relative bg-black/40 backdrop-blur-md p-5 rounded-lg border border-white/10 flex flex-col min-h-[160px]" style={stepAnimation}>
                            <div className="absolute -top-3 -left-3 w-7 h-7 bg-[var(--color-primary-medium)] rounded-full flex items-center justify-center text-white font-bold shadow-lg text-xs">
                                {step.step_number || i + 1}
                            </div>
                            <Editable as="h3" value={step.title} onUpdate={v => onUpdate(`steps[${i}].title`, v)} className="font-bold text-sm md:text-base text-white mb-1.5 mt-1" />
                            <Editable as="p" value={step.description} onUpdate={v => onUpdate(`steps[${i}].description`, v)} className="text-[10px] md:text-xs text-white/70 leading-relaxed" />
                        </div>
                    )
                })}
            </div>
        </SlideWrapper>
    );
};

const ClosingSlideLayout: React.FC<{ slide: ClosingSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean, disableAnimations?: boolean }> = ({ slide, onUpdate, imageUrls, isActive, disableAnimations }) => {
    const taglineAnimation = getAnimationStyles(isActive, 300, 'fade-in-up', disableAnimations);
    const lineAnimation = getAnimationStyles(isActive, 600, 'scale-in', disableAnimations);
    const creditsAnimation = getAnimationStyles(isActive, 900, 'fade-in-up', disableAnimations);

    return (
        <SlideWrapper className="p-0 overflow-hidden">
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
                <div className="w-1/2 p-12 flex flex-col justify-center text-right relative z-20">
                    <div style={taglineAnimation}>
                        <Editable as="h2" value={slide.tagline} onUpdate={v => onUpdate('tagline', v)} className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tighter text-white" />
                    </div>
                    <div style={lineAnimation}>
                        <div className="w-16 h-1 bg-[var(--color-primary-medium)] my-6 ml-auto"></div>
                    </div>
                    <div style={creditsAnimation}>
                        <Editable as="p" value={slide.credits} onUpdate={v => onUpdate('credits', v)} className="text-sm md:text-base text-white/60" />
                    </div>
                    <div className="mt-12 flex justify-end">
                        <TanmyaaLogoPPTX className="h-8 opacity-50" />
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
}

const UrbanStudySlide: React.FC<{ slide: PresentationSlide | null | undefined; imageUrls?: Record<string, string>; onUpdate: (field: string, val: string | unknown) => void, slideNumber: number, isActive: boolean, disableAnimations?: boolean, globalBgSvg?: string, designSystem?: DesignSystem }> = ({ slide, imageUrls, onUpdate, slideNumber, isActive, disableAnimations, globalBgSvg, designSystem }) => {
  if (!slide) {
    return (
        <div className="w-full h-full bg-[var(--color-primary-dark)] flex items-center justify-center text-white/40 italic">
            Invalid slide data.
        </div>
    );
  }

  const renderLayout = () => {
    const props = { onUpdate, imageUrls: imageUrls || {}, isActive, disableAnimations, designSystem };
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
        <SlideWrapper className="p-16 bg-white text-gray-800">
            <h2 className="text-5xl font-extrabold text-[var(--color-primary-dark)] tracking-tighter mb-8">{slide.layout.replace(/([A-Z])/g, ' $1').trim()}</h2>
            <pre className="text-xs bg-gray-100 p-4 rounded-lg">{JSON.stringify(slide, null, 2)}</pre>
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

  const themeClass = designSystem?.is_light_background ? 'theme-light' : '';
  const alignClass = designSystem?.text_alignment ? `force-align-${designSystem.text_alignment}` : '';

  const reflectionAnimation = getAnimationStyles(isActive, 1000, 'fade-in-up', disableAnimations);
  const hasReflection = slide && 'analytic_reflection' in slide && slide.analytic_reflection;

  return (
    <div id={`slide-container-${slideNumber}`} className={`w-full h-full bg-[var(--color-primary-dark)] relative ${themeClass} ${alignClass}`} style={bgStyle}>
        {designSystem && (
            <style>{`
                #slide-container-${slideNumber} h1, 
                #slide-container-${slideNumber} h2, 
                #slide-container-${slideNumber} h3, 
                #slide-container-${slideNumber} p, 
                #slide-container-${slideNumber} span, 
                #slide-container-${slideNumber} div, 
                #slide-container-${slideNumber} li {
                    ${designSystem.text_color_primary ? `color: ${designSystem.text_color_primary.startsWith('#') ? designSystem.text_color_primary : '#' + designSystem.text_color_primary} !important;` : ''}
                }
                #slide-container-${slideNumber} .text-white\\/60, 
                #slide-container-${slideNumber} .text-white\\/70, 
                #slide-container-${slideNumber} .text-white\\/50,
                #slide-container-${slideNumber} .text-white\\/40,
                #slide-container-${slideNumber} .text-white\\/30,
                #slide-container-${slideNumber} .text-white\\/80,
                #slide-container-${slideNumber} .text-white\\/90 {
                    ${designSystem.text_color_secondary ? `color: ${designSystem.text_color_secondary.startsWith('#') ? designSystem.text_color_secondary : '#' + designSystem.text_color_secondary} !important;` : ''}
                }
            `}</style>
        )}
        <div className="absolute bottom-6 left-12 text-xs font-bold text-white/30 z-30 slide-footer-text">
            SLIDE {String(slideNumber).padStart(2, '0')}
        </div>
        <div className="absolute bottom-4 right-12 z-30 opacity-20 slide-footer-logo">
            <TanmyaaLogoPPTX className={designSystem?.is_light_background ? "!text-black" : "!text-white"} />
        </div>
        {renderLayout()}
        {hasReflection && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4">
                <AnalyticReflection 
                    text={(slide as { analytic_reflection?: string }).analytic_reflection || ''} 
                    onUpdate={v => onUpdate('analytic_reflection', v)} 
                    animationStyle={reflectionAnimation} 
                    disableAnimations={disableAnimations} 
                />
            </div>
        )}
    </div>
);
};

export default UrbanStudySlide;