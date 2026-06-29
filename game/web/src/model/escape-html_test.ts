/**
 * Unit tests for escape-html.ts — pure HTML-entity escaping (GAME-103).
 * Run via: bazel test //game/web/src/model:escape_html_test
 */

import { escapeHtml } from "./escape-html.js";
import { test, assertEqual, summarize } from "../testing/test_runner.js";

test("escapeHtml: neutralizes an injected element", () => {
	const input = "</span><img src=x onerror=alert(1)>";
	const escaped = escapeHtml(input);
	// The angle brackets must be escaped so the browser never builds an element.
	assertEqual(escaped, "&lt;/span&gt;&lt;img src=x onerror=alert(1)&gt;");
});

test("escapeHtml: leaves normal text unchanged", () => {
	assertEqual(escapeHtml("Harbor County"), "Harbor County");
	assertEqual(escapeHtml("Precinct 12"), "Precinct 12");
});

test("escapeHtml: escapes ampersand exactly once (no double-escape)", () => {
	// `&` is replaced first; subsequent rules must not re-process the entities
	// they introduce.
	assertEqual(escapeHtml("Smith & Sons"), "Smith &amp; Sons");
	assertEqual(escapeHtml("<a & b>"), "&lt;a &amp; b&gt;");
});

test("escapeHtml: escapes quotes", () => {
	assertEqual(escapeHtml("\"q\" 'a'"), "&quot;q&quot; &#39;a&#39;");
});

test("escapeHtml: empty string is unchanged", () => {
	assertEqual(escapeHtml(""), "");
});

summarize();
