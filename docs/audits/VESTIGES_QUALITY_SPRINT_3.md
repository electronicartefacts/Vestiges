# VESTIGES WORLD — Sprint 3 · Qualité, UX et conversion

Date de l’audit : 11 octobre 2026

Périmètre : prototype statique `site/`, contrôles locaux et comparaison ponctuelle avec `https://vestiges.world/`.

## Verdict

Les corrections confirmées ont été appliquées sur la branche locale. Les parcours testés fonctionnent, les défauts de contraste et de nommage relevés par Lighthouse ont disparu, et le chargement du modèle 3D de 70,6 Mo attend désormais une action explicite. La mesure Lighthouse de performance reste faible et pratiquement inchangée ; elle ne permet pas de revendiquer un gain global. Le site public n’a pas été modifié : aucune publication, aucun push, commit ou déploiement n’a été effectué.

Vestiges reste un prototype de recherche statique. Les contrôles n’ont ajouté ni backend ni collecte de données.

## État Git et versions observées

- Dépôt Git de publication : `/Users/joeymarquet/Desktop/Projects/VESTIGES/site` (distinct du dépôt parent).
- Branche : `feat/vestiges-quality-sprint-3`.
- HEAD de départ : `9f378144674f7ad353eff9bb2a4f8d66622c5472`, identique à `origin/main` après `git fetch --all --prune`.
- L’arbre de travail était propre avant les changements. Les changements présents sont ceux de ce sprint et le rapport ci-dessous ; ils restent non commités.
- Site public observé le 11 octobre : HTTP 200, dernière modification annoncée le 11 octobre 2026 à 18:18:23 UTC. La page d’accueil publiée charge toujours `script.20261011c.js` et `styles.20261011c.css` et contient encore « Ancien Explorer ».
- Version locale analysée : copie de travail sur la même base Git, avec les corrections et de nouveaux assets versionnés `20261011d` / `20261011a`. Les anciennes routes et les anciens assets sont conservés.

Le décalage public/local est donc confirmé. Il ne s’agit pas d’une preuve que les changements sont en ligne.

## Problèmes confirmés et corrections

| Problème | Gravité | Cause | Correction | Vérification |
|---|---|---|---|---|
| Le pied de page promouvait encore « Ancien Explorer ». | Modérée | Lien historique conservé dans les pieds de page publics. | Retrait du lien de navigation ; routes historiques, canonicals et directives `noindex, follow` conservés. | Relecture des pages concernées, contrôle de `/explorer/` et de `/explorer/specimen/`, validation du site. |
| La page Artisan·es avait une numérotation répétée. | Faible | Deux sections portaient le numéro 03. | Progression éditoriale remise en séquence de 01 à 06. | Contrôle de la page et recherche des autres numérotations visées. |
| Le formulaire Participer affichait « Artistes et ateliers ». | Modérée | Libellé hérité, incohérent avec la terminologie retenue. | Remplacé par « Artisan·es et ateliers » ; les parcours historiques `artistes` et `artisans` continuent à sélectionner l’option canonique. | Tests des deux paramètres, des erreurs de formulaire, du retour arrière et de l’écran de récapitulatif. Les identifiants de données n’ont pas changé. |
| Le mode `Timeline` exposait un libellé anglais. | Faible | Libellé visible directement tiré du nom interne du mode. | Libellé visible remplacé par « Frise chronologique » ; identifiant interne `timeline` conservé. | Changement de vue et contrôle de l’état actif. |
| Le modèle 3D de l’accueil pouvait être chargé avant une demande explicite. | Élevée | Chargement lié à l’entrée dans la zone visible. | Suppression du déclenchement automatique ; chargement uniquement après activation du bouton. Ajout d’une taille cohérente avec le GLB réel : 70 623 668 octets, soit environ 71 Mo. | Aucun chargement réseau avant clic ou après simple défilement ; après clic, requête du GLB et canevas prêt. |
| La mosaïque chargeait son module et son modèle sans action claire. | Élevée | Initialisation du viewer à l’ouverture de la page. | Bouton explicite qui importe le viewer à la demande ; maintien en pause lorsque la mosaïque est hors écran et messages de repli en cas d’échec. | Aucun module ni GLB avant activation ; affichage du viewer après activation. Contrôle des erreurs console et CSP. |
| Les textures locales du GLB pouvaient être bloquées par la CSP. | Modérée | Schémas `blob:` absents des sources autorisées pour connexions et images. | Autorisation ciblée de `blob:` sur les quatre pages 3D concernées. | Chargement local des vues 3D sans erreur CSP ni erreur console. |
| Lighthouse signalait des défauts de contraste et des noms accessibles qui ne correspondaient pas aux textes visibles. | Modérée | Accent trop faible en thème sombre et `aria-label` remplaçant le nom fourni par le bouton visible. | Accent sombre renforcé ; retrait des noms ARIA redondants au profit du texte natif et déplacement des précisions vers `aria-description`. | Lighthouse local : contraste 7 → 0 éléments signalés ; divergence nom accessible/texte visible 15 → 0. Vérification clavier du graphe. |
| Les variations de graisse au survol des titres pouvaient sembler brusques et retomber alors que le pointeur restait dessus. | Modérée | Onde typographique ample, transition courte et remise à la graisse initiale dès que la première interpolation se stabilisait, même si le titre était toujours survolé. | Amplitude ramenée de 76 à 48 unités ; transition portée à 400 ms avec une courbe symétrique entrée/sortie. La graisse obtenue reste stable sous un pointeur immobile et revient à sa base après la sortie. Même courbe adoucie appliquée aux transitions typographiques des boutons et nœuds interactifs ; aucune taille de titre ne change pendant le survol, donc pas de déplacement de mise en page. | Contrôle du style calculé et des états au survol/à la sortie dans le navigateur local ; animations CSS neutralisées par `prefers-reduced-motion`. |
| Les cartes « histoire » et « invitation » de la mosaïque perdaient leur fond sombre ; à petite largeur, les colonnes et le bouton devenaient difficiles à lire. | Modérée | Règles génériques du widget plus spécifiques que les styles des cartes ; règles de hauteur qui prenaient le dessus sur la disposition étroite. | Spécificité des styles de cartes corrigée, sources empilées en petit format, bouton recentré et état séparé du bouton. | Capture locale à 390 px : texte lisible, bouton distinct de l’état, pas de débordement horizontal. Contrôles des interactions de redimensionnement. |

