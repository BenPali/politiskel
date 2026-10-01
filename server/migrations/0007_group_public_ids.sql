-- A group's address is a random UUID, not its row number: /groupes/<uuid>
-- tells nothing about how many groups exist or which came first, and the
-- next group's address cannot be guessed. The row id stays internal.
ALTER TABLE groups ADD COLUMN public_id TEXT;

-- 16 random bytes per group, drawn row by row (a subquery would be drawn
-- once for the whole table), then written as a version-4 UUID
UPDATE groups SET public_id = hex(randomblob(16));
UPDATE groups SET public_id = lower(
    substr(public_id, 1, 8) || '-' || substr(public_id, 9, 4) || '-4' || substr(public_id, 14, 3) || '-'
    || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(public_id, 18, 3) || '-' || substr(public_id, 21, 12));

CREATE UNIQUE INDEX groups_public_id ON groups(public_id);
