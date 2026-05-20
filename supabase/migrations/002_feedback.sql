create table feedback (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  category text not null default 'general',
  submitter_user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

create table feedback_votes (
  feedback_id uuid references feedback(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (feedback_id, user_id)
);

alter table feedback enable row level security;
alter table feedback_votes enable row level security;

create policy "Auth users read feedback" on feedback for select using ((select auth.role()) = 'authenticated');
create policy "Auth users insert feedback" on feedback for insert with check ((select auth.uid()) = submitter_user_id);

create policy "Auth users read votes" on feedback_votes for select using ((select auth.role()) = 'authenticated');
create policy "Auth users insert votes" on feedback_votes for insert with check ((select auth.uid()) = user_id);
create policy "Auth users delete own votes" on feedback_votes for delete using ((select auth.uid()) = user_id);
