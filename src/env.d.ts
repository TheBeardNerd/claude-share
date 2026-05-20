/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly SLACK_WEBHOOK_URL: string;
  readonly PUBLIC_SITE_URL: string;
  readonly MAINTAINER_EMAIL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
