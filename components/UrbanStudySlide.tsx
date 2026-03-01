import React, { CSSProperties, useEffect, useState } from 'react';
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
    ClosingSlide,
 } from '../types';

const getAnimationStyles = (isActive: boolean, delay: number, type: 'fade-in-up' | 'scale-in' = 'fade-in-up') => {
    if (!isActive) return { opacity: 0 };
    return {
        opacity: 0,
        animation: `${type} 0.7s cubic-bezier(0.3, 0, 0.2, 1) forwards`,
        animationDelay: `${delay}ms`,
    };
};

const useCountUp = (end: number, duration: number, isActive: boolean, start: number = 0) => {
    const [count, setCount] = useState(start);
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);

    useEffect(() => {
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
    }, [end, start, duration, isActive, totalFrames, frameRate]);

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

const AnimatedNumber: React.FC<{ value: string; isActive: boolean, duration?: number }> = ({ value, isActive, duration = 1500 }) => {
    const { number, prefix, suffix, precision } = parseNumericValue(value);
    const count = useCountUp(number, duration, isActive);
    
    return <span>{prefix}{count.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })}{suffix}</span>;
};


// Fix: Added 'style' prop to allow inline styling for components like Gantt charts that need specific backgrounds.
const SlideWrapper: React.FC<{ children: React.ReactNode, className?: string, style?: CSSProperties }> = ({ children, className = '', style }) => (
    <div className={`w-full h-full text-[var(--color-accent-cream)] flex flex-col overflow-hidden relative font-sans ${className}`} style={style}>
        {children}
    </div>
);

const renderWithBold = (text: string) => {
    if (!text) return text;
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => 
        index % 2 === 1 ? <strong key={index} className="font-bold">{part}</strong> : part
    );
};

const Editable: React.FC<{
  as?: React.ElementType;
  value: string;
  onUpdate: (newValue: string) => void;
  className?: string;
  useMarkdown?: boolean;
}> = ({ as: Component = 'p', value, onUpdate, className, useMarkdown }) => {
  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const newValue = e.currentTarget.innerText;
    if (newValue !== value) {
      onUpdate(newValue);
    }
  };
  
  const content = useMarkdown ? renderWithBold(value) : value;

  return (
    <Component
      contentEditable={!useMarkdown}
      suppressContentEditableWarning
      onBlur={handleBlur}
      className={`outline-none focus:ring-2 focus:ring-[var(--color-primary-medium)] focus:bg-white/10 rounded-sm p-1 -m-1 transition-all break-words ${className}`}
      dangerouslySetInnerHTML={useMarkdown ? undefined : { __html: value }}
    >
      {useMarkdown ? content : null}
    </Component>
  );
};

const AnalyticReflection: React.FC<{ text: string, onUpdate: (newValue: string) => void, animationStyle: CSSProperties }> = ({ text, onUpdate, animationStyle }) => (
    <div className="mt-auto text-center text-white/70 p-4 bg-white/5 rounded-lg" style={animationStyle}>
        <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">Analytic Reflection</h4>
        <Editable as="p" value={text} onUpdate={onUpdate} className="italic text-sm" />
    </div>
);


// --- REDESIGNED DOCTRINE-STYLE LAYOUTS ---

const CoverSlideLayout: React.FC<{ slide: CoverSlide, onUpdate: (field: string, val: string) => void, imageUrls: Record<string, string>, isActive: boolean }> = ({ slide, onUpdate, imageUrls, isActive }) => {
    const titleAnimation = getAnimationStyles(isActive, 200);
    const lineAnimation = getAnimationStyles(isActive, 400, 'scale-in');
    const subtitleAnimation = getAnimationStyles(isActive, 500);

    return (
    <SlideWrapper className="justify-center p-16 text-center">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <img src={imageUrls['cover_image'] || ''} className="absolute inset-0 w-full h-full object-cover" alt="Cover background"/>
        <div className="relative z-20">
            <div style={titleAnimation}>
                <Editable as="h1" value={slide.title} onUpdate={v => onUpdate('title', v)} className="text-[6rem] font-extrabold tracking-tighter leading-none" />
            </div>
            <div style={lineAnimation}>
                <div className="w-20 h-1.5 bg-[var(--color-primary-medium)] my-8 mx-auto"></div>
            </div>
            <div style={subtitleAnimation}>
                <Editable as="p" value={slide.subtitle} onUpdate={v => onUpdate('subtitle', v)} className="text-2xl text-white/80" />
            </div>
        </div>
    </SlideWrapper>
)};

