import { access, readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const origin = "https://vestiges.world";
const routes = [
  "/", "/artisans/", "/encyclopedie/", "/collaborations/", "/approche/", "/marketplace/",
  "/programme-fondateur/", "/pour-qui/", "/artistes/", "/transmission/", "/organisations/",
  "/comment-ca-marche/", "/methode/", "/participer/", "/a-propos/", "/laboratoire/",
  "/explorer/", "/explorer/specimen/"
];
const aliases = new Map([
  ["/artistes/", "/artisans/"],
  ["/methode/", "/approche/"]
]);
const nonIndexableRoutes = new Set(["/explorer/", "/explorer/specimen/"]);
const routeFile = (route) => join(root, route === "/" ? "index.html" : `${route.slice(1)}index.html`);
const fail = (message) => { throw new Error(message); };

function decodeEntities(value) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([\da-f]+);/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)));
}

function attributes(tag) {
  const result = new Map();
  const source = tag.replace(/^<[A-Za-z][^\s/>]*/, "").replace(/\/?\s*>$/, "");
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    result.set(match[1].toLowerCase(), decodeEntities(match[2] ?? match[3] ?? match[4] ?? ""));
  }
  return result;
}

function tags(html, name) {
  const pattern = new RegExp(`<${name}\\b[^>]*>`, "gi");
  return [...html.matchAll(pattern)].map((match) => ({ tag: match[0], attrs: attributes(match[0]) }));
}

function singleTag(html, name, predicate, label, route) {
  const found = tags(html, name).filter(({ attrs }) => predicate(attrs));
  if (found.length !== 1) fail(`${route} doit contenir exactement un ${label} (trouvé : ${found.length}).`);
  return found[0];
}

function textContent(fragment) {
  return decodeEntities(fragment.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim());
}

function headingInfo(html, route) {
  const headings = [...html.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)].map((match) => ({
    level: Number(match[1][1]),
    text: textContent(match[2])
  }));
  const h1s = headings.filter(({ level }) => level === 1);
  if (h1s.length !== 1) fail(`${route} doit contenir exactement un H1 (trouvé : ${h1s.length}).`);
  if (headings[0]?.level !== 1) fail(`${route} doit commencer sa hiérarchie de titres par un H1.`);
  for (let index = 1; index < headings.length; index += 1) {
    if (headings[index].level > headings[index - 1].level + 1) {
      fail(`${route} saute du H${headings[index - 1].level} au H${headings[index].level}.`);
    }
  }
  return { headings, h1: h1s[0].text };
}

function routeFromPath(pathname) {
  if (pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function isStaticFile(pathname) {
  return /\.[a-z0-9]{1,10}$/i.test(pathname);
}

async function verifyLocalReference(reference, pageRoute, label) {
  if (!reference || /^(?:data:|mailto:|tel:|javascript:|blob:)/i.test(reference)) return;
  let resolved;
  try {
    resolved = new URL(reference, new URL(pageRoute, origin));
  } catch {
    fail(`${pageRoute} contient une référence invalide pour ${label} : ${reference}`);
  }
  if (resolved.origin !== origin) return;

  let pathname;
  try {
    pathname = decodeURIComponent(resolved.pathname);
  } catch {
    fail(`${pageRoute} contient une URL encodée invalide pour ${label} : ${reference}`);
  }
  const hasExplicitPath = !reference.startsWith("#") && !reference.startsWith("?");
  if (label === "lien interne" && hasExplicitPath && [...aliases.keys()].some((alias) => pathname === alias || pathname.startsWith(alias))) {
    fail(`${pageRoute} lie encore l’ancienne route ${pathname} (${reference}) au lieu de sa canonique.`);
  }

  const filePath = isStaticFile(pathname)
    ? resolve(root, `.${pathname}`)
    : routeFile(routeFromPath(pathname));
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) fail(`${pageRoute} sort du site avec ${reference}.`);
  try {
    await access(filePath);
  } catch {
    fail(`${pageRoute} référence une ressource ou une route absente : ${reference}`);
  }
}

function noindexFor(html, route) {
  const robots = tags(html, "meta").filter(({ attrs }) => attrs.get("name")?.toLowerCase() === "robots");
  if (robots.length > 1) fail(`${route} contient plusieurs balises robots.`);
  return (robots[0]?.attrs.get("content") ?? "").split(/[\s,]+/).some((token) => token.toLowerCase() === "noindex");
}

function schemaBlocks(html, route) {
  const blocks = [];
  for (const match of html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi)) {
    if (attributes(match[0].slice(0, match[0].indexOf(">") + 1)).get("type")?.toLowerCase() !== "application/ld+json") continue;
    const body = match[0].replace(/^<script\b[^>]*>/i, "").replace(/<\/script\s*>$/i, "").trim();
    try {
      blocks.push(JSON.parse(body));
    } catch (error) {
      fail(`${route} contient un JSON-LD invalide : ${error.message}`);
    }
  }
  return blocks;
}

