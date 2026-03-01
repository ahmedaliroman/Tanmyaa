
import React from 'react';
import type { PresentationSlide } from '../types';

interface SlideNavigatorProps {
  slides: PresentationSlide[];
  currentIndex: number;
  onSelectSlide: (index: number) => void;
}

const SlideNavigator: React.FC<SlideNavigatorProps> = ({ slides, currentIndex, onSelectSlide }) => {
  const getSlideTitle = (slide: PresentationSlide, index: number): string => {
    // Fix: Updated switch cases to match the currently defined slide layouts in types.ts
    // and use the correct 'title' property where available.
    switch (slide.layout) {
      case 'Cover': return slide.title || 'Cover';
      case 'ExecutiveOverview': return slide.title || 'Executive Overview';
      case 'Crisis': return slide.title || 'The Crisis';
      case 'SWOT': return 'SWOT Analysis';
      case 'Benchmarks': return 'Benchmarks';
      case 'CaseStudyDeepDive': return slide.title || 'Case Study';
      case 'Vision': return slide.title || 'Vision & Objectives';
      case 'MacroStrategy': return slide.title || 'Spatial Strategy';
      case 'EquityAnalysis': return slide.title || 'Equity Analysis';
      case 'NodeAssessment': return slide.title || 'Node Assessment';
      case 'ScenarioComparison': return slide.title || 'Scenario Comparison';
      case 'RiskAssessment': return slide.title || 'Risk Assessment';
      case 'Roadmap': return 'Implementation Roadmap';
      case 'GanttChartRoadmap': return slide.title || 'Gantt Chart';
      case 'ProjectedImpact': return 'Projected Impact';
      case 'FiscalFramework': return slide.title || 'Fiscal Framework';
      case 'PolicyLevers': return 'Policy Recommendations';
      case 'GovernanceFramework': return slide.title || 'Governance';
      case 'References': return 'References';
      case 'Closing': return 'Conclusion';
      default:
        return `Slide ${index + 1}`;
    }
  }

  return (
    <div className="bg-black/40 border-t border-white/10 p-2 flex-shrink-0">
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 thumbnail-scrollbar">
          {slides.map((slide, index) => (
            <button
                key={index}
                onClick={() => onSelectSlide(index)}
                className={`group flex-shrink-0 p-2 pr-4 rounded-lg transition-all duration-200 w-48 ${
                  index === currentIndex
                    ? 'bg-[var(--color-primary-medium)]'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center text-left">
                    <span className={`text-sm font-mono font-bold mr-3 ${index === currentIndex ? 'text-white' : 'text-gray-400'}`}>
                    {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-grow overflow-hidden">
                       <p className={`text-xs font-semibold truncate leading-tight ${index === currentIndex ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>
                         {getSlideTitle(slide, index)}
                       </p>
                       <p className={`text-[10px] opacity-70 ${index === currentIndex ? 'text-white/70' : 'text-gray-500 group-hover:text-gray-400'}`}>
                          {slide.layout}
                       </p>
                    </div>
                </div>
            </button>
          ))}
      </div>
    </div>
  );
};

export default SlideNavigator;