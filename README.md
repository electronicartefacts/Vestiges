# Vestiges — artisanat, pièces, savoir-faire et collaborations

## Travailler sur le projet

Ce dépôt public contient le **site d’acquisition et de pré-lancement Vestiges**, ses démonstrations éditoriales/visuelles et les éléments de gouvernance qui peuvent être rendus publics sans risque. Ce n’est pas le produit complet ni le moteur VAST, développé séparément. Le site sert aussi de terrain d’apprentissage marketing en direct ; les acquis utiles (langage, principes graphiques, composants, accessibilité) pourront ensuite être transmis au produit selon une interface à définir.

Pour lancer les contrôles et contribuer au site, consulter [`CONTRIBUTING.md`](CONTRIBUTING.md). Ne jamais ajouter de coordonnées de prospects, de verbatims identifiants, de notes brutes d’entretien, de secrets ou de documents confidentiels au dépôt public.

Avant toute édition, vérifier `git status` et préserver les changements locaux déjà présents. Aucun commit ou publication n’est implicite dans une demande de rédaction ou d’implémentation.

Mini-site statique de [Vestiges](https://vestiges.world), projet culturel et éditorial porté par [Electronic Artefacts](https://www.electronicartefacts.com/). Vestiges réunit quatre ambitions : une vitrine pour découvrir les artisan·es et leurs pièces, une marketplace en préparation, une encyclopédie des savoir-faire et des collaborations avec les personnes et lieux qui les font vivre.

## Architecture publique

- `/` — accueil et présentation des quatre piliers ;
- `/artisans/` — vitrine artisanale et invitation à co-produire au moins deux cas réels ;
- `/encyclopedie/` — démonstrateur à sept vues partageant une recherche et un sujet actif, avec une mosaïque recomposable ; les exemples ne constituent pas un corpus vérifié ;
- `/collaborations/` — point d’entrée pour les artisan·es, la recherche/transmission, les futurs clients et les organismes ;
- `/approche/` — principes de co-construction, de sources, de relecture et de visibilité ;
- `/marketplace/` — présentation de l’espace de vente à venir, sans produits tant que les offres réelles ne sont pas prêtes.

Les pages historiques restent accessibles en liens secondaires dans le pied de page : `/programme-fondateur/`, `/pour-qui/`, `/comment-ca-marche/`, `/transmission/`, `/organisations/`, `/artistes/`, `/methode/`, `/participer/`, `/a-propos/`, `/laboratoire/`, `/explorer/` et `/explorer/specimen/`. Aucune route historique n’a été supprimée ou redirigée dans cette première version.

L’accueil commence par une présentation visuelle et quatre portes de découverte, puis propose une **constellation éditoriale** de douze exemples de démonstration. Son jeu de données est isolé dans `exploration-data.js` ; il ne décrit aucun dossier réel et pourra être remplacé par une projection de VAST sans réécrire la couche d’interaction. Un aperçu photo utilise la recherche et les médias de l’encyclopédie, avec un mot-clé conservé vers la grille. Sur mobile, les quatre portes se parcourent dans un carrousel horizontal natif.

Le site correspond à l’état de maturité **premier prototype public**. Les premiers portraits et dossiers sont à construire avec des artisan·es. La marketplace n’est pas encore ouverte. Bois flotté 01 est un sujet naturel sans praticien attribué. La capture, la reconstruction et les médias numériques sont attribués à Electronic Artefacts et ne sont pas déclarés dans le domaine public.

## Choix d’expérience

Les règles transversales de composition, typographie, couleur, interaction et responsive sont formalisées dans [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md).

L’introduction typographique est déterministe, courte, immédiatement évitable, mémorisée localement et rejouable. La réduction de mouvement donne accès à un état stable. La séquence publique utilise `matière → geste → pièce → mémoire → rencontre → Vestiges` afin d’éviter de limiter le projet à la sculpture ou au monument.

Les titres éditoriaux utilisent un système typographique variable déterministe. Chaque mot conserve ses retours de ligne naturels ; une vague gaussienne de graisse suit le pointeur, réagit au toucher et accompagne la première apparition dans le viewport. Les variations se stabilisent après leur apparition ou leur interaction ; elles s’arrêtent lorsque l’onglet est masqué. En réduction de mouvement, les titres restent entièrement statiques ; une activation de cette préférence en cours de session stabilise aussi les glyphes déjà créés.

Le contraste suit `prefers-color-scheme` : fond blanc et texte noir en mode clair, fond noir et texte blanc en mode sombre. Un contrôle circulaire présent dans chaque en-tête permet de basculer manuellement ; ce choix est mémorisé localement et prend priorité sur le réglage de l’appareil.

La direction visuelle associe noir, ivoire et un accent minéral rouge à des traces typographiques, axes et annotations. La preuve de laboratoire est une sortie locale de FORGE : un GLB de 70,6 Mo (environ 71 Mo), 404 304 faces et un atlas de texture 8192 × 8192 pixels. « 8K » qualifie explicitement cet atlas, pas la vidéo source.

Le laboratoire révèle la chaîne vidéo → FORGE → modèle 3D après la compréhension du produit. Le GLB d’environ 71 Mo ne se charge qu’après activation explicite de la commande 3D. La scène s’arrête hors écran, et le dossier HTML détaillé demeure disponible sans WebGL.

## Les sept vues de l’encyclopédie

La page `/encyclopedie/` conserve une entrée sélectionnée entre sept vues : **Texte**, **Grille**, **Frise chronologique**, **Monde**, **Relations**, **Comparer** et **Composition**. L’URL contient le mode, l’identifiant de l’entrée, les filtres appliqués et les identifiants comparés. Les critères de recherche sont locaux ; aucune API de collecte n’est appelée.

- Texte : couverture, lecture éditoriale, questions d’observation, relations et références.
- Grille : huit images locales, avec visionneuse, navigation clavier et notices. Le lecteur prend aussi en charge les médias vidéo ; aucun fichier vidéo n’est présent dans cette sélection.
- Frise : tous les repères datés associés aux entrées du graphe, triables et filtrables autour de l’entrée. Les occurrences d’un même document sont regroupées sans perdre les entrées associées ; cinq repères uniques sont sourcés dans le catalogue actuel. Les dates situent un objet ou un événement, jamais une origine supposée d’une pratique.
- Monde : carte SVG locale de Natural Earth, zoom et sélection des pays, lieux documentés ou rapportés explicitement qualifiés. Les points sont des repères de pays, sans localisation précise inventée.
- Relations : langage visuel de la carte d’accueil, étendu aux entrées filtrées du catalogue.
- Comparer : deux ou trois entrées, critères partagés, informations manquantes visibles et option pour ne lire que les différences.
- Composition : bibliothèque de widgets incluant la carte et la comparaison, ainsi qu’un modèle 3D optionnel associé à Bois, avec bibliothèque, presets, déplacement, redimensionnement et commandes clavier. Le modèle reste chargé à la demande et ses ressources sont libérées lorsque le widget est retiré.

Les notices et repères sont séparés du rendu dans `encyclopedia-records.js` et `encyclopedia-catalog.js`. Le catalogue comporte vingt entrées, séparées par nature : pratiques, matières, œuvres/objets, artistes historiques, mouvements et articles. Les produits disposent d’un état vide ; aucune offre n’est inventée. Les facettes nature, pratique, période, lieu, matière et style sont partagées par toutes les vues, avec résultats regroupés et état vide explicite. La carte et la comparaison peuvent aussi être ajoutées à une composition. Les filtres géographiques portent sur le rôle du lieu associé à une référence, jamais sur une origine universelle attribuée à un savoir-faire. Les trois images de collection sont issues du Met Open Access, déclarées dans le domaine public, avec attribution, URL et provenance locale dans `assets/encyclopedia/provenance.json`. Les autres médias sont qualifiés comme textures ou démonstrations. Le fond de carte, ses coordonnées de repérage et ses conditions de réutilisation sont documentés dans `assets/encyclopedia/world-map-provenance.json`. Aucun service de tuiles distant ni géolocalisation de l’appareil n’est utilisé. La composition conserve son ordre et ses formats pendant la visite ; elle n’est pas enregistrée après rechargement.

## Participation

Le Worker Cloudflare et sa base chiffrée restent dans `worker/`, mais leur mode public n’est pas encore ouvert. Le site ne doit jamais exposer le code du test propriétaire.

Dans l’état actuel, le formulaire public prépare un e-mail en quatre étapes dans la messagerie de la personne. Les choix couvrent artisan·es/ateliers, recherche/transmission, institutions/territoires, intérêt d’achat futur et autre demande. Il indique explicitement qu’aucune information n’est reçue avant l’envoi manuel et permet de copier le message si aucun client e-mail ne s’ouvre. Une arrivée depuis une invitation ou une page de rôle masque les détours d’orientation déjà parcourus. Une demande ne vaut ni inscription à une liste d’e-mails ni autorisation de publication. Quand les gates juridiques, opérationnelles et anti-abus seront fermées, cette surface pourra être reliée au Worker sans changer l’ordre cognitif du formulaire.

Le parcours émet des événements `vestiges:journey` uniquement dans la page, sans réseau, cookie, stockage persistant ni contenu personnel. `?qa=1` les expose en mémoire dans `window.VESTIGES_QA_EVENTS` pour les tests modérés. Ce mécanisme n’est pas un outil d’analytics et n’autorise aucune collecte distante.

La page `Comment ça marche` contient une anatomie de dossier explicitement présentée comme prototype de structure. Elle montre le livrable attendu sans fabriquer de cas, d’artisan, d’institution ou de partenariat réel.

## Technique

- HTML, CSS et JavaScript natifs ;
- polices Inter et Newsreader locales, sous SIL Open Font License, avec sous-ensembles et fichiers originaux complémentaires ; voir [`assets/fonts/README.md`](assets/fonts/README.md) ;
- aucune dépendance distante, aucun analytics ;
- Three.js est archivé localement sous licence MIT pour la vue 3D à la demande ;
- modèle GLB FORGE et manifeste de provenance conservés dans `assets/works/bois-flotte-01/` ;
- GitHub Pages publie la racine de la branche `main` sur `vestiges.world`, avec HTTPS forcé ;
- URLs en répertoires pour des pages indexables ;
- contenu essentiel présent dans le HTML.

Lancer localement depuis ce dossier :

```text
python3 -m http.server 4173
```

Puis ouvrir `http://127.0.0.1:4173/`. Les prérequis et le parcours de contribution sont détaillés dans [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Validation

```text
npm run validate
```

Cette commande vérifie la syntaxe JavaScript, les routes, les métadonnées, les liens et ressources internes, les contrats principaux du site, puis les tests existants du Worker.

Le même contrôle s’exécute automatiquement sur les pushs et pull requests via GitHub Actions. Cette automatisation n’est pas une revue des droits médias ni une validation du déploiement. Le dépôt ne déclare pas encore de licence générale ; voir [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Horizon éditorial et économique

Vestiges s’organise autour de quatre piliers complémentaires : la vitrine artisanale, la marketplace, l’encyclopédie et la collaboration. Aujourd’hui, le site présente le projet et ses démonstrations, et prépare les premiers portraits et dossiers avec des artisan·es. La marketplace n’est pas encore ouverte. Les partenariats, les collaborations et un éventuel réseau d’ambassadeur·ices se construiront avec les premiers usages.

Ces fonctions ne sont pas encore actives. Elles doivent prolonger l’encyclopédie et rester séparées des décisions d’attribution, de publication, de correction et de retrait.

## Évolution d’Explorer

1. Faire relire le statut de réutilisation du fichier numérique avant de proposer son téléchargement.
2. Conserver l’étiquette de prototype sur Bois flotté 01 et distinguer le sujet naturel de sa capture numérique.
3. Ajouter un index de dossiers seulement quand plusieurs dossiers réels existent.
4. N’ajouter recherche et filtres que lorsque le volume crée un besoin observable.
5. Garder lecture éditoriale, registre linéaire et graphe local comme trois profondeurs complémentaires.

## Contenus encore provisoires

- la preuve publique repose sur une première reconstruction technique, pas encore sur un dossier co-construit avec un artisan ;
- le délai de réponse n’est pas promis ;
- le premier terrain n’est pas présenté comme lancé ;
- aucun ambassadeur, partenaire institutionnel ou dossier d’artisan n’est affiché ;
- la collecte chiffrée publique reste fermée ;
- les mentions juridiques complètes devront être validées avant son ouverture.

## Lecture et navigation

Les pages secondaires proposent un fil d’Ariane visible, repris en `BreadcrumbList` pour les treize pages secondaires canoniques indexables. Le validateur contrôle leur concordance avec le HTML et les URL canoniques. L’encyclopédie garde trois références de collection lisibles en HTML, avec images, dates et sources ; ses commandes interactives s’affichent après initialisation. Le formulaire conserve les réponses pendant la visite, donne accès au texte exact à copier avant ouverture de la messagerie et réserve cette ouverture à la quatrième étape.