const pages = new Map();
for (const route of routes) {
  const file = routeFile(route);
  try {
    await access(file);
  } catch {
    fail(`Route conservée manquante : ${route}`);
  }
  const html = await readFile(file, "utf8");
  const titleTags = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/gi)];
  if (titleTags.length !== 1 || !textContent(titleTags[0][1])) fail(`${route} doit contenir un titre non vide unique.`);
  const description = singleTag(html, "meta", (attrs) => attrs.get("name")?.toLowerCase() === "description", "meta description", route).attrs.get("content");
  if (!description?.trim()) fail(`${route} doit contenir une meta description non vide.`);
  const canonical = singleTag(html, "link", (attrs) => attrs.get("rel")?.toLowerCase().split(/\s+/).includes("canonical"), "lien canonical", route).attrs.get("href");
  const expectedCanonical = `${origin}${aliases.get(route) ?? route}`;
  if (canonical !== expectedCanonical) fail(`${route} doit avoir la canonique ${expectedCanonical} (trouvé : ${canonical ?? "absent"}).`);
  const ogUrl = singleTag(html, "meta", (attrs) => attrs.get("property")?.toLowerCase() === "og:url", "URL Open Graph", route).attrs.get("content");
  if (ogUrl !== canonical) fail(`${route} doit aligner og:url sur sa canonique.`);

  const language = tags(html, "html")[0]?.attrs.get("lang")?.toLowerCase();
  if (language !== "fr") fail(`${route} doit annoncer lang="fr".`);
  const headings = headingInfo(html, route);
  const isNoindex = noindexFor(html, route);
  if (isNoindex !== nonIndexableRoutes.has(route)) fail(`${route} a un état noindex inattendu.`);
  if (!/<main\b/i.test(html)) fail(`${route} doit contenir un contenu principal.`);

  const title = textContent(titleTags[0][1]);
  pages.set(route, { html, title, description, canonical, h1: headings.h1, isNoindex });

  for (const { attrs } of tags(html, "a")) {
    const href = attrs.get("href");
    if (href) await verifyLocalReference(href, route, "lien interne");
  }

  for (const name of ["img", "source", "script", "link", "video", "audio", "iframe", "model-viewer"]) {
    for (const { attrs } of tags(html, name)) {
      if (name === "link" && attrs.get("rel")?.toLowerCase().split(/\s+/).includes("canonical")) continue;
      for (const attribute of ["src", "poster", "data-model-src", "data-src"]) {
        const value = attrs.get(attribute);
        if (value) await verifyLocalReference(value, route, "ressource interne");
      }
      const sourceSet = attrs.get("srcset");
      if (sourceSet) {
        for (const candidate of sourceSet.split(",")) {
          const value = candidate.trim().split(/\s+/)[0];
          if (value) await verifyLocalReference(value, route, "ressource srcset");
        }
      }
      if (name === "link" && attrs.get("href")) await verifyLocalReference(attrs.get("href"), route, "ressource interne");
    }
  }
}

// Canonical collisions are permitted only for the two declared, preserved aliases.
const canonicalOwners = new Map();
for (const [route, page] of pages) {
  const owners = canonicalOwners.get(page.canonical) ?? [];
  owners.push(route);
  canonicalOwners.set(page.canonical, owners);
}
for (const [canonical, owners] of canonicalOwners) {
  if (owners.length <= 1) continue;
  const allowed = [...aliases].some(([alias, target]) =>
    owners.length === 2 && owners.includes(alias) && owners.includes(target) && pages.get(target)?.canonical === canonical
  );
  if (!allowed) fail(`Canonique dupliquée sans alias déclaré : ${canonical} (${owners.join(", ")}).`);
}

