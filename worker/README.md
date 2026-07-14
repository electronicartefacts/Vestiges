# Vestiges Intake Worker

Récepteur minimal du formulaire public. Le Worker reste en mode `closed` tant que la décision d'ouverture, les mentions et les contrôles de sécurité ne sont pas validés.

## Garanties de conception

- aucune réponse personnelle en clair dans D1 ;
- chiffrement AES-256-GCM, clé enveloppée par RSA-OAEP/SHA-256 ;
- D1 créé avec juridiction européenne ;
- schéma fermé et rejet des champs inconnus ;
- origine, taille, durée minimale, honeypot, limitation et dédoublonnage ;
- synchronisation privée signée et protégée contre le rejeu ;
- suppression du ciphertext dès l'accusé local ;
- aucune journalisation applicative du corps.

## Secrets attendus

Les valeurs suivantes sont des secrets Worker et ne doivent jamais entrer dans Git :

- `ENCRYPTION_PUBLIC_KEY_SPKI` ;
- `DEDUPE_SECRET` ;
- `RATE_LIMIT_SECRET` ;
- `TEST_TOKEN` ;
- `SYNC_CLIENT_ID` ;
- `SYNC_HMAC_SECRET` ;
- `TURNSTILE_SECRET` lorsque Turnstile est activé.

## Mode fermé

En `INTAKE_MODE=closed`, une soumission n'est acceptée qu'avec le secret de test transmis dans l'en-tête `X-Vestiges-Test-Token`. Le navigateur public n'utilise jamais cet en-tête. Le endpoint de statut reste public et ne révèle aucun volume.

## Déploiement

La base distante doit être créée avant de remplacer l'identifiant factice dans `wrangler.jsonc` :

```text
npx wrangler d1 create vestiges-intake-eu --jurisdiction=eu
npx wrangler d1 migrations apply vestiges-intake-eu --remote
npx wrangler deploy
```

Ne pas exécuter l'ouverture (`INTAKE_MODE=open`) avant fermeture écrite des gates du QG.

## Gate de purge

Le handler planifié et le déclencheur Cron `17 * * * *` sont déployés. `INTAKE_MODE` reste `closed` jusqu'à observation d'une première exécution réelle et fermeture des autres gates du QG. La synchronisation locale supprime déjà le ciphertext actif après chaque accusé réussi.
