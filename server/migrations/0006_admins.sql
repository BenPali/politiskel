-- Who may read the model check: set from the host with
-- `politiskel-server admin add <username>`, never from the site.
ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;
