import { media } from './encyclopedia-records.20261013b.js';
import { buildCatalog, filterEntries, mediaForEntries } from './encyclopedia-catalog.20261013b.js';

function initPhotoPreview() {
  const root = document.querySelector('[data-home-photo-preview]');
  if (!root) return;
  const entries = buildCatalog(window.VESTIGES_EXPLORATION_ITEMS || []);
  const input = root.querySelector('[name="q"]');
  const grid = root.querySelector('[data-home-photo-grid]');
  const status = root.querySelector('[data-home-photo-count]');
  const cta = root.querySelector('[data-home-photo-cta]');
  const presets = root.querySelector('[data-home-photo-presets]');
  const tiles = new Map();
  const primary = { iznik: 'plat-iznik', wave: 'vague-kanagawa', kosode: 'livre-kosode' };
  let renderedQuery;
  const normalize = value => value.trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const link = (query, entry) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (entry) params.set('entree', entry);
    return `/encyclopedie/${params.size ? `?${params}` : ''}#grille`;
  };
  function tileFor(image) {
    if (tiles.has(image.id)) return tiles.get(image.id);
    const tile = document.createElement('a');
    tile.className = 'home-photo-tile';
    const img = document.createElement('img');
    img.src = image.type === 'video' ? image.poster : image.src;
    img.alt = image.alt;
    img.width = 1000;
    img.height = 1000;
    img.loading = 'lazy';
    img.decoding = 'async';
    const label = document.createElement('span');
    label.append(document.createTextNode(image.kind));
    const arrow = document.createElement('span');
    arrow.textContent = image.type === 'video' ? '▷' : '↗';
    arrow.setAttribute('aria-hidden', 'true');
    label.append(arrow);
    tile.append(img, label);
    tile.setAttribute('aria-label', `${image.title} — ${image.kind}. Voir dans l’encyclopédie.`);
    tiles.set(image.id, tile);
    return tile;
  }
  function render() {
    const query = input.value.trim();
    if (query === renderedQuery) return;
    renderedQuery = query;
    const matches = filterEntries(entries, { query });
    const images = mediaForEntries(media, matches);
    const fragment = document.createDocumentFragment();
    for (const image of images.slice(0, 6)) {
      const entry = matches.find(entry => entry.id === (primary[image.id] || image.entryId)) || matches.find(entry => mediaForEntries([image], [entry]).length);
      const tile = tileFor(image);
      tile.href = link(query, entry.id);
      fragment.append(tile);
    }
    if (!images.length) {
      const empty = document.createElement('div');
      empty.className = 'home-photo-empty';
      const title = document.createElement('p');
      title.textContent = matches.length ? 'Ces entrées n’ont pas encore d’image.' : 'Aucune image pour cette recherche.';
      const hint = document.createElement('p');
      hint.textContent = matches.length ? 'Vous pouvez consulter leurs notices dans l’encyclopédie ou essayer une autre matière.' : 'Essayez « Bois », « Japon » ou « Céramique ».';
      empty.append(title, hint);
      fragment.append(empty);
    }
    grid.replaceChildren(fragment);
    status.textContent = `${images.length > 6 ? `6 sur ${images.length}` : images.length} image${images.length === 1 ? '' : 's'}${query ? ` · ${query}` : ' · toutes les inspirations'}`;
    cta.href = link(query);
    presets.querySelectorAll('[data-photo-query]').forEach(button => button.setAttribute('aria-pressed', String(normalize(button.dataset.photoQuery) === normalize(query))));
  }
  root.querySelector('[data-home-photo-form]').addEventListener('submit', event => { event.preventDefault(); render(); });
  input.addEventListener('input', event => { if (!event.isComposing) render(); });
  input.addEventListener('compositionend', render);
  presets.querySelectorAll('[data-photo-query]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.photoQuery; render(); }));
  // Restore the matching preview when the browser returns from the encyclopedia.
  window.addEventListener('pageshow', render);
  presets.hidden = false;
  render();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPhotoPreview, { once: true });
else initPhotoPreview();
