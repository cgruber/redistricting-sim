/**
 * Shared TAP-style test runner for all unit test files (BUILD-007).
 *
 * Run via Bazel js_test targets — each test file is a separate Node process so
 * the module-level counters reset between test suites automatically.
 *
 * Usage in a test file:
 *   import { test, assertEqual, summarize, ... } from "../testing/test_runner.js";
 *   test("description", () => { assertEqual(actual, expected); });
 *   summarize();
 */

let _count = 0;
let _failed = 0;

export function test(name: string, fn: () => void): void {
  _count++;
  try {
    fn();
    console.log(`ok ${_count} - ${name}`);
  } catch (e) {
    _failed++;
    console.log(`not ok ${_count} - ${name}`);
    console.error(`  # ${e instanceof Error ? e.message : String(e)}`);
  }
}

export function assertEqual<T>(actual: T, expected: T, msg?: string): void {
  if (actual !== expected) {
    throw new Error(
      `${msg ?? "assertEqual"}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

export function assertDeepEqual(actual: unknown, expected: unknown, msg?: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${msg ?? "assertDeepEqual"}: expected ${e}, got ${a}`);
  }
}

export function assertTrue(actual: boolean, msg?: string): void {
  if (!actual) throw new Error(`${msg ?? "assertTrue"}: expected true`);
}

export function assertFalse(actual: boolean, msg?: string): void {
  if (actual) throw new Error(`${msg ?? "assertFalse"}: expected false`);
}

export function assertNull(actual: unknown, msg?: string): void {
  if (actual !== null) {
    throw new Error(`${msg ?? "assertNull"}: expected null, got ${JSON.stringify(actual)}`);
  }
}

export function assertNotNull(actual: unknown, msg?: string): void {
  if (actual === null || actual === undefined) {
    throw new Error(`${msg ?? "assertNotNull"}: expected non-null, got ${String(actual)}`);
  }
}

export function assertClose(
  actual: number,
  expected: number,
  tolerance: number,
  msg?: string,
): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(
      `${msg ?? "assertClose"}: expected ${expected} ±${tolerance}, got ${actual}`,
    );
  }
}

export function assertThrows(fn: () => unknown, pattern?: RegExp, msg?: string): void {
  let threw = false;
  try {
    fn();
  } catch (e) {
    threw = true;
    if (pattern !== undefined) {
      const message = e instanceof Error ? e.message : String(e);
      if (!pattern.test(message)) {
        throw new Error(
          `${msg ?? "assertThrows"}: error thrown but message "${message}" did not match ${pattern}`,
        );
      }
    }
  }
  if (!threw) {
    throw new Error(`${msg ?? "assertThrows"}: expected function to throw but it did not`);
  }
}

export function assertDoesNotThrow(fn: () => unknown, msg?: string): void {
  try {
    fn();
  } catch (e) {
    throw new Error(
      `${msg ?? "assertDoesNotThrow"}: expected no throw but got: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

export function summarize(): void {
  console.log(`\n1..${_count}`);
  if (_failed > 0) {
    console.error(`# ${_failed} of ${_count} tests failed`);
    throw new Error(`Test suite failed: ${_failed} of ${_count} tests failed`);
  } else {
    console.log(`# All ${_count} tests passed`);
  }
}
