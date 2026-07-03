// Pre-merge check: every ID declared in package.json `extensionPack` must be a
// real, published extension. The VS Code Marketplace is the source of truth and a
// missing member there fails the build (catches typos / renamed extensions). Open
// VSX is reported for visibility only — the collection is not yet at 1:1 parity
// there, so a gap is a warning, not a failure.
//
// No dependencies: uses Node's global fetch (Node >= 18). Run via `npm run ci`.

import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const ids = pkg.extensionPack ?? [];

if (ids.length === 0) {
  console.error('✖ package.json has no `extensionPack` entries to verify.');
  process.exit(1);
}

const MARKETPLACE = 'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery';
const OPEN_VSX = 'https://open-vsx.org/api';

async function withRetry(fn, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr;
}

// Returns 'found' | 'missing' | 'error'
async function checkMarketplace(id) {
  try {
    return await withRetry(async () => {
      const res = await fetch(MARKETPLACE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json;api-version=3.0-preview.1',
        },
        body: JSON.stringify({
          filters: [{ criteria: [{ filterType: 7, value: id }] }],
          flags: 914,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const exts = data?.results?.[0]?.extensions ?? [];
      return exts.length > 0 ? 'found' : 'missing';
    });
  } catch {
    return 'error';
  }
}

// Returns 'found' | 'missing' | 'error'
async function checkOpenVsx(id) {
  const [namespace, name] = id.split('.');
  try {
    return await withRetry(async () => {
      const res = await fetch(`${OPEN_VSX}/${namespace}/${name}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 404) return 'missing';
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return 'found';
    });
  } catch {
    return 'error';
  }
}

const icon = { found: '✅', missing: '❌', error: '⚠️ ' };

const rows = await Promise.all(
  ids.map(async (id) => ({
    id,
    marketplace: await checkMarketplace(id),
    openvsx: await checkOpenVsx(id),
  })),
);

const pad = Math.max(...ids.map((id) => id.length));
console.log('\nExtension pack members:\n');
console.log(`  ${'ID'.padEnd(pad)}   Marketplace   Open VSX`);
console.log(`  ${'-'.repeat(pad)}   -----------   --------`);
for (const r of rows) {
  console.log(`  ${r.id.padEnd(pad)}   ${icon[r.marketplace]}            ${icon[r.openvsx]}`);
}
console.log('');

const missingOnMarketplace = rows.filter((r) => r.marketplace === 'missing');
const errored = rows.filter((r) => r.marketplace === 'error');
const missingOnOpenVsx = rows.filter((r) => r.openvsx === 'missing');

if (missingOnOpenVsx.length > 0) {
  console.log(
    `ℹ Not yet on Open VSX (${missingOnOpenVsx.length}): ` +
      missingOnOpenVsx.map((r) => r.id).join(', '),
  );
}

if (errored.length > 0) {
  // Infra hiccup, not a declaration error — warn but do not block the merge.
  console.log(
    `⚠ Could not reach the Marketplace for: ${errored.map((r) => r.id).join(', ')} (skipped).`,
  );
}

if (missingOnMarketplace.length > 0) {
  console.error(
    `\n✖ These extensionPack IDs do not exist on the VS Code Marketplace:\n` +
      missingOnMarketplace.map((r) => `    - ${r.id}`).join('\n') +
      `\n  Fix the ID in package.json (typo / renamed / unpublished extension).`,
  );
  process.exit(1);
}

console.log('✔ All extensionPack members exist on the VS Code Marketplace.');
