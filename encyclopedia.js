import { details, media, collectDatedEntries, searchEntries } from './encyclopedia-records.20261013b.js';
import { initComposition } from './composition-engine.20261013a.js';

import { buildCatalog, records, filterEntries, collectCatalogDates, mediaForEntries, groupLocations, families, practices, materials, styles, periods, places } from './encyclopedia-catalog.20261013a.js';
import { worldMapMarkup, comparisonMarkup, initCatalogGraph } from './encyclopedia-spatial.20261013a.js';

const workspace = document.querySelector('[data-premium-encyclopedia]');
if (workspace) {
  const entries = buildCatalog(window.VESTIGES_EXPLORATION_ITEMS || []);
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  const panels = [...workspace.querySelectorAll('[data-view-panel]')];
  const tabs = [...workspace.querySelectorAll('[data-view-button]')];
  const query = workspace.querySelector('[data-knowledge-query]');
  const results = workspace.querySelector('[data-knowledge-results]');
  const announcement = workspace.querySelector('[data-atlas-status]');
  const board = workspace.querySelector('[data-mosaic-board]');
  const dated = collectCatalogDates(entries);
  const alias = { texte: 'editorial', grille: 'grid', frise: 'timeline', graphe: 'graph', monde: 'world', comparer: 'compare', composition: 'mosaic' };
  const hashes = Object.fromEntries(Object.entries(alias).map(([hash, mode]) => [mode, hash]));
  const state = { entry: 'gravure', pinned: 'gravure', view: 'editorial', scope: 'all', order: 'asc', image: 0, filters: { query: '', family: '', practice: '', material: '', style: '', period: '', country: '' }, compare: ['gravure','ceramique'], worldZoom: 1, revision: 0 };
  let visibleEntries = entries;
  let graph;
  const labels = { families, practices, materials, styles };
  const facetOptions = { family: families, practice: practices, material: materials, style: styles, period: periods, country: places };
  const filterParams = { family: 'nature', practice: 'pratique', material: 'matiere', style: 'style', period: 'periode', country: 'lieu', query: 'q' };
  const familyLabel = entry => families.find(([id]) => id === entry.family)?.[1] || entry.type;
  const visibleMedia = () => mediaForEntries(media, visibleEntries);
  const mediaEntry = image => visibleEntries.find(entry => entry.id === ({ iznik:'plat-iznik', wave:'vague-kanagawa', kosode:'livre-kosode' }[image.id] || image.entryId)) || visibleEntries.find(entry => mediaForEntries([image], [entry]).length);
  const widgetNames = { notice: 'Notice', media: 'Médias', relations: 'Relations', dates: 'Repères datés', sources: 'Sources', status: 'État de connaissance', volume: 'Modèle 3D associé', world: 'Lieux & carte', compare: 'Comparaison' };
  const defaults = ['notice', 'media', 'relations', 'dates', 'sources', 'status', 'world'];
  let composition;
  let layout = [...defaults];
  let imageOpener;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const normalize = value => value.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const record = () => records[state.entry] || {};
  const related = () => (byId.get(state.entry)?.relatedIds || []).map(id => byId.get(id)).filter(entry => entry && visibleEntries.some(item => item.id === entry.id));
  const entryMedia = () => mediaForEntries(media, [byId.get(state.entry)]);
  const sourceMarkup = sources => sources?.length ? sources.map(source => `<a class="source-reference" href="${escape(source.url)}"><span>${escape(source.institution || 'Source de collection')}</span><strong>${escape(source.label)}</strong><span aria-hidden="true">↗</span></a>`).join('') : '<p class="empty-detail">Aucune source propre à cette entrée n’est encore rattachée à l’exemple. Une source pourra être proposée et examinée.</p>';
  const relatedMarkup = () => related().map(entry => `<button type="button" data-subject-link="${escape(entry.id)}"><span>${escape(entry.title)}</span><small>${escape(entry.type)} ↗</small></button>`).join('');
  const ownDates = () => dated.filter(date => date.linkedEntryIds.includes(state.entry));

  function updateURL() {
    const url = new URL(location.href);
    url.searchParams.set('entree', state.pinned);
    url.hash = hashes[state.view];
    for (const [key, param] of Object.entries(filterParams)) { if (state.filters[key]) url.searchParams.set(param, state.filters[key]); else url.searchParams.delete(param); }
    if (state.view === 'compare' && state.compare.length) url.searchParams.set('comparer', state.compare.join(',')); else url.searchParams.delete('comparer');
    history.replaceState(null, '', url);
  }
  function closeResults() {
    results.hidden = true;
    query.setAttribute('aria-expanded', 'false');
  }
  function selectEntry(id, announce = true) {
    if (!byId.has(id) || !visibleEntries.some(entry => entry.id === id)) return;
    state.pinned = id;
    state.compare = [id, ...state.compare.filter(key => key !== id)].slice(0,3);
    closeResults();
    query.value = state.filters.query;
    window.dispatchEvent(new CustomEvent('vestiges:select-subject', { detail: { id } }));
    renderEntry(id);
    updateURL();
    if (announce) announcement.textContent = `Entrée sélectionnée : ${byId.get(id).title}.`;
  }
  function revealResults() {
    const target=visibleEntries.length?panels.find(panel=>panel.dataset.viewPanel===state.view):workspace.querySelector('[data-catalog-empty]');
    if(!target || target.hidden)return;
    const offset=(document.querySelector('.site-header')?.getBoundingClientRect().height||0)+workspace.querySelector('.workspace-controls').getBoundingClientRect().height+12;
    window.scrollTo({top:Math.max(0,target.getBoundingClientRect().top+window.scrollY-offset),behavior:'auto'});
  }
  function showView(view, syncURL = true) {
    if (!tabs.some(tab => tab.dataset.viewButton === view)) return;
    if (state.entry !== state.pinned) selectEntry(state.pinned, false);
    state.view = view;
    for (const tab of tabs) {
      const active = tab.dataset.viewButton === view;
      tab.setAttribute('aria-selected', String(active));
      tab.setAttribute('aria-pressed', String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    for (const panel of panels) panel.hidden = panel.dataset.viewPanel !== view || !visibleEntries.length;
    workspace.dataset.activeView = view;
    closeResults();
    if (view === 'graph') requestAnimationFrame(() => graph.update(visibleEntries, state.pinned));
    if (view === 'world') renderWorld();
    if (view === 'compare') renderComparison();
    if (view === 'mosaic') composition.refresh();
    if (syncURL) {updateURL();revealResults();}
    announcement.textContent = `Mode ${tabs.find(tab => tab.dataset.viewButton === view).textContent}. ${visibleEntries.length ? 'Entrée : '+byId.get(state.pinned).title : 'Aucun résultat dans la sélection'}.`;
  }

  function renderArticle() {
    const entry = byId.get(state.entry);
    const content = record();
    const picture = entryMedia()[0];
    const figure = picture ? `<figure><button class="article-image" type="button" data-open-media="${escape(picture.id)}" aria-label="Agrandir : ${escape(picture.alt)}"><img src="${picture.type === 'video' ? picture.poster : picture.src}" alt="${escape(picture.alt)}" width="1200" height="1000"></button><figcaption>${escape(picture.kind)} · ouvrir pour la notice et les crédits</figcaption></figure>` : `<div class="article-typographic-plate" aria-hidden="true"><span>${escape(entry.title.slice(0, 1))}</span><small>${escape(content.kicker)}</small></div>`;
    workspace.querySelector('[data-editorial-article]').innerHTML = `<div class="article-cover"><div class="article-cover-copy"><p class="section-index">${escape(entry.type)} · ${['work','person'].includes(entry.family)?'référence de collection':entry.family==='article'?'proposition éditoriale':'exemple éditorial'}</p><h2>${escape(entry.title)}</h2><p class="article-deck">${escape(entry.shortDescription)}</p><p class="article-reference-count">${content.sources?.length || 0} source${content.sources?.length === 1 ? '' : 's'} liée${content.sources?.length === 1 ? '' : 's'} · ${ownDates().length} repère daté</p></div>${figure}</div><div class="article-reading"><div class="article-body"><p class="article-kicker">${escape(content.kicker)}</p>${(content.body || []).map((paragraph, index) => `<p class="${index === 0 ? 'article-first-paragraph' : ''}">${escape(paragraph)}</p>`).join('')}<section class="article-observations"><h3>Trois façons de regarder</h3><ol>${(content.questions || []).map(question => `<li>${escape(question)}</li>`).join('')}</ol></section><p class="prototype-note">Cette fiche est une proposition éditoriale de démonstration. Les objets cités sont identifiés par leur notice ; aucun dossier d’artisan n’est encore publié.</p></div><aside class="article-side"><section><h3>À mettre en relation</h3><div class="article-relations">${relatedMarkup()}</div><button class="text-button" type="button" data-view-button-proxy="graph">Voir sur la carte ↗</button></section><section><h3>Sources &amp; repères</h3>${sourceMarkup(content.sources)}</section><section><h3>Approfondir</h3><p>Réunissez ces informations dans votre propre composition.</p><button class="text-button" type="button" data-view-button-proxy="mosaic">Composer cette entrée ↗</button></section></aside></div>`;
  }

  function renderEntry(id, force = false) {
    if (!byId.has(id) || !visibleEntries.some(entry => entry.id === id) || (!force && state.entry === id && renderedCompositionEntry === id)) return;
    state.entry = id;
    workspace.querySelector('[data-active-subject]').textContent = byId.get(id).title;
    workspace.querySelector('[data-context-subject]').textContent = byId.get(id).title;
    renderArticle();
    renderTimeline();
    renderComposition(false);
    renderWorld();
    renderComparison();
    graph?.update(visibleEntries, id);
    workspace.querySelectorAll('[data-open-media]').forEach(button => button.classList.toggle('is-contextual', media.find(image => image.id === button.dataset.openMedia)?.entryId === id));
  }

  function renderGrid() {
    const pool = visibleMedia();
    const images = pool.filter(item => item.type !== 'video').length;
    const videos = pool.length - images;
    workspace.querySelector('[data-media-count]').textContent = `${images} images${videos ? ` · ${videos} vidéos` : ''} · collection, matières et démonstration`;
    workspace.querySelector('[data-media-grid]').innerHTML = pool.length ? pool.map((image, index) => `<button type="button" class="atlas-media-tile media-format--${index % 3}" data-open-media="${image.id}" aria-label="Ouvrir ${escape(image.title)} — ${escape(image.kind)}"><img src="${image.type === 'video' ? image.poster : image.src}" alt="${escape(image.alt)}" width="1200" height="1000" loading="lazy"><span class="media-open-mark" aria-hidden="true">${image.type === 'video' ? '▷' : '↗'}</span></button>`).join('') : '<p class="media-empty">Aucun média n’est rattaché aux entrées de cette sélection.</p>';
  }
  const dialog = workspace.querySelector('[data-media-dialog]');
  function showImage(id, opener) {
    const index = media.findIndex(image => image.id === id);
    if (index < 0) return;
    state.image = index;
    if (opener) imageOpener = opener;
    const image = media[index];
    const img = dialog.querySelector('[data-media-full]');
    const video = dialog.querySelector('[data-media-video]');
    video.pause();
    video.hidden = image.type !== 'video';
    img.hidden = image.type === 'video';
    if (image.type === 'video') { video.src = image.src; video.poster = image.poster || ''; }
    else { video.removeAttribute('src'); img.src = image.src; img.alt = image.alt; }
    for (const key of ['title', 'caption', 'credit', 'kind']) dialog.querySelector(`[data-media-${key}]`).textContent = image[key];
    dialog.querySelector('[data-media-position]').textContent = `${String(visibleMedia().findIndex(item => item.id === image.id) + 1).padStart(2, '0')} / ${String(visibleMedia().length).padStart(2, '0')}`;
    const source = dialog.querySelector('[data-media-source]');
    source.hidden = !image.source;
    if (image.source) source.href = image.source; else source.removeAttribute('href');
    dialog.querySelector('[data-media-entry]').textContent = `Lire : ${mediaEntry(image)?.title || 'Entrée associée'}`;
    if (!dialog.open) dialog.showModal();
  }
  function closeImage() { dialog.querySelector('[data-media-video]').pause(); dialog.close(); if (imageOpener?.isConnected) imageOpener.focus({ preventScroll: true }); }
  dialog.querySelector('[data-media-close]').addEventListener('click', closeImage);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeImage(); });
  const navigateImage = direction => { const pool = visibleMedia(); const index = pool.findIndex(image => image.id === media[state.image].id); if (pool.length) showImage(pool[(index + direction + pool.length) % pool.length].id); };
  dialog.querySelector('[data-media-prev]').addEventListener('click', () => navigateImage(-1));
  dialog.querySelector('[data-media-next]').addEventListener('click', () => navigateImage(1));
  dialog.addEventListener('keydown', event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); navigateImage(event.key === 'ArrowLeft' ? -1 : 1); } });
  dialog.querySelector('[data-media-entry]').addEventListener('click', () => { const id = mediaEntry(media[state.image])?.id; dialog.querySelector('[data-media-video]').pause(); dialog.close(); selectEntry(id); showView('editorial'); panels[0].focus({ preventScroll: true }); workspace.scrollIntoView({ behavior: 'auto' }); });

  function renderTimeline() {
    const ids = new Set([state.entry, ...related().map(entry => entry.id)]);
    const filteredIds = new Set(visibleEntries.map(entry => entry.id));
    let visible = dated.filter(date => date.linkedEntryIds.some(id => filteredIds.has(id)) && (state.scope === 'all' || date.linkedEntryIds.some(id => ids.has(id))))
      .map(date => { const entryId = filteredIds.has(date.entryId) ? date.entryId : date.linkedEntryIds.find(id => filteredIds.has(id)); return { ...date, entryId, entryTitle: byId.get(entryId).title }; });
    if (state.order === 'desc') visible = [...visible].reverse();
    workspace.querySelector('[data-time-count]').textContent = `${visible.length} repère${visible.length === 1 ? '' : 's'} daté${visible.length === 1 ? '' : 's'}`;
    workspace.querySelector('[data-time-empty]').hidden = visible.length > 0;
    workspace.querySelector('[data-time-list]').innerHTML = visible.map(date => `<li class="timeline-entry${date.entryId === state.entry ? ' is-current' : ''}"><div class="timeline-date"><span>${escape(date.label)}</span><small>${escape(date.precision)}</small></div><article><p class="section-index">${escape(date.entryTitle)} · ${escape(date.place)}</p><h3>${escape(date.title)}</h3><p>${escape(date.description)}</p><div class="timeline-actions"><button type="button" data-subject-link="${date.entryId}">Choisir ${escape(date.entryTitle)} ↗</button><a href="${escape(date.source.url)}">${escape(date.source.label)} ↗</a></div></article></li>`).join('');
    const overview = workspace.querySelector('[data-time-overview]');
    if (visible.length) {
      const first = Math.min(...visible.map(date => date.start));
      const last = Math.max(...visible.map(date => date.end));
      const span = Math.max(1, last - first);
      overview.innerHTML = `<svg viewBox="0 0 1000 70" preserveAspectRatio="none" aria-hidden="true"><path d="M18 35H982" class="time-axis"/>${visible.map(date => { const x = 18 + (date.start - first) / span * 964; const end = 18 + (date.end - first) / span * 964; return `<path d="M${x} 35H${Math.max(x + 3, end)}" class="time-range"/><circle cx="${x}" cy="35" r="4"/>`; }).join('')}</svg><div class="time-boundaries"><span>${first}</span><span>${last}</span></div>`;
    } else overview.replaceChildren();
    const datedIds = new Set(dated.flatMap(date => date.linkedEntryIds));
    const undated = visibleEntries.filter(entry => !datedIds.has(entry.id));
    workspace.querySelector('[data-undated-count]').textContent = `${undated.length} entrées sans repère daté`;
    workspace.querySelector('[data-undated-list]').innerHTML = undated.map(entry => `<button type="button" data-subject-link="${entry.id}">${escape(entry.title)} <span>↗</span></button>`).join('');
  }

  function widgetContent(key) {
    const entry = byId.get(state.entry);
    const content = record();
    if (key === 'notice') return `<p class="section-index">${escape(entry.type)} · exemple</p><h3>${escape(entry.title)}</h3><p class="widget-lead">${escape(entry.shortDescription)}</p><p class="widget-detail">${escape(content.body?.[0])}</p>`;
    if (key === 'media') return entryMedia().length ? `<div class="widget-media">${entryMedia().map(image => `<button type="button" data-open-media="${image.id}" aria-label="Agrandir : ${escape(image.title)}"><img src="${image.type === 'video' ? image.poster : image.src}" alt="${escape(image.alt)}" loading="lazy"></button>`).join('')}</div><p class="widget-note">Ouvrir une image pour sa notice et ses crédits.</p>` : '<h3>Un regard à documenter.</h3><p>Aucun média n’est encore rattaché à cette entrée. La grille générale reste accessible.</p><button type="button" class="text-button" data-view-button-proxy="grid">Parcourir les médias ↗</button>';
    if (key === 'relations') return `<h3>${related().length} pistes à suivre.</h3><div class="widget-relations">${relatedMarkup()}</div><p class="widget-detail">Ces liens illustrent un parcours de lecture ; ils ne constituent pas un graphe historique vérifié.</p>`;
    if (key === 'dates') return ownDates().length ? ownDates().map(date => `<strong class="widget-date">${escape(date.label)}</strong><h3>${escape(date.title)}</h3><p>${escape(date.precision)}</p><p class="widget-detail">${escape(date.description)}</p><a href="${escape(date.source.url)}">${escape(date.source.label)} ↗</a>`).join('') : '<h3>Le temps reste ouvert.</h3><p>Aucun repère daté n’est renseigné pour cette entrée. L’absence de date reste visible.</p><button type="button" class="text-button" data-view-button-proxy="timeline">Voir la frise ↗</button>';
    if (key === 'sources') return `<h3>${content.sources?.length || 0} source${content.sources?.length === 1 ? '' : 's'} rattachée${content.sources?.length === 1 ? '' : 's'}.</h3>${sourceMarkup(content.sources)}<p class="widget-detail">Les références portent sur les documents cités. Elles ne vérifient pas l’ensemble de la fiche.</p>`;
    if (key === 'status') return `<h3>Ce que cette fiche donne à lire.</h3><dl class="widget-status"><div><dt>Entrée</dt><dd>${['work','person'].includes(entry.family)?'Référence de collection':'Exemple éditorial'}</dd></div><div><dt>Sources associées</dt><dd>${content.sources?.length ? 'Notices consultables' : 'À documenter'}</dd></div><div><dt>Datation</dt><dd>${ownDates().length ? 'Repère associé sourcé' : 'Non renseignée'}</dd></div><div><dt>Dossier d’artisan</dt><dd>Pas encore publié</dd></div></dl><p class="widget-detail">Une information absente n’est pas remplacée par une estimation. Les médias disposent de leur propre notice.</p>`;
    if (key === 'world') return worldMapMarkup(groupLocations([entry]), { compact: true, selected: state.pinned }) + (entry.locations.length ? `<p class="widget-note">${escape(entry.locations.map(place => `${place.label} · ${place.status}`).join(' / '))}</p>` : '<p class="widget-note">Aucun lieu n’est renseigné pour cette entrée.</p>') + '<button type="button" class="text-button" data-view-button-proxy="world">Explorer le monde ↗</button>';
    if (key === 'compare') { const partner = visibleEntries.find(item => item.id === state.compare[1] && item.id !== entry.id) || visibleEntries.find(item => item.id !== entry.id); return `<label class="widget-compare-choice">Comparer avec <select data-widget-compare>${visibleEntries.filter(item => item.id !== entry.id).map(item => `<option value="${item.id}" ${item.id === partner?.id ? 'selected' : ''}>${escape(item.title)}</option>`).join('')}</select></label>${comparisonMarkup(partner ? [entry, partner] : [entry], records, labels)}`; }
    if (key === 'volume') return '<h3>Bois flotté 01</h3><p class="widget-note">Objet associé à l’entrée Bois · démonstration, origine et mesures à vérifier.</p><div class="specimen-3d-stage" data-specimen-3d data-mosaic-no-drag data-model-src="/assets/works/bois-flotte-01/bois-flotte-01-8k.glb" aria-label="Modèle de démonstration Bois flotté 01"><span class="specimen-3d-loading" role="status" aria-live="polite">Le modèle s’affiche après votre demande.</span><button class="button specimen-3d-load" type="button" data-load-specimen>Afficher le modèle 3D</button></div><details><summary>Voir la taille du fichier</summary><p>Environ 71 Mo.</p></details>';
    return '';
  }
  let renderedCompositionEntry;
  let renderedCompositionRevision;
  function renderComposition(rebuild = false) {
    if (state.entry !== 'bois') layout = layout.filter(key => key !== 'volume');
    const oldWidgets = new Map([...board.querySelectorAll('[data-widget]')].map(widget => [widget.dataset.widgetKey, widget]));
    for (const key of layout) {
      const old = oldWidgets.get(key);
      const widget = !rebuild && old ? old : document.createElement('article');
      if (rebuild && old) old.querySelector("[data-specimen-3d]")?.dispatchEvent(new Event("vestiges:dispose-viewer"));
      if (!old || rebuild) {
        widget.className = `mosaic-widget atlas-widget atlas-widget--${key}`;
        widget.dataset.widget = '';
        widget.dataset.widgetKey = key;
        widget.dataset.cols = key === 'volume' ? '48' : '24';
        widget.dataset.rows = key === 'volume' ? '36' : '24';
        widget.innerHTML = `<div class="widget-top"><span>${widgetNames[key]}</span><button type="button" class="widget-remove" data-remove-widget="${key}" aria-label="Retirer le widget ${widgetNames[key]}">×</button></div><div class="widget-content" tabindex="0" role="group" aria-label="Contenu du widget ${widgetNames[key]}">${widgetContent(key)}</div>`;
      } else if (renderedCompositionEntry !== state.entry || (renderedCompositionRevision !== state.revision && key !== "volume")) {
        widget.querySelector('[data-specimen-3d]')?.dispatchEvent(new Event('vestiges:dispose-viewer'));
        widget.querySelector('.widget-content').innerHTML = widgetContent(key);
      }
      board.append(widget);
    }
    for (const [key, widget] of oldWidgets) if (!layout.includes(key) || rebuild) { widget.querySelector("[data-specimen-3d]")?.dispatchEvent(new Event("vestiges:dispose-viewer")); widget.remove(); }
    board.querySelectorAll('[data-mosaic-row]').forEach(row => { if (!row.querySelector('[data-widget]')) row.remove(); });
    renderedCompositionEntry = state.entry;
    renderedCompositionRevision = state.revision;
    if (composition) composition.refresh();
    if (!layout.length) board.innerHTML = '<p class="composition-empty">Votre espace est libre. Choisissez un widget dans la bibliothèque pour commencer.</p>';
    workspace.querySelector('[data-widget-count]').textContent = `(${layout.length})`;
    workspace.querySelector('[data-widget-library]').innerHTML = Object.entries(widgetNames).map(([key, name]) => `<label><input type="checkbox" data-widget-toggle="${key}" ${layout.includes(key) ? 'checked' : ''} ${key === 'volume' && state.entry !== 'bois' ? 'disabled' : ''}><span>${name}</span>${key === 'volume' ? '<small>Disponible pour Bois</small>' : ''}</label>`).join('');
  }


  function renderGroupedResults() {
    workspace.querySelector('[data-result-total]').textContent = `(${visibleEntries.length})`;
    workspace.querySelector('[data-grouped-results]').innerHTML = families.map(([id, label]) => {
      const group = visibleEntries.filter(entry => entry.family === id);
      if (!group.length && id !== 'product') return '';
      return `<section class="result-family"><h2>${label} <span>${group.length}</span></h2>${group.length ? `<ul>${group.map(entry => `<li><button type="button" data-subject-link="${entry.id}" ${entry.id === state.pinned ? 'aria-current="true"' : ''}><strong>${escape(entry.title)}</strong><span>${escape(entry.type)}</span></button></li>`).join('')}</ul>` : '<p>Aucun produit en vente dans la sélection. La boutique se prépare.</p>'}</section>`;
    }).join('');
  }
  function applyFilters(syncURL = true) {
    visibleEntries = filterEntries(entries, state.filters);
    state.revision++;
    const active = Object.entries(state.filters).filter(([, value]) => value);
    workspace.querySelector('[data-active-filter-count]').textContent = active.length ? `(${active.length})` : '';
    workspace.querySelector('[data-filter-result-count]').textContent = `${visibleEntries.length} / ${entries.length} entrées`;
    workspace.querySelector('[data-catalog-count]').textContent = `${entries.length} entrées · références et exemples`;
    workspace.querySelector('[data-filter-chips]').innerHTML = active.map(([key, value]) => `<button type="button" data-clear-facet="${key}" aria-label="Retirer le filtre ${escape(facetOptions[key]?.find(([id]) => id === value)?.[1] || value)}">${escape(facetOptions[key]?.find(([id]) => id === value)?.[1] || value)} <span aria-hidden="true">×</span></button>`).join('');
    for (const select of workspace.querySelectorAll('[data-facet]')) {
      const key=select.dataset.facet;
      select.innerHTML='<option value="">Tout</option>'+facetOptions[key].map(([id,label])=>`<option value="${id}">${escape(label)} (${filterEntries(entries,{...state.filters,[key]:id}).length})</option>`).join('');
      select.value=state.filters[key];
    }
    workspace.querySelector('[data-catalog-empty]').hidden = visibleEntries.length > 0;
    workspace.querySelector('[data-empty-explanation]').textContent = state.filters.family === 'product' ? 'Aucun produit n’est encore en vente. Les œuvres citées sont des références de collection, distinctes des futurs produits.' : 'Aucune entrée ne correspond à cette combinaison. Retirez un filtre ou réinitialisez la sélection.';
    if (visibleEntries.length) {
      if (!visibleEntries.some(entry => entry.id === state.pinned)) state.pinned = visibleEntries[0].id;
      state.entry = state.pinned;
      state.compare = state.compare.filter(id => visibleEntries.some(entry => entry.id === id));
      if (!state.compare.length) state.compare.push(state.pinned);
      if (state.compare.length < 2 && visibleEntries.length > 1) state.compare.push((visibleEntries.find(entry => !state.compare.includes(entry.id) && entry.family===byId.get(state.pinned).family) || visibleEntries.find(entry=>!state.compare.includes(entry.id))).id);
      renderEntry(state.pinned, true);
    } else {
      workspace.querySelector('[data-active-subject]').textContent = 'Aucune entrée dans les résultats';
      graph?.update([], state.pinned);
    }
    renderGrid();
    renderGroupedResults();
    for (const panel of panels) panel.hidden = panel.dataset.viewPanel !== state.view || !visibleEntries.length;
    if (syncURL) {updateURL();revealResults();}
  }
  function renderWorld() {
    const groups = groupLocations(visibleEntries);
    workspace.querySelector('[data-world-canvas]').innerHTML = worldMapMarkup(groups, { zoom: state.worldZoom, selected: state.pinned });
    workspace.querySelector('[data-world-count]').textContent = `${groups.length} pays · ${visibleEntries.filter(entry => entry.locations.length).length} entrées liées`;
    workspace.querySelector('[data-world-locations]').innerHTML = groups.map(group => `<section class="location-group"><button type="button" data-country="${group.country}" class="country-select"><strong>${escape(group.label)}</strong><span>${group.entries.length} ↗</span></button>${group.locations.map(place => `<div class="location-reference" data-current="${place.entryId===state.pinned}"><button type="button" data-subject-link="${place.entryId}">${escape(place.entryTitle)}</button><span>${escape(place.role)}</span><small>${escape(place.status)} · ${escape(place.precision)}</small><a href="${escape(place.source.url)}">Consulter la source ↗</a></div>`).join('')}</section>`).join('') || '<p>Aucun lieu n’est renseigné pour les entrées de cette sélection.</p>';
    const unknown = visibleEntries.filter(entry => !entry.locations.length);
    workspace.querySelector('[data-world-unknown-count]').textContent = `${unknown.length} entrées sans lieu renseigné`;
    workspace.querySelector('[data-world-unknown-list]').innerHTML = unknown.map(entry => `<button type="button" data-subject-link="${entry.id}">${escape(entry.title)} ↗</button>`).join('');
  }
  function renderComparison() {
    state.compare = state.compare.filter(id => visibleEntries.some(entry => entry.id === id)).slice(0,3);
    if (state.compare.length < 2 && visibleEntries.length > 1) for (const entry of visibleEntries) { if (state.compare.length >= 2) break; if (!state.compare.includes(entry.id)) state.compare.push(entry.id); }
    workspace.querySelector('[data-comparison-controls]').innerHTML = [0,1,2].map(index => `<label>Entrée ${index+1}${index===2?' · facultative':''}<select data-compare-slot="${index}"><option value="">Choisir une entrée</option>${visibleEntries.map(entry=>`<option value="${entry.id}" ${state.compare[index]===entry.id?'selected':''} ${state.compare.some((id,slot)=>id===entry.id&&slot!==index)?'disabled':''}>${escape(entry.title)} — ${escape(familyLabel(entry))}</option>`).join('')}</select></label>`).join('');
    workspace.querySelector('[data-comparison-table]').innerHTML = comparisonMarkup(state.compare.map(id=>byId.get(id)),records,labels);
    workspace.querySelector('[data-comparison-table]').dataset.showDifferences = String(workspace.querySelector('[data-only-differences]').checked);
  }
  function selectCountry(country, returnFocus=false) { state.filters.country = country; state.worldZoom = 1; applyFilters(); if(returnFocus) { const scope=state.view==='mosaic'?board:workspace.querySelector('[data-world-canvas]');scope.querySelector(`[data-country="${country}"]`)?.focus({preventScroll:true}); } }
  for (const select of workspace.querySelectorAll('[data-facet]')) {
    const key=select.dataset.facet;
    select.innerHTML='<option value="">Tout</option>'+facetOptions[key].map(([id,label])=>`<option value="${id}">${escape(label)}${key==='family'?' ('+entries.filter(entry=>entry.family===id).length+')':''}</option>`).join('');
    select.addEventListener('change',()=>{state.filters[key]=select.value;applyFilters();});
  }
  const filterDisclosure = workspace.querySelector('[data-atlas-filters]');
  const wideFilters=matchMedia('(min-width: 961px)');
  filterDisclosure.open=wideFilters.matches;
  wideFilters.addEventListener('change',()=>{filterDisclosure.open=wideFilters.matches;});
  workspace.addEventListener('click', event => {
    const country = event.target.closest('[data-country]');
    if (country) { selectCountry(country.dataset.country, true); return; }
    const mapZoom = event.target.closest('[data-map-zoom], [data-map-reset]');
    if (mapZoom) {
      const map=mapZoom.closest('[data-world-map]');
      const compact=map.classList.contains('world-map--compact');
      const selector=mapZoom.hasAttribute('data-map-reset')?'[data-map-reset]':`[data-map-zoom="${mapZoom.dataset.mapZoom}"]`;
      const zoom=mapZoom.hasAttribute('data-map-reset')?1:Math.max(1,Math.min(4,Number(map.dataset.zoom)+Number(mapZoom.dataset.mapZoom)*.5));
      if (map.classList.contains('world-map--compact')) map.outerHTML=worldMapMarkup(groupLocations([byId.get(state.entry)]),{zoom,compact:true,selected:state.pinned});
      else {state.worldZoom=zoom;renderWorld();}
      (compact?board.querySelector('[data-widget-key=world]'):workspace.querySelector('[data-world-canvas]'))?.querySelector(selector)?.focus({preventScroll:true});
      return;
    }
    const clearFacet=event.target.closest('[data-clear-facet]');
    if(clearFacet){state.filters[clearFacet.dataset.clearFacet]='';if(clearFacet.dataset.clearFacet==='query')query.value='';applyFilters();(clearFacet.dataset.clearFacet==='query'?query:workspace.querySelector(`[data-facet="${clearFacet.dataset.clearFacet}"]`))?.focus({preventScroll:true});return;}
    if(event.target.closest('[data-clear-filters]')){for(const key of Object.keys(state.filters))state.filters[key]='';query.value='';applyFilters();workspace.querySelector('.filter-summary [data-clear-filters]').focus({preventScroll:true});return;}
    const opener = event.target.closest('[data-open-media]');
    if (opener) { showImage(opener.dataset.openMedia, opener); return; }
    const entryButton = event.target.closest('[data-subject-link]');
    if (entryButton) { const focusHost = entryButton.closest('[data-widget]') || entryButton.closest('[data-view-panel]') || query; selectEntry(entryButton.dataset.subjectLink); if(entryButton.hasAttribute('data-read-entry')){showView('editorial');panels.find(panel=>panel.dataset.viewPanel==='editorial').focus({preventScroll:true});return;} if (focusHost.isConnected) focusHost.focus({ preventScroll: true }); return; }
    const graphButton = event.target.closest('[data-exploration-id]');
    if (graphButton && byId.has(graphButton.dataset.explorationId)) { state.pinned = graphButton.dataset.explorationId; updateURL(); }
    const proxy = event.target.closest('[data-view-button-proxy]');
    if (proxy) { event.preventDefault(); showView(proxy.dataset.viewButtonProxy); }
    const density = event.target.closest('[data-grid-density]');
    if (density) { workspace.querySelector('[data-media-grid]').dataset.density = density.dataset.gridDensity; workspace.querySelectorAll('[data-grid-density]').forEach(button => button.setAttribute('aria-pressed', String(button === density))); }
    const scope = event.target.closest('[data-time-scope]');
    if (scope) { state.scope = scope.dataset.timeScope; workspace.querySelectorAll('[data-time-scope]').forEach(button => button.setAttribute('aria-pressed', String(button === scope))); renderTimeline(); }
    const remove = event.target.closest('[data-remove-widget]');
    if (remove) { layout = [...board.querySelectorAll('[data-widget]')].map(widget => widget.dataset.widgetKey).filter(key => key !== remove.dataset.removeWidget); renderComposition(); workspace.querySelector('.widget-library summary').focus(); composition.announce('Widget retiré. Vous pouvez le rétablir dans la bibliothèque.'); }
    const preset = event.target.closest('[data-composition-preset]');
    if (preset || event.target.closest('[data-composition-reset]')) { layout = preset?.dataset.compositionPreset === 'reading' ? ['notice', 'media', 'relations'] : preset?.dataset.compositionPreset === 'research' ? ['notice', 'dates', 'sources', 'status'] : [...defaults, ...(state.entry === 'bois' && preset ? ['volume'] : [])]; renderComposition(true); composition.announce('Composition réorganisée.'); }
    const load = event.target.closest('[data-load-specimen]');
    if (load) {
      load.disabled = true;
      import('./mosaic-specimen-viewer.20261013a.js').then(({ mountSpecimenVolume }) => mountSpecimenVolume(load.closest('[data-specimen-3d]'))).catch(() => { load.disabled = false; load.textContent = 'Réessayer l’affichage 3D'; });
    }
  });
  board.addEventListener('vestiges:composition-order', event => { layout = event.detail.order; });
  workspace.addEventListener('keydown', event=>{const pin=event.target.closest('.world-pin');if(pin&&['Enter',' '].includes(event.key)){event.preventDefault();selectCountry(pin.dataset.country, true);}});
  workspace.addEventListener('change', event => {
    const slot=event.target.closest('[data-compare-slot]');
    if(slot){const index=Number(slot.dataset.compareSlot);const values=[...workspace.querySelectorAll('[data-compare-slot]')].map(select=>select.value).filter(Boolean);state.compare=[...new Set(values)].slice(0,3);renderComparison();state.revision++;renderComposition();updateURL();workspace.querySelector(`[data-compare-slot="${index}"]`)?.focus();return;}
    const partner=event.target.closest('[data-widget-compare]');
    if(partner){state.compare=[state.pinned,partner.value].filter((id,index,array)=>array.indexOf(id)===index);renderComparison();state.revision++;renderComposition();workspace.querySelector('[data-widget-compare]')?.focus();return;}
    if(event.target.closest('[data-only-differences]')){renderComparison();return;}
    const toggle = event.target.closest('[data-widget-toggle]');
    if (!toggle) return;
    layout = [...board.querySelectorAll('[data-widget]')].map(widget => widget.dataset.widgetKey);
    layout = toggle.checked ? [...layout, toggle.dataset.widgetToggle] : layout.filter(key => key !== toggle.dataset.widgetToggle);
    renderComposition();
    workspace.querySelector(`[data-widget-toggle="${toggle.dataset.widgetToggle}"]`)?.focus();
    composition.announce(`${toggle.checked ? 'Widget ajouté' : 'Widget retiré'} : ${widgetNames[toggle.dataset.widgetToggle]}.`);
  });
  workspace.querySelector('[data-time-order]').addEventListener('change', event => { state.order = event.target.value; renderTimeline(); });
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showView(tab.dataset.viewButton));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();
      showView(tabs[next].dataset.viewButton);
    });
  });
  query.addEventListener('input', () => {
    const needle = normalize(query.value.trim());
    if (!needle) { closeResults(); return; }
    const matches = searchEntries(filterEntries(entries,{...state.filters,query:""}), query.value, records);
    results.innerHTML = matches.length ? matches.map(entry => `<li><button type="button" data-subject-link="${entry.id}"><span>${escape(entry.title)}</span><small>${escape(entry.type)}</small></button></li>`).join('') : '<li class="search-empty">Aucune entrée ne correspond. Essayez « bois », « textile » ou « gravure ».</li>';
    results.hidden = false;
    query.setAttribute('aria-expanded', 'true');
  });
  query.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeResults(); return; }
    const first = results.querySelector('button');
    if (event.key === 'ArrowDown' && first) { event.preventDefault(); first.focus(); }
    if (event.key === 'Enter') { event.preventDefault(); commitSearch(); }
  });
  results.addEventListener('keydown', event => {
    const matches = [...results.querySelectorAll('button')];
    const index = matches.indexOf(document.activeElement);
    if (event.key === 'Escape') { closeResults(); query.focus(); }
    if (['ArrowUp', 'ArrowDown'].includes(event.key) && index >= 0) { event.preventDefault(); if (event.key === 'ArrowUp' && index === 0) query.focus(); else matches[(index + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length].focus(); }
  });
  workspace.querySelector('[data-search-clear]').addEventListener('click', () => { query.value = ''; state.filters.query='';closeResults();applyFilters();query.focus(); });
  function commitSearch(){state.filters.query=query.value.trim().slice(0,120);const exact=filterEntries(entries,state.filters).find(entry=>normalize(entry.title)===normalize(state.filters.query));if(exact)state.pinned=exact.id;closeResults();applyFilters();}
  workspace.querySelector('[data-knowledge-search]').addEventListener('submit', event => {event.preventDefault();commitSearch();});
  const library = workspace.querySelector('.widget-library');
  library.addEventListener('keydown', event => { if (event.key === 'Escape' && library.open) { event.preventDefault(); library.open = false; library.querySelector('summary').focus(); } });
  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('[data-knowledge-search]')) closeResults();
    if (library.open && !library.contains(event.target)) library.open = false;
  });
  window.addEventListener('vestiges:subject-change', event => renderEntry(event.detail?.id));
  function restoreLocation() {
    const url = new URL(location.href);
    for (const [key,param] of Object.entries(filterParams)) { const value=url.searchParams.get(param)||'';state.filters[key]=key==='query'?value.slice(0,120):facetOptions[key].some(([id])=>id===value)?value:''; }
    const id=url.searchParams.get('entree');
    if(byId.has(id))state.pinned=id;
    query.value=state.filters.query;
    const comparison=(url.searchParams.get('comparer')||'').split(',').filter(id=>byId.has(id));
    if(comparison.length)state.compare=[...new Set(comparison)].slice(0,3);else state.compare=[state.pinned,...state.compare.filter(key=>key!==state.pinned)].slice(0,2);
    applyFilters(false);
    showView(alias[url.hash.slice(1)] || 'editorial', false);
  }
  graph=initCatalogGraph(workspace.querySelector('[data-exploration]'),id=>selectEntry(id));
  renderGrid();
  renderEntry(state.entry);
  composition = initComposition(workspace);
  restoreLocation();
  window.addEventListener('hashchange', restoreLocation);
  window.addEventListener('popstate', restoreLocation);
}
