// Run with: node scripts/verify-clinic-discovery.cjs
/* eslint-disable @typescript-eslint/no-require-imports -- Test existing TypeScript without adding a runtime dependency. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);
const { buildSeed } = require('../lib/seed.ts');
const { cityOf } = require('../lib/geo.ts');
const { discoverClinics, EMPTY_CLINIC_FILTERS: empty, commonTreatmentNames, toggleComparison, parseFavoriteIds } = require('../lib/clinic-discovery.ts');
const db = buildSeed();
const run = (patch = {}, favorites = [], translate) => discoverClinics(db.clinics, db.treatments, { ...empty, ...patch }, favorites, translate);
assert.equal(run().length, 99);
const originalIds = db.clinics.map(c => c.id);
const filtered = run({ city: '방콕', category: '필러', maxPrice: 20000, minRating: 4.5 });
assert.ok(filtered.length);
for (const c of filtered) {
  assert.equal(cityOf(c.district), '방콕');
  assert.ok(c.rating >= 4.5);
  assert.ok(db.treatments.some(t => t.clinicId === c.id && t.category === '필러' && t.price <= 20000));
}
assert.deepEqual(run({ favoritesOnly: true }, ['C01', 'C03']).map(c => c.id).sort(), ['C01', 'C03']);
assert.equal(run({ favoritesOnly: true }).length, 0);
assert.equal(run({ query: 'nothing-matches-987xyz' }).length, 0);
assert.ok(run({ district: db.clinics[0].district }).every(c => c.district === db.clinics[0].district));
assert.ok(run({ query: 'ＢＡＮＧＫＯＫ' }, [], value => value === '방콕' ? 'Bangkok' : value).length);
assert.ok(run({ query: 'Bangkok missing-term' }, [], value => value === '방콕' ? 'Bangkok' : value).length === 0);
assert.deepEqual(db.clinics.map(c => c.id), originalIds);
const fake = [{ ...db.clinics[0], id: 'a', image: '', rating: 4 }, { ...db.clinics[0], id: 'b', image: '', rating: 5 }, { ...db.clinics[0], id: 'c', image: '' }];
const treatments = [{ ...db.treatments[0], clinicId: 'a', name: 'same', category: '필러', price: 10000 }, { ...db.treatments[0], clinicId: 'a', name: 'cheap', category: '화이트닝', price: 100 }, { ...db.treatments[0], clinicId: 'b', name: 'same', category: '필러', price: 5000 }];
assert.deepEqual(discoverClinics(fake, treatments, { ...empty, category: '필러', maxPrice: 6000 }).map(c => c.id), ['b']);
assert.deepEqual(discoverClinics(fake, treatments, { ...empty, sort: 'priceDesc' }).map(c => c.id), ['b', 'a', 'c']);
assert.equal(run({ sort: 'rating' })[0].rating, Math.max(...db.clinics.map(c => c.rating)));
assert.deepEqual(commonTreatmentNames(fake.slice(0, 2), treatments), ['same']);
assert.deepEqual(commonTreatmentNames(fake, treatments), []);
assert.deepEqual(toggleComparison(['a', 'b', 'c'], 'd'), ['a', 'b', 'c']);
assert.deepEqual(toggleComparison(['a', 'b', 'c'], 'b'), ['a', 'c']);
assert.deepEqual(toggleComparison(['a'], 'b'), ['a', 'b']);
assert.deepEqual(parseFavoriteIds('broken-json'), []);
assert.deepEqual(parseFavoriteIds('{"a":1}'), []);
assert.deepEqual(parseFavoriteIds('["a","a",null,1,"b",""]'), ['a', 'b']);
console.log('Clinic discovery verified: 99 clinics, combined filters, translated search, favorites, sorting, same-treatment comparison and 3-clinic limit.');