// Search descriptions must be distinct among canonical indexable pages; aliases intentionally reuse their destination's copy.
const descriptionOwners = new Map();
for (const [route, page] of pages) {
  if (page.isNoindex || aliases.has(route)) continue;
  const normalized = page.description.replace(/\s+/g, " ").trim().toLocaleLowerCase("fr");
  const owners = descriptionOwners.get(normalized) ?? [];
  owners.push(route);
  descriptionOwners.set(normalized, owners);
}
for (const owners of descriptionOwners.values()) {
  if (owners.length > 1) fail(`Meta descriptions dupliquées entre pages canoniques : ${owners.join(", ")}.`);
}

const titleOwners = new Map();
for (const [route, page] of pages) {
  if (page.isNoindex || aliases.has(route)) continue;
  const normalized = page.title.replace(/\s+/g, " ").trim().toLocaleLowerCase("fr");
  const owners = titleOwners.get(normalized) ?? [];
  owners.push(route);
  titleOwners.set(normalized, owners);
}
for (const owners of titleOwners.values()) {
  if (owners.length > 1) fail(`Titres dupliqués entre pages canoniques : ${owners.join(", ")}.`);
}

const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => decodeEntities(match[1].trim()));
if (!sitemapUrls.length) fail("Le sitemap doit contenir au moins une URL.");
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail("Le sitemap contient des URL dupliquées.");
for (const url of sitemapUrls) {
  let parsed;
  try { parsed = new URL(url); } catch { fail(`URL invalide dans le sitemap : ${url}`); }
  if (parsed.origin !== origin || parsed.search || parsed.hash || !parsed.pathname.endsWith("/")) {
    fail(`URL non canonique dans le sitemap : ${url}`);
  }
  if (!pages.has(parsed.pathname) || pages.get(parsed.pathname).isNoindex || aliases.has(parsed.pathname)) {
    fail(`URL non indexable ou alias présent dans le sitemap : ${url}`);
  }
  if (pages.get(parsed.pathname).canonical !== url) fail(`Le sitemap ne suit pas la canonique de ${parsed.pathname}.`);
}
const expectedSitemap = [...pages]
  .filter(([route, page]) => !page.isNoindex && !aliases.has(route))
  .map(([, page]) => page.canonical)
  .sort();
if ([...sitemapUrls].sort().join("\n") !== expectedSitemap.join("\n")) {
  fail("Le sitemap doit contenir exactement les pages indexables canoniques, une seule fois chacune.");
}
const robots = await readFile(join(root, "robots.txt"), "utf8");
if (!/^User-agent:\s*\*/im.test(robots) || !/^Allow:\s*\//im.test(robots) || !/^Sitemap:\s*https:\/\/vestiges\.world\/sitemap\.xml\s*$/im.test(robots)) {
  fail("robots.txt doit autoriser l’exploration et pointer vers le sitemap vérifié.");
}

