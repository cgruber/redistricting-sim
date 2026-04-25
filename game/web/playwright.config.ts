import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for behavioral (e2e) tests.
 *
 * The test server is started by e2e_test.sh (the Bazel sh_test wrapper), which
 * assembles Bazel-built artifacts into a temp directory and starts python3 -m
 * http.server on port 58173. This config just points at that port.
 *
 * There is no Vite dev server in this project — the app is esbuild-bundled via
 * Bazel and served statically.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 10_000,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "test-results/html", open: "never" }]],
  outputDir: "test-results/artifacts",

  use: {
    baseURL: "http://localhost:58173",
    // Collect trace on any test failure (on-first-retry is dead config with retries:0)
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
