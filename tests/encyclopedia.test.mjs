import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';
import { details, media, collectDatedEntries, searchEntries } from '../encyclopedia-records.js';

const root = new URL('../', import.meta.url);
const context = { window: {} };
vm.runInNewContext(await readFile(new URL('exploration-data.js', root), 'utf8'), context);
const entries = context.window.VESTIGES_EXPLORATION_ITEMS;

test('chaque entrée du graphe possède une fiche éditoriale et des relations résolues séparément', () => {
  for (const entry of entries) {
    assert.ok(details[entry.id], `Fiche absente : ${entry.id}`);
    assert.equal(details[entry.id].body.length, 2);
    assert.equal(details[entry.id].questions.length, 3);
  }
  for (const image of media) assert.ok(entries.some(entry => entry.id === image.entryId));
});

test('la frise conserve tous les repères sourcés, leurs intervalles et leur ordre', () => {
  const dates = collectDatedEntries(entries);
  assert.deepEqual(dates.map(date => date.start), [1580, 1751, 1830, 1925]);
  assert.deepEqual(dates.map(date => date.end), [1585, 1751, 1832, 1925]);
  assert.equal(new Set(dates.map(date => date.key)).size, dates.length);
  for (const date of dates) {
    assert.ok(date.source.url.startsWith('https://'));
    assert.ok(date.precision);
    assert.ok(date.label);
  }
  assert.equal(dates.some(date => date.entryId === 'bois'), false);
});

test('la frise admet les dates anciennes et écarte une date manquante, inversée ou non sourcée', () => {
  const fixture = [{ id: 'a', title: 'A', type: 'Objet' }];
  const records = { a: { dates: [
    { start: -250, end: -200, source: { url: 'https://example.org/source' } },
    { start: 0, source: { url: 'https://example.org/source' } },
    { start: 10, end: 5, source: { url: 'https://example.org/source' } },
    { start: null, source: { url: 'https://example.org/source' } },
    { start: 20 },
    { start: Number.NaN, source: { url: 'https://example.org/source' } }
  ] } };
  assert.deepEqual(collectDatedEntries(fixture, records).map(date => [date.start, date.end]), [[-250, -200], [0, 0]]);
});

test('les médias locaux disposent d’une notice et les images du Met gardent leur provenance', async () => {
  const provenance = JSON.parse(await readFile(new URL('assets/encyclopedia/provenance.json', root), 'utf8'));
  for (const image of media) {
    await access(new URL(image.src.slice(1), root));
    assert.ok(image.alt && image.caption && image.credit && image.kind);
  }
  for (const record of provenance) {
    assert.equal(record.publicDomain, true);
    assert.equal(record.rights, 'The Met Open Access · CC0');
    assert.ok(record.width >= 1000 && record.height >= 1000);
    assert.ok(media.some(image => image.src === record.local && image.source === record.source));
  }
});

test('la recherche privilégie le titre exact et accepte accents, dates et lieux associés', () => {
  assert.equal(searchEntries(entries, 'Bois')[0].id, 'bois');
  assert.equal(searchEntries(entries, 'ceramique')[0].id, 'ceramique');
  assert.equal(searchEntries(entries, '1751')[0].id, 'textile');
  assert.equal(searchEntries(entries, 'Iznik')[0].id, 'ceramique');
  assert.equal(searchEntries(entries, 'plat Iznik')[0].id, 'ceramique');
  assert.deepEqual(searchEntries(entries, 'entrée absente'), []);
  assert.deepEqual(searchEntries(entries, ''), []);
});
