// Same-origin stub for the bare `react` / `react-dom` specifiers (GAME-103).
//
// zundo pulls in zustand/esm/react.mjs, which has a bare `import "react"`.
// Nothing in this app calls React APIs (we use zustand/vanilla), so the import
// only needs to resolve. The importmap points both "react" and "react-dom" at
// this module. Serving a real file lets us drop `data:` from the CSP script-src,
// closing the `<script src="data:text/javascript,…">` injection vector that the
// old `data:text/javascript,export default {};` importmap entries required.
export default {};
