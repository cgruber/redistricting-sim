/**
 * Asset URL versioning and environment badge (GAME-067).
 *
 * Call initAssets() once at startup. After that, wrap every static asset path
 * through assetUrl() so the version query param is appended. Browsers treat
 * `sheet.png?v=v1.2.3` as a distinct URL from `sheet.png`, so a new deploy
 * automatically busts any cached copy.
 *
 * Version and environment are read from <meta> tags injected into index.html
 * by release.main.kts at deploy time — no network fetch needed, no 404 risk.
 * When the meta tags are absent (local file server, e2e test environment, or
 * Bazel serve), assets load without a ?v= suffix and no badge is shown.
 *
 * On non-production hostnames (dev / staging / localhost) a small version badge
 * is painted on screen so it is always obvious which build is being tested.
 */

let _version: string | null = null;
let _environment: string | null = null;

/**
 * Read deployment metadata from <meta> tags and show the version badge on
 * non-production hosts. Synchronous and infallible — call once at startup.
 */
export function initAssets(): void {
  const versionMeta = document.querySelector<HTMLMetaElement>('meta[name="app-version"]');
  const envMeta = document.querySelector<HTMLMetaElement>('meta[name="app-environment"]');

  const version = versionMeta?.content ?? "";
  const env = envMeta?.content ?? "";

  _version = version !== "" ? version : null;
  _environment = env !== "" ? env : null;

  if (!isProduction()) {
    showVersionBadge();
  }
}

/**
 * Return a URL for a static asset, appending ?v=<version> when the deployment
 * version is known. Makes the URL unique per release so browsers always fetch
 * fresh content after a deploy.
 */
export function assetUrl(path: string): string {
  return _version !== null ? `${path}?v=${_version}` : path;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isProduction(): boolean {
  const h = window.location.hostname;
  return h === "pastthepost.gg" || h === "www.pastthepost.gg";
}

function showVersionBadge(): void {
  const existing = document.getElementById("version-badge");
  if (existing) return;

  const badge = document.createElement("div");
  badge.id = "version-badge";
  const env = _environment ?? (window.location.hostname === "localhost" ? "local" : "?");
  const ver = _version ?? "no metadata";
  badge.textContent = `${env}  ${ver}`;
  document.body.appendChild(badge);
}
