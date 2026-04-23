import { defineConfig } from "vite";

export default defineConfig({
	resolve: {
		alias: {
			// zustand's main entry requires React; redirect all imports (including from
			// zundo) to the vanilla subpath which has no React dependency.
			zustand: "zustand/vanilla",
		},
	},
	root: ".",
	publicDir: "public",
	build: {
		outDir: "dist",
		target: "es2022",
	},
	server: {
		open: true,
		port: 5173,
	},
});
