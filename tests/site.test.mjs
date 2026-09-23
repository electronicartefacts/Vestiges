import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFile(resolve(root, path), "utf8");

test("les pages publiques chargent une version cohérente des ressources", async () => {
  const pages = [
    "index.html", "programme-fondateur/index.html", "pour-qui/index.html", "artistes/index.html", "transmission/index.html",
    "organisations/index.html", "comment-ca-marche/index.html", "methode/index.html",
    "participer/index.html", "a-propos/index.html", "laboratoire/index.html",
    "explorer/index.html", "explorer/specimen/index.html"
  ];
  for (const page of pages) {
    const html = await read(page);
    assert.match(html, /theme-init\.20260718b\.js/);
    assert.match(html, /styles\.20260718b\.css/);
    assert.match(html, /script\.20260923a\.js/);
  }
});

test("les ressources versionnées correspondent aux sources validées", async () => {
  const pairs = [
    ["theme-init.js", "theme-init.20260718b.js"],
    ["styles.css", "styles.20260718b.css"],
    ["script.js", "script.20260923a.js"],
    ["mosaic-specimen-viewer.js", "mosaic-specimen-viewer.20260923b.js"],
    ["exploration-data.js", "exploration-data.20260816a.js"],
    ["forge-viewer.js", "forge-viewer.20260716g.js"]
  ];
  for (const [source, versioned] of pairs) assert.equal(await read(versioned), await read(source));
});

test("les pages publiques exposent des métadonnées de partage propres", async () => {
  const pages = [
    "index.html", "programme-fondateur/index.html", "pour-qui/index.html", "artistes/index.html", "transmission/index.html",
    "organisations/index.html", "comment-ca-marche/index.html", "methode/index.html",
    "participer/index.html", "a-propos/index.html", "laboratoire/index.html",
    "explorer/index.html", "explorer/specimen/index.html"
  ];
  for (const page of pages) {
    const html = await read(page);
    assert.match(html, /<meta property="og:title"/);
    assert.match(html, /<meta property="og:description"/);
    assert.match(html, /<meta property="og:url" content="https:\/\/vestiges\.world\//);
    assert.match(html, /<meta name="twitter:card"/);
    assert.doesNotMatch(html, /(?:canonical|og:url)[^>]*\?v=/);
  }
});

test("l’introduction est courte, évitable, déterministe et mémorisée", async () => {
  const [html, script] = await Promise.all([read("index.html"), read("script.js")]);
  assert.match(html, /data-intro-skip/);
  assert.match(html, /data-brand-intro[^>]*role="dialog" aria-modal="true"/);
  assert.match(html, /matière[\s\S]*geste[\s\S]*œuvre[\s\S]*mémoire[\s\S]*relation[\s\S]*Vestiges/);
  assert.doesNotMatch(script, /Math\.random/);
  assert.match(script, /localStorage\.setItem/);
  assert.match(script, /prefers-reduced-motion/);
  assert.match(script, /element\.inert = value/);
  assert.match(script, /focusAfterIntro/);
  assert.match(script, /event\.key !== "Tab"/);
  assert.match(script, /skipForJourney/);
});

test("la participation conserve une issue explicite sans JavaScript", async () => {
  const [html, theme, styles] = await Promise.all([
    read("participer/index.html"), read("theme-init.js"), read("styles.css")
  ]);
  assert.match(html, /<html lang="fr" class="no-js">/);
  assert.match(html, /<noscript>[\s\S]*contact@vestiges\.world[\s\S]*<\/noscript>/);
  assert.match(theme, /classList\.remove\("no-js"\)/);
  assert.match(styles, /\.no-js \.contact-form \{ display: none; \}/);
});

test("les navigations de pied de page sont toutes nommées", async () => {
  const pages = [
    "index.html", "programme-fondateur/index.html", "pour-qui/index.html", "artistes/index.html", "transmission/index.html",
    "organisations/index.html", "comment-ca-marche/index.html", "methode/index.html",
    "participer/index.html", "a-propos/index.html", "laboratoire/index.html",
    "explorer/index.html", "explorer/specimen/index.html"
  ];
  for (const page of pages) {
    const html = await read(page);
    assert.doesNotMatch(html, /<nav class="footer-nav">/);
  }
});

test("le shell public nomme ses navigations et garde une signature constante", async () => {
  const pages = [
    "index.html", "programme-fondateur/index.html", "pour-qui/index.html", "artistes/index.html", "transmission/index.html",
    "organisations/index.html", "comment-ca-marche/index.html", "methode/index.html",
    "participer/index.html", "a-propos/index.html", "laboratoire/index.html",
    "explorer/index.html", "explorer/specimen/index.html"
  ];
  for (const page of pages) {
    const html = await read(page);
    assert.match(html, /<nav class="main-nav"[^>]*aria-label="Navigation principale"/);
    assert.match(html, /<meta name="theme-color" content="#ffffff">/);
    assert.match(html, /<span>Vestiges · Produit par <a href="https:\/\/www\.electronicartefacts\.com">Electronic Artefacts<\/a><\/span>/);
    assert.match(html, /<a href="https:\/\/vestiges\.world\/">www\.vestiges\.world<\/a>/);
  }
});

test("tous les titres utilisent une vague de graisse déterministe et réversible", async () => {
  const [html, script, styles] = await Promise.all([read("index.html"), read("script.js"), read("styles.css")]);
  assert.match(script, /main h1, main h2, main h3/);
  assert.match(script, /Math\.exp\(-\.5 \* distance \* distance\)/);
  assert.match(script, /pointermove/);
  assert.match(script, /pointerdown/);
  assert.match(styles, /font-variation-settings: "wght" var\(--glyph-weight/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(html, /class="type-ribbon"/);
  assert.doesNotMatch(script, /Math\.random/);
});

test("les boutons d’action sont uniquement en contour et se renforcent sans translation", async () => {
  const styles = await read("styles.css");
  assert.match(styles, /\.button-dark \{ background: transparent; color: var\(--ink\); \}/);
  assert.match(styles, /\.button-light \{ border-color: currentColor; color: inherit; \}/);
  assert.match(styles, /box-shadow: inset 0 0 0 1px currentColor/);
  assert.match(styles, /font-variation-settings: "wght" 720/);
  assert.doesNotMatch(styles, /\.button:hover[^}]*transform/s);
  assert.doesNotMatch(styles, /\.button-light:hover[^}]*background/s);
  assert.doesNotMatch(styles, /\.forge-viewer \.button:hover[^}]*background/s);
});

