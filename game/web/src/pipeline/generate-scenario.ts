import * as fs from "node:fs";
import * as path from "node:path";
import { parse as parseYaml } from "yaml";
import { runPipeline } from "./pipeline-runner.js";
import { parseScenario, validateScenarioComplete } from "../model/loader.js";
import type { PipelineSpec } from "./spec-types.js";

const workspaceDir = process.env["BUILD_WORKSPACE_DIRECTORY"] ?? process.cwd();

function resolvePath(p: string): string {
	return path.isAbsolute(p) ? p : path.resolve(workspaceDir, p);
}

const args = process.argv.slice(2);
if (args.length < 1) {
	console.error("Usage: generate-scenario <spec-file.spec.yaml> [output.json]");
	process.exit(1);
}

const specPath = resolvePath(args[0]!);

let outputPath: string;
if (args[1] !== undefined) {
	outputPath = resolvePath(args[1]);
} else {
	const derived = specPath.replace(/\.spec\.yaml$/, ".json");
	if (derived === specPath) {
		console.error(`Error: spec path does not end in .spec.yaml; provide an explicit output path.`);
		process.exit(1);
	}
	outputPath = derived;
}

const raw = fs.readFileSync(specPath, "utf-8");
const spec = parseYaml(raw) as PipelineSpec;

const partial = runPipeline(spec);

const parsed = parseScenario(partial);
const result = validateScenarioComplete(parsed);

const outDir = path.dirname(outputPath);
if (!fs.existsSync(outDir)) {
	fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n", "utf-8");
console.log(`Written: ${outputPath}`);
