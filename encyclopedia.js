import { details, media, collectDatedEntries, searchEntries } from './encyclopedia-records.20261013a.js';
import { initComposition } from './composition-engine.20261013a.js';

const workspace = document.querySelector('[data-premium-encyclopedia]');
if (workspace) {
  const entries = window.VESTIGES_EXPLORATION_ITEMS || [];
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  const panels = [...workspace.querySelectorAll('[data-view-panel]')];
  const tabs = [...workspace.querySelectorAll('[data-view-button]')];
  const query = workspace.querySelector('[data-knowledge-query]');
  const results = workspace.querySelector('[data-knowledge-results]');
  const announcement = workspace.querySelector('[data-atlas-status]');
  const board = workspace.querySelector('[data-mosaic-board]');
  const dated = collectDatedEntries(entries);
  const alias = { texte: 'editorial', grille: 'grid', frise: 'timeline', graphe: 'graph', composition: 'mosaic' };
  const hashes = Object.fromEntries(Object.entries(alias).map(([hash, mode]) => [mode, hash]));
  const state = { entry: 'gravure', pinned: 'gravure', view: 'editorial', scope: 'all', order: 'asc', image: 0 };
  const widgetNames = { notice: 'Notice', media: 'Médias', relations: 'Relations', dates: 'Repères datés', sources: 'Sources', status: 'État de connaissance', volume: 'Modèle 3D associé' };
  const defaults = ['notice', 'media', 'relations', 'dates', 'sources', 'status'];
  let composition;
  let layout = [...defaults];
  let imageOpener;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const normalize = value => value.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const record = () => details[state.entry] || {};
  const related = () => (byId.get(state.entry)?.relatedIds || []).map(id => byId.get(id)).filter(Boolean);
  const entryMedia = () => media.filter(image => image.entryId === state.entry);
  const sourceMarkup = sources => sources?.length ? sources.map(source => `<a class="source-reference" href="${escape(source.url)}"><span>${escape(source.institution || 'Source de collection')}</span><strong>${escape(source.label)}</strong><span aria-hidden="true">↗</span></a>`).join('') : '<p class="empty-detail">Aucune source propre à cette entrée n’est encore rattachée à l’exemple. Une source pourra être proposée et examinée.</p>';
  const relatedMarkup = () => related().map(entry => `<button type="button" data-subject-link="${escape(entry.id)}"><span>${escape(entry.title)}</span><small>${escape(entry.type)} ↗</small></button>`).join('');
  const ownDates = () => dated.filter(date => date.entryId === state.entry);

  function updateURL() {
    const url = new URL(location.href);
    url.searchParams.set('entree', state.pinned);
    url.hash = hashes[state.view];
    history.replaceState(null, '', url);
  }
  function closeResults() {
    results.hidden = true;
    query.setAttribute('aria-expanded', 'false');
  }
  function selectEntry(id, announce = true) {
    if (!byId.has(id)) return;
    state.pinned = id;
    closeResults();
    query.value = '';
    window.dispatchEvent(new CustomEvent('vestiges:select-subject', { detail: { id } }));
    renderEntry(id);
    updateURL();
    if (announce) announcement.textContent = `Entrée sélectionnée : ${byId.get(id).title}.`;
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
    for (const panel of panels) panel.hidden = panel.dataset.viewPanel !== view;
    workspace.dataset.activeView = view;
    closeResults();
    if (view === 'graph') requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    if (view === 'mosaic') composition.refresh();
    if (syncURL) updateURL();
    announcement.textContent = `Mode ${tabs.find(tab => tab.dataset.viewButton === view).textContent}. Entrée : ${byId.get(state.pinned).title}.`;
  }

  function renderArticle() {
    const entry = byId.get(state.entry);
    const content = record();
    const picture = entryMedia()[0];
    const figure = picture ? `<figure><button class="article-image" type="button" data-open-media="${escape(picture.id)}" aria-label="Agrandir : ${escape(picture.alt)}"><img src="${picture.src}" alt="${escape(picture.alt)}" width="1200" height="1000"></button><figcaption>${escape(picture.kind)} · ouvrir pour la notice et les crédits</figcaption></figure>` : `<div class="article-typographic-plate" aria-hidden="true"><span>${escape(entry.title.slice(0, 1))}</span><small>${escape(content.kicker)}</small></div>`;
    workspace.querySelector('[data-editorial-article]').innerHTML = `<div class="article-cover"><div class="article-cover-copy"><p class="section-index">${escape(entry.type)} · fiche de démonstration</p><h2>${escape(entry.title)}</h2><p class="article-deck">${escape(entry.shortDescription)}</p><p class="article-reference-count">${content.sources?.length || 0} source${content.sources?.length === 1 ? '' : 's'} liée${content.sources?.length === 1 ? '' : 's'} · ${ownDates().length} repère daté</p></div>${figure}</div><div class="article-reading"><div class="article-body"><p class="article-kicker">${escape(content.kicker)}</p>${(content.body || []).map((paragraph, index) => `<p class="${index === 0 ? 'article-first-paragraph' : ''}">${escape(paragraph)}</p>`).join('')}<section class="article-observations"><h3>Trois façons de regarder</h3><ol>${(content.questions || []).map(question => `<li>${escape(question)}</li>`).join('')}</ol></section><p class="prototype-note">Cette fiche est une proposition éditoriale de démonstration. Les objets cités sont identifiés par leur notice ; aucun dossier d’artisan n’est encore publié.</p></div><aside class="article-side"><section><h3>À mettre en relation</h3><div class="article-relations">${relatedMarkup()}</div><button class="text-button" type="button" data-view-button-proxy="graph">Voir sur la carte ↗</button></section><section><h3>Sources &amp; repères</h3>${sourceMarkup(content.sources)}</section><section><h3>Approfondir</h3><p>Réunissez ces informations dans votre propre composition.</p><button class="text-button" type="button" data-view-button-proxy="mosaic">Composer cette entrée ↗</button></section></aside></div>`;
  }

  function renderEntry(id) {
    if (!byId.has(id) || (state.entry === id && renderedCompositionEntry === id)) return;
    state.entry = id;
    workspace.querySelector('[data-active-subject]').textContent = byId.get(id).title;
    workspace.querySelector('[data-context-subject]').textContent = byId.get(id).title;
    renderArticle();
    renderTimeline();
    renderComposition(false);
    workspace.querySelectorAll('[data-open-media]').forEach(button => button.classList.toggle('is-contextual', media.find(image => image.id === button.dataset.openMedia)?.entryId === id));
  }

  function renderGrid() {
    const images = media.filter(item => item.type !== 'video').length;
    const videos = media.length - images;
    workspace.querySelector('[data-media-count]').textContent = `${images} images${videos ? ` · ${videos} vidéos` : ''} · collection, matières et démonstration`;
    workspace.querySelector('[data-media-grid]').innerHTML = media.map((image, index) => `<button type="button" class="atlas-media-tile media-format--${index % 3}" data-open-media="${image.id}" aria-label="Ouvrir ${escape(image.title)} — ${escape(image.kind)}"><img src="${image.type === 'video' ? image.poster : image.src}" alt="${escape(image.alt)}" width="1200" height="1000" loading="lazy"><span class="media-open-mark" aria-hidden="true">${image.type === 'video' ? '▷' : '↗'}</span></button>`).join('');
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
    dialog.querySelector('[data-media-position]').textContent = `${String(index + 1).padStart(2, '0')} / ${String(media.length).padStart(2, '0')}`;
    const source = dialog.querySelector('[data-media-source]');
    source.hidden = !image.source;
    if (image.source) source.href = image.source; else source.removeAttribute('href');
    dialog.querySelector('[data-media-entry]').textContent = `Lire : ${byId.get(image.entryId).title}`;
    if (!dialog.open) dialog.showModal();
  }
  function closeImage() { dialog.querySelector('[data-media-video]').pause(); dialog.close(); if (imageOpener?.isConnected) imageOpener.focus({ preventScroll: true }); }
  dialog.querySelector('[data-media-close]').addEventListener('click', closeImage);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeImage(); });
  const navigateImage = direction => showImage(media[(state.image + direction + media.length) % media.length].id);
  dialog.querySelector('[data-media-prev]').addEventListener('click', () => navigateImage(-1));
  dialog.querySelector('[data-media-next]').addEventListener('click', () => navigateImage(1));
  dialog.addEventListener('keydown', event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); navigateImage(event.key === 'ArrowLeft' ? -1 : 1); } });
  dialog.querySelector('[data-media-entry]').addEventListener('click', () => { const id = media[state.image].entryId; dialog.querySelector('[data-media-video]').pause(); dialog.close(); selectEntry(id); showView('editorial'); panels[0].focus({ preventScroll: true }); workspace.scrollIntoView({ behavior: 'auto' }); });

  function renderTimeline() {
    const ids = new Set([state.entry, ...related().map(entry => entry.id)]);
    let visible = dated.filter(date => state.scope === 'all' || ids.has(date.entryId));
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
    const datedIds = new Set(dated.map(date => date.entryId));
    const undated = entries.filter(entry => !datedIds.has(entry.id));
    workspace.querySelector('[data-undated-count]').textContent = `${undated.length} entrées sans repère daté`;
    workspace.querySelector('[data-undated-list]').innerHTML = undated.map(entry => `<button type="button" data-subject-link="${entry.id}">${escape(entry.title)} <span>↗</span></button>`).join('');
  }

  function widgetContent(key) {
    const entry = byId.get(state.entry);
    const content = record();
    if (key === 'notice') return `<p class="section-index">${escape(entry.type)} · exemple</p><h3>${escape(entry.title)}</h3><p class="widget-lead">${escape(entry.shortDescription)}</p><p class="widget-detail">${escape(content.body?.[0])}</p>`;
    if (key === 'media') return entryMedia().length ? `<div class="widget-media">${entryMedia().map(image => `<button type="button" data-open-media="${image.id}" aria-label="Agrandir : ${escape(image.title)}"><img src="${image.src}" alt="${escape(image.alt)}" loading="lazy"></button>`).join('')}</div><p class="widget-note">Ouvrir une image pour sa notice et ses crédits.</p>` : '<h3>Un regard à documenter.</h3><p>Aucun média n’est encore rattaché à cette entrée. La grille générale reste accessible.</p><button type="button" class="text-button" data-view-button-proxy="grid">Parcourir les médias ↗</button>';
    if (key === 'relations') return `<h3>${related().length} pistes à suivre.</h3><div class="widget-relations">${relatedMarkup()}</div><p class="widget-detail">Ces liens illustrent un parcours de lecture ; ils ne constituent pas un graphe historique vérifié.</p>`;
    if (key === 'dates') return ownDates().length ? ownDates().map(date => `<strong class="widget-date">${escape(date.label)}</strong><h3>${escape(date.title)}</h3><p>${escape(date.precision)}</p><p class="widget-detail">${escape(date.description)}</p><a href="${escape(date.source.url)}">${escape(date.source.label)} ↗</a>`).join('') : '<h3>Le temps reste ouvert.</h3><p>Aucun repère daté n’est renseigné pour cette entrée. L’absence de date reste visible.</p><button type="button" class="text-button" data-view-button-proxy="timeline">Voir la frise ↗</button>';
    if (key === 'sources') return `<h3>${content.sources?.length || 0} source${content.sources?.length === 1 ? '' : 's'} rattachée${content.sources?.length === 1 ? '' : 's'}.</h3>${sourceMarkup(content.sources)}<p class="widget-detail">Les références portent sur les documents cités. Elles ne vérifient pas l’ensemble de la fiche.</p>`;
    if (key === 'status') return `<h3>Ce que cette fiche donne à lire.</h3><dl class="widget-status"><div><dt>Entrée</dt><dd>Exemple éditorial</dd></div><div><dt>Sources associées</dt><dd>${content.sources?.length ? 'Notices consultables' : 'À documenter'}</dd></div><div><dt>Datation</dt><dd>${ownDates().length ? 'Repère associé sourcé' : 'Non renseignée'}</dd></div><div><dt>Dossier d’artisan</dt><dd>Pas encore publié</dd></div></dl><p class="widget-detail">Une information absente n’est pas remplacée par une estimation. Les médias disposent de leur propre notice.</p>`;
    if (key === 'volume') return '<h3>Bois flotté 01</h3><p class="widget-note">Objet associé à l’entrée Bois · démonstration, origine et mesures à vérifier.</p><div class="specimen-3d-stage" data-specimen-3d data-mosaic-no-drag data-model-src="/assets/works/bois-flotte-01/bois-flotte-01-8k.glb" aria-label="Modèle de démonstration Bois flotté 01"><span class="specimen-3d-loading" role="status" aria-live="polite">Le modèle s’affiche après votre demande.</span><button class="button specimen-3d-load" type="button" data-load-specimen>Afficher le modèle 3D</button></div><details><summary>Voir la taille du fichier</summary><p>Environ 71 Mo.</p></details>';
    return '';
  }
  let renderedCompositionEntry;
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
      } else if (renderedCompositionEntry !== state.entry) {
        widget.querySelector('[data-specimen-3d]')?.dispatchEvent(new Event('vestiges:dispose-viewer'));
        widget.querySelector('.widget-content').innerHTML = widgetContent(key);
      }
      board.append(widget);
    }
    for (const [key, widget] of oldWidgets) if (!layout.includes(key) || rebuild) { widget.querySelector("[data-specimen-3d]")?.dispatchEvent(new Event("vestiges:dispose-viewer")); widget.remove(); }
    board.querySelectorAll('[data-mosaic-row]').forEach(row => { if (!row.querySelector('[data-widget]')) row.remove(); });
    renderedCompositionEntry = state.entry;
    if (composition) composition.refresh();
    if (!layout.length) board.innerHTML = '<p class="composition-empty">Votre espace est libre. Choisissez un widget dans la bibliothèque pour commencer.</p>';
    workspace.querySelector('[data-widget-count]').textContent = `(${layout.length})`;
    workspace.querySelector('[data-widget-library]').innerHTML = Object.entries(widgetNames).map(([key, name]) => `<label><input type="checkbox" data-widget-toggle="${key}" ${layout.includes(key) ? 'checked' : ''} ${key === 'volume' && state.entry !== 'bois' ? 'disabled' : ''}><span>${name}</span>${key === 'volume' ? '<small>Disponible pour Bois</small>' : ''}</label>`).join('');
  }

  workspace.addEventListener('click', event => {
    const opener = event.target.closest('[data-open-media]');
    if (opener) { showImage(opener.dataset.openMedia, opener); return; }
    const entryButton = event.target.closest('[data-subject-link]');
    if (entryButton) { const focusHost = entryButton.closest('[data-widget]') || entryButton.closest('[data-view-panel]') || query; selectEntry(entryButton.dataset.subjectLink); if (focusHost.isConnected) focusHost.focus({ preventScroll: true }); return; }
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
  workspace.addEventListener('change', event => {
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
    const matches = searchEntries(entries, query.value);
    results.innerHTML = matches.length ? matches.map(entry => `<li><button type="button" data-subject-link="${entry.id}"><span>${escape(entry.title)}</span><small>${escape(entry.type)}</small></button></li>`).join('') : '<li class="search-empty">Aucune entrée ne correspond. Essayez « bois », « textile » ou « gravure ».</li>';
    results.hidden = false;
    query.setAttribute('aria-expanded', 'true');
  });
  query.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeResults(); return; }
    const first = results.querySelector('button');
    if (event.key === 'ArrowDown' && first) { event.preventDefault(); first.focus(); }
    if (event.key === 'Enter' && first && !results.hidden) { event.preventDefault(); selectEntry(first.dataset.subjectLink); }
  });
  results.addEventListener('keydown', event => {
    const matches = [...results.querySelectorAll('button')];
    const index = matches.indexOf(document.activeElement);
    if (event.key === 'Escape') { closeResults(); query.focus(); }
    if (['ArrowUp', 'ArrowDown'].includes(event.key) && index >= 0) { event.preventDefault(); if (event.key === 'ArrowUp' && index === 0) query.focus(); else matches[(index + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length].focus(); }
  });
  workspace.querySelector('[data-search-clear]').addEventListener('click', () => { query.value = ''; closeResults(); query.focus(); });
  workspace.querySelector('[data-knowledge-search]').addEventListener('submit', event => event.preventDefault());
  const library = workspace.querySelector('.widget-library');
  library.addEventListener('keydown', event => { if (event.key === 'Escape' && library.open) { event.preventDefault(); library.open = false; library.querySelector('summary').focus(); } });
  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('[data-knowledge-search]')) closeResults();
    if (library.open && !library.contains(event.target)) library.open = false;
  });
  window.addEventListener('vestiges:subject-change', event => renderEntry(event.detail?.id));
  function restoreLocation() {
    const url = new URL(location.href);
    const id = url.searchParams.get('entree');
    selectEntry(byId.has(id) ? id : state.pinned, false);
    showView(alias[url.hash.slice(1)] || 'editorial', false);
  }
  renderGrid();
  renderEntry(state.entry);
  composition = initComposition(workspace);
  restoreLocation();
  window.addEventListener('hashchange', restoreLocation);
  window.addEventListener('popstate', restoreLocation);
}
