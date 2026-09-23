# Contribuer

Merci de contribuer à améliorer la clarté, l’accessibilité et la fiabilité du site Vestiges.

## Avant de proposer un changement

- Ce dépôt porte le site public et ses ressources techniques ; il ne constitue pas un espace de stockage de recherche ou de données de prospects.
- Ce dépôt est le site public de pré-lancement, pas le produit VAST ni un espace de stockage de prospects.
- Vérifiez `git status` et ne remplacez pas les changements déjà présents.
- Pour une question éditoriale ou une anomalie, décrivez la page, le résultat attendu et ce que vous observez. Ne joignez pas de données personnelles, secrets, coordonnées ou notes privées.
- Les contenus et médias doivent avoir une provenance et des droits de publication confirmés. Signalez les inconnues au lieu de les supposer résolues.
- Ne publiez pas de documents internes, d’audits de recherche, de notes de séance ou de registres de prospects dans ce dépôt.

## Lancer et vérifier

Prérequis : Python 3 pour servir le site et Node.js 22 pour les contrôles. Aucune installation de dépendances npm n’est nécessaire actuellement.

```powershell
python -m http.server 4173
npm run validate
```

Ouvrir ensuite `http://127.0.0.1:4173/`. La validation locale vérifie la syntaxe, les routes et ressources attendues, puis les tests du site et du Worker.

Les pull requests exécutent aussi ces contrôles dans GitHub Actions. Une validation verte confirme les contrôles automatisés, pas les droits des médias, la conformité juridique, la qualité éditoriale, l’accessibilité exhaustive ni l’état de la production.

## État de la licence

Aucune licence générale n’est actuellement déclarée à la racine. Ne présumez pas que le code ou les contenus peuvent être réutilisés librement. La licence des dépendances et polices reste celle précisée dans leurs notices respectives. Le choix d’une licence pour le dépôt doit être confirmé par son titulaire.
