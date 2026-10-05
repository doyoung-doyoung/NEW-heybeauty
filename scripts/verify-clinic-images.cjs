// Run with: node scripts/verify-clinic-images.cjs
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS runner transpiles the existing TypeScript seed without extra dependencies. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
const sharp = require('sharp');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
};
const { buildSeed, SEED_VERSION } = require('../lib/seed.ts');
const { migrate } = require('../lib/migrate.ts');
const root = path.resolve(__dirname, '..');

async function main() {
  const fresh = buildSeed();
  assert.equal(SEED_VERSION, 12);
  assert.equal(fresh.clinics.length, 99);
  assert.equal(new Set(fresh.clinics.map(c => c.id)).size, 99);
  const hashes = new Set();
  let bytes = 0;
  const rows = [];
  for (let n = 1; n <= 99; n++) {
    const id = `C${String(n).padStart(2, '0')}`;
    const clinic = fresh.clinics.find(c => c.id === id);
    const expected = n <= 10 ? `/clinics/${id}.jpg` :
      `/images/heybeauty/clinics/clinic-${n}.webp`;
    assert.equal(clinic.image, expected);
    const file = path.join(root, 'public', clinic.image);
    const buffer = fs.readFileSync(file);
    const info = await sharp(buffer).metadata();
    assert.ok(info.width > 0 && info.height > 0, `${id}: invalid image`);
    if (n > 10) {
      assert.equal(info.format, 'webp');
      assert.equal(info.width, 640);
      assert.equal(info.height, 426);
      assert.ok(buffer.length < 100 * 1024, `${id}: oversized image`);
      hashes.add(crypto.createHash('sha256').update(buffer).digest('hex'));
      bytes += buffer.length;
    }
    rows.push({ id, name: clinic.name, image: clinic.image, bytes: buffer.length });
  }
  assert.equal(hashes.size, 89, 'All generated images must be distinct');
  for (const version of [9, 10, 11]) {
    const saved = structuredClone(fresh);
    saved.version = version;
    saved.clinics.forEach((c, i) => { if (i >= 10) c.image = ''; });
    saved.clinics[11].image = '/clinics/C12.jpg';
    saved.clinics[0].image = '/user/custom-c01.jpg';
    const result = migrate(saved);
    assert.equal(result.version, 12);
    assert.equal(result.clinics[0].image, '/user/custom-c01.jpg');
    assert.deepEqual(result.clinics.slice(1, 10), saved.clinics.slice(1, 10));
    assert.deepEqual(result.clinics.slice(10), fresh.clinics.slice(10));
  }
  const custom = structuredClone(fresh);
  custom.version = 11;
  custom.clinics[10].image = '/user/custom-c11.jpg';
  assert.equal(migrate(custom).clinics[10].image, '/user/custom-c11.jpg');
  assert.deepEqual(migrate(fresh).clinics, fresh.clinics);
  assert.deepEqual(migrate(null).clinics, fresh.clinics);
  console.log(JSON.stringify({ status: 'PASS', connected: 99, generated: 89,
    uniqueGenerated: hashes.size, totalGeneratedBytes: bytes,
    migrationVersions: [9, 10, 11, 12], clinics: rows }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
