import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';
import { supabase } from '../lib/supabase';
import type { 
    PresentationSlide,
    UrbanPlanningProjectInfo,
    PolicyBrief,
    RFPContent,
    CapacityBuildingProgram,
    VisionFramework,
    StakeholderPlan,
    Methodology
} from '../types';

const getAi = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        console.error('CRITICAL: Gemini API key is not configured in the frontend bundle.');
        throw new Error('Gemini API key is not configured. Please check your environment variables.');
    }
    return new GoogleGenAI({ apiKey });
};

const parseJsonResponse = <T>(response: GenerateContentResponse, generatorName: string): T => {
    const rawText = response.text || '';
    try {
        const text = rawText.trim().replace(/^```json\s*/, '').replace(/```$/, '');
        if (!text) {
            throw new Error(`Received empty JSON response from AI for ${generatorName}.`);
        }
        
        try {
            return JSON.parse(text);
        } catch (e) {
            console.warn(`Initial JSON.parse failed for ${generatorName}. Attempting to extract valid JSON. Error: ${e}`);

            const firstOpenBracket = text.indexOf('[');
            const firstOpenBrace = text.indexOf('{');
            
            let startIndex = -1;
            if (firstOpenBracket === -1) startIndex = firstOpenBrace;
            else if (firstOpenBrace === -1) startIndex = firstOpenBracket;
            else startIndex = Math.min(firstOpenBracket, firstOpenBrace);

            if (startIndex === -1) throw e;

            const openChar = text[startIndex];
            const closeChar = openChar === '{' ? '}' : ']';
            
            let depth = 1;
            let inString = false;
            let endIndex = -1;

            for (let i = startIndex + 1; i < text.length; i++) {
                const char = text[i];
                const prevChar = text[i-1];

                if (char === '"' && prevChar !== '\\') {
                    inString = !inString;
                }
                
                if (!inString) {
                    if (char === openChar) {
                        depth++;
                    } else if (char === closeChar) {
                        depth--;
                    }
                }

                if (depth === 0) {
                    endIndex = i;
                    break; 
                }
            }

            if (endIndex !== -1) {
                const potentialJson = text.substring(startIndex, endIndex + 1);
                return JSON.parse(potentialJson);
            }
            
            throw e; // If we couldn't fix it, re-throw the original error
        }
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`Failed to parse ${generatorName} JSON from AI. Raw text:`, rawText);
        throw new Error(`The AI returned an invalid structure for the ${generatorName}. Please try again. (Details: ${errorMessage})`);
    }
};

const deductCredits = async (amount: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/deduct-credits', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ amount }),
    });
    
    if (!response.ok) {
        let errorMessage = 'Failed to deduct credits.';
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
            if (error.hint) {
                errorMessage += ` Hint: ${error.hint}`;
            }
        } else {
            const text = await response.text();
            if (text.includes('Missing database credentials')) {
                errorMessage = 'Server is not configured with database credentials (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).';
            } else {
                errorMessage = `Server error (${response.status}): ${text.substring(0, 100)}...`;
            }
        }
        throw new Error(errorMessage);
    }
};

