
import React, { useRef } from 'react';

// --- ICONS TO MATCH USER'S DESIGN ---
const IconPresentation: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM9 12h6" />
    </svg>
);
const IconPolicyBrief: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
const IconVisionFramework: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464A5 5 0 108.464 15.536" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
);
const IconStakeholderPlan: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.274-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.274.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const IconRFPGenerator: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);
const IconCapacityBuilding: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM12 9.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM12 14.5a3 3 0 00-3 3v2a1 1 0 001 1h4a1 1 0 001-1v-2a3 3 0 00-3-3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 19v-2a3 3 0 00-3-3h-1.5" />
    </svg>
);
const IconMethodology: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-1.717-.968-3.235-2.435-3.996a4.501 4.501 0 00-5.11 1.423c-1.127.99-1.828 2.378-1.828 3.91V16.5a2.25 2.25 0 002.25 2.25h4.5a2.25 2.25 0 002.25-2.25v-2.09c0-.813.386-1.583.99-2.08l.01-.01c.09-.07.18-.14.27-.2v-.22c0-.813.386-1.583.99-2.08l.01-.01c.09-.07.18-.14.27-.2v-.22Z" />
    </svg>
);


const services = [
  { id: 'urban-planning-study', title: 'Presentation', description: 'Generate a comprehensive, structured presentation from problem to implementation.', icon: <IconPresentation /> },
  { id: 'policy-strategy', title: 'Policy Brief', description: 'Transform complex project briefs into clear, actionable policy reports.', icon: <IconPolicyBrief /> },
  { id: 'vision-framework', title: 'Vision & Strategic Framework', description: 'Draft compelling urban visions and translate them into strategic, actionable frameworks.', icon: <IconVisionFramework /> },
  { id: 'stakeholder-planning', title: 'Stakeholder Engagement Plan', description: 'Generate structured plans to identify, map, and engage with key project stakeholders.', icon: <IconStakeholderPlan /> },
  { id: 'rfp-generator', title: 'RFP & ToR Generator', description: 'Prepare comprehensive Request for Proposals and Terms of Reference documents.', icon: <IconRFPGenerator /> },
  { id: 'capacity-building', title: 'Capacity Building Advisory', description: 'Design a tailored training curriculum to enhance your teams planning capabilities.', icon: <IconCapacityBuilding /> },
  { id: 'methodology-generator', title: 'Methodology Generator', description: 'Illustrate step-by-step methodologies for complex urban planning tasks.', icon: <IconMethodology /> },
];

type Service = typeof services[0];

const ServiceCard: React.FC<{ service: Service; onClick: () => void }> = ({ service, onClick }) => {
  const iconComponent = React.cloneElement(service.icon, {
    className: `w-10 h-10 text-gray-400 transition-colors duration-300 group-hover:text-gray-200`
  });

  return (
    <button
      onClick={onClick}
      className={`group relative w-72 h-72 bg-transparent border border-gray-800 rounded-full flex flex-col items-center justify-center text-center p-6 cursor-pointer transition-colors duration-300 hover:border-gray-600`}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="mb-4">
            {iconComponent}
        </div>
        <div>
            <h3 className="text-lg font-bold text-white">{service.title}</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-[90%] mx-auto">{service.description}</p>
        </div>
      </div>
    </button>
  );
};

const InteractiveHeader = () => {
  const text = "Advancing Cities Worldwide";
  const containerRef = useRef<HTMLHeadingElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLHeadingElement>) => {
    if (!containerRef.current) return;
    const { clientX, clientY } = e;

    for (const span of Array.from(containerRef.current.children)) {
      // Fix: Cast the iterated element to HTMLElement to resolve TypeScript error.
      // The children of the h1 are guaranteed to be span elements.
      const htmlSpan = span as HTMLElement;
      const { left, top, width, height } = htmlSpan.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = 150;
      const effect = Math.max(0, 1 - distance / maxDistance);
      const translateY = -10 * effect;
      const blur = 20 * effect;
      htmlSpan.style.transform = `translateY(${translateY}px)`;
      htmlSpan.style.textShadow = `0px ${blur/2}px ${blur}px rgba(255, 255, 255, 0.4)`;
      htmlSpan.style.color = `rgba(255, 255, 255, ${1 - effect * 0.2})`;
    }
  };

  const handleMouseLeave = () => {
    if (!containerRef.current) return;
    for (const span of Array.from(containerRef.current.children)) {
      const htmlSpan = span as HTMLElement;
      htmlSpan.style.transform = 'translateY(0px)';
      htmlSpan.style.textShadow = 'none';
      htmlSpan.style.color = 'white';
    }
  };

  return (
    <h1
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="text-6xl md:text-8xl font-black text-white tracking-tighter"
      aria-label={text}
    >
      {text.split('').map((char, index) => (
        <span
          key={index}
          className="inline-block transition-all duration-200 ease-out"
          style={{ transitionProperty: 'transform, color, text-shadow' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </h1>
  );
};


interface HomePageProps {
  onSelectService: (serviceId: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSelectService }) => {
  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center justify-center py-20">
      <div className="text-center mb-16 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <InteractiveHeader />
        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-400 font-normal">
          Your partner in urban innovation.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {services.map((service, index) => (
            <div key={service.id} className="animate-card-enter flex justify-center" style={{ animationDelay: `${250 + index * 75}ms`}}>
                <ServiceCard
                    service={service}
                    onClick={() => onSelectService(service.id)}
                />
            </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;