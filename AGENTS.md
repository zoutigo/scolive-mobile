# AGENTS.md — scolive-mobile

## Git

- Ne jamais créer de commit ni pousser sur le remote sans instruction explicite de l'utilisateur.
- Sauf indication explicite contraire de l'utilisateur, tout le développement se fait sur la branche `dev`.
- Si la branche courante n'est pas `dev`, basculer dessus avant toute modification ou signaler clairement le blocage.

## Agents

- Ne jamais utiliser de sous-agents ou de délégation pour réaliser le travail demandé.
- Faire tout le travail soi-même, étape par étape si nécessaire.

## Internationalisation (i18n)

Le projet utilise un système de traduction maison dans `src/i18n/` :

- `translations.ts` : dictionnaires par locale, clés namespacées (ex. `settings.language.title`)
- `useTranslation.ts` : hook `useTranslation()` -> `{ locale, setLocale, t }`
- Locales supportées (`SUPPORTED_LOCALES`) : `fr` (défaut, `DEFAULT_LOCALE`) et `en`

Pour tout nouveau développement ou correction :

- Ne jamais laisser de texte en dur dans le code.
- Ajouter la clé correspondante dans `translations` pour chaque locale supportée (`fr` et `en`).
- Afficher le texte via `t("namespace.key")`.

## UI et formulaires

- Toute UI de liste avec chargement progressif passe par `src/components/lists/InfiniteScrollList.tsx`.
- Tout `POST` utilise le toast global centré pour ses retours `success/error`, affiché 7 secondes et fermable manuellement.
- Tout formulaire métier utilise `react-hook-form` avec `zod` via `zodResolver`.
- Ne jamais bloquer un submit avec `isDirty`, `dirtyFields`, `isValid` ou une condition équivalente.
- Les erreurs doivent être affichées directement sous les champs, avec un état d'erreur visuel clair.
- Les placeholders doivent aider réellement à la saisie.
- Configuration UX attendue : `mode: "onChange"` et `reValidateMode: "onChange"`.
- En cas de submit invalide, focus sur le premier champ invalide.

## Clavier Android

`android:windowSoftInputMode="adjustPan"` est la règle de référence dans `android/app/src/main/AndroidManifest.xml`.

- Ne pas ajouter de scroll JavaScript au focus pour compenser le clavier sur Android.
- Utiliser `KeyboardAvoidingView` uniquement pour iOS et laisser Android gérer la visibilité du champ nativement.
- Tout changement dans `AndroidManifest.xml` nécessite `npm run android:build`.

## Environnement Android

- Android Studio : `~/android-studio/bin/studio`
- SDK Android : `~/Android/Sdk`
- AVD de dev quotidien : `Scolive_GooglePlay_API33`
- AVD dédié E2E Maestro : `Scolive_E2E_GooglePlay_API33`

Lancement manuel :

```bash
cd /home/zoutigo/projets/scolive/scolive-mobile
npm run android:emulator
npm run android:build
npm start
```

Flux quotidien recommandé :

```bash
cd /home/zoutigo/projets/scolive
code .
```

Le script `dev.sh` et l'ouverture du workspace démarrent l'émulateur de dev si besoin, les tâches utiles et Expo Go.

En cas de problème :

```bash
npm run android:reinstall
```

Utiliser seulement si Metro est cassé :

```bash
npm run start:clean
```

## Google Auth Android

- Tester Google Auth sur une vraie app native Android, pas dans Expo Go.
- Ne pas réintroduire de remplacement `localhost -> 10.0.2.2` dans `src/auth/google-auth.ts`.
- Ne pas désactiver `com.android.chrome` dans les scripts d'installation/dev Android.

## E2E Android (Maestro)

Les E2E Android reposent sur Maestro.

- Utiliser exclusivement l'AVD `Scolive_E2E_GooglePlay_API33`.
- Libérer le port `3001` avant chaque run.
- Utiliser l'APK `release`, jamais l'APK `debug`.
- Chemin attendu : `android/app/build/outputs/apk/release/app-release.apk`.

Préparation fiable :

```bash
cd /home/zoutigo/projets/scolive/scolive-mobile
lsof -ti :3001 | xargs -r kill
curl -sS --max-time 1 http://127.0.0.1:3001/api/health || true
bash scripts/android-emulator-nvidia.sh Scolive_E2E_GooglePlay_API33
```

Le `curl` doit échouer avant le lancement.

Séquence fiable validée :

```bash
cd /home/zoutigo/projets/scolive/scolive-mobile
lsof -ti :3001 | xargs -r kill
bash scripts/android-emulator-nvidia.sh Scolive_E2E_GooglePlay_API33
npm run android:build:release
ANDROID_SERIAL=emulator-5556 npm run e2e:test:notes:parent
ANDROID_SERIAL=emulator-5556 npm run e2e:test:notes:crud
```

## DevTools Linux

Si React Native DevTools échoue à cause de `chrome-sandbox`, appliquer une seule fois :

```bash
SANDBOX="$HOME/.cache/dotslash/cb/$(ls ~/.cache/dotslash/cb/)/React Native DevTools-linux-x64/chrome-sandbox"
sudo chown root:root "$SANDBOX"
sudo chmod 4755 "$SANDBOX"
```

`REACT_NATIVE_DEVTOOLS=0` est déjà utilisé comme protection temporaire dans `scripts/expo-start-raw.sh`.
