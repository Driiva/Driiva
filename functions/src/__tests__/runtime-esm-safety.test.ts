/**
 * The deployed Cloud Functions entry point must load on a Node that cannot
 * require() an ES module.
 *
 * `functions/package.json` pins `engines.node: "20"`, and Node 20 has no
 * `require(esm)` support (that arrived unflagged in 22.12). If anything the
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
 * at firebase-admin ^12 while the runtime is Node 20, pinned in
 * .github/dependabot.yml.
 *
 * Neither tsc nor the rest of this suite can see it. The unit tests mock every
 * firebase-admin entry point so they never load the real one, and a dev laptop
 * on Node 22 loads it happily. Only the resolved dependency tree and the built
 * artefact tell the truth, so this file checks both:
 *
 *   1. The lockfile check needs nothing installed and therefore runs in every
 *      job, including the root suite, which does not install functions/.
 *   2. The artefact check actually loads `lib/index.js` the way the runtime
 *      will. It needs functions/node_modules, so it runs in the functions
 *      project (CI's "Build (Cloud Functions)" job installs and builds before
 *      running it) and reports itself skipped elsewhere rather than passing
 *      quietly on a tree it could not load.
 *
 * `lib/` is committed (see functions/.gitignore) precisely because it is what
 * deploys, so checking it is checking the shipped thing.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

// Resolved from this file, not cwd: this suite runs both from functions/ and
// from the repo root's vitest config, which have different working dirs.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const FUNCTIONS_ROOT = path.resolve(HERE, '..', '..');
const ENTRY = path.join(FUNCTIONS_ROOT, 'lib', 'index.js');
const LOCKFILE = path.join(FUNCTIONS_ROOT, 'package-lock.json');

/** jose became ESM-only ("type": "module", no CJS build) at v6. */
const FIRST_ESM_ONLY_JOSE_MAJOR = 6;

const depsInstalled = existsSync(path.join(FUNCTIONS_ROOT, 'node_modules', 'firebase-admin'));
const libBuilt = existsSync(ENTRY);

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

function joseVersionsInLockfile(): string[] {
  const lock = JSON.parse(readFileSync(LOCKFILE, 'utf8')) as {
    packages?: Record<string, { version?: string }>;
  };
  return Object.entries(lock.packages ?? {})
    .filter(([name]) => name === 'node_modules/jose' || name.endsWith('/node_modules/jose'))
    .map(([, meta]) => meta.version ?? '0.0.0');
}

describe('Cloud Functions entry point loads on the Node 20 runtime', () => {
  it('resolves no ESM-only jose anywhere in the functions tree', () => {
    const versions = joseVersionsInLockfile();

    // Not vacuous: jose must actually be in the tree (firebase-admin pulls it
    // via jwks-rsa). If it disappears entirely this assertion would otherwise
    // pass by finding nothing, so pin its presence too.
    expect(versions.length, 'jose is no longer in the functions tree; re-check this guard').toBeGreaterThan(0);

    const esmOnly = versions.filter((v) => Number(v.split('.')[0]) >= FIRST_ESM_ONLY_JOSE_MAJOR);

    expect(
      esmOnly,
      `functions resolves jose ${esmOnly.join(', ')}, which is ESM-only. The ` +
        'Cloud Functions runtime is Node 20 and cannot require() an ES module, ' +
        'so lib/index.js fails at cold start and every exported function goes ' +
        'down. This comes in with firebase-admin 14 (jwks-rsa 4). Hold ' +
        'firebase-admin at ^12 until the runtime moves to Node 22+.',
    ).toEqual([]);
  });

  it.skipIf(!depsInstalled || !libBuilt)('loads the built lib/index.js without require(esm)', () => {
    const failure = loadWithoutRequireEsm(ENTRY);

    expect(
      failure,
      'lib/index.js cannot load the way the Node 20 runtime will load it. ' +
        'Something it pulls at module scope require()s an ESM-only package. ' +
        'Cold start fails for every exported function, not just the one that ' +
        'wanted it.',
    ).toBeNull();
  }, 60_000);

  it.skipIf(!depsInstalled)('is a real check: the probe still catches a genuine ESM-only module', () => {
    // Negative control. Without it, the assertion above would keep passing if
    // the probe silently stopped detecting anything. A .mjs file is always an
    // ES module, so require()ing it here must raise ERR_REQUIRE_ESM.
    const esmOnly = path.join(HERE, 'fixtures', 'esm-only.mjs');
    expect(existsSync(esmOnly)).toBe(true);
    expect(loadWithoutRequireEsm(esmOnly)).toBe('ERR_REQUIRE_ESM');
  }, 60_000);
});
