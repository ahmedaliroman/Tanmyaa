export const Type = {
  OBJECT: 'object',
  ARRAY: 'array',
  STRING: 'string',
  NUMBER: 'number',
  INTEGER: 'integer',
  BOOLEAN: 'boolean'
} as const;

export type GenerateContentResponse = {
  text?: string;
  candidates?: Array<{ content: { parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> }; groundingMetadata?: unknown }>;
};

type Content = string | { parts?: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> };
type Config = { systemInstruction?: string; responseMimeType?: string; responseSchema?: unknown; tools?: unknown[]; imageConfig?: { aspectRatio?: string } };

const streamFrom = async function* (response: Response): AsyncGenerator<GenerateContentResponse> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const value = line.slice(5).trim();
      if (value === '[DONE]') return;
      try { const parsed = JSON.parse(value); if (parsed.text) yield { text: parsed.text }; } catch { /* ignore keep-alive */ }
    }
  }
};

class OpenAIModelClient {
  async generateContent(request: { model: string; contents: Content; config?: Config }): Promise<GenerateContentResponse> {
    const response = await fetch('/api/ai/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || `AI request failed (${response.status})`);
    return response.json();
  }

  async generateContentStream(request: { model: string; contents: Content; config?: Config }): Promise<AsyncGenerator<GenerateContentResponse>> {
    const response = await fetch('/api/ai/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...request, stream: true }) });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || `AI stream failed (${response.status})`);
    return streamFrom(response);
  }
}

export class GoogleGenAI {
  models = new OpenAIModelClient();
  chats = {
    create: (options: { model: string; config?: Config; history?: Array<{ role: string; parts: Array<{ text: string }> }> }) => ({
      sendMessageStream: (request: { message: string }) => this.models.generateContentStream({ model: options.model, contents: { parts: [{ text: request.message }] }, config: { ...options.config, ...(options.history ? { history: options.history } : {}) } })
    })
  };
  constructor(_options: { apiKey?: string }) {}
}
