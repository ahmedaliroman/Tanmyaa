import React, { useState } from 'react';
import { toast } from 'sonner';
import { useBranding } from '../hooks/useBranding';
import { useAuth } from '../context/AuthContext';

const BrandingManager: React.FC = () => {
    const { profile } = useAuth();
    const { 
        logo, saveLogo, removeLogo, 
        colors, saveColors, removeColors,
        template, saveTemplate, removeTemplate
    } = useBranding();

    const [logoPreview, setLogoPreview] = useState<string | null>(logo);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [colorsText, setColorsText] = useState(colors || '');
    const [templateText, setTemplateText] = useState(template || '');
    const [error, setError] = useState<string | null>(null);

    const isBusiness = profile?.plan === 'Business';

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 2 * 1024 * 1024) { // 2MB limit
                setError("File is too large. Please upload an image under 2MB.");
                return;
            }
            setError(null);
            setLogoFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSaveAll = () => {
        if (!isBusiness) {
            toast.error("Custom branding is only available for Business plan users.");
            return;
        }

        if (logoPreview && logoFile) {
            saveLogo(logoPreview);
        }
        
        if (colorsText.trim()) {
            saveColors(colorsText);
        } else {
            removeColors();
        }

        if (templateText.trim()) {
            saveTemplate(templateText);
        } else {
            removeTemplate();
        }

        toast.success("Your branding settings have been saved!");
    };

    const handleRemoveLogo = () => {
        removeLogo();
        setLogoPreview(null);
        setLogoFile(null);
        toast.success("Your custom logo has been removed.");
    };

    return (
        <div className="bg-black/20 p-6 rounded-lg shadow-lg border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Custom Branding & Style</h3>
                {!isBusiness && (
                    <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border border-blue-500/30">
                        Business Feature
                    </span>
                )}
            </div>
            
            <p className="text-sm text-gray-400 mt-1 mb-6">
                This feature is available on the **Business plan**. Define your brand identity to force all generated data, presentations, and reports to follow your specific style.
            </p>

            <div className={`space-y-8 ${!isBusiness ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Logo Section */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-300">Company Logo</label>
                    <div className="flex items-center gap-6">
                        <div className="w-32 h-32 bg-black/30 rounded-md flex items-center justify-center border border-white/20 flex-shrink-0">
                            {logoPreview ? (
                                <img src={logoPreview || undefined} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                            ) : (
                                <span className="text-xs text-gray-500">No Logo</span>
                            )}
                        </div>
                        <div className="flex-grow">
                            <input
                                type="file"
                                id="logo-upload"
                                className="hidden"
                                accept="image/png, image/jpeg, image/svg+xml"
                                onChange={handleLogoChange}
                            />
                            <label htmlFor="logo-upload" className="bg-white/10 text-white font-bold py-2 px-4 rounded-xl text-sm hover:bg-white/20 transition duration-300 cursor-pointer inline-block">
                                Choose Image...
                            </label>
                            {logoFile && <span className="ml-4 text-sm text-gray-300 truncate">{logoFile.name}</span>}
                            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                            {logo && (
                                <button onClick={handleRemoveLogo} className="block mt-2 text-xs text-red-400 hover:text-red-300 transition-colors">
                                    Remove Current Logo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Color Palette Section */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-300">Color Palette</label>
                    <textarea 
                        value={colorsText}
                        onChange={(e) => setColorsText(e.target.value)}
                        placeholder="e.g., Primary: #0047AB, Secondary: #F5F5F5, Accents: Gold and Navy. Use professional and clean tones."
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors h-24"
                    />
                    <p className="text-[10px] text-gray-500 italic">Describe your primary, secondary, and accent colors or provide hex codes.</p>
                </div>

                {/* Presentation Template Section */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-300">Presentation Template / Style</label>
                    <textarea 
                        value={templateText}
                        onChange={(e) => setTemplateText(e.target.value)}
                        placeholder="e.g., Minimalist Swiss design, bold typography, high-contrast imagery, and spacious layouts. Focus on technical clarity."
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors h-24"
                    />
                    <p className="text-[10px] text-gray-500 italic">Describe the visual tone, typography preferences, and layout style for your presentations.</p>
                </div>
            </div>

            <div className="flex justify-end mt-8">
                <button 
                    onClick={handleSaveAll} 
                    disabled={!isBusiness}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Save Branding Settings
                </button>
            </div>
        </div>
    );
};

export default BrandingManager;
