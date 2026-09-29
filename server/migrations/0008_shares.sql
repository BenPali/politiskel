-- Public share links: a card of one's profile, made public on purpose at an
-- address nobody can guess, until its owner deletes it. A snapshot of
-- results (never answers) and the image of the card; deleting the account
-- deletes them with it.
CREATE TABLE shares (
    token       TEXT PRIMARY KEY,                        -- 16 random bytes, base64url
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  INTEGER NOT NULL,
    layout      TEXT NOT NULL,
    theme       TEXT NOT NULL,
    snapshot    TEXT NOT NULL,                           -- JSON object
    image       BLOB NOT NULL                            -- PNG
);
CREATE INDEX shares_user ON shares(user_id);
