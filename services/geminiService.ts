import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';
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

const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    const response = await fetch('/api/deduct-credits', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await (await import('../lib/supabase')).supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ amount }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deduct credits.');
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
    const systemInstruction = `You are a world-class Principal Urban Strategist at a top-tier global consultancy. Your output is a complete, technically defensible, and institutionally aware strategic doctrine. You are creating a decision architecture, not just a presentation. The tone must be analytical, quantitative, and grounded in policy and financial reality. The final presentation must be robust enough to withstand technical review by planning authorities, finance ministries, and infrastructure investment panels.`;

    const prompt = `
    Project Info:
    Location: ${projectInfo.location}
    Scale: ${projectInfo.scale}
    Core Challenge: ${projectInfo.mainChallenge}
    Policy Context: ${projectInfo.policyContext}
    Target Users: ${projectInfo.targetUsers}
    Specific Focus: ${projectInfo.specificFocus}
    
    Generate a presentation based on these details, following all instructions and STRICT limits precisely.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts: [{ text: prompt }] },
        config: { systemInstruction, responseMimeType: 'application/json' },
    });

    return parseJsonResponse<PresentationSlide[]>(response, 'Presentation');
};

export const refinePresentation = async (currentSlides: PresentationSlide[], userRequest: string, activeSlideIndex: number): Promise<PresentationSlide[]> => {
    await deductCredits(5);
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Update the following presentation JSON based on the user request. The slide structure is flexible; you can add, remove, reorder, or modify slides to best fulfill the request. Current presentation state: ${JSON.stringify(currentSlides)}. The user is viewing slide ${activeSlideIndex + 1}. User Request: "${userRequest}".`,
        config: { 
            systemInstruction: `You are a Lead Strategist at Tanmyaa Global. Your task is to intelligently refine the provided JSON presentation structure based on the user's request, ensuring coherence. The slide structure is dynamic. IMPORTANT: Your entire output must be only the valid JSON array of slides, with no other text or explanation.`,
            responseMimeType: 'application/json'
        },
    });
    return parseJsonResponse<PresentationSlide[]>(response, 'Presentation Refinement');
};

export const generatePolicyReport = async (brief: string, _files: File[], companyProfile?: string): Promise<PolicyBrief> => {
    await deductCredits(10);
    const ai = getAi();
    const systemInstruction = `You are a world-class Lead Policy Analyst at a global think tank. Your task is to generate a comprehensive, evidence-based, and actionable Policy Brief based on the user's prompt and any provided documents.
    
    Your entire output MUST be a single, valid JSON object following the required schema.
    ${companyProfile ? `\n**COMPANY PERSONA:** ${companyProfile}` : ''}`;

    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts: [{ text: `Generate a structured policy brief based on: ${brief}` }] },
        config: { 
            systemInstruction,
            responseMimeType: 'application/json',
            tools: [{googleSearch: {}}]
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
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Generate RFP: ${taskDescription}`,
        config: { systemInstruction: `Procurement Specialist. Your entire output MUST be a single, valid JSON object.`, responseMimeType: 'application/json' }
    });
    return parseJsonResponse<RFPContent>(response, 'RFP');
};

export const generateCapacityBuildingProgram = async (audience: string): Promise<CapacityBuildingProgram> => {
    await deductCredits(10);
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Program for: ${audience}`,
        config: { systemInstruction: `Planning Educator. Your entire output MUST be a single, valid JSON object.`, responseMimeType: 'application/json' }
    });
    return parseJsonResponse<CapacityBuildingProgram>(response, 'Capacity Building Program');
};

export const generateVisionFramework = async (city: string, aspirations: string, timeframe: string, companyProfile?: string): Promise<VisionFramework> => {
    await deductCredits(10);
    const ai = getAi();
    const systemInstruction = `You are a world-class Urban Futurist and Strategist. Your entire output MUST be a single, valid JSON object.
    ${companyProfile ? `\n**COMPANY PERSONA:** ${companyProfile}` : ''}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Generate a vision framework for ${city} with a timeframe of ${timeframe}, based on these aspirations: "${aspirations}"`,
        config: { systemInstruction, responseMimeType: 'application/json' }
    });
    return parseJsonResponse<VisionFramework>(response, 'Vision Framework');
};

export const generateStakeholderPlan = async (context: string, goals: string, companyProfile?: string): Promise<StakeholderPlan> => {
    await deductCredits(10);
    const ai = getAi();
    const systemInstruction = `You are a world-class public engagement strategist. Your entire output MUST be a single, valid JSON object.
    ${companyProfile ? `\n**COMPANY PERSONA:** ${companyProfile}` : ''}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Generate a stakeholder plan for a project with the following context: "${context}" and goals: "${goals}"`,
        config: { systemInstruction, responseMimeType: 'application/json' }
    });
    return parseJsonResponse<StakeholderPlan>(response, 'Stakeholder Plan');
};

export const generateMethodology = async (task: string, companyProfile?: string): Promise<Methodology> => {
    await deductCredits(10);
    const ai = getAi();
    const systemInstruction = `You are a Senior Project Manager. Your entire output MUST be a single, valid JSON object.
    ${companyProfile ? `\n**COMPANY PERSONA:** ${companyProfile}` : ''}`;
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Generate a methodology for the following task: "${task}"`,
        config: { systemInstruction, responseMimeType: 'application/json' }
    });
    return parseJsonResponse<Methodology>(response, 'Methodology');
};

export const getChallengeSuggestions = async (location: string, scale: string): Promise<string[]> => {
    const prompt = `For an urban planning project in '${location}' at a '${scale}' scale, suggest 3 specific and relevant main challenges to address. Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getScaleSuggestions = async (location: string): Promise<string[]> => {
    const prompt = `For an urban planning project in '${location}', suggest 3 relevant scales. Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getSpecificFocusSuggestions = async (location: string, challenge: string): Promise<string[]> => {
    const prompt = `For a project in '${location}' addressing '${challenge}', suggest 3 specific focus areas. Return a JSON array of strings.`;
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

export const getPolicyBriefRefinementSuggestions = async (brief: string): Promise<string[]> => {
    const prompt = `Suggest 3 ways to improve this policy brief: "${brief}". Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getRFPRefinementSuggestions = async (task: string): Promise<string[]> => {
    const prompt = `Suggest 3 ways to improve this RFP task: "${task}". Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getCapacityBuildingRefinementSuggestions = async (audience: string, challenges: string): Promise<string[]> => {
    const prompt = `Suggest 3 workshop topics for audience '${audience}' facing '${challenges}'. Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getVisionFrameworkRefinementSuggestions = async (city: string, aspirations: string): Promise<string[]> => {
    const prompt = `Suggest 3 strategic aspirations for '${city}' based on: "${aspirations}". Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getStakeholderPlanRefinementSuggestions = async (context: string, goals: string): Promise<string[]> => {
    const prompt = `Suggest 3 stakeholder groups for context '${context}' and goals '${goals}'. Return a JSON array of strings.`;
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

