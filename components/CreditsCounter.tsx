import React, { useState, useEffect } from 'react';

const CreditsCounter: React.FC = () => {
    const [remaining, setRemaining] = useState<number | null>(null);

    useEffect(() => {
        const fetchCredits = async () => {
            try {
                const response = await fetch('/api/credits');
                if (response.ok) {
                    const data = await response.json();
                    setRemaining(data.remaining);
                }
            } catch (error) {
                console.error('Failed to fetch credits:', error);
            }
        };

        fetchCredits();
        // Set up an interval to refresh the credits every 30 seconds
        const intervalId = setInterval(fetchCredits, 30000);

        return () => clearInterval(intervalId);
    }, []);

    if (remaining === null) {
        return null; // Don't render anything until credits are fetched
    }

    return (
        <div className="fixed bottom-5 left-5 z-50 bg-white/10 backdrop-blur-lg text-white py-2 px-4 rounded-full text-sm font-bold border border-white/20">
            <span>Credits Remaining: {remaining}</span>
        </div>
    );
};

export default CreditsCounter;
