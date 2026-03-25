
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateDeepUnderstanding, refineDeepUnderstanding } from '../services/geminiService';
import type { UrbanDeepUnderstanding } from '../types';
import GeneratorShell from './GeneratorShell';
import UrbanDeepUnderstandingInputForm from './UrbanDeepUnderstandingInputForm';
import GeneratorWelcome from './Welcome';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import ErrorMessage from './ErrorMessage';

interface GeneratorProps {
    onUpgrade: () => void;
}

const UrbanDeepUnderstandingGenerator: React.FC<GeneratorProps> = () => {
    const { user, profile, refreshProfile, signInWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<UrbanDeepUnderstanding | null>(null);
    const [refinementRequest, setRefinementRequest] = useState('');
    const [isRefining, setIsRefining] = useState(false);

    const handleGenerate = async (topic: string, context: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateDeepUnderstanding(topic, context);
            setData(result);
            await refreshProfile();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to generate deep understanding.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefine = async () => {
        if (!data || !refinementRequest.trim()) return;
        setIsRefining(true);
        setError(null);
        try {
            const result = await refineDeepUnderstanding(data, refinementRequest);
            setData(result);
            setRefinementRequest('');
            await refreshProfile();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to refine deep understanding.');
        } finally {
            setIsRefining(false);
        }
    };

    const renderChart = (insight: UrbanDeepUnderstanding['dataInsights'][0], index: number) => {
        const chartData = [
            { name: 'Baseline', value: parseFloat(insight.currentValue) || 0 },
            { name: 'Projected', value: parseFloat(insight.projection) || 0 }
        ];

        return (
            <div key={index} className="bg-black/20 border border-white/5 rounded-2xl p-6 mb-6">
                <h4 className="text-lg font-bold text-white mb-2">{insight.metric}</h4>
                <p className="text-sm text-gray-400 mb-6">{insight.rationale}</p>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="name" stroke="#999" />
                            <YAxis stroke="#999" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            insight.trend === 'Increasing' ? 'bg-green-500/20 text-green-400' :
                            insight.trend === 'Decreasing' ? 'bg-red-500/20 text-red-400' :
                            'bg-blue-500/20 text-blue-400'
                        }`}>
                            {insight.trend}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Projection</p>
                        <p className="text-xl font-black text-white">{insight.projection}</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <GeneratorShell
            title="Deep Understanding"
            description="Fully illustrate urban topics with interactive data, case studies, and policy insights."
        >
            {!data ? (
                <div className="space-y-8">
                    <GeneratorWelcome 
                        title="Deep Understanding for Urban Topics"
                        description="This service provides a comprehensive, interactive analysis of complex urban issues. It generates a Policy Brief style document with data projections, case studies, and actionable recommendations. You can interactively refine the output to focus on your specific intentions."
                    />
                    <UrbanDeepUnderstandingInputForm
                        onSubmit={handleGenerate}
                        isLoading={isLoading}
                        credits={profile?.credits || 0}
                        userEmail={user?.email || null}
                        onLogin={signInWithGoogle}
                    />
                </div>
            ) : (
                <div className="space-y-12 animate-fade-in">
                    {/* Header Section */}
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">{data.topic}</h2>
                        <div className="h-1 w-24 bg-blue-600 mx-auto mb-6 rounded-full"></div>
                        <p className="text-lg text-gray-400 leading-relaxed italic">
                            &ldquo;{data.executiveSummary}&rdquo;
                        </p>
                    </div>

                    {/* Key Concepts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {data.keyConcepts.map((concept, idx) => (
                            <div key={idx} className="bg-gray-900/50 border border-gray-800 p-6 rounded-3xl hover:border-gray-700 transition-all">
                                <h3 className="text-xl font-bold text-white mb-3">{concept.title}</h3>
                                <p className="text-sm text-gray-400 mb-4 leading-relaxed">{concept.explanation}</p>
                                <div className="bg-blue-600/10 border border-blue-600/20 p-3 rounded-xl">
                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Example</p>
                                    <p className="text-xs text-gray-300 italic">{concept.example}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Data Insights & Charts */}
                    <div className="space-y-8">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="h-px flex-grow bg-gray-800"></div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em]">Data Projections & Insights</h3>
                            <div className="h-px flex-grow bg-gray-800"></div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {data.dataInsights.map((insight, idx) => renderChart(insight, idx))}
                        </div>
                    </div>

                    {/* Case Studies */}
                    <div className="bg-gray-900/30 border border-gray-800 rounded-[3rem] p-8 md:p-12">
                        <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-4">01</span>
                            Global Benchmarks & Case Studies
                        </h3>
                        <div className="space-y-8">
                            {data.caseStudies.map((cs, idx) => (
                                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-6 border-b border-gray-800 last:border-0 pb-8 last:pb-0">
                                    <div className="md:col-span-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Location</p>
                                        <p className="text-lg font-bold text-white">{cs.location}</p>
                                    </div>
                                    <div className="md:col-span-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Intervention</p>
                                        <p className="text-sm text-gray-300">{cs.intervention}</p>
                                    </div>
                                    <div className="md:col-span-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Outcome</p>
                                        <p className="text-sm text-gray-300">{cs.outcome}</p>
                                    </div>
                                    <div className="md:col-span-1">
                                        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Lesson Learned</p>
                                        <p className="text-sm text-blue-100 italic">&ldquo;{cs.lessonLearned}&rdquo;</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Policy Recommendations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-6">Strategic Recommendations</h3>
                            <div className="space-y-4">
                                {data.policyRecommendations.map((rec, idx) => (
                                    <div key={idx} className="flex items-start space-x-4 group">
                                        <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-600 group-hover:scale-150 transition-transform"></div>
                                        <div>
                                            <p className="text-lg font-bold text-white">{rec.action}</p>
                                            <p className="text-sm text-gray-400 mb-2">{rec.impact}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                                                rec.feasibility === 'High' ? 'bg-green-500/20 text-green-400' :
                                                rec.feasibility === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                                Feasibility: {rec.feasibility}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Interactive Elements */}
                        <div className="bg-blue-600/5 border border-blue-600/20 rounded-3xl p-8">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                <svg className="w-5 h-5 mr-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0116 0z" />
                                </svg>
                                Interactive Reflection
                            </h3>
                            {data.interactiveElements.map((el, idx) => (
                                <div key={idx} className="space-y-4">
                                    <p className="text-lg text-gray-200 font-medium">{el.question}</p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {el.options.map((opt, oIdx) => (
                                            <button 
                                                key={oIdx}
                                                className="text-left p-4 rounded-xl bg-black/40 border border-gray-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-sm text-gray-300"
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 italic mt-4">Note: {el.feedback}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Interactive Refinement Section */}
                    <div className="mt-16 bg-gray-900/70 border border-gray-700/50 rounded-[3rem] p-8 md:p-12 shadow-2xl">
                        <div className="max-w-2xl mx-auto text-center mb-8">
                            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Refine Your Understanding</h3>
                            <p className="text-gray-400">
                                Add more insights, ask for specific focus, or contextualize this analysis further. The AI will update the entire brief to match your intention.
                            </p>
                        </div>
                        
                        <div className="relative max-w-3xl mx-auto">
                            <textarea
                                value={refinementRequest}
                                onChange={(e) => setRefinementRequest(e.target.value)}
                                placeholder="e.g., Focus more on the financial feasibility for small municipalities, or add a case study from Southeast Asia..."
                                rows={3}
                                className="w-full bg-black/40 border border-gray-800 rounded-3xl py-4 px-6 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition duration-200 resize-none pr-32"
                                disabled={isRefining}
                            />
                            <button
                                onClick={handleRefine}
                                disabled={isRefining || !refinementRequest.trim()}
                                className="absolute right-3 bottom-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-2xl transition-all disabled:bg-gray-800 disabled:text-gray-500"
                            >
                                {isRefining ? 'Updating...' : 'Refine'}
                            </button>
                        </div>
                        <p className="text-center text-[10px] text-gray-600 mt-4 uppercase tracking-[0.2em]">Refinement costs 5 credits</p>
                    </div>

                    {/* Error Message if refinement fails */}
                    {error && (
                        <div className="mt-8">
                            <ErrorMessage message={error} />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-center pt-8">
                        <button 
                            onClick={() => window.print()} 
                            className="bg-white text-black font-bold py-3 px-10 rounded-full hover:bg-gray-200 transition-all shadow-xl"
                        >
                            Export as Policy Brief
                        </button>
                    </div>
                </div>
            )}
        </GeneratorShell>
    );
};

export default UrbanDeepUnderstandingGenerator;
