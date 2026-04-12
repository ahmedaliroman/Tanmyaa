import React from 'react';
import Lottie from 'lottie-react';

// A professional loading animation from a reliable Lottie CDN
const LOADING_ANIMATION_URL = "https://lottie.host/689c991d-6691-496e-953e-0704040083ad/YfXp07wZ6S.json";

const Loader: React.FC = () => {
  const [animationData, setAnimationData] = React.useState<unknown>(null);

  React.useEffect(() => {
    fetch(LOADING_ANIMATION_URL)
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error("Failed to load Lottie animation:", err));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12" aria-label="Loading content">
      <div className="w-48 h-48">
        {animationData ? (
          <Lottie 
            animationData={animationData} 
            loop={true} 
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div className="mt-4 text-center">
        <p className="text-xl font-black text-white tracking-[0.3em] uppercase mb-2">
          Processing
        </p>
        <div className="flex gap-1 justify-center">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
};

export default Loader;
