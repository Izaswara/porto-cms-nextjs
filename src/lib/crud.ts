import { slugify } from './utils';

export interface ResourceConfig {
  table: string;
  label: string;
  uniqueKey?: string;
  requiredFields: string[];
  jsonFields: string[];
  boolFields: string[];
  intFields: string[];
  floatFields: string[];
  dateFields: string[];
  autoSlug?: { from: string; field: string };
  activityName?: (action: string, data: Record<string, unknown>) => string;
}

export const RESOURCE_CONFIGS: Record<string, ResourceConfig> = {
  projects: {
    table: 'projects',
    label: 'project',
    uniqueKey: 'slug',
    requiredFields: ['title'],
    jsonFields: ['tech_stack', 'tags', 'seo'],
    boolFields: ['featured'],
    intFields: [],
    floatFields: [],
    dateFields: [],
    autoSlug: { from: 'title', field: 'slug' },
    activityName: (action, d) => (action === 'create' ? `Project ditambahkan: ${d.title}` : `Project diperbarui: ${d.title}`),
  },
  blogs: {
    table: 'posts',
    label: 'artikel',
    uniqueKey: 'slug',
    requiredFields: ['title'],
    jsonFields: ['tags', 'seo'],
    boolFields: ['featured'],
    intFields: [],
    floatFields: [],
    dateFields: [],
    autoSlug: { from: 'title', field: 'slug' },
    activityName: (action, d) => (action === 'create' ? `Artikel ditambahkan: ${d.title}` : `Artikel diperbarui: ${d.title}`),
  },
  skills: {
    table: 'skills',
    label: 'skill',
    requiredFields: ['name'],
    jsonFields: [],
    boolFields: ['is_active'],
    intFields: ['level', 'sort_order'],
    floatFields: [],
    dateFields: [],
    activityName: (action, d) => (action === 'create' ? `Skill ditambahkan: ${d.name}` : `Skill diperbarui: ${d.name}`),
  },
  experience: {
    table: 'experiences',
    label: 'pengalaman',
    requiredFields: ['title', 'company'],
    jsonFields: ['achievements'],
    boolFields: ['is_current', 'is_active'],
    intFields: ['sort_order'],
    floatFields: [],
    dateFields: ['start_date', 'end_date'],
    activityName: (action, d) => (action === 'create' ? `Pengalaman ditambahkan: ${d.title}` : `Pengalaman diperbarui: ${d.title}`),
  },
  education: {
    table: 'education',
    label: 'pendidikan',
    requiredFields: ['institution', 'degree'],
    jsonFields: [],
    boolFields: ['is_current', 'is_active'],
    intFields: ['sort_order'],
    floatFields: [],
    dateFields: ['start_date', 'end_date'],
    activityName: (action, d) => (action === 'create' ? `Pendidikan ditambahkan: ${d.institution}` : `Pendidikan diperbarui: ${d.institution}`),
  },
  certificates: {
    table: 'certificates',
    label: 'sertifikat',
    requiredFields: ['title', 'issuer'],
    jsonFields: [],
    boolFields: ['is_active'],
    intFields: ['sort_order'],
    floatFields: [],
    dateFields: ['issue_date', 'expiry_date'],
    activityName: (action, d) => (action === 'create' ? `Sertifikat ditambahkan: ${d.title}` : `Sertifikat diperbarui: ${d.title}`),
  },
  galleries: {
    table: 'galleries',
    label: 'album',
    uniqueKey: 'slug',
    requiredFields: ['title'],
    jsonFields: ['images'],
    boolFields: ['is_active'],
    intFields: ['sort_order'],
    floatFields: [],
    dateFields: ['event_date'],
    autoSlug: { from: 'title', field: 'slug' },
    activityName: (action, d) => (action === 'create' ? `Album ditambahkan: ${d.title}` : `Album diperbarui: ${d.title}`),
  },
  social: {
    table: 'social_media',
    label: 'media sosial',
    requiredFields: ['platform', 'url'],
    jsonFields: [],
    boolFields: ['is_active'],
    intFields: ['sort_order'],
    floatFields: [],
    dateFields: [],
    activityName: (action, d) => (action === 'create' ? `Media sosial ditambahkan: ${d.platform}` : `Media sosial diperbarui: ${d.platform}`),
  },
  menu: {
    table: 'menus',
    label: 'menu',
    uniqueKey: 'slug',
    requiredFields: ['name', 'url'],
    jsonFields: [],
    boolFields: ['is_active', 'is_hidden'],
    intFields: ['sort_order', 'parent_id'],
    floatFields: [],
    dateFields: [],
    autoSlug: { from: 'name', field: 'slug' },
    activityName: (action, d) => (action === 'create' ? `Menu ditambahkan: ${d.name}` : `Menu diperbarui: ${d.name}`),
  },
  prompts: {
    table: 'prompts',
    label: 'prompt',
    uniqueKey: 'slug',
    requiredFields: ['name', 'prompt_text'],
    jsonFields: ['variables'],
    boolFields: ['is_active'],
    intFields: [],
    floatFields: [],
    dateFields: [],
    autoSlug: { from: 'name', field: 'slug' },
    activityName: (action, d) => (action === 'create' ? `Prompt ditambahkan: ${d.name}` : `Prompt diperbarui: ${d.name}`),
  },
  themes: {
    table: 'themes',
    label: 'theme',
    requiredFields: ['name'],
    jsonFields: ['custom_css'],
    boolFields: ['is_active', 'glass_effect', 'dark_mode'],
    intFields: [],
    floatFields: [],
    dateFields: [],
    activityName: (action, d) => (action === 'create' ? `Theme ditambahkan: ${d.name}` : `Theme diperbarui: ${d.name}`),
  },
  translations: {
    table: 'translations',
    label: 'terjemahan',
    requiredFields: ['key', 'locale', 'value'],
    jsonFields: [],
    boolFields: ['is_synced'],
    intFields: [],
    floatFields: [],
    dateFields: [],
    activityName: (action, d) => (action === 'create' ? `Terjemahan ditambahkan: ${d.key}` : `Terjemahan diperbarui: ${d.key}`),
  },
  contacts: {
    table: 'contacts',
    label: 'pesan',
    requiredFields: ['name', 'email', 'message'],
    jsonFields: [],
    boolFields: ['is_read'],
    intFields: [],
    floatFields: [],
    dateFields: [],
    activityName: (action, d) => (action === 'create' ? `Pesan dari ${d.name}` : `Pesan diperbarui: ${d.name}`),
  },
};

