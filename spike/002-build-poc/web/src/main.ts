// wasm_bindgen global is injected by index.html (no-modules wasm-bindgen format)
// before this script runs. Declared here for TypeScript strict-mode type safety.
declare const wasm_bindgen: {
  add(a: number, b: number): number;
};

const el = document.getElementById("result");
if (el !== null) {
  el.textContent = String(wasm_bindgen.add(2, 3));
}
