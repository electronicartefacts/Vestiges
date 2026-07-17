# Vestiges — expérience publique

Mini-site statique de [Vestiges](https://vestiges.world), projet culturel et éditorial porté par [Electronic Artefacts](https://www.electronicartefacts.com/).

## Architecture publique

- `/` — comprendre Vestiges, son résultat et choisir une intention ;
- `/pour-qui/` — s’orienter entre création, transmission et terrain culturel ;
- `/artistes/` — projection, effort, rôles, garanties et limites pour les artistes et ateliers ;
- `/transmission/` — recherche, médiation, enseignement et contribution critique ;
- `/organisations/` — cadrage d’un terrain pour institutions, collections et territoires ;
- `/comment-ca-marche/` — résultat du dossier et processus de co-construction ;
- `/methode/` — co-construction, statuts, visibilité, correction et retrait ;
- `/participer/` — orientation et préparation d’un échange réel par e-mail ;
- `/a-propos/` — porteur, origine, stade actuel et horizons qualifiés ;
- `/laboratoire/` — preuve technique FORGE avec **Bois flotté 01** ;
- `/explorer/` — emplacement réservé au futur corpus réel ;
- `/explorer/specimen/` — URL historique du dossier technique détaillé.

Le site correspond à l’état de maturité **premier prototype public, sans dossier d’artiste validé**. Bois flotté 01 est un sujet naturel sans artiste attribué. La capture, la reconstruction et les médias numériques sont attribués à Electronic Artefacts et ne sont pas déclarés dans le domaine public.

## Choix d’expérience

Les règles transversales de composition, typographie, couleur, interaction et responsive sont formalisées dans [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md).

L’introduction typographique est déterministe, courte, immédiatement évitable, mémorisée localement et rejouable. La réduction de mouvement donne accès à un état stable. La séquence publique utilise `matière → geste → œuvre → mémoire → relation → Vestiges` afin d’éviter de limiter le projet à la sculpture ou au monument.

Les titres éditoriaux utilisent un système typographique variable déterministe. Chaque mot conserve ses retours de ligne naturels ; une vague gaussienne de graisse suit le pointeur, réagit au toucher et accompagne la première apparition dans le viewport. Seul le `h1` conserve une respiration ambiante très légère. En réduction de mouvement, les titres restent entièrement statiques et ne sont pas découpés en glyphes.

Le contraste suit `prefers-color-scheme` : fond blanc et texte noir en mode clair, fond noir et texte blanc en mode sombre. Un contrôle circulaire présent dans chaque en-tête permet de basculer manuellement ; ce choix est mémorisé localement et prend priorité sur le réglage de l’appareil.

La direction visuelle associe noir, ivoire et un accent minéral rouge à des traces typographiques, axes et annotations. La preuve de laboratoire est une sortie locale de FORGE : un GLB de 67 Mo, 404 304 faces et un atlas de texture 8192 × 8192 pixels. « 8K » qualifie explicitement cet atlas, pas la vidéo source.

Le laboratoire révèle la chaîne vidéo → FORGE → modèle 3D après la compréhension du produit. À l’approche de la visionneuse, le GLB se charge sur un canvas transparent ; le chargement reste manuel quand l’économie de données ou une connexion 2G est détectée. Le dossier HTML détaillé demeure disponible sans WebGL.

## Participation

Le Worker Cloudflare et sa base chiffrée restent dans `worker/`, mais leur mode public n’est pas encore ouvert. Le site ne doit jamais exposer le code du test propriétaire.

Dans l’état actuel, le formulaire public prépare un e-mail dans la messagerie de la personne. Il indique explicitement qu’aucune information n’est reçue avant l’envoi manuel. Quand les gates juridiques, opérationnelles et anti-abus seront fermées, cette surface pourra être reliée au Worker sans changer l’ordre cognitif du formulaire.

## Technique

- HTML, CSS et JavaScript natifs ;
- polices Inter et Newsreader locales, sous SIL Open Font License ;
- aucune dépendance distante, aucun analytics ;
- Three.js est archivé localement sous licence MIT pour la vue 3D à la demande ;
- modèle GLB FORGE et manifeste de provenance conservés dans `assets/works/bois-flotte-01/` ;
- publication GitHub Pages ;
- URLs en répertoires pour des pages indexables ;
- contenu essentiel présent dans le HTML.

Lancer localement depuis ce dossier :

```text
python3 -m http.server 4173
```

Puis ouvrir `http://127.0.0.1:4173/`.

## Validation

```text
npm run validate
```

Cette commande vérifie la syntaxe JavaScript, les routes, les métadonnées, les liens et ressources internes, les contrats principaux du site, puis les tests existants du Worker.

## Évolution d’Explorer

1. Faire relire le statut de réutilisation du fichier numérique avant de proposer son téléchargement.
2. Conserver l’étiquette de prototype sur Bois flotté 01 et distinguer le sujet naturel de sa capture numérique.
3. Ajouter un index de dossiers seulement quand plusieurs dossiers réels existent.
4. N’ajouter recherche et filtres que lorsque le volume crée un besoin observable.
5. Garder lecture éditoriale, registre linéaire et graphe local comme trois profondeurs complémentaires.

## Contenus encore provisoires

- la preuve publique repose sur une première reconstruction technique, pas encore sur un dossier co-construit avec un artiste ;
- le délai de réponse n’est pas promis ;
- le premier terrain n’est pas présenté comme lancé ;
- aucune citation ou partenaire n’est affiché ;
- la collecte chiffrée publique reste fermée ;
- les mentions juridiques complètes devront être validées avant son ouverture.
