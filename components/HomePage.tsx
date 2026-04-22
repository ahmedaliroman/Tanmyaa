
import React from 'react';

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
const IconDeepUnderstanding: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);


const services = [
  { id: 'urban-planning-study', title: 'Presentation', description: 'Generate a comprehensive, structured presentation from problem to implementation.', icon: <IconPresentation /> },
  { id: 'urban-deep-understanding', title: 'Deep Understanding', description: 'Illustrate urban topics with interactive charts, projections, and examples in a Policy Brief style.', icon: <IconDeepUnderstanding /> },
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


interface HomePageProps {
  onSelectService: (serviceId: string) => void;
}

import { motion } from 'motion/react';

const AnimatedHero = () => {
    const slogan = "Advancing cities together!";
    const words = slogan.split(' ');

    const scrollToServices = () => {
        document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="w-full min-h-[calc(100vh-80px)] relative flex flex-col items-center justify-center font-sans tracking-tight">
            <div className="flex-1 flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center relative z-10"
                >
                    {/* Logo Animation */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 1 }}
                    >
                        <h2 className="text-7xl md:text-9xl font-black text-white mb-6 drop-shadow-2xl tracking-tighter">
                            Tanmyaa<span className="text-blue-400">.</span>
                        </h2>
                    </motion.div>

                    {/* Word-by-word Bottom-to-Top Slogan Animation */}
                    <div className="flex flex-wrap justify-center gap-x-3 overflow-hidden py-2">
                        {words.map((word, i) => (
                            <div key={i} className="overflow-hidden">
                                <motion.span
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{
                                        delay: 1.2 + (i * 0.2),
                                        duration: 0.8,
                                        ease: [0.16, 1, 0.3, 1]
                                    }}
                                    className="block text-xl md:text-3xl text-white/80 font-medium tracking-wide"
                                >
                                    {word}
                                </motion.span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Scroll Down Arrow */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3, duration: 1 }}
                onClick={scrollToServices}
                className="mb-12 group flex flex-col items-center gap-3 cursor-pointer"
            >
                <span className="text-xs font-sans font-bold text-white/70 uppercase tracking-widest group-hover:text-white transition-colors">Discover Services</span>
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 group-hover:border-white/50 transition-colors"
                >
                    <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </motion.div>
            </motion.button>

            {/* Background subtle atmospheric glows */}
            <motion.div 
                animate={{ 
                    y: [0, -20, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] -z-10"
            />
            <motion.div 
                animate={{ 
                    y: [0, 20, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] -z-10"
            />
        </div>
    );
};

const HomePage: React.FC<HomePageProps> = ({ onSelectService }) => {
  return (
    <div className="w-full">
      {/* Hero Section - Full Page */}
      <section className="animate-fade-in">
        <AnimatedHero />
      </section>
      
      {/* Services Section - Below the fold */}
      <section id="services-section" className="py-32 px-4 bg-transparent">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">Our Services</h2>
                <p className="text-gray-400 font-sans text-lg tracking-normal">Specialized Urban Solutions</p>
                <div className="w-20 h-1 bg-blue-500 mx-auto rounded-full" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service, index) => (
                    <div key={service.id} className="animate-card-enter flex justify-center" style={{ animationDelay: `${index * 100}ms`}}>
                        <ServiceCard
                            service={service}
                            onClick={() => onSelectService(service.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;