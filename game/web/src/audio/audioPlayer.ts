/**
 * Audio playback infrastructure (GAME-064).
 *
 * Handles preloading clips, browser autoplay policy, mute toggle persisted to
 * localStorage, and accessibility. Designed to be called by the character
 * reaction system (GAME-062).
 *
 * Behavioral contract:
 *   - preload() registers name → URL mappings and creates <audio> elements.
 *   - play() silently no-ops if muted, if the name is unknown, or if the
 *     browser blocks autoplay (catches the resulting DOMException / rejected
 *     Promise).
 *   - setMuted() persists the state to localStorage.
 *   - isMuted() reads from localStorage on first access; defaults to false.
 *   - prefers-reduced-motion does NOT affect audio (independent preferences).
 */

const MUTE_KEY = "redistricting-sim-audio-muted";

/** Clip registry: name → HTMLAudioElement */
const _clips: Map<string, HTMLAudioElement> = new Map();

/** Cached mute state. `undefined` means "not yet read from localStorage". */
let _mutedCache: boolean | undefined = undefined;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Register a set of clip names → URLs and create <audio> elements for each
 * so the browser can begin preloading them.
 */
export function preload(clips: Record<string, string>): void {
  for (const [name, url] of Object.entries(clips)) {
    const el = new Audio(url);
    el.preload = "auto";
    _clips.set(name, el);
  }
}

/**
 * Play a registered clip by name.
 * Silent no-op when:
 *   - muted
 *   - name not registered
 *   - browser autoplay policy blocks playback
 */
export function play(name: string): void {
  if (isMuted()) return;
  const el = _clips.get(name);
  if (el === undefined) return;

  try {
    const result = el.play();
    // play() returns a Promise in modern browsers; catch policy rejections.
    if (result !== undefined) {
      result.catch(() => {
        // Autoplay blocked or interrupted — silently ignore.
      });
    }
  } catch {
    // Synchronous throw (older browsers) — silently ignore.
  }
}

/**
 * Set mute state and persist it to localStorage.
 */
export function setMuted(muted: boolean): void {
  _mutedCache = muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? "true" : "false");
  } catch {
    // Storage unavailable — silently ignore.
  }
}

/**
 * Return the current mute state. Reads from localStorage on first call;
 * defaults to false if the key is absent or storage is unavailable.
 */
export function isMuted(): boolean {
  if (_mutedCache !== undefined) return _mutedCache;
  try {
    const raw = localStorage.getItem(MUTE_KEY);
    _mutedCache = raw === "true";
  } catch {
    _mutedCache = false;
  }
  return _mutedCache;
}

// ─── Test-only helpers ────────────────────────────────────────────────────────

/**
 * Reset all module-level state. FOR TESTING ONLY.
 *
 * Clears the clip registry and nulls the mute cache so each test starts from
 * a known-clean slate without carrying over clips registered in prior tests.
 */
export function _resetForTesting(): void {
  _clips.clear();
  _mutedCache = undefined;
}
