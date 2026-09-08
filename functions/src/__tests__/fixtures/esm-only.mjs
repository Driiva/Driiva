// Negative-control fixture for runtime-esm-safety.test.ts.
// A .mjs file is always an ES module, so require()ing it under
// --no-experimental-require-module must raise ERR_REQUIRE_ESM. If it ever
// stops doing so, the probe in that test has gone blind and its main
// assertion would be passing for the wrong reason.
export const marker = 'esm-only';
