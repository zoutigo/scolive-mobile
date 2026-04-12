# scolive-mobile — Contexte projet

## Git — règle absolue

**Ne jamais créer de commit ni pousser sur le remote sans instruction explicite de l'utilisateur.**
Terminer le travail, vérifier (format, lint, typecheck, tests), puis attendre qu'on demande le commit/push.

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

## Règles UI transverses

- Toute UI de liste avec chargement progressif passe par `src/components/lists/InfiniteScrollList.tsx`
- Tout `POST` utilise le toast global centré pour ses retours `success/error`, affiché 7 secondes et fermable manuellement à tout moment

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

## Architecture E2E Android

Les E2E Android reposent maintenant sur Maestro, pas sur Detox.

Architecture locale :

- `.maestro/flows/` contient un flow YAML par scénario métier
- `.maestro/mock-server/server.js` simule l'API backend sur `http://10.0.2.2:3001/api`
- `scripts/android-release-build.sh` produit l'APK release utilisée pour les E2E
- `scripts/maestro-run-flow.sh` :
  - démarre le mock server avec les variables de scénario
  - installe l'APK release
  - reset l'état Android de l'app
  - ouvre l'app ou un deep link ciblé
  - exécute le flow Maestro demandé

Flows disponibles :

- `smoke`
- `auth-email`
- `auth-phone`
- `auth-google`
- `onboarding-email`
- `onboarding-phone`
- `recovery-password`
- `recovery-pin`

Commandes utiles :

```bash
npm run maestro:install
npm run e2e:build
npm run e2e:test:smoke
npm run e2e:test:auth-email
npm run e2e:test:auth-phone
npm run e2e:test:auth-google
npm run e2e:test:onboarding-email
npm run e2e:test:onboarding-phone
npm run e2e:test:recovery-password
npm run e2e:test:recovery-pin
npm run e2e:test
npm run e2e
```

Lecture des commandes :

- `npm run e2e:test:<flow>` lance un seul flow
- `npm run e2e:test` lance toute la suite Maestro, sans rebuild natif
- `npm run e2e` rebâtit l'APK release puis lance toute la suite
- `auth-google` ouvre directement `/auth/callback` via deep link et valide l'arrivée sur l'écran authentifié
- le runner Maestro détecte s'il parle au mock server ou à l'API réelle
- il installe l'APK Android la plus récente disponible entre `debug` et `release`
- les flows E2E doivent tourner sur l'AVD dédié `Scolive_E2E_GooglePlay_API33`, jamais sur l'AVD de dev

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

Émulateur de référence pour le dev quotidien : **`Scolive_GooglePlay_API33`**.

Émulateur dédié aux tests E2E Google / Maestro : **`Scolive_E2E_GooglePlay_API33`**.
Les flows E2E ne doivent pas être exécutés sur l'émulateur de dev.
L'AVD E2E Google Play est requis pour Google Auth et les scénarios Maestro qui dépendent de Chrome Custom Tabs.

```bash
cd /home/zoutigo/projets/scolive/scolive-mobile
npm run android:emulator          # lance Scolive_GooglePlay_API33
npm run android:build             # build APK debug, installe, ouvre l'app
npm start                         # démarre Metro
```

Android Studio local : `~/android-studio/bin/studio`.

### Snapshot de démarrage rapide

Après le premier boot complet (qui déclenche la compilation AOT de TrichromeLibrary/Chrome — ~30 min),
un snapshot `startup_ready` a été créé :

```
~/.android/avd/Scolive_E2E_GooglePlay_API33.avd/snapshots/startup_ready/
```

`scripts/android-emulator-nvidia.sh` charge automatiquement ce snapshot si le dossier existe.
Résultat : boot en ~25 s au lieu de 30+ min.

> **Si le snapshot est supprimé ou corrompu** : relancer l'émulateur sans snapshot, attendre que
> `dex2oat64` finisse (logcat : plus de lignes `dex2oat64`), puis recréer via
> `Emulator → Extended Controls → Snapshots → Take snapshot` et nommer `startup_ready`.

### Ports adb reverse configurés automatiquement

Les scripts (`android-dev-install.sh`, `workspace-mobile-start.sh`) configurent :

```
tcp:8081  → Metro bundler
tcp:3000  → app web Next.js (requis pour Google OAuth)
tcp:3001  → mock server E2E
```

Ces tunnels permettent à l'émulateur d'atteindre `localhost:PORT` de la machine hôte.
Vérification manuelle : `adb reverse --list`

### React Native DevTools — fix Linux (chrome-sandbox)

Au démarrage Metro, une erreur sandbox peut apparaître (`--no-sandbox`).
Correction permanente (une seule fois) :

```bash
SANDBOX="$HOME/.cache/dotslash/cb/$(ls ~/.cache/dotslash/cb/)/React Native DevTools-linux-x64/chrome-sandbox"
sudo chown root:root "$SANDBOX"
sudo chmod 4755 "$SANDBOX"
```

`REACT_NATIVE_DEVTOOLS=0` est défini dans `scripts/expo-start-raw.sh` pour désactiver DevTools
si la correction n'a pas été appliquée.

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