export interface CrudResult {
  success: boolean;
  data?: unknown;
  id?: number;
  error?: string;
  fieldErrors?: Record<string, string>;
  statusCode?: number;
}

/** Transform body mentah -> nilai kolom yang bersih, dengan validasi. */
export function transformInput(config: ResourceConfig, input: Record<string, unknown>): { data: Record<string, unknown>; errors: Record<string, string> } {
  const data: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const key of Object.keys(input)) {
    const val = input[key];
    if (val === undefined || val === null) {
      data[key] = null;
      continue;
    }
    if (config.jsonFields.includes(key)) {
      if (Array.isArray(val) || (typeof val === 'object' && val !== null)) data[key] = val;
      else if (typeof val === 'string') {
        const parsed = parseJsonField(val);
        if (parsed === 'INVALID') errors[key] = 'Format JSON tidak valid.';
        else data[key] = parsed;
      } else data[key] = null;
      continue;
    }
    if (config.boolFields.includes(key)) {
      data[key] = val === true || val === 'true' || val === '1' || val === 1;
      continue;
    }
    if (config.intFields.includes(key)) {
      const n = Number(val);
      data[key] = Number.isNaN(n) ? null : Math.trunc(n);
      continue;
    }
    if (config.floatFields.includes(key)) {
      const n = Number(val);
      data[key] = Number.isNaN(n) ? null : n;
      continue;
    }
    if (config.dateFields.includes(key)) {
      data[key] = val ? String(val) : null;
      continue;
    }
    data[key] = String(val);
  }

  for (const req of config.requiredFields) {
    const v = data[req];
    if (v === undefined || v === null || v === '') errors[req] = 'Wajib diisi.';
  }

  return { data, errors };
}

function parseJsonField(val: string): unknown | 'INVALID' {
  const trimmed = val.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return 'INVALID';
  }
}

/** Generate slug unik dengan suffix jika sudah ada. */
export async function uniqueSlug(table: string, slugField: string, base: string, ignoreId?: number): Promise<string> {
  const { db } = await import('./db');
  let candidate = slugify(base) || 'untitled';
  let counter = 1;
  let query = db().from(table).select('id').eq(slugField, candidate);
  if (ignoreId) query = query.neq('id', ignoreId);
  let { data } = await query.maybeSingle();
  while (data) {
    counter++;
    candidate = `${slugify(base)}-${counter}`;
    let q2 = db().from(table).select('id').eq(slugField, candidate);
    if (ignoreId) q2 = q2.neq('id', ignoreId);
    ({ data } = await q2.maybeSingle());
  }
  return candidate;
}
