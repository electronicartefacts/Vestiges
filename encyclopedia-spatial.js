import { countries } from './world-geometry.20261013a.js';
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const project = ([longitude, latitude]) => [(longitude + 180) / 360 * 1000, (90 - latitude) / 180 * 500];
export function worldMapMarkup(groups, { zoom = 1, compact = false, selected } = {}) {
  const active = new Set(groups.map(group => group.country));
  const focus = groups.length === 1 ? countries.find(country => country.id === groups[0].country)?.label : null;
  const [cx, cy] = focus ? project(focus) : [500, 250];
  const width = 1000 / zoom, height = 500 / zoom;
  const x = Math.max(0, Math.min(1000 - width, cx - width / 2));
  const y = Math.max(0, Math.min(500 - height, cy - height / 2));
  return `<div class="world-map${compact ? ' world-map--compact' : ''}" data-world-map data-mosaic-no-drag data-zoom="${zoom}"><div class="map-controls" role="group" aria-label="Zoom de la carte"><button type="button" data-map-zoom="1" aria-label="Agrandir la carte">+</button><button type="button" data-map-zoom="-1" aria-label="Réduire la carte">−</button><button type="button" data-map-reset>Vue mondiale</button></div><svg viewBox="${x} ${y} ${width} ${height}" role="group" aria-label="Carte des pays liés aux références de la sélection"><title>Repères mondiaux à l’échelle des pays</title><g class="map-graticule" aria-hidden="true"><path d="M0 125H1000M0 250H1000M0 375H1000M250 0V500M500 0V500M750 0V500"/></g><g aria-hidden="true">${countries.map(country => `<path class="map-land${active.has(country.id) ? ' has-reference' : ''}" d="${country.path}"/>`).join('')}</g>${groups.map(group => {
    const country = countries.find(country => country.id === group.country);
    if (!country) return '';
    const [px, py] = project(country.label);
    const reported = group.locations.every(place => place.status === 'Indication non vérifiée');
    return `<g class="world-pin${reported ? ' is-reported' : ''}${group.entries.some(entry=>entry.id===selected)?' is-current':''}" transform="translate(${px} ${py})" role="button" tabindex="0" data-country="${group.country}" aria-label="Filtrer par ${escape(group.label)} : ${group.entries.length} entrées liées${reported ? ', indication non vérifiée' : ''}"><circle class="pin-hit" r="7"/><circle class="pin-visible" r="5"/><title>${escape(group.label)} · ${group.entries.length} entrées liées</title></g>`;
  }).join('')}</svg><p class="map-caption">Fond contemporain · repères du pays${compact ? '' : ' · choisir un point pour filtrer'}</p></div>`;
}
export function comparisonMarkup(entries, records, labels) {
  if (entries.length < 2) return '<p class="comparison-empty">Choisissez au moins deux entrées disponibles dans la sélection pour les comparer.</p>';
  const list = (values, names) => values.length ? values.map(value => names.find(([id]) => id === value)?.[1] || value).join(' · ') : 'Non renseigné';
  const rows = [
    ['Nature', entry => labels.families.find(([id]) => id === entry.family)?.[1] || entry.type],
    ['Pratiques liées', entry => list(entry.practices, labels.practices)],
    ['Matières liées', entry => list(entry.materials, labels.materials)],
    ['Styles & mouvements liés', entry => list(entry.styles, labels.styles)],
    ['Repères datés', entry => records[entry.id]?.dates?.map(date => `${date.label} — ${date.title}`).join(' · ') || 'Non renseignés'],
    ['Lieux de référence', entry => entry.locations.map(place => `${place.label} — ${place.role} (${place.status})`).join(' · ') || 'Non renseignés'],
    ['Lecture', entry => entry.shortDescription],
    ['Sources', entry => records[entry.id]?.sources?.map(source => source.label).join(' · ') || 'À documenter']
  ];
  return `<div class="comparison-scroll" data-mosaic-no-drag tabindex="0" role="region" aria-label="Tableau comparatif, défilement horizontal possible"><table class="comparison-table"><caption>Comparer les informations disponibles, sans attribuer de classement.</caption><thead><tr><th scope="col">Critère</th>${entries.map(entry => `<th scope="col"><span>${escape(entry.type)}</span><strong>${escape(entry.title)}</strong><button type="button" data-subject-link="${escape(entry.id)}" data-read-entry>Lire cette entrée ↗</button></th>`).join('')}</tr></thead><tbody>${rows.map(([title, getter]) => {
    const values = entries.map(getter);
    const different = new Set(values).size > 1;
    return `<tr data-different="${different}"><th scope="row">${title}</th>${values.map((value,index) => `<td>${title==='Sources' && records[entries[index].id]?.sources?.length ? records[entries[index].id].sources.map(source=>`<a href="${escape(source.url)}">${escape(source.label)} ↗</a>`).join('<br>') : escape(value)}</td>`).join('')}</tr>`;
  }).join('')}</tbody></table></div>`;
}

