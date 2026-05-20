-- rls_auto_enable is a Supabase-internal helper. It should not be callable
-- by unauthenticated or authenticated clients via the PostgREST RPC surface.
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
