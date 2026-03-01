// Fix: Corrected the import path to use "@google/genai" as per coding guidelines.
import { GoogleGenAI, Type } from '@google/genai';
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

const generateInputSuggestions = async (prompt: string): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
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
    } catch (e) {
        console.error("Failed to parse input suggestions:", e);
        return [];
    }
};

export const generateImage = async (prompt: string): Promise<string> => {
    const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image.');
    }

    const data = await response.json();
    return data.imageUrl;
};

export const generatePresentation = async (projectInfo: UrbanPlanningProjectInfo, files: File[], companyProfile?: string): Promise<PresentationSlide[]> => {
    const formData = new FormData();
    formData.append('projectInfo', JSON.stringify(projectInfo));
    if (companyProfile) {
        formData.append('companyProfile', companyProfile);
    }
    files.forEach(file => {
        formData.append('files', file);
    });

    const response = await fetch('/api/generate-presentation', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate presentation.');
    }

    const data = await response.json();
    return data.presentation;
};


export const refinePresentation = async (currentSlides: PresentationSlide[], userRequest: string, activeSlideIndex: number): Promise<PresentationSlide[]> => {
    const response = await fetch('/api/refine-presentation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentSlides, userRequest, activeSlideIndex }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refine presentation.');
    }

    const data = await response.json();
    return data.presentation;
};

export const sendMessageToInstantChatStream = async (message: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.models.generateContentStream({
        model: 'gemini-2.5-flash-lite',
        contents: message,
        config: { systemInstruction: "Rom, Lead Planning Consultant at Tanmyaa. Professional, insightful, concise." }
    });
};

export const streamAssistantResponse = async <T extends object>(contextData: T, prompt: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.models.generateContentStream({
        model: 'gemini-2.5-flash-lite',
        contents: `CONTEXT: ${JSON.stringify(contextData)}\n\nREQUEST: ${prompt}`,
        config: { systemInstruction: "Refinement assistant. Return updated JSON.", responseMimeType: 'application/json' }
    });
};

export const generatePolicyReport = async (brief: string, files: File[], companyProfile?: string): Promise<PolicyBrief> => {
    const formData = new FormData();
    formData.append('brief', brief);
    if (companyProfile) {
        formData.append('companyProfile', companyProfile);
    }
    files.forEach(file => {
        formData.append('files', file);
    });

    const response = await fetch('/api/generate-policy-report', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate policy report.');
    }

    const data = await response.json();
    return data.report;
};



export const getChallengeSuggestions = async (location: string, scale: string): Promise<string[]> => {
    const response = await fetch('/api/get-challenge-suggestions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location, scale }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get challenge suggestions.');
    }

    const data = await response.json();
    return data.suggestions;
};

