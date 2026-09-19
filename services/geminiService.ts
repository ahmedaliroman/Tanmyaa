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
  BrandingInfo,
  UrbanDeepUnderstanding,
  MasterplanProjectInfo,
  MasterplanSlide,
} from '@/types';

const OPENAI_ROUTE = '/api/ai/generate';

type StreamChunk = { text?: string };

type JsonPayload = Record<string, unknown>;

const toText = (payload: unknown): string => {
  if (typeof payload === 'string') return payload;
  if (payload && typeof payload === 'object') {
    const anyPayload = payload as { text?: string; error?: { message?: string }; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }> };
    if (typeof anyPayload.text === 'string') return anyPayload.text;
    if (Array.isArray(anyPayload.candidates) && anyPayload.candidates[0]?.content?.parts) {
      const combined = anyPayload.candidates
        .flatMap((candidate) => candidate.content?.parts ?? [])
        .map((part) => part.text ?? '')
        .join('');
      if (combined) return combined;
    }
    if (Array.isArray(anyPayload.choices) && anyPayload.choices[0]?.message?.content) {
      const content = anyPayload.choices[0].message.content;
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        const text = content.map((item) => item.text ?? '').join('');
        if (text) return text;
      }
    }
    if (typeof anyPayload.error?.message === 'string') {
      throw new Error(anyPayload.error.message);
    }
  }
  throw new Error('Empty AI response.');
};

const parseJsonText = <T>(payload: unknown, label: string): T => {
  const text = toText(payload).trim();
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    throw new Error(`${label} returned invalid JSON.` + (error instanceof Error ? ` ${error.message}` : ''));
  }
};

const requestOpenAI = async <T>(
  model: string,
  prompt: string,
  systemInstruction?: string,
  responseMimeType?: 'application/json' | 'text/plain',
  history?: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> }>,
  stream = false,
): Promise<T> => {
  const response = await fetch(OPENAI_ROUTE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType,
        history,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'OpenAI request failed.');
  }

  const data = await response.json();
  if (stream) {
    return data as T;
  }

  return parseJsonText<T>(data, 'OpenAI request');
};

const requestOpenAIJson = async <T>(
  model: string,
  prompt: string,
  systemInstruction: string,
  history?: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> }>,
): Promise<T> => requestOpenAI<T>(model, prompt, systemInstruction, 'application/json', history, false);

const requestSuggestions = async (prompt: string): Promise<string[]> => {
  const data = await requestOpenAIJson<{ suggestions?: string[]; items?: string[] }>(
    'gpt-4o-mini',
    prompt,
    'Return only a JSON object with a "suggestions" array of strings.',
  );
  const suggestions = data.suggestions ?? data.items ?? [];
  return Array.isArray(suggestions) ? suggestions.filter((item) => typeof item === 'string') : [];
};

async function* streamOpenAI(
  model: string,
  prompt: string,
  systemInstruction?: string,
  history?: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> }>,
): AsyncGenerator<StreamChunk> {
  const response = await fetch(OPENAI_ROUTE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: true,
      contents: prompt,
      config: { systemInstruction, history },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'OpenAI stream request failed.');
  }

  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const raw = trimmed.replace(/^data:\s*/, '');
      if (raw === '[DONE]') return;
      try {
        const parsed = JSON.parse(raw) as { text?: string };
        if (parsed.text) {
          yield { text: parsed.text };
        }
      } catch {
        continue;
      }
    }
  }
}

export const generateImage = async (prompt: string, referenceImage?: string, skipDeduction = false): Promise<string> => {
  if (referenceImage) {
    return referenceImage;
  }

  const svg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="50%" stop-color="#1d4ed8"/>
          <stop offset="100%" stop-color="#0ea5e9"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#g)"/>
      <rect x="80" y="80" width="1440" height="740" rx="28" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.25)"/>
      <text x="800" y="420" fill="white" text-anchor="middle" font-size="52" font-family="Arial, sans-serif" font-weight="700">Urban Planning Concept</text>
      <text x="800" y="490" fill="#dbeafe" text-anchor="middle" font-size="26" font-family="Arial, sans-serif">${(prompt || 'Design concept').slice(0, 100)}</text>
    </svg>
  `)}`;

  if (!skipDeduction) {
    await fetch('/api/credits', { method: 'GET' }).catch(() => undefined);
  }

  return svg;
};

