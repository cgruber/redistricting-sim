const LAST_PLAYED_KEY = "redistricting-sim-last-played-scenario";

export interface Campaign {
	id: string;
	title: string;
	description: string;
	scenarioIds: string[];
	/**
	 * When true, this campaign is hidden from campaign-select unless debug mode is
	 * active (GAME-115). It is a home for test/demonstration scenarios that ship in
	 * the bundle but should not be discoverable by normal players. Gating, not
	 * build-exclusion — a direct `?campaign=<id>` link still resolves for developers.
	 */
	debugOnly?: boolean;
	/**
	 * When true, the campaign is shown on campaign-select but is not yet playable: the card renders
	 * as a non-interactive "coming soon" placeholder — no scenario count, no navigation, out of the
	 * tab order. Scenarios may still ship in the bundle and resolve via a direct `?campaign=<id>`
	 * link (like `debugOnly`, this gates menu discovery, not the build). Lets beta ship with the
	 * tutorial live while the educational arc is still being authored (GAME-128).
	 */
	comingSoon?: boolean;
}

export const CAMPAIGN_REGISTRY: Campaign[] = [
	{
		id: "tutorial",
		title: "Tutorial",
		description:
			"Learn to draw districts: the core loop, the rules, reading elections, and races with multiple parties and independents.",
		// The public tutorial ladder (GAME-121; see thoughts/shared/decisions/2026-07-05-
		// tutorial-progression-and-multiparty-placement.md): six rungs, each teaching one new
		// mechanic through the guided coach, all gated on legality only (no seat goals). 005 and
		// 006 were promoted here out of the retired debug campaign.
		scenarioIds: [
			"tutorial-001",
			"tutorial-002",
			"tutorial-003",
			"tutorial-004",
			"tutorial-005",
			"tutorial-006",
		],
	},
	{
		id: "educational",
		title: "Educational Campaign",
		description:
			"Explore nine scenarios that illustrate real gerrymandering techniques and their effects on elections.",
		// Not yet playable in beta — shown as a "coming soon" placeholder on campaign-select
		// (GAME-128). The scenarios exist in the bundle and still resolve via ?campaign=educational.
		comingSoon: true,
		scenarioIds: [
			"scenario-002",
			"scenario-003",
			"scenario-004",
			"scenario-005",
			"scenario-010",
			"scenario-006",
			"scenario-007",
			"scenario-008",
			"scenario-009",
		],
	},
];

export function getCampaign(id: string): Campaign | undefined {
	return CAMPAIGN_REGISTRY.find((c) => c.id === id);
}

/**
 * Campaigns to show in campaign-select for the given debug state (GAME-115):
 * `debugOnly` campaigns appear only when debug mode is active; all others always.
 *
 * `registry` defaults to CAMPAIGN_REGISTRY; it is injectable so the gating can be unit-tested with
 * a synthetic fixture. No shipped campaign currently sets `debugOnly` — the multi-party and
 * independent demos were promoted into the public tutorial (GAME-121) — so the flag + this filter
 * are retained, dormant, for future demo/test scenarios.
 */
export function visibleCampaigns(
	isDebug: boolean,
	registry: readonly Campaign[] = CAMPAIGN_REGISTRY,
): Campaign[] {
	return registry.filter((c) => !c.debugOnly || isDebug);
}

/**
 * Hosts where a `comingSoon` campaign is unlocked for preview rather than shown as a placeholder:
 * the dev deployment only (`dev.pastthepost.gg` — any `dev.` host). Beta, staging, production, and
 * a default local build all keep `comingSoon` closed, so an unfinished arc stays hidden on every
 * public channel. Fail-closed: any host not matched here → false (GAME-131).
 *
 * Keyed on the *runtime* hostname, deliberately NOT `import.meta.env.DEV`: the dev deploy is a
 * production `vite build`, where `import.meta.env.DEV` is false — so a build-mode check would
 * wrongly render the card closed on the very deployment meant to preview it. The hostname is the
 * reliable per-channel signal.
 */
export function isPreviewHost(hostname: string): boolean {
	return hostname.startsWith("dev.");
}

/**
 * Whether `campaign` should render as a non-interactive "coming soon" placeholder in the given
 * runtime environment. A `comingSoon` campaign is unlocked (interactive + playable) on a preview
 * host (see {@link isPreviewHost}) or in debug mode (`?debug`, GAME-115); everywhere else it stays a
 * placeholder. This lets HEAD/dev open the educational arc for testing while beta keeps it closed
 * until the arc is finished (GAME-131). A campaign without `comingSoon` is never a placeholder.
 */
export function rendersAsComingSoon(
	campaign: Campaign,
	hostname: string,
	isDebug: boolean,
): boolean {
	return !!campaign.comingSoon && !isDebug && !isPreviewHost(hostname);
}

export function saveLastPlayedScenario(scenarioId: string): void {
	try {
		localStorage.setItem(LAST_PLAYED_KEY, scenarioId);
	} catch {
		// storage unavailable — silently ignore
	}
}

export function loadLastPlayedScenario(): string | null {
	try {
		return localStorage.getItem(LAST_PLAYED_KEY);
	} catch {
		return null;
	}
}
