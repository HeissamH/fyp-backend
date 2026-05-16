# Multi-role migration — manual database steps

After applying migration `0014_multi_role_user_roles.sql` (`pnpm db:migrate` or running the SQL manually):

1. **Existing users**: The migration copies each row’s former `users.role_id` into `user_roles` and then drops `users.role_id`.

2. **Adding a role to a user** (alternative to calling `POST /api/users/{userId}/roles`):

```sql
-- Replace UUIDs after looking them up in `roles` and `users`.
INSERT INTO user_roles (user_id, role_id, assigned_at, revoked_at)
VALUES (
  '<user-uuid>',
  '<role-uuid>',
  NOW(),
  NULL
)
ON CONFLICT (user_id, role_id) DO UPDATE SET
  revoked_at = NULL,
  assigned_at = NOW();
```

3. **Revoking** (alternative to `DELETE /api/users/{userId}/roles` with JSON body `{ "roleId": "..." }`):

```sql
UPDATE user_roles
SET revoked_at = NOW()
WHERE user_id = '<user-uuid>' AND role_id = '<role-uuid>' AND revoked_at IS NULL;
```

4. **New users without seed**: Ensure every active user has at least one active `user_roles` row (typically `student`), or login will issue a JWT with `roleIds: []` until roles are assigned.

5. **Find role IDs by name**:

```sql
SELECT id, name FROM roles WHERE deleted_at IS NULL;
```
