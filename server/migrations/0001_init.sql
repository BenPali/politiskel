-- Politiskel server schema. Political opinions are special-category data
-- (GDPR art. 9): the schema keeps only what the page needs, and every row
-- about a person hangs off `users` with ON DELETE CASCADE, so deleting an
-- account deletes all of it.

CREATE TABLE users (
    id          INTEGER PRIMARY KEY,
    username    TEXT NOT NULL,                          -- a pseudonym, shown to the groups
    -- Its look-alike key (case and accents folded), unique: "Zoé", "ZOÉ" and
    -- "Zoe" are one name, so nobody can join a group as someone else.
    username_key TEXT NOT NULL UNIQUE,
    pw_hash     TEXT NOT NULL,                          -- argon2id, PHC string
    consent_at  INTEGER NOT NULL,                       -- when art. 9 consent was given
    created_at  INTEGER NOT NULL
);

-- Only a hash of the session token is stored: a copy of the database gives
-- nobody a way in.
CREATE TABLE sessions (
    token_hash  BLOB PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE groups (
    id           INTEGER PRIMARY KEY,
    name         TEXT NOT NULL,
    invite_code  TEXT NOT NULL UNIQUE,
    created_at   INTEGER NOT NULL
);

CREATE TABLE members (
    group_id   INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at  INTEGER NOT NULL,
    PRIMARY KEY (group_id, user_id)
);
CREATE INDEX members_user ON members(user_id);

-- One profile per account: PolitiScales percentages read in the browser (the
-- screenshot itself never reaches the server) and questionnaire answers.
CREATE TABLE profiles (
    user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    politiscales  TEXT,                        -- JSON object, or NULL
    flag          TEXT,                        -- the PolitiScales flag, a small PNG data URL, or NULL
    answers       TEXT NOT NULL DEFAULT '{}',  -- JSON object
    updated_at    INTEGER NOT NULL
);