export const generateImage = async (prompt: string): Promise<string> => {
    await deductCredits(5);
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Cinematic, photorealistic, 8k, professional urban planning visualization, architecturally accurate, dramatic lighting, sharp focus: ${prompt}` }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
    });
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("Image failed.");
};

export const generatePresentation = async (
    projectInfo: UrbanPlanningProjectInfo, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _files: File[], 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _companyProfile?: string
): Promise<PresentationSlide[]> => {
    await deductCredits(20);
    const ai = getAi();
    const systemInstruction = `You are a world-class Principal Urban Strategist at a top-tier global consultancy (like McKinsey, Arup, or Foster + Partners). 
    Your output is a complete, technically defensible, and institutionally aware strategic doctrine. 
    You are creating a decision architecture, not just a presentation. 
    The tone must be analytical, quantitative, and grounded in policy and financial reality. 
    
    STRICT PROHIBITION: NEVER use placeholders like "[Insert Data Here]", "[City Name]", "TBD", "To be determined", or any bracketed text. 
    REAL-WORLD DATA: Use the provided Google Search tool to find real, up-to-date data, statistics, and specific details about the location (${projectInfo.location}). If specific data is unavailable, use your expert knowledge to synthesize highly plausible, technically sound, and data-driven estimates based on similar global benchmarks. DO NOT leave any field blank or use placeholder text.
    Every field in the JSON must be filled with high-quality, professional, and specific content.
    The output MUST be a JSON array of slide objects.
    Use a diverse range of layouts: Cover, ExecutiveOverview, Crisis, SWOT, CaseStudyDeepDive, Vision, MacroStrategy, EquityAnalysis, NodeAssessment, ScenarioComparison, RiskAssessment, Roadmap, GanttChartRoadmap, ProjectedImpact, FiscalFramework, PolicyLevers, GovernanceFramework, Process, Closing.
    TECHNICAL DEPTH: Provide rigorous, data-driven analysis. Use professional urban planning terminology (e.g., FAR, TOD, modal split, heat island effect, Gini coefficient for equity).
    NO GENERIC CONTENT: Tailor every slide specifically to the location and challenge provided.
    
    SCHEMA GUIDANCE:
    - Cover: { layout: "Cover", title, subtitle, project_code, year }
    - ExecutiveOverview: { layout: "ExecutiveOverview", title, narrative, key_points: [], analytic_reflection }
    - Crisis: { layout: "Crisis", title, problem_statement, key_data_points: [{label, value, description}] }
    - SWOT: { layout: "SWOT", strengths: [{title, description}], weaknesses, opportunities, threats, analytic_reflection }
    - CaseStudyDeepDive: { layout: "CaseStudyDeepDive", title, introduction, key_findings: [], conclusion, image_prompt, analytic_reflection }
    - Vision: { layout: "Vision", title, vision_statement, image_prompt }
    - MacroStrategy: { layout: "MacroStrategy", title, strategic_intent, strategies: [{title, description, rationale}], image_prompt }
    - NodeAssessment: { layout: "NodeAssessment", title, site_location, site_rationale, metrics: [{label, value}], conclusion, analytic_reflection, before_image_prompt, after_image_prompt }
    - Roadmap: { layout: "Roadmap", phases: [{title, timeline, action_steps: [{action, kpi}], outcome}] }
    - GanttChartRoadmap: { layout: "GanttChartRoadmap", title, timeline_start_year, timeline_end_year, phases: [{name, deliverables: [{name, start_quarter, end_quarter, kpi}]}] }
    - ProjectedImpact: { layout: "ProjectedImpact", title, subtitle, metrics: [{label, baseline, projected, timeframe, assumption}], analytic_reflection }
    - FiscalFramework: { layout: "FiscalFramework", title, cost_items: [{component, capex, opex, funding_source, recovery_mechanism}], analytic_reflection }
    - Process: { layout: "Process", title, subtitle, steps: [{step_number, title, description}], analytic_reflection }
    `;

    const prompt = `
    Generate a 12-15 slide strategic urban planning doctrine for:
    Location: ${projectInfo.location}
    Scale: ${projectInfo.scale}
    Core Challenge: ${projectInfo.mainChallenge}
    Policy Context: ${projectInfo.policyContext}
    Target Users: ${projectInfo.targetUsers}
    Specific Focus: ${projectInfo.specificFocus}
    Author Role: ${projectInfo.authorRole || 'Senior Consultant'}
    
    Ensure the content is deeply relevant to ${projectInfo.location} and addresses ${projectInfo.mainChallenge} with specific, actionable strategies.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts: [{ text: prompt }] },
        config: { 
            systemInstruction, 
            responseMimeType: 'application/json',
            tools: [{ googleSearch: {} }]
        },
    });

    const slides = parseJsonResponse<PresentationSlide[]>(response, 'Presentation');
    // Filter out any null or malformed slides that the AI might have returned
    return (slides || []).filter(s => s && typeof s === 'object' && s.layout);
};

