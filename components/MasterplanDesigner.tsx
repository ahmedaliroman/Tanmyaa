
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
      toast.success("Masterplan DNA calculated. Design set ready for generation.");
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
      </>
      )}
    </div>
  );
};

export default MasterplanDesigner;
