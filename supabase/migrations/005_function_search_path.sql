-- Pin search_path to empty string so functions cannot be exploited via
-- search_path manipulation. pg_catalog is always searched implicitly,
-- so built-in functions (to_tsvector, coalesce, now, etc.) need no qualification.

create or replace function public.artifacts_set_fts()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.fts := to_tsvector(
    'english',
    coalesce(new.title, '') || ' ' ||
    coalesce(new.description, '') || ' ' ||
    coalesce(new.content, '') || ' ' ||
    coalesce(array_to_string(new.tags, ' '), '')
  );
  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
