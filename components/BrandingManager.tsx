import React, { useState } from 'react';
import { toast } from 'sonner';
import { useBranding } from '@/hooks/useBranding';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { FileText, Upload, X, Check, Image as ImageIcon } from 'lucide-react';

const BrandingManager: React.FC = () => {
    const { profile } = useAuth();
    const { 
        logo, saveLogo, removeLogo, 
        colors, saveColors, removeColors,
        presentationTemplate, savePresentationTemplate, removePresentationTemplate,
        presentationTemplateUrl, savePresentationTemplateUrl, removePresentationTemplateUrl,
        reportTemplate, saveReportTemplate, removeReportTemplate,
        reportTemplateUrl, saveReportTemplateUrl, removeReportTemplateUrl
    } = useBranding();

    const [logoPreview, setLogoPreview] = useState<string | null>(logo);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [colorsText, setColorsText] = useState(colors || '');
    
    // Presentation Template State
    const [presentationTemplateText, setPresentationTemplateText] = useState(presentationTemplate || '');
    const [presentationFile, setPresentationFile] = useState<File | null>(null);
    
    // Report Template State
    const [reportTemplateText, setReportTemplateText] = useState(reportTemplate || '');
    const [reportFile, setReportFile] = useState<File | null>(null);

    const [isSaving, setIsSaving] = useState(false);
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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'presentation' | 'report') => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            const isPdf = selectedFile.type === 'application/pdf';
            const isImage = selectedFile.type.startsWith('image/');
            
            if (!isPdf && !isImage) {
                toast.error("Please upload a PDF or an Image file.");
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error("File is too large. Please upload a file under 5MB.");
                return;
            }
            
            if (type === 'presentation') {
                setPresentationFile(selectedFile);
            } else {
                setReportFile(selectedFile);
            }
        }
    };

    const uploadBrandingFile = async (file: File, prefix: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile?.id}/${prefix}_${Date.now()}.${fileExt}`;
        
        const { data, error: uploadError } = await supabase.storage
            .from('branding')
            .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('branding')
            .getPublicUrl(data.path);
        
        return publicUrl;
    };

    const handleSaveAll = async () => {
        if (!isBusiness) {
            toast.error("Custom branding is only available for Business plan users.");
            return;
        }

        setIsSaving(true);
        try {
            let finalLogoUrl = logo;
            let finalPresentationUrl = presentationTemplateUrl;
            let finalReportUrl = reportTemplateUrl;

            // 1. Handle Logo Upload (if new file)
            if (logoPreview && logoFile) {
                saveLogo(logoPreview);
                finalLogoUrl = logoPreview;
            }
            
            // 2. Handle Presentation Template Upload
            if (presentationFile) {
                finalPresentationUrl = await uploadBrandingFile(presentationFile, 'presentation');
                savePresentationTemplateUrl(finalPresentationUrl);
                setPresentationFile(null);
            }

            // 3. Handle Report Template Upload
            if (reportFile) {
                finalReportUrl = await uploadBrandingFile(reportFile, 'report');
                saveReportTemplateUrl(finalReportUrl);
                setReportFile(null);
            }

            // 4. Save Text Fields
            if (colorsText.trim()) {
                saveColors(colorsText);
            } else {
                removeColors();
            }

            if (presentationTemplateText.trim()) {
                savePresentationTemplate(presentationTemplateText);
            } else {
                removePresentationTemplate();
            }

            if (reportTemplateText.trim()) {
                saveReportTemplate(reportTemplateText);
            } else {
                removeReportTemplate();
            }

            // 5. Sync to Supabase Profile
            const { error: syncError } = await supabase
                .from('profiles')
                .update({
                    branding_logo: finalLogoUrl,
                    branding_colors: colorsText.trim() || null,
                    branding_presentation_template: presentationTemplateText.trim() || null,
                    branding_presentation_template_url: finalPresentationUrl,
                    branding_report_template: reportTemplateText.trim() || null,
                    branding_report_template_url: finalReportUrl
                })
                .eq('id', profile?.id);

            if (syncError) throw syncError;

            toast.success("Your branding settings have been saved and synced!");
        } catch (err: unknown) {
            console.error("Error saving branding:", err);
            const message = err instanceof Error ? err.message : String(err);
            toast.error(`Failed to save branding: ${message}`);
        } finally {
            setIsSaving(false);
        }
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
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-300">Presentation Template / Style</label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Text Description</p>
                            <textarea 
                                value={presentationTemplateText}
                                onChange={(e) => setPresentationTemplateText(e.target.value)}
                                placeholder="e.g., Minimalist Swiss design, bold typography, high-contrast imagery, and spacious layouts. Focus on technical clarity."
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors h-32"
                            />
                            <p className="text-[10px] text-gray-500 italic">Describe the visual tone and layout style.</p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Attachment (Visual Reference)</p>
                            <div className="h-32 bg-black/30 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center p-4 transition-colors hover:border-blue-500/50 group relative">
                                {presentationFile ? (
                                    <div className="flex flex-col items-center text-center">
                                        {presentationFile.type === 'application/pdf' ? <FileText className="w-8 h-8 text-blue-400 mb-2" /> : <ImageIcon className="w-8 h-8 text-blue-400 mb-2" />}
                                        <span className="text-xs text-white font-medium truncate max-w-[180px]">{presentationFile.name}</span>
                                        <button 
                                            onClick={() => setPresentationFile(null)}
                                            className="absolute top-2 right-2 p-1 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : presentationTemplateUrl ? (
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative">
                                            <FileText className="w-8 h-8 text-green-400 mb-2" />
                                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                                                <Check size={8} className="text-black" />
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-300">Template Active</span>
                                        <div className="flex gap-2 mt-2">
                                            <a 
                                                href={presentationTemplateUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-[10px] text-blue-400 hover:underline"
                                            >
                                                View Current
                                            </a>
                                            <button 
                                                onClick={() => {
                                                    removePresentationTemplateUrl();
                                                    toast.success("Presentation template removed.");
                                                }}
                                                className="text-[10px] text-red-400 hover:underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-gray-500 mb-2 group-hover:text-blue-400 transition-colors" />
                                        <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Upload PDF or Image</p>
                                        <input 
                                            type="file" 
                                            onChange={(e) => handleFileChange(e, 'presentation')}
                                            accept=".pdf,image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </>
                                )}
                            </div>
                            <p className="text-[10px] text-gray-500 italic">Upload a sample presentation, brand guide, or image for the AI to analyze.</p>
                        </div>
                    </div>
                </div>

                {/* Reports Template Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-300">Reports / Documents Template</label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Text Description</p>
                            <textarea 
                                value={reportTemplateText}
                                onChange={(e) => setReportTemplateText(e.target.value)}
                                placeholder="e.g., Formal corporate reports, serif fonts for body text, clean tables, and professional headers. Consistent with our policy brief standards."
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors h-32"
                            />
                            <p className="text-[10px] text-gray-500 italic">Describe the document structure and formatting style.</p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Attachment (Visual Reference)</p>
                            <div className="h-32 bg-black/30 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center p-4 transition-colors hover:border-blue-500/50 group relative">
                                {reportFile ? (
                                    <div className="flex flex-col items-center text-center">
                                        {reportFile.type === 'application/pdf' ? <FileText className="w-8 h-8 text-blue-400 mb-2" /> : <ImageIcon className="w-8 h-8 text-blue-400 mb-2" />}
                                        <span className="text-xs text-white font-medium truncate max-w-[180px]">{reportFile.name}</span>
                                        <button 
                                            onClick={() => setReportFile(null)}
                                            className="absolute top-2 right-2 p-1 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : reportTemplateUrl ? (
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative">
                                            <FileText className="w-8 h-8 text-green-400 mb-2" />
                                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                                                <Check size={8} className="text-black" />
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-300">Report Template Active</span>
                                        <div className="flex gap-2 mt-2">
                                            <a 
                                                href={reportTemplateUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-[10px] text-blue-400 hover:underline"
                                            >
                                                View Current
                                            </a>
                                            <button 
                                                onClick={() => {
                                                    removeReportTemplateUrl();
                                                    toast.success("Report template removed.");
                                                }}
                                                className="text-[10px] text-red-400 hover:underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-gray-500 mb-2 group-hover:text-blue-400 transition-colors" />
                                        <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Upload PDF or Image</p>
                                        <input 
                                            type="file" 
                                            onChange={(e) => handleFileChange(e, 'report')}
                                            accept=".pdf,image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </>
                                )}
                            </div>
                            <p className="text-[10px] text-gray-500 italic">Upload a sample report or document template for the AI to follow.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-8">
                <button 
                    onClick={handleSaveAll} 
                    disabled={!isBusiness || isSaving}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSaving ? 'Saving...' : 'Save Branding Settings'}
                </button>
            </div>
        </div>
    );
};

export default BrandingManager;
