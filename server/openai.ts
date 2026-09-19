import { Router } from 'express';

const router = Router();
const OPENAI_URL = 'https://api.openai.com/v1';

type Part = { text?: string; inlineData?: { data: string; mimeType: string } };
type RequestBody = { model: string; contents: string | { parts?: Part[] }; config?: { systemInstruction?: string; responseMimeType?: string; responseSchema?: unknown; history?: Array<{ role: string; parts: Part[] }> }; stream?: boolean };

const partsToMessageContent = (parts: Part[] = []) => parts.map((part) => {
  if (part.inlineData) return { type: 'image_url', image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` } };
  return { type: 'text', text: part.text || '' };
});

router.post('/ai/generate', async (req, res) => {
  const body = req.body as RequestBody;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
  try {
    const config = body.config || {};
    const contents = typeof body.contents === 'string' ? [{ type: 'text', text: body.contents }] : partsToMessageContent(body.contents?.parts);
    const messages: any[] = [];
    if (config.systemInstruction) messages.push({ role: 'system', content: config.systemInstruction });
    if (config.history) for (const item of config.history) messages.push({ role: item.role === 'model' ? 'assistant' : 'user', content: partsToMessageContent(item.parts) });
    messages.push({ role: 'user', content: contents });
    const model = body.model.startsWith('gemini') ? (body.model.includes('pro') ? 'gpt-4o' : 'gpt-4o-mini') : body.model;
    const payload: any = { model, messages, stream: Boolean(body.stream) };
    if (config.responseMimeType === 'application/json') payload.response_format = { type: 'json_object' };
    const response = await fetch(`${OPENAI_URL}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) return res.status(response.status).json({ error: await response.text() });
    if (body.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return res.end();
      while (true) { const { value, done } = await reader.read(); if (done) break; const text = decoder.decode(value); for (const line of text.split('\n')) { if (line.startsWith('data:')) { try { const json = JSON.parse(line.slice(5)); const chunk = json.choices?.[0]?.delta?.content; if (chunk) res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`); } catch {} } } }
      res.write('data: [DONE]\n\n'); return res.end();
    }
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    res.json({ text, candidates: [{ content: { parts: [{ text }] } }] });
  } catch (error) { res.status(500).json({ error: error instanceof Error ? error.message : 'OpenAI request failed.' }); }
});

export default router;
