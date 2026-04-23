
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Map, Layout, Zap, Users, Send, 
  MapPin, Loader2, CheckCircle2, Download, 
  Eye, Layers, ArrowRight, ArrowLeft, Info,
  Database, Image as ImageIcon, Box
} from 'lucide-react';
import { generateMasterplan, generateImage } from '../services/geminiService';
import { MasterplanDesignSet, MasterplanDNA } from '../types';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface MasterplanDesignerProps {
  onUpgrade: () => void;
}

const MasterplanDesigner: React.FC<MasterplanDesignerProps> = ({ onUpgrade }) => {
  const { userData, user, signInWithGoogle } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [designSet, setDesignSet] = useState<MasterplanDesignSet | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'folio' | 'dna'>('folio');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    location: '',
    projectType: 'mixed-use',
    density: 'medium',
    goal: 'walkable, connected, high-quality community',
    program: '',
    archInputs: ''
  });

  const handleGenerate = async () => {
    if (!formData.location) {
      toast.error("Please specify a location.");
      return;
    }

    setLoading(true);
    try {
      const result = await generateMasterplan(formData, attachedFiles, userData?.plan);
      setDesignSet(result);
      setStep(3);
      setActiveSlideIndex(0);
      setViewMode('folio');
      toast.success("Masterplan DNA calculated. Design portfolio ready.");
      
      // Auto-trigger first image
      if (result.slides.length > 0) {
        handleGenerateImage(result.slides[0].name, result.slides[0].prompt);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to generate masterplan logic.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(Array.from(e.target.files));
      toast.success("Site boundaries attached for analysis.");
    }
  };

  const handleGenerateImage = async (slideName: string, prompt: string) => {
    setGeneratingImages(prev => ({ ...prev, [slideName]: true }));
    try {
      const imageUrl = await generateImage(prompt);
      setGeneratedImages(prev => ({ ...prev, [slideName]: imageUrl }));
    } catch (error) {
      toast.error(`Failed to generate image for ${slideName}`);
    } finally {
      setGeneratingImages(prev => ({ ...prev, [slideName]: false }));
    }
  };

  const renderDNACard = (title: string, content: string, icon: React.ReactNode) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all group">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h4 className="text-sm font-black uppercase tracking-widest text-white/70">{title}</h4>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">{content}</p>
    </div>
  );

  return (
    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-3xl shadow-2xl p-6 md:p-8 text-white font-sans max-w-6xl mx-auto my-12">
      {!user ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6 mx-auto border border-blue-500/20">
            <Users className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">Identity Required</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            To initialize the Masterplan DNA and track your generation credits, please sign in with your professional account.
          </p>
          <button
            onClick={signInWithGoogle}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-10 rounded-full transition-all duration-300 shadow-xl shadow-blue-900/40 flex items-center space-x-3 mx-auto uppercase tracking-widest text-xs"
          >
            <span>Sign in with Google</span>
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 bg-blue-600 rounded text-[10px] font-bold uppercase tracking-wider text-white">Elite Service</div>
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Master Plan Designer</h1>
          </div>
          <p className="text-gray-400">Autonomous Spatial Logic & Architectural Integration</p>
        </div>
        
        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => step > s && step !== 3 && setStep(s)}
              disabled={step === 3 || loading}
              className={`text-center py-2 px-4 text-sm font-medium transition-colors duration-300 disabled:opacity-50 ${
                s === step
                  ? 'bg-gray-700/80 text-white rounded-lg border border-gray-600/50 shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {s === 1 ? 'Context' : s === 2 ? 'Program' : 'System DNA'}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-black/40 rounded-xl border border-gray-800 overflow-hidden">
               <div className="border-b border-gray-800 p-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Spatial Context</label>
                  <div className="relative">
                    <MapPin className="absolute left-0 top-1 w-4 h-4 text-gray-500" />
                    <input 
                      type="text"
                      placeholder="e.g., Cairo New Capital, Damietta Port, London Greenwich..."
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full bg-transparent text-white placeholder-gray-500 pl-6 transition duration-200 focus:outline-none focus:ring-0 font-medium"
                    />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="border-b md:border-b-0 md:border-r border-gray-800 p-4">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Project Typology</label>
                    <select 
                      value={formData.projectType}
                      onChange={(e) => setFormData({...formData, projectType: e.target.value})}
                      className="w-full bg-transparent text-white outline-none cursor-pointer appearance-none"
                    >
                      <option value="mixed-use" className="bg-gray-900">Mixed-Use</option>
                      <option value="residential" className="bg-gray-900">Residential Case</option>
                      <option value="landscape" className="bg-gray-900">Landscape/Park</option>
                      <option value="compound" className="bg-gray-900">Luxury Compound</option>
                      <option value="industrial" className="bg-gray-900">Industrial Hub</option>
                    </select>
                  </div>
                  <div className="p-4 border-t md:border-t-0 border-gray-800">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Urban Density</label>
                    <select 
                      value={formData.density}
                      onChange={(e) => setFormData({...formData, density: e.target.value})}
                      className="w-full bg-transparent text-white outline-none cursor-pointer appearance-none"
                    >
                      <option value="low" className="bg-gray-900">Low Density</option>
                      <option value="medium" className="bg-gray-900">Medium Density</option>
                      <option value="high" className="bg-gray-900">High Density</option>
                      <option value="ultra-compact" className="bg-gray-900">Ultra Compact</option>
                    </select>
                  </div>
               </div>

               <div className="border-t border-gray-800 p-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Strategic Goal</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g., 15-minute city logic, connected green spines..."
                    value={formData.goal}
                    onChange={(e) => setFormData({...formData, goal: e.target.value})}
                    className="w-full bg-transparent text-white placeholder-gray-500 transition duration-200 resize-none focus:outline-none focus:ring-0"
                  />
               </div>

               <div className="p-4 bg-gray-800/20">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Site Boundary (Included)</label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-gray-500 transition-colors cursor-pointer relative group bg-black/20">
                        <ImageIcon className={`w-6 h-6 mx-auto mb-2 transition-colors ${attachedFiles.length > 0 ? 'text-green-400' : 'text-gray-500 group-hover:text-blue-400'}`} />
                        <span className={`text-xs font-bold transition-colors ${attachedFiles.length > 0 ? 'text-green-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                          {attachedFiles.length > 0 ? `${attachedFiles[0].name} Locked` : 'Upload Site Boundaries (Aerial Photo)'}
                        </span>
                        <input 
                          type="file" 
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                    </div>
                  </div>
               </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setStep(2)}
                disabled={!formData.location}
                className="bg-gray-700/80 text-gray-200 font-semibold py-2 px-8 rounded-full hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50 flex items-center gap-2"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-black/40 rounded-xl border border-gray-800 overflow-hidden">
              <div className="border-b border-gray-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Functional Program Components</label>
                  <Database className="w-4 h-4 text-gray-600" />
                </div>
                <textarea 
                  rows={5}
                  placeholder="e.g., 50% Villas, 30% Townhouses, 10% Retail Mall, 5% School, 5% Mosque..."
                  value={formData.program}
                  onChange={(e) => setFormData({...formData, program: e.target.value})}
                  className="w-full bg-transparent text-white placeholder-gray-500 transition duration-200 resize-none focus:outline-none focus:ring-0 font-mono text-sm"
                />
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Architectural Parameters</label>
                  <Box className="w-4 h-4 text-gray-600" />
                </div>
                <textarea 
                  rows={5}
                  placeholder="e.g., Max build height 12m, Modern Islamic aesthetic, Rooftop gardening integration..."
                  value={formData.archInputs}
                  onChange={(e) => setFormData({...formData, archInputs: e.target.value})}
                  className="w-full bg-transparent text-white placeholder-gray-500 transition duration-200 resize-none focus:outline-none focus:ring-0 font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <button 
                onClick={() => setStep(1)}
                className="text-gray-400 hover:text-white font-medium py-2 px-4 rounded-full transition duration-300"
              >
                Back
              </button>
              <div className="flex items-center gap-4">
                 <div className="text-sm text-gray-400">{userData?.credits || 0} credits remaining.</div>
                 <button 
                  disabled={loading}
                  onClick={handleGenerate}
                  className="bg-gray-700/80 text-gray-200 font-semibold py-2 px-8 rounded-full hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing...
                    </>
                  ) : (
                    <>
                      Initialize Design <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && designSet && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {/* Portfolio Navigation Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setViewMode('folio')}
                  className={`text-xs font-black uppercase tracking-[0.2em] transition-all px-6 py-2 rounded-full border ${viewMode === 'folio' ? 'bg-white text-black border-white' : 'text-gray-500 border-transparent hover:text-white'}`}
                >
                  Design Folio
                </button>
                <button 
                  onClick={() => setViewMode('dna')}
                  className={`text-xs font-black uppercase tracking-[0.2em] transition-all px-6 py-2 rounded-full border ${viewMode === 'dna' ? 'bg-white text-black border-white' : 'text-gray-500 border-transparent hover:text-white'}`}
                >
                  Spatial DNA
                </button>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                >
                  New Project
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20">
                  Export Full Package
                </button>
              </div>
            </div>

            {viewMode === 'dna' ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {renderDNACard("Urban Structure", designSet.dna.structure, <Layers className="w-4 h-4" />)}
                {renderDNACard("Main Spine", JSON.stringify(designSet.dna.main_axis), <ArrowRight className="w-4 h-4" />)}
                {renderDNACard("Intensity Nodes", `${designSet.dna.nodes.length} Key Strategic Points Identified`, <Zap className="w-4 h-4" />)}
                {renderDNACard("Land Use Distribution", Object.entries(designSet.dna.land_use_distribution).map(([k,v]) => `${k}: ${v}`).join(', '), <Map className="w-4 h-4" />)}
                {renderDNACard("Density Pattern", designSet.dna.density_strategy, <Layout className="w-4 h-4" />)}
                {renderDNACard("Eco-System", designSet.dna.green_system.spine, <Users className="w-4 h-4" />)}
                {renderDNACard("Smart Mobility", designSet.dna.movement_hierarchy.roads, <Send className="w-4 h-4" />)}
                {renderDNACard("Service Strategy", designSet.dna.service_distribution.logic, <Building2 className="w-4 h-4" />)}
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Thumbnail Sidebar */}
                <div className="lg:col-span-3 space-y-3 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {designSet.slides.map((slide, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveSlideIndex(idx);
                        if (!generatedImages[slide.name] && !generatingImages[slide.name]) {
                          handleGenerateImage(slide.name, slide.prompt);
                        }
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        activeSlideIndex === idx 
                          ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' 
                          : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300'
                      }`}
                    >
                      <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">Slide 0{idx + 1}</div>
                      <div className="text-xs font-bold uppercase tracking-tight line-clamp-1">{slide.name}</div>
                    </button>
                  ))}
                </div>

                {/* Right: Main Viewer */}
                <div className="lg:col-span-9 bg-black/40 border border-white/5 rounded-[3rem] overflow-hidden flex flex-col min-h-[600px]">
                  <div className="relative aspect-video bg-gray-900 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeSlideIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                      >
                        {generatedImages[designSet.slides[activeSlideIndex].name] ? (
                          <img 
                            src={generatedImages[designSet.slides[activeSlideIndex].name]} 
                            alt={designSet.slides[activeSlideIndex].name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center bg-gray-900/50 relative">
                             <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-60" />
                             <div className="w-16 h-16 bg-blue-600/20 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/20 shadow-2xl shadow-blue-900/20">
                               {generatingImages[designSet.slides[activeSlideIndex].name] ? (
                                 <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                               ) : (
                                 <ImageIcon className="w-8 h-8 text-gray-500" />
                               )}
                             </div>
                             <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/40 mb-3">Initializing Visual Cortex</h3>
                             <p className="text-xs text-gray-600 max-w-sm line-clamp-2 leading-relaxed font-mono italic">
                               {designSet.slides[activeSlideIndex].prompt}
                             </p>
                             
                             {!generatingImages[designSet.slides[activeSlideIndex].name] && (
                               <button 
                                 onClick={() => handleGenerateImage(designSet.slides[activeSlideIndex].name, designSet.slides[activeSlideIndex].prompt)}
                                 className="mt-8 px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
                               >
                                 Ignite Visualization
                               </button>
                             )}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                    
                    {/* Floating Slide Header */}
                    <div className="absolute top-8 left-8 z-10 pointer-events-none">
                      <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 inline-flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Masterplan Design System</span>
                      </div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter text-white drop-shadow-2xl">
                        {designSet.slides[activeSlideIndex].name}
                      </h2>
                    </div>
                  </div>

                  {/* Analysis Content */}
                  <div className="p-10 flex-1 flex flex-col bg-gradient-to-b from-transparent to-gray-950/30">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400/80">Analytical Framework & Logic</h3>
                       <div className="flex items-center gap-1">
                          {[...Array(9)].map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === activeSlideIndex ? 'bg-blue-500 w-4' : 'bg-white/10'}`} />
                          ))}
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                      <div className="md:col-span-8 prose prose-invert">
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                          {designSet.slides[activeSlideIndex].analysis}
                        </p>
                      </div>
                      <div className="md:col-span-4 border-l border-white/5 pl-10 space-y-6">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Active Benchmarks</label>
                          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="text-[10px] text-gray-400 leading-tight">Spatial logic synced with {formData.location}'s urban morphology.</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const next = (activeSlideIndex + 1) % designSet.slides.length;
                            setActiveSlideIndex(next);
                            if (!generatedImages[designSet.slides[next].name] && !generatingImages[designSet.slides[next].name]) {
                              handleGenerateImage(designSet.slides[next].name, designSet.slides[next].prompt);
                            }
                          }}
                          className="w-full group bg-white/5 hover:bg-white/10 border border-white/5 p-4 rounded-2xl transition-all flex items-center justify-between"
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Next Strategic Slide</span>
                          <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
    )}
    </div>
  );
};

export default MasterplanDesigner;
