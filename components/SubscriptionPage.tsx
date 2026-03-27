import React, { useState } from 'react';
import BrandingManager from './BrandingManager';
import CompanyProfileManager from './CompanyProfileManager';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const CheckIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6 text-blue-400" }) => (
    <svg className={className} fill="none" viewBox="0 0 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const MinusIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6 text-gray-500" }) => (
     <svg className={className} fill="none" viewBox="0 0 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
);

const PromoCodeSection: React.FC = () => {
    const [code, setCode] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const { addCredits, user } = useAuth();
    const [isRedeeming, setIsRedeeming] = useState(false);

    const handleRedeem = async () => {
        if (!code.trim()) return;
        
        if (!user) {
            setMessage({ text: 'Please sign in to redeem promo codes.', type: 'error' });
            return;
        }
        
        setIsRedeeming(true);
        setMessage(null);
        const normalizedCode = code.trim().toUpperCase();
        
        let creditsToAdd = 0;
        let planName = '';

        // Dev promo codes
        if (normalizedCode === 'PRODEV2026') {
            creditsToAdd = 600;
            planName = 'Pro';
        } else if (normalizedCode === 'BIZDEV2026') {
            creditsToAdd = 3000;
            planName = 'Business';
        } else {
            setMessage({ text: 'Invalid promo code.', type: 'error' });
            setIsRedeeming(false);
            return;
        }

        try {
            await addCredits(creditsToAdd, planName);
            setMessage({ text: `Success! ${creditsToAdd} credits added for ${planName} plan.`, type: 'success' });
            setCode('');
        } catch (error) {
            console.error(error);
            setMessage({ text: 'Failed to redeem code. Please try again.', type: 'error' });
        } finally {
            setIsRedeeming(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 p-6 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Have a Promo Code?</h3>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    disabled={isRedeeming}
                />
                <button 
                    onClick={handleRedeem}
                    disabled={!code || isRedeeming}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                >
                    {isRedeeming ? '...' : 'Redeem'}
                </button>
            </div>
            {message && (
                <p className={`mt-3 text-sm text-center ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {message.text}
                </p>
            )}
        </div>
    );
};



const SubscriptionTier: React.FC<{ 
    title: string; 
    price: string; 
    description: string; 
    features: string[]; 
    ctaText: string; 
    isFeatured?: boolean; 
    priceSubtext?: string; 
    disabled?: boolean; 
    onMouseEnter: () => void;
    isDimmed: boolean;
    showPayPal?: boolean;
    amount?: string;
    onSuccess?: (plan: string, credits: number) => void;
}> = ({ title, price, description, features, ctaText, isFeatured, priceSubtext, disabled, onMouseEnter, isDimmed, showPayPal, amount, onSuccess }) => {
    const { user } = useAuth();
    
    const baseClasses = `relative bg-black/30 backdrop-blur-lg border rounded-2xl p-8 flex flex-col text-center transition-all duration-300`;
    
    const featuredClasses = isFeatured 
        ? 'border-blue-400/80 shadow-2xl shadow-blue-500/20 ring-2 ring-blue-500/50' 
        : 'border-white/10';

    const interactionClasses = isDimmed
        ? 'blur-sm scale-95 opacity-60'
        : 'hover:border-blue-400/50 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10';
        
    const cardClasses = `${baseClasses} ${featuredClasses} ${interactionClasses}`;

    const buttonClasses = `w-full font-bold py-3 px-4 rounded-xl mt-auto transition-all duration-300 disabled:cursor-not-allowed ${isFeatured ? 'bg-blue-500/20 backdrop-blur-md border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 disabled:bg-blue-500/10 disabled:text-blue-500/50' : 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 disabled:bg-white/5 disabled:text-gray-400'}`;

    const handleCaptureOrder = async (orderID: string) => {
        if (!user) {
            toast.error('Please sign in to complete the purchase.');
            return;
        }
        try {
            // Call Supabase Edge Function instead of Express server
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-capture`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({ 
                    orderID,
                    plan: title,
                    userId: user.id,
                    email: user.email
                }),
            });
            if (response.ok) {
                const data = await response.json();
                if (onSuccess) {
                    onSuccess(title, data.newCredits);
                } else {
                    toast.success(`Payment successful! Your credits have been updated for the ${title} plan.`);
                    window.location.reload();
                }
            } else {
                const error = await response.json();
                toast.error(`Payment failed: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to capture order:', error);
            toast.error('An unexpected error occurred during payment capture.');
        }
    };

    return (
        <div className={cardClasses} onMouseEnter={onMouseEnter}>
            {isFeatured && (
                <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                    <span className="bg-blue-400 text-black text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">Most Popular</span>
                </div>
            )}
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <p className="mt-2 text-gray-400 h-10">{description}</p>
            <div className="my-8">
                <span className="text-5xl font-extrabold text-white">{price}</span>
                {priceSubtext && <span className="text-gray-400">{priceSubtext}</span>}
            </div>
            <ul className="space-y-4 text-left mb-8 flex-grow">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <CheckIcon className="w-6 h-6 text-blue-400 flex-shrink-0" />
                        <span className="ml-3 text-gray-300">{feature}</span>
                    </li>
                ))}
            </ul>
            
            <div className="mt-auto">
                {showPayPal ? (
                    <div className="mt-4">
                        <PayPalButtons 
                            style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                            createOrder={(data, actions) => {
                                return actions.order.create({
                                    intent: "CAPTURE",
                                    purchase_units: [{
                                        description: `${title} Plan Subscription`,
                                        custom_id: JSON.stringify({ userId: user?.id, plan: title }),
                                        amount: {
                                            currency_code: "USD",
                                            value: amount || "0.00"
                                        }
                                    }]
                                });
                            }}
                            onApprove={async (data, actions) => {
                                if (actions.order) {
                                    const order = await actions.order.capture();
                                    await handleCaptureOrder(order.id);
                                }
                            }}
                        />
                    </div>
                ) : (
                    <button 
                        onClick={() => toast.info(`This would typically lead to a checkout or contact form for the ${title} plan.`)} 
                        className={buttonClasses}
                        disabled={disabled}
                    >
                        {ctaText}
                    </button>
                )}
            </div>
        </div>
    );
};

const featuresData = [
    { feature: 'Model Access', trial: 'Standard', pro: 'Enhanced', business: 'Custom & Fine-Tuned' },
    { feature: 'PDF Export', trial: <CheckIcon />, pro: <CheckIcon />, business: <CheckIcon /> },
    { feature: 'Custom Branding', trial: <MinusIcon />, pro: <MinusIcon />, business: <CheckIcon /> },
    { feature: 'Custom Persona', trial: <MinusIcon />, pro: <MinusIcon />, business: <CheckIcon /> },
    { feature: 'Live Chat Support', trial: <MinusIcon />, pro: 'Priority Support', business: 'Dedicated Account Manager' },
    { feature: 'Team Collaboration', trial: <MinusIcon />, pro: <MinusIcon />, business: <CheckIcon /> },
];

const FeatureComparisonTable: React.FC = () => (
    <div className="px-4 md:px-8 lg:px-12 mt-20 pb-12">
        <h2 className="text-3xl font-bold text-white text-center mb-8">Compare all features</h2>
        <div className="bg-black/20 border border-white/10 rounded-lg overflow-hidden max-w-7xl mx-auto">
            <div className="grid grid-cols-4 items-center font-bold text-white bg-white/5 p-4 border-b border-white/10">
                <div className="text-left">Feature</div>
                <div className="text-center">Trial</div>
                <div className="text-center">Pro</div>
                <div className="text-center">Business</div>
            </div>
            <div className="divide-y divide-white/10 text-gray-300">
                {featuresData.map((item, index) => (
                     <div key={index} className="grid grid-cols-4 items-center p-4">
                        <div className="text-left font-medium">{item.feature}</div>
                        <div className="text-center text-sm flex justify-center">{item.trial}</div>
                        <div className="text-center text-sm flex justify-center">{item.pro}</div>
                        <div className="text-center text-sm flex justify-center">{item.business}</div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);


const SubscriptionPage: React.FC = () => {
    const { profile } = useAuth();
    const [hoveredTier, setHoveredTier] = useState<string | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState<{ plan: string, credits: number } | null>(null);

    if (paymentSuccess) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                    <CheckIcon className="w-12 h-12" />
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">Payment Successful!</h2>
                <p className="text-xl text-gray-300 max-w-md mb-8">
                    Thank you for subscribing to the <span className="text-blue-400 font-bold">{paymentSuccess.plan}</span> plan. 
                    Your account has been upgraded and <span className="text-green-400 font-bold">{paymentSuccess.credits}</span> credits have been added.
                </p>
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl mb-8 w-full max-w-md text-left">
                    <p className="text-gray-400 text-sm mb-2 uppercase tracking-widest font-bold">Subscription Details</p>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Plan</span>
                            <span className="text-white font-medium">{paymentSuccess.plan}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Status</span>
                            <span className="text-green-400 font-medium">Active</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Billing Cycle</span>
                            <span className="text-white font-medium">Monthly</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => window.location.reload()}
                    className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                    Back to Dashboard
                </button>
                <p className="mt-6 text-gray-500 text-sm italic">
                    A confirmation email and invoice have been sent to your email address.
                </p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in w-full">
            <div className="text-center pt-12 pb-16 bg-black/10">
                <h1 className="text-5xl font-extrabold text-white tracking-tight">Choose The Right Plan For You</h1>
                <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-300">Flexible plans that scale with your urban planning needs.</p>
            </div>
            <div 
                className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-8 lg:px-12 pt-16"
                onMouseLeave={() => setHoveredTier(null)}
            >
                <SubscriptionTier
                    title="Trial"
                    price="Free"
                    priceSubtext=""
                    description="Get a feel for our platform with core features."
                    features={[
                        '100 Free Credits (One-time gift)',
                        'Standard access to all tools',
                        'PDF Export',
                    ]}
                    ctaText="Your Current Plan"
                    disabled
                    onMouseEnter={() => setHoveredTier('Trial')}
                    isDimmed={hoveredTier !== null && hoveredTier !== 'Trial'}
                    onSuccess={(plan, credits) => setPaymentSuccess({ plan, credits })}
                />
                <SubscriptionTier
                    title="Pro"
                    price="$30"
                    priceSubtext="/ month"
                    description="For individual planners who need consistent access."
                    features={[
                        '600 Credits / month',
                        'Enhanced Models',
                        'PDF Export',
                        'Priority Support',
                    ]}
                    ctaText="Subscribe with PayPal"
                    isFeatured
                    onMouseEnter={() => setHoveredTier('Pro')}
                    isDimmed={hoveredTier !== null && hoveredTier !== 'Pro'}
                    showPayPal
                    amount="30.00"
                    onSuccess={(plan, credits) => setPaymentSuccess({ plan, credits })}
                />
                <SubscriptionTier
                    title="Business"
                    price="$100"
                    priceSubtext="/ month"
                    description="For organizations and teams with advanced needs."
                    features={[
                        '3000 Credits / month',
                        'All Pro features',
                        'Custom Branding (Logo, Colors, Template)',
                        'AI-Generated Content in Your Style',
                        'Personal Support: ahmedroman@tanmyaa.com',
                        'Team Collaboration Tools',
                        'Dedicated Support & Onboarding'
                    ]}
                    ctaText="Subscribe with PayPal"
                    onMouseEnter={() => setHoveredTier('Business')}
                    isDimmed={hoveredTier !== null && hoveredTier !== 'Business'}
                    showPayPal
                    amount="100.00"
                    onSuccess={(plan, credits) => setPaymentSuccess({ plan, credits })}
                />
            </div>
            
            <div className="px-4 md:px-8 lg:px-12">
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mt-20"></div>
            </div>

            <PromoCodeSection />

            <FeatureComparisonTable />

            <div className="px-4 md:px-8 lg:px-12 mt-20 pb-12">
                <div className="max-w-7xl mx-auto bg-blue-500/5 border border-blue-500/20 rounded-2xl p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Credit Consumption Rules
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                            <p className="text-blue-400 font-bold text-3xl mb-2">5 <span className="text-sm font-normal text-gray-400 uppercase tracking-widest">Credits</span></p>
                            <h3 className="text-white font-semibold mb-2">Quick AI Insight</h3>
                            <p className="text-sm text-gray-400">Chat interactions or Quick AI Applet generations.</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                            <p className="text-blue-400 font-bold text-3xl mb-2">20 <span className="text-sm font-normal text-gray-400 uppercase tracking-widest">Credits</span></p>
                            <h3 className="text-white font-semibold mb-2">Presentation Generation</h3>
                            <p className="text-sm text-gray-400">Complete multi-slide urban planning study presentations.</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                            <p className="text-blue-400 font-bold text-3xl mb-2">10 <span className="text-sm font-normal text-gray-400 uppercase tracking-widest">Credits</span></p>
                            <h3 className="text-white font-semibold mb-2">Other Generations</h3>
                            <p className="text-sm text-gray-400">RFP analysis, policy levers, and other standalone tools.</p>
                        </div>
                    </div>
                </div>
            </div>
            
             <div className="px-4 md:px-8 lg:px-12 mt-20 pb-12 max-w-7xl mx-auto space-y-8">
                <BrandingManager key={`${profile?.id}-${profile?.branding_logo}-${profile?.branding_colors}-${profile?.branding_template}`} />
                <CompanyProfileManager />
            </div>
        </div>
    );
};

export default SubscriptionPage;