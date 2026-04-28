
import React, { useState, useRef, useEffect } from 'react';
import type { MasterplanProjectInfo, MasterplanSlide, BrandingInfo } from '@/types';
import MasterplanInputForm from './MasterplanInputForm';
import { generateMasterplan } from '@/services/geminiService';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';
import SlideNavigator from './SlideNavigator';
import { motion, AnimatePresence } from 'motion/react';
import { Download, ChevronLeft, ChevronRight, Maximize2, Share2, Layers } from 'lucide-react';
import { domToPng } from 'modern-screenshot';
import { useAuth } from '@/context/AuthContext';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';

interface MasterplanDesignerGeneratorProps {
  onUpgrade?: () => void;
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
            
            const designWidth = 1200;
            const designHeight = 800;

            const scaleX = parentWidth / designWidth;
            const scaleY = parentHeight / designHeight;
            
            setScale(Math.min(scaleX, scaleY, 1));
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
                width: '1200px', 
                height: '800px', 
                transform: `scale(${scale})`,
                flexShrink: 0
            }}
        >
            {children}
        </div>
    );
};

const MasterplanDesignerGenerator: React.FC<MasterplanDesignerGeneratorProps> = () => {
  const { user, profile, loading, signInWithGoogle, refreshProfile } = useAuth();
  const { companyProfile } = useCompanyProfile();
  const [slides, setSlides] = useState<MasterplanSlide[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (info: MasterplanProjectInfo) => {
    setIsLoading(true);
    setError(null);
    try {
      const branding: BrandingInfo | undefined = profile ? {
        logo: profile.branding_logo || '',
        colors: profile.branding_colors || '',
        presentation_template: profile.branding_presentation_template || '',
        presentation_template_url: profile.branding_presentation_template_url || '',
        report_template: profile.branding_report_template || '',
        report_template_url: profile.branding_report_template_url || ''
      } : undefined;

      const generatedSlides = await generateMasterplan(info, companyProfile, profile?.plan, branding);
      setSlides(generatedSlides);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Masterplan generation failed';
        setError(message);
        // Refresh profile in case of credit sync issues
        await refreshProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadImage = async () => {
      const el = document.getElementById(`masterplan-slide-${currentIndex}`);
      if (!el) return;
      try {
          const dataUrl = await domToPng(el, { quality: 1, scale: 2 });
          const link = document.createElement('a');
          link.download = `Masterplan_Slide_${currentIndex + 1}.png`;
          link.href = dataUrl;
          link.click();
      } catch (e) {
          console.error("Download failed", e);
      }
  };

  if (isLoading) return <Loader message="Generating Luxury Urban Masterplan..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => setSlides(null)} />;

  if (!slides) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center space-x-3 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full mb-8">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Advanced Urban Synthesis</span>
            </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter uppercase transition-all">
            Masterplan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Designer</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Generate sophisticated, high-end residential communities with intelligent urban frameworks, central green spines, and automated plot subdivisions.
          </p>
        </div>
        <MasterplanInputForm 
          initialInfo={{ 
            country: '', 
            city: '', 
            location: '', 
            scale: '', 
            type: '',
            landUseBalance: '',
            landUseBreakdown: []
          }} 
          onSubmit={handleGenerate} 
          isLoading={isLoading || loading}
          credits={profile?.credits || 0}
          userEmail={user?.email || null}
          onLogin={signInWithGoogle}
        />
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col overflow-hidden animate-in fade-in duration-500">
      <div className="flex-1 flex items-center justify-center relative bg-black/40 rounded-3xl overflow-hidden border border-white/5 group">
        
        {/* Navigation Overlays */}
        <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-all active:scale-90"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
        </div>

        <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={() => setCurrentIndex(prev => Math.min(slides.length - 1, prev + 1))}
                disabled={currentIndex === slides.length - 1}
                className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-all active:scale-90"
            >
                <ChevronRight className="w-6 h-6" />
            </button>
        </div>

        {/* Slide Display */}
        <ResponsiveSlideContainer>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    id={`masterplan-slide-${currentIndex}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full bg-white rounded-3xl shadow-2xl flex flex-col p-12 relative overflow-hidden border border-gray-100"
                >
                    {/* Brand Watermark */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 -mr-32 -mt-32 rounded-full blur-3xl opacity-50"></div>
                    
                    <div className="relative w-full h-full flex flex-col">
                        <div className="flex justify-between items-start mb-8 z-10 border-b border-gray-100 pb-6">
                            <div>
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Section 0{currentIndex + 1}</span>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 tracking-tight font-sans">{currentSlide.title}</h2>
                                <p className="text-blue-600 text-[10px] font-bold uppercase tracking-widest mt-1">Tanmyaa Masterplan Strategy</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="h-10 w-px bg-gray-100" />
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project Deck</p>
                                    <p className="text-xs font-bold text-gray-900 font-sans uppercase">Ref: MPLAN-{Math.floor(Math.random() * 900) + 100}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-gray-50 relative group/image">
                            <img 
                                src={currentSlide.image_url} 
                                alt={currentSlide.title} 
                                className="w-full h-full object-cover rounded-2xl"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-500" />
                        </div>

                        <div className="mt-10 flex justify-between items-end z-10 relative">
                            <div className="max-w-2xl bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <p className="text-gray-700 text-lg leading-relaxed font-serif italic text-pretty">
                                    &ldquo;{currentSlide.description}&rdquo;
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-4">
                                <div className="flex items-center space-x-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    <Layers className="w-3 h-3" />
                                    <span>Synthetic Simulation Active</span>
                                </div>
                                <button onClick={handleDownloadImage} className="flex items-center space-x-3 bg-gray-900 text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95">
                                    <Download className="w-4 h-4" />
                                    <span>Export Narrative</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </ResponsiveSlideContainer>
      </div>

      {/* Controls Overlay */}
      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center space-x-4 bg-black/20 backdrop-blur-xl border border-white/5 px-6 py-3 rounded-full">
            <button 
                onClick={() => setSlides(null)}
                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
            >
                New Project
            </button>
            <div className="w-[1px] h-4 bg-white/10" />
            <div className="flex items-center space-x-2">
                <Maximize2 className="w-3 h-3 text-gray-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Fullscreen Focus</span>
            </div>
        </div>

        <SlideNavigator 
          slides={slides as MasterplanSlide[]} 
          currentIndex={currentIndex} 
          onSelect={setCurrentIndex} 
        />

        <div className="flex items-center space-x-3">
             <button className="p-4 bg-white/5 border border-white/5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <Share2 className="w-4 h-4" />
             </button>
             <button className="flex items-center space-x-2 bg-blue-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">
                <span>Finalize Deck</span>
             </button>
        </div>
      </div>
    </div>
  );
};

export default MasterplanDesignerGenerator;
