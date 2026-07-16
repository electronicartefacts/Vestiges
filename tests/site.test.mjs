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

test("les titres utilisent une vague de graisse déterministe et réversible", async () => {
  const [html, script, styles] = await Promise.all([read("index.html"), read("script.js"), read("styles.css")]);
  assert.match(script, /initKineticType\(\)/);
  assert.match(script, /main h1, main h2, main h3/);
  assert.match(script, /Math\.exp\(-\.5 \* distance \* distance\)/);
  assert.match(script, /pointermove/);
  assert.match(script, /pointerdown/);
  assert.match(styles, /font-variation-settings: "wght" var\(--glyph-weight/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(html, /class="type-ribbon"/);
  assert.doesNotMatch(script, /Math\.random/);
});

test("l’accueil donne la définition, le public, le résultat et un CTA réel", async () => {
  const html = await read("index.html");
  assert.match(html, /artistes, artisans et ateliers/);
  assert.match(html, /gestes, matières, lieux, sources et histoires/);
  assert.match(html, /Couverture éditoriale/);
  assert.match(html, /href="\/explorer\/"/);
});

test("Explorer présente Bois flotté 01 avec une provenance et une formulation 8K exactes", async () => {
  const [explorer, dossier, provenance] = await Promise.all([
    read("explorer/index.html"),
    read("explorer/specimen/index.html"),
    read("assets/works/bois-flotte-01/provenance.json")
  ]);
  assert.match(explorer, /Première pièce · prototype public/);
  assert.match(explorer, /atlas de texture 8192 × 8192 pixels/);
  assert.match(dossier, /La mention 8K désigne l’atlas de texture/);
  assert.match(dossier, /Aucun artiste attribué/);
  assert.match(dossier, /ne sont pas présentés comme appartenant au domaine public|n’est pas déclaré dans le domaine public/);
  assert.equal(JSON.parse(provenance).digital_production.mesh_faces, 404304);
  assert.deepEqual(JSON.parse(provenance).digital_production.texture_atlas_pixels, [8192, 8192]);
  assert.match(explorer, /Lecture relationnelle/);
  assert.match(explorer, /Registre/);
});

test("le modèle FORGE est local, transparent et chargé à l’approche sans pénaliser les connexions contraintes", async () => {
  const [explorer, script, viewer, styles, model] = await Promise.all([
    read("explorer/index.html"),
    read("script.js"),
    read("forge-viewer.js"),
    read("styles.css"),
    stat(resolve(root, "assets/works/bois-flotte-01/bois-flotte-01-8k.glb"))
  ]);
  assert.match(explorer, /data-model-src="\/assets\/works\/bois-flotte-01\/bois-flotte-01-8k\.glb"/);
  assert.match(explorer, /data-load-model/);
  assert.match(script, /await import\("\/forge-viewer\.js"\)/);
  assert.match(script, /IntersectionObserver/);
  assert.match(script, /connection\?\.saveData/);
  assert.match(viewer, /alpha: true/);
  assert.match(viewer, /setClearColor\(0x000000, 0\)/);
  assert.match(styles, /\.forge-viewer-poster \{ display: none; \}/);
  assert.ok(model.size > 60_000_000);
  assert.doesNotMatch(explorer, /<script[^>]+three|<script[^>]+forge-viewer/);
});

test("la participation prépare un contact direct sans prétendre transmettre", async () => {
  const [html, script] = await Promise.all([read("participer/index.html"), read("script.js")]);
  assert.match(html, /action="mailto:contact@vestiges\.world"/);
  assert.match(html, /Aucune donnée n’est transmise au site/);
  assert.match(script, /Vestiges n’a rien reçu tant que vous ne l’avez pas envoyé/);
  assert.match(html, /name="website"/);
});

test("les interactions essentielles ont une alternative tactile ou linéaire", async () => {
  const explorer = await read("explorer/index.html");
  assert.match(explorer, /<button class="graph-node/);
  assert.match(explorer, /Chaque affirmation garde son statut/);
  assert.doesNotMatch(explorer, /onmouseover|onmouseenter/);
});
