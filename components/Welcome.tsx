
import React from 'react';

interface GeneratorWelcomeProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const GeneratorWelcome: React.FC<GeneratorWelcomeProps> = ({ title, description, icon }) => {
  return (
    <div className="text-center p-8 bg-black/20 rounded-lg shadow-lg border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center min-h-[300px]">
      <div className="w-28 h-28 text-cyan-400/30 mb-6">{icon}</div>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-300 max-w-2xl mx-auto">{description}</p>
    </div>
  );
};

export default GeneratorWelcome;
