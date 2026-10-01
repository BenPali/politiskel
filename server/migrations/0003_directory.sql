-- The directory, and asking to join. A group is secret by default: only its
-- owner can list it, and a listed group shows its name and how many members
-- it has, nothing else. A member signed in can ask to join a listed group;
-- the owner accepts or declines. A request goes with the group, and with the
-- account that made it.

ALTER TABLE groups ADD COLUMN listed INTEGER NOT NULL DEFAULT 0;

CREATE TABLE join_requests (
    group_id   INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (group_id, user_id)
);
