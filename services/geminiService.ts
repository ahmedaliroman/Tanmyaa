import { GoogleGenAI, GenerateContentResponse, Type, ThinkingLevel } from '@google/genai';
import { supabase } from '@/lib/supabase';
import type { 
    PresentationSlide,
    UrbanPlanningProjectInfo,
    PolicyBrief,
    RFPContent,
    CapacityBuildingProgram,
    VisionFramework,
    StakeholderPlan,
    Methodology,
    UsageHistory,
    BrandingInfo
} from '@/types';

const STRICT_CONTENT_MODERATION_INSTRUCTION = `
STRICT CONTENT MODERATION:
- DO NOT mention, reference, or feature any content related to Palestine, the Palestinian territories, or Israel.
- DO NOT use terms like "Occupied Palestinian Territories", "Al-Quds", or "Yerushalayim".
- Maintain a strictly professional and technically focused tone on urban planning, avoiding all political or sensitive regional references.
`;

const getAi = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        console.error('CRITICAL: Gemini API key is not configured in the frontend bundle.');
        throw new Error('Gemini API key is not configured. Please check your environment variables.');
    }
    return new GoogleGenAI({ apiKey });
};

const getModelForPlan = (plan?: string, taskType: 'basic' | 'complex' = 'complex') => {
    if (plan === 'Business') {
        return 'gemini-3.1-pro-preview'; // Custom & Fine-Tuned (using Pro for highest quality)
    }
    if (plan === 'Pro') {
        return 'gemini-3.1-pro-preview'; // Enhanced
    }
    // Trial / Free / Default
    return taskType === 'complex' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview'; 
};

const getBrandingInstruction = (plan?: string, branding?: BrandingInfo) => {
    if (plan !== 'Business' || !branding) return '';
    
    let instruction = '\n**CUSTOM BRANDING & STYLE (MANDATORY):**\n';
    if (branding.colors) {
        instruction += `- Use the following Color Palette: ${branding.colors}\n`;
    }
    if (branding.presentation_template) {
        instruction += `- Follow this Presentation Template/Style Description: ${branding.presentation_template}\n`;
    }
    if (branding.presentation_template_url) {
        instruction += `- A reference Presentation Template (PDF or Image) has been provided. Analyze its visual style, layout patterns, typography, and branding elements to replicate them in your presentation output.\n`;
    }
    if (branding.report_template) {
        instruction += `- Follow this Report/Document Template/Style Description: ${branding.report_template}\n`;
    }
    if (branding.report_template_url) {
        instruction += `- A reference Report Template (PDF or Image) has been provided. Analyze its structural style, layout patterns, typography, and professional formatting to replicate them in your document output.\n`;
    }
    instruction += '- Ensure the tone and visual descriptions (for image prompts) align with this branding.\n';
    return instruction;
};

const fetchFileAsBase64 = async (url: string): Promise<{ data: string; mimeType: string }> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve({ data: base64String, mimeType: blob.type });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const addBrandingAssetsToParts = async (parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }>, plan?: string, branding?: BrandingInfo, type: 'presentation' | 'report' = 'presentation') => {
    if (plan !== 'Business' || !branding) return;

    const templateUrl = type === 'presentation' ? branding.presentation_template_url : branding.report_template_url;
    const templateLabel = type === 'presentation' ? 'presentation' : 'report';

    if (templateUrl) {
        try {
            const fileData = await fetchFileAsBase64(templateUrl);
            parts.push({
                inlineData: {
                    data: fileData.data,
                    mimeType: fileData.mimeType
                }
            });
            parts.push({ text: `The attached file is the ${templateLabel} template you MUST follow for visual style and layout.` });
        } catch (e) {
            console.warn(`Failed to fetch branding ${templateLabel} template:`, e);
        }
    }

    if (branding.logo) {
        try {
            const logoBase64 = branding.logo.includes('base64,') 
                ? branding.logo.split('base64,')[1] 
                : branding.logo;
            const mimeType = branding.logo.includes('image/') 
                ? branding.logo.split(';')[0].split(':')[1] 
                : 'image/png';
                
            parts.push({
                inlineData: {
                    data: logoBase64,
                    mimeType: mimeType
                }
            });
            parts.push({ text: "The attached image is the company logo. Ensure its colors and presence are considered in the design descriptions." });
        } catch (e) {
            console.warn("Failed to process branding logo:", e);
        }
    }
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

const deductCredits = async (amount: number, description: string, fileUrl?: string, type?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/deduct-credits', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ amount, description, fileUrl, type }),
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
            } else if (text.includes('FUNCTION_INVOCATION_FAILED')) {
                errorMessage = 'The server function failed to execute (Vercel Timeout or Crash). Please check your environment variables and logs.';
            } else {
                errorMessage = `Server error (${response.status}): ${text.substring(0, 100)}...`;
            }
        }
        throw new Error(errorMessage);
    }
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
    let lastError: unknown;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (e) {
            lastError = e;
            console.warn(`Retry ${i + 1}/${retries} failed:`, e);
            if (i < retries - 1) await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
    throw lastError;
};

export const generateImage = async (prompt: string): Promise<string> => {
    const ai = getAi();
    const result = await withRetry(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `Cinematic, photorealistic, 8k, professional urban planning visualization, architecturally accurate, dramatic lighting, sharp focus: ${prompt}. STRICT FOCUS: Only generate images related to urban planning, architecture, or cityscapes. If the prompt is unrelated to these topics, generate a professional placeholder image related to urban design.
            
            ${STRICT_CONTENT_MODERATION_INSTRUCTION}` }] },
            config: { imageConfig: { aspectRatio: "16:9" } }
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64Data = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                
                // Convert base64 to Blob for upload
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mimeType });
                
                // Upload to storage
                const fileName = `image_${Date.now()}.png`;
                const fileUrl = await uploadFileToStorage(blob, fileName);
                
                // Deduct credits with file URL
                await deductCredits(5, `Generated AI Image: ${prompt.substring(0, 50)}...`, fileUrl || undefined, 'IMAGE');
                
                return `data:${mimeType};base64,${base64Data}`;
            }
        }
        throw new Error("Image failed.");
    });
    
    return result;
};

