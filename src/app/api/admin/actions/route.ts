import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, logActivity } from '@/lib/auth';
import { createAiService } from '@/lib/ai';
import { LOCALES, LOCALE_NAMES } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Aksi khusus yang tidak muat di CRUD generik:
 * - menu_reorder        { ids: number[] }             -> update sort_order berurutan
 * - menu_active         { id, is_active }             -> toggle menu
 * - theme_activate      { id }                        -> aktifkan theme, nonaktifkan lainnya
 * - theme_active        { id, is_active }             -> toggle theme
 * - translation_generate { key, sourceLocale, targets[] } -> terjemahkan via AI
 */
export async function POST(req: NextRequest) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || '');
  const user = (await getSessionFromRequest(req))?.sub ?? null;

  switch (action) {
    case 'menu_reorder': {
      const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter(Boolean) : [];
      if (!ids.length) return NextResponse.json({ error: 'ids wajib diisi.' }, { status: 422 });
      for (let i = 0; i < ids.length; i++) {
        try {
          await db().from('menus').update({ sort_order: i + 1 }).eq('id', ids[i]).select().single();
        } catch {
          // skip gagal per item
        }
      }
      await logActivity({ action: 'menu_reorder', description: 'Urutan menu diperbarui', userId: user ?? undefined }).catch(() => {});
      return NextResponse.json({ ok: true });
    }
    case 'menu_active': {
      const changed: Record<string, unknown> = { is_active: Boolean(body.is_active) };
      const { data, error } = await db().from('menus').update(changed).eq('id', Number(body.id)).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data });
    }
    case 'theme_activate': {
      const id = Number(body.id);
      if (!id) return NextResponse.json({ error: 'ID theme wajib diisi.' }, { status: 422 });
      const { error: offErr } = await db().from('themes').update({ is_active: false }).neq('id', id);
      if (offErr) return NextResponse.json({ error: offErr.message }, { status: 400 });
      const { data, error } = await db().from('themes').update({ is_active: true }).eq('id', id).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await logActivity({ action: 'theme_activate', description: `Theme diaktifkan: ${data?.name ?? id}`, userId: user ?? undefined }).catch(() => {});
      return NextResponse.json({ data });
    }
    case 'theme_active': {
      const changed: Record<string, unknown> = { is_active: Boolean(body.is_active) };
      const { data, error } = await db().from('themes').update(changed).eq('id', Number(body.id)).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data });
    }
    case 'translation_generate': {
      const key = String(body.key || '');
      const sourceLocale = String(body.sourceLocale || 'id');
      const targets: string[] = Array.isArray(body.targets) ? body.targets.map(String) : [];
      if (!key || !targets.length) return NextResponse.json({ error: 'key dan targets wajib diisi.' }, { status: 422 });

      const { data: srcRow } = await db().from('translations').select('value').eq('key', key).eq('locale', sourceLocale).single();
      if (!srcRow?.value) return NextResponse.json({ error: 'Terjemahan sumber tidak ditemukan.' }, { status: 404 });

      const ai = await createAiService();
      const pairs = targets
        .filter((t) => t !== sourceLocale && (LOCALES as readonly string[]).includes(t))
        .map((t) => `${t}: ${LOCALE_NAMES[t as keyof typeof LOCALE_NAMES] ?? t}`);
      const result = await ai.generateJson(
        'You are a professional translator. Translate the source text into each target language. Output a JSON object where keys are locale codes and values are the translations. Preserve formatting, names, and technical terms.',
        `Source (${sourceLocale}):\n${srcRow.value}\n\nTarget locales:\n${pairs.join('\n')}`
      );
      if (!result.success) return NextResponse.json({ error: result.message || 'AI gagal.' }, { status: 502 });

      const translations: Record<string, string> = (result.data ?? {}) as Record<string, string>;
      let saved = 0;
      for (const [locale, value] of Object.entries(translations)) {
        if (!value) continue;
        if (!(LOCALES as readonly string[]).includes(locale)) continue;
        const { data: existing } = await db().from('translations').select('id').eq('key', key).eq('locale', locale).single();
        if (existing) {
          const { error } = await db().from('translations').update({ value, is_synced: false }).eq('id', existing.id);
          if (!error) saved++;
        } else {
          const { error } = await db().from('translations').insert({ key, locale, value, is_synced: false, group: 'general' });
          if (!error) saved++;
        }
      }
      await logActivity({ action: 'translation_generate', description: `Terjemahan AI untuk key: ${key}`, userId: user ?? undefined }).catch(() => {});
      return NextResponse.json({ ok: true, saved, translations });
    }
    default:
      return NextResponse.json({ error: 'Action tidak dikenal.' }, { status: 404 });
  }
}