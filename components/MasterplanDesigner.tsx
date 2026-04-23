
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
  const { userData } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [designSet, setDesignSet] = useState<MasterplanDesignSet | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});

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
      const result = await generateMasterplan(formData, userData?.plan);
      setDesignSet(result);
      setStep(3);
      toast.success("Masterplan DNA calculated. Design set ready for generation.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to generate masterplan logic.");
    } finally {
      setLoading(false);
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
    <div className="min-h-[calc(100vh-200px)] text-white font-sans max-w-6xl mx-auto py-12 px-4 shadow-2xl rounded-3xl backdrop-blur-xl border border-white/5 bg-black/40">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 bg-blue-500 rounded text-[10px] font-black uppercase tracking-tighter text-white">Elite Service</div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Master Plan Designer</h1>
          </div>
          <p className="text-gray-400 text-lg">Autonomous Spatial Logic & Architectural Integration</p>
        </div>
        <div className="hidden md:flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 text-gray-500'}`}>1</div>
            <div className="w-8 h-[1px] bg-white/10" />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 text-gray-500'}`}>2</div>
            <div className="w-8 h-[1px] bg-white/10" />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 text-gray-500'}`}>3</div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            <div className="space-y-6">
               <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 block ml-1">Spatial Context</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                    <input 
                      type="text"
                      placeholder="e.g., Cairo New Capital, Damietta Port, London Greenwich..."
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 p-5 pl-12 rounded-3xl focus:border-blue-500 outline-none transition-all text-lg font-medium placeholder:text-gray-600 focus:bg-white/10"
                    />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Project Typology</label>
                    <select 
                      value={formData.projectType}
                      onChange={(e) => setFormData({...formData, projectType: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold appearance-none cursor-pointer"
                    >
                      <option value="mixed-use" className="bg-[#050508]">Mixed-Use</option>
                      <option value="residential" className="bg-[#050508]">Residential Case</option>
                      <option value="landscape" className="bg-[#050508]">Landscape/Park</option>
                      <option value="compound" className="bg-[#050508]">Luxury Compound</option>
                      <option value="industrial" className="bg-[#050508]">Industrial Hub</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Urban Density</label>
                    <select 
                      value={formData.density}
                      onChange={(e) => setFormData({...formData, density: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold appearance-none cursor-pointer"
                    >
                      <option value="low" className="bg-[#050508]">Low Density</option>
                      <option value="medium" className="bg-[#050508]">Medium Density</option>
                      <option value="high" className="bg-[#050508]">High Density</option>
                      <option value="ultra-compact" className="bg-[#050508]">Ultra Compact</option>
                    </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Strategic Goal</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g., 15-minute city logic, connected green spines..."
                    value={formData.goal}
                    onChange={(e) => setFormData({...formData, goal: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl resize-none outline-none focus:border-blue-500 text-sm placeholder:text-gray-600 focus:bg-white/10"
                  />
               </div>

               <button 
                onClick={() => setStep(2)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-3"
               >
                 Advance to DNA Configuration <ArrowRight className="w-5 h-5" />
               </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center group hover:bg-white/[0.07] transition-all cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-10 h-10 text-gray-400 group-hover:text-blue-400" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Upload Site Boundary</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                  Attach an aerial photo or site plan. I will analyze the geometry and red boundaries (Real-time computer vision coming soon).
                </p>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 block ml-1 flex items-center gap-2">
                  <Database className="w-4 h-4" /> Functional Program Components
                </label>
                <textarea 
                  rows={6}
                  placeholder="e.g., 50% Villas, 30% Townhouses, 10% Retail Mall, 5% School, 5% Mosque..."
                  value={formData.program}
                  onChange={(e) => setFormData({...formData, program: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl resize-none outline-none focus:border-blue-500 text-sm placeholder:text-gray-600 focus:bg-white/10 font-mono"
                />
                <p className="text-[10px] text-gray-500 italic p-2 bg-white/5 rounded-xl border border-white/5">
                  Pro tip: Define percentages to ensure spatial logic matches financial benchmarks.
                </p>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-purple-400 block ml-1 flex items-center gap-2">
                  <Box className="w-4 h-4" /> Architectural Parameters (Optional)
                </label>
                <textarea 
                  rows={6}
                  placeholder="e.g., Max build height 12m, Modern Islamic aesthetic, Rooftop gardening integration..."
                  value={formData.archInputs}
                  onChange={(e) => setFormData({...formData, archInputs: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl resize-none outline-none focus:border-purple-500 text-sm placeholder:text-gray-600 focus:bg-white/10 font-mono"
                />
                <p className="text-[10px] text-gray-500 italic p-2 bg-white/5 rounded-xl border border-white/5">
                  These inputs will govern the generated unit typologies and block distributions.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(1)}
                className="flex-[1] bg-white/5 border border-white/10 hover:bg-white/10 text-white py-5 rounded-3xl font-black uppercase tracking-widest transition-all"
              >
                Back
              </button>
              <button 
                disabled={loading}
                onClick={handleGenerate}
                className="flex-[3] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-5 rounded-3xl font-black uppercase tracking-widest transition-all relative overflow-hidden group shadow-2xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin" /> Synthesizing Masterplan DNA...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3 group-hover:scale-105 transition-transform">
                    Initialize System Design <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && designSet && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Masterplan DNA Breakdown */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                   <div className="w-2 h-8 bg-blue-500" /> System DNA: Spatial Logic
                 </h2>
                 <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-xs font-black flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4" /> Logic Locked & Validated
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {renderDNACard("Urban Structure", designSet.dna.structure, <Layers className="w-4 h-4" />)}
                {renderDNACard("Main Spine", designSet.dna.mainAxis, <ArrowRight className="w-4 h-4" />)}
                {renderDNACard("Intensity Nodes", designSet.dna.nodes, <Zap className="w-4 h-4" />)}
                {renderDNACard("Land Use Logic", designSet.dna.landUse, <Map className="w-4 h-4" />)}
                {renderDNACard("Density Pattern", designSet.dna.density, <Layout className="w-4 h-4" />)}
                {renderDNACard("Eco-System", designSet.dna.greenSpaces, <Users className="w-4 h-4" />)}
                {renderDNACard("Smart Mobility", designSet.dna.movement, <Send className="w-4 h-4" />)}
                {renderDNACard("Civic Services", designSet.dna.services, <Building2 className="w-4 h-4" />)}
              </div>
            </div>

            {/* Design Set Slides */}
            <div className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <div className="w-2 h-8 bg-purple-500" /> Strategic Design Set
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {designSet.slides.map((slide, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden flex flex-col group hover:border-white/30 transition-all hover:bg-white/[0.07]">
                    <div className="aspect-video bg-black/40 relative group">
                      {generatedImages[slide.name] ? (
                        <img src={generatedImages[slide.name]} alt={slide.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                           <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/5 group-hover:scale-110 transition-transform">
                              {generatingImages[slide.name] ? <Loader2 className="w-6 h-6 animate-spin text-blue-400" /> : <Eye className="w-6 h-6 text-gray-600 group-hover:text-gray-400" />}
                           </div>
                           <p className="text-xs text-gray-500 uppercase tracking-widest font-black mb-1">{slide.name}</p>
                           <p className="text-[10px] text-gray-700 italic px-4 line-clamp-3 group-hover:text-gray-500 transition-colors">
                              {slide.prompt}
                           </p>
                        </div>
                      )}
                      
                      {!generatedImages[slide.name] && (
                        <button 
                          disabled={generatingImages[slide.name]}
                          onClick={() => handleGenerateImage(slide.name, slide.prompt)}
                          className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 bg-black/80 backdrop-blur-sm transition-all flex items-center justify-center"
                        >
                          <div className="bg-white text-black px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform">
                            {generatingImages[slide.name] ? 'Synthesizing...' : 'Generate Visualization'}
                          </div>
                        </button>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-black text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded uppercase tracking-tighter">Slide {idx + 1}</span>
                        <h3 className="font-black text-sm uppercase tracking-widest text-white/90">{slide.name}</h3>
                      </div>
                      <p className="text-gray-500 text-xs leading-relaxed mb-6 flex-1">
                        Professional spatial analysis visualization. Adheres to DNA constraints regarding nodes, spines, and land-use distribution.
                      </p>
                      <button className="w-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white py-3 rounded-xl border border-white/5 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                        <Download className="w-3 h-3" /> Export Component
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between p-8 bg-blue-500/5 rounded-[2.5rem] border border-blue-500/10">
               <div>
                  <h3 className="text-lg font-black uppercase tracking-widest mb-1 text-white">Full Blueprint Ready</h3>
                  <p className="text-gray-400 text-sm">Download the complete technical package including DNA JSON and 8K visual assets.</p>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Restart</button>
                  <button className="px-10 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1 shadow-xl">Download All Assets</button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credits Footer */}
      <div className="mt-12 text-center border-t border-white/5 pt-8">
        <p className="text-gray-600 text-[10px] uppercase tracking-[0.5em] font-black">
          Powered by Tanmyaa Urban Intelligence System &bull; 2025
        </p>
      </div>
    </div>
  );
};

export default MasterplanDesigner;
