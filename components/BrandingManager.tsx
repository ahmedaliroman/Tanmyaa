import React, { useState } from 'react';
import { useBranding } from '../hooks/useBranding';

const BrandingManager: React.FC = () => {
    const { logo, saveLogo, removeLogo } = useBranding();
    const [preview, setPreview] = useState<string | null>(logo);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 2 * 1024 * 1024) { // 2MB limit
                setError("File is too large. Please upload an image under 2MB.");
                return;
            }
            setError(null);
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSave = () => {
        if (preview && file) {
            saveLogo(preview);
            alert("Your custom logo has been saved!");
        } else {
            setError("Please select a file to save.");
        }
    };

    const handleRemove = () => {
        removeLogo();
        setPreview(null);
        setFile(null);
        setError(null);
        alert("Your custom logo has been removed.");
    };

    return (
        <div className="bg-black/20 p-6 rounded-lg shadow-lg border border-white/10 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white">Custom Branding</h3>
            <p className="text-sm text-gray-400 mt-1 mb-4">This feature is available on the Business plan. Upload your logo to replace the Tanmyaa branding in all generated reports and exports.</p>
            <div className="flex items-center gap-6">
                <div className="w-32 h-32 bg-black/30 rounded-md flex items-center justify-center border border-white/20 flex-shrink-0">
                    {preview ? (
                        <img src={preview || undefined} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                    ) : (
                         <span className="text-xs text-gray-500">Logo Preview</span>
                    )}
                </div>
                <div className="flex-grow">
                    <input
                        type="file"
                        id="logo-upload"
                        className="hidden"
                        accept="image/png, image/jpeg, image/svg+xml"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="logo-upload" className="bg-white/10 text-white font-bold py-2 px-4 rounded-xl text-sm hover:bg-white/20 transition duration-300 cursor-pointer">
                        Choose Image...
                    </label>
                    {file && <span className="ml-4 text-sm text-gray-300 truncate">{file.name}</span>}
                    {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                </div>
            </div>
             <div className="flex justify-end gap-4 mt-4">
                {logo && (
                    <button onClick={handleRemove} className="bg-red-500/10 text-red-400 font-bold py-2 px-4 rounded-xl text-sm hover:bg-red-500/20 transition duration-300">
                        Remove Logo
                    </button>
                )}
                <button onClick={handleSave} disabled={!file} className="bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold py-2 px-4 rounded-xl hover:bg-white/30 disabled:bg-white/10 disabled:text-gray-400 disabled:cursor-not-allowed">
                    Save Logo
                </button>
            </div>
        </div>
    );
};

export default BrandingManager;