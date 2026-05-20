-- Move pg_trgm out of public into the extensions schema.
-- No application code references pg_trgm functions directly; full-text search
-- uses native tsvector/websearch_to_tsquery which are pg_catalog built-ins.
alter extension pg_trgm set schema extensions;
