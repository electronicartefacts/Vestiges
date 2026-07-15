# Vestiges — expérience publique

Mini-site statique de [Vestiges](https://vestiges.world), projet culturel et éditorial porté par [Electronic Artefacts](https://www.electronicartefacts.com/).

## Architecture publique

- `/` — comprendre Vestiges, voir une première relation et choisir la suite ;
- `/explorer/` — démonstration éditoriale puis relationnelle ;
- `/explorer/specimen/` — modèle de dossier individuel fictif ;
- `/artistes/` — projection, effort, rôles, garanties et limites pour les artistes et ateliers ;
- `/methode/` — co-construction, statuts, visibilité, correction et retrait ;
- `/participer/` — orientation et préparation d’un échange réel par e-mail ;
- `/a-propos/` — porteur, origine, stade actuel et horizons qualifiés.

Le site correspond à l’état de maturité **sans dossier public réel**. Tous les objets éditoriaux sont créés en CSS et explicitement identifiés comme démonstrations. Aucun asset de recherche à droits inconnus n’est publié.

## Choix d’expérience

L’introduction typographique est déterministe, courte, immédiatement évitable, mémorisée localement et rejouable. La réduction de mouvement donne accès à un état stable. La séquence publique utilise `matière → geste → œuvre → mémoire → relation → Vestiges` afin d’éviter de limiter le projet à la sculpture ou au monument.

Explorer commence par une lecture narrative, révèle une relation simple, puis ouvre une carte locale. Un registre linéaire porte les mêmes informations essentielles et constitue l’alternative accessible au graphe.

## Participation

Le Worker Cloudflare et sa base chiffrée restent dans `worker/`, mais leur mode public n’est pas encore ouvert. Le site ne doit jamais exposer le code du test propriétaire.

Dans l’état actuel, le formulaire public prépare un e-mail dans la messagerie de la personne. Il indique explicitement qu’aucune information n’est reçue avant l’envoi manuel. Quand les gates juridiques, opérationnelles et anti-abus seront fermées, cette surface pourra être reliée au Worker sans changer l’ordre cognitif du formulaire.

## Technique

- HTML, CSS et JavaScript natifs ;
- polices Inter et Newsreader locales, sous SIL Open Font License ;
- aucune dépendance client, aucun analytics, aucun modèle 3D ;
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

1. Remplacer le spécimen par un premier dossier uniquement après autorisation et revue des sources et droits.
2. Conserver l’étiquette de démonstration sur tout élément encore fictif.
3. Ajouter un index de dossiers seulement quand plusieurs dossiers réels existent.
4. N’ajouter recherche et filtres que lorsque le volume crée un besoin observable.
5. Garder lecture éditoriale, registre linéaire et graphe local comme trois profondeurs complémentaires.

## Contenus encore provisoires

- la preuve publique repose sur un spécimen abstrait ;
- le délai de réponse n’est pas promis ;
- le premier terrain n’est pas présenté comme lancé ;
- aucune citation ou partenaire n’est affiché ;
- la collecte chiffrée publique reste fermée ;
- les mentions juridiques complètes devront être validées avant son ouverture.
