# scolive-mobile

## Flux Android recommandé

Android Studio propre :

```bash
~/android-studio/bin/studio
```

Lancer l'émulateur stable :

```bash
npm run android:emulator
```

Cet alias démarre l'AVD `Scolive_Dev_AOSP_API33`, profil AOSP minimal orienté stabilité, avec rendu `swiftshader_indirect`.

Installer ou rebâtir l'application native :

```bash
npm run android:build
```

Lancer Metro pour le dev quotidien :

```bash
npm start
```

Si l'application est déjà installée sur l'émulateur, `npm start` suffit la plupart du temps.

## En cas de problème

Réinstaller proprement l'APK debug :

```bash
npm run android:reinstall
```

Vider le cache Metro uniquement si nécessaire :

```bash
npm run start:clean
```

## Pre-commit

Un hook Git `pre-commit` est actif sur ce projet.

Avant chaque commit, il exécute :

- `npm run format`
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run android:build:precommit`

Le build `android:build:precommit` est isolé du flux de dev :

- il ne lance pas d'installation APK
- il ne touche pas à l'émulateur
- il utilise son propre cache Gradle dans `${XDG_CACHE_HOME:-$HOME/.cache}/scolive-mobile/gradle-precommit`

## E2E Android

Les E2E Android utilisent Maestro.

Architecture :

- les flows YAML vivent dans `.maestro/flows/`
- le mock server dédié vit dans `.maestro/mock-server/server.js`
- le script `scripts/maestro-run-flow.sh` orchestre un run complet d'un flow :
  - démarre le mock server
  - installe l'APK release
  - reset l'application
  - lance l'app ou un deep link
  - exécute le flow Maestro demandé

### Installation

```bash
npm run maestro:install
```

### Lancer un flow unique

```bash
npm run e2e:build
npm run e2e:test:smoke
```

Autres flows disponibles :

```bash
npm run e2e:test:auth-email
npm run e2e:test:auth-phone
npm run e2e:test:onboarding-email
npm run e2e:test:onboarding-phone
npm run e2e:test:recovery-password
npm run e2e:test:recovery-pin
```

### Lancer toute la suite E2E

Si l'APK release est déjà construit :

```bash
npm run e2e:test
```

Pour rebâtir puis exécuter toute la suite :

```bash
npm run e2e
```

### CI E2E

Le workflow GitHub Actions dédié est `.github/workflows/e2e-android.yml`.

Il :

- construit l'APK release
- valide d'abord le flow `smoke`
- exécute ensuite les flows métier
- se lance la nuit en semaine
- peut aussi être lancé manuellement

## Publication Android release

Le workflow `.github/workflows/publish-android.yml` publie un APK Android signe sur chaque `push` vers `main`.

Secrets GitHub requis :

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `MOBILE_BUILD_UPLOAD_TOKEN`

Variable GitHub optionnelle :

- `MOBILE_BUILD_UPLOAD_URL`
  - défaut : `https://scolive.lisaweb.fr/api/mobile-builds/android`

Le workflow :

- reconstruit le keystore release
- lit `versionName` depuis `app.json`
- utilise `GITHUB_RUN_NUMBER` comme `versionCode`
- build l'APK release signé
- publie l'APK vers l'API web en `multipart/form-data`

## Notes

- Android Studio propre est maintenant installé dans `~/android-studio`
- Le bon binaire IDE est `~/android-studio/bin/studio`
- Le snap `android-studio` ne doit plus être utilisé
- Le SDK actif est dans `~/Android/Sdk`