const ExecutiveOverviewSlideLayout: React.FC<{ slide: ExecutiveOverviewSlide, onUpdate: (field: string, val: string | string[]) => void, isActive: boolean }> = ({ slide, onUpdate, isActive }) => {
    const titleAnimation = getAnimationStyles(isActive, 200);
    const narrativeAnimation = getAnimationStyles(isActive, 350);
    const reflectionAnimation = getAnimationStyles(isActive, 900);

    return (
        <SlideWrapper className="p-16 flex flex-col">
            <div style={titleAnimation}><Editable as="h1" value={slide.title} className="text-5xl font-extrabold tracking-tighter mb-10 text-[var(--color-accent-light)]" onUpdate={v => onUpdate('title', v)} /></div>
            <div className="grid grid-cols-2 gap-12 flex-grow min-h-0">
                <div className="flex flex-col overflow-y-auto content-scrollbar pr-4" style={narrativeAnimation}>
                    <Editable as="p" value={slide.narrative} onUpdate={v => onUpdate('narrative', v)} className="text-base leading-relaxed text-white/80" useMarkdown />
                </div>
                <div className="flex flex-col justify-center">
                    <ul className="space-y-5">
                        {(slide.key_points || []).map((point, i) => {
                            const keyPointAnimation = getAnimationStyles(isActive, 500 + i * 150);
                            return (
                                <li key={i} className="flex items-start" style={keyPointAnimation}>
                                     <div className="w-9 h-9 rounded-full bg-[var(--color-primary-medium)] text-[var(--color-accent-cream)] text-sm font-bold flex items-center justify-center mr-4 flex-shrink-0">{String(i+1).padStart(2, '0')}</div>
                                    <Editable value={point} onUpdate={v => onUpdate(`key_points[${i}]`, v)} className="text-base font-semibold pt-1" />
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
            <AnalyticReflection text={slide.analytic_reflection} onUpdate={v => onUpdate('analytic_reflection', v)} animationStyle={reflectionAnimation} />
        </SlideWrapper>
    );
};

const CrisisSlideLayout: React.FC<{ slide: CrisisSlide, onUpdate: (field: string, val: string | {label: string, value: string, description: string}[]) => void, imageUrls: Record<string, string>, isActive: boolean }> = ({ slide, onUpdate, imageUrls, isActive }) => {
    const titleAnim = getAnimationStyles(isActive, 200);
    const problemAnim = getAnimationStyles(isActive, 350);
    return (
    <SlideWrapper className="p-16 flex flex-col justify-between text-center">
        <div className="absolute inset-0 bg-black/70 z-10"></div>
        <img src={imageUrls['crisis_image'] || ''} className="absolute inset-0 w-full h-full object-cover" alt="Crisis background"/>
        <div className="relative z-20 pt-8">
            <div style={titleAnim}><Editable as="h1" value={slide.title} className="text-5xl font-extrabold tracking-tighter" onUpdate={v => onUpdate('title', v)} /></div>
            <div style={problemAnim}><Editable as="p" value={slide.problem_statement} className="text-lg text-white/70 max-w-3xl mx-auto mt-3" onUpdate={v => onUpdate('problem_statement', v)} /></div>
        </div>
        <div className="relative z-20 w-full grid grid-cols-3 gap-6 pb-8">
            {(slide.key_data_points || []).map((point, i) => (
                <div key={i} className="flex flex-col items-center" style={getAnimationStyles(isActive, 500 + i * 150)}>
                    <p className="text-7xl font-extrabold text-[var(--color-accent-cream)] leading-none">
                       {isActive ? <AnimatedNumber value={point.value} isActive={isActive} /> : point.value}
                    </p>
                    <Editable as="p" value={point.label} onUpdate={v => onUpdate(`key_data_points[${i}].label`, v)} className="text-white/70 uppercase tracking-[0.15em] font-semibold mt-2 text-sm" />
                    <Editable as="p" value={point.description} onUpdate={v => onUpdate(`key_data_points[${i}].description`, v)} className="text-white/60 text-xs mt-3 max-w-[25ch]" />
                </div>
            ))}
        </div>
    </SlideWrapper>
)};

const SWOTCategory: React.FC<{ title: string; items: { title: string; description: string }[]; onUpdate: (field: string, val: string) => void; type: 'strengths' | 'weaknesses' | 'opportunities' | 'threats'; animationStyle: CSSProperties }> = ({ title, items, onUpdate, type, animationStyle }) => (
    <div className="min-h-0" style={animationStyle}>
        <h3 className="font-bold text-lg mb-3 text-[var(--color-accent-light)] border-b border-white/20 pb-2">{title}</h3>
        <div className="space-y-4 mt-4">
            {(items || []).map((item, i) => (
                <div key={i}>
                    <Editable as="p" value={item.title} onUpdate={v => onUpdate(`${type}[${i}].title`, v)} className="font-semibold text-white text-sm" useMarkdown/>
                    <Editable as="p" value={item.description} onUpdate={v => onUpdate(`${type}[${i}].description`, v)} className="text-xs text-white/70 mt-1" />
                </div>
            ))}
        </div>
    </div>
);

const SWOTSlideLayout: React.FC<{ slide: SWOTSlide, onUpdate: (field: string, val: string) => void, isActive: boolean }> = ({ slide, onUpdate, isActive }) => {
    const titleAnimation = getAnimationStyles(isActive, 200);
    const strengthsAnimation = getAnimationStyles(isActive, 350);
    const weaknessesAnimation = getAnimationStyles(isActive, 400);
    const opportunitiesAnimation = getAnimationStyles(isActive, 500);
    const threatsAnimation = getAnimationStyles(isActive, 550);
    const reflectionAnimation = getAnimationStyles(isActive, 700);

    return (
        <SlideWrapper className="p-16 flex flex-col">
            <div style={titleAnimation}><h1 className="text-5xl font-extrabold tracking-tighter mb-8 text-[var(--color-accent-light)]">SWOT Analysis</h1></div>
            <div className="flex-grow grid grid-cols-2 gap-x-12 min-h-0">
                <div className="space-y-8 flex flex-col justify-between">
                    <SWOTCategory title="Strengths" items={slide.strengths} onUpdate={onUpdate} type="strengths" animationStyle={strengthsAnimation} />
                    <SWOTCategory title="Opportunities" items={slide.opportunities} onUpdate={onUpdate} type="opportunities" animationStyle={opportunitiesAnimation} />
                </div>
                <div className="space-y-8 flex flex-col justify-between">
                    <SWOTCategory title="Weaknesses" items={slide.weaknesses} onUpdate={onUpdate} type="weaknesses" animationStyle={weaknessesAnimation} />
                    <SWOTCategory title="Threats" items={slide.threats} onUpdate={onUpdate} type="threats" animationStyle={threatsAnimation} />
                </div>
            </div>
             <div className="mt-6 flex-shrink-0">
                <AnalyticReflection text={slide.analytic_reflection} onUpdate={v => onUpdate('analytic_reflection', v)} animationStyle={reflectionAnimation} />
            </div>
        </SlideWrapper>
    );
};

const CaseStudyDeepDiveSlideLayout: React.FC<{ slide: CaseStudyDeepDiveSlide, onUpdate: (field: string, val: string | string[]) => void, imageUrls: Record<string, string>, isActive: boolean }> = ({ slide, onUpdate, imageUrls, isActive }) => {
    const titleAnimation = getAnimationStyles(isActive, 200);
    const contentAnimation = getAnimationStyles(isActive, 350, 'scale-in');
    const reflectionAnimation = getAnimationStyles(isActive, 500);
    const sourceAnimation = getAnimationStyles(isActive, 600);

    return (
        <SlideWrapper className="p-0">
            <div className="absolute inset-0 bg-black z-0"></div>
            <img src={imageUrls[slide.image_prompt] || ''} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Case study background" />
            <div className="relative z-10 flex flex-col justify-between h-full p-16">
                <div style={titleAnimation}>
                    <Editable as="h1" value={slide.title} className="text-5xl font-extrabold tracking-tighter leading-tight max-w-3xl" onUpdate={v => onUpdate('title', v)} />
                </div>
                <div className="w-full flex justify-between items-end gap-8">
                    <div className="w-2/3 bg-black/60 backdrop-blur-md p-6 rounded-lg border border-white/10" style={contentAnimation}>
                        <Editable as="p" value={slide.introduction} onUpdate={v => onUpdate('introduction', v)} className="text-base text-white/80 mb-4" useMarkdown />
                        <div className="border-t border-[var(--color-primary-medium)] pt-4">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-white/60">Proven Application</h3>
                            <ul className="list-disc list-inside space-y-1 mt-2 text-sm text-white/90">
                                {(slide.key_findings || []).map((finding, i) => <li key={i}><Editable as="span" value={finding} onUpdate={v => onUpdate(`key_findings[${i}]`, v)} useMarkdown/></li>)}
                            </ul>
                        </div>
                        <div className="border-t border-[var(--color-primary-medium)]/50 pt-4 mt-4">
                            <Editable as="p" value={slide.conclusion} onUpdate={v => onUpdate('conclusion', v)} className="text-[var(--color-accent-light)] font-semibold text-lg" />
                        </div>
                    </div>
                    <div className="w-1/3 flex-shrink-0">
                        <AnalyticReflection text={slide.analytic_reflection} onUpdate={v => onUpdate('analytic_reflection', v)} animationStyle={reflectionAnimation} />
                        {slide.data_source && <div style={sourceAnimation}><Editable value={slide.data_source} onUpdate={v => onUpdate('data_source', v)} className="text-xs text-white/40 italic text-center mt-2" /></div>}
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const VisionSlideLayout: React.FC<{ slide: VisionSlide, onUpdate: (field: string, val: string) => void, imageUrls: Record<string, string>, isActive: boolean }> = ({ slide, onUpdate, imageUrls, isActive }) => {
    const titleAnimation = getAnimationStyles(isActive, 200);
    const statementAnimation = getAnimationStyles(isActive, 400);

    return (
        <SlideWrapper className="justify-center items-center text-center p-16">
            <div className="absolute inset-0 bg-black/75 z-10"></div>
            <img src={imageUrls[slide.image_prompt] || ''} className="absolute inset-0 w-full h-full object-cover" alt="Vision background"/>
            <div className="relative z-20">
                <div style={titleAnimation}><Editable as="h2" value={slide.title} className="text-xl font-bold text-white/50 uppercase tracking-[0.3em]" onUpdate={v => onUpdate('title', v)} /></div>
                <div style={statementAnimation}><Editable as="p" value={slide.vision_statement.replace(/\n/g, '<br/>')} onUpdate={v => onUpdate('vision_statement', v)} className="text-6xl font-extrabold my-8 max-w-5xl leading-tight tracking-tighter whitespace-pre-line" /></div>
            </div>
        </SlideWrapper>
    );
};

const MacroStrategySlideLayout: React.FC<{ slide: MacroStrategySlide, onUpdate: (field: string, val: string) => void, imageUrls: Record<string, string>, isActive: boolean }> = ({ slide, onUpdate, imageUrls, isActive }) => {
    const titleAnimation = getAnimationStyles(isActive, 200);

    return (
        <SlideWrapper className="p-16 flex flex-col justify-between">
            <div className="absolute inset-0 bg-black/70 z-10"></div>
            <img src={imageUrls[slide.image_prompt] || ''} className="absolute inset-0 w-full h-full object-cover" alt="Strategy map"/>
            <div className="relative z-20" style={titleAnimation}>
                 <Editable as="h1" value={slide.title} className="text-5xl font-extrabold tracking-tighter" onUpdate={v => onUpdate('title', v)} />
                 <Editable as="p" value={slide.strategic_intent} className="text-base text-white/70 max-w-3xl mt-2" onUpdate={v => onUpdate('strategic_intent', v)} />
            </div>
            <div className="relative z-20 grid grid-cols-3 gap-5">
                {(slide.strategies || []).map((strategy, i) => {
                    const strategyAnimation = getAnimationStyles(isActive, 400 + i * 150, 'scale-in');
                    return (
                        <div key={i} className="bg-black/50 backdrop-blur-md p-5 rounded-lg border border-white/10 flex flex-col" style={strategyAnimation}>
                            <Editable as="h3" value={strategy.title} onUpdate={v => onUpdate(`strategies[${i}].title`, v)} className="font-bold text-xl text-[var(--color-accent-light)]" />
                            <Editable as="p" value={strategy.description} onUpdate={v => onUpdate(`strategies[${i}].description`, v)} className="text-white/80 mt-2 text-sm" useMarkdown />
                            <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Rationale</p>
                                <Editable as="p" value={strategy.rationale} onUpdate={v => onUpdate(`strategies[${i}].rationale`, v)} className="text-white/70 mt-1 text-xs italic"/>
                            </div>
                        </div>
                    )
                })}
            </div>
        </SlideWrapper>
    );
};

const EquityAnalysisSlideLayout: React.FC<{ slide: EquityAnalysisSlide, onUpdate: (field: string, val: string | string[]) => void, isActive: boolean }> = ({ slide, onUpdate, isActive }) => {
    const titleAnimation = getAnimationStyles(isActive, 200);
    const impactsAnimation = getAnimationStyles(isActive, 350);
    const strategiesAnimation = getAnimationStyles(isActive, 500);
    const reflectionAnimation = getAnimationStyles(isActive, 650);

    return (
        <SlideWrapper className="p-16 flex flex-col">
            <div style={titleAnimation}><h1 className="text-5xl font-extrabold tracking-tighter mb-8 text-[var(--color-accent-light)]">{slide.title}</h1></div>
            <div className="grid grid-cols-2 gap-12 flex-grow">
                <div style={impactsAnimation}>
                    <h3 className="font-bold text-lg text-[var(--color-accent-light)] border-b border-white/20 pb-2 mb-4">Distributional Impacts</h3>
                    <div className="space-y-4">
                        {(slide.distributional_impacts || []).map((item, i) => (
                            <div key={i} className="bg-white/5 p-4 rounded-lg">
                                <Editable as="p" value={item.group} onUpdate={v => onUpdate(`distributional_impacts[${i}].group`, v)} className="font-semibold text-white text-sm" />
                                <Editable as="p" value={item.impact} onUpdate={v => onUpdate(`distributional_impacts[${i}].impact`, v)} className="text-xs text-white/70 mt-1" />
                            </div>
                        ))}
                    </div>
                </div>
                <div style={strategiesAnimation}>
                    <h3 className="font-bold text-lg text-[var(--color-accent-light)] border-b border-white/20 pb-2 mb-4">Mitigation Strategies</h3>
                     <ul className="list-disc list-inside space-y-2 mt-2 text-base text-white/90">
                        {(slide.mitigation_strategies || []).map((strat, i) => (
                            <li key={i}><Editable as="span" value={strat} onUpdate={v => onUpdate(`mitigation_strategies[${i}]`, v)} className="text-sm" /></li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="mt-6 flex-shrink-0">
                <AnalyticReflection text={slide.analytic_reflection} onUpdate={v => onUpdate('analytic_reflection', v)} animationStyle={reflectionAnimation} />
            </div>
        </SlideWrapper>
    );
};

const MetricValueDisplay: React.FC<{ value: string; isActive: boolean; numberClass: string; suffixClass: string }> = ({ value, isActive, numberClass, suffixClass }) => {
    const { number, prefix, suffix, precision } = parseNumericValue(value);
    const count = useCountUp(number, 2000, isActive);
    
    const numberPart = isActive
        ? count.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })
        : number.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision });
    
    const trimmedSuffix = suffix.trim();
        
    return (
        <p className={`font-extrabold leading-tight break-words ${numberClass}`}>
            {prefix}{numberPart}
            {trimmedSuffix && (
                <span className={suffixClass}> {trimmedSuffix}</span>
            )}
        </p>
    );
};

const NodeAssessmentSlideLayout: React.FC<{ slide: NodeAssessmentSlide, onUpdate: (field: string, val: string | {label: string, value: string}[]) => void, imageUrls: Record<string, string>, isActive: boolean }> = ({ slide, onUpdate, imageUrls, isActive }) => {
    const titleAnimation = getAnimationStyles(isActive, 200);
    const conclusionAnimation = getAnimationStyles(isActive, 850);
    const reflectionAnimation = getAnimationStyles(isActive, 1000);

    return (
        <SlideWrapper className="p-0 text-center flex flex-col">
            <div className="w-1/2 h-full absolute left-0 top-0"><img src={imageUrls[slide.before_image_prompt] || ''} className="w-full h-full object-cover" alt="Before" /><div className="absolute inset-0 bg-black/50"></div><div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 text-xs rounded font-semibold z-10">BEFORE</div></div>
            <div className="w-1/2 h-full absolute right-0 top-0"><img src={imageUrls[slide.after_image_prompt] || ''} className="w-full h-full object-cover" alt="After" /><div className="absolute inset-0 bg-black/20"></div><div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 text-xs rounded font-semibold z-10">AFTER</div></div>
            <div className="relative z-20 flex-grow flex flex-col justify-between p-12">
                <div style={titleAnimation}>
                    <Editable as="h2" value={slide.title} className="text-5xl font-extrabold tracking-tighter" onUpdate={v => onUpdate('title', v)} />
                    <Editable as="p" value={slide.site_rationale} onUpdate={v => onUpdate('site_rationale', v)} className="text-sm text-white/70 max-w-xl mx-auto mt-2 italic" />
                </div>
                <div className="grid grid-cols-3 gap-6">
                    {(slide.metrics || []).map((metric, i) => {
                        const metricAnimation = getAnimationStyles(isActive, 400 + i * 150);
                        return (
                            <div key={i} style={{...metricAnimation, textShadow: '0 2px 8px rgba(0,0,0,0.8)'}}>
                                <MetricValueDisplay
                                    value={metric.value}
                                    isActive={isActive}
                                    numberClass="text-6xl text-[var(--color-accent-cream)]"
                                    suffixClass="text-4xl"
                                />
                                <Editable as="p" value={metric.label} onUpdate={v => onUpdate(`metrics[${i}].label`, v)} className="text-sm text-white/60 uppercase tracking-widest mt-1" />
                            </div>
                        )
                    })}
                </div>
                 <div style={conclusionAnimation}><Editable as="p" value={slide.conclusion} onUpdate={v => onUpdate('conclusion', v)} className="text-xl font-bold text-[var(--color-accent-light)]" useMarkdown /></div>
            </div>
             <div className="relative z-20 px-8 pb-4 w-full max-w-2xl mx-auto">
                 <AnalyticReflection text={slide.analytic_reflection} onUpdate={v => onUpdate('analytic_reflection', v)} animationStyle={reflectionAnimation} />
            </div>
        </SlideWrapper>
    );
};

const ScenarioComparisonSlideLayout: React.FC<{ slide: ScenarioComparisonSlide, onUpdate: (field: string, val: string | {name: string, outcomes: {metric: string, value: string}[], risk: string, cost: string}[]) => void, isActive: boolean }> = ({ slide, onUpdate, isActive }) => {
    const titleAnimation = getAnimationStyles(isActive, 200);
    const reflectionAnimation = getAnimationStyles(isActive, 800);

    return (
        <SlideWrapper className="p-16 flex flex-col">
            <div style={titleAnimation}><h1 className="text-5xl font-extrabold tracking-tighter mb-8 text-[var(--color-accent-light)]">{slide.title}</h1></div>
            <div className="flex-grow grid grid-cols-3 gap-6">
                {(slide.scenarios || []).map((scenario, i) => {
                    const scenarioAnimation = getAnimationStyles(isActive, 350 + i * 150, 'scale-in');
                    return (
                        <div key={i} className="bg-white/5 p-6 rounded-lg border border-white/10 flex flex-col transition-all duration-300 hover:bg-white/10 hover:border-white/20" style={scenarioAnimation}>
                            <Editable as="h3" value={scenario.name} onUpdate={v => onUpdate(`scenarios[${i}].name`, v)} className="font-bold text-xl text-white text-center" />
                            <div className="my-4 border-t border-white/10">
                                {(scenario.outcomes || []).map((outcome, j) => (
                                     <div key={j} className="flex justify-between items-center py-2 border-b border-white/10 text-sm">
                                        <Editable as="span" value={outcome.metric} onUpdate={v => onUpdate(`scenarios[${i}].outcomes[${j}].metric`, v)} className="text-white/70" />
                                        <Editable as="span" value={outcome.value} onUpdate={v => onUpdate(`scenarios[${i}].outcomes[${j}].value`, v)} className="font-bold text-white" />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-auto space-y-2 text-xs">
                                 <p className="font-bold text-white/50">RISK</p>
                                <Editable as="p" value={scenario.risk} onUpdate={v => onUpdate(`scenarios[${i}].risk`, v)} className="text-white/80" />
                                <p className="font-bold text-white/50 mt-2">COST</p>
                                <Editable as="p" value={scenario.cost} onUpdate={v => onUpdate(`scenarios[${i}].cost`, v)} className="font-extrabold text-xl text-[var(--color-accent-light)]" />
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="mt-6 flex-shrink-0">
                <AnalyticReflection text={slide.analytic_reflection} onUpdate={v => onUpdate('analytic_reflection', v)} animationStyle={reflectionAnimation} />
            </div>
        </SlideWrapper>
    );
};

const RiskAssessmentSlideLayout: React.FC<{ slide: RiskAssessmentSlide, onUpdate: (field: string, val: string | {category: string, description: string, mitigation: string}[]) => void, isActive: boolean }> = ({ slide, onUpdate, isActive }) => {
    const titleAnimation = getAnimationStyles(isActive, 200);
    const reflectionAnimation = getAnimationStyles(isActive, 800);

    return (
        <SlideWrapper className="p-16 flex flex-col">
            <div style={titleAnimation}><h1 className="text-5xl font-extrabold tracking-tighter mb-8 text-[var(--color-accent-light)]">{slide.title}</h1></div>
            <div className="flex-grow space-y-4">
                {(slide.risks || []).map((risk, i) => {
                    const riskAnimation = getAnimationStyles(isActive, 350 + i * 100);
                    return (
                        <div key={i} className="bg-white/5 p-4 rounded-lg grid grid-cols-3 gap-4 items-start transition-all duration-200 hover:bg-white/10" style={riskAnimation}>
                            <Editable as="p" value={risk.category} onUpdate={v => onUpdate(`risks[${i}].category`, v)} className="font-bold text-sm text-[var(--color-accent-light)] uppercase tracking-wider" />
                            <div>
                                <p className="text-xs font-bold text-white/50 mb-1">Description</p>
                                <Editable as="p" value={risk.description} onUpdate={v => onUpdate(`risks[${i}].description`, v)} className="text-sm text-white/80" />
                            </div>
                             <div>
                                <p className="text-xs font-bold text-white/50 mb-1">Mitigation</p>
                                <Editable as="p" value={risk.mitigation} onUpdate={v => onUpdate(`risks[${i}].mitigation`, v)} className="text-sm text-white/80" />
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="mt-6 flex-shrink-0">
                <AnalyticReflection text={slide.analytic_reflection} onUpdate={v => onUpdate('analytic_reflection', v)} animationStyle={reflectionAnimation} />
            </div>
        </SlideWrapper>
    );
};

const RoadmapSlideLayout: React.FC<{ slide: RoadmapSlide, onUpdate: (field: string, val: string | {title: string, timeline: string, action_steps: {action: string, kpi: string}[], outcome: string}[]) => void, isActive: boolean }> = ({ slide, onUpdate, isActive }) => {
    const titleAnimation = getAnimationStyles(isActive, 200);

    return (
        <SlideWrapper className="p-16">
            <div style={titleAnimation}><h1 className="text-5xl font-extrabold tracking-tighter mb-10 text-[var(--color-accent-light)]">Implementation Doctrine</h1></div>
            <div className="flex justify-between items-stretch gap-6 flex-grow">
                {(slide.phases || []).map((phase, i) => {
                    const phaseAnimation = getAnimationStyles(isActive, 350 + i * 150, 'scale-in');
                    return (
                        <div key={i} className="w-1/3 bg-[var(--color-accent-cream)]/10 p-6 rounded-xl border border-white/10 flex flex-col flex-1" style={phaseAnimation}>
                            <div className="flex items-center mb-4 flex-shrink-0">
                                <div className="w-10 h-10 bg-[var(--color-primary-medium)] text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">{String(i + 1).padStart(2, '0')}</div>
                                <div>
                                    <Editable as="h3" value={phase.title} onUpdate={v => onUpdate(`phases[${i}].title`, v)} className="font-extrabold text-xl text-white" />
                                    <Editable as="p" value={phase.timeline} onUpdate={v => onUpdate(`phases[${i}].timeline`, v)} className="text-xs text-white/50 font-semibold uppercase" />
                                </div>
                            </div>
                            <div className="flex-grow min-h-0 overflow-y-auto content-scrollbar pr-2">
                                <p className="text-xs font-semibold mt-3 text-white/60">Action Steps & KPIs:</p>
                                <ul className="text-sm space-y-3 mt-2 text-white/80">
                                    {(phase.action_steps || []).map((step, j) => (
                                        <li key={j} className="text-sm">
                                            <Editable as="span" value={step.action} onUpdate={v => onUpdate(`phases[${i}].action_steps[${j}].action`, v)} />
                                            <div className="flex items-center mt-1">
                                                <span className="text-xs font-bold text-blue-400/80 mr-2">KPI:</span>
                                                <Editable as="span" value={step.kpi} onUpdate={v => onUpdate(`phases[${i}].action_steps[${j}].kpi`, v)} className="text-xs text-white/60 italic" />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-auto pt-4 border-t border-white/10 flex-shrink-0">
                                <p className="font-bold text-xs text-[var(--color-primary-medium)]">DOCTRINE OUTCOME</p>
                                <Editable as="p" value={phase.outcome} onUpdate={v => onUpdate(`phases[${i}].outcome`, v)} className="text-sm text-white font-semibold" />
                            </div>
                        </div>
                    )
                })}
            </div>
        </SlideWrapper>
    );
};

const GanttChartRoadmapSlideLayout: React.FC<{ slide: GanttChartRoadmapSlide, onUpdate: (field: string, val: string | number | {name: string, start_quarter: string, end_quarter: string, kpi: string}[]) => void, isActive: boolean }> = ({ slide, onUpdate, isActive }) => {
    const startYear = slide.timeline_start_year;
    const endYear = slide.timeline_end_year;
    if (!startYear || !endYear || endYear < startYear) {
        return <SlideWrapper className="p-12 items-center justify-center text-white/50">Invalid or missing timeline data.</SlideWrapper>;
    }
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    const totalQuarters = years.length * 4;

    const parseQuarter = (quarterStr: string): number => {
        if (!quarterStr || !quarterStr.includes(' ')) return -1;
        const [quarter, year] = quarterStr.split(' ');
        const yearInt = parseInt(year);
        if (isNaN(yearInt)) return -1;
        const yearIndex = yearInt - startYear;
        const quarterIndex = parseInt(quarter.substring(1)) - 1;
        if (isNaN(quarterIndex) || quarterIndex < 0 || quarterIndex > 3) return -1;
        return yearIndex * 4 + quarterIndex;
    };

    const titleAnimation = getAnimationStyles(isActive, 200);
    const yearHeaderAnimation = getAnimationStyles(isActive, 300);

    return (
        <SlideWrapper className="p-12 flex flex-col" style={{background: 'linear-gradient(to bottom, #1B3C53, #102434)'}}>
            <div style={titleAnimation}><Editable as="h1" value={slide.title} onUpdate={v => onUpdate('title', v)} className="text-5xl font-extrabold tracking-tight mb-8 text-[var(--color-accent-light)]" /></div>
            
            <div className="flex-grow flex flex-col">
                {/* Timeline Header */}
                <div className="flex pl-[30%]">
                    <div className="w-full grid" style={{ gridTemplateColumns: `repeat(${years.length}, 1fr)` }}>
                        {years.map(year => (
                            <div key={year} className="text-center" style={yearHeaderAnimation}>
                                <p className="font-bold text-white/80 text-sm">{year}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex pl-[30%] -mt-1">
                    <div className="w-full grid" style={{ gridTemplateColumns: `repeat(${totalQuarters}, 1fr)` }}>
                        {Array.from({length: totalQuarters}).map((_, i) => (
                             <div key={i} className="text-center text-[10px] text-white/50">Q{ (i % 4) + 1 }</div>
                        ))}
                    </div>
                </div>

                {/* Chart Body */}
                <div className="flex-grow flex items-center mt-2 relative">
                    {/* Vertical grid lines */}
                    <div className="absolute top-0 left-[30%] w-[70%] h-full grid" style={{ gridTemplateColumns: `repeat(${totalQuarters}, 1fr)` }}>
                        {Array.from({ length: totalQuarters }).map((_, i) => <div key={i} className={`h-full ${ (i + 1) % 4 === 0 ? 'border-r border-white/20' : 'border-r border-white/10'}`}></div>)}
                    </div>

                    {/* Labels and Bars */}
                    <div className="w-full relative z-10 mt-2 space-y-1">
                        {(slide.phases || []).map((phase, pIndex) => 
                            (phase.deliverables || []).map((d, dIndex) => {
                                const startIndex = parseQuarter(d.start_quarter);
                                const endIndex = parseQuarter(d.end_quarter);
                                if (startIndex < 0 || endIndex < 0 || startIndex > endIndex) return null;
                                
                                const duration = endIndex - startIndex + 1;
                                const deliverablePath = `phases[${pIndex}].deliverables[${dIndex}]`;
                                const deliverableAnimation = getAnimationStyles(isActive, 400 + (pIndex * (phase.deliverables.length) + dIndex) * 75);

                                return (
                                    <div key={`${pIndex}-${dIndex}`} className="flex items-center h-14 relative group" style={deliverableAnimation}>
                                        <div className="w-[30%] flex-shrink-0 pr-4 text-right">
                                            <Editable as="p" value={d.name} onUpdate={v => onUpdate(`${deliverablePath}.name`, v)} className="text-sm font-semibold text-white/90 truncate" />
                                            <div className="text-xs text-white/50 italic truncate flex justify-end items-center">
                                                <span className="mr-1">KPI:</span>
                                                <Editable as="span" value={d.kpi} onUpdate={v => onUpdate(`${deliverablePath}.kpi`, v)} />
                                            </div>
                                        </div>
                                        <div className="absolute h-5 transition-all duration-300 group-hover:h-6" style={{ 
                                            left: `calc(30% + ${(startIndex / totalQuarters) * 70}%)`, 
                                            width: `calc(${(duration / totalQuarters) * 70}%)`, 
                                            top: '50%', 
                                            transform: 'translateY(-50%)' 
                                        }}>
                                            <div className="h-full bg-[var(--color-primary-medium)] rounded-sm flex items-center justify-end px-1.5 shadow-lg transition-all duration-300 group-hover:brightness-125"
                                                 style={{ background: 'linear-gradient(90deg, #456882, #60829d)' }}
                                            >
                                                <div className="w-1.5 h-1.5 bg-white/80 rounded-full shadow-sm"></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const ProjectedImpactSlideLayout: React.FC<{ slide: ProjectedImpactSlide, onUpdate: (field: string, val: string | {label: string, baseline: string, projected: string, timeframe: string, assumption: string}[]) => void, isActive: boolean }> = ({ slide, onUpdate, isActive }) => {
    const titleAnimation = getAnimationStyles(isActive, 200);
    const subtitleAnimation = getAnimationStyles(isActive, 350);
    const reflectionAnimation = getAnimationStyles(isActive, 1100);

    return (
        <SlideWrapper className="p-16 flex flex-col justify-center items-center text-center">
            <div style={titleAnimation}>
                <Editable as="h1" value={slide.title || 'Projected Impact'} onUpdate={v => onUpdate('title', v)} className="text-5xl font-extrabold tracking-tighter mb-3 text-[var(--color-accent-light)]" />
            </div>
            <div style={subtitleAnimation}>
                <Editable as="p" value={slide.subtitle || "The quantified outcomes of the doctrine."} onUpdate={v => onUpdate('subtitle', v)} className="text-white/60 mb-12 max-w-3xl mx-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl">
                {(slide.metrics || []).map((metric, i) => {
                    const baselineMatch = (metric.baseline || '').match(/(.*?)\s*\((.*)\)/);
                    const baselineValue = baselineMatch ? baselineMatch[1].trim() : metric.baseline;
                    const baselineDescription = baselineMatch ? `(${baselineMatch[2]})` : null;

                    const projectedMatch = (metric.projected || '').match(/(.*?)\s*\((.*)\)/);
                    const projectedValue = projectedMatch ? projectedMatch[1].trim() : metric.projected;
                    const projectedDescription = projectedMatch ? `(${projectedMatch[2]})` : null;
                    const metricAnimation = getAnimationStyles(isActive, 500 + i * 150, 'scale-in');
                    
                    return (
                        <div key={i} className="bg-white/5 p-6 rounded-lg border border-white/10 flex flex-col text-left" style={metricAnimation}>
                            <Editable as="p" value={metric.label} onUpdate={v => onUpdate(`metrics[${i}].label`, v)} className="text-lg font-bold text-[var(--color-accent-light)] mb-4 h-12" />
                            
                            <div className="flex-grow grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                <div className="text-center">
                                    <p className="text-xs text-white/50 uppercase tracking-widest">Baseline</p>
                                    <MetricValueDisplay 
                                        value={baselineValue}
                                        isActive={isActive}
                                        numberClass="text-4xl text-white/70"
                                        suffixClass="text-2xl" 
                                    />
                                    {baselineDescription && <p className="text-base font-bold text-white/70 mt-1">{baselineDescription}</p>}
                                </div>
                                <div className="text-2xl text-[var(--color-primary-medium)] font-light">&rarr;</div>
                                <div className="text-center">
                                    <p className="text-xs text-[var(--color-primary-medium)] uppercase font-bold tracking-widest">Projected</p>
                                    <MetricValueDisplay 
                                        value={projectedValue}
                                        isActive={isActive}
                                        numberClass="text-5xl text-[var(--color-accent-cream)]"
                                        suffixClass="text-3xl"
                                    />
                                    {projectedDescription && <p className="text-base font-bold text-white/80 mt-1">{projectedDescription}</p>}
                                </div>
                            </div>

                            <div className="text-xs text-white/60 mt-auto border-t border-white/10 pt-4 space-y-1">
                                <p><strong>Timeframe:</strong> <Editable as="span" value={metric.timeframe} onUpdate={v => onUpdate(`metrics[${i}].timeframe`, v)}/></p>
                                <p><strong>Assumption:</strong> <Editable as="span" value={metric.assumption} onUpdate={v => onUpdate(`metrics[${i}].assumption`, v)}/></p>
                            </div>
                        </div>
                    )
                })}
            </div>
             <div className="w-full max-w-3xl mt-12">
                <AnalyticReflection text={slide.analytic_reflection} onUpdate={v => onUpdate('analytic_reflection', v)} animationStyle={reflectionAnimation} />
            </div>
        </SlideWrapper>
    );
};

const FiscalFrameworkSlideLayout: React.FC<{ slide: FiscalFrameworkSlide, onUpdate: (field: string, val: string | {component: string, capex: string, opex: string, funding_source: string, recovery_mechanism: string}[]) => void, isActive: boolean }> = ({ slide, onUpdate, isActive }) => {
    const titleAnimation = getAnimationStyles(isActive, 200);
    const reflectionAnimation = getAnimationStyles(isActive, 800);

    return (
        <SlideWrapper className="p-16 flex flex-col">
            <div style={titleAnimation}><h1 className="text-5xl font-extrabold tracking-tighter mb-8 text-[var(--color-accent-light)]">{slide.title}</h1></div>
            <div className="flex-grow bg-white/5 border border-white/10 rounded-lg p-1">
                <div className="grid grid-cols-5 text-xs font-bold text-white/60 uppercase p-4 border-b border-white/10 tracking-wider">
                    <span>Component</span>
                    <span className="text-center">CapEx</span>
                    <span className="text-center">OpEx</span>
                    <span>Funding Source</span>
                    <span>Recovery Mechanism</span>
                </div>
                <div className="divide-y divide-white/10">
                    {(slide.cost_items || []).map((item, i) => {
                        const itemAnimation = getAnimationStyles(isActive, 350 + i * 100);
                        return (
                            <div key={i} className="grid grid-cols-5 gap-4 p-4 items-center text-sm transition-all duration-200 hover:bg-white/10" style={itemAnimation}>
                                <Editable as="p" value={item.component} onUpdate={v => onUpdate(`cost_items[${i}].component`, v)} className="font-semibold text-white" />
                                <Editable as="p" value={item.capex} onUpdate={v => onUpdate(`cost_items[${i}].capex`, v)} className="text-center text-white/80" />
                                <Editable as="p" value={item.opex} onUpdate={v => onUpdate(`cost_items[${i}].opex`, v)} className="text-center text-white/80" />
                                <Editable as="p" value={item.funding_source} onUpdate={v => onUpdate(`cost_items[${i}].funding_source`, v)} className="text-white/80 text-xs" />
                                <Editable as="p" value={item.recovery_mechanism} onUpdate={v => onUpdate(`cost_items[${i}].recovery_mechanism`, v)} className="text-white/80 text-xs" />
                            </div>
                        )
                    })}
                </div>
            </div>
             <div className="mt-6 flex-shrink-0">
                <AnalyticReflection text={slide.analytic_reflection} onUpdate={v => onUpdate('analytic_reflection', v)} animationStyle={reflectionAnimation} />
            </div>
        </SlideWrapper>
    );
};

const PolicyLeversSlideLayout: React.FC<{ slide: PolicyLeversSlide, onUpdate: (field: string, val: string | {title: string, strategy: string, expected_impact: string, measurement_framework: string}[]) => void, isActive: boolean }> = ({ slide, onUpdate, isActive }) => {
    const titleAnimation = getAnimationStyles(isActive, 200);

    return (
        <SlideWrapper className="p-16 flex flex-col">
            <div style={titleAnimation}><h1 className="text-5xl font-extrabold tracking-tighter mb-10 text-[var(--color-accent-light)]">Required Policy Levers</h1></div>
            <div className="space-y-6 flex-grow overflow-y-auto content-scrollbar pr-4">
                {(slide.recommendations || []).map((rec, i) => {
                    const recommendationAnimation = getAnimationStyles(isActive, 350 + i * 150);
                    return (
                        <div key={i} className="bg-[var(--color-accent-cream)]/10 p-6 rounded-lg border border-white/10" style={recommendationAnimation}>
                            <Editable as="h3" value={rec.title} onUpdate={v => onUpdate(`recommendations[${i}].title`, v)} className="font-bold text-xl text-white mb-4" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <div>
                                    <p className="text-xs font-bold uppercase text-white/50 mb-2">Strategy & Impact</p>
                                    <Editable as="p" value={rec.strategy} onUpdate={v => onUpdate(`recommendations[${i}].strategy`, v)} className="text-sm mb-2 text-white/80" useMarkdown />
                                    <Editable as="p" value={rec.expected_impact} onUpdate={v => onUpdate(`recommendations[${i}].expected_impact`, v)} className="text-sm font-semibold text-white" useMarkdown />
                                </div>
                                <div>
                                     <p className="text-xs font-bold uppercase text-white/50 mb-2">Measurement Framework</p>
                                    <Editable as="p" value={rec.measurement_framework} onUpdate={v => onUpdate(`recommendations[${i}].measurement_framework`, v)} className="text-sm text-white/80" />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </SlideWrapper>
    );
};

const GovernanceFrameworkSlideLayout: React.FC<{ slide: GovernanceFrameworkSlide, onUpdate: (field: string, val: string | unknown) => void, isActive: boolean }> = ({ slide, onUpdate, isActive }) => {
    const titleAnimation = getAnimationStyles(isActive, 200);
    const leadAgencyAnimation = getAnimationStyles(isActive, 350);
    const fundingModelAnimation = getAnimationStyles(isActive, 500);
    const regulatoryChangesAnimation = getAnimationStyles(isActive, 650);
    const stakeholderRolesAnimation = getAnimationStyles(isActive, 350);

    return (
        <SlideWrapper className="p-16 flex flex-col">
            <div style={titleAnimation}><h1 className="text-5xl font-extrabold tracking-tighter mb-8 text-[var(--color-accent-light)]">{slide.title}</h1></div>
            <div className="flex-grow grid grid-cols-2 gap-10 min-h-0">
                <div className="space-y-6">
                    <div className="bg-white/5 p-4 rounded-lg" style={leadAgencyAnimation}>
                        <h3 className="font-bold text-lg text-[var(--color-accent-light)] mb-2">Lead Agency</h3>
                        <Editable as="p" value={slide.lead_agency?.name} onUpdate={v => onUpdate('lead_agency.name', v)} className="text-base font-semibold text-white" />
                        <Editable as="p" value={slide.lead_agency?.rationale} onUpdate={v => onUpdate('lead_agency.rationale', v)} className="text-xs text-white/70 mt-1" />
                    </div>
                     <div className="bg-white/5 p-4 rounded-lg" style={fundingModelAnimation}>
                        <h3 className="font-bold text-lg text-[var(--color-accent-light)] mb-2">Funding Model</h3>
                        <Editable as="p" value={slide.funding_model} onUpdate={v => onUpdate('funding_model', v)} className="text-sm text-white" />
                    </div>
                     <div className="bg-white/5 p-4 rounded-lg" style={regulatoryChangesAnimation}>
                        <h3 className="font-bold text-lg text-[var(--color-accent-light)] mb-2">Regulatory Changes</h3>
                         <ul className="list-disc list-inside space-y-1 text-sm text-white/90">
                            {(slide.regulatory_changes || []).map((change, i) => <li key={i}><Editable as="span" value={change} onUpdate={v => onUpdate(`regulatory_changes[${i}]`, v)} /></li>)}
                        </ul>
                    </div>
                </div>
                 <div className="flex flex-col min-h-0">
                    <h3 className="font-bold text-lg text-[var(--color-accent-light)] mb-2 flex-shrink-0" style={stakeholderRolesAnimation}>Key Stakeholder Roles</h3>
                    <div className="space-y-2 overflow-y-auto content-scrollbar pr-2 flex-grow">
                        {(slide.stakeholders || []).map((s, i) => {
                            const stakeholderAnimation = getAnimationStyles(isActive, 500 + i * 75);
                            return (
                                <div key={i} className="flex items-start text-sm border-b border-white/10 py-2" style={stakeholderAnimation}>
                                    <Editable as="p" value={s.name} onUpdate={v => onUpdate(`stakeholders[${i}].name`, v)} className="w-1/3 font-semibold text-white/90" />
                                    <Editable as="p" value={s.role} onUpdate={v => onUpdate(`stakeholders[${i}].role`, v)} className="w-2/3 text-white/70" />
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
};

const ClosingSlideLayout: React.FC<{ slide: ClosingSlide, onUpdate: (field: string, val: string | unknown) => void, imageUrls: Record<string, string>, isActive: boolean }> = ({ slide, onUpdate, imageUrls, isActive }) => {
    const taglineAnimation = getAnimationStyles(isActive, 200);
    const lineAnimation = getAnimationStyles(isActive, 400, 'scale-in');
    const creditsAnimation = getAnimationStyles(isActive, 500);

    return (
        <SlideWrapper className="p-16 justify-center text-center">
             <div className="absolute inset-0 bg-black/70 z-10"></div>
            <img src={imageUrls['closing_image'] || ''} className="absolute inset-0 w-full h-full object-cover" alt="Closing background"/>
            <div className="relative z-20">
                <div style={taglineAnimation}><Editable as="h2" value={slide.tagline} onUpdate={v => onUpdate('tagline', v)} className="text-7xl font-black leading-tight tracking-tighter" /></div>
                <div style={lineAnimation}><div className="w-20 h-1.5 bg-[var(--color-primary-medium)] my-8 mx-auto"></div></div>
                <div style={creditsAnimation}><Editable as="p" value={slide.credits} onUpdate={v => onUpdate('credits', v)} className="text-xl text-white/70" /></div>
            </div>
        </SlideWrapper>
    );
};

const UrbanStudySlide: React.FC<{ slide: PresentationSlide; imageUrls?: Record<string, string>; onUpdate: (field: string, val: string | unknown) => void, slideNumber: number, isActive: boolean }> = ({ slide, imageUrls, onUpdate, slideNumber, isActive }) => {
  const renderLayout = () => {
    const props = { onUpdate, imageUrls: imageUrls || {}, isActive };
    const layoutMap: { [key: string]: React.FC<unknown> } = {
        'Cover': CoverSlideLayout,
        'ExecutiveOverview': ExecutiveOverviewSlideLayout,
        'Crisis': CrisisSlideLayout,
        'SWOT': SWOTSlideLayout,
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
        'Closing': ClosingSlideLayout,
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
  
  return (
    <div className="w-full h-full bg-[var(--color-primary-dark)] relative">
        <div className="absolute bottom-6 left-12 text-xs font-bold text-white/30 z-30">
            SLIDE {String(slideNumber).padStart(2, '0')}
        </div>
        <div className="absolute bottom-4 right-12 text-4xl font-black text-white/20 z-30" style={{ fontFamily: 'sans-serif' }}>
            T.
        </div>
        {renderLayout()}
    </div>
  );
};

export default UrbanStudySlide;