const createBaseSystemInstruction = (extra: string) => `You are a world-class urban planning consultant. Produce a valid JSON object that matches the requested structure. Keep all fields professional, concise, and actionable. ${extra}`;

export const generatePresentation = async (
  projectInfo: UrbanPlanningProjectInfo,
  _files: File[],
  _companyProfile?: string,
  plan?: string,
  branding?: BrandingInfo,
): Promise<PresentationSlide[]> => {
  const systemInstruction = createBaseSystemInstruction(`Focus on urban planning and city design. ${branding ? 'Apply the provided branding guidance.' : ''} ${plan ? `Plan: ${plan}.` : ''}`);
  const payload = await requestOpenAIJson<{ slides?: PresentationSlide[] }> (
    'gpt-4o',
    `Generate a presentation for this urban planning project: ${JSON.stringify(projectInfo)}`,
    systemInstruction,
  );
  const slides = Array.isArray(payload.slides) ? payload.slides : [];
  if (!slides.length) throw new Error('No slides generated.');
  return slides;
};

export const refinePresentation = async (
  currentSlides: PresentationSlide[],
  userRequest: string,
  _activeSlideIndex: number,
  _companyProfile?: string,
  _plan?: string,
  _branding?: BrandingInfo,
): Promise<{ slides: PresentationSlide[]; chatResponse: string }> => {
  const payload = await requestOpenAIJson<{ slides?: PresentationSlide[]; chatResponse?: string }>(
    'gpt-4o',
    `Refine this presentation based on the request: ${userRequest}. Current slides: ${JSON.stringify(currentSlides)}`,
    createBaseSystemInstruction('Return a JSON object with keys "slides" and "chatResponse".'),
  );

  return {
    slides: Array.isArray(payload.slides) ? payload.slides : currentSlides,
    chatResponse: typeof payload.chatResponse === 'string' ? payload.chatResponse : 'Updated successfully.',
  };
};

export const generatePolicyReport = async (
  brief: string,
  _files: File[],
  _companyProfile?: string,
  plan?: string,
  branding?: BrandingInfo,
): Promise<PolicyBrief> => {
  const payload = await requestOpenAIJson<PolicyBrief>(
    'gpt-4o',
    `Generate a policy report based on this brief: ${brief}`,
    createBaseSystemInstruction(`Produce a policy brief for urban planning. ${branding ? 'Apply the provided branding guidance.' : ''} ${plan ? `Plan: ${plan}.` : ''}`),
  );
  return payload;
};

export const generateCapacityBuildingProgram = async (
  audience: string,
  skillLevel: string,
  challenges: string,
  _companyProfile?: string,
  plan?: string,
  branding?: BrandingInfo,
): Promise<CapacityBuildingProgram> => {
  const payload = await requestOpenAIJson<CapacityBuildingProgram>(
    'gpt-4o',
    `Create a capacity-building program for: ${audience}. Skill level: ${skillLevel}. Challenges: ${challenges}`,
    createBaseSystemInstruction(`Create a detailed capacity-building program for urban planning. ${branding ? 'Apply branding guidance.' : ''} ${plan ? `Plan: ${plan}.` : ''}`),
  );
  return payload;
};

export const generateVisionFramework = async (
  city: string,
  country: string,
  _companyProfile?: string,
  plan?: string,
  branding?: BrandingInfo,
): Promise<VisionFramework> => {
  const payload = await requestOpenAIJson<VisionFramework>(
    'gpt-4o',
    `Create a vision framework for ${city}, ${country}`,
    createBaseSystemInstruction(`Create a vision framework for urban planning. ${branding ? 'Apply branding guidance.' : ''} ${plan ? `Plan: ${plan}.` : ''}`),
  );
  return payload;
};

export const generateStakeholderPlan = async (
  context: string,
  goals: string,
  _companyProfile?: string,
  plan?: string,
  branding?: BrandingInfo,
): Promise<StakeholderPlan> => {
  const payload = await requestOpenAIJson<StakeholderPlan>(
    'gpt-4o',
    `Create a stakeholder engagement plan for context: ${context}. Goals: ${goals}`,
    createBaseSystemInstruction(`Create a stakeholder plan for urban planning. ${branding ? 'Apply branding guidance.' : ''} ${plan ? `Plan: ${plan}.` : ''}`),
  );
  return payload;
};

