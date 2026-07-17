# Invariants de l’expérience publique

Ce document décrit le système déjà exprimé par le site. Il ne constitue pas une direction parallèle : toute évolution doit pouvoir être expliquée par ces invariants ou documenter explicitement pourquoi elle y déroge.

## 1. Une structure éditoriale, pas une interface de catalogue

- La page commence par une proposition compréhensible, puis ouvre des profondeurs de lecture.
- Les grands titres donnent le rythme ; les textes sans-serif apportent les faits, limites et actions.
- La technologie reste après la compréhension du produit, sauf dans le Laboratoire et le dossier technique.
- Les bordures structurent les groupes. Les ombres, cartes flottantes et effets décoratifs ne constituent pas la grammaire du site.

## 2. Une palette binaire, un accent rare

- `--paper` et `--ink` portent tout le contraste et s’inversent avec le thème.
- `--muted`, `--line`, `--soft-line` et `--soft-surface` expriment les niveaux secondaires.
- `--accent` signale une trace, une relation ou un état ponctuel. Il ne sert ni de couleur de marque omniprésente ni de couleur d’action par défaut.
- Un composant doit fonctionner en clair, en sombre et en couleurs forcées sans variante spécifique de contenu.

## 3. Deux voix typographiques

- Newsreader porte les titres, noms d’objets et moments éditoriaux.
- Inter porte navigation, lecture courante, métadonnées et contrôles.
- Les titres sont équilibrés, jamais césurés et utilisent une graisse variable calme. Les paragraphes restent lisibles avant d’être graphiques.
- La cinétique typographique est un enrichissement réversible : aucun sens ni aucune action ne doit en dépendre.

## 4. Un rythme commun

- `--gutter` définit la respiration horizontale publique.
- `--section-space` définit le rythme vertical des sections ; `--section-space-compact` est la seule compression globale.
- Une section pleine largeur conserve une `.section-inner` alignée sur `--max`.
- Les espacements locaux suivent le regroupement sémantique : proximité dans un composant, respiration entre deux idées.

## 5. Des composants sans ambiguïté

- Les boutons sont des pilules en contour, d’une hauteur minimale `--control`. Ils se renforcent sans déplacement.
- Les liens éditoriaux restent des liens soulignés. Une action ne change pas de nature visuelle selon la page.
- Les cartes partagent bordures, padding, hauteur et hiérarchie. Une variation doit provenir du rôle du contenu, pas d’une préférence locale.
- Les rayons sont réservés aux pilules, contrôles circulaires et nœuds relationnels. Les surfaces éditoriales restent orthogonales.

## 6. Des interactions équivalentes

- Le clavier et le pointeur reçoivent le même feedback fonctionnel.
- Le focus reste toujours visible ; une animation ne doit jamais être le seul feedback.
- Les changements d’état importants utilisent un texte ou un attribut ARIA explicite.
- `prefers-reduced-motion` produit un état stable, complet et immédiatement utilisable.

## 7. Un responsive par re-composition

- Desktop organise les relations en colonnes ; mobile les remet dans l’ordre de lecture.
- Les seuils globaux sont `960px` pour le shell et les compositions, puis `680px` pour la lecture compacte.
- Aucun contenu essentiel ne doit dépendre d’un survol, d’une largeur fixe ou d’un défilement horizontal non annoncé.
- Les cibles tactiles font au moins 44 px et les actions importantes restent visibles ou réapparaissent dans le menu compact.

## 8. Un shell public constant

- En-tête : marque, cinq routes principales, action de conversation, thème et menu compact.
- Pied de page : contexte de la page possible, mais attribution, domaine, contact et statut sont identiques partout.
- Chaque navigation possède un nom accessible et chaque route active utilise `aria-current` lorsqu’elle appartient au shell.
- Les ressources publiques sont versionnées ensemble ; les sources non versionnées restent leurs références de maintenance.

## Test de décision

Une modification est recevable si elle rend au moins un invariant plus lisible, réduit une exception ou supprime une duplication, sans affaiblir les autres. Une nouvelle variante doit d’abord prouver qu’aucune primitive existante ne peut l’exprimer.
