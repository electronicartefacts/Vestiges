import { access, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const routes = ["/", "/programme-fondateur/", "/pour-qui/", "/artistes/", "/transmission/", "/organisations/", "/comment-ca-marche/", "/methode/", "/participer/", "/a-propos/", "/laboratoire/", "/explorer/", "/explorer/specimen/"];
const routeFile = (route) => join(root, route === "/" ? "index.html" : `${route.slice(1)}index.html`);

for (const route of routes) {
  const file = routeFile(route);
  await access(file);
  const html = await readFile(file, "utf8");
  const requirements = [
    [/<title>[^<]+<\/title>/, "un titre"],
    [/<meta name="description"/, "une description"],
    [/<meta name="theme-color" content="#ffffff">/, "une couleur de navigateur cohérente"],
    [/<link rel="canonical"/, "une URL canonique"],
    [/<h1[\s>]/, "un titre h1"],
    [/<main[\s>]/, "un contenu principal"]
  ];
  for (const [pattern, label] of requirements) {
    if (!pattern.test(html)) throw new Error(`${route} doit contenir ${label}.`);
  }
  const internalLinks = [...html.matchAll(/href="(\/[^"]*)"/g)].map((match) => match[1].split(/[?#]/)[0]).filter(Boolean);
  for (const link of internalLinks) {
    if (/\.[a-z0-9]+$/i.test(link)) {
      await access(join(root, link.slice(1)));
      continue;
    }
    await access(routeFile(link.endsWith("/") ? link : `${link}/`));
  }
}

for (const asset of ["styles.css", "styles.20260717a.css", "script.js", "script.20260717a.js", "theme-init.js", "theme-init.20260717a.js", "forge-viewer.js", "forge-viewer.20260716g.js", "robots.txt", "sitemap.xml", "assets/logo/vestiges-monogram.svg", "assets/logo/vestiges-favicon.png", "assets/logo/vestiges-monogram-og.png"]) {
  await access(join(root, asset));
}

console.log(`Site statique validé : ${routes.length} routes et leurs ressources essentielles.`);