export const generateMethodology = async (
  project: string,
  objectives: string,
  _companyProfile?: string,
  plan?: string,
  branding?: BrandingInfo,
): Promise<Methodology> => {
  const payload = await requestOpenAIJson<Methodology>(
    'gpt-4o',
    `Create a methodology document for the project: ${project}. Objectives: ${objectives}`,
    createBaseSystemInstruction(`Create a robust urban planning methodology. ${branding ? 'Apply branding guidance.' : ''} ${plan ? `Plan: ${plan}.` : ''}`),
  );
  return payload;
};

export const generateRFP = async (
  projectDescription: string,
  detailLevel: string,
  consultantBackground: string,
  _companyProfile?: string,
  plan?: string,
  branding?: BrandingInfo,
): Promise<RFPContent> => {
  const payload = await requestOpenAIJson<RFPContent>(
    'gpt-4o',
    `Generate an RFP for: ${projectDescription}. Detail level: ${detailLevel}. Consultant background: ${consultantBackground}`,
    createBaseSystemInstruction(`Create a formal, high-quality RFP for urban planning consulting work. ${branding ? 'Apply branding guidance.' : ''} ${plan ? `Plan: ${plan}.` : ''}`),
  );
  return payload;
};

export const generateDeepUnderstanding = async (
  topic: string,
  context: string,
  _companyProfile?: string,
  _plan?: string,
  _branding?: BrandingInfo,
): Promise<UrbanDeepUnderstanding> => {
  const payload = await requestOpenAIJson<UrbanDeepUnderstanding>(
    'gpt-4o',
    `Explain in depth: ${topic}. Context: ${context}`,
    createBaseSystemInstruction('Provide a structured deep understanding board for urban planning. Use valid JSON.'),
  );
  return payload;
};

export const refineDeepUnderstanding = async (
  currentData: UrbanDeepUnderstanding,
  userRequest: string,
  _companyProfile?: string,
  _plan?: string,
  _branding?: BrandingInfo,
): Promise<UrbanDeepUnderstanding> => {
  const payload = await requestOpenAIJson<UrbanDeepUnderstanding>(
    'gpt-4o',
    `Update the strategic thinking board based on this request: ${userRequest}. Current board: ${JSON.stringify(currentData)}`,
    createBaseSystemInstruction('Return the updated strategic thinking board as valid JSON.'),
  );
  return payload;
};

export const generateMasterplan = async (
  info: MasterplanProjectInfo,
  _companyProfile?: string,
  plan?: string,
  branding?: BrandingInfo,
): Promise<MasterplanSlide[]> => {
  const payload = await requestOpenAIJson<{ slides?: MasterplanSlide[] }>(
    'gpt-4o',
    `Generate masterplan slides for project: ${JSON.stringify(info)}`,
    createBaseSystemInstruction(`Build masterplan slides for urban planning. ${branding ? 'Apply branding guidance.' : ''} ${plan ? `Plan: ${plan}.` : ''}`),
  );
  const slides = Array.isArray(payload.slides) ? payload.slides : [];
  if (!slides.length) throw new Error('Masterplan generation returned no slides.');
  return slides;
};

export const getSceneSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 short suggestions for setting the scene in an urban planning project.');
export const getLocationSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 realistic urban planning location suggestion phrases.');
export const getChallengeSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 urban planning challenge suggestions.');
export const getScaleSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 project scale suggestions.');
export const getPolicyContextSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 policy context suggestions for urban planning.');
export const getSpecificFocusSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 specific urban planning focus suggestions.');
export const getAudienceSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 presentation audience suggestions for urban planning.');
export const getAuthorRoleSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 author role suggestions for urban planning studies.');

export const getMasterplanLocationSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 location suggestions for masterplan projects.');
export const getMasterplanScaleSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 scale suggestions for masterplan projects.');
export const getMasterplanTypeSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 masterplan typology suggestions.');
export const getBuildingCoverageSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 building coverage suggestions.');
export const getGreenSpaceSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 green space ratio suggestions.');
export const getMaxHeightSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 maximum height suggestions.');
export const getLandUseBalanceSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 land use balance suggestions.');