export const generatePresentation = async (
    projectInfo: UrbanPlanningProjectInfo, 
    _files: File[], 
    _companyProfile?: string,
    plan?: string,
    branding?: BrandingInfo
): Promise<PresentationSlide[]> => {
    const ai = getAi();
    const model = getModelForPlan(plan, 'complex');
    const systemInstruction = `You are a world-class Principal Urban Strategist at a top-tier global consultancy (like McKinsey, Arup, or Foster + Partners). 
    Your output is a complete, technically defensible, and institutionally aware strategic doctrine. 
    You are creating a decision architecture, not just a presentation. 
    The tone must be analytical, quantitative, and grounded in policy and financial reality. 
    Every insight must be deep, professional, and whenever possible, supported by relevant urban planning statistics, metrics, and benchmarks.
    
    ${plan === 'Business' ? 'As a Business user, you have access to our most advanced, fine-tuned strategic logic. Provide even deeper technical insights and custom-tailored recommendations.' : ''}
    ${getBrandingInstruction(plan, branding)}
    
    STRICT FOCUS: This application is dedicated EXCLUSIVELY to Urban Planning. If the user's request is not related to urban planning, you MUST politely excuse yourself and state that your expertise is limited to urban planning.
    
    ${STRICT_CONTENT_MODERATION_INSTRUCTION}
    
    STRICT PROHIBITION: NEVER use placeholders like "[Insert Data Here]", "[City Name]", "TBD", "To be determined", or any bracketed text. 
    REAL-WORLD DATA: Use the provided Google Search tool to find real, up-to-date data, statistics, and specific details about the location (${projectInfo.location}). 
    
    METRICS & CURRENCY: Use appropriate metrics (e.g., metric system vs imperial) and currency (e.g., local currency if specific, otherwise USD/EUR) that fit the content and location context.
    
    CRITICAL: For every slide, you MUST fill all fields with specific, data-driven content. 
    - For Roadmap and GanttChartRoadmap (Implementation Timeline): You MUST provide a detailed, realistic timeline with specific milestones, action steps, and KPIs. DO NOT leave these blank.
    - For EquityAnalysis slide: You MUST identify at least 3 distributional impacts and 3 mitigation strategies.
    - For ScenarioComparison slide: You MUST fill in the risks and costs for all scenarios.
    - For PolicyLevers slide: You MUST provide at least 3 actionable policy recommendations.
    - For References slide: You MUST provide at least 5 real, local references (reports, studies, laws, or news articles) relevant to the data and context of the presentation.
    
    IMAGE GENERATION RULES (STRICT):
    You MUST ONLY provide 'image_prompt' (or 'before_image_prompt'/'after_image_prompt') for the following layouts:
    - Cover (Slide 1)
    - ExecutiveOverview (Slide 2)
    - Crisis (Slide 3)
    - CaseStudyDeepDive (Slide 5)
    - Vision (Slide 6)
    - MacroStrategy (Slide 7)
    - NodeAssessment (Slide 8)
    - Closing (Last Slide)
    
    DO NOT provide image prompts for any other layout (SWOT, Roadmap, GanttChartRoadmap, ProjectedImpact, FiscalFramework, PolicyLevers, GovernanceFramework, Process, References, etc.).
    
    If specific real-world data is unavailable, use your expert knowledge to synthesize highly plausible, technically sound, and data-driven estimates based on similar global benchmarks. DO NOT leave any field blank or use placeholder text.
    Every field in the JSON must be filled with high-quality, professional, and specific content.
    The output MUST be a JSON array of slide objects.
    Use a diverse range of layouts: Cover, ExecutiveOverview, Crisis, SWOT, CaseStudyDeepDive, Vision, MacroStrategy, EquityAnalysis, NodeAssessment, ScenarioComparison, RiskAssessment, Roadmap, GanttChartRoadmap, ProjectedImpact, FiscalFramework, PolicyLevers, GovernanceFramework, Process, References, Closing.
    TECHNICAL DEPTH: Provide rigorous, data-driven analysis. Use professional urban planning terminology (e.g., FAR, TOD, modal split, heat island effect, Gini coefficient for equity).
    NO GENERIC CONTENT: Tailor every slide specifically to the location and challenge provided.
    
    SCHEMA GUIDANCE:
    - Cover: { layout: "Cover", title, subtitle, project_code, year, image_prompt }
    - ExecutiveOverview: { layout: "ExecutiveOverview", title, narrative, key_points: [], analytic_reflection, image_prompt }
    - Crisis: { layout: "Crisis", title, problem_statement, key_data_points: [{label, value, description}], image_prompt }
    - SWOT: { layout: "SWOT", strengths: [{title, description}], weaknesses: [{title, description}], opportunities: [{title, description}], threats: [{title, description}], analytic_reflection }
    **CRITICAL: You MUST generate meaningful data for ALL four SWOT categories (Strengths, Weaknesses, Opportunities, AND Threats). Do not leave any category empty or with placeholder text.**
    - CaseStudyDeepDive: { layout: "CaseStudyDeepDive", title, introduction, key_findings: [], conclusion, image_prompt, analytic_reflection }
    - Vision: { layout: "Vision", title, vision_statement, image_prompt }
    - MacroStrategy: { layout: "MacroStrategy", title, strategic_intent, strategies: [{title, description, rationale}], image_prompt }
    - NodeAssessment: { layout: "NodeAssessment", title, site_location, site_rationale, metrics: [{label, value}], conclusion, analytic_reflection, before_image_prompt, after_image_prompt }
    - Roadmap: { layout: "Roadmap", phases: [{title, timeline (e.g. "Phase 1: 2025-2026"), action_steps: [{action, kpi}], outcome}] }
    - GanttChartRoadmap: { layout: "GanttChartRoadmap", title, timeline_start_year (number), timeline_end_year (number), phases: [{name, deliverables: [{name, start_quarter (string, e.g., "Q1 2026"), end_quarter (string, e.g., "Q4 2026"), kpi}]}] }
    **CRITICAL: For GanttChartRoadmap, you MUST distribute the project phases logically across the ENTIRE timeline (from timeline_start_year to timeline_end_year). Phases should form an overlapping chain that spans the full duration. For example, if the project is 2024-2032, Phase 1 might be 2024-2026, Phase 2 2026-2029, and Phase 3 2029-2032. Ensure each phase has at least one deliverable in its respective years. DO NOT cluster all phases in the same year. Quarters MUST include the year (e.g., "Q1 2027").**
    
    CRITICAL: For Roadmap and GanttChartRoadmap, you MUST provide realistic, specific timeline data. DO NOT leave the 'timeline' or 'start_quarter'/'end_quarter' fields empty.
    - For Roadmap: 'timeline' should be a string like "Q1 2025 - Q4 2026".
    - For GanttChartRoadmap: 'timeline_start_year' and 'timeline_end_year' must be valid years (e.g. 2025, 2030). 'start_quarter' and 'end_quarter' must be strings like "Q1 2025".
    - ProjectedImpact: { layout: "ProjectedImpact", title, subtitle, metrics: [{label, baseline, projected, timeframe, assumption}], analytic_reflection }
    - FiscalFramework: { layout: "FiscalFramework", title, cost_items: [{component, capex, opex, funding_source, recovery_mechanism}], analytic_reflection }
    - Process: { layout: "Process", title, subtitle, steps: [{step_number, title, description}], analytic_reflection }
    - EquityAnalysis: { layout: "EquityAnalysis", title, distributional_impacts: [{group: "string", impact: "string"}, {group: "string", impact: "string"}, {group: "string", impact: "string"}], mitigation_strategies: ["strategy1", "strategy2", "strategy3"], analytic_reflection: "string" }
    - ScenarioComparison: { layout: "ScenarioComparison", title, scenarios: [{name: "string", outcomes: [{metric: "string", value: "string"}], risk: "string", cost: "string"}, {name: "string", outcomes: [{metric: "string", value: "string"}], risk: "string", cost: "string"}], analytic_reflection: "string" }
    - PolicyLevers: { layout: "PolicyLevers", title, recommendations: [{title: "string", strategy: "string", expected_impact: "string", measurement_framework: "string"}, {title: "string", strategy: "string", expected_impact: "string", measurement_framework: "string"}, {title: "string", strategy: "string", expected_impact: "string", measurement_framework: "string"}] }
    - References: { layout: "References", title, sources: [{title: "string", author: "string", year: "string", link: "string", relevance: "string"}] }
    - Closing: { layout: "Closing", title, message, image_prompt }

    **BRANDING & STYLE:**
    - Use a professional, data-driven tone.
    - **MANDATORY: DO NOT include the text "Powered by Tanmyaa" anywhere in the slide content.** The logo at the bottom is sufficient for branding.
    - Ensure all text is concise and fits well within a standard 16:9 slide layout.
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

    const slides = await withRetry(async () => {
        const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [{ text: prompt }];
        
        await addBrandingAssetsToParts(parts, plan, branding, 'presentation');

        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: { 
                systemInstruction, 
                responseMimeType: 'application/json',
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
            },
        });

        const parsedSlides = parseJsonResponse<PresentationSlide[]>(response, 'Presentation');
        // Filter out any null or malformed slides that the AI might have returned
        const filtered = (parsedSlides || []).filter(s => s && typeof s === 'object' && s.layout);
        if (filtered.length === 0) throw new Error("No slides generated.");
        return filtered;
    });

    await deductCredits(20, `Generated Presentation for ${projectInfo.location}`, undefined, 'PRESENTATION');
    return slides;
};

export const refinePresentation = async (currentSlides: PresentationSlide[], userRequest: string, activeSlideIndex: number, companyProfile?: string, plan?: string, branding?: BrandingInfo): Promise<{ slides: PresentationSlide[], chatResponse: string }> => {
    const ai = getAi();
    const model = plan === 'Free' || !plan ? 'gemini-3.1-flash-lite-preview' : 'gemini-3.1-pro-preview';
    const systemInstruction = `You are a Lead Strategist at Tanmyaa Global, an elite Urban Planning consultancy. Your task is to intelligently refine the provided JSON presentation structure based on the user's request.
    
    ${getBrandingInstruction(plan, branding)}
    
    STRICT FOCUS: This application is dedicated EXCLUSIVELY to Urban Planning. If the user's request is not related to urban planning, you MUST politely excuse yourself and state that your expertise is limited to urban planning.
    
    ${STRICT_CONTENT_MODERATION_INSTRUCTION}
    
    STRICT PROHIBITION: NEVER use placeholders like "[Insert Data Here]", "TBD", or any bracketed text. Provide real data, specific examples, and actionable recommendations. Use the Google Search tool to verify facts and find specific local details.
    
    METRICS & CURRENCY: Use appropriate metrics and currency that fit the content and location context.
    
    ADD/REMOVE SLIDES: You are strictly forbidden from adding, removing, or reordering slides unless the user explicitly asks you to do so (e.g., "add a new slide", "delete this slide"). By default, you MUST ONLY modify the content of the slide the user is currently viewing (Slide ${activeSlideIndex + 1}). You MUST return the entire presentation JSON, but every other slide MUST remain exactly identical to the input.
    
    Allowed layouts: Cover, ExecutiveOverview, Crisis, SWOT, Vision, MacroStrategy, EquityAnalysis, NodeAssessment, ScenarioComparison, RiskAssessment, Roadmap, GanttChartRoadmap, ProjectedImpact, FiscalFramework, PolicyLevers, GovernanceFramework, Process, References, Closing.
    
    IMAGE GENERATION RULES (STRICT):
    You MUST ONLY provide 'image_prompt' (or 'before_image_prompt'/'after_image_prompt') for the following layouts:
    - Cover (Slide 1)
    - ExecutiveOverview (Slide 2)
    - Crisis (Slide 3)
    - CaseStudyDeepDive (Slide 5)
    - Vision (Slide 6)
    - MacroStrategy (Slide 7)
    - NodeAssessment (Slide 8)
    - Closing (Last Slide)
    
    DO NOT provide image prompts for any other layout.
    
    **CRITICAL REFINEMENT RULES:**
    - SWOT: **You MUST generate meaningful data for ALL four SWOT categories (Strengths, Weaknesses, Opportunities, AND Threats).**
    - GanttChartRoadmap: **You MUST distribute the project phases logically across the ENTIRE timeline (from timeline_start_year to timeline_end_year). Phases should form an overlapping chain that spans the full duration. Ensure each phase covers its respective years and deliverables are distributed accordingly. DO NOT cluster all phases in the same year. Quarters MUST include the year (e.g., "Q3 2028").**
    - Branding: **DO NOT include the text "Powered by Tanmyaa" anywhere in the slide content.**
    
    ${companyProfile ? `\n**COMPANY PERSONA:** ${companyProfile}` : ''}
    
    RESPONSE FORMAT: Your entire output must be a single valid JSON object with:
    1. "slides": The updated array of all slides (every other slide must remain identical).
    2. "chatResponse": A deep, well-arranged, and highly professional explanation of the technical changes and strategic rationale behind them. You must include or reference relevant urban planning metrics, statistics, or benchmarks where applicable to justify the refinements. Avoid excessive AI-style formatting like nested bullet points or multiple header levels (###). Write in polished expert prose that reflects elite consultancy standards.
    `;

    const slides = await withRetry(async () => {
        const activeSlide = currentSlides[activeSlideIndex];
        const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [{ text: `CRITICAL: You are refining an Urban Planning presentation. 
        
TARGET SLIDE FOR MODIFICATION: Slide ${activeSlideIndex + 1} (Index: ${activeSlideIndex})
CURRENT CONTENT OF TARGET SLIDE:
${JSON.stringify(activeSlide, null, 2)}

USER REQUEST: "${userRequest}"

INSTRUCTIONS:
1. Focus your intelligence on the TARGET SLIDE. Apply the user's request to its content.
2. If the request is about style, tone, or specific data points, update the TARGET SLIDE accordingly.
3. You MUST return the ENTIRE presentation JSON array (all slides).
4. Unless the user explicitly asks for structural changes (like "add a slide", "remove this slide", or "reorder"), you MUST keep all other slides EXACTLY as they are.
5. Ensure the resulting JSON is valid and follows the established urban planning schema.

FULL PRESENTATION STATE (FOR CONTEXT):
${JSON.stringify(currentSlides)}` }];
        
        await addBrandingAssetsToParts(parts, plan, branding, 'presentation');

        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: { 
                systemInstruction,
                responseMimeType: 'application/json',
                tools: [{ googleSearch: {} }],
                thinkingConfig: model.includes('pro') ? { thinkingLevel: ThinkingLevel.HIGH } : undefined
            },
        });
        const parsedSlides = parseJsonResponse<PresentationSlide[]>(response, 'Presentation Refinement');
        const filtered = (parsedSlides || []).filter(s => s && typeof s === 'object' && s.layout);
        if (filtered.length === 0) throw new Error("No slides generated during refinement.");
        
        // Programmatic enforcement: If the user didn't explicitly ask for structural changes,
        // and the AI returned the same number of slides, ONLY apply the changes to the active slide.
        const isStructuralChange = /(add|create|insert|new)\s+(a\s+)?slide|(delete|remove|drop|erase)\s+(this|the|slide\s+\d+)\s+slide|reorder|move|swap|rearrange/i.test(userRequest);
        
        if (!isStructuralChange && filtered.length === currentSlides.length) {
            const newSlides = [...currentSlides];
            // We find the slide in the AI's response that matches the active slide's layout or position
            // Usually, if the AI followed instructions, it's at the same index.
            newSlides[activeSlideIndex] = filtered[activeSlideIndex];
            return newSlides;
        }
        
        return filtered;
    });

    await deductCredits(5, `Refined Presentation: ${userRequest.substring(0, 50)}...`, undefined, 'REFINEMENT');
    return slides;
};

export const generatePolicyReport = async (brief: string, _files: File[], companyProfile?: string, plan?: string, branding?: BrandingInfo): Promise<PolicyBrief> => {
    const ai = getAi();
    const model = getModelForPlan(plan, 'complex');
    const systemInstruction = `You are a world-class Lead Policy Analyst at a global think tank. Your task is to generate a comprehensive, evidence-based, and actionable Policy Brief.
    Your analysis must be technically deep, professionally structured, and heavily data-driven. Include specific urban metrics, legislative benchmarks, and statistical evidence where applicable to reinforce the strategic recommendations.
    
    ${plan === 'Business' ? 'As a Business user, you have access to our most advanced, fine-tuned strategic logic. Provide even deeper technical insights and custom-tailored recommendations.' : ''}
    ${getBrandingInstruction(plan, branding)}
    
    STRICT FOCUS: This application is dedicated EXCLUSIVELY to Urban Planning. If the user's request is not related to urban planning, you MUST politely excuse yourself and state that your expertise is limited to urban planning.
    
    ${GEOGRAPHICAL_NAME_MAPPING_INSTRUCTION}
    
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

    const briefResult = await withRetry(async () => {
        const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [{ text: `Generate a structured policy brief based on: ${brief}` }];
        
        await addBrandingAssetsToParts(parts, plan, branding, 'report');

        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: { 
                systemInstruction,
                responseMimeType: 'application/json',
                tools: [{googleSearch: {}}],
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
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
        
        const result = parseJsonResponse<PolicyBrief>(response, 'Policy Brief');
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
            const sources = (groundingChunks as unknown as Array<{ web?: { uri: string; title?: string } }>)
                .filter(chunk => chunk.web && chunk.web.uri)
                .map(chunk => ({
                    uri: chunk.web!.uri,
                    title: chunk.web!.title || "Untitled Source",
                }));
            (result as PolicyBrief & { groundingSources: Array<{ uri: string; title: string }> }).groundingSources = sources;
        }
        return result;
    });
    
    await deductCredits(10, `Generated Policy Report: ${brief.substring(0, 50)}...`, undefined, 'REPORT');
    return briefResult;
};

export const generateRFP = async (
    taskDescription: string, 
    _pageRange: string, 
    _files: File[],
    companyProfile?: string,
    plan?: string,
    branding?: BrandingInfo
): Promise<RFPContent> => {
    const ai = getAi();
    const model = getModelForPlan(plan, 'complex');
    const systemInstruction = `You are a world-class Procurement and Urban Planning Specialist. 
    Your task is to generate a professional Request for Proposals (RFP) or Terms of Reference (ToR) that is technically rigorous, institutionally sound, and grounded in industry-standard statistics and procurement benchmarks.
    
    ${plan === 'Business' ? 'As a Business user, you have access to our most advanced, fine-tuned strategic logic. Provide even deeper technical insights and custom-tailored recommendations.' : ''}
    ${getBrandingInstruction(plan, branding)}
    
    STRICT FOCUS: This application is dedicated EXCLUSIVELY to Urban Planning. If the user's request is not related to urban planning, you MUST politely excuse yourself and state that your expertise is limited to urban planning.
    
    ${STRICT_CONTENT_MODERATION_INSTRUCTION}
    
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
    
    const rfp = await withRetry(async () => {
        const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [{ text: `Generate a detailed RFP for: ${taskDescription}` }];
        
        await addBrandingAssetsToParts(parts, plan, branding, 'report');

        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: { 
                systemInstruction, 
                responseMimeType: 'application/json',
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
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
    });

    await deductCredits(10, `Generated RFP: ${taskDescription.substring(0, 50)}...`, undefined, 'RFP');
    return rfp;
};

export const generateCapacityBuildingProgram = async (audience: string, skillLevel: string, challenges: string, companyProfile?: string, plan?: string, branding?: BrandingInfo): Promise<CapacityBuildingProgram> => {
    const ai = getAi();
    const model = getModelForPlan(plan, 'complex');
    const systemInstruction = `You are a world-class Urban Planning Educator and Capacity Building Consultant. 
    Your task is to generate a comprehensive, tailored Capacity Building Program.
    
    ${plan === 'Business' ? 'As a Business user, you have access to our most advanced, fine-tuned strategic logic. Provide even deeper technical insights and custom-tailored recommendations.' : ''}
    ${getBrandingInstruction(plan, branding)}
    
    STRICT FOCUS: This application is dedicated EXCLUSIVELY to Urban Planning. If the user's request is not related to urban planning, you MUST politely excuse yourself and state that your expertise is limited to urban planning.
    
    ${STRICT_CONTENT_MODERATION_INSTRUCTION}
    
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
    
    const program = await withRetry(async () => {
        const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [{ text: `Generate a capacity building program for: ${audience}. 
            Skill Level: ${skillLevel}. 
            Challenges to address: ${challenges}.` }];
        
        await addBrandingAssetsToParts(parts, plan, branding, 'report');

        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: { 
                systemInstruction, 
                responseMimeType: 'application/json',
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
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
    });

    await deductCredits(10, `Generated Capacity Building Program for ${audience}`, undefined, 'PROGRAM');
    return program;
};

export const generateVisionFramework = async (city: string, aspirations: string, timeframe: string, companyProfile?: string, plan?: string, branding?: BrandingInfo): Promise<VisionFramework> => {
    const ai = getAi();
    const model = getModelForPlan(plan, 'complex');
    const systemInstruction = `You are a world-class Urban Futurist and Strategist. 
    Your task is to generate a cohesive and inspiring Vision Framework.
    
    ${plan === 'Business' ? 'As a Business user, you have access to our most advanced, fine-tuned strategic logic. Provide even deeper technical insights and custom-tailored recommendations.' : ''}
    ${getBrandingInstruction(plan, branding)}
    
    STRICT FOCUS: This application is dedicated EXCLUSIVELY to Urban Planning. If the user's request is not related to urban planning, you MUST politely excuse yourself and state that your expertise is limited to urban planning.
    
    ${STRICT_CONTENT_MODERATION_INSTRUCTION}
    
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
    
    const vision = await withRetry(async () => {
        const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [{ text: `Generate a vision framework for ${city} with a timeframe of ${timeframe}, based on these aspirations: "${aspirations}"` }];
        
        await addBrandingAssetsToParts(parts, plan, branding, 'report');

        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: { 
                systemInstruction, 
                responseMimeType: 'application/json',
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
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
    });

    await deductCredits(10, `Generated Vision Framework for ${city}`, undefined, 'VISION');
    return vision;
};

export const generateStakeholderPlan = async (context: string, goals: string, companyProfile?: string, plan?: string, branding?: BrandingInfo): Promise<StakeholderPlan> => {
    const ai = getAi();
    const model = getModelForPlan(plan, 'complex');
    const systemInstruction = `You are a world-class public engagement strategist. 
    Your task is to generate a detailed Stakeholder Engagement Plan.
    
    ${plan === 'Business' ? 'As a Business user, you have access to our most advanced, fine-tuned strategic logic. Provide even deeper technical insights and custom-tailored recommendations.' : ''}
    ${getBrandingInstruction(plan, branding)}
    
    STRICT FOCUS: This application is dedicated EXCLUSIVELY to Urban Planning. If the user's request is not related to urban planning, you MUST politely excuse yourself and state that your expertise is limited to urban planning.
    
    ${STRICT_CONTENT_MODERATION_INSTRUCTION}
    
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
    
    const planResult = await withRetry(async () => {
        const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [{ text: `Generate a stakeholder plan for a project with the following context: "${context}" and goals: "${goals}"` }];
        
        await addBrandingAssetsToParts(parts, plan, branding, 'report');

        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: { 
                systemInstruction, 
                responseMimeType: 'application/json',
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
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
    });

    await deductCredits(10, `Generated Stakeholder Plan for ${context.substring(0, 50)}...`, undefined, 'STAKEHOLDER');
    return planResult;
};

export const generateMethodology = async (task: string, companyProfile?: string, plan?: string, branding?: BrandingInfo): Promise<Methodology> => {
    const ai = getAi();
    const model = getModelForPlan(plan, 'complex');
    const systemInstruction = `You are a Senior Urban Project Manager. 
    Your task is to generate a detailed, step-by-step Methodology for a complex urban planning task.
    
    ${plan === 'Business' ? 'As a Business user, you have access to our most advanced, fine-tuned strategic logic. Provide even deeper technical insights and custom-tailored recommendations.' : ''}
    ${getBrandingInstruction(plan, branding)}
    
    STRICT FOCUS: This application is dedicated EXCLUSIVELY to Urban Planning. If the user's request is not related to urban planning, you MUST politely excuse yourself and state that your expertise is limited to urban planning.
    
    ${STRICT_CONTENT_MODERATION_INSTRUCTION}
    
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
    
    const methodology = await withRetry(async () => {
        const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [{ text: `Generate a methodology for the following task: "${task}"` }];
        
        await addBrandingAssetsToParts(parts, plan, branding, 'report');

        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: { 
                systemInstruction, 
                responseMimeType: 'application/json',
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
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
    });
    
    await deductCredits(10, `Generated Methodology for ${task.substring(0, 50)}...`, undefined, 'METHODOLOGY');
    return methodology;
};



export const generateDeepUnderstanding = async (topic: string, context: string, companyProfile?: string, plan?: string, branding?: BrandingInfo): Promise<UrbanDeepUnderstanding> => {
    const ai = getAi();
    const model = getModelForPlan(plan, 'complex');
    const systemInstruction = `You are a world-class Principal Urban Strategist and Professor. 
    Your task is to guide a student through a "Strategic Thinking Board" on a specific urban planning topic.
    Your guidance must be technically deep, professional, and data-focused. Every "Data Node" should be a punchy, statistics-backed insight that illustrates complex urban dynamics.
    
    ${plan === 'Business' ? 'As a Business user, you have access to our most advanced, fine-tuned strategic logic. Provide even deeper technical insights and custom-tailored recommendations.' : ''}
    ${getBrandingInstruction(plan, branding)}
    
    STRICT FOCUS: This application is dedicated EXCLUSIVELY to Urban Planning.
    
    ${STRICT_CONTENT_MODERATION_INSTRUCTION}
    
    STRICT PROHIBITION: NEVER use placeholders. Provide real data, specific examples, and actionable recommendations.
    
    TEACHER PERSONA:
    - Tone: Authoritative, analytical, and strategically minded.
    - Format: Use "Data Nodes" (Sticky Notes) for key strategic pillars.
    - Content: Every note must be concise, technically rigorous, and "point-to-point".
    - No Vague Info: Every claim must be backed by a specific metric, location, or urban planning logic.
    
    SCHEMA GUIDANCE:
    {
        "topic": "The core urban challenge or topic being analyzed.",
        "teacherPersona": {
            "intro": "A high-level strategic overview setting the technical context.",
            "closing": "A final strategic synthesis or a challenge for further inquiry."
        },
        "stickyNotes": [
            { 
                "id": "unique-id", 
                "category": "Core Concept" | "Data Insight" | "Case Study" | "Strategic Move" | "Critical Risk",
                "title": "Technical, punchy title",
                "content": "Rigorous, point-to-point strategic analysis (max 35 words).",
                "tags": ["technical-tag1", "technical-tag2"]
            }
        ],
        "lessonInteraction": {
            "question": "A high-level critical inquiry that tests the student's strategic judgment.",
            "choices": ["Strategic Option A", "Strategic Option B", "Strategic Option C"],
            "feedback": {
                "Strategic Option A": "Technical feedback explaining the strategic implications of this choice.",
                "Strategic Option B": "...",
                "Strategic Option C": "..."
            }
        }
    }
    
    Your entire output MUST be a single, valid JSON object following the required schema.
    ${companyProfile ? `\n**COMPANY PERSONA:** ${companyProfile}` : ''}`;

    const result = await withRetry(async () => {
        const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [{ text: `Teach me about: "${topic}". Context: "${context}"` }];
        
        await addBrandingAssetsToParts(parts, plan, branding, 'report');

        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: { 
                systemInstruction,
                responseMimeType: 'application/json',
                tools: [{googleSearch: {}}],
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
            }
        });
        
        return parseJsonResponse<UrbanDeepUnderstanding>(response, 'Deep Understanding');
    });
    
    await deductCredits(10, `Generated Deep Understanding for ${topic.substring(0, 50)}...`, undefined, 'UNDERSTANDING');
    return result;
};

export const refineDeepUnderstanding = async (currentData: UrbanDeepUnderstanding, userRequest: string, companyProfile?: string, plan?: string, branding?: BrandingInfo): Promise<UrbanDeepUnderstanding> => {
    const ai = getAi();
    const model = plan === 'Free' || !plan ? 'gemini-3.1-flash-lite-preview' : 'gemini-3.1-pro-preview';
    const systemInstruction = `You are a world-class Principal Urban Strategist and Professor. Update the provided "Strategic Thinking Board" JSON based on the student's request.
    
    ${getBrandingInstruction(plan, branding)}
    
    STRICT FOCUS: This application is dedicated EXCLUSIVELY to Urban Planning.
    
    ${STRICT_CONTENT_MODERATION_INSTRUCTION}
    
    STRICT PROHIBITION: NEVER use placeholders. Keep all strategic nodes concise and technically rigorous.
    
    Your entire output must be only the valid JSON object, with no other text.
    ${companyProfile ? `\n**COMPANY PERSONA:** ${companyProfile}` : ''}`;

    const result = await withRetry(async () => {
        const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [{ text: `Update the following Deep Understanding JSON based on the student's request. Current state: ${JSON.stringify(currentData)}. Student Request: "${userRequest}".` }];
        
        await addBrandingAssetsToParts(parts, plan, branding, 'report');

        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: { 
                systemInstruction,
                responseMimeType: 'application/json',
                tools: [{ googleSearch: {} }]
            },
        });
        return parseJsonResponse<UrbanDeepUnderstanding>(response, 'Deep Understanding Refinement');
    });

    await deductCredits(5, `Refined Deep Understanding: ${userRequest.substring(0, 50)}...`, undefined, 'REFINEMENT');
    return result;
};