export const getScaleSuggestions = async (location: string): Promise<string[]> => {
    const prompt = `For an urban planning project in '${location}', suggest 3 relevant scales. Examples: 'City-wide', 'Downtown Core', 'Specific Neighborhood (e.g., Waterfront District)', 'Transportation Corridor'. Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getSpecificFocusSuggestions = async (location: string, challenge: string): Promise<string[]> => {
    const prompt = `For a project in '${location}' addressing '${challenge}', suggest 3 specific focus areas or questions to guide the study. Frame them as questions or 'Focus on...' statements. Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getAudienceSuggestions = async (location: string, challenge: string): Promise<string[]> => {
    const prompt = `For an urban planning project in '${location}' about '${challenge}', suggest 3 distinct audiences for a presentation. Examples: 'Municipal Planning Commission', 'Private Real Estate Developers', 'Community Advocacy Groups'. Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getAuthorRoleSuggestions = async (): Promise<string[]> => {
    const prompt = `For an urban planning project, suggest 3 professional roles the author might have. Examples: 'Lead Urban Strategist', 'Graduate Student Researcher', 'Public Sector Project Manager'. Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getPolicyBriefRefinementSuggestions = async (brief: string): Promise<string[]> => {
    const prompt = `You are an AI assistant for a senior urban planner. The user has written the following project brief for a policy report. Suggest 3 concise, actionable ways to improve it, focusing on specificity, measurable outcomes, and policy levers. Return a JSON array of strings. Brief: "${brief}"`;
    return generateInputSuggestions(prompt);
};

export const getRFPRefinementSuggestions = async (task: string): Promise<string[]> => {
    const prompt = `As an AI procurement expert, review the following task description for an RFP. Suggest 3 ways to make it clearer and more comprehensive for bidders, focusing on defining scope, deliverables, and evaluation criteria. Return a JSON array of strings. Task: "${task}"`;
    return generateInputSuggestions(prompt);
};

export const getCapacityBuildingRefinementSuggestions = async (audience: string, challenges: string): Promise<string[]> => {
    const prompt = `You are an AI curriculum designer for urban planners. Based on the target audience ('${audience}') and the challenges they face ('${challenges}'), suggest 3 specific, hands-on workshop topics or training modules for a capacity-building program. Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getVisionFrameworkRefinementSuggestions = async (city: string, aspirations: string): Promise<string[]> => {
    const prompt = `As an AI urban strategist, review the following aspirations for a vision framework for '${city}'. Suggest 3 more evocative and strategic aspirations that link to measurable outcomes (e.g., instead of 'a green city', suggest 'a city with a 40% tree canopy cover by 2040'). Return a JSON array of strings. Aspirations: "${aspirations}"`;
    return generateInputSuggestions(prompt);
};

export const getStakeholderPlanRefinementSuggestions = async (context: string, goals: string): Promise<string[]> => {
    const prompt = `You are a public engagement AI specialist. For a project with context '${context}' and goals '${goals}', suggest 3 specific, critical stakeholder groups that might be overlooked and a key engagement goal for each. Format each suggestion as "[Stakeholder Group]: [Engagement Goal]". Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getMethodologyRefinementSuggestions = async (task: string): Promise<string[]> => {
    const prompt = `As a senior project manager AI, review the following urban planning task. Suggest 3 key "Tools & Techniques" that should be included in its methodology to ensure a data-driven and robust process. Return a JSON array of strings. Task: "${task}"`;
    return generateInputSuggestions(prompt);
};


export const getRefinementSuggestions = async (prompt: string): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
    You are an expert urban planning policy analyst. For a project in '${location}' addressing the challenge of '${challenge}', suggest 3 relevant and REAL policy contexts. These should be actual, existing policies or widely recognized international frameworks.

    For each suggestion, provide the official name of the policy or framework.

    Examples of good suggestions:
    - "The National Urban Development Strategy 2030"
    - "[City Name]'s Climate Action Plan"
    - "UN Sustainable Development Goal 11: Sustainable Cities and Communities"
    - "The New Urban Agenda (Habitat III)"

    Do not invent policies. The suggestions must be verifiable and authoritative.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.STRING }} }
    });
    try {
        return JSON.parse(response.text || '[]');
    } catch(e: unknown) {
        console.error("Failed to parse policy context suggestions:", e);
        return [];
    }
};

export const generateRFP = async (taskDescription: string, pageRange: string, files: File[]): Promise<RFPContent> => {
    const formData = new FormData();
    formData.append('taskDescription', taskDescription);
    formData.append('pageRange', pageRange);
    files.forEach(file => {
        formData.append('files', file);
    });

    const response = await fetch('/api/generate-rfp', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate RFP.');
    }

    const data = await response.json();
    return data.rfp;
};

export const generateCapacityBuildingProgram = async (audience: string): Promise<CapacityBuildingProgram> => {
    const response = await fetch('/api/generate-capacity-building-program', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audience }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate capacity building program.');
    }

    const data = await response.json();
    return data.program;
};

export const generateVisionFramework = async (city: string, aspirations: string, timeframe: string, companyProfile?: string): Promise<VisionFramework> => {
    const response = await fetch('/api/generate-vision-framework', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ city, aspirations, timeframe, companyProfile }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate vision framework.');
    }

    const data = await response.json();
    return data.framework;
};

export const generateStakeholderPlan = async (context: string, goals: string, companyProfile?: string): Promise<StakeholderPlan> => {
    const response = await fetch('/api/generate-stakeholder-plan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context, goals, companyProfile }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate stakeholder plan.');
    }

    const data = await response.json();
    return data.plan;
};

export const generateMethodology = async (task: string, companyProfile?: string): Promise<Methodology> => {
    const response = await fetch('/api/generate-methodology', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task, companyProfile }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate methodology.');
    }

    const data = await response.json();
    return data.methodology;
};


export const getSlideRefinementSuggestions = async (slideContent: PresentationSlide): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
    You are an AI co-pilot for an urban planning presentation tool. A user is currently viewing a slide and has asked for refinement ideas.
    Based on the JSON content of the current slide provided below, generate 3 concise, actionable refinement suggestions.
    The suggestions should be phrased as commands or questions that the user could give to an AI.
    
    Examples:
    - "Elaborate on the financial risks."
    - "Rephrase the vision statement to be more impactful."
    - "Add another key finding from a similar project in Asia."
    - "Can you quantify the projected reduction in CO2 emissions?"

    Current slide content:
    ${JSON.stringify(slideContent, null, 2)}
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
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
