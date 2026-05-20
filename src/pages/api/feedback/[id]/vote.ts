import type { APIRoute } from 'astro';
import { requireAuth, createSupabaseClient } from '../../../../lib/supabase';

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const user = await requireAuth({ request, cookies });
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { id } = params;
  const supabase = createSupabaseClient({ request, cookies });

  const { data: existing } = await supabase
    .from('feedback_votes')
    .select('feedback_id')
    .eq('feedback_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('feedback_votes')
      .delete()
      .eq('feedback_id', id)
      .eq('user_id', user.id);
  } else {
    await supabase
      .from('feedback_votes')
      .insert({ feedback_id: id, user_id: user.id });
  }

  return new Response(null, {
    status: 303,
    headers: { Location: '/feedback' },
  });
};
