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
