import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFile(resolve(root, path), "utf8");

const publicPages = [
  "index.html", "artisans/index.html", "encyclopedie/index.html", "collaborations/index.html",
  "approche/index.html", "marketplace/index.html", "programme-fondateur/index.html", "pour-qui/index.html",
  "artistes/index.html", "transmission/index.html", "organisations/index.html", "comment-ca-marche/index.html",
  "methode/index.html", "participer/index.html", "a-propos/index.html", "laboratoire/index.html",
  "explorer/index.html", "explorer/specimen/index.html"
];
const activeResource = async (name, extension) => {
  const home = await read("index.html");
  const match = home.match(new RegExp(`(?:href|src)="/(${name}\\.[0-9a-z]+\\.${extension})(?:\\?[^" ]*)?"`));
  assert.ok(match, `Ressource active absente : ${name}`);
  return match[1];
};

test("les pages publiques chargent une version cohérente des ressources", async () => {
  const resources = await Promise.all([
    activeResource("theme-init", "js"), activeResource("styles", "css"), activeResource("script", "js")
  ]);
  for (const page of publicPages) {
    const html = await read(page);
    for (const resource of resources) {
      assert.ok(html.includes(`/${resource}`), `${page} : ressource incohérente ${resource}`);
    }
  }
  assert.ok((await read("404.html")).includes(`/${resources[1]}`));
});