## Lancer via VS Code (`code .`)

Depuis `/home/zoutigo/projets/scolive` :

```bash
bash /home/zoutigo/projets/scolive/dev.sh
# ou simplement : code .
```

`dev.sh` ouvre VS Code et lance `Scolive_GooglePlay_API33` s'il n'est pas déjà actif.

VS Code lance automatiquement les terminaux :

| Tâche               | Commande                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------ |
| **Infra**           | Docker (postgres, redis, minio, media) + Prisma generate                                   |
| **API**             | `npm run -w @school-live/api dev`                                                          |
| **Worker**          | `npm run -w @school-live/api worker:dev`                                                   |
| **mobile-emulator** | `android-emulator-nvidia.sh Scolive_GooglePlay_API33` — charge le snapshot `startup_ready` |
| **mobile**          | `workspace-mobile-start.sh` — démarre Metro + bootstrap en arrière-plan                    |
| **Web**             | `npm run -w @school-live/web dev`                                                          |

Séquence automatique après `code .` :

1. L'émulateur charge le snapshot (`~25 s`)
2. Metro démarre
3. Le bootstrap attend que Metro réponde sur `/status`, réveille l'écran, ouvre l'app native
4. Si le JS ne charge pas (race), force-stop et réessaie jusqu'à 5 fois
5. Résultat : écran de login visible en ~100 s

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
- exécute d'abord `smoke`
- lance l'émulateur Android
- installe l'APK
- exécute ensuite chaque flow Maestro métier dans la matrice
- utilise le mock server local sur `3001`
- se déclenche la nuit en semaine et manuellement

## Google Auth Android — État stabilisé

### Flux complet (validé en production dev)

```
App native (com.zoutigo.scoliveapp)
  → bouton "Connexion Google"
  → WebBrowser.openAuthSessionAsync("http://localhost:3000/auth/mobile-sso-start?redirectUri=scolive://auth/callback")
  → Chrome Custom Tab (via adb reverse tcp:3000, localhost:3000 joint depuis l'émulateur)
  → NextAuth démarre le flux OAuth Google
  → Redirection Google (compte sélectionné — prompt: "select_account" forcé)
  → Callback NextAuth sur localhost:3000 (cookie de state sur domain localhost → cohérent)
  → Redirection finale vers scolive://auth/callback
  → Chrome Custom Tab fermé automatiquement
  → App native reçoit le deep link, stocke la session
  → Écran home
```

### Pourquoi `Scolive_E2E_GooglePlay_API33` est obligatoire

Chrome Custom Tabs nécessite Chrome. L'image AOSP (`Scolive_Dev_AOSP_API33`) n'a pas Chrome.
**Ne jamais utiliser l'AVD AOSP pour tester Google Auth.**

### Paramétrage clé

| Fichier                            | Paramètre                       | Valeur                                     | Raison                                                    |
| ---------------------------------- | ------------------------------- | ------------------------------------------ | --------------------------------------------------------- |
| `src/auth/google-auth.ts`          | `normalizeWebBaseUrlForRuntime` | pas de remplacement `localhost → 10.0.2.2` | `adb reverse` rend `localhost:3000` joignable directement |
| `scolive-web/apps/web/src/auth.ts` | `prompt`                        | `"select_account"`                         | Force le sélecteur de compte Google à chaque connexion    |
| `scripts/android-dev-install.sh`   | `apply_dev_tuning`              | Chrome **non désactivé**                   | Chrome est requis pour Custom Tabs                        |

### Checklist avant de tester Google Auth

```bash
adb devices                             # com.zoutigo.scoliveapp doit être présent, PAS host.exp.exponent
adb reverse --list                      # tcp:8081, tcp:3000, tcp:3001 doivent être listés
adb shell pm path com.android.chrome    # doit retourner package:...
```

Si `adb reverse` est vide, c'est normal après un reboot : les scripts le reconfigurent automatiquement
au prochain `npm run android:build` ou `npm start` (via `workspace-mobile-start.sh`).

### Problèmes passés et leurs fixes

| Problème                                  | Cause                                                                            | Fix                                                                           |
| ----------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ERR_CONNECTION_REFUSED sur localhost:3000 | Pas de tunnel adb                                                                | `adb reverse tcp:3000 tcp:3000` ajouté aux scripts                            |
| "State cookie was missing"                | `localhost → 10.0.2.2` dans google-auth.ts cassait le domaine du cookie NextAuth | Suppression de la normalisation                                               |
| Écran noir au démarrage Google Play AVD   | dex2oat64 compile TrichromeLibrary au 1er boot (~30 min)                         | Snapshot `startup_ready` créé après la compilation                            |
| App qui ne s'ouvre pas (race Metro)       | App lancée avant que Metro soit prêt                                             | `wait_for_metro()` + retry `app_js_loaded()` dans `workspace-mobile-start.sh` |
| Google Auth sans sélecteur de compte      | Pas de `prompt: "select_account"`                                                | Ajouté dans `auth.ts` côté web                                                |
