/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** "true" when the sign-in email also carries a code. Absent: link only. */
  readonly VITE_SUPABASE_EMAIL_CODE?: string;
}
