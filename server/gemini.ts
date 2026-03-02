import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

export const generateImage = async (prompt: string): Promise<string> => {
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

export const generatePresentation = async (projectInfo: { authorRole?: string; location: string; scale: string; mainChallenge: string; policyContext: string; targetUsers: string; specificFocus: string }, _files: any[], _companyProfile?: string): Promise<any[]> => {
    void _files;
    void _companyProfile;
    const personaInstruction = projectInfo.authorRole 
      ? `The user creating this presentation has identified their role as: '${projectInfo.authorRole}'. Tailor the tone and complexity of your response appropriately (e.g., more explanatory for a 'Student', more technical for a 'Principal Planner').` 
      : '';
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

    const parts: { text: string }[] = [{ text: prompt }];
    // for (const file of files) parts.push(await fileToGenerativePart(file));
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts },
        config: { systemInstruction, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 32768 } },
    });

    return parseJsonResponse<any[]>(response, 'Presentation');
};

export const refinePresentation = async (currentSlides: any[], userRequest: string, activeSlideIndex: number): Promise<any[]> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Update the following presentation JSON based on the user request. The slide structure is flexible; you can add, remove, reorder, or modify slides to best fulfill the request. Current presentation state: ${JSON.stringify(currentSlides)}. The user is viewing slide ${activeSlideIndex + 1}. User Request: "${userRequest}".`,
        config: { 
            systemInstruction: `You are a Lead Strategist at Tanmyaa Global. Your task is to intelligently refine the provided JSON presentation structure based on the user's request, ensuring coherence. The slide structure is dynamic. IMPORTANT: Your entire output must be only the valid JSON array of slides, with no other text or explanation.`,
            responseMimeType: 'application/json', 
            thinkingConfig: { thinkingBudget: 32768 } 
        },
    });
    return parseJsonResponse<any[]>(response, 'Presentation Refinement');
};

export const generatePolicyReport = async (brief: string, _files: any[], companyProfile?: string): Promise<any> => {
    void _files;
    const parts: { text: string }[] = [{ text: `Generate a structured policy brief based on: ${brief}` }];
    // for (const file of files) parts.push(await fileToGenerativePart(file));

    const systemInstruction = `You are a world-class Lead Policy Analyst at a global think tank. Your task is to generate a comprehensive, evidence-based, and actionable Policy Brief based on the user's prompt and any provided documents.

    Your entire output MUST be a single, valid JSON object that adheres strictly to the following schema.

    **JSON SCHEMA (STRICT ADHERENCE REQUIRED):**
    {
      "title": "A concise and impactful title for the policy brief.",
      "executiveSummary": "A 2-3 sentence summary of the problem, recommendation, and key findings.",
      "policyProblem": {
        "definition": "A clear, data-driven definition of the policy problem.",
        "affectedParties": "Who is most affected by this problem?",
        "urgency": "Why is it critical to address this problem now?"
      },
      "evidenceAndFindings": {
        "summary": "A brief summary of the evidence base.",
        "findings": [
          "A key finding supported by evidence or data.",
          "Another key finding...",
          "..."
        ]
      },
      "policyOptions": [
        {
          "description": "Description of Policy Option 1.",
          "benefits": "Key benefits and positive outcomes of this option.",
          "risks": "Potential risks and downsides of this option.",
          "feasibility": "Assessment of the political, financial, and technical feasibility."
        }
      ],
      "recommendedAction": {
        "option": "The title or description of the recommended policy option.",
        "justification": "A strong, evidence-based justification for why this option is superior.",
        "impacts": "Projected social, economic, and environmental impacts of the recommendation."
      },
      "implementationConsiderations": {
        "responsibility": "Which agency or body would be responsible for implementation?",
        "capacity": "What resources and capacity are needed?",
        "timeline": "A high-level implementation timeline (e.g., Short-term: 1-2 years).",
        "risks": "Key implementation risks and proposed mitigation strategies."
      },
      "keyTakeaways": [
        "A concise, memorable takeaway for policymakers.",
        "Another key takeaway...",
        "..."
      ]
    }

    **CORE DIRECTIVES (NON-NEGOTIABLE):**

    1.  **JSON ONLY:** Your output must be only the JSON object, with no surrounding text or markdown.
    2.  **COMPLETE DATA:** All fields in the schema must be fully and realistically populated. Do not use placeholder values like "[...]" or "Not provided".
    3.  **EVIDENCE-BASED:** Use the provided files and Google Search grounding to provide specific, credible information. All findings and justifications must be grounded in plausible evidence.
    4.  **CRITICAL CONTENT REQUIREMENTS:**
        *   The 'policyOptions' array MUST contain a minimum of 2 distinct and well-analyzed options.
        *   The 'findings' array MUST contain at least 3 distinct findings.
        *   The 'keyTakeaways' array MUST contain at least 3 actionable takeaways.

    ${companyProfile ? `\n**COMPANY PERSONA:** ${companyProfile}` : ''}`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: { 
            systemInstruction,
            responseMimeType: 'application/json',
            tools: [{googleSearch: {}}]
        }
    });
    
    const briefResult = parseJsonResponse<any>(response, 'Policy Brief');

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
        (briefResult as any).groundingSources = groundingChunks
            .filter((chunk: any) => chunk.web && chunk.web.uri)
            .map((chunk: any) => ({
                uri: chunk.web.uri,
                title: chunk.web.title || "Untitled Source",
            }));
    }

    return briefResult;
};

