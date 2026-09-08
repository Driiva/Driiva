// @vitest-environment node
// esbuild's JS API needs a real Node TextEncoder; jsdom's fails its startup invariant.
/**
 * The Vercel server bundle must not statically import an ES-only module chain.
 *
 * `vercel.json` builds the API as
 * `esbuild server/app.ts --bundle --platform=node --packages=external --format=esm`,
 * so every dependency stays external and is resolved by Vercel's runtime at
 * boot. That runtime cannot `require()` an ES module.
 *
 * `firebase-admin/auth` pulls `jwks-rsa`, which does `require('jose')`, and
 * jose v6 is ESM-only (`"type": "module"`). A single top-level
 * `import { getAuth } from 'firebase-admin/auth'` in anything server/app.ts
 * reaches therefore fails the whole serverless init, and `api/index.ts`
 * answers EVERY route with `{"error":"Server init failed"}`. Not a degraded
 * feature: a total API outage.
 *
 * This shipped once. It passed lint, tsc, the full unit suite and the build,
 * because none of those load the module the way Vercel does - the local dev
 * server runs on a Node that supports `require(esm)`, so it booted fine. The
 * only artefact that tells the truth is the bundle itself, so this test builds
 * it and reads its imports rather than scanning source for a proxy.
 *
 * Loading these lazily (`await import(...)` inside the function that needs
 * them) is fine and is what the two call sites do: the cost is paid on the
 * call, inside its existing try/catch, instead of at init.
 */
import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';

/**
 * Subpaths that drag in an ESM-only transitive dependency. Verified by loading
 * each one in CJS and inspecting `require.cache`: only `auth` pulls
 * jwks-rsa/jose; `app` and `firestore` are clean.
 */
const ESM_UNSAFE_SPECIFIERS = ['firebase-admin/auth'];

async function bundleServerImports(): Promise<{ static: string[]; dynamic: string[] }> {
  const result = await build({
    entryPoints: ['server/app.ts'],
    bundle: true,
    platform: 'node',
    packages: 'external',
    format: 'esm',
    write: false,
  });

  const code = result.outputFiles[0].text;

  // esbuild emits static imports as `... from "spec"` and dynamic ones as
  // `import("spec")`. Matching on the two forms separately is what lets this
  // test allow the lazy call sites while still failing a top-level import.
  const statics = [...code.matchAll(/from\s*"([^"]+)"/g)].map((m) => m[1]);
  const dynamics = [...code.matchAll(/import\(\s*"([^"]+)"/g)].map((m) => m[1]);

  return { static: statics, dynamic: dynamics };
}

describe('Vercel server bundle: ESM-only chains stay out of module scope', () => {
  it('does not statically import any specifier that pulls an ESM-only dependency', async () => {
    const imports = await bundleServerImports();
    const offenders = imports.static.filter((s) => ESM_UNSAFE_SPECIFIERS.includes(s));

    expect(
      offenders,
      `server/app.ts statically imports ${offenders.join(', ')}. That runs at ` +
        'serverless init, where Vercel cannot require() the ESM-only jose these ' +
        'pull in, so every /api route answers "Server init failed". Move it to ' +
        'an await import(...) inside the function that needs it.',
    ).toEqual([]);
  }, 30_000);

  it('still reaches firebase-admin/auth lazily, so the guard is about placement, not removal', async () => {
    const imports = await bundleServerImports();

    // If this ever goes empty the first assertion becomes vacuous: it would
    // pass because nothing imports auth at all, not because it is imported
    // safely. Pinning the lazy form keeps the guard honest.
    expect(imports.dynamic).toContain('firebase-admin/auth');
  }, 30_000);
});