export const refinePresentation = async (currentSlides: PresentationSlide[], userRequest: string, activeSlideIndex: number, companyProfile?: string): Promise<PresentationSlide[]> => {
    await deductCredits(5);
    const ai = getAi();
    const systemInstruction = `You are a Lead Strategist at Tanmyaa Global. Your task is to intelligently refine the provided JSON presentation structure based on the user's request, ensuring technical coherence and strategic depth.
    
    STRICT PROHIBITION: NEVER use placeholders like "[Insert Data Here]", "TBD", or any bracketed text. Provide real data, specific examples, and actionable recommendations. Use the Google Search tool to verify facts and find specific local details.
    
    Allowed layouts: Cover, ExecutiveOverview, Crisis, SWOT, Vision, MacroStrategy, EquityAnalysis, NodeAssessment, ScenarioComparison, RiskAssessment, Roadmap, GanttChartRoadmap, ProjectedImpact, FiscalFramework, PolicyLevers, GovernanceFramework, Process, Closing.
    
    ${companyProfile ? `\n**COMPANY PERSONA:** ${companyProfile}` : ''}
    
    IMPORTANT: Your entire output must be only the valid JSON array of slides, with no other text or explanation.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Update the following presentation JSON based on the user request. The slide structure is flexible; you can add, remove, reorder, or modify slides to best fulfill the request. Current presentation state: ${JSON.stringify(currentSlides)}. The user is viewing slide ${activeSlideIndex + 1}. User Request: "${userRequest}".`,
        config: { 
            systemInstruction,
            responseMimeType: 'application/json',
            tools: [{ googleSearch: {} }]
        },
    });
    const slides = parseJsonResponse<PresentationSlide[]>(response, 'Presentation Refinement');
    return (slides || []).filter(s => s && typeof s === 'object' && s.layout);
};

