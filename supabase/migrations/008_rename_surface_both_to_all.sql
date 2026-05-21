ALTER TABLE artifacts DROP CONSTRAINT artifacts_surface_check;
UPDATE artifacts SET surface = 'all' WHERE surface = 'both';
ALTER TABLE artifacts ADD CONSTRAINT artifacts_surface_check CHECK (surface IN ('claude-code', 'claude-ai', 'all'));