export const getPolicyBriefSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 policy brief topic suggestions.');
export const getCapacityBuildingSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 capacity-building program suggestions.');
export const getMethodologySuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 methodology suggestions.');
export const getRFPSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 RFP topic suggestions.');
export const getVisionAspirationSuggestions = async (): Promise<string[]> => requestSuggestions('Return 5 urban vision aspiration suggestions.');

export const fetchUsageHistory = async (): Promise<UsageHistory[]> => {
  try {
    const response = await fetch('/api/usage-history');
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const uploadFileToStorage = async (file: Blob, fileName: string): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = Array.from(new Uint8Array(arrayBuffer));
    const base64 = btoa(String.fromCharCode(...bytes));
    return `data:${file.type || 'application/octet-stream'};base64,${base64}`;
  } catch {
    return `data:${file.type || 'application/octet-stream'};base64,`;
  }
};

export const streamAssistantResponse = async <T extends object>(contextData: T, prompt: string) => {
  const generator = streamOpenAI(
    'gpt-4o-mini',
    `CONTEXT: ${JSON.stringify(contextData)}\n\nREQUEST: ${prompt}`,
    'You are a strategic assistant. Return concise, structured output.',
  );
  return generator;
};

export const sendMessageToInstantChatStream = async (
  message: string,
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string }> }>,
  _plan?: string,
  _branding?: BrandingInfo,
) => {
  return streamOpenAI(
    'gpt-4o-mini',
    message,
    'You are Tanmyaa Bot, an urban planning expert. Answer clearly and professionally.',
    history.map((entry) => ({
      role: entry.role === 'model' ? 'model' : 'user',
      parts: entry.parts.map((part) => ({ text: part.text ?? '' })),
    })),
  );
};

export default {
  generateImage,
  generatePresentation,
  refinePresentation,
  generatePolicyReport,
  generateCapacityBuildingProgram,
  generateVisionFramework,
  generateStakeholderPlan,
  generateMethodology,
  generateRFP,
  generateDeepUnderstanding,
  refineDeepUnderstanding,
  generateMasterplan,
  getSceneSuggestions,
  getLocationSuggestions,
  getChallengeSuggestions,
  getScaleSuggestions,
  getPolicyContextSuggestions,
  getSpecificFocusSuggestions,
  getAudienceSuggestions,
  getAuthorRoleSuggestions,
  getMasterplanLocationSuggestions,
  getMasterplanScaleSuggestions,
  getMasterplanTypeSuggestions,
  getBuildingCoverageSuggestions,
  getGreenSpaceSuggestions,
  getMaxHeightSuggestions,
  getLandUseBalanceSuggestions,
  getPolicyBriefSuggestions,
  getCapacityBuildingSuggestions,
  getMethodologySuggestions,
  getRFPSuggestions,
  getVisionAspirationSuggestions,
  fetchUsageHistory,
  uploadFileToStorage,
  streamAssistantResponse,
  sendMessageToInstantChatStream,
};

export const parseJsonResponse = <T>(response: unknown, _label: string): T => parseJsonText<T>(response, 'AI response');

export const getAi = () => ({
  models: {
    generateContent: async () => ({
      text: JSON.stringify({ ok: true }),
      candidates: [{ content: { parts: [{ text: JSON.stringify({ ok: true }) }] } }],
    }),
    generateContentStream: async () => streamOpenAI('gpt-4o-mini', ''),
  },
});

export const withRetry = async <T>(fn: () => Promise<T>): Promise<T> => fn();

export const addBrandingAssetsToParts = async <T extends { text?: string }[]>(parts: T, _plan?: string, _branding?: BrandingInfo, _context?: string) => parts;

export const deductCredits = async () => true;

export const fileToBase64 = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

export const getRemainingCredits = async () => ({ remaining: 0 });

export const checkCredits = () => true;

export const sendMessageToInstantChat = async (message: string) => {
  const generator = await sendMessageToInstantChatStream(message, []);
  let output = '';
  for await (const chunk of generator) {
    output += chunk.text ?? '';
  }
  return output;
};
