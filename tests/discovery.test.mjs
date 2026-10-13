import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { buildCatalog, records, filterEntries, collectCatalogDates, mediaForEntries, groupLocations } from '../encyclopedia-catalog.js';
import { media } from '../encyclopedia-records.js';
import { countries } from '../world-geometry.js';
import { worldMapMarkup, comparisonMarkup } from '../encyclopedia-spatial.js';
const context={window:{}};
vm.runInNewContext(await readFile(new URL('../exploration-data.js',import.meta.url),'utf8'),context);
const entries=buildCatalog(context.window.VESTIGES_EXPLORATION_ITEMS);

test('le catalogue sépare les œuvres, personnes et articles et ne crée aucun produit',()=>{
 assert.equal(entries.length,20);
 assert.equal(new Set(entries.map(entry=>entry.id)).size,20);
 assert.equal(filterEntries(entries,{family:'work'}).length,3);
 assert.equal(filterEntries(entries,{family:'person'}).length,2);
 assert.equal(filterEntries(entries,{family:'article'}).length,3);
 assert.deepEqual(filterEntries(entries,{family:'product'}),[]);
 for(const entry of entries)assert.ok(records[entry.id]);
});
test('les facettes se croisent sans élargir les résultats en cas de combinaison vide',()=>{
 const selection=filterEntries(entries,{practice:'ceramique',period:'16',country:'TUR',style:'iznik'});
 assert.deepEqual(selection.map(entry=>entry.id),['ceramique','plat-iznik','lire-ceramique']);
 assert.deepEqual(filterEntries(entries,{practice:'ceramique',period:'16',country:'TUR',style:'iznik',family:'work'}).map(entry=>entry.id),['plat-iznik']);
 assert.deepEqual(filterEntries(entries,{country:'TUR',style:'art-deco'}),[]);
 assert.equal(filterEntries(entries,{family:'person',period:'18',country:'JPN'}).length,2);
});
test('la recherche et les médias respectent les facettes et les associations des œuvres',()=>{
 const selection=filterEntries(entries,{query:'céramique',family:'work'});
 assert.deepEqual(selection.map(entry=>entry.id),['plat-iznik']);
 assert.deepEqual(mediaForEntries(media,selection).map(image=>image.id),['iznik']);
 assert.deepEqual(mediaForEntries(media,filterEntries(entries,{family:'product'})),[]);
 assert.equal(filterEntries(entries,{query:'Japon'}).length,8);
});
test('un document daté partagé par plusieurs entrées conserve un seul repère et tous ses liens',()=>{
 const dates=collectCatalogDates(entries);
 assert.equal(dates.length,5);
 const book=dates.find(date=>date.start===1751);
 assert.equal(book.entryId,'livre-kosode');
 for(const id of ['textile','livre-kosode','enoki','lire-textile'])assert.ok(book.linkedEntryIds.includes(id));
 assert.ok(dates.every(date=>date.source.url));
});
test('la géographie conserve le rôle, la précision et la source de chaque lieu',()=>{
 const groups=groupLocations(entries);
 assert.equal(groups.length,4);
 const norway=groups.find(group=>group.country==='NOR');
 assert.equal(norway.entries.length,1);
 assert.equal(norway.locations[0].status,'Indication non vérifiée');
 assert.match(norway.locations[0].role,/lieu précis inconnu/);
 for(const group of groups){
  const country=countries.find(country=>country.id===group.country);
  assert.ok(country?.path);
  assert.ok(country.label.every(Number.isFinite));
  for(const place of group.locations){assert.ok(place.source.url);assert.equal(place.precision,'Repère du pays');}
 }
 assert.equal(groupLocations(filterEntries(entries,{country:'unknown'})).length,0);
});
test('la carte et la comparaison exposent les inconnues et les commandes clavier',()=>{
 const map=worldMapMarkup(groupLocations(entries));
 assert.match(map,/role="button" tabindex="0" data-country="NOR"/);
 assert.match(map,/is-reported/);
 assert.doesNotMatch(map,/style="/);
 const table=comparisonMarkup([entries.find(entry=>entry.id==='bois'),entries.find(entry=>entry.id==='plat-iznik')],records,{families:[],practices:[],materials:[],styles:[]});
 assert.match(table,/Non renseignés/);
 assert.match(table,/Indication non vérifiée/);
 assert.match(table,/scope="row"/);
 assert.match(table,/scope="col"/);
});
