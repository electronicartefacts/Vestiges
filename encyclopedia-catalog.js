import { details, collectDatedEntries, searchEntries } from './encyclopedia-records.20261013b.js';

const met = (id, label) => ({ label, url: `https://www.metmuseum.org/art/collection/search/${id}`, institution: 'The Metropolitan Museum of Art' });
export const families = [
  ['practice', 'Pratiques & techniques'], ['material', 'Matières'], ['work', 'Œuvres & objets'],
  ['person', 'Artistes & personnes'], ['movement', 'Styles & mouvements'], ['article', 'Articles & dossiers'], ['product', 'Produits']
];
export const practices = [['ceramique', 'Céramique'], ['gravure', 'Gravure'], ['textile', 'Textile'], ['marqueterie', 'Marqueterie'], ['forge', 'Forge'], ['verre', 'Verre soufflé']];
export const materials = [['bois', 'Bois'], ['textile', 'Textile'], ['bronze', 'Bronze'], ['terre', 'Terre'], ['verre', 'Verre'], ['papier', 'Papier']];
export const styles = [['art-deco', 'Art déco'], ['iznik', 'Décor d’Iznik'], ['estampe-edo', 'Estampe Edo'], ['kosode', 'Motifs de kosode']];
export const periods = [['16', 'XVIe siècle', 1500, 1599], ['18', 'XVIIIe siècle', 1700, 1799], ['19', 'XIXe siècle', 1800, 1899], ['20', 'XXe siècle', 1900, 1999], ['edo', 'Période Edo', 1615, 1868], ['unknown', 'Sans repère daté', null, null]];
export const places = [['TUR', 'Turquie'], ['JPN', 'Japon'], ['FRA', 'France'], ['NOR', 'Norvège'], ['unknown', 'Sans lieu renseigné']];
const location = (country, label, role, source, status = 'Référence documentée') => ({ country, label, role, source, status, precision: 'Repère du pays' });
const iznik = location('TUR', 'Iznik · Turquie', 'Lieu de production de l’objet cité', met(453324, 'Notice du plat'));
const japanPrint = location('JPN', 'Japon', 'Contexte culturel de l’estampe citée', met(39799, 'Notice de l’estampe'));
const japanBook = location('JPN', 'Japon', 'Contexte culturel du livre cité', met(78758, 'Notice du livre'));
const paris = location('FRA', 'Paris · France', 'Lieu de l’exposition de 1925', { label: 'L’Art déco dans l’habitat', url: 'https://www.vam.ac.uk/articles/art-deco-in-the-home', institution: 'Victoria and Albert Museum' });
const norway = location('NOR', 'Norvège · pays indiqué', 'Pays rapporté pour Bois flotté 01 ; lieu précis inconnu', { label: 'Origine et limites du modèle', url: '/assets/works/bois-flotte-01/provenance.json', institution: 'Electronic Artefacts' }, 'Indication non vérifiée');