test("les ressources versionnées correspondent aux sources validées", async () => {
  const pairs = [
    ["theme-init.js", await activeResource("theme-init", "js")],
    ["styles.css", await activeResource("styles", "css")],
    ["script.js", await activeResource("script", "js")],
    ["mosaic-specimen-viewer.js", "mosaic-specimen-viewer.20261013a.js"],
    ["exploration-data.js", "exploration-data.20260816a.js"],
    ["forge-viewer.js", "forge-viewer.20261013b.js"],
    ["encyclopedia.js", "encyclopedia.20261013c.js"],
    ["encyclopedia.css", "encyclopedia.20261013b.css"],
    ["encyclopedia-records.js", "encyclopedia-records.20261013b.js"],
    ["composition-engine.js", "composition-engine.20261013a.js"],
    ["encyclopedia-catalog.js", "encyclopedia-catalog.20261013b.js"],
    ["encyclopedia-spatial.js", "encyclopedia-spatial.20261013a.js"],
    ["world-geometry.js", "world-geometry.20261013a.js"]
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
  assert.match(html, /matière[\s\S]*geste[\s\S]*pièce[\s\S]*mémoire[\s\S]*rencontre[\s\S]*Vestiges/);
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
  assert.match(html, /class="focus-ribbon"/);
  assert.doesNotMatch(script, /Math\.random/);
});

test("les boutons d’action sont uniquement en contour et se renforcent sans translation", async () => {
  const styles = await read("styles.css");
  assert.match(styles, /\.button-dark \{ background: transparent; color: var\(--ink\); \}/);
  assert.match(styles, /\.button-light \{ border-color: currentColor; color: inherit; \}/);
  const hoverRule = styles.match(/\.button:hover,\s*\.button:focus-visible,\s*\.text-button:hover,\s*\.text-button:focus-visible\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(hoverRule, /box-shadow: inset 0 0 0 1px currentColor/);
  assert.match(hoverRule, /font-variation-settings: "wght" 600/);
  assert.doesNotMatch(hoverRule, /font-weight/);
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
  assert.match(styles, /--accent: #d98579/);
  assert.match(styles, /--accent-soft: rgba\(217, 133, 121, \.16\)/);
  assert.match(styles, /\.theme-toggle/);
  assert.match(theme, /vestiges:theme:v1/);
  assert.match(theme, /localStorage\.setItem/);
  assert.match(theme, /prefers-color-scheme: dark/);
  assert.match(theme, /aria-label/);
  assert.match(home, /theme-init\.20260718b\.js/);
  assert.match(explorer, /theme-init\.20260718b\.js/);
});

test("les vues 3D autorisent les URL blob requises pour leurs textures locales", async () => {
  const pages = await Promise.all([
    read("encyclopedie/index.html"), read("laboratoire/index.html"), read("explorer/specimen/index.html")
  ]);
  for (const html of pages) {
    assert.match(html, /connect-src 'self' blob:/);
    assert.match(html, /img-src 'self' data: blob:/);
  }
});

test("les anciens libellés de navigation disparaissent sans supprimer les routes historiques", async () => {
  const pages = [
    "index.html", "artisans/index.html", "encyclopedie/index.html", "collaborations/index.html", "approche/index.html", "marketplace/index.html",
    "programme-fondateur/index.html", "pour-qui/index.html", "artistes/index.html", "transmission/index.html", "organisations/index.html",
    "comment-ca-marche/index.html", "methode/index.html", "participer/index.html", "a-propos/index.html", "laboratoire/index.html",
    "explorer/index.html", "explorer/specimen/index.html"
  ];
  for (const page of pages) assert.doesNotMatch(await read(page), /href="\/explorer\/">Ancien Explorer/);
  const [artistes, methode, explorer] = await Promise.all([
    read("artistes/index.html"), read("methode/index.html"), read("explorer/index.html")
  ]);
  assert.match(artistes, /canonical" href="https:\/\/vestiges\.world\/artisans\//);
  assert.match(methode, /canonical" href="https:\/\/vestiges\.world\/approche\//);
  assert.match(explorer, /robots" content="noindex, follow"/);
});

test("la page Artisan·es garde une numérotation continue", async () => {
  const html = await read("artisans/index.html");
  const numbers = [...html.matchAll(/<p class="section-index">(\d{2}) —/g)].map((match) => match[1]);
  assert.deepEqual(numbers, ["01", "02", "03", "04", "05", "06"]);
});

test("les modes de l’encyclopédie et ses nœuds ont des noms accessibles en français", async () => {
  const [html, script] = await Promise.all([read("encyclopedie/index.html"), read("script.js")]);
  assert.match(html, /data-view-button="timeline"[^>]*>Frise chronologique<\/button>/);
  assert.match(script, /button\.innerHTML = `<span>\$\{item\.type\}<\/span><strong>\$\{item\.title\}<\/strong>`/);
  assert.match(script, /button\.setAttribute\("aria-description", `\$\{relationSummary\(item\)\}/);
  assert.match(script, /button\.setAttribute\("aria-description", "Afficher cet élément sur la carte\."\)/);
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

test("l’accueil présente Vestiges sans détails techniques du modèle 3D", async () => {
  const html = await read("index.html");
  const portals = html.match(/<section class="home-portals"[\s\S]*?<\/section>/)?.[0] || "";
  assert.match(portals, /Artisan·es et ateliers[\s\S]*Boutique[\s\S]*Encyclopédie[\s\S]*Collaboration/);
  assert.match(html, /L’artisanat à découvrir et à faire vivre/);
  assert.match(portals, /Boutique[\s\S]*Aucune pièce en vente pour le moment/);
  assert.match(html, /Explorer les inspirations/);
  assert.match(html, /href="\/pour-qui\/"/);
  assert.match(html, /focus-banner[\s\S]*L’artisanat à découvrir et à faire vivre/);
  assert.match(html, /Choisir un point de départ/);
  assert.match(html, /Proposer un échange/);
  assert.doesNotMatch(html, /De la découverte à la rencontre|Un dossier, plusieurs profondeurs|Écouter avant de publier/);
  assert.doesNotMatch(html, /data-forge-viewer|data-model-src|\.glb|GLB|FORGE|Vue 3D|71 Mo/i);
});

test("l’encyclopédie expose sept vues accessibles partageant une entrée", async () => {
  const [html, controller, engine] = await Promise.all([
    read("encyclopedie/index.html"), read("encyclopedia.js"), read("composition-engine.js")
  ]);
  for (const mode of ["editorial", "grid", "timeline", "world", "graph", "compare", "mosaic"]) {
    assert.match(html, new RegExp(`id="tab-${mode}"[^>]*role="tab"[^>]*aria-controls="panel-${mode}"`));
    assert.match(html, new RegExp(`id="panel-${mode}"[^>]*role="tabpanel"`));
  }
  assert.match(html, /Composition<\/button>/);
  assert.doesNotMatch(html, /Dossier exemple|Origines et contexte|texture d’ambiance · à documenter/);
  assert.match(html, /home-graph-section[\s\S]*data-exploration-related-list/);
  assert.match(html, /data-widget-library/);
  assert.match(controller, /vestiges:select-subject/);
  assert.match(controller, /dialog\.showModal/);
  assert.match(controller, /state\.entry !== 'bois'/);
  assert.match(controller, /data-load-specimen[^>]*>Afficher le modèle 3D/);
  assert.match(controller, /Environ 71 Mo/);
  assert.match(engine, /setPointerCapture/);
  assert.match(engine, /event\.shiftKey/);
});

test("les widgets de composition gardent une lecture adaptée à leur taille", async () => {
  const [styles, shared, controller] = await Promise.all([
    read("encyclopedia.css"), read("styles.css"), read("encyclopedia.js")
  ]);
  assert.match(styles, /container: specimen-widget \/ size/);
  assert.match(styles, /@container specimen-widget \(max-width: 27rem\)/);
  assert.match(styles, /@container specimen-widget \(max-height: 17rem\)/);
  assert.match(shared, /\.mosaic-widget\[data-cols="48"\]/);
  assert.match(shared, /\.mosaic-widget\[data-rows="60"\]/);
  assert.match(controller, /const defaults = \['notice', 'media', 'relations', 'dates', 'sources', 'status', 'world'\]/);
});

test("l’accueil contient une exploration locale, accessible et explicitement provisoire", async () => {
  const [html, script, styles, data] = await Promise.all([
    read("index.html"), read("script.js"), read("styles.css"), read("exploration-data.js")
  ]);
  assert.match(html, /data-exploration/);
  assert.match(html, /role="group" aria-label="Carte des exemples"/);
  assert.match(html, /data-exploration-related-list/);
  assert.match(html, /data-exploration-text-list/);
  assert.match(html, /Encyclopédie · démonstration/i);
  assert.match(html, /aucun ne représente un dossier réel/);
  assert.match(html, /exploration-data\.20260816a\.js/);
  assert.match(script, /function initExploration/);
  assert.match(script, /relationLayer\.append\(path\)/);
  assert.match(script, /\}, 180\)/);
  assert.match(script, /ArrowRight/);
  assert.match(script, /aria-pressed/);
  assert.match(script, /!heading\.closest\("\[data-exploration\]"\)/);
  assert.match(styles, /\.exploration-hero/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.exploration-item/s);
  assert.match(styles, /transition: stroke \.18s ease-out, opacity \.18s ease-out/);
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
    assert.match(html, /Premiers dossiers/);
  }
  const [artisans, encyclopedia, marketplace, participation, script] = await Promise.all([
    read("artisans/index.html"), read("encyclopedie/index.html"), read("marketplace/index.html"),
    read("participer/index.html"), read("script.js")
  ]);
  assert.match(artisans, /au moins deux dossiers réels/);
  assert.match(encyclopedia, /data-exploration/);
  assert.match(encyclopedia, /aucun dossier d’artisan publié/);
  assert.match(marketplace, /La boutique n’est pas ouverte/);
  assert.match(marketplace, /ne prendra ni paiement ni livraison en charge/);
  assert.match(marketplace, /parcours=acheteurs/);
  assert.match(script, /acheteurs: "Découvrir une pièce"/);
  assert.match(participation, /data-contact-form/);
});

test("Comment ça marche montre une anatomie de dossier sans fabriquer de cas réel", async () => {
  const [html, styles] = await Promise.all([read("comment-ca-marche/index.html"), read("styles.css")]);
  assert.match(html, /Prototype de structure/);
  assert.match(html, /ne décrit ni un·e artisan·e réel·le ni un dossier déjà publié/);
  assert.match(html, /Récit de pratique[\s\S]*Éléments reliés[\s\S]*D’où viennent les informations[\s\S]*Vos choix de publication/);
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
  assert.match(hub, /Institutions et associations/);
  assert.match(artistes, /Votre savoir-faire mérite plus qu’une image/);
  assert.match(artistes, /v=20260718b&amp;parcours=artisans#conversation/);
  assert.match(transmission, /Construire l’encyclopédie sans effacer les nuances/);
  assert.match(transmission, /Partir d’un usage réel/);
  assert.match(transmission, /v=20260718b&amp;parcours=transmission#conversation/);
  assert.match(organisations, /Documenter des savoir-faire avec un lieu culturel/);
  assert.match(organisations, /Quatre questions avant de commencer/);
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
  assert.match(explorer, /dossiers à venir/);
  assert.match(explorer, /plusieurs dossiers réels[\s\S]*avec l’accord des personnes concernées/);
  assert.match(explorer, /<meta name="robots" content="noindex, follow">/);
  assert.match(specimen, /<meta name="robots" content="noindex, follow">/);
  assert.doesNotMatch(sitemap, /\/explorer\//);
  assert.doesNotMatch(explorer, /data-forge-viewer|404 304 faces|atlas de texture/);
});

test("Bois flotté 01 distingue les faits, estimations, inconnues et productions numériques", async () => {
  const [lab, dossier, provenance] = await Promise.all([
    read("laboratoire/index.html"), read("explorer/specimen/index.html"), read("assets/works/bois-flotte-01/provenance.json")
  ]);
  assert.match(lab, /Démonstration · modèle 3D/);
  assert.match(lab, /ce n’est pas encore un dossier réalisé avec un·e artisan·e/i);
  assert.match(dossier, /Auteur[\s\S]*Non identifié/);
  assert.match(dossier, /Son origine et ses mesures exactes restent inconnues ou à vérifier/);
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
  assert.match(script, /await import\("\/forge-viewer\.20261013a\.js"\)/);
  const viewerInit = script.split("function initForgeViewer()")[1]?.split("function initContactForm()")[0] || "";
  assert.match(viewerInit, /button\.addEventListener\("click", load\)/);
  assert.doesNotMatch(viewerInit, /IntersectionObserver|navigator\.connection/);
  assert.match(viewer, /alpha: true/);
  assert.match(viewer, /setClearColor\(0x000000, 0\)/);
  assert.match(viewer, /data-model-projection/);
  assert.match(styles, /\.forge-viewer-poster \{ display: none; \}/);
  assert.ok(model.size > 60_000_000);
});

test("la participation prépare un contact direct sans prétendre transmettre", async () => {
  const [html, script] = await Promise.all([read("participer/index.html"), read("script.js")]);
  assert.match(html, /action="mailto:contact@vestiges\.world"/);
  assert.match(html, /Le site prépare un e-mail[\s\S]*Votre message ne sera envoyé qu’après votre clic sur « Envoyer »/);
  assert.match(html, /Vestiges ne le recevra qu’après votre envoi/);
  assert.match(html, /data-route-choice="Artisan·es et ateliers"/);
  assert.match(html, /name="route" value="Artisan·es et ateliers"[\s\S]*<strong>Artisan·es et ateliers<\/strong>/);
  assert.doesNotMatch(html, /Artistes et ateliers/);
  assert.match(html, /data-route-choice="Recherche et transmission"/);
  assert.match(html, /data-route-choice="Lieux culturels, associations et institutions"/);
  assert.match(script, /parcours/);
  assert.match(script, /institutions: "Lieux culturels, associations et institutions"/);
  assert.match(script, /artistes: "Artisan·es et ateliers"/);
  assert.match(script, /artisans: "Artisan·es et ateliers"/);
  assert.match(await read("artisans/index.html"), /parcours=artisans/);
  assert.match(script, /route\.checked = true/);
  assert.match(script, /scrollIntoView/);
  assert.match(html, /01 \/ 04[\s\S]*02 \/ 04[\s\S]*03 \/ 04[\s\S]*04 \/ 04/);
  assert.match(html, /Qu’est-ce qui vous amène aujourd’hui/);
  assert.doesNotMatch(html, /name="practice"|name="situation"|name="territory"/);
  assert.match(html, /data-cold-path/);
  assert.match(html, /data-form-review/);
  assert.match(script, /originLabel/);
  assert.match(script, /invitationId/);
  assert.match(script, /Ce que vous souhaitez aborder/);
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
  assert.match(program, /production initiale[\s\S]*n’est pas facturée/i);
  assert.match(program, /Aucun tarif ni avantage futur n’est fixé aujourd’hui/);
  assert.match(program, /Vous restez libre de poursuivre ou d’arrêter à chaque étape/);
  assert.match(home, /Premiers dossiers/);
  assert.match(artistes, /Premiers praticiens/);
  assert.match(about, /Electronic Artefacts/);
  assert.doesNotMatch(about, /Joey-Néot Marquet/);
});

test("chaque page de rôle propose une action intermédiaire contextualisée", async () => {
  const [artistes, transmission, organisations] = await Promise.all([
    read("artistes/index.html"), read("transmission/index.html"), read("organisations/index.html")
  ]);
  assert.match(artistes, /micro-conversion[\s\S]*parcours=artisans/);
  assert.match(transmission, /micro-conversion[\s\S]*parcours=transmission/);
  assert.match(organisations, /micro-conversion[\s\S]*parcours=institutions/);
});

test("la navigation principale privilégie les pages de compréhension", async () => {
  const pages = ["index.html", "artistes/index.html", "participer/index.html", "methode/index.html"];
  for (const page of pages) {
    const html = await read(page);
    const navigation = html.match(/<nav class="main-nav"[\s\S]*?<\/nav>/)?.[0] || "";
    for (const route of ["artisans", "encyclopedie", "collaborations", "approche", "marketplace"]) {
      assert.ok(navigation.includes(`href="/${route}/"`), `${page} : route principale absente ${route}`);
    }
    assert.doesNotMatch(navigation, /href="\/explorer\/specimen\/"/);
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

test("les anciennes URL restent accessibles et se consolident vers leur canonique", async () => {
  const pairs = [
    ["artistes/index.html", "artisans/index.html", "/artistes/", "/artisans/"],
    ["methode/index.html", "approche/index.html", "/methode/", "/approche/"]
  ];
  const sitemap = await read("sitemap.xml");
  for (const [aliasFile, canonicalFile, aliasRoute, canonicalRoute] of pairs) {
    const [alias, canonical] = await Promise.all([read(aliasFile), read(canonicalFile)]);
    assert.match(alias, new RegExp(`<link rel="canonical" href="https://vestiges\\.world${canonicalRoute.replaceAll("/", "\\/")}">`));
    assert.match(alias, new RegExp(`<meta property="og:url" content="https://vestiges\\.world${canonicalRoute.replaceAll("/", "\\/")}">`));
    assert.equal(alias.match(/<title>(.*?)<\/title>/s)?.[1], canonical.match(/<title>(.*?)<\/title>/s)?.[1]);
    assert.equal(alias.match(/<meta name="description" content="([^"]*)">/)?.[1], canonical.match(/<meta name="description" content="([^"]*)">/)?.[1]);
    assert.doesNotMatch(alias, new RegExp(`<a\\b[^>]*href="${aliasRoute.replaceAll("/", "\\/")}`));
    assert.doesNotMatch(sitemap, new RegExp(`https://vestiges\\.world${aliasRoute.replaceAll("/", "\\/")}`));
  }
});

test("les titres et descriptions renforcent la sémantique sans modifier le parcours", async () => {
  const [participer, about, laboratory, transmission] = await Promise.all([
    read("participer/index.html"), read("a-propos/index.html"), read("laboratoire/index.html"), read("transmission/index.html")
  ]);
  const firstHeading = participer.match(/<(h[1-6])\b/i)?.[1];
  assert.equal(firstHeading, "h1");
  assert.match(participer, /<p class="invitation-context__heading" id="invitation-title">/);
  assert.match(about, /<h1[^>]*>Vestiges, un projet de documentation des savoir-faire artisanaux<\/h1>/);
  assert.match(laboratory, /<title>Bois flotté 01 · démonstration 3D \| Vestiges<\/title>/);
  const transmissionDescription = transmission.match(/<meta name="description" content="([^"]*)">/)?.[1] ?? "";
  for (const term of ["document", "mot de métier", "question", "dossiers"]) {
    assert.ok(transmissionDescription.toLocaleLowerCase("fr").includes(term), `Terme manquant dans la description : ${term}`);
  }
});

test("les données structurées restent reliées au contenu visible et à la canonique", async () => {
  const pages = [
    "index.html", "artisans/index.html", "encyclopedie/index.html", "collaborations/index.html", "approche/index.html",
    "marketplace/index.html", "programme-fondateur/index.html", "pour-qui/index.html", "transmission/index.html",
    "organisations/index.html", "comment-ca-marche/index.html", "participer/index.html", "a-propos/index.html", "laboratoire/index.html"
  ];
  for (const page of pages) {
    const html = await read(page);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.equal(blocks.length, 1, `${page} should have one JSON-LD block`);
    const data = JSON.parse(blocks[0][1]);
    assert.equal(data["@context"], "https://schema.org");
    const entities = data["@graph"];
    assert.ok(Array.isArray(entities));
    for (const entity of entities) {
      assert.equal("@id" in entity, false);
      assert.equal("identifier" in entity, false);
    }
    assert.equal(entities.some((entity) => entity["@type"] === "Organization"), false);
    const webPage = entities.find((entity) => ["WebPage", "AboutPage"].includes(entity["@type"]));
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1];
    const h1 = html.match(/<h1\b[^>]*>(.*?)<\/h1>/s)?.[1]?.replace(/<[^>]*>/g, "").trim();
    assert.equal(webPage.url, canonical);
    assert.equal(webPage.name, h1);
    assert.equal(webPage.description, description);
    assert.equal(webPage["@type"], page === "a-propos/index.html" ? "AboutPage" : "WebPage");
    assert.deepEqual(webPage.isPartOf, { "@type": "WebSite", name: "Vestiges", url: "https://vestiges.world/", inLanguage: "fr" });
    assert.equal(entities.filter((entity) => entity["@type"] === "WebSite").length, page === "index.html" ? 1 : 0);
  }
  for (const page of ["artistes/index.html", "methode/index.html", "explorer/index.html", "explorer/specimen/index.html"]) {
    assert.doesNotMatch(await read(page), /application\/ld\+json/);
  }
});

test("l’image d’accueil charge ses variantes WebP optimisées sans différer le visuel principal", async () => {
  const html = await read("index.html");
  const hero = html.match(/<div class="focus-banner__image">([\s\S]*?)<\/div>/)?.[1] ?? "";
  assert.match(hero, /<picture>[\s\S]*type="image\/webp"/);
  assert.match(hero, /atelier-relations-v1-640-20261011a\.webp 640w/);
  assert.match(hero, /atelier-relations-v1-960-20261011a\.webp 960w/);
  assert.match(hero, /atelier-relations-v1-1536-20261011a\.webp 1536w/);
  assert.match(hero, /sizes="100vw"/);
  assert.match(hero, /atelier-relations-v1\.png/);
  assert.match(hero, /fetchpriority="high"/);
  assert.match(hero, /decoding="async"/);
  assert.doesNotMatch(hero, /loading="lazy"/);
  const [previous640, previous960, previous1536, optimized640, optimized960, optimized1536] = await Promise.all([
    stat(resolve(root, "assets/editorial/atelier-relations-v1-640.webp")),
    stat(resolve(root, "assets/editorial/atelier-relations-v1-960.webp")),
    stat(resolve(root, "assets/editorial/atelier-relations-v1-1536.webp")),
    stat(resolve(root, "assets/editorial/atelier-relations-v1-640-20261011a.webp")),
    stat(resolve(root, "assets/editorial/atelier-relations-v1-960-20261011a.webp")),
    stat(resolve(root, "assets/editorial/atelier-relations-v1-1536-20261011a.webp"))
  ]);
  assert.ok(optimized640.size < previous640.size * .7);
  assert.ok(optimized960.size < previous960.size * .7);
  assert.ok(optimized1536.size < previous1536.size * .7);
  const [original, largest, smallest] = await Promise.all([
    stat(resolve(root, "assets/editorial/atelier-relations-v1.png")),
    stat(resolve(root, "assets/editorial/atelier-relations-v1-1536-20261011a.webp")),
    stat(resolve(root, "assets/editorial/atelier-relations-v1-640-20261011a.webp"))
  ]);
  assert.ok(largest.size < original.size / 10);
  assert.ok(smallest.size < original.size / 50);
});

test("la texture bois privilégie WebP avec un repli JPEG plus léger", async () => {
  const styles = await read("styles.css");
  assert.match(styles, /image-set\(url\(['"]\/assets\/textures\/wood-20261011a\.webp['"]\) type\(['"]image\/webp['"]\), url\(['"]\/assets\/textures\/wood\.jpg['"]\) type\(['"]image\/jpeg['"]\)\)/);
  const [original, optimized] = await Promise.all([
    stat(resolve(root, "assets/textures/wood.jpg")),
    stat(resolve(root, "assets/textures/wood-20261011a.webp"))
  ]);
  assert.ok(optimized.size < original.size * .8);
});
