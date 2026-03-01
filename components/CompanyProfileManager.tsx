import React, { useState } from 'react';
import { useCompanyProfile } from '../hooks/useCompanyProfile';

const CompanyProfileManager: React.FC = () => {
    const { companyProfile, saveProfile, removeProfile, isLoaded } = useCompanyProfile();
    const [profileText, setProfileText] = useState(() => companyProfile || '');



    const handleSave = () => {
        saveProfile(profileText);
        alert("Your company profile has been saved!");
    };

    const handleRemove = () => {
        removeProfile();
        setProfileText('');
        alert("Your company profile has been removed.");
    };

    if (!isLoaded) {
        return <div className="bg-black/20 p-6 rounded-lg h-48 animate-pulse"></div>;
    }

    return (
        <div className="bg-black/20 p-6 rounded-lg shadow-lg border border-white/10 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white">Company Profile & Persona</h3>
            <p className="text-sm text-gray-400 mt-1 mb-4">
                Define how the system should behave. Provide instructions on tone, style, and specific terminology to ensure all generations are aligned with your company&apos;s brand. This will act as a system-wide instruction.
            </p>
            <textarea
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                placeholder="e.g., Our company, UrbanNext, uses a formal, data-driven tone. Always refer to 'districts' as 'precincts' and 'stakeholders' as 'partners'. Our reports should be optimistic but realistic."
                className="w-full h-32 p-3 bg-black/30 border border-white/20 rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            />
             <div className="flex justify-end gap-4 mt-4">
                {companyProfile && (
                    <button onClick={handleRemove} className="bg-red-500/10 text-red-400 font-bold py-2 px-4 rounded-xl text-sm hover:bg-red-500/20 transition duration-300">
                        Remove Profile
                    </button>
                )}
                <button onClick={handleSave} disabled={!profileText.trim()} className="bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold py-2 px-4 rounded-xl hover:bg-white/30 disabled:bg-white/10 disabled:text-gray-400 disabled:cursor-not-allowed">
                    Save Profile
                </button>
            </div>
        </div>
    );
};

export default CompanyProfileManager;