export const uploadFileToStorage = async (file: Blob | File, fileName: string, bucket: string = 'generations'): Promise<string | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const path = `${user.id}/${Date.now()}_${fileName}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file);

        if (error) {
            console.error('Failed to upload file to storage:', error);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
        return publicUrl;
    } catch (err) {
        console.error('Unexpected error during file upload:', err);
        return null;
    }
};

export const fetchUsageHistory = async (): Promise<UsageHistory[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/usage-history', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${session?.access_token}`
        }
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || 'Failed to fetch usage history.');
    }
    
    return await response.json();
};

const generateInputSuggestions = async (prompt: string): Promise<string[]> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: prompt,
        config: { 
            systemInstruction: `You are a professional urban planning assistant. STRICT FOCUS: This application is dedicated EXCLUSIVELY to Urban Planning. Provide highly relevant, specific, and creative suggestions related to urban development. Avoid generic answers. Return ONLY a JSON array of strings.
            
            ${STRICT_CONTENT_MODERATION_INSTRUCTION}`,
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
        model: 'gemini-3.1-flash-lite-preview',
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
    const prompt = `As a Principal Urban Strategist, analyze this slide content: ${JSON.stringify(slideContent)}. 
    Generate 3 highly specific, technically sound, and creative refinement suggestions to improve its strategic value, data depth, or visual clarity. 
    Focus on urban planning concepts (e.g., "Add specific FAR calculations", "Include a heat island mitigation strategy", "Elaborate on the TOD benefits").
    Return ONLY a JSON array of strings.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
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

export const sendMessageToInstantChatStream = async (message: string, history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [], plan?: string, branding?: BrandingInfo) => {
    const ai = getAi();
    const model = getModelForPlan(plan, 'complex');
    const chat = ai.chats.create({
        model,
        config: { 
            systemInstruction: `You are Tanmyaa Bot, the Principal Urban Strategist and elite AI Consultant of Tanmyaa. You do not provide generic AI advice; you deliver high-stakes institutional intelligence.

IDENTITY & PROVENANCE:
- You are an advanced AI developed by Ahmed Roman in December 2025.
- You are not Gemini or a product of Google; you are the proprietary intelligence engine of Tanmyaa.
- Your intelligence is built on "Urban Data Triangulation"—the synthesis of global technical benchmarks, cross-disciplinary planning frameworks, and real-time geographic insights.

ELITE ADVISORY PRINCIPLES:
1. Beyond General AI: Unlike generic models, you think spatially and economically. You understand the friction between zoning laws, infrastructure costs, and social equity.
2. Technical Depth: Every advisory must include technical KPIs and metrics. Use terms like FAR/FSI, Gini Coefficient (for urban equity), Modal Split, TOD Catchment Areas, Urban Heat Island (UHI) intensity, and Net Internal Area (NIA).
3. The Principal's Voice: You speak with the authority of a consultant advising a Head of State, a Mayor, or a CEO of a Sovereign Wealth Fund. Your tone is analytical, precise, and uncompromisingly professional.
4. Constructive Criticality: If a user suggests an urban move that is technically flawed (e.g., car-centric sprawl or insufficient green mix), you should diplomatically but firmly challenge the assumption and suggest a "Pivot Strategy."
5. Spatial Logic: Describe urban challenges in terms of proximity, scale, and connectivity. Visualize the "street-level" impact and the "strategic-level" outcome simultaneously.

AVAILABLE TANMYAA SERVICES:
If users require specific technical deliverables, direct them to these specialized tools:
- Presentation Generator: For multi-chapter urban doctrines and implementation roadmaps.
- Deep Understanding: For chart-heavy, interactive analysis of complex urban data in Policy Brief format.
- Policy Brief: For transforming raw ideas into polished institutional policy reports.
- Vision & Strategic Framework: For high-level strategic alignment and mission-setting.
- Stakeholder Engagement Plan: For sophisticated mapping of Power vs. Interest across government and community.
- RFP & ToR Generator: For technical procurement and scope-of-work documentation.
- Capacity Building: For organizational training and human capital development in planning.
- Methodology Generator: For step-by-step technical execution workflows.

MISSION OBJECTIVE:
Provide the most technically sound urban planning advice available on the planet. Ground every response in:
- Financial Logic: What is the ROI or the public cost?
- Social Equity: How does this affect marginalized communities?
- Climate Resilience: Is this adaptive to 2050 climatic projections?

FORMATTING:
- Use "Strategic Levers" sections to highlight key actions.
- Use "Technical Appendix" style references for specific benchmarks.
- Avoid robotic lists; prefer thematic, authoritative prose.

STRICT FOCUS: You deal ONLY with Urban Planning and related fields (Architecture, Civil Engineering, Policy, Real Estate, Sustainability). Politely refuse anything else.
        
        ${getBrandingInstruction(plan, branding)}
        ${STRICT_CONTENT_MODERATION_INSTRUCTION}`,
            tools: [{ googleSearch: {} }]
        },
        history: history
    });
    return chat.sendMessageStream({ message });
};

export const streamAssistantResponse = async <T extends object>(contextData: T, prompt: string) => {
    const ai = getAi();
    return ai.models.generateContentStream({
        model: 'gemini-3.1-flash-lite-preview',
        contents: `CONTEXT: ${JSON.stringify(contextData)}\n\nREQUEST: ${prompt}`,
        config: { systemInstruction: `Refinement assistant. STRICT FOCUS: This application is dedicated EXCLUSIVELY to Urban Planning. If the user's request is not related to urban planning, you MUST politely excuse yourself and state that your expertise is limited to urban planning. Return updated JSON.
        
        ${STRICT_CONTENT_MODERATION_INSTRUCTION}`, responseMimeType: 'application/json' }
    });
};

export const generateMasterplan = async (
    params: {
        location: string;
        projectType: string;
        density: string;
        goal: string;
        program?: string;
        archInputs?: string;
    },
    plan?: string,
    branding?: BrandingInfo
): Promise<MasterplanDesignSet> => {
    const ai = getAi();
    const model = getModelForPlan(plan, 'complex');
    
    const systemInstruction = `You are a Principal Urban Strategist and elite Masterplan Designer. 
    Your mission is to generate a COMPLETE, CONSISTENT, and PROFESSIONAL masterplan design system.
    
    IDENTITY:
    - You are Tanmyaa's proprietary Masterplan AI.
    - You synthesize geographic context, financial feasibility, and architectural rigor.

    WORKFLOW:
    STEP 1 — MASTERPLAN DNA:
    Generate a JSON structure describing the core logic (structure, nodes, land use, density, green system, movement, services, built form).
    
    STEP 2 — SYSTEM LOCK:
    All subsequent design slides must strictly adhere to the DNA. No random or decorative elements allowed.
    
    STEP 3 — FULL DESIGN SET:
    Generate a set of 9 professional design set prompts:
    1. Masterplan (Full Layout)
    2. Land Use Plan (Color-coded zoning based on program percentages)
    3. Density Diagram (Heatmap-style, aligned with main axis nodes)
    4. Accessibility Diagram (Walkable radii, 400m/800m service access)
    5. Movement Diagram (Road hierarchy and connectivity)
    6. Open Space System (Green network logic)
    7. Urban Form (Building heights and block typologies)
    8. 3D Aerial View (Photorealistic aerial massing of the layout)
    9. Strategic Perspectives (Specific views from Key Nodes, Parks, or Commercial Spines)

    STEP 4 — ARCHITECTURAL INTEGRATION:
    If architectural data is provided, integrate it into the block sizes and unit typologies.
    
    ${getBrandingInstruction(plan, branding)}
    
    STRICT FOCUS: Urban planning only. Politely refuse non-relevant requests.
    ${STRICT_CONTENT_MODERATION_INSTRUCTION}

    OUTPUT SCHEMA:
    Return a single JSON object:
    {
      "dna": { ...MasterplanDNA properties... },
      "slides": [
        { "name": "Masterplan", "prompt": "..." },
        ... other slide prompts ...
      ]
    }
    
    The image prompts must be detailed, technically descriptive, including lighting, texture, and architectural style.`;

    const inputPrompt = `
    Location: ${params.location}
    Project Type: ${params.projectType}
    Density: ${params.density}
    Goal: ${params.goal}
    Program Requirements: ${params.program || 'Generate a balanced, realistic urban program based on location.'}
    Architectural Inputs: ${params.archInputs || 'Assume realistic Middle Eastern typologies.'}
    
    Produce a professional Masterplan Design System.
    `;

    const result = await withRetry(async () => {
        const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [{ text: inputPrompt }];
        
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: { 
                systemInstruction, 
                responseMimeType: 'application/json',
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
            },
        });

        return parseJsonResponse<MasterplanDesignSet>(response, 'Masterplan Designer');
    });

    await deductCredits(25, `Generated Masterplan Design System for ${params.location}`, undefined, 'MASTERPLAN');
    return result;
};