// Validate the deliberately small JSON-LD vocabulary against visible page content.
let websiteCount = 0;
for (const [route, page] of pages) {
  const blocks = schemaBlocks(page.html, route);
  const shouldHaveSchema = !page.isNoindex && !aliases.has(route);
  if (blocks.length !== (shouldHaveSchema ? 1 : 0)) {
    fail(`${route} doit contenir ${shouldHaveSchema ? "un" : "aucun"} bloc JSON-LD.`);
  }
  if (!shouldHaveSchema) continue;
  const data = blocks[0];
  if (data["@context"] !== "https://schema.org") fail(`${route} doit déclarer le contexte Schema.org.`);
  const entities = Array.isArray(data["@graph"]) ? data["@graph"] : [data];
  const allowedTypes = new Set(["WebSite", "WebPage", "AboutPage", "BreadcrumbList"]);
  if (entities.some((entity) => !allowedTypes.has(entity["@type"]))) fail(`${route} contient un type JSON-LD non qualifié.`);
  if (entities.some((entity) => entity["@type"] === "Organization" || (Array.isArray(entity["@type"]) && entity["@type"].includes("Organization")))) {
    fail(`${route} ne peut pas déclarer Organization avant vérification de l’entité porteuse.`);
  }
  const breadcrumbs = entities.filter(entity => entity["@type"] === "BreadcrumbList");
  if (breadcrumbs.length !== (route === "/" ? 0 : 1)) fail(`${route} doit décrire son fil d’Ariane visible.`);
  if (breadcrumbs.length) {
    const visible = page.html.match(/<nav class="breadcrumbs"[^>]*>([\s\S]*?)<\/nav>/)?.[1] || "";
    const names = [...visible.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(match => textContent(match[1]));
    const items = breadcrumbs[0].itemListElement;
    if (!Array.isArray(items) || items.length < 2 || items.length !== names.length) fail(`${route} a un fil d’Ariane incomplet.`);
    items.forEach((item, index) => {
      if (item["@type"] !== "ListItem" || item.position !== index + 1 || item.name !== names[index]) fail(`${route} désaligne le fil d’Ariane visible et structuré.`);
      if (!pages.has(new URL(item.item).pathname) || !item.item.startsWith(`${origin}/`)) fail(`${route} référence une page absente dans son fil d’Ariane.`);
    });
    if (items[0].item !== `${origin}/` || items.at(-1).item !== page.canonical) fail(`${route} a un fil d’Ariane non canonique.`);
  }
  const websites = entities.filter((entity) => entity["@type"] === "WebSite");
  const webPages = entities.filter((entity) => entity["@type"] === "WebPage" || entity["@type"] === "AboutPage");
  if (webPages.length !== 1) fail(`${route} doit décrire exactement une WebPage.`);
  if ((route === "/" && websites.length !== 1) || (route !== "/" && websites.length !== 0)) {
    fail(`${route} doit présenter WebSite uniquement sur l’accueil.`);
  }
  if (websites.length) {
    websiteCount += websites.length;
    const website = websites[0];
    if ("@id" in website || "identifier" in website || website.url !== `${origin}/` || website.name !== "Vestiges" || website.inLanguage !== "fr") {
      fail("La déclaration WebSite doit correspondre au nom, au domaine et à la langue vérifiés.");
    }
  }
  const webPage = webPages[0];
  const expectedType = route === "/a-propos/" ? "AboutPage" : "WebPage";
  if (webPage["@type"] !== expectedType) fail(`${route} doit utiliser le type ${expectedType}.`);
  if ("@id" in webPage || "identifier" in webPage || webPage.url !== page.canonical) {
    fail(`${route} doit rattacher son JSON-LD à la canonique.`);
  }
  if (webPage.name !== page.h1 || webPage.description !== page.description || webPage.inLanguage !== "fr") {
    fail(`${route} doit aligner le JSON-LD sur son H1, sa description et sa langue visibles.`);
  }
  if (webPage.isPartOf?.["@type"] !== "WebSite" || webPage.isPartOf?.name !== "Vestiges" || webPage.isPartOf?.url !== `${origin}/`) {
    fail(`${route} doit rattacher la page au site vérifié sans inventer d’identifiant.`);
  }
}
if (websiteCount !== 1) fail(`Le site doit déclarer exactement un WebSite (trouvé : ${websiteCount}).`);

for (const asset of [
  "styles.css", "styles.20261011g.css", "script.js", "script.20261011d.js", "theme-init.js", "theme-init.20260718b.js",
  "forge-viewer.js", "forge-viewer.20260716g.js", "robots.txt", "sitemap.xml", "assets/logo/vestiges-monogram.svg",
  "assets/logo/vestiges-favicon.png", "assets/logo/vestiges-monogram-og.png", "assets/textures/wood.jpg", "assets/textures/wood-20261011a.webp", "assets/editorial/atelier-relations-v1.png",
  "assets/editorial/atelier-relations-v1-640.webp", "assets/editorial/atelier-relations-v1-960.webp",
  "assets/editorial/atelier-relations-v1-1536.webp", "assets/editorial/atelier-relations-v1-640-20261011a.webp",
  "assets/editorial/atelier-relations-v1-960-20261011a.webp", "assets/editorial/atelier-relations-v1-1536-20261011a.webp",
  "assets/works/bois-flotte-01/bois-flotte-01-poster.png"
]) {
  try { await access(join(root, asset)); } catch { fail(`Ressource essentielle absente : ${asset}`); }
}

console.log(`Site statique validé : ${routes.length} routes, ${sitemapUrls.length} URL canoniques au sitemap, alias conservés, titres, métadonnées, liens, ressources et JSON-LD cohérents.`);
