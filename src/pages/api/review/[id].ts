import type { APIRoute } from 'astro';
import { requireAuth, createServiceClient } from '../../../lib/supabase';
import type { ReviewAction } from '../../../lib/types';

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const user = await requireAuth({ request, cookies });
  if (!user) return new Response('Unauthorized', { status: 401 });

  if (user.email !== import.meta.env.MAINTAINER_EMAIL) {
    return new Response('Forbidden', { status: 403 });
  }

  const { id } = params;
  const form = await request.formData();
  const action = String(form.get('action') ?? '') as ReviewAction;
  const note = String(form.get('note') ?? '').trim();

  if (!['approved', 'changes_requested', 'rejected'].includes(action)) {
    return new Response('Invalid action', { status: 400 });
  }

  const service = createServiceClient();

  const { data: artifact } = await service
    .from('artifacts')
    .select('content,metadata,current_version')
    .eq('id', id)
    .single();

  if (!artifact) return new Response('Not found', { status: 404 });

  if (action === 'approved') {
    const nextVersion = (artifact.current_version ?? 0) + 1;

    const { error: versionError } = await service.from('artifact_versions').insert({
      artifact_id: id,
      version: nextVersion,
      content: artifact.content,
      metadata: artifact.metadata,
      change_note: note || null,
      published_by: 'maintainer',
    });

    if (versionError) {
      return new Response('Failed to create version record', { status: 500 });
    }

    await service
      .from('artifacts')
      .update({
        status: 'published',
        current_version: nextVersion,
        published_at: new Date().toISOString(),
        reviewed_by: 'maintainer',
      })
      .eq('id', id);
  } else {
    await service
      .from('artifacts')
      .update({
        status: action === 'rejected' ? 'rejected' : 'draft',
        reviewed_by: 'maintainer',
      })
      .eq('id', id);
  }

  await service.from('review_notes').insert({
    artifact_id: id,
    body: note,
    action,
  });

  return new Response(null, {
    status: 303,
    headers: { Location: '/admin/review' },
  });
};
