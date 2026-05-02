/**
 * Unit tests for audioPlayer.ts (GAME-064).
 *
 * Uses the shared TAP runner. Run via Bazel:
 *   bazel test //web/src/audio:audioplayer_test
 *
 * Neither `localStorage` nor `Audio` exist in Node. Both are shimmed on
 * globalThis before the module under test is imported so the audio functions
 * hit the shims rather than missing globals.
 *
 * Coverage:
 *   mute toggle:
 *     - setMuted(true) → isMuted() === true
 *     - setMuted(false) → isMuted() === false
 *     - mute state round-trips through localStorage (persisted + reloaded)
 *   play():
 *     - no-ops when muted (no error thrown; Audio.play() never called)
 *     - no-ops for unknown clip name (no error thrown)
 *     - silently no-ops when play() returns a rejected Promise (autoplay policy)
 *     - silently no-ops when play() throws synchronously (older browsers)
 *   preload():
 *     - registers clip names; play() of unknown name → silent no-op
 *     - play() of registered clip attempts playback when unmuted
 */

// ─── localStorage shim (must be set up before importing audioPlayer.ts) ──────

const _store: Map<string, string> = new Map();

const localStorageShim = {
  getItem(key: string): string | null {
    return _store.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    _store.set(key, value);
  },
  removeItem(key: string): void {
    _store.delete(key);
  },
  clear(): void {
    _store.clear();
  },
};

(globalThis as unknown as Record<string, unknown>)["localStorage"] = localStorageShim;

// ─── Audio element shim ───────────────────────────────────────────────────────

/** Tracks whether play() was called on any shim instance. */
let _audioPlayCalled = false;

/**
 * Controls what the next AudioShim.play() call returns.
 * Default: Promise.resolve() (normal success).
 * Tests that exercise autoplay rejection or synchronous throw set this
 * to the desired failure mode before calling play().
 */
let _nextPlayResult: "resolve" | "reject" | "throw" = "resolve";

class AudioShim {
  src: string;
  preload: string = "auto";

  constructor(src: string) {
    this.src = src;
  }

  play(): Promise<void> {
    _audioPlayCalled = true;
    if (_nextPlayResult === "throw") {
      throw new DOMException("NotAllowedError", "NotAllowedError");
    }
    if (_nextPlayResult === "reject") {
      return Promise.reject(new DOMException("NotAllowedError", "NotAllowedError"));
    }
    return Promise.resolve();
  }
}

(globalThis as unknown as Record<string, unknown>)["Audio"] = AudioShim;

// ─── Imports (after shims are installed) ─────────────────────────────────────

import { preload, play, setMuted, isMuted, _resetForTesting } from "./audioPlayer.js";
import { test, assertEqual, assertTrue, assertFalse, assertDoesNotThrow, summarize } from "../testing/test_runner.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resetAll(): void {
  _store.clear();
  _audioPlayCalled = false;
  _nextPlayResult = "resolve";
  // _resetForTesting() clears the clip registry and nulls the in-memory mute
  // cache so each test begins from a clean slate without carrying over clips
  // or stale cache values from prior tests.
  _resetForTesting();
}

// ─── isMuted() defaults ───────────────────────────────────────────────────────

test("isMuted: defaults to false when key absent from localStorage", () => {
  resetAll();
  assertFalse(isMuted(), "should be false by default");
});

// ─── setMuted / isMuted round-trip ───────────────────────────────────────────

test("setMuted(true) → isMuted() === true", () => {
  resetAll();
  setMuted(true);
  assertTrue(isMuted(), "isMuted should be true after setMuted(true)");
});

test("setMuted(false) → isMuted() === false", () => {
  resetAll();
  setMuted(true);
  setMuted(false);
  assertFalse(isMuted(), "isMuted should be false after setMuted(false)");
});

test("mute state is persisted to localStorage key", () => {
  resetAll();
  setMuted(true);
  const raw = _store.get("redistricting-sim-audio-muted");
  assertEqual(raw, "true", "localStorage should hold 'true'");
});

test("unmute state is persisted to localStorage key", () => {
  resetAll();
  setMuted(true);
  setMuted(false);
  const raw = _store.get("redistricting-sim-audio-muted");
  assertEqual(raw, "false", "localStorage should hold 'false'");
});

// ─── play() when muted ───────────────────────────────────────────────────────

test("play() no-ops when muted — no error thrown", () => {
  resetAll();
  preload({ beep: "stub://beep.mp3" });
  setMuted(true);
  assertDoesNotThrow(() => play("beep"), "play() should not throw when muted");
});

test("play() does not start audio when muted", () => {
  resetAll();
  preload({ beep: "stub://beep.mp3" });
  setMuted(true);
  _audioPlayCalled = false;
  play("beep");
  assertFalse(_audioPlayCalled, "Audio.play() must not be called when muted");
});

// ─── play() with unknown name ─────────────────────────────────────────────────

test("play() of unknown clip name — no error thrown", () => {
  resetAll();
  setMuted(false);
  assertDoesNotThrow(() => play("nonexistent"), "play() should not throw for unknown name");
});

test("play() of unknown clip name — no audio started", () => {
  resetAll();
  setMuted(false);
  _audioPlayCalled = false;
  play("nonexistent");
  assertFalse(_audioPlayCalled, "Audio.play() must not be called for unknown name");
});

// ─── preload() + play() ───────────────────────────────────────────────────────

test("preload() registers clips; play() of registered name attempts playback", () => {
  resetAll();
  preload({ chime: "stub://chime.mp3" });
  setMuted(false);
  _audioPlayCalled = false;
  play("chime");
  assertTrue(_audioPlayCalled, "Audio.play() should be called for a registered, unmuted clip");
});

test("preload() multiple clips; each registered independently", () => {
  resetAll();
  preload({ a: "stub://a.mp3", b: "stub://b.mp3" });
  setMuted(false);
  _audioPlayCalled = false;
  play("a");
  assertTrue(_audioPlayCalled, "clip 'a' should be playable");
  _audioPlayCalled = false;
  play("b");
  assertTrue(_audioPlayCalled, "clip 'b' should be playable");
});

// ─── play() autoplay-rejection handling ──────────────────────────────────────

test("play() silently no-ops when browser rejects play() Promise (autoplay policy)", () => {
  resetAll();
  preload({ blocked: "stub://blocked.mp3" });
  setMuted(false);
  _nextPlayResult = "reject";
  // play() attaches a .catch() to the rejected Promise, so it must not throw
  // synchronously and must not surface an unhandled rejection.
  assertDoesNotThrow(() => play("blocked"), "play() must not throw on Promise rejection");
});

test("play() silently no-ops when play() throws synchronously (older browser)", () => {
  resetAll();
  preload({ blocked: "stub://blocked.mp3" });
  setMuted(false);
  _nextPlayResult = "throw";
  assertDoesNotThrow(() => play("blocked"), "play() must not throw when Audio.play() throws synchronously");
});

summarize();
