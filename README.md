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
- il utilise son propre cache Gradle dans `.gradle-precommit`

## Notes

- Android Studio propre est maintenant installé dans `~/android-studio`
- Le bon binaire IDE est `~/android-studio/bin/studio`
- Le snap `android-studio` ne doit plus être utilisé
- Le SDK actif est dans `~/Android/Sdk`