export const generatePolicyReport = async (brief: string, _files: File[], companyProfile?: string): Promise<PolicyBrief> => {
    await deductCredits(10);
    const ai = getAi();
    const systemInstruction = `You are a world-class Lead Policy Analyst at a global think tank. Your task is to generate a comprehensive, evidence-based, and actionable Policy Brief.
    
    STRICT PROHIBITION: NEVER use placeholders like "[Insert Data Here]", "TBD", or any bracketed text. Provide real data, specific examples, and actionable recommendations. Use the Google Search tool to find real-world evidence and statistics.
    TECHNICAL DEPTH: Ensure the analysis is rigorous, using professional terminology and providing concrete, quantified evidence where possible.
    
    SCHEMA GUIDANCE:
    {
        "title": "string",
        "executiveSummary": "string",
        "policyProblem": {
            "definition": "string",
            "affectedParties": "string",
            "urgency": "string"
        },
        "evidenceAndFindings": {
            "summary": "string",
            "findings": ["string"]
        },
        "policyOptions": [
            {
                "description": "string",
                "benefits": "string",
                "risks": "string",
                "feasibility": "string"
            }
        ],
        "recommendedAction": {
            "option": "string",
            "justification": "string",
            "impacts": "string"
        },
        "implementationConsiderations": {
            "responsibility": "string",
            "capacity": "string",
            "timeline": "string",
            "risks": "string"
        },
        "keyTakeaways": ["string"]
    }
    
    Your entire output MUST be a single, valid JSON object following the required schema.
    ${companyProfile ? `\n**COMPANY PERSONA:** ${companyProfile}` : ''}`;

    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts: [{ text: `Generate a structured policy brief based on: ${brief}` }] },
        config: { 
            systemInstruction,
            responseMimeType: 'application/json',
            tools: [{googleSearch: {}}],
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    executiveSummary: { type: Type.STRING },
                    policyProblem: {
                        type: Type.OBJECT,
                        properties: {
                            definition: { type: Type.STRING },
                            affectedParties: { type: Type.STRING },
                            urgency: { type: Type.STRING }
                        },
                        required: ["definition", "affectedParties", "urgency"]
                    },
                    evidenceAndFindings: {
                        type: Type.OBJECT,
                        properties: {
                            summary: { type: Type.STRING },
                            findings: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["summary", "findings"]
                    },
                    policyOptions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                description: { type: Type.STRING },
                                benefits: { type: Type.STRING },
                                risks: { type: Type.STRING },
                                feasibility: { type: Type.STRING }
                            },
                            required: ["description", "benefits", "risks", "feasibility"]
                        }
                    },
                    recommendedAction: {
                        type: Type.OBJECT,
                        properties: {
                            option: { type: Type.STRING },
                            justification: { type: Type.STRING },
                            impacts: { type: Type.STRING }
                        },
                        required: ["option", "justification", "impacts"]
                    },
                    implementationConsiderations: {
                        type: Type.OBJECT,
                        properties: {
                            responsibility: { type: Type.STRING },
                            capacity: { type: Type.STRING },
                            timeline: { type: Type.STRING },
                            risks: { type: Type.STRING }
                        },
                        required: ["responsibility", "capacity", "timeline", "risks"]
                    },
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["title", "executiveSummary", "policyProblem", "evidenceAndFindings", "policyOptions", "recommendedAction", "implementationConsiderations", "keyTakeaways"]
            }
        }
    });
    
    const briefResult = parseJsonResponse<PolicyBrief>(response, 'Policy Brief');
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
        const sources = (groundingChunks as unknown as Array<{ web?: { uri: string; title?: string } }>)
            .filter(chunk => chunk.web && chunk.web.uri)
            .map(chunk => ({
                uri: chunk.web!.uri,
                title: chunk.web!.title || "Untitled Source",
            }));
        (briefResult as PolicyBrief & { groundingSources: Array<{ uri: string; title: string }> }).groundingSources = sources;
    }
    return briefResult;
};

export const generateRFP = async (
    taskDescription: string, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _pageRange: string, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _files: File[]
): Promise<RFPContent> => {
    await deductCredits(10);
    const ai = getAi();
    const systemInstruction = `You are a world-class Procurement and Urban Planning Specialist. 
    Your task is to generate a professional Request for Proposals (RFP) or Terms of Reference (ToR).
    
    STRICT PROHIBITION: NEVER use placeholders like "[Insert Data Here]", "TBD", or any bracketed text. Provide specific, technically sound requirements, evaluation criteria, and scope of work based on your expertise and real-world procurement standards. Use Google Search to find relevant regulations or industry benchmarks.
    TECHNICAL DEPTH: The RFP must be ready for institutional use, with detailed technical specifications and rigorous evaluation frameworks.
    
    SCHEMA GUIDANCE:
    {
        "title": "string",
        "sections": [
            {
                "title": "string",
                "content": [
                    {
                        "paragraph": "string (optional)",
                        "list": ["string (optional)"]
                    }
                ]
            }
        ]
    }
    
    Your entire output MUST be a single, valid JSON object following the schema above.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Generate a detailed RFP for: ${taskDescription}`,
        config: { 
            systemInstruction, 
            responseMimeType: 'application/json',
            tools: [{ googleSearch: {} }],
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    sections: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                content: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            paragraph: { type: Type.STRING },
                                            list: { type: Type.ARRAY, items: { type: Type.STRING } }
                                        }
                                    }
                                }
                            },
                            required: ["title", "content"]
                        }
                    }
                },
                required: ["title", "sections"]
            }
        }
    });
    return parseJsonResponse<RFPContent>(response, 'RFP');
};

