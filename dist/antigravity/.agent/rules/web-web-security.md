---
trigger: glob
globs: **/*.tsx,**/*.ts,**/*.css
---

> This file extends [common/security.md](../common/security.md) with web-specific security content.

# Web Security Rules

## Content Security Policy

Always configure a production CSP.

### Nonce-Based CSP

Use a per-request nonce for scripts instead of `'unsafe-inline'`.

```text
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{RANDOM}' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.example.com;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
```

Adjust origins to the project. Do not cargo-cult this block unchanged.

## XSS Prevention

- Never inject unsanitized HTML
- Avoid `innerHTML` / `dangerouslySetInnerHTML` unless sanitized first
- Escape dynamic template values
- Sanitize user HTML with a vetted local sanitizer when absolutely necessary

## Third-Party Scripts

- Load asynchronously
- Use SRI when serving from a CDN
- Audit quarterly *(Kanōn)*
- Prefer self-hosting for critical dependencies when practical

## HTTPS and Headers

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Forms

- CSRF protection on state-changing forms
- Rate limiting on submission endpoints
- Validate client and server side
- Prefer honeypots or light anti-abuse controls over heavy-handed CAPTCHA defaults *(Kanōn)*

## Sources

- Content Security Policy: W3C, "Content Security Policy Level 3", https://www.w3.org/TR/CSP3/
- XSS prevention: OWASP, "Cross Site Scripting Prevention Cheat Sheet", https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- Subresource Integrity: W3C, "Subresource Integrity", https://www.w3.org/TR/sri/
- HSTS: IETF, RFC 6797, 2012, https://www.rfc-editor.org/rfc/rfc6797
- X-Content-Type-Options: WHATWG, Fetch Standard, https://fetch.spec.whatwg.org/#x-content-type-options-header
- X-Frame-Options: IETF, RFC 7034, 2013, https://www.rfc-editor.org/rfc/rfc7034
- Referrer-Policy: W3C, "Referrer Policy", https://www.w3.org/TR/referrer-policy/
- Permissions-Policy: W3C, "Permissions Policy", https://www.w3.org/TR/permissions-policy/
- CSRF protection: OWASP, "Cross-Site Request Forgery Prevention Cheat Sheet", https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- Rate limiting: OWASP, "API4:2023 Unrestricted Resource Consumption", API Security Top 10, 2023, https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/
- CAPTCHA: von Ahn, Blum, Hopper & Langford, "CAPTCHA: Using Hard AI Problems for Security", EUROCRYPT 2003, doi:10.1007/3-540-39200-9_18
