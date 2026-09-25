-- Group ownership. The owner is the member who can change the invitation
-- link, remove a member, hand the group over and delete it: without one, a
-- leaked link let anyone in for good, and nobody could show them out.
--
-- ON DELETE SET NULL, then the server hands the group to its longest-standing
-- member: an owner who deletes their account does not take the group with
-- them.

ALTER TABLE groups ADD COLUMN owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Groups created before owners existed: their first member owns them.
UPDATE groups SET owner_id = (
    SELECT m.user_id FROM members m WHERE m.group_id = groups.id
    ORDER BY m.joined_at, m.user_id LIMIT 1
);