export const referenceDetails = {
  'plat-iznik': { kicker: 'Un objet, un décor, une notice', body: ['Ce plat à décor « kaléidoscope » est conservé au Metropolitan Museum of Art. Sa notice indique Iznik, en Turquie, et une datation vers 1580–1585.', 'Le décor rayonnant donne une entrée visuelle pour observer la composition. La provenance et les caractéristiques de l’objet sont à consulter dans la notice de collection.'], questions: ['Comment le décor rayonne-t-il ?', 'Que documente la notice ?', 'Comment situer cet objet sans généraliser une tradition ?'], sources: [met(453324, 'Plat à décor « kaléidoscope »')], dates: details.ceramique.dates },
  'vague-kanagawa': { kicker: 'Une estampe dans sa collection', body: ['La Grande Vague de Hokusai est une estampe sur bois située au Japon, durant la période Edo. Le Met date ce tirage vers 1830–1832.', 'La fiche relie ici une œuvre, un artiste, une technique et un contexte. Elle ne constitue ni une offre de vente ni un dossier d’artisan contemporain.'], questions: ['Comment la ligne construit-elle la vague ?', 'Quel tirage la notice décrit-elle ?', 'Comment l’œuvre se relie-t-elle à son artiste ?'], sources: [met(39799, 'La Grande Vague de Hokusai')], dates: details.gravure.dates },
  'livre-kosode': { kicker: 'Un livre pour transmettre le motif', body: ['Ce livre de motifs de kosode est attribué à Enoki Shinuemon Hironobu et daté de 1751 par le Met. Il appartient au contexte japonais de la période Edo.', 'Le document imprimé est distingué des vêtements et des textiles auxquels les motifs se rapportent. Cette distinction aide à comparer supports et usages.'], questions: ['Quel support porte les motifs ?', 'À quels usages le livre se rapporte-t-il ?', 'Que documente l’attribution ?'], sources: [met(78758, 'Livre de motifs de kosode')], dates: details.textile.dates },
  hokusai: { kicker: 'Artiste historique · référence de collection', body: ['Katsushika Hokusai est l’artiste auquel le Met attribue La Grande Vague. La notice le présente comme un artiste japonais ayant vécu de 1760 à 1849.', 'Cette entrée donne accès à une attribution historique et à une œuvre associée. Elle est distincte des futurs profils d’artisan·es qui seront préparés avec les personnes concernées.'], questions: ['Quelle œuvre est attribuée à cet artiste ?', 'Quelle source porte l’attribution ?', 'Comment distinguer la vie de l’artiste et la date d’un tirage ?'], sources: [met(39799, 'Attribution et notice de La Grande Vague')], dates: [{ start: 1760, end: 1849, label: '1760–1849', precision: 'Dates de vie indiquées par le Met', title: 'Katsushika Hokusai', place: 'Japon', description: 'Un repère biographique, distinct de la datation des œuvres.', source: met(39799, 'Consulter l’attribution') }] },
  enoki: { kicker: 'Artiste historique · attribution documentée', body: ['Enoki Shinuemon Hironobu est l’artiste indiqué par le Met pour le livre de motifs de kosode de 1751.', 'La notice indique une activité au milieu du XVIIIe siècle. Aucune année de naissance ou de décès n’est ajoutée à cette entrée.'], questions: ['Quel document porte cette attribution ?', 'Que dit la notice de l’activité de l’artiste ?', 'Quelles dates restent non renseignées ?'], sources: [met(78758, 'Attribution du livre de motifs de kosode')], dates: details.textile.dates },
  'lire-estampe': { kicker: 'Guide de lecture · proposition éditoriale', body: ['Pour regarder une estampe, on peut distinguer l’image, la matrice et le tirage. La Grande Vague donne ici un point d’entrée vers ces questions.', 'Cette proposition de lecture relie la fiche Gravure à l’œuvre et à son artiste. Les faits propres à l’objet restent attribués à la notice du Met.'], questions: ['Quel élément est observé ?', 'Qu’est-ce qui est imprimé ?', 'Quelle notice permet de poursuivre ?'], sources: [met(39799, 'Œuvre de référence')], dates: details.gravure.dates },
  'lire-ceramique': { kicker: 'Guide de lecture · proposition éditoriale', body: ['Une céramique peut être regardée à travers son volume, sa surface et son décor. Le plat d’Iznik propose un exemple concret pour faire varier cette lecture.', 'Le lieu et la datation concernent cet objet cité. Ils ne déterminent pas l’origine de toutes les pratiques céramiques.'], questions: ['Comment se lit le volume ?', 'Comment se lit la surface ?', 'Que permet d’établir la source ?'], sources: [met(453324, 'Objet de référence')], dates: details.ceramique.dates },
  'lire-textile': { kicker: 'Guide de lecture · proposition éditoriale', body: ['Un motif peut circuler entre un document imprimé et un vêtement. Le livre de kosode aide à séparer le support de l’image et l’usage auquel elle se rapporte.', 'La lecture peut ensuite rapprocher dessin, textile et transmission. Les informations propres au livre restent rattachées à sa notice.'], questions: ['Quel est le support ?', 'Quel est l’usage envisagé ?', 'Comment le motif circule-t-il ?'], sources: [met(78758, 'Document de référence')], dates: details.textile.dates }
};
export const records = { ...details, ...referenceDetails };
const metadata = {
  marqueterie: { practices: ['marqueterie'], materials: ['bois'], styles: ['art-deco'], relatedIds: ['bois', 'art-deco', 'gravure'] },
  dentelle: { practices: ['textile'], materials: ['textile'], styles: ['art-deco'] },
  forge: { practices: ['forge'], materials: ['bronze'] },
  ceramique: { practices: ['ceramique'], materials: ['terre'], styles: ['iznik'], locations: [iznik], relatedIds: ['mosaïque', 'verre', 'plat-iznik', 'lire-ceramique'] },
  verre: { practices: ['verre'], materials: ['verre'], styles: ['art-deco'] },
  bois: { materials: ['bois'], locations: [norway] },
  textile: { practices: ['textile'], materials: ['textile', 'papier'], styles: ['kosode'], locations: [japanBook], relatedIds: ['dentelle', 'teinture', 'livre-kosode', 'lire-textile'] },
  bronze: { practices: ['forge'], materials: ['bronze'] },
  'art-deco': { styles: ['art-deco'], locations: [paris] },
  teinture: { practices: ['textile'], materials: ['textile'] },
  gravure: { practices: ['gravure'], materials: ['bois', 'papier'], styles: ['estampe-edo'], locations: [japanPrint], relatedIds: ['bois', 'marqueterie', 'vague-kanagawa', 'lire-estampe'] },
  'mosaïque': { practices: ['ceramique'], materials: ['terre', 'verre'] }
};
const extras = [
  { id: 'plat-iznik', title: 'Plat d’Iznik', type: 'Objet de collection', family: 'work', shortDescription: 'Un plat à décor rayonnant, vers 1580–1585, documenté par le Met.', practices: ['ceramique'], materials: ['terre'], styles: ['iznik'], locations: [iznik], relatedIds: ['ceramique', 'lire-ceramique'] },
  { id: 'vague-kanagawa', title: 'La Grande Vague', type: 'Œuvre', family: 'work', shortDescription: 'Une estampe de Hokusai, vers 1830–1832, conservée au Met.', practices: ['gravure'], materials: ['bois', 'papier'], styles: ['estampe-edo'], locations: [japanPrint], relatedIds: ['gravure', 'hokusai', 'lire-estampe'] },
  { id: 'livre-kosode', title: 'Livre de motifs de kosode', type: 'Document de collection', family: 'work', shortDescription: 'Un livre japonais de modèles, daté de 1751 par le Met.', practices: ['textile', 'gravure'], materials: ['papier', 'textile'], styles: ['kosode'], locations: [japanBook], relatedIds: ['textile', 'enoki', 'lire-textile'] },
  { id: 'hokusai', title: 'Katsushika Hokusai', type: 'Artiste historique', family: 'person', shortDescription: 'Artiste japonais, 1760–1849, auquel le Met attribue La Grande Vague.', practices: ['gravure'], materials: ['papier', 'bois'], styles: ['estampe-edo'], locations: [location('JPN', 'Japon', 'Contexte de l’attribution historique', met(39799, 'Attribution de l’œuvre'))], relatedIds: ['vague-kanagawa', 'gravure'] },
  { id: 'enoki', title: 'Enoki Shinuemon Hironobu', type: 'Artiste historique', family: 'person', shortDescription: 'Artiste indiqué dans la notice du livre de motifs de kosode.', practices: ['textile', 'gravure'], materials: ['papier'], styles: ['kosode'], locations: [location('JPN', 'Japon', 'Contexte du document attribué', met(78758, 'Attribution du livre'))], relatedIds: ['livre-kosode', 'textile'] },
  { id: 'lire-estampe', title: 'Lire une estampe', type: 'Article', family: 'article', shortDescription: 'Une proposition éditoriale pour distinguer image, matrice et tirage.', practices: ['gravure'], materials: ['bois', 'papier'], styles: ['estampe-edo'], locations: [japanPrint], relatedIds: ['gravure', 'vague-kanagawa'] },
  { id: 'lire-ceramique', title: 'Lire une céramique', type: 'Article', family: 'article', shortDescription: 'Une proposition éditoriale pour observer volume, surface et décor.', practices: ['ceramique'], materials: ['terre'], styles: ['iznik'], locations: [iznik], relatedIds: ['ceramique', 'plat-iznik'] },
  { id: 'lire-textile', title: 'Lire un motif textile', type: 'Article', family: 'article', shortDescription: 'Une proposition éditoriale autour du dessin, du support et de la transmission.', practices: ['textile'], materials: ['textile', 'papier'], styles: ['kosode'], locations: [japanBook], relatedIds: ['textile', 'livre-kosode'] }
];
export function buildCatalog(base) {
  return [...Array.from(base).map(entry => ({ ...entry, family: entry.family || (entry.type === 'Matière' ? 'material' : entry.type === 'Style' ? 'movement' : 'practice'), ...metadata[entry.id] })), ...extras]
    .map(entry => ({ practices: [], materials: [], styles: [], locations: [], ...entry }));
}
export function searchCatalog(entries, query) {
  const searchable = entries.map(entry=>({...entry,shortDescription: `${entry.shortDescription} ${entry.locations.map(place=>place.label).join(' ')} ${[...entry.practices,...entry.materials,...entry.styles].map(id=>[...practices,...materials,...styles].find(([key])=>key===id)?.[1]||id).join(' ')}`}));
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  return searchEntries(searchable, query, records).map(entry => byId.get(entry.id));
}
export function filterEntries(entries, filters = {}) {
  const period = periods.find(([key]) => key === filters.period);
  const matching = new Set(searchCatalog(entries, filters.query || '').map(entry => entry.id));
  return entries.filter(entry => {
    if (filters.query?.trim() && !matching.has(entry.id)) return false;
    if (filters.family && entry.family !== filters.family) return false;
    if (filters.practice && !entry.practices.includes(filters.practice)) return false;
    if (filters.material && !entry.materials.includes(filters.material)) return false;
    if (filters.style && !entry.styles.includes(filters.style)) return false;
    if (filters.country === 'unknown' && entry.locations.length) return false;
    if (filters.country && filters.country !== 'unknown' && !entry.locations.some(place => place.country === filters.country)) return false;
    const dates = records[entry.id]?.dates || [];
    if (period?.[0] === 'unknown' && dates.length) return false;
    if (period && period[0] !== 'unknown' && !dates.some(date => date.start <= period[3] && (date.end ?? date.start) >= period[2])) return false;
    return true;
  });
}
export function collectCatalogDates(entries) {
  const dates = collectDatedEntries(entries, records);
  const grouped = new Map();
  for (const date of dates) {
    const key = `${date.source.url}|${date.start}|${date.end}`;
    const current = grouped.get(key);
    if (!current) grouped.set(key, { ...date, linkedEntryIds: [date.entryId] });
    else {
      const linkedEntryIds = [...current.linkedEntryIds, date.entryId];
      if (entries.find(entry => entry.id === date.entryId)?.family === 'work') grouped.set(key, { ...date, linkedEntryIds });
      else current.linkedEntryIds = linkedEntryIds;
    }
  }
  return [...grouped.values()].sort((a, b) => a.start - b.start || a.end - b.end);
}
export function mediaForEntries(images, entries) {
  const ids = new Set(entries.map(entry => entry.id));
  const associations = { iznik: ['plat-iznik', 'lire-ceramique'], wave: ['vague-kanagawa', 'hokusai', 'lire-estampe'], kosode: ['livre-kosode', 'enoki', 'lire-textile'] };
  return images.filter(image => ids.has(image.entryId) || (associations[image.id] || []).some(id => ids.has(id)));
}
export function groupLocations(entries) {
  const groups = new Map();
  for (const entry of entries) for (const place of entry.locations) {
    if (!groups.has(place.country)) groups.set(place.country, { country: place.country, label: places.find(([id]) => id === place.country)?.[1] || place.country, entries: [], locations: [] });
    const group = groups.get(place.country);
    if (!group.entries.some(item => item.id === entry.id)) group.entries.push(entry);
    group.locations.push({ ...place, entryId: entry.id, entryTitle: entry.title });
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
}
