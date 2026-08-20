import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, logActivity } from '@/lib/auth';
import { createAiService } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { campaign, fields } = body;
  if (typeof campaign !== 'string' || !Array.isArray(fields) || !fields.length) {
    return NextResponse.json({ error: 'Campaign dan fields wajib diisi.' }, { status: 422 });
  }

  const ai = await createAiService();
  const result = await ai.generateJson(
    'You are a creative copywriter. Generate catchy marketing copy.',
    `Campaign: ${campaign}\nProvide a JSON object with the following keys:\n${fields.map((f: string) => `- "${f}"`).join('\n')}`,
    { temperature: 0.9 }
  );
  if (!result.success) return NextResponse.json({ error: result.message || 'AI gagal.' }, { status: 502 });

  await logActivity({ action: 'ai_generate', description: `AI generate: ${campaign}` }).catch(() => {});
  return NextResponse.json({ data: result.data ?? {} });
}