export const generateCapacityBuildingProgram = async (audience: string, skillLevel: string, challenges: string, companyProfile?: string): Promise<CapacityBuildingProgram> => {
    await deductCredits(10);
    const ai = getAi();
    const systemInstruction = `You are a world-class Urban Planning Educator and Capacity Building Consultant. 
    Your task is to generate a comprehensive, tailored Capacity Building Program.
    
    STRICT PROHIBITION: NEVER use placeholders like "[Insert Data Here]", "TBD", or "[Company Name]". Provide specific learning objectives, detailed module content, concrete methodologies, and a clear evaluation plan. Use Google Search to find relevant case studies or technical standards.
    The content must be technically rigorous and directly address the specific challenges and skill levels provided.
    TECHNICAL DEPTH: Use advanced pedagogical frameworks and industry-standard technical tools in the curriculum.
    
    ${companyProfile ? `\n**COMPANY PERSONA:** ${companyProfile}` : ''}

    SCHEMA GUIDANCE:
    {
        "programTitle": "string",
        "targetAudience": "string",
        "learningObjectives": ["string"],
        "modules": [
            {
                "title": "string",
                "objective": "string",
                "topics": ["string"],
                "methodology": "string",
                "outcome": "string"
            }
        ],
        "deliveryMethod": "string",
        "evaluationPlan": "string"
    }
    
    Your entire output MUST be a single, valid JSON object following the schema above.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Generate a capacity building program for: ${audience}. 
        Skill Level: ${skillLevel}. 
        Challenges to address: ${challenges}.`,
        config: { 
            systemInstruction, 
            responseMimeType: 'application/json',
            tools: [{ googleSearch: {} }],
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    programTitle: { type: Type.STRING },
                    targetAudience: { type: Type.STRING },
                    learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                    modules: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                objective: { type: Type.STRING },
                                topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                                methodology: { type: Type.STRING },
                                outcome: { type: Type.STRING }
                            },
                            required: ["title", "objective", "topics", "methodology", "outcome"]
                        }
                    },
                    deliveryMethod: { type: Type.STRING },
                    evaluationPlan: { type: Type.STRING }
                },
                required: ["programTitle", "targetAudience", "learningObjectives", "modules", "deliveryMethod", "evaluationPlan"]
            }
        }
    });
    return parseJsonResponse<CapacityBuildingProgram>(response, 'Capacity Building Program');
};

export const generateVisionFramework = async (city: string, aspirations: string, timeframe: string, companyProfile?: string): Promise<VisionFramework> => {
    await deductCredits(10);
    const ai = getAi();
    const systemInstruction = `You are a world-class Urban Futurist and Strategist. 
    Your task is to generate a cohesive and inspiring Vision Framework.
    
    STRICT PROHIBITION: NEVER use placeholders like "[Insert Data Here]", "TBD", or any bracketed text. Provide a specific, inspiring vision statement, a memorable tagline, and detailed strategic pillars with actionable initiatives. Use Google Search to find relevant trends and local context for ${city}.
    TECHNICAL DEPTH: Ground the vision in urban planning theory and future-proofing strategies (e.g., circular economy, 15-minute city).
    
    SCHEMA GUIDANCE:
    {
        "visionStatement": "string",
        "tagline": "string",
        "strategicPillars": [
            {
                "title": "string",
                "description": "string",
                "keyInitiatives": ["string"]
            }
        ]
    }
    
    Your entire output MUST be a single, valid JSON object following the schema above.
    ${companyProfile ? `\n**COMPANY PERSONA:** ${companyProfile}` : ''}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Generate a vision framework for ${city} with a timeframe of ${timeframe}, based on these aspirations: "${aspirations}"`,
        config: { 
            systemInstruction, 
            responseMimeType: 'application/json',
            tools: [{ googleSearch: {} }],
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    visionStatement: { type: Type.STRING },
                    tagline: { type: Type.STRING },
                    strategicPillars: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                keyInitiatives: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ["title", "description", "keyInitiatives"]
                        }
                    }
                },
                required: ["visionStatement", "tagline", "strategicPillars"]
            }
        }
    });
    return parseJsonResponse<VisionFramework>(response, 'Vision Framework');
};

