const LAST_PLAYED_KEY = "redistricting-sim-last-played-scenario";

export interface Campaign {
	id: string;
	title: string;
	description: string;
	scenarioIds: string[];
}

export const CAMPAIGN_REGISTRY: Campaign[] = [
	{
		id: "tutorial",
		title: "Tutorial",
		description:
			"Learn the basics of district drawing with two introductory maps.",
		scenarioIds: ["tutorial-001", "tutorial-002"],
	},
	{
		id: "educational",
		title: "Educational Campaign",
		description:
			"Explore nine scenarios that illustrate real gerrymandering techniques and their effects on elections.",
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
];

export function getCampaign(id: string): Campaign | undefined {
	return CAMPAIGN_REGISTRY.find((c) => c.id === id);
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
