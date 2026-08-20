/**
 * AIService — port dari app/Services/AIService.php (OpenRouter)
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string };
}

export interface AIResult {
  success: boolean;
  content?: string;
  data?: unknown;
  message?: string;
  raw?: unknown;
}

const BASE_URL = 'https://openrouter.ai/api/v1';

async function chatInternal(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<AIResult> {
  const payload: Record<string, unknown> = {
    model: options.model ?? model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 2048,
  };
  if (options.response_format) payload.response_format = options.response_format;

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
        'X-Title': 'Porto CMS',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const body = await response.text();
      return { success: false, message: `OpenRouter API error: ${body}` };
    }

    const data = await response.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    return { success: true, content, raw: data };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** Buat instance dengan key dari settings DB (padanan konstruktor AIService) */
export async function createAiService(): Promise<{
  chat: (messages: ChatMessage[], options?: ChatOptions) => Promise<AIResult>;
  generate: (systemPrompt: string, userPrompt: string, options?: ChatOptions) => Promise<AIResult>;
  generateJson: (systemPrompt: string, userPrompt: string, options?: ChatOptions) => Promise<AIResult>;
}> {
  const { data } = await import('./db').then((m) => m.db().from('settings').select('key, value'));
  const settings = new Map<string, string | null>();
  for (const row of data ?? []) settings.set(row.key, row.value);
  const apiKey = settings.get('openrouter_api_key') || process.env.OPENROUTER_API_KEY || '';
  const model = settings.get('openrouter_model') || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  async function generateJson(systemPrompt: string, userPrompt: string, options?: ChatOptions): Promise<AIResult> {
    const result = await chatInternal(apiKey, model, [
      {
        role: 'system',
        content: `${systemPrompt}\n\nIMPORTANT: Always respond with valid JSON only. No markdown, no explanation.`,
      },
      { role: 'user', content: userPrompt },
    ], options);

    if (!result.success || !result.content) return result;

    let content = result.content.trim();
    const fence = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) content = fence[1].trim();

    try {
      result.data = JSON.parse(content);
      return result;
    } catch {
      return { success: false, message: 'AI returned invalid JSON' };
    }
  }

  return {
    chat: (messages, options) => chatInternal(apiKey, model, messages, options),
    generate: (systemPrompt, userPrompt, options) =>
      chatInternal(apiKey, model, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], options),
    generateJson,
  };
}
