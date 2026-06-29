// Runtime type guards and throwing helpers for JSON parsing.

export function isObject(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function isString(v: unknown): v is string {
	return typeof v === "string";
}

export function isNumber(v: unknown): v is number {
	return typeof v === "number";
}

export function isBoolean(v: unknown): v is boolean {
	return typeof v === "boolean";
}

export function isArray(v: unknown): v is unknown[] {
	return Array.isArray(v);
}

export function requireString(v: unknown, label: string): string {
	if (!isString(v)) throw new Error(`${label}: expected string, got ${typeof v}`);
	return v;
}

export function requireNumber(v: unknown, label: string): number {
	if (!isNumber(v)) throw new Error(`${label}: expected number, got ${typeof v}`);
	// Reject NaN/Infinity: typeof admits them, but a non-finite value silently defeats
	// downstream invariants (e.g. a NaN share makes `Math.abs(sum - 1) > EPSILON` false,
	// so the malformed-demographics check passes) and corrupts election math. Negatives
	// are still allowed here — axial hex coordinates (q, r) are legitimately negative;
	// non-negativity is enforced per-field where the semantics require it.
	if (!Number.isFinite(v)) throw new Error(`${label}: expected finite number, got ${v}`);
	return v;
}

export function requireBoolean(v: unknown, label: string): boolean {
	if (!isBoolean(v)) throw new Error(`${label}: expected boolean, got ${typeof v}`);
	return v;
}

export function requireArray(v: unknown, label: string): unknown[] {
	if (!isArray(v)) throw new Error(`${label}: expected array, got ${typeof v}`);
	return v;
}

export function requireObject(v: unknown, label: string): Record<string, unknown> {
	if (!isObject(v)) throw new Error(`${label}: expected object, got ${typeof v}`);
	return v;
}