export function initCatalogGraph(root, onSelect) {
  const field = root.querySelector('[data-exploration-field]');
  const list = root.querySelector('[data-exploration-items]');
  const lines = root.querySelector('[data-exploration-relations]');
  const alternative = root.querySelector('[data-exploration-text-list]');
  const buttons = new Map();
  let entries = [], selected, previewed;
  let columns = 4;
  let frame = 0;
  const byId = () => new Map(entries.map(entry => [entry.id, entry]));
  const connected = id => new Set([id, ...(byId().get(id)?.relatedIds || []), ...entries.filter(entry => entry.relatedIds.includes(id)).map(entry => entry.id)]);
  function showDetails(id) {
    const entry = byId().get(id);
    if (!entry) return;
    previewed = id;
    root.querySelector('[data-exploration-type]').textContent = `${entry.type} · ${['work','person'].includes(entry.family) ? 'référence de collection' : 'exemple éditorial'}`;
    root.querySelector('[data-exploration-name]').textContent = entry.title;
    root.querySelector('[data-exploration-description]').textContent = entry.shortDescription;
    const neighbors = entries.filter(candidate => candidate.id !== id && connected(id).has(candidate.id));
    root.querySelector('[data-exploration-relation]').textContent = `${neighbors.length} éléments associés dans la sélection`;
    const related = root.querySelector('[data-exploration-related-list]');
    if (!related.contains(document.activeElement)) {
      related.replaceChildren(...neighbors.map(neighbor => {
        const row = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'home-graph-related__button';
        const name = document.createElement('span'); name.textContent = neighbor.title;
        const type = document.createElement('small'); type.textContent = neighbor.type;
        button.append(name, type);
        button.addEventListener('click', () => { onSelect(neighbor.id); buttons.get(neighbor.id)?.focus(); });
        row.append(button); return row;
      }));
    }
    for (const [key, button] of buttons) {
      button.classList.toggle('is-selected', key === selected);
      button.classList.toggle('is-related', key !== id && connected(id).has(key));
      button.setAttribute('aria-pressed', String(key === selected));
    }
    draw();
  }
  function draw() {
    frame = 0;
    const bounds = field.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    lines.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    const keys = new Set();
    const paths = [];
    for (const entry of entries) for (const relatedId of entry.relatedIds) {
      if (!buttons.has(relatedId)) continue;
      const key = [entry.id, relatedId].sort().join('|');
      if (keys.has(key)) continue;
      keys.add(key);
      const a = buttons.get(entry.id).getBoundingClientRect();
      const b = buttons.get(relatedId).getBoundingClientRect();
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${a.left-bounds.left+a.width/2} ${a.top-bounds.top+a.height/2}L${b.left-bounds.left+b.width/2} ${b.top-bounds.top+b.height/2}`);
      path.classList.toggle('is-related', entry.id === previewed || relatedId === previewed);
      paths.push(path);
    }
    lines.replaceChildren(...paths);
  }
  function update(next, id) {
    entries = next; selected = id;
    columns = Math.min(innerWidth <= 680 ? 3 : 4, Math.max(1, entries.length));
    const rows = Math.max(1, Math.ceil(entries.length / columns));
    const nextIds = new Set(entries.map(entry => entry.id));
    for (const [key, button] of buttons) if (!nextIds.has(key)) { button.remove(); buttons.delete(key); }
    entries.forEach((entry, index) => {
      let button = buttons.get(entry.id);
      if (!button) {
        button = document.createElement('button'); button.type = 'button';
        const type = document.createElement('span'); type.textContent = entry.type;
        const title = document.createElement('strong'); title.textContent = entry.title;
        button.append(type,title); button.dataset.catalogGraphId = entry.id;
        button.addEventListener('pointerenter', () => showDetails(entry.id));
        button.addEventListener('focus', () => showDetails(entry.id));
        button.addEventListener('click', () => onSelect(entry.id));
        buttons.set(entry.id, button); list.append(button);
      }
      button.className = `exploration-item home-atlas-node catalog-node catalog-col-${index%columns+1}-${columns} catalog-row-${Math.floor(index/columns)+1}-${rows}`;
    });
    alternative.replaceChildren(...entries.map(entry => {
      const row = document.createElement('li'); const button = document.createElement('button');
      button.type='button'; button.className='home-graph-text-entry'; button.textContent=entry.title;
      button.addEventListener('click',()=>onSelect(entry.id)); row.append(button); return row;
    }));
    if (entries.length) showDetails(entries.some(entry=>entry.id===id)?id:entries[0].id);
    else { list.replaceChildren(); lines.replaceChildren(); }
    root.querySelectorAll('[data-graph-count]').forEach(element=>element.textContent=`${entries.length} entrées dans la sélection`);
    if (!frame) frame=requestAnimationFrame(draw);
  }
  list.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
    const index=entries.findIndex(entry=>entry.id===document.activeElement?.dataset.catalogGraphId);
    if(index<0)return;
    event.preventDefault();
    const delta=event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:event.key==='ArrowUp'?-columns:columns;
    buttons.get(entries[(index+delta+entries.length)%entries.length].id)?.focus();
  });
  root.addEventListener('pointerleave',()=>{if(!root.contains(document.activeElement))showDetails(selected);});
  window.addEventListener('resize',()=>update(entries,selected),{passive:true});
  new ResizeObserver(()=>{if(!frame)frame=requestAnimationFrame(draw);}).observe(field);
  return { update };
}
