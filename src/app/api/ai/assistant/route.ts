import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, logActivity } from '@/lib/auth';
import { createAiService } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) return NextResponse.json({ error: 'Pesan kosong.' }, { status: 422 });

  const ai = await createAiService();
  const result = await ai.chat(messages, { model: body.model, temperature: body.temperature });
  if (!result.success) return NextResponse.json({ error: result.message || 'AI gagal merespons.' }, { status: 502 });
  return NextResponse.json({ content: result.content });
}