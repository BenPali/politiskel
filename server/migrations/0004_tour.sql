-- Whether the account has seen the guided tour, finished or skipped: kept
-- with the account, so it shows once per person rather than once per
-- browser.
ALTER TABLE users ADD COLUMN tour_seen INTEGER NOT NULL DEFAULT 0;
