# Vestiges — site public de préfiguration

Site statique léger de [Vestiges](https://vestiges.world), projet culturel porté par [Electronic Artefacts](https://github.com/electronicartefacts).

## Stade public

Vestiges est en recherche et préfiguration. Ce repository ne contient ni VASTE, ni back-office, ni commerce, ni donnée de participant. Il présente la démarche et un parcours de prise de contact.

## Architecture

- HTML, CSS et JavaScript natifs ;
- polices locales sous SIL Open Font License ;
- aucun framework, package ou service d'analytics ;
- publication GitHub Pages ;
- futur récepteur : Cloudflare Worker + D1 en juridiction UE ;
- synchronisation privée vers le QG local Electronic Artefacts.

Le formulaire est intégré à la landing mais fermé par défaut dans `site-config.js` :

```js
collectionEnabled: false
```

Tant que cette valeur reste fausse ou que l'endpoint est vide, aucune donnée n'est envoyée ou enregistrée.

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
