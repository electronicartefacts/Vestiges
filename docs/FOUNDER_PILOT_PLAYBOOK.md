# Playbook du pilote fondateur

**Statut :** prêt à exécuter, sans participant ni résultat déclaré.

**Périmètre :** premier contact, test du parcours, réponse humaine et décision d’ouvrir ou non un premier dossier.

**Barrières :** aucune campagne automatique, aucune collecte serveur publique, aucune newsletter et aucune publication sans autorisation séparée.

## Résultat attendu

Le pilote doit permettre de vérifier, sur des situations réelles, qu’une personne :

1. comprend ce qu’est Vestiges et ce qu’il n’est pas ;
2. peut expliquer une situation utile sans livrer un inventaire ni des informations sensibles ;
3. comprend le résultat possible, la charge, le coût actuel et les limites ;
4. garde le contrôle sur l’entretien, le dossier et la publication ;
5. reçoit une réponse humaine qui ne transforme pas son message en admission implicite.

Un clic, un message préparé ou une réaction positive ne prouve pas la valeur du service.

## Ronde initiale

| Groupe | Nombre | Ce que la ronde doit apprendre |
|---|---:|---|
| praticiens ou ateliers | 3 à 5 | valeur du dossier, charge acceptable, limites et vocabulaire naturel |
| recherche ou transmission | 2 à 3 | attribution, statut des sources, livrable et usage |
| terrain institutionnel | 1 à 2 | bénéficiaire, sponsor, corpus, gouvernance et critères d’arrêt |
| lecteurs-tests | 4 à 6 | compréhension, premier clic, accessibilité et malentendus |

Le recrutement réel, l’envoi et la prise de rendez-vous restent des actions humaines séparées. Ce dépôt ne les déclenche pas.

## Test du parcours

Chaque session dure 20 à 30 minutes et utilise une situation réelle, sans obliger la personne à envoyer le message.

1. Montrer l’arrivée correspondant à son rôle pendant cinq secondes.
2. Masquer l’écran et demander : « Qu’est-ce que Vestiges propose, à qui et à quel stade ? »
3. Rouvrir la page et demander où la personne irait pour comprendre le livrable.
4. Faire préparer le message jusqu’à la vérification finale.
5. Demander ce qui vient d’être transmis, ce qui peut devenir public et ce qui se passerait ensuite.
6. Relever les hésitations, retours, erreurs, mots reformulés et informations jugées prématurées.

### Porte de passage

- 5 personnes sur 6 classent correctement Vestiges ;
- 5 sur 6 terminent le parcours sans aide ;
- 6 sur 6 comprennent qu’aucune donnée n’est reçue avant l’envoi manuel ;
- 6 sur 6 distinguent message, entretien, dossier et publication ;
- aucune personne ne croit avoir créé un compte, rejoint une newsletter ou accepté une publication.

Un échec sur la confidentialité, les droits ou le stade bloque l’élargissement du pilote, même si le taux de complétion est bon.

## Protocole de réponse

### Objectif opératoire interne

- première lecture visée sous deux jours ouvrés ;
- réponse substantielle visée sous cinq jours ouvrés ;
- si cette capacité n’est pas tenable, suspendre les nouvelles invitations avant de publier un délai ;
- aucun délai n’est promis publiquement tant que cette capacité n’a pas été observée sur une ronde réelle.

### Qualification humaine

| Situation | Réponse appropriée | À ne pas faire |
|---|---|---|
| besoin compréhensible et compatible | reformuler le besoin et proposer une seule prochaine étape | annoncer une admission ou un dossier |
| contexte insuffisant | poser une question précise et facultative | demander un inventaire complet |
| inadéquation actuelle | expliquer sobrement la limite et fermer sans pression | maintenir une relance automatique |
| information sensible ou tiers exposé | demander de retirer ou déplacer l’information avant toute suite | copier la donnée dans un outil de mesure |
| demande commerciale ou partenariat | séparer le cadrage Vestiges de toute proposition Electronic Artefacts | fusionner pilote, prestation et partenariat |

Après une réponse positive, entretien, proposition de dossier, brouillon privé et publication restent quatre statuts distincts.

## Premier dossier réel

Le prototype de structure public ne devient une preuve produit qu’après un dossier réel, consenti et relu. Avant de commencer :

- situation et utilité minimale écrites ;
- sujet et interlocuteur autorisés ;
- point d’entrée limité ;
- sources et inconnues séparées ;
- médias et droits identifiés élément par élément ;
- charge de production et de relecture estimée ;
- règles de correction, retrait et arrêt comprises ;
- brouillon privé avant toute visibilité ;
- décision de publication distincte et traçable.

Le premier dossier doit mesurer le temps réel de recherche, édition, média, relecture et maintenance. Un résultat esthétique ne suffit pas.

## Variantes d’invitation à tester

Une ronde compare une seule variation à la fois. Aucun texte ne doit supposer un intérêt ou flatter un prestige.

| Angle | Ouverture | Hypothèse |
|---|---|---|
| situation | « Une question précise de votre pratique semble pouvoir être mieux documentée. » | la pertinence concrète augmente la compréhension |
| contrôle | « Vestiges explore comment rendre une pratique lisible sans demander que tout devienne public. » | les garanties réduisent la méfiance |
| livrable | « Nous testons une forme de dossier reliant récit, œuvres, gestes, sources et droits. » | le produit concret facilite la décision |

Mesurer la compréhension, la qualité des réponses et les objections ; ne pas optimiser l’ouverture ou le volume seuls.

## Mesure sans tracker

Le site émet des événements `vestiges:journey` dans la page, sans requête réseau, cookie, stockage persistant ni contenu de formulaire. Le paramètre `qa=1` conserve uniquement ces événements dans `window.VESTIGES_QA_EVENTS` pendant l’onglet courant.

Événements disponibles :

- `page_ready` ;
- `participation_link` et `direct_email_link` ;
- `contact_step`, `contact_error` et `contact_review` ;
- `message_prepared`, `message_copied` et `message_copy_failed`.

Les détails se limitent au chemin, au contexte direct ou guidé, au numéro d’étape et au nom technique d’un champ invalide. Aucun nom, e-mail, texte libre, identifiant d’invitation ou URL saisie n’est journalisé.

Cette instrumentation sert aux tests modérés et à la QA. Une collecte distante nécessite une décision, une revue des données et une documentation distinctes.

## Décision après chaque ronde

| Observation | Décision |
|---|---|
| compréhension et parcours solides, valeur faible | revoir le problème ou le segment, pas le CTA |
| valeur claire, charge excessive | réduire le dossier ou maintenir un service très limité |
| confiance faible | corriger preuve, identité, limites ou droits avant acquisition |
| demandes hétérogènes | ne pas fusionner les segments dans une offre générale |
| premier dossier utile et soutenable | préparer une seconde réplication avant d’ouvrir Explorer |
