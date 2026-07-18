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
    assert.match(html, /theme-init\.20260718a\.js/);
    assert.match(html, /styles\.20260718a\.css/);
    assert.match(html, /script\.20260718a\.js/);
  }
});

test("les ressources versionnées correspondent aux sources validées", async () => {
  const pairs = [
    ["theme-init.js", "theme-init.20260718a.js"],
    ["styles.css", "styles.20260718a.css"],
    ["script.js", "script.20260718a.js"],
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
  assert.match(home, /theme-init\.20260718a\.js/);
  assert.match(explorer, /theme-init\.20260718a\.js/);
});

test("le header compose le monogramme avec estiges et conserve seulement le logo sur mobile", async () => {
  const [home, explorer, styles] = await Promise.all([
    read("index.html"), read("explorer/index.html"), read("styles.css")
  ]);
  assert.match(home, /aria-label="Vestiges, accueil"[\s\S]*brand-word" aria-hidden="true">estiges/);
  assert.match(explorer, /aria-label="Vestiges, accueil"[\s\S]*brand-word" aria-hidden="true">estiges/);
  assert.match(styles, /\.site-header \.brand-word \{ margin-left: -\.05rem; \}/);
  assert.match(styles, /@media \(max-width: 960px\)[\s\S]*\.site-header \.brand-word \{ display: none; \}/);
});

test("l’accueil explique le produit avant la technologie et oriente par rôle", async () => {
  const html = await read("index.html");
  assert.match(html, /Vestiges conçoit, avec les artistes et les lieux culturels, des dossiers numériques/);
  assert.match(html, /Je crée[\s\S]*Je transmets[\s\S]*Je structure un terrain/);
  assert.match(html, /couverture éditoriale/i);
  assert.match(html, /href="\/pour-qui\/"/);
  assert.doesNotMatch(html.split("Trois manières d’entrer")[0], /FORGE|8K|Bois flotté/);
});

test("Comment ça marche montre une anatomie de dossier sans fabriquer de cas réel", async () => {
  const [html, styles] = await Promise.all([read("comment-ca-marche/index.html"), read("styles.css")]);
  assert.match(html, /Prototype de structure/);
  assert.match(html, /ne représente ni un artiste réel, ni un dossier déjà produit/);
  assert.match(html, /Récit de pratique[\s\S]*Éléments reliés[\s\S]*Registre vérifiable[\s\S]*Droits praticables/);
  assert.match(html, /30 à 45 minutes d’échange initial/);
  assert.match(styles, /\.dossier-blueprint/);
  assert.match(styles, /\.effort-strip/);
});

test("les trois cibles disposent d’une route dédiée", async () => {
  const [hub, artistes, transmission, organisations] = await Promise.all([
    read("pour-qui/index.html"), read("artistes/index.html"), read("transmission/index.html"), read("organisations/index.html")
  ]);
  assert.match(hub, /Artistes et ateliers/);
  assert.match(hub, /Recherche et transmission/);
  assert.match(hub, /Institutions et territoires/);
  assert.match(artistes, /Votre pratique déborde de l’image/);
  assert.match(artistes, /v=20260718a&amp;parcours=artistes#conversation/);
  assert.match(transmission, /Transmettre sans effacer les nuances/);
  assert.match(transmission, /Partir d’un usage réel/);
  assert.match(transmission, /v=20260718a&amp;parcours=transmission#conversation/);
  assert.match(organisations, /Commencer par un terrain/);
  assert.match(organisations, /Quatre décisions avant toute production/);
  assert.match(organisations, /v=20260718a&amp;parcours=institutions#conversation/);
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
  const explorer = await read("explorer/index.html");
  assert.match(explorer, /corpus à venir/);
  assert.match(explorer, /plusieurs dossiers consentis/);
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
  assert.match(about, /Joey-Néot Marquet/);
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
  assert.match(styles, /main p,[\s\S]*hyphens: none/);
  assert.match(styles, /text-wrap: pretty/);
  assert.match(styles, /main h1,[\s\S]*text-wrap: balance/);
  assert.match(styles, /text-decoration-skip-ink: auto/);
  assert.match(styles, /text-decoration-thickness: max\(1px, \.065em\)/);
  assert.match(script, /new Intl\.Segmenter\("fr", \{ granularity: "sentence" \}\)/);
  assert.match(script, /countFirstLineWords\(sentence\) <= 4/);
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
