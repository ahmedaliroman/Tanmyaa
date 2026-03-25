
import React from 'react';

interface GeneratorWelcomeProps {
  title: string;
  description: string;
}

const GeneratorWelcome: React.FC<GeneratorWelcomeProps> = ({ title, description }) => {
  return (
    <div className="text-center p-8 bg-black/20 rounded-lg shadow-lg border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center min-h-[300px]">
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-300 max-w-2xl mx-auto">{description}</p>
    </div>
  );
};

export default GeneratorWelcome;
