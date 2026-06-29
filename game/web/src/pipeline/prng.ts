/**
 * Seeded deterministic PRNG (mulberry32) for the GAME-084 pipeline.
 *
 * Used by population-stage and demographics-stage so that any pipeline run
 * with the same spec produces the exact same scenario JSON.
 */

export interface Prng {
	/** Returns a float in [min, max). */
	nextDouble(min: number, max: number): number;
	/** Returns an integer in [min, max] (both endpoints inclusive). */
	nextInt(min: number, max: number): number;
}

export function makePrng(seed: number): Prng {
	let s = seed >>> 0;

	function next(): number {
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	return {
		nextDouble(min: number, max: number): number {
			return min + next() * (max - min);
		},
		nextInt(min: number, max: number): number {
			return Math.floor(min + next() * (max - min + 1));
		},
	};
}
