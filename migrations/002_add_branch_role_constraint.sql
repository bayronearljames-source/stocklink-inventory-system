-- Enforce: Admins must have no branch, all other roles must have one
ALTER TABLE users
ADD CONSTRAINT users_branch_required_for_non_admin
CHECK (
  (role = 'admin' AND branch_id IS NULL) OR
  (role != 'admin' AND branch_id IS NOT NULL)
);
