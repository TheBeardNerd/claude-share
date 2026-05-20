import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Public endpoint — no auth required for published artifacts.
// Uses anon key + RLS (published artifacts readable by anon policy) rather than
// service role, so a misconfigured query cannot leak unpublished content.
export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;

  const supabase = createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_ANON_KEY,
  );

  const { data, error } = await supabase
    .from('artifacts')
    .select(
      'id,slug,type,surface,title,description,content,tags,department,metadata,current_version,published_at'
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};
