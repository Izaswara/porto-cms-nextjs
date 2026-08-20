import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, logActivity } from '@/lib/auth';
import { createAiService } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { type, name, existing, instruction } = body;
  if (!type || !name) return NextResponse.json({ error: 'Tipe dan nama wajib diisi.' }, { status: 422 });

  const ai = await createAiService();
  const ctx = existing ? JSON.stringify(existing) : '(none)';
  const result = await ai.generate(
    'You are an expert content editor. Return ONLY improved content as plain text suitable for a personal portfolio CMS.',
    `Improve the following ${type} "${name}". ${instruction || 'Make it more professional and engaging.'}\n\nCurrent content:\n${ctx}`,
    { temperature: 0.7 }
  );
  if (!result.success) return NextResponse.json({ error: result.message || 'AI gagal.' }, { status: 502 });

  await logActivity({ action: 'ai_smart_edit', description: `AI smart-edit: ${type} "${name}"` }).catch(() => {});
  return NextResponse.json({ content: result.content });
}