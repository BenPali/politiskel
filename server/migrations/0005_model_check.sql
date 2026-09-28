-- Whether the member agreed that their answers be used, on this server and
-- in aggregates only, to check how the model behaves; and when. Off unless
-- they tick it: sign-up consent covered storing and showing answers to one's
-- groups, not this.
ALTER TABLE users ADD COLUMN model_check INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN model_check_at INTEGER;