export const generateStakeholderPlan = async (context: string, goals: string, companyProfile?: string): Promise<StakeholderPlan> => {
    await deductCredits(10);
    const ai = getAi();
    const systemInstruction = `You are a world-class public engagement strategist. 
    Your task is to generate a detailed Stakeholder Engagement Plan.
    
    STRICT PROHIBITION: NEVER use placeholders like "[Insert Data Here]", "TBD", or any bracketed text. Identify specific stakeholder groups, define clear engagement goals, and provide a detailed timeline with concrete activities. Use Google Search to find relevant community groups or local government bodies.
    TECHNICAL DEPTH: Use sophisticated engagement methodologies (e.g., Delphi method, participatory budgeting, digital twin consultation).
    
    SCHEMA GUIDANCE:
    {
        "planTitle": "string",
        "engagementGoals": ["string"],
        "stakeholderGroups": [
            {
                "name": "string",
                "category": "Government" | "Community" | "Private Sector" | "Expert/NGO" | "Other",
                "interest": "High" | "Medium" | "Low",
                "influence": "High" | "Medium" | "Low",
                "engagementStrategy": "string",
                "communicationMethods": ["string"]
            }
        ],
        "timeline": [
            {
                "phase": "string",
                "duration": "string",
                "activities": "string"
            }
        ]
    }
    
    Your entire output MUST be a single, valid JSON object following the schema above.
    ${companyProfile ? `\n**COMPANY PERSONA:** ${companyProfile}` : ''}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Generate a stakeholder plan for a project with the following context: "${context}" and goals: "${goals}"`,
        config: { 
            systemInstruction, 
            responseMimeType: 'application/json',
            tools: [{ googleSearch: {} }],
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    planTitle: { type: Type.STRING },
                    engagementGoals: { type: Type.ARRAY, items: { type: Type.STRING } },
                    stakeholderGroups: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                category: { type: Type.STRING, description: "Government, Community, Private Sector, Expert/NGO, or Other" },
                                interest: { type: Type.STRING, description: "High, Medium, or Low" },
                                influence: { type: Type.STRING, description: "High, Medium, or Low" },
                                engagementStrategy: { type: Type.STRING },
                                communicationMethods: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ["name", "category", "interest", "influence", "engagementStrategy", "communicationMethods"]
                        }
                    },
                    timeline: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                phase: { type: Type.STRING },
                                duration: { type: Type.STRING },
                                activities: { type: Type.STRING }
                            },
                            required: ["phase", "duration", "activities"]
                        }
                    }
                },
                required: ["planTitle", "engagementGoals", "stakeholderGroups", "timeline"]
            }
        }
    });
    return parseJsonResponse<StakeholderPlan>(response, 'Stakeholder Plan');
};