export const generateRFP = async (taskDescription: string, _pageRange: string, _files: any[]): Promise<any> => {
    void _pageRange;
    void _files;
    const parts: { text: string }[] = [{ text: `Generate RFP: ${taskDescription}` }];
    // for (const file of files) parts.push(await fileToGenerativePart(file));
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts },
        config: { systemInstruction: `Procurement Specialist. Your entire output MUST be a single, valid JSON object.`, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 32768 } }
    });
    return parseJsonResponse<any>(response, 'RFP');
};

export const generateCapacityBuildingProgram = async (audience: string): Promise<any> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Program for: ${audience}`,
        config: { systemInstruction: `Planning Educator. Your entire output MUST be a single, valid JSON object.`, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 32768 } }
    });
    return parseJsonResponse<any>(response, 'Capacity Building Program');
};

export const generateVisionFramework = async (city: string, aspirations: string, timeframe: string, companyProfile?: string): Promise<any> => {
    const systemInstruction = `You are a world-class Urban Futurist and Strategist. Your task is to generate a compelling Vision & Strategic Framework based on the user's input.

    Your entire output MUST be a single, valid JSON object that adheres strictly to the following schema.

    **JSON SCHEMA (STRICT ADHERENCE REQUIRED):**
    {
      "visionStatement": "A forward-looking, inspiring statement for the city's future.",
      "tagline": "A short, memorable tagline that encapsulates the vision.",
      "strategicPillars": [
        {
          "title": "Title of the first strategic pillar (e.g., 'A Resilient & Green City')",
          "description": "A detailed description of what this pillar entails.",
          "keyInitiatives": [
            "A specific, actionable initiative to support this pillar.",
            "Another specific initiative..."
          ]
        }
      ]
    }

    **CORE DIRECTIVES (NON-NEGOTIABLE):**

    1.  **JSON ONLY:** Your output must be only the JSON object, with no surrounding text or markdown.
    2.  **COMPLETE DATA:** All fields in the schema must be populated. Do not use placeholders.
    3.  **STRATEGIC PILLARS REQUIREMENT:** The 'strategicPillars' array MUST contain a minimum of 3 distinct and well-developed pillars. Each pillar must have at least 2 key initiatives. This is a critical requirement.
    
    ${companyProfile ? `\n**COMPANY PERSONA:** ${companyProfile}` : ''}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate a vision framework for ${city} with a timeframe of ${timeframe}, based on these aspirations: "${aspirations}"`,
        config: { systemInstruction, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 32768 } }
    });
    return parseJsonResponse<any>(response, 'Vision Framework');
};

export const generateStakeholderPlan = async (context: string, goals: string, companyProfile?: string): Promise<any> => {
    const systemInstruction = `You are a world-class public engagement and stakeholder relations strategist. Your task is to generate a comprehensive Stakeholder Engagement Plan based on the provided project context and goals.

    Your entire output MUST be a single, valid JSON object that adheres strictly to the following schema.

    **JSON SCHEMA (STRICT ADHERENCE REQUIRED):**
    {
      "planTitle": "Stakeholder Engagement Plan for [Project Context]",
      "engagementGoals": [
        "A clear, concise goal for stakeholder engagement.",
        "Another clear goal..."
      ],
      "stakeholderGroups": [
        {
          "name": "Name of the stakeholder group or individual",
          "category": "One of: 'Government', 'Community', 'Private Sector', 'Expert/NGO', 'Other'",
          "interest": "One of: 'High', 'Medium', 'Low' (Their interest in the project)",
          "influence": "One of: 'High', 'Medium', 'Low' (Their ability to impact the project)",
          "engagementStrategy": "A detailed strategy for engaging this group.",
          "communicationMethods": ["Method 1 (e.g., 'Public Workshops')", "Method 2 (e.g., 'Bi-weekly Newsletter')"]
        }
      ],
      "timeline": [
        {
          "phase": "Phase Name (e.g., 'Phase 1: Project Scoping')",
          "duration": "Duration of the phase (e.g., 'Months 1-3')",
          "activities": "Key engagement activities for this phase."
        }
      ]
    }

    **CORE DIRECTIVES (NON-NEGOTIABLE):**

    1.  **JSON ONLY:** Your output must be only the JSON object, with no surrounding text or markdown.
    2.  **COMPLETE DATA:** All fields in the schema must be populated. Do not leave any fields empty or use placeholder values.
    3.  **STAKEHOLDER REQUIREMENT:** The 'stakeholderGroups' array MUST contain a minimum of 5 diverse and relevant stakeholders. This is a critical requirement. Do not generate an empty array. Analyze the project context to identify plausible government bodies, community groups, private entities, etc.
    4.  **GOALS & TIMELINE:** The 'engagementGoals' and 'timeline' arrays must also be fully populated with at least 2-3 relevant items each.

    ${companyProfile ? `\n**COMPANY PERSONA:** ${companyProfile}` : ''}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate a stakeholder plan for a project with the following context: "${context}" and goals: "${goals}"`,
        config: { systemInstruction, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 32768 } }
    });
    return parseJsonResponse<any>(response, 'Stakeholder Plan');
};

export const generateMethodology = async (task: string, companyProfile?: string): Promise<any> => {
    const systemInstruction = `You are a Senior Project Manager at a world-class urban planning consultancy. Your task is to generate a detailed, actionable, and professional methodology for a given urban planning task. The output MUST be a single, valid JSON object adhering strictly to the provided schema. The methodology should be broken down into logical phases and steps, with clear deliverables and recommended tools for each step.

    **JSON SCHEMA (STRICT ADHERENCE REQUIRED):**
    {
        "title": "Methodology for [User's Task]",
        "introduction": "A brief overview of the methodological approach, its purpose, and guiding principles.",
        "phases": [
            {
                "phase_number": 1,
                "title": "Phase Title (e.g., 'Phase 1: Inception & Diagnostic')",
                "description": "A summary of the goals and outcomes for this phase.",
                "steps": [
                    {
                        "step_number": "1.1",
                        "title": "Step Title (e.g., 'Data Collection & Baseline Analysis')",
                        "description": "A detailed description of the activities in this step.",
                        "deliverable": "The primary output of this step (e.g., 'Inception Report with Baseline Metrics').",
                        "tools_and_techniques": ["Tool 1 (e.g., 'GIS Mapping')", "Tool 2 (e.g., 'Stakeholder Interviews')"]
                    }
                ]
            }
        ],
        "conclusion": "A concluding statement summarizing the methodology's strengths and expected outcomes."
    }
    ${companyProfile ? `\n**COMPANY PERSONA:** ${companyProfile}` : ''}
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate a methodology for the following task: "${task}"`,
        config: { systemInstruction, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 32768 } }
    });
    return parseJsonResponse<any>(response, 'Methodology');
};

const generateInputSuggestions = async (prompt: string): Promise<string[]> => {
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

export const getChallengeSuggestions = async (location: string, scale: string): Promise<string[]> => {
    const prompt = `For an urban planning project in '${location}' at a '${scale}' scale, suggest 3 specific and relevant main challenges to address. Frame them as actionable problems. For example: "Addressing the last-mile connectivity gap for public transit users" instead of just "Transportation". Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};

export const getScaleSuggestions = async (location: string): Promise<string[]> => {
    const prompt = `For an urban planning project in '${location}', suggest 3 relevant scales. Examples: 'City-wide', 'Downtown Core', 'Specific Neighborhood (e.g., Waterfront District)', 'Transportation Corridor'. Return a JSON array of strings.`;
    return generateInputSuggestions(prompt);
};