test("le contraste suit l’appareil et peut être basculé manuellement", async () => {
  const [home, explorer, styles, theme] = await Promise.all([
    read("index.html"), read("explorer/index.html"), read("styles.css"), read("theme-init.js")
  ]);
  assert.match(styles, /@media \(prefers-color-scheme: dark\)/);
  assert.match(styles, /html\[data-theme="light"\]/);
  assert.match(styles, /html\[data-theme="dark"\]/);
  assert.match(styles, /--paper: #fff/);
  assert.match(styles, /--paper: #000/);
  assert.match(styles, /\.theme-toggle/);
  assert.match(theme, /vestiges:theme:v1/);
  assert.match(theme, /localStorage\.setItem/);
  assert.match(theme, /prefers-color-scheme: dark/);
  assert.match(theme, /aria-label/);
  assert.match(home, /theme-init\.20260718b\.js/);
  assert.match(explorer, /theme-init\.20260718b\.js/);
});

test("le header compose le monogramme avec estiges et conserve seulement le logo sur mobile", async () => {
  const [home, explorer, styles] = await Promise.all([
    read("index.html"), read("explorer/index.html"), read("styles.css")
  ]);
  assert.match(home, /aria-label="Vestiges, accueil"[\s\S]*brand-word" aria-hidden="true">estiges/);
  assert.match(explorer, /aria-label="Vestiges, accueil"[\s\S]*brand-word" aria-hidden="true">estiges/);
  assert.match(styles, /\.site-header \.brand-word \{ margin-left: -\.05rem; \}/);
  assert.match(styles, /@media \(max-width: 1120px\)[\s\S]*\.site-header \.brand-word \{ display: none; \}/);
});

test("l’accueil présente les quatre portes de Vestiges avant ses démonstrations", async () => {
  const html = await read("index.html");
  assert.match(html, /Vitrine artisanale[\s\S]*Marketplace[\s\S]*Encyclopédie[\s\S]*Collaboration/);
  assert.match(html, /L’artisanat à découvrir et à faire vivre/);
  assert.match(html, /Marketplace[\s\S]*Premières offres en préparation/);
  assert.match(html, /Un objet, plusieurs façons de le comprendre/);
  assert.match(html, /href="\/pour-qui\/"/);
  assert.match(html, /focus-banner[\s\S]*L’artisanat à découvrir et à faire vivre/);
  assert.match(html, /Proposer un échange/);
  assert.doesNotMatch(html, /De la découverte à la rencontre|Un dossier, plusieurs profondeurs|Écouter avant de publier/);
  assert.match(html, /data-forge-viewer[\s\S]*Vue 3D FORGE/);
  assert.ok(html.indexOf("L’artisanat à découvrir et à faire vivre") < html.indexOf("Vue 3D FORGE"));
});

test("l’encyclopédie distingue ses cinq vues du prototype actuellement disponible", async () => {
  const [html, script, styles, specimenViewer] = await Promise.all([
    read("encyclopedie/index.html"), read("script.js"), read("styles.css"), read("mosaic-specimen-viewer.js")
  ]);
  for (const mode of ["editorial", "grid", "timeline", "graph", "mosaic"]) {
    assert.match(html, new RegExp(`data-view-button="${mode}"`), `Sélecteur manquant : ${mode}`);
    assert.match(html, new RegExp(`data-view-panel="${mode}"`), `Vue manquante : ${mode}`);
  }
  assert.match(html, /data-view-panel="editorial"[^>]*>[\s\S]*?<h2[^>]*>Marqueterie/);
  const mosaic = html.match(/data-view-panel="mosaic"[\s\S]*?<\/section>/)?.[0] || "";
  assert.match(mosaic, /Bois flotté 01, en blocs recomposables/);
  assert.equal((mosaic.match(/data-widget data-cols=/g) || []).length, 8, "Le dossier de référence couvre huit blocs visuels sans dupliquer le visuel du spécimen.");
  for (const specimenFacet of ["≈ 0,7 kg", "Norvège", "Bois flotté 01", "Auteur·ice", "rel=\"external\"", "/explorer/specimen/"]) {
    assert.ok(mosaic.includes(specimenFacet), `Élément du spécimen absent de la mosaïque : ${specimenFacet}`);
  }
  assert.match(mosaic, /Domaine public<\/span><strong>Non revendiqué/);
  assert.match(mosaic, /data-specimen-3d data-mosaic-no-drag/);
  assert.match(html, /img-src 'self' data: blob:/);
  assert.match(mosaic, /<h3>Bois flotté 01<\/h3>[\s\S]*data-model-src="\/assets\/works\/bois-flotte-01\/bois-flotte-01-8k\.glb"/);
  assert.equal((mosaic.match(/data-specimen-3d/g) || []).length, 1, "Le modèle 3D ne doit apparaître qu’une fois.");
  assert.ok(mosaic.indexOf("data-specimen-3d") < mosaic.indexOf("specimen-card--measure"), "Le modèle remplace la première vignette.");
  assert.doesNotMatch(mosaic, /specimen-card-image|specimen-card--portrait/, "La vignette photo remplacée ne doit pas rester en doublon.");
  assert.doesNotMatch(mosaic, /volume · fenêtre 3D interactive|visualisation générative/i);
  assert.doesNotMatch(mosaic, /FORGE|vidéo orbitale|67 Mo|404 304 faces|texture 8K|SHA-256/);
  assert.match(specimenViewer, /GLTFLoader/);
  assert.match(specimenViewer, /new GLTFLoader\(\)\.load\(source/);
  assert.match(specimenViewer, /model\.scale\.setScalar\(scale\)/);
  assert.match(specimenViewer, /new OrbitControls/);
  assert.doesNotMatch(specimenViewer, /makeWeatheredBranch|SphereGeometry|CylinderGeometry/);
  assert.match(html, /Rechercher un savoir[\s\S]*data-active-subject/);
  assert.doesNotMatch(html, /data-widget-dimension|data-widget-move|widget-controls/);
  assert.match(script, /function initEncyclopediaWorkspace/);
  assert.match((await read("index.html")), /href="\/encyclopedie\/#graphe"/);
  assert.match(script, /showView\(window\.location\.hash === "#graphe" \? "graph" : "editorial"\)/);
  assert.match(script, /addEventListener\("hashchange", activateViewFromHash\)/);
  assert.match(script, /const installMosaicInteractions = \(\) =>/);
  assert.match(script, /data-resize-handle/);
  assert.match(script, /setTimeout\([\s\S]*?320\)/);
  assert.match(script, /canvas, \[contenteditable="true"\], \[data-mosaic-no-drag\]/);
  assert.match(script, /mosaic-specimen-viewer\.20260923b\.js/);
  assert.match(script, /is-selected.*is-dragging/);
  assert.match(script, /Fenêtre sélectionnée/);
  assert.match(script, /widget\.dataset\.dragX/);
  assert.match(script, /setPointerCapture/);
  assert.match(script, /gridTrackCount/);
  assert.match(script, /renderMosaicRows/);
  assert.match(script, /const rowHeight = Math\.max\(8, \.\.\.pair\.map/);
  assert.match(script, /const pair = firstWidth >= tracks \? \[widgets\[index\]\] : widgets\.slice\(index, index \+ 2\)/);
  assert.match(script, /index \+= pair\.length/);
  assert.match(script, /row\?\.querySelectorAll\("\[data-widget\]"\)\.forEach\(\(item\) => \{ item\.dataset\.rows = rowHeight; \}\)/);
  assert.match(script, /neighbor\.dataset\.cols = String\(tracks - requestedCols\)/);
  assert.match(script, /\[widgets\[from\], widgets\[to\]\] = \[widgets\[to\], widgets\[from\]\]/);
  assert.match(script, /positioned\.find\(\(\{ rect \}\) => x >= rect\.left && x <= rect\.right && y >= rect\.top && y <= rect\.bottom\)/);
  assert.match(script, /nearest\.distance <= 32 \? nearest : null/);
  assert.match(script, /aria-pressed/);
  assert.match(script, /vestiges:subject-change/);
  assert.match(script, /vestiges:select-subject/);
  assert.match(styles, /\.mosaic-widget\[data-cols="48"\]/);
  assert.match(styles, /\.mosaic-widget\[data-rows="60"\]/);
  assert.match(styles, /\.mosaic-widget\[data-resize-edge="ne"\]/);
  assert.match(styles, /\.mosaic-widget\.is-selected \{ z-index: 10/);
  assert.match(styles, /\.mosaic-widget\.is-dragging \{ z-index: 20/);
  assert.match(styles, /translate: attr\(data-drag-x px/);
  assert.match(styles, /\.mosaic-row \{ display: grid/);
  assert.match(styles, /\.specimen-3d-stage \{[^}]*background: transparent/);
  assert.match(styles, /\.widget-resize-handle:hover, \.widget-resize-handle\.is-active \{ opacity: 0; background: transparent; \}/);
  assert.doesNotMatch(styles, /\.mosaic-widget\[data-drop-position=/);
});

test("les widgets de la mosaïque adaptent densité, contenu et interactions à leur propre taille", async () => {
  const [html, styles] = await Promise.all([read("encyclopedie/index.html"), read("styles.css")]);
  const mosaic = html.match(/data-view-panel="mosaic"[\s\S]*?<\/section>/)?.[0] || "";
  assert.match(styles, /\.mosaic-widget\s*\{[^}]*container:\s*specimen-widget\s*\/\s*size/);
  assert.match(styles, /@container specimen-widget \(max-width: 27rem\)/);
  assert.match(styles, /@container specimen-widget \(max-height: 20rem\)/);
  assert.match(styles, /@container specimen-widget \(max-height: 12rem\)/);
  assert.match(styles, /@container specimen-widget \(min-width: 30rem\) and \(min-height: 26rem\)/);
  assert.match(styles, /\.specimen-card--measure \.widget-compact \{ display: block/);
  assert.match(styles, /\.specimen-card--sources \.specimen-source-list small \{ display: none/);
  assert.ok((mosaic.match(/class="widget-detail"/g) || []).length >= 4, "Les formats spacieux proposent des détails éditoriaux complémentaires.");
  assert.match(mosaic, /class="widget-compact"/);
});

test("l’accueil ouvre par une exploration locale, accessible et explicitement provisoire", async () => {
  const [html, script, styles, data] = await Promise.all([
    read("index.html"), read("script.js"), read("styles.css"), read("exploration-data.js")
  ]);
  assert.match(html, /data-exploration/);
  assert.match(html, /[Ff]ragment de démonstration/);
  assert.match(html, /aucune entrée ne représente encore un dossier réel/);
  assert.match(html, /exploration-data\.20260816a\.js/);
  assert.match(script, /function initExploration/);
  assert.match(script, /ArrowRight/);
  assert.match(script, /aria-pressed/);
  assert.match(script, /!heading\.closest\("\[data-exploration\]"\)/);
  assert.match(styles, /\.exploration-hero/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.exploration-item/s);
  assert.match(data, /relatedIds/);
  assert.match(data, /window\.VESTIGES_EXPLORATION_ITEMS/);
});

test("la nouvelle arborescence expose ses six pages et conserve les anciennes comme ressources secondaires", async () => {
  const pages = ["index.html", "artisans/index.html", "encyclopedie/index.html", "collaborations/index.html", "approche/index.html", "marketplace/index.html"];
  for (const page of pages) {
    const html = await read(page);
    for (const href of ['href="/"', 'href="/artisans/"', 'href="/encyclopedie/"', 'href="/collaborations/"', 'href="/approche/"', 'href="/marketplace/"']) {
      assert.ok(html.includes(href), `${page} should link to ${href}`);
    }
    assert.match(html, /Ressources complémentaires/);
    assert.match(html, /Programme fondateur/);
  }
  const [artisans, encyclopedia, marketplace, participation, script] = await Promise.all([
    read("artisans/index.html"), read("encyclopedie/index.html"), read("marketplace/index.html"),
    read("participer/index.html"), read("script.js")
  ]);
  assert.match(artisans, /au moins deux cas réels/);
  assert.match(encyclopedia, /data-exploration/);
  assert.match(encyclopedia, /corpus vérifié/);
  assert.match(marketplace, /n’est pas encore ouverte/);
  assert.match(marketplace, /ni panier ni paiement intégré/);
  assert.match(marketplace, /parcours=acheteurs/);
  assert.match(script, /acheteurs: "Intérêt pour une pièce ou un achat futur"/);
  assert.match(participation, /data-contact-form/);
});

test("Comment ça marche montre une anatomie de dossier sans fabriquer de cas réel", async () => {
  const [html, styles] = await Promise.all([read("comment-ca-marche/index.html"), read("styles.css")]);
  assert.match(html, /Prototype de structure/);
  assert.match(html, /ne représente ni un (?:artiste|artisan) réel, ni un dossier déjà produit/);
  assert.match(html, /Récit de pratique[\s\S]*Éléments reliés[\s\S]*Registre vérifiable[\s\S]*Droits praticables/);
  assert.match(html, /30 à 45 minutes d’échange initial/);
  assert.match(styles, /\.dossier-blueprint/);
  assert.match(styles, /\.effort-strip/);
});

test("les trois cibles disposent d’une route dédiée", async () => {
  const [hub, artistes, transmission, organisations] = await Promise.all([
    read("pour-qui/index.html"), read("artistes/index.html"), read("transmission/index.html"), read("organisations/index.html")
  ]);
  assert.match(hub, /Artisan·es et ateliers/);
  assert.match(hub, /Recherche et transmission/);
  assert.match(hub, /Institutions et territoires/);
  assert.match(artistes, /Votre savoir-faire mérite plus qu’une image/);
  assert.match(artistes, /v=20260718b&amp;parcours=artistes#conversation/);
  assert.match(transmission, /Construire l’encyclopédie sans effacer les nuances/);
  assert.match(transmission, /Partir d’un usage réel/);
  assert.match(transmission, /v=20260718b&amp;parcours=transmission#conversation/);
  assert.match(organisations, /Construire l’encyclopédie avec les lieux/);
  assert.match(organisations, /Quatre décisions avant toute production/);
  assert.match(organisations, /v=20260718b&amp;parcours=institutions#conversation/);
});

test("le header mobile conserve l’action principale et le focus clavier", async () => {
  const [script, styles] = await Promise.all([read("script.js"), read("styles.css")]);
  assert.match(script, /navigation\.setAttribute\("aria-label", "Navigation principale"\)/);
  assert.match(script, /close\(\{ returnFocus: true \}\)/);
  assert.match(script, /button\.textContent = open \? "Fermer" : "Menu"/);
  assert.doesNotMatch(script, /mobile-nav-cta/);
  assert.match(styles, /\.header-actions > a\[href\^="\/participer\/"\]/);
  assert.match(styles, /content: "Échanger"/);
  assert.match(styles, /\.site-header \.brand \{ min-width: 2\.75rem; min-height: 2\.75rem; \}/);
  assert.match(styles, /\.footer-nav a,[\s\S]*min-height: 2\.75rem/);
  assert.match(styles, /\[id\] \{ scroll-margin-top: calc\(var\(--header\) \+ 1rem\); \}/);
});

test("Explorer annonce le futur corpus au lieu d’ouvrir un artefact", async () => {
  const [explorer, specimen, sitemap] = await Promise.all([
    read("explorer/index.html"), read("explorer/specimen/index.html"), read("sitemap.xml")
  ]);
  assert.match(explorer, /corpus à venir/);
  assert.match(explorer, /plusieurs dossiers consentis/);
  assert.match(explorer, /<meta name="robots" content="noindex, follow">/);
  assert.match(specimen, /<meta name="robots" content="noindex, follow">/);
  assert.doesNotMatch(sitemap, /\/explorer\//);
  assert.doesNotMatch(explorer, /data-forge-viewer|404 304 faces|atlas de texture/);
});

test("Bois flotté 01 distingue les faits, estimations, inconnues et productions numériques", async () => {
  const [lab, dossier, provenance] = await Promise.all([
    read("laboratoire/index.html"), read("explorer/specimen/index.html"), read("assets/works/bois-flotte-01/provenance.json")
  ]);
  assert.match(lab, /Laboratoire · preuve technique/);
  assert.match(lab, /pas encore l’expérience complète d’un dossier d’artiste/);
  assert.match(dossier, /Artiste inconnu/);
  assert.match(dossier, /Les informations non vérifiées restent explicitement signalées/);
  assert.match(dossier, /20 × 20 × 25/);
  assert.match(dossier, /≈ 0,7 kg/);
  assert.match(dossier, /data-model-projection="front"[\s\S]*data-model-projection="side"[\s\S]*data-model-projection="top"/);
  assert.match(dossier, /data-graph-node="norvege"[\s\S]*data-graph-node="artiste"/);
  assert.match(dossier, /404 304 faces/);
  assert.match(dossier, /8192 × 8192 pixels/);
  const record = JSON.parse(provenance);
  assert.equal(record.subject.discovery_country, "Norway");
  assert.deepEqual(record.subject.dimensions_cm_approximate, [20, 20, 25]);
  assert.equal(record.subject.measurement_status, "approximate and not physically verified");
  assert.equal(record.digital_production.mesh_faces, 404304);
  assert.deepEqual(record.digital_production.texture_atlas_pixels, [8192, 8192]);
});

test("le modèle FORGE est local, transparent et chargé à la demande", async () => {
  const [lab, script, viewer, styles, model] = await Promise.all([
    read("laboratoire/index.html"), read("script.js"), read("forge-viewer.js"), read("styles.css"),
    stat(resolve(root, "assets/works/bois-flotte-01/bois-flotte-01-8k.glb"))
  ]);
  assert.match(lab, /data-model-src="\/assets\/works\/bois-flotte-01\/bois-flotte-01-8k\.glb"/);
  assert.match(lab, /data-load-model/);
  assert.match(script, /await import\("\/forge-viewer\.20260716g\.js"\)/);
  assert.match(script, /connection\?\.saveData/);
  assert.match(viewer, /alpha: true/);
  assert.match(viewer, /setClearColor\(0x000000, 0\)/);
  assert.match(viewer, /data-model-projection/);
  assert.match(styles, /\.forge-viewer-poster \{ display: none; \}/);
  assert.ok(model.size > 60_000_000);
});

test("la participation prépare un contact direct sans prétendre transmettre", async () => {
  const [html, script] = await Promise.all([read("participer/index.html"), read("script.js")]);
  assert.match(html, /action="mailto:contact@vestiges\.world"/);
  assert.match(html, /Aucune (?:donnée|réponse) n’est transmise au site/);
  assert.match(script, /Vestiges n’a rien reçu tant que vous ne l’avez pas envoyé/);
  assert.match(html, /data-route-choice="Artistes et ateliers"/);
  assert.match(html, /data-route-choice="Recherche et transmission"/);
  assert.match(html, /data-route-choice="Institutions et territoires"/);
  assert.match(script, /parcours/);
  assert.match(script, /institutions: "Institutions et territoires"/);
  assert.match(script, /route\.checked = true/);
  assert.match(script, /scrollIntoView/);
  assert.match(html, /01 \/ 04[\s\S]*02 \/ 04[\s\S]*03 \/ 04[\s\S]*04 \/ 04/);
  assert.match(html, /Votre contexte et la situation qui vous amène aujourd’hui/);
  assert.doesNotMatch(html, /name="practice"|name="situation"|name="territory"/);
  assert.match(html, /data-cold-path/);
  assert.match(html, /data-form-review/);
  assert.match(script, /originLabel/);
  assert.match(script, /invitationId/);
  assert.match(script, /Résultat recherché/);
  assert.match(script, /displayValue\(data, "context"\)/);
  assert.match(script, /data-copy-prepared-message/);
  assert.match(script, /navigator\.clipboard\.writeText/);
  assert.match(script, /journeyContext/);
  assert.match(html, /data-invitation-relevance/);
  assert.match(html, /role="progressbar"[^>]*aria-valuemax="4"[^>]*aria-valuenow="1"/);
  assert.match(script, /progressMeter\?\.setAttribute\("aria-valuenow"/);
  assert.match(script, /invitedSources = new Set\(\["direct", "joey", "recommendation", "scouting"\]\)/);
  assert.match(script, /sourceSlug === "programme"/);
  assert.match(script, /invitationContext\.hidden = !invitedArrival/);
  assert.match(script, /Après l’envoi/);
  assert.match(script, /À : contact@vestiges\.world/);
  assert.doesNotMatch(html.match(/<section class="section section-compact"[\s\S]*?<\/section>/)?.[0] || "", /data-cold-path/);
});

test("la mesure de parcours reste locale, minimale et activable seulement pour la QA", async () => {
  const script = await read("script.js");
  assert.match(script, /new CustomEvent\("vestiges:journey"/);
  assert.match(script, /window\.VESTIGES_QA_EVENTS/);
  assert.match(script, /get\("qa"\) === "1"/);
  assert.match(script, /contact_step/);
  assert.match(script, /contact_error/);
  assert.match(script, /message_prepared/);
  assert.doesNotMatch(script, /sendBeacon|gtag\(|dataLayer|google-analytics|plausible\.io/);
});

test("le pilote dispose d’un protocole exécutable sans revendiquer de validation terrain", async () => {
  const [playbook, scorecard] = await Promise.all([
    read("docs/FOUNDER_PILOT_PLAYBOOK.md"), read("docs/PILOT_SESSION_SCORECARD.md")
  ]);
  assert.match(playbook, /prêt à exécuter, sans participant ni résultat déclaré/);
  assert.match(playbook, /5 personnes sur 6/);
  assert.match(playbook, /première lecture visée sous deux jours ouvrés/);
  assert.match(playbook, /aucun délai n’est promis publiquement/);
  assert.match(playbook, /Premier dossier réel/);
  assert.match(playbook, /Variantes d’invitation à tester/);
  assert.match(scorecard, /Échec critique/);
  assert.match(scorecard, /Ne conserver aucun verbatim identifiable sans accord explicite/);
});

test("le programme fondateur rend la proposition et ses limites décidables", async () => {
  const [program, home, artistes, about] = await Promise.all([
    read("programme-fondateur/index.html"), read("index.html"), read("artistes/index.html"), read("a-propos/index.html")
  ]);
  assert.match(program, /30 à 45 minutes/);
  assert.match(program, /production initiale non facturés/i);
  assert.match(program, /Aucun frais futur ni gratuité à vie/);
  assert.match(program, /Ni capital, ni emploi, ni mandat/);
  assert.match(home, /Programme fondateur/);
  assert.match(artistes, /Premiers praticiens/);
  assert.match(about, /L’équipe Vestiges, portée par Electronic Artefacts/);
  assert.doesNotMatch(about, /Joey-Néot Marquet/);
});

test("chaque page de rôle propose une action intermédiaire contextualisée", async () => {
  const [artistes, transmission, organisations] = await Promise.all([
    read("artistes/index.html"), read("transmission/index.html"), read("organisations/index.html")
  ]);
  assert.match(artistes, /micro-conversion[\s\S]*parcours=artistes/);
  assert.match(transmission, /micro-conversion[\s\S]*parcours=transmission/);
  assert.match(organisations, /micro-conversion[\s\S]*parcours=institutions/);
});

test("la navigation privilégie le programme réel au dossier témoin", async () => {
  const pages = ["index.html", "artistes/index.html", "participer/index.html", "methode/index.html"];
  for (const page of pages) {
    const html = await read(page);
    assert.match(html, /<nav class="main-nav"[\s\S]*href="\/programme-fondateur\/">Programme fondateur<\/a>/);
    assert.doesNotMatch(html, /<nav class="main-nav"[\s\S]*>Voir un dossier<\/a>/);
  }
});

test("les états masqués du formulaire restent réellement invisibles", async () => {
  const styles = await read("styles.css");
  assert.match(styles, /\[hidden\] \{ display: none !important; \}/);
});

test("la typographie évite les césures, les veuves et les débuts de phrase isolés", async () => {
  const [script, styles] = await Promise.all([read("script.js"), read("styles.css")]);
  assert.match(styles, /main p,[\s\S]*hyphens: none[\s\S]*overflow-wrap: normal/);
  assert.match(styles, /text-wrap: pretty/);
  assert.match(styles, /main h1,[\s\S]*text-wrap: balance/);
  assert.match(styles, /text-decoration-skip-ink: auto/);
  assert.match(styles, /text-decoration-thickness: max\(1px, \.065em\)/);
  assert.match(script, /new Intl\.Segmenter\("fr", \{ granularity: "word" \}\)/);
  assert.match(script, /bindTailWords\(source, tailLength\)/);
  assert.match(script, /new ResizeObserver\(schedule\)/);
});

test("la politique de sécurité ne bloque aucun style applicatif", async () => {
  const pages = ["index.html", "methode/index.html", "participer/index.html", "explorer/specimen/index.html"];
  const [script, home] = await Promise.all([read("script.js"), read("index.html")]);
  for (const page of pages) assert.doesNotMatch(await read(page), /\sstyle="/);
  assert.doesNotMatch(script, /\.style\./);
  assert.match(home, /style-src 'self'/);
  assert.match(home, /data-progress-step="0"/);
});
