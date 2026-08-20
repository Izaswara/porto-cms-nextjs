export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface UserRow {
  id: number;
  username: string | null;
  name: string;
  email: string;
  email_verified_at: string | null;
  password: string;
  remember_token: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SettingRow {
  id: number;
  key: string;
  value: string | null;
  group: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface HeroSectionRow {
  id: number;
  name: string;
  subtitle: string | null;
  typing_texts: string[] | null;
  description: string | null;
  background_type: string;
  background_value: string | null;
  background_image: string | null;
  photo: string | null;
  buttons: { label: string; url: string; style?: string }[] | null;
  social_media: string[] | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface AboutSectionRow {
  id: number;
  photo: string | null;
  description: string | null;
  quote: string | null;
  statistics: { label: string; value: number | string; suffix?: string }[] | null;
  skills: string[] | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProjectRow {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  tech_stack: string[] | null;
  category: string | null;
  thumbnail: string | null;
  thumbnail_prompt: string | null;
  github_url: string | null;
  live_url: string | null;
  status: string;
  featured: boolean;
  seo: Json | null;
  tags: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SkillRow {
  id: number;
  name: string;
  icon: string | null;
  category: string | null;
  description: string | null;
  level: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface ExperienceRow {
  id: number;
  title: string;
  company: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  achievements: string[] | null;
  sort_order: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface EducationRow {
  id: number;
  institution: string;
  degree: string;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface CertificateRow {
  id: number;
  title: string;
  issuer: string;
  issue_date: string | null;
  expiry_date: string | null;
  description: string | null;
  file: string | null;
  image: string | null;
  credential_id: string | null;
  credential_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface PostRow {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  tags: string[] | null;
  category: string | null;
  status: string;
  featured: boolean;
  seo: Json | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SocialMediaRow {
  id: number;
  platform: string;
  url: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface MenuRow {
  id: number;
  name: string;
  slug: string;
  url: string | null;
  icon: string | null;
  parent_id: number | null;
  sort_order: number;
  is_active: boolean;
  is_hidden: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface TranslationRow {
  id: number;
  locale: string;
  group: string;
  key: string;
  value: string | null;
  is_synced: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface PromptRow {
  id: number;
  name: string;
  slug: string;
  prompt_text: string;
  category: string | null;
  variables: string[] | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface MediaRow {
  id: number;
  name: string;
  file_path: string;
  file_type: string;
  mime_type: string | null;
  file_size: number | null;
  disk: string;
  collection: string | null;
  metadata: Json | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ActivityLogRow {
  id: number;
  user_id: number | null;
  action: string;
  subject_type: string | null;
  subject_id: number | null;
  properties: Json | null;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
  updated_at: string | null;
  user?: { name: string } | null;
}

export interface SeoRow {
  id: number;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_image: string | null;
  og_title: string | null;
  og_description: string | null;
  twitter_card: string | null;
  canonical_url: string | null;
  structured_data: Json | null;
  subject_type: string;
  subject_id: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ThemeRow {
  id: number;
  name: string;
  is_active: boolean;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  gradient_start: string;
  gradient_end: string;
  glow_color: string;
  dark_bg: string;
  light_bg: string;
  glass_effect: boolean;
  animation_speed: string;
  typography: string;
  border_radius: string;
  dark_mode: boolean;
  custom_css: Json | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface GalleryRow {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  images: string[] | null;
  category: string | null;
  location: string | null;
  event_date: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export type TableName =
  | 'users'
  | 'settings'
  | 'hero_sections'
  | 'about_sections'
  | 'projects'
  | 'skills'
  | 'experiences'
  | 'education'
  | 'certificates'
  | 'posts'
  | 'social_media'
  | 'menus'
  | 'translations'
  | 'prompts'
  | 'media'
  | 'activity_logs'
  | 'seos'
  | 'themes'
  | 'galleries';

export const LOCALES = ['id', 'en', 'ja', 'ko', 'zh', 'es', 'fr', 'de', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  id: 'Indonesia',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ar: 'العربية',
};

export const LOCALE_SHORT: Record<Locale, string> = {
  id: 'ID',
  en: 'EN',
  ja: 'JA',
  ko: 'KO',
  zh: 'ZH',
  es: 'ES',
  fr: 'FR',
  de: 'DE',
  ar: 'AR',
};

export const SOCIAL_ICONS: Record<string, string> = {
  github: 'M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.69 1.25 3.35.95.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.94 10.94 0 0 1 5.74 0c2.18-1.49 3.14-1.18 3.14-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.04.77 2.1v3.12c0 .3.21.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z',
  linkedin: 'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z',
  instagram: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9c-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 0 0-2.13 1.38A5.88 5.88 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.8.72 1.47 1.38 2.13a5.88 5.88 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.38 5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zm0 10.15A4 4 0 1 1 12 8a4 4 0 0 1 0 8zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4.24-8 5.12-8-5.12V6h16v2.24z',
};
