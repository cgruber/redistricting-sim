---
id: TRIAGE-001
title: Production Security Hardening Recommendations
area: BUILD
status: resolved
created: 2026-04-27
---

## Summary
Implement Content Security Policy (CSP), Subresource Integrity (SRI), and related hardening for public static hosting of the client-side game. Codebase is clean (no exfil/network risks), but prod deploys need browser-enforced protections against XSS/injection.

## Current State
- Pure static TypeScript SPA (`game/web/`): Local fetches, WASM, localStorage.
- Served via `serve.sh` (local) or static hosts (GH Pages/Netlify).
- No CSP/SRI; inline styles/scripts; debug exposes in localhost.

## Goals / Acceptance Criteria
- [ ] Add CSP meta tag to `game/web/index.html` (exact policy below)
- [ ] Compute/add SRI `integrity` attrs to WASM glue, WASM binary, `bundle.js`
- [ ] Extract inline `<style>` to `styles.css` + `<link>` (remove `'unsafe-inline'`)
- [ ] Gate localhost-only debug (`__gameStore` expose, `#btn-debug-win`)
- [ ] Add `beforeunload` localStorage.clear() for privacy
- [ ] Verify: Devtools no CSP/SRI errors; Lighthouse Security 100
- [ ] Document in README.md: Deploy instructions (GH Pages/Netlify)

## Test Coverage
- [ ] E2E: Load page → No console CSP errors (smoke.spec.ts)
- [ ] Manual: Tamper `bundle.js` → SRI blocks load

## Recommendations

### 1. Content Security Policy (CSP)
Add to `game/web/index.html` **<head>** (after `<title>`):

```html
<meta http-equiv="Content-Security-Policy" 
      content="
        default-src 'self';
        script-src 'self' 'wasm-unsafe-eval';
        style-src 'self' 'unsafe-inline';
        img-src data: blob:;
        connect-src 'self';
        base-uri 'self';
        form-action 'self';
      ">
```

**Rationale**: 
- Blocks XSS (no `eval` from externals).
- `'wasm-unsafe-eval'`: WASM exec.
- `'unsafe-inline'`: Temp for styles (extract later).
- Restricts fetches/imgs to self/data (matches code).

### 2. Subresource Integrity (SRI)
For `<script src=...>` + dynamic `bundle.js`.

**Steps** (`game/web/`):
```bash
openssl dgst -sha384 -binary wasm_calc_bindgen.js | openssl base64 -A
openssl dgst -sha384 -binary wasm_calc_bindgen_bg.wasm | openssl base64 -A
# Rebuild → hash bundle.js
```

**Update HTML**:
```html
<script src="wasm_calc_bindgen.js" integrity="sha384-[GLUE_HASH]"></script>
<script>
  wasm_bindgen("./wasm_calc_bindgen_bg.wasm");  // No src, manual verify optional
  var s = document.createElement('script');
  s.src = 'bundle.js';
  s.integrity = 'sha384-[BUNDLE_HASH]';
  s.crossOrigin = 'anonymous';
  document.body.appendChild(s);
</script>
```

**Rationale**: Detects tampering (MITM/CDN compromise). SHA-384 strongest.

### 3. Extract Inline Styles
- Move `<style>` → `styles.css`.
- `<link rel="stylesheet" href="styles.css">`.
- CSP: `style-src 'self'`.

**Rationale**: Drops `'unsafe-inline'` (CSP strict-mode).

### 4. Privacy / Debug
`main.ts`:
```ts
window.addEventListener('beforeunload', () => localStorage.clear());
if (import.meta.env.DEV || window.location.hostname === 'localhost') {
  (window as any).__gameStore = store;
}
```

Hide `#btn-debug-win` unless `?debug`.

**Rationale**: No PII retention; no prod cheats.

### 5. Hosting
- **GH Pages**: Settings → Pages → `game/web`.
- **Netlify/Vercel**: Drag dir.
- Headers: Mirror CSP.

**Rationale**: Auto-HTTPS; audit-ready.

## Rationale
- **Client-Only**: Hardening prevents worst-case (e.g., deps hacked).
- **Zero Cost**: Config-only; browser-enforced.
- **Future-Proof**: Enables strict CSP; Steam/CDN safe.

## Triage Resolution (2026-04-27)

| Recommendation | Disposition | Detail |
|---|---|---|
| 1. CSP meta tag | **Accepted** → BUILD-005 | Straightforward; `'unsafe-inline'` for styles temporary |
| 2. SRI | **Deferred** | Bazel rebuilds change hashes each build; needs build-time hash injection. Post-v1 |
| 3. Extract inline styles | **Accepted** → BUILD-006 | Prerequisite for dropping `'unsafe-inline'` from CSP |
| 4a. `localStorage.clear()` on beforeunload | **Rejected** | Destroys player save data (GAME-007 save/resume relies on localStorage persisting) |
| 4b. Gate `__gameStore` to dev | **Deferred** | Used by e2e tests; needs build-time flag. `#btn-debug-win` already gated via `?debug` param |
| 5. Hosting docs | **Skipped** | Already covered by DIST-001 ticket |

## References
- `game/web/index.html`
- Security analysis: 2026-04-27 agent session (clean scan: no exfil/obfuscation).