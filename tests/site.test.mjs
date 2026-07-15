import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("l’accueil donne la définition, le public, le résultat et un CTA réel", async () => {
  const html = await read("index.html");
  assert.match(html, /artistes, artisans et ateliers/);
  assert.match(html, /gestes, matières, lieux, sources et histoires/);
  assert.match(html, /Couverture éditoriale/);
  assert.match(html, /href="\/explorer\/"/);
});

test("Explorer identifie explicitement le spécimen comme fictif", async () => {
  const [explorer, dossier] = await Promise.all([read("explorer/index.html"), read("explorer/specimen/index.html")]);
  assert.match(explorer, /Les objets, récits et relations de ce spécimen sont fictifs/);
  assert.match(dossier, /ne décrit aucune œuvre, personne, source ou atelier réel/);
  assert.match(explorer, /Lecture éditoriale/);
  assert.match(explorer, /Lecture relationnelle/);
  assert.match(explorer, /Registre/);
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
  assert.match(explorer, /Chaque lien doit pouvoir s’expliquer/);
  assert.doesNotMatch(explorer, /onmouseover|onmouseenter/);
});
