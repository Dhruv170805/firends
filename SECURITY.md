# Security Policy

## Reporting a Vulnerability
We take the security of LegacyLoop seriously. If you find a vulnerability, please report it via the `/bug` command or contact our security team.

## Security Controls
- **Authentication:** Managed by Supabase (JWT-based).
- **Authorization:** Enforced at the database level using Row Level Security (RLS).
- **Network:** Secure headers (CSP, HSTS, XSS protection) are enforced via `vercel.json`.
- **Auditing:** Security actions are logged to `security_audit_logs`.

## Responsible Disclosure
Please do not disclose vulnerabilities publicly until we have had a chance to address them.