export const generateMethodology = async (task: string, companyProfile?: string): Promise<Methodology> => {
    await deductCredits(10);
    const ai = getAi();
    const systemInstruction = `You are a Senior Urban Project Manager. 
    Your task is to generate a detailed, step-by-step Methodology for a complex urban planning task.
    
    STRICT PROHIBITION: NEVER use placeholders like "[Insert Data Here]", "TBD", or any bracketed text. Provide a clear introduction, detailed phases with specific steps, concrete deliverables, and relevant tools/techniques. Use Google Search to find industry-standard workflows or technical requirements.
    TECHNICAL DEPTH: The methodology should reflect a high-level professional workflow, incorporating advanced analytical tools and quality assurance processes.
    
    SCHEMA GUIDANCE:
    {
        "title": "string",
        "introduction": "string",
        "phases": [
            {
                "phase_number": number,
                "title": "string",
                "description": "string",
                "steps": [
                    {
                        "step_number": "string",
                        "title": "string",
                        "description": "string",
                        "deliverable": "string",
                        "tools_and_techniques": ["string"]
                    }
                ]
            }
        ],
        "conclusion": "string"
    }
    
    Your entire output MUST be a single, valid JSON object following the schema above.
    ${companyProfile ? `\n**COMPANY PERSONA:** ${companyProfile}` : ''}`;
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Generate a methodology for the following task: "${task}"`,
        config: { 
            systemInstruction, 
            responseMimeType: 'application/json',
            tools: [{ googleSearch: {} }],
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    introduction: { type: Type.STRING },
                    phases: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                phase_number: { type: Type.INTEGER },
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                steps: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            step_number: { type: Type.STRING },
                                            title: { type: Type.STRING },
                                            description: { type: Type.STRING },
                                            deliverable: { type: Type.STRING },
                                            tools_and_techniques: { type: Type.ARRAY, items: { type: Type.STRING } }
                                        },
                                        required: ["step_number", "title", "description", "deliverable", "tools_and_techniques"]
                                    }
                                }
                            },
                            required: ["phase_number", "title", "description", "steps"]
                        }
                    }
                },
                required: ["title", "introduction", "phases"]
            }
        }
    });
    return parseJsonResponse<Methodology>(response, 'Methodology');
};

const generateInputSuggestions = async (prompt: string): Promise<string[]> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: { 
            systemInstruction: "You are a professional urban planning assistant. Provide highly relevant, specific, and creative suggestions. Avoid generic answers. Return ONLY a JSON array of strings.",
            responseMimeType: 'application/json', 
            responseSchema: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
            } 
        }
    });
    try {
        return JSON.parse(response.text || '[]');
    } catch (e: unknown) {
        console.error("Failed to parse suggestions:", e);
        return [];
    }
};

export const getSceneSuggestions = async (): Promise<string[]> => {
    const prompt = `Suggest 3 diverse urban planning scenes or project types (e.g., waterfront redevelopment, informal settlement upgrading, transit-oriented development). Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getLocationSuggestions = async (): Promise<string[]> => {
    const prompt = `Suggest 3 diverse global cities or regions known for interesting urban planning challenges (e.g., Cairo, Egypt; Medellin, Colombia; Singapore). Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getChallengeSuggestions = async (location: string, scale: string): Promise<string[]> => {
    const prompt = `As a Senior Urban Planner, suggest 3-4 specific, technically sound, and highly relevant main challenges for a project in '${location}' at a '${scale}' scale. 
    Focus on contemporary urban issues like climate resilience, social equity, or digital transformation. 
    Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getScaleSuggestions = async (location: string): Promise<string[]> => {
    const prompt = `For an urban planning project in '${location}', suggest 3 relevant scales. Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getSpecificFocusSuggestions = async (location: string, challenge: string): Promise<string[]> => {
    const prompt = `For an urban planning project in '${location}' addressing the challenge of '${challenge}', suggest 3-4 specific and professional focus areas. 
    The suggestions should be actionable and technically precise. 
    Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getAudienceSuggestions = async (location: string, challenge: string): Promise<string[]> => {
    const prompt = `For an urban planning project in '${location}' about '${challenge}', suggest 3 distinct audiences. Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getAuthorRoleSuggestions = async (): Promise<string[]> => {
    const prompt = `Suggest 3 professional roles for an urban planning author. Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getPolicyBriefSuggestions = async (): Promise<string[]> => {
    const prompt = `Suggest 3 diverse and relevant urban policy topics for a policy brief (e.g., affordable housing, sustainable transport, heritage preservation). Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getRFPSuggestions = async (): Promise<string[]> => {
    const prompt = `Suggest 3 common urban planning tasks that require an RFP or ToR (e.g., masterplan development, environmental impact assessment, public engagement strategy). Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getPolicyBriefRefinementSuggestions = async (brief: string): Promise<string[]> => {
    const prompt = `Suggest 3 ways to improve this policy brief: "${brief}". Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getRFPRefinementSuggestions = async (task: string): Promise<string[]> => {
    const prompt = `Suggest 3 ways to improve this RFP task: "${task}". Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getCapacityBuildingSuggestions = async (): Promise<string[]> => {
    const prompt = `Suggest 3 diverse target audiences for an urban planning capacity building program (e.g., junior planners, community leaders, GIS technicians). Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getCapacityBuildingRefinementSuggestions = async (audience: string, challenges: string): Promise<string[]> => {
    const prompt = `Suggest 3 workshop topics for audience '${audience}' facing '${challenges}'. Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getVisionAspirationSuggestions = async (city: string): Promise<string[]> => {
    const prompt = `As an Urban Futurist, suggest 3-4 inspiring and specific strategic aspirations for the future of '${city}'. 
    Consider its unique geography, culture, and potential for sustainable growth. 
    Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getVisionFrameworkRefinementSuggestions = async (city: string, aspirations: string): Promise<string[]> => {
    const prompt = `Suggest 3 strategic aspirations for '${city}' based on: "${aspirations}". Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getStakeholderContextSuggestions = async (): Promise<string[]> => {
    const prompt = `Suggest 3 diverse urban project contexts that require stakeholder engagement (e.g., new park development, industrial zone rezoning, smart city sensor deployment). Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getStakeholderPlanRefinementSuggestions = async (context: string, goals: string): Promise<string[]> => {
    const prompt = `Suggest 3 stakeholder groups for context '${context}' and goals '${goals}'. Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getMethodologySuggestions = async (): Promise<string[]> => {
    const prompt = `Suggest 3 complex urban planning tasks that require a detailed methodology (e.g., climate adaptation strategy, transit-oriented development plan, heritage conservation framework). Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getMethodologyRefinementSuggestions = async (task: string): Promise<string[]> => {
    const prompt = `Suggest 3 tools for this methodology task: "${task}". Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getRefinementSuggestions = async (prompt: string): Promise<string[]> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.STRING }} }
    });
    try {
        return JSON.parse(response.text || '[]');
    } catch (e: unknown) {
        console.error("Failed to parse refinement suggestions:", e);
        return [];
    }
};

export const getPolicyContextSuggestions = async (location: string, challenge: string): Promise<string[]> => {
    const prompt = `Suggest 3 relevant policy contexts for '${location}' addressing '${challenge}'. Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getSlideRefinementSuggestions = async (slideContent: PresentationSlide): Promise<string[]> => {
    const ai = getAi();
    const prompt = `Generate 3 refinement suggestions for this slide: ${JSON.stringify(slideContent)}. Return a JSON array of strings.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: { 
            responseMimeType: 'application/json', 
            responseSchema: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
            } 
        }
    });
    try {
        return JSON.parse(response.text || '[]');
    } catch (e: unknown) {
        console.error("Failed to parse suggestions", e);
        return [];
    }
};

export const sendMessageToInstantChatStream = async (message: string) => {
    const ai = getAi();
    return ai.models.generateContentStream({
        model: 'gemini-3.1-pro-preview',
        contents: message,
        config: { systemInstruction: "Rom, Lead Planning Consultant at Tanmyaa. Professional, insightful, concise." }
    });
};

export const streamAssistantResponse = async <T extends object>(contextData: T, prompt: string) => {
    const ai = getAi();
    return ai.models.generateContentStream({
        model: 'gemini-3.1-pro-preview',
        contents: `CONTEXT: ${JSON.stringify(contextData)}\n\nREQUEST: ${prompt}`,
        config: { systemInstruction: "Refinement assistant. Return updated JSON.", responseMimeType: 'application/json' }
    });
};

