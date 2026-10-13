# Polices locales

Les originaux Inter et Newsreader, leurs auteurs et leurs notices SIL Open Font License restent conservés dans les sous-dossiers. Les dérivés `VestigesSans` et `VestigesSerif` gardent les axes variables, les fonctions OpenType, les accents et les caractères courants de l’interface. Leurs noms internes sont distincts des originaux.

Les faces CSS utilisent des plages Unicode complémentaires : le sous-ensemble est chargé pour les caractères courants, et le fichier original reste disponible pour les autres caractères qu’il couvre. Le navigateur garde ses polices de repli pour les écritures absentes des fichiers originaux.

Le manifeste contient les tailles, SHA-256, axes et plages Unicode. `font-faces.generated.css` est intégré au début de `styles.css` ; il n’est pas chargé séparément dans le navigateur.

Pour régénérer, installer `fonttools[woff]==4.60.1` dans un environnement Python isolé, puis exécuter `python scripts/subset-fonts.py`. Réintégrer les faces générées dans `styles.css`, produire une nouvelle version de la feuille publique et contrôler le rendu avant publication.
