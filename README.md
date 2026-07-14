# Vestiges — site public de préfiguration

Site statique léger de [Vestiges](https://vestiges.world), projet culturel porté par [Electronic Artefacts](https://github.com/electronicartefacts).

## Stade public

Vestiges est en recherche et préfiguration. Ce repository ne contient ni VASTE, ni back-office, ni commerce, ni donnée de participant. Il présente la démarche et un parcours de prise de contact.

Le site remplit six fonctions publiques :

- donner une ouverture éditoriale claire à Vestiges sans vocabulaire technique préalable ;
- montrer l'anatomie candidate d'un dossier relationnel sans inventer de cas réel ;
- ouvrir des parcours distincts pour les praticiens, la recherche et les organisations ;
- donner au public un spécimen relationnel fictif, accompagné d'une lecture linéaire ;
- présenter le premier terrain et la proposition faite aux praticiens fondateurs ;
- distinguer le présent, le pilote à éprouver et les hypothèses de long terme.

## Architecture

- HTML, CSS et JavaScript natifs ;
- polices locales sous SIL Open Font License ;
- aucun framework, package ou service d'analytics ;
- publication GitHub Pages ;
- récepteur Cloudflare Worker + D1 en juridiction UE, déployé en mode fermé ;
- synchronisation privée vers le QG local Electronic Artefacts.

La landing ne constitue pas une instance de VASTE. Le graphe montré est une projection publique fictive : aucune donnée interne, aucun partenaire réel et aucune œuvre réelle n'y sont représentés.

Le formulaire est intégré à la landing mais fermé par défaut dans `site-config.js` :

```js
collectionEnabled: false
```

Tant que cette valeur reste fausse ou que l'endpoint est indisponible, aucune donnée n'est envoyée ou enregistrée. Le passage à `true` exige une décision d'ouverture distincte et le Worker doit également être passé de `closed` à `open`.

## Développement local

Ouvrir `index.html` suffit pour une première lecture. Un serveur statique local est recommandé pour les tests navigateur complets.

## Sécurité de publication

Ne jamais ajouter à ce repository :

- secret Cloudflare ou token GitHub ;
- clé privée de déchiffrement ;
- export de formulaire ;
- document du QG local Vestiges ;
- asset Pinterest ou référence visuelle sans droits ;
- soumission réelle ou journal contenant son contenu.

## Propriété et licences

Identité Vestiges et contenu éditorial : Electronic Artefacts – Joey-Néot Marquet. Les licences des polices sont conservées à côté de leurs fichiers dans `assets/fonts/`.
