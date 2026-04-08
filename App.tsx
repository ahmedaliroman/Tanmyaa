
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
import UrbanDeepUnderstandingGenerator from './components/UrbanDeepUnderstandingGenerator';
import KnowledgeBaseManager from './components/KnowledgeBaseManager';
import AuthCallback from './components/AuthCallback';
import ResetPasswordPage from './components/ResetPasswordPage';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

// Redesigned iOS-style Error Boundary
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center p-8 text-center font-sans">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-purple-500/10 pointer-events-none" />
          
          <div className="relative z-10 max-w-lg w-full animate-ios-reveal">
            <div className="w-20 h-20 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex items-center justify-center mb-8 mx-auto shadow-2xl">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
                <svg className="w-10 h-10 text-blue-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-black tracking-tight mb-4 text-white">I&apos;ve hit a small snag</h1>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Something unexpected happened while rendering this view. I&apos;m curious to help you fix it—usually a quick refresh clears things up, but I&apos;ve noted the technical details below.
            </p>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl text-left mb-10 w-full overflow-hidden group hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Technical Insight</span>
                <span className="text-[10px] font-mono text-gray-500">Error Code: {this.state.error?.name || 'Unknown'}</span>
              </div>
              <p className="text-sm font-mono text-gray-300 break-all line-clamp-3 group-hover:line-clamp-none transition-all">
                {this.state.error?.message || 'An unspecified rendering error occurred.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto bg-white text-black px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 shadow-xl"
              >
                Refresh View
              </button>
              <button 
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full sm:w-auto bg-white/5 backdrop-blur-md border border-white/10 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
              >
                Try Again
              </button>
            </div>
            
            <p className="mt-12 text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black">Urban Planning Intelligence System</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC<{
  view: { page: 'home' | 'service' | 'subscription' | 'knowledge-base', serviceId: string | null },
  hasApiKey: boolean,
  handleConnectApiKey: () => void,
  handleNavigate: (page: 'home' | 'subscription' | 'knowledge-base') => void,
  renderPage: () => React.ReactNode
}> = ({ view, hasApiKey, handleConnectApiKey, handleNavigate, renderPage }) => {
  const { authError } = useAuth();

  return (
    <div className="min-h-screen bg-transparent text-gray-200">
      {authError && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 animate-ios-reveal">
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 shadow-2xl flex items-start gap-4">
                  <div className="w-10 h-10 bg-rose-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                  </div>
                  <div className="flex-1">
                      <h3 className="text-white font-black text-sm uppercase tracking-widest mb-1">Database Sync Issue</h3>
                      <p className="text-gray-300 text-xs leading-relaxed mb-3">
                          I&apos;m having trouble connecting to the database. It looks like the schema might need an update.
                      </p>
                      <div className="flex items-center gap-3">
                          <div className="bg-black/40 px-2 py-1 rounded-md border border-white/10">
                              <code className="text-[10px] text-blue-400 font-mono">supabase/schema.sql</code>
                          </div>
                          <button 
                              onClick={() => window.location.reload()}
                              className="text-[10px] font-black uppercase tracking-widest text-white hover:text-blue-400 transition-colors"
                          >
                              Retry Connection
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
      {!hasApiKey && !process.env.GEMINI_API_KEY && window.aistudio && (
          <div className="bg-blue-600/90 backdrop-blur-md text-white py-2 px-4 text-center text-sm font-medium animate-fade-in flex items-center justify-center gap-4 sticky top-0 z-[60] border-b border-white/10">
              <span>Connect your Google Cloud API Key to enable high-quota Business/Pro features.</span>
              <button onClick={handleConnectApiKey} className="bg-white text-blue-600 px-4 py-1 rounded-full text-xs font-bold hover:bg-gray-100 transition-colors shadow-lg">
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
          <ErrorBoundary>
            {renderPage()}
          </ErrorBoundary>
        </div>
      </main>
      <InstantChat onUpgrade={() => handleNavigate('subscription')} />
    </div>
  );
};

const initialOptions = {
  "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
  currency: "EUR",
  intent: "capture",
  components: "buttons,applepay,googlepay",
  "data-sdk-integration-source": "react-paypal-js"
};

const App: React.FC = () => {
  const [view, setView] = useState<{ page: 'home' | 'service' | 'subscription' | 'knowledge-base', serviceId: string | null }>({ page: 'home', serviceId: null });
  const [isPageExiting, setIsPageExiting] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [clientToken, setClientToken] = useState<string | null>(null);

  useEffect(() => {
    // Log masked client ID for debugging
    const clientId = initialOptions["client-id"];
    console.log(`PayPal Initialized with ID: ${clientId.substring(0, 5)}...${clientId.substring(clientId.length - 5)}`);

    // Fetch PayPal Client Token for v6 features
    const fetchClientToken = async () => {
      try {
        const response = await fetch('/api/paypal/generate-client-token', { method: 'POST' });
        const data = await response.json();
        if (data.client_token) {
          setClientToken(data.client_token);
        }
      } catch (error) {
        console.error('Failed to fetch PayPal client token:', error);
      }
    };
    fetchClientToken();

    // Check for API key status if window.aistudio is available (typical for custom domain embeds)
    const checkApiKey = async () => {
        if (window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setHasApiKey(hasKey);
        }
    };
    checkApiKey();

    // Handle referral code
    const params = new URLSearchParams(window.location.search);
    const referralCode = params.get('ref');
    if (referralCode) {
      localStorage.setItem('referral_code', referralCode);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleConnectApiKey = async () => {
      if (window.aistudio) {
          await window.aistudio.openSelectKey();
          setHasApiKey(true); // Assume success per guidelines
      }
  };

  const handleNavigate = (page: 'home' | 'subscription' | 'knowledge-base') => {
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
      case 'urban-deep-understanding':
        return <UrbanDeepUnderstandingGenerator {...props} />;
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
      case 'knowledge-base':
        return (
            <div className={isPageExiting ? 'animate-slide-out-left' : 'animate-slide-in-right'}>
               <KnowledgeBaseManager />
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

  if (!initialOptions["client-id"]) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-xl max-w-md text-center">
          <h2 className="text-xl font-bold text-white mb-2">PayPal Configuration Missing</h2>
          <p className="text-gray-400 mb-4">Please set VITE_PAYPAL_CLIENT_ID in your environment variables to enable payments.</p>
        </div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={{
      ...initialOptions,
      "data-client-token": clientToken || undefined
    }}>
      <AuthProvider>
        <Toaster position="top-center" richColors />
        {window.location.pathname.startsWith('/auth/callback') ? (
            <AuthCallback />
        ) : window.location.pathname.startsWith('/auth/reset-password') ? (
            <ResetPasswordPage />
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