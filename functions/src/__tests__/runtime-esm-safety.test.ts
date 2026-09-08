/**
 * The deployed Cloud Functions entry point must load on a Node that cannot
 * require() an ES module.
 *
 * `functions/package.json` pins `engines.node: "20"`, and Node 20 has no
 * `require(esm)` support (that arrived unflagged in 22.12). If any module the
 * entry point pulls at load time ends up `require`-ing an ESM-only package,
 * `lib/index.js` throws ERR_REQUIRE_ESM at cold start and EVERY exported
 * function goes down together, not just the one that wanted it.
 *
 * That is not hypothetical. Bumping firebase-admin 12 to 14 swapped
 * jwks-rsa 3 (which depends on the dual-build jose 4) for jwks-rsa 4 (which
 * depends on the ESM-only jose 6). firebase-functions requires
 * `firebase-admin/auth` from `common/providers/identity.js` all by itself, so
 * no amount of care in our own imports avoids it: on firebase-admin 14 the
 * whole deployment simply cannot boot on Node 20. functions/ is therefore held
 * at firebase-admin ^12 while the runtime is Node 20.
 *
 * Two things make this worth an artefact-level test rather than a comment:
 * `tsc` and the unit suite are both perfectly happy with the broken version
 * (the tests mock every firebase-admin entry point, so they never load the
 * real one), and the laptop runs Node 22, where it loads fine. Only executing
 * the built artefact the way the runtime will execute it tells the truth.
 *
 * `lib/` is committed (see functions/.gitignore) precisely because it is what
 * deploys, so checking it here is checking the shipped thing.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

// Resolved from this file, not cwd: the suite runs both from functions/ and
// from the repo root's vitest config, which have different working dirs.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const FUNCTIONS_ROOT = path.resolve(HERE, '..', '..');
const ENTRY = path.join(FUNCTIONS_ROOT, 'lib', 'index.js');

/**
 * Load `spec` in a child Node with require(esm) turned off, which is how
 * Node 20 behaves. Returns null on success or the error code on failure.
 */
function loadWithoutRequireEsm(spec: string): string | null {
  const script = `try { require(${JSON.stringify(spec)}); console.log("OK"); }
    catch (e) { console.log(e.code || "ERR"); }`;
  const out = execFileSync(
    process.execPath,
    ['--no-experimental-require-module', '-e', script],
    { cwd: FUNCTIONS_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ).trim();
  return out === 'OK' ? null : out;
}

describe('Cloud Functions entry point loads on the Node 20 runtime', () => {
  it('has a built lib/index.js to check', () => {
    // If this ever fails the suite is not proving anything about the deploy,
    // so it fails loudly rather than skipping.
    expect(existsSync(ENTRY), `${ENTRY} missing - run npm run build`).toBe(true);
  });

  it('loads lib/index.js without require(esm)', () => {
    const failure = loadWithoutRequireEsm(ENTRY);

    expect(
      failure,
      'lib/index.js cannot load on Node 20. Something it pulls at module scope ' +
        'require()s an ESM-only package (historically jose v6, via ' +
        'firebase-admin 14 -> jwks-rsa 4). Cold start fails for every exported ' +
        'function. Either keep firebase-admin on ^12, or move the offending ' +
        'import inside the function that needs it.',
    ).toBeNull();
  }, 60_000);

  it('is a real check: the same probe still reports a genuine ESM-only failure', () => {
    // Negative control. Without this, the assertion above would keep passing
    // if the probe silently stopped detecting anything. jose is only present
    // as an ESM-only package on the firebase-admin 14 tree, so assert against
    // a module we know is ESM-only in every tree: an .mjs file requires ESM.
    const esmOnly = path.join(FUNCTIONS_ROOT, 'src', '__tests__', 'fixtures', 'esm-only.mjs');
    expect(existsSync(esmOnly)).toBe(true);
    expect(loadWithoutRequireEsm(esmOnly)).toBe('ERR_REQUIRE_ESM');
  }, 60_000);
});