## Contrôles fonctionnels

- `npm run validate` : lint syntaxique, validation de la structure du site et tests Node ; résultat final indiqué après exécution ci-dessous.
- Playwright : accueil, Encyclopédie, Participer et Artisan·es, à 320, 390, 768 et 1280 px. Aucun débordement horizontal sur ces pages et tailles.
- Navigation : ouverture/fermeture du menu, fermeture avec Échap et restitution du focus au bouton.
- Encyclopédie : changement de modes, recherche, sélection et synchronisation du sujet, navigation au clavier du graphe, sélection mosaïque, déplacement et redimensionnement des blocs.
- Introduction : focus initial et fermeture ; en réduction de mouvement, piège de focus entre les boutons, retrait de `inert` et retour du focus au contenu principal.
- Formulaire : préselection via anciens paramètres, validation des champs, conservation des réponses en revenant à l’étape précédente et récapitulatif. Le parcours a été soumis uniquement dans le navigateur local ; le message préparé a été vérifié sans envoyer d’email et sans requête API.
- Visionneuses 3D : attente du clic, chargement à la demande et rendu prêt sur l’accueil et dans la mosaïque.
- Typographie : entrée/sortie du pointeur sur un titre animé et mode `prefers-reduced-motion` ; l’animation change la graisse sans modifier la taille ni déplacer la mise en page.

Les gestes tactiles ont été examinés dans les styles et états responsive, mais le navigateur automatisé utilisé exposait `navigator.maxTouchPoints = 0`. Un contrôle avec matériel tactile réel reste à faire. Aucun essai avec lecteur d’écran matériel n’est revendiqué.

## Lighthouse local : avant et après

Mesures mobile simulées sur la même URL locale : `http://127.0.0.1:4183/?parcours=artisans`, avec le même Chrome et les mêmes catégories Lighthouse. Elles ne mesurent pas le site public.

| Mesure | Avant | Après | Lecture |
|---|---:|---:|---|
| Performance | 61 | 61 | Aucun gain global démontré. |
| Accessibilité | 96 | 100 | Les audits automatiques concernés ne signalent plus les problèmes relevés. |
| Bonnes pratiques | 100 | 100 | Stable. |
| SEO | 100 | 100 | Stable ; score automatique, pas une garantie de référencement. |
| FCP | 6,5 s | 6,0 s | Amélioration mesurée, à confirmer sur répétitions. |
| LCP | 7,1 s | 7,1 s | Toujours lent ; aucune amélioration mesurée. |
| Speed Index | 6,5 s | 6,0 s | Amélioration mesurée, à confirmer. |
| TBT | 0 ms | 0 ms | Stable. |
| CLS | 0,015 | 0,007 | Plus faible sur cette paire de mesures. |
| Contrastes relevés | 7 | 0 | Corrigés pour les éléments détectés par cet audit. |
| Noms accessibles incohérents avec le texte visible | 15 | 0 | Corrigés pour les éléments détectés par cet audit. |

