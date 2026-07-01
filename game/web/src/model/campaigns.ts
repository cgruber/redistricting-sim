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
}

export const CAMPAIGN_REGISTRY: Campaign[] = [
	{
		id: "tutorial",
		title: "Tutorial",
		description: "Learn the basics of district drawing and the map's geographic features.",
		scenarioIds: ["tutorial-001", "tutorial-002", "tutorial-003", "tutorial-004"],
	},
	{
		id: "educational",
		title: "Educational Campaign",
		description:
			"Explore eight scenarios that illustrate real gerrymandering techniques and their effects on elections.",
		scenarioIds: [
			"scenario-002",
			"scenario-003",
			"scenario-004",
			"scenario-005",
			"scenario-006",
			"scenario-007",
			"scenario-008",
			"scenario-009",
		],
	},
	{
		id: "debug",
		title: "Debug (dev)",
		description: "Developer-only demo and test scenarios — visible only when debug mode is active.",
		// The 3-party multiparty demo scenario lands in GAME-112; this campaign is its
		// gated home. Until then the card is debug-only and its scenario is not yet built.
		scenarioIds: ["tutorial-005"],
		debugOnly: true,
	},
];

export function getCampaign(id: string): Campaign | undefined {
	return CAMPAIGN_REGISTRY.find((c) => c.id === id);
}

/**
 * Campaigns to show in campaign-select for the given debug state (GAME-115):
 * `debugOnly` campaigns appear only when debug mode is active; all others always.
 */
export function visibleCampaigns(isDebug: boolean): Campaign[] {
	return CAMPAIGN_REGISTRY.filter((c) => !c.debugOnly || isDebug);
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
