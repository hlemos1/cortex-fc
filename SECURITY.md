# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| latest (main) | ✅ |
| older branches | ❌ |

## Reporting a Vulnerability

If you discover a security vulnerability, please do **not** open a public issue.

Instead, report it privately:

**Email:** institutoveigacabral@gmail.com  
**Subject:** `[SECURITY] <repo-name> - <brief description>`

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### What to expect

- Acknowledgement within **48 hours**
- Status update within **7 days**
- Fix timeline communicated once the issue is confirmed

## Security Practices

This project follows these security practices:

- Dependencies audited with `pnpm audit` on every CI run
- Secrets managed via environment variables (never hardcoded)
- Dependabot configured for automated dependency updates
- Sentry monitoring active in production for error detection
- HTTPS enforced on all production deployments (Vercel + Cloudflare)

## Disclosure Policy

We follow **responsible disclosure**. Once a fix is deployed, we will acknowledge the reporter (if they wish) in the release notes.

---

*This security policy applies to all code in this repository.*