Le FCP et le Speed Index sont meilleurs sur cette paire de mesures, et le travail du thread principal estimé passe de 4,1 à 2,5 secondes. La performance globale reste à 61 et le LCP à 7,1 secondes ; aucun gain de performance de bout en bout n’est démontré. Le CSS et le JavaScript inutilisés estimés par Lighthouse restent autour de 80 KiB et 38 KiB. La page était servie par un serveur statique local sans la même compression ni les mêmes caches que l’hébergement public ; ces chiffres ne sont donc ni une comparaison de production ni une preuve d’amélioration reproductible. Le retard principal de rendu reste à diagnostiquer avant d’optimiser davantage les polices ou la typographie.

## Problèmes non reproduits et limites volontaires

- Les contrôles de formulaire observés n’ont produit aucune collecte ni appel API. L’absence de persistance et d’envoi serveur correspond au prototype statique ; ce n’est pas un défaut à corriger en ajoutant un backend.
- Aucun email n’a été envoyé. Le bouton prépare un message pour la messagerie de l’utilisateur.
- La mosaïque ne persiste pas les arrangements entre deux sessions ; cette limite reste celle du démonstrateur.
- Aucune défaillance générale de canonical, sitemap ou métadonnées SEO n’a été confirmée dans le périmètre de cette passe. Les routes historiques contrôlées restent accessibles.
- La performance mobile Lighthouse reste le principal problème ouvert. Aucune modification de police ou du modèle FORGE n’a été faite faute de preuve qu’elle corrigerait le LCP.

## Fichiers concernés

- HTML : `404.html`, `a-propos/index.html`, `approche/index.html`, `artisans/index.html`, `artistes/index.html`, `collaborations/index.html`, `comment-ca-marche/index.html`, `encyclopedie/index.html`, `explorer/index.html`, `explorer/specimen/index.html`, `index.html`, `laboratoire/index.html`, `marketplace/index.html`, `methode/index.html`, `organisations/index.html`, `participer/index.html`, `pour-qui/index.html`, `programme-fondateur/index.html`, `transmission/index.html`.
- Code et documentation : `README.md`, `script.js`, `styles.css`, `mosaic-specimen-viewer.js`, `package.json`, `tests/site.test.mjs`.
- Nouveaux assets versionnés : `script.20261011d.js`, `styles.20261011d.css`, `mosaic-specimen-viewer.20261011a.js`.

## Suite recommandée

1. Mesurer le LCP en production et en local reproductible, en identifiant précisément l’élément LCP et le temps serveur ; répéter les mesures avant tout changement de chargement critique.
2. Tester la mosaïque sur un vrai écran tactile et les principaux parcours avec un lecteur d’écran.
3. Après revue des changements, organiser séparément la publication des nouveaux assets versionnés ; ce rapport ne constitue pas une publication.

## Publication

Arrêt avant toute publication conformément au périmètre demandé. Aucun commit, push, merge, changement d’hébergement ou déploiement n’a été effectué.

## Complément de suivi — images et LCP (11 octobre 2026)

La trace Lighthouse identifie toujours l’image d’accueil comme élément LCP : `section.focus-banner > div.focus-banner__image > picture > img`. L’image reste directement découvrable dans le HTML et reçoit `fetchpriority="high"`. Des variantes WebP versionnées réduisent son transfert mobile de 68 064 à 40 999 octets, sans retirer les variantes antérieures ni le repli PNG.

La texture de bois secondaire a aussi été convertie en WebP versionné : 50 810 octets au lieu de 65 688. Les règles `image-set()` gardent le JPEG comme repli et servent le WebP aux navigateurs compatibles. Le rendu de l’image compressée a été comparé visuellement à la source. L’audit Lighthouse ne signale plus d’économie d’image restante dans ce parcours.

| Mesure locale | Passe précédente | Après images | Lecture |
|---|---:|---:|---|
| Performance mobile | 61 | 61 | Inchangée |
| Accessibilité / bonnes pratiques / SEO | 100 / 100 / 100 | 100 / 100 / 100 | Inchangés |
| FCP | 6,5 s | 6,5 s | Inchangé |
| LCP | 6,9 s | 6,8 s | Écart trop faible pour conclure à un gain reproductible |
| CLS / TBT | 0,009 / 0 ms | 0,009 / 0 ms | Inchangés |

Cette mesure utilise le serveur statique local, sans la compression ni les caches du serveur public. Lighthouse y estime encore environ 5,15 s d’économie possible sur les ressources bloquantes, principalement la feuille CSS et l’initialisation du thème. Il faut mesurer avec un serveur de préproduction configuré comme l’hébergement avant de modifier leur chargement : cette passe ne prouve pas une amélioration de performance globale, et ne constitue pas une mesure du site publié.

La validation locale passe à 52 tests réussis sur 52. Le nouvel asset est `assets/textures/wood-20261011a.webp` ; la feuille active devient `styles.20261011e.css`. Aucun commit, push ou déploiement n’a été effectué.
