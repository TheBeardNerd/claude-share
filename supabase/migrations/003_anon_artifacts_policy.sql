-- Allow unauthenticated requests to read published artifacts.
-- Required for install.sh, which runs as a plain curl command with no session cookie.
-- Scope is intentionally narrow: published status only, no auth required.
create policy "published artifacts readable by anon"
  on artifacts for select
  to anon
  using (status = 'published');
