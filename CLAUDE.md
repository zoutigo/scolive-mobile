# scolive-mobile — Contexte projet

Application mobile React Native (Expo) du projet Scolive.
Repo GitHub : `git@github.com:zoutigo/scolive-mobile.git`

## Structure du monorepo

```
/home/zoutigo/projets/scolive/
├── scolive-mobile/   ← ce projet
└── scolive-web/      ← monorepo NestJS API + Next.js web
```

## Stack technique

- Expo SDK 55 + React Native 0.83.2
- expo-router (file-based navigation via `app/`)
- TypeScript strict
- Thème couleurs extrait de `scolive-web/apps/web/tailwind.config.ts`

## Écrans existants

| Fichier                     | Route                | Description                                             |
| --------------------------- | -------------------- | ------------------------------------------------------- |
| `app/_layout.tsx`           | root                 | Stack layout, header masqué, animation slide_from_right |
| `app/index.tsx`             | `/`                  | Landing page avec feature cards + bouton "Se connecter" |
| `app/login.tsx`             | `/login`             | Login avec 3 onglets : Téléphone (défaut), Email, SSO   |
| `app/onboarding.tsx`        | `/onboarding`        | Première connexion / activation en plusieurs étapes     |
| `app/recovery/pin.tsx`      | `/recovery/pin`      | Récupération de PIN en 3 étapes + écran succès          |
| `app/recovery/password.tsx` | `/recovery/password` | Récupération de mot de passe en 4 étapes + succès       |

## Workflow de première connexion

Le mobile implémente désormais le même flux d'onboarding que le web :

- **Email** : mot de passe provisoire, nouveau mot de passe, profil, questions de récupération
- **Téléphone** : email optionnel + `setupToken`, profil, changement du PIN, questions de récupération

Déclenchement depuis `app/login.tsx` :

- `PASSWORD_CHANGE_REQUIRED` -> redirection vers `/onboarding` avec `email`
- `PROFILE_SETUP_REQUIRED` -> redirection vers `/onboarding`
  - branche email : `email`
  - branche phone : `setupToken` + `schoolSlug`

Contrats API mobile :

- `src/api/auth.api.ts#getOnboardingOptions`
- `src/api/auth.api.ts#completeOnboarding`

Couverture de tests :

- unitaires : `__tests__/auth/onboarding.test.tsx`
- navigation login : `__tests__/screens/login.test.tsx`
- e2e Android : flows Maestro dans `.maestro/flows/`

## Comportement clavier Android — règle absolue

`android:windowSoftInputMode="adjustPan"` est configuré dans `android/app/src/main/AndroidManifest.xml`.

**Android pan nativement la fenêtre pour garder le champ focalisé visible** quand le clavier s'ouvre. Ce comportement s'applique automatiquement à tous les écrans sans aucun code JavaScript supplémentaire.

### Ce qu'il NE FAUT PAS faire dans les formulaires

```tsx
// ❌ Interdit : scroll JavaScript au focus
Keyboard.addListener("keyboardDidShow", ...)
scrollRef.current?.scrollTo(...)
onFocus={() => scrollToField(...)}
onLayout={(e) => { someY.current = e.nativeEvent.layout.y; }}
```

### Ce qu'il FAUT faire

```tsx
// ✅ Correct : ScrollView simple, KeyboardAvoidingView uniquement pour iOS
<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
  <ScrollView keyboardShouldPersistTaps="handled">
    <TextInput ... />  {/* adjustPan gère la visibilité nativement */}
  </ScrollView>
</KeyboardAvoidingView>
```

> **Contexte** : Avec React Native Fabric (New Architecture) + `adjustResize`, `ScrollView.scrollTo()` est écrasé par le layout manager Android après chaque ouverture de clavier. `adjustPan` évite ce conflit en agissant au niveau natif avant tout re-layout.

> **Rebuild requis** : tout changement dans `AndroidManifest.xml` nécessite `npm run android:build` (pas seulement un reload Metro).

## Lancer sur l'émulateur

```bash
cd /home/zoutigo/projets/scolive/scolive-mobile
npm run android:emulator
npm run android:build
npm start
```

Émulateur stable : **Scolive_Dev_AOSP_API33**.
Android Studio local : `~/android-studio/bin/studio`.

### Problème connu — React Native DevTools

Au démarrage, une erreur sandbox Chrome apparaît. Contournement permanent :

```bash
npm run start:clean
```

Utiliser `npm run start:clean` uniquement si Metro est réellement cassé.

### Pourquoi App.tsx + babel.config.js + metro.config.js sont requis

Expo Go 55 envoie une requête hardcodée vers `node_modules/expo/AppEntry.bundle`.
`expo/AppEntry.js` fait `import App from '../../App'` → projet root `App.tsx`.

- **`App.tsx`** : re-exporte `expo-router/build/qualified-entry` pour que expo-router
  gère la navigation via le dossier `app/`
- **`babel.config.js`** : active `babel-preset-expo` → injecte `EXPO_ROUTER_APP_ROOT`
- **`metro.config.js`** : active `getDefaultConfig` → supporte `require.context`
  et `.tsx` dans les extensions résolues

Sans ces 3 fichiers → bundling fail avec `Unable to resolve "../../App"`.

### Si le bundling échoue encore

Tuer tous les processus Metro et vider les caches :

```bash
pkill -f "expo start"; pkill -f metro
rm -rf /tmp/metro-* ~/.expo/metro-cache .expo node_modules/.cache
npm run start:clean
```

## Lancer via VS Code

Depuis `/home/zoutigo/projets/scolive` :

```bash
bash /home/zoutigo/projets/scolive/dev.sh
```

`dev.sh` ouvre VS Code sur le workspace et lance l'émulateur Android stable s'il n'est pas déjà démarré.

VS Code ouvre ensuite le workspace et lance automatiquement les terminaux configurés :

- **Infra** — Docker (postgres, redis, minio, media) + Prisma generate
- **API** — `npm run -w @school-live/api dev`
- **Worker** — `npm run -w @school-live/api worker:dev`
- **Mobile** — `npm start`
- **Web** — `npm run -w @school-live/web dev`

Config dans `/home/zoutigo/projets/scolive/.vscode/tasks.json`.

## Dépendances clés installées manuellement

Ces packages ne sont PAS dans le template create-expo-app mais sont requis :

```json
"expo-linking": "~7.1.7",
"babel-preset-expo": "^12.0.11"
```

## CI GitHub Actions

`.github/workflows/ci.yml` — déclenché sur push/PR vers `main` et `dev` :

1. Typecheck (`npx tsc --noEmit`)
2. Expo export web (`npx expo export --platform web`)

`.github/workflows/e2e-android.yml` — workflow Android E2E dédié :

- build un APK release standard
- lance l'émulateur Android
- installe l'APK
- exécute les flows Maestro avec le mock server local sur `3001`
- se déclenche la nuit en semaine et manuellement
