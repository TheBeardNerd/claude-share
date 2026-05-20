-- Wrap auth.uid() in (select ...) so Postgres builds an initPlan and evaluates
-- it once per query rather than once per row.
drop policy "non-published artifacts readable by submitter" on artifacts;

create policy "non-published artifacts readable by submitter"
  on artifacts for select
  to authenticated
  using (
    status in ('draft', 'pending_review', 'rejected')
    and submitter_user_id = (select auth.uid())
  );
