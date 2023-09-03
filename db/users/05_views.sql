CREATE VIEW users.user_type_view AS
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM users.admins WHERE admin_id = aa.admin_id
    ) THEN aa.admin_id
    ELSE ca.customer_id
  END AS user_id,
  EXISTS (
    SELECT 1 FROM users.admins WHERE admin_id = aa.admin_id
  ) AS is_admin,
  e.email AS email
FROM
  users.admin_accounts aa
FULL JOIN
  users.customer_accounts ca ON ca.email_id = aa.email_id
JOIN
  users.emails e ON e.email_id = aa.email_id OR e.email_id = ca.email_id;

CREATE VIEW users.all_refresh_tokens AS
SELECT 
  true AS is_admin,
  art.admin_id AS user_id,
  ae.email AS email,
  art.token AS token,
  art.revoked AS revoked,
  art.expires_at AS expires_at,
  art.created_at AS created_at
FROM users.admin_refresh_tokens art
JOIN users.admin_accounts aa ON aa.admin_id = art.admin_id
JOIN users.emails ae ON ae.email_id = aa.email_id
UNION ALL
SELECT
  false AS is_admin,
  crt.customer_id AS user_id,
  ce.email AS email,
  crt.token AS token,
  crt.revoked AS revoked,
  crt.expires_at AS expires_at,
  crt.created_at AS created_at
FROM users.customer_refresh_tokens crt
JOIN users.customer_accounts ca ON ca.customer_id = crt.customer_id
JOIN users.emails ce ON ce.email_id = ca.email_id;