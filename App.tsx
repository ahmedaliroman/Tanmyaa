
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import InstantChat from './components/InstantChat';
import PolicyStrategyGenerator from './components/PolicyStrategyGenerator';
import CapacityBuildingGenerator from './components/CapacityBuildingGenerator';
import PresentationGenerator from './components/UrbanPlanningStudyGenerator';
import RFPGenerator from './components/RFPGenerator';
import VisionFrameworkGenerator from './components/VisionFrameworkGenerator';
import StakeholderPlanGenerator from './components/StakeholderPlanGenerator';
import SubscriptionPage from './components/SubscriptionPage';
import MethodologyGenerator from './components/MethodologyGenerator';
import AuthCallback from './components/AuthCallback';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const AppContent: React.FC<{
  view: { page: 'home' | 'service' | 'subscription', serviceId: string | null },
  hasApiKey: boolean,
  handleConnectApiKey: () => void,
  handleNavigate: (page: 'home' | 'subscription') => void,
  renderPage: () => React.ReactNode
}> = ({ view, hasApiKey, handleConnectApiKey, handleNavigate, renderPage }) => {
  const { authError } = useAuth();

  return (
    <div className="min-h-screen bg-transparent text-gray-200">
      {authError && (
          <div className="bg-red-600 text-white py-3 px-4 text-center text-sm font-bold animate-fade-in flex flex-col items-center justify-center gap-1 sticky top-0 z-[70]">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Database Error: {authError}</span>
              </div>
              <p className="text-xs opacity-90 font-normal">Please run the SQL in <code className="bg-black/20 px-1 rounded">supabase/schema.sql</code> in your Supabase SQL Editor to fix this.</p>
          </div>
      )}
      {!hasApiKey && window.aistudio && (
          <div className="bg-blue-600 text-white py-2 px-4 text-center text-sm font-bold animate-fade-in flex items-center justify-center gap-4 sticky top-0 z-[60]">
              <span>Connect your Gemini API Key to enable AI features on this domain.</span>
              <button onClick={handleConnectApiKey} className="bg-white text-blue-600 px-4 py-1 rounded-full text-xs hover:bg-gray-100 transition-colors">
                  Connect Key
              </button>
          </div>
      )}

      <Header 
        onNavigate={handleNavigate} 
        showHomeButton={view.page !== 'home'} 
        hasApiKey={hasApiKey}
        onSelectKey={handleConnectApiKey}
      />
      <main className="container mx-auto p-4 md:p-8 relative">
        <div className="max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>
      <InstantChat onUpgrade={() => handleNavigate('subscription')} />
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<{ page: 'home' | 'service' | 'subscription', serviceId: string | null }>({ page: 'home', serviceId: null });
  const [isPageExiting, setIsPageExiting] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  const initialOptions = {
    "client-id": "test", // Replace with your real client ID
    currency: "USD",
    intent: "capture",
  };

  useEffect(() => {
    // Check for API key status if window.aistudio is available (typical for custom domain embeds)
    const checkApiKey = async () => {
        if (window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setHasApiKey(hasKey);
        }
    };
    checkApiKey();
  }, []);

  const handleConnectApiKey = async () => {
      if (window.aistudio) {
          await window.aistudio.openSelectKey();
          setHasApiKey(true); // Assume success per guidelines
      }
  };

  const handleNavigate = (page: 'home' | 'subscription') => {
    if (view.page === page) return;
    setIsPageExiting(true);
    setTimeout(() => {
        setView({ page, serviceId: null });
        setIsPageExiting(false);
    }, 500);
  };
  
  const handleSelectService = (serviceId: string) => {
    setIsPageExiting(true);
    setTimeout(() => {
        setView({ page: 'service', serviceId });
        setIsPageExiting(false);
    }, 500);
  };

  const renderService = () => {
    const props = { 
      onUpgrade: () => handleNavigate('subscription'), 
    };
    switch (view.serviceId) {
      case 'urban-planning-study':
        return <PresentationGenerator {...props} />;
      case 'policy-strategy':
        return <PolicyStrategyGenerator {...props} />;
      case 'rfp-generator':
        return <RFPGenerator {...props} />;
      case 'capacity-building':
        return <CapacityBuildingGenerator {...props} />;
      case 'vision-framework':
        return <VisionFrameworkGenerator {...props} />;
      case 'stakeholder-planning':
        return <StakeholderPlanGenerator {...props} />;
      case 'methodology-generator':
        return <MethodologyGenerator {...props} />;
      default:
        return (
          <div className="text-center p-8 bg-black/20 rounded-lg shadow-lg border border-white/10 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-2">Service Not Found</h2>
            <p className="text-gray-400">The requested service does not exist.</p>
          </div>
        );
    }
  };
  
  const renderPage = () => {
    switch (view.page) {
      case 'home':
        return (
            <div className={isPageExiting && view.serviceId !== null ? 'animate-slide-out-left' : 'animate-fade-in'}>
                <HomePage onSelectService={handleSelectService} />
            </div>
        );
      case 'subscription':
         return (
             <div className={isPageExiting ? 'animate-slide-out-left' : 'animate-slide-in-right'}>
                <SubscriptionPage />
            </div>
        );
      case 'service':
        return (
             <div className={isPageExiting ? 'animate-slide-out-left' : 'animate-slide-in-right'}>
                {renderService()}
            </div>
        );
      default:
        return <HomePage onSelectService={handleSelectService} />;
    }
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <AuthProvider>
        {window.location.pathname.startsWith('/auth/callback') ? (
            <AuthCallback />
        ) : (
            <AppContent 
                view={view}
                hasApiKey={hasApiKey}
                handleConnectApiKey={handleConnectApiKey}
                handleNavigate={handleNavigate}
                renderPage={renderPage}
            />
        )}
      </AuthProvider>
    </PayPalScriptProvider>
  );
};

export default App;