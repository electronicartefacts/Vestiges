import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFile(resolve(root, path), "utf8");

test("l’introduction est courte, évitable, déterministe et mémorisée", async () => {
  const [html, script] = await Promise.all([read("index.html"), read("script.js")]);
  assert.match(html, /data-intro-skip/);
  assert.match(html, /matière[\s\S]*geste[\s\S]*œuvre[\s\S]*mémoire[\s\S]*relation[\s\S]*Vestiges/);
  assert.doesNotMatch(script, /Math\.random/);
  assert.match(script, /localStorage\.setItem/);
  assert.match(script, /prefers-reduced-motion/);
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
  assert.match(home, /theme-init\.js/);
  assert.match(explorer, /theme-init\.js/);
});

test("l’accueil explique le produit avant la technologie et oriente par rôle", async () => {
  const html = await read("index.html");
  assert.match(html, /Vestiges conçoit, avec les artistes et les lieux culturels, des dossiers numériques/);
  assert.match(html, /Je crée[\s\S]*Je transmets[\s\S]*Je structure un terrain/);
  assert.match(html, /couverture éditoriale/i);
  assert.match(html, /href="\/pour-qui\/"/);
  assert.doesNotMatch(html.split("Trois manières d’entrer")[0], /FORGE|8K|Bois flotté/);
});

test("les trois cibles disposent d’une route dédiée", async () => {
  const [hub, artistes, transmission, organisations] = await Promise.all([
    read("pour-qui/index.html"), read("artistes/index.html"), read("transmission/index.html"), read("organisations/index.html")
  ]);
  assert.match(hub, /Artistes et ateliers/);
  assert.match(hub, /Recherche et transmission/);
  assert.match(hub, /Institutions et territoires/);
  assert.match(artistes, /Votre pratique déborde de l’image/);
  assert.match(transmission, /Transmettre sans effacer les nuances/);
  assert.match(organisations, /Commencer par un terrain/);
});

test("Explorer annonce le futur corpus au lieu d’ouvrir un artefact", async () => {
  const explorer = await read("explorer/index.html");
  assert.match(explorer, /corpus à venir/);
  assert.match(explorer, /plusieurs dossiers consentis/);
  assert.doesNotMatch(explorer, /data-forge-viewer|404 304 faces|atlas de texture/);
});

test("Bois flotté 01 est une preuve de laboratoire attribuée et exacte", async () => {
  const [lab, dossier, provenance] = await Promise.all([
    read("laboratoire/index.html"), read("explorer/specimen/index.html"), read("assets/works/bois-flotte-01/provenance.json")
  ]);
  assert.match(lab, /Laboratoire · preuve technique/);
  assert.match(lab, /pas encore l’expérience complète d’un dossier d’artiste/);
  assert.match(dossier, /Aucun artiste attribué/);
  assert.match(dossier, /La mention 8K désigne l’atlas de texture/);
  assert.equal(JSON.parse(provenance).digital_production.mesh_faces, 404304);
  assert.deepEqual(JSON.parse(provenance).digital_production.texture_atlas_pixels, [8192, 8192]);
});

test("le modèle FORGE est local, transparent et chargé à la demande", async () => {
  const [lab, script, viewer, styles, model] = await Promise.all([
    read("laboratoire/index.html"), read("script.js"), read("forge-viewer.js"), read("styles.css"),
    stat(resolve(root, "assets/works/bois-flotte-01/bois-flotte-01-8k.glb"))
  ]);
  assert.match(lab, /data-model-src="\/assets\/works\/bois-flotte-01\/bois-flotte-01-8k\.glb"/);
  assert.match(lab, /data-load-model/);
  assert.match(script, /await import\("\/forge-viewer\.js"\)/);
  assert.match(script, /connection\?\.saveData/);
  assert.match(viewer, /alpha: true/);
  assert.match(viewer, /setClearColor\(0x000000, 0\)/);
  assert.match(styles, /\.forge-viewer-poster \{ display: none; \}/);
  assert.ok(model.size > 60_000_000);
});

test("la participation prépare un contact direct sans prétendre transmettre", async () => {
  const [html, script] = await Promise.all([read("participer/index.html"), read("script.js")]);
  assert.match(html, /action="mailto:contact@vestiges\.world"/);
  assert.match(html, /Aucune donnée n’est transmise au site/);
  assert.match(script, /Vestiges n’a rien reçu tant que vous ne l’avez pas envoyé/);
});
