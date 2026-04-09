# agents.md — scolive-mobile

Guide opérationnel pour agents IA travaillant sur le projet React Native.

---

## Environnement de dev Android

### AVD de référence

**`Scolive_GooglePlay_API33`** — image Google Play API 33, GPU `swiftshader_indirect`.
C'est le seul AVD qui inclut Chrome, donc le seul compatible avec Google OAuth (Chrome Custom Tabs).

Ne jamais suggérer `Scolive_Dev_AOSP_API33` pour des scénarios impliquant Google Auth.

### Snapshot de démarrage

Un snapshot `startup_ready` est présent dans :

```
~/.android/avd/Scolive_GooglePlay_API33.avd/snapshots/startup_ready/
```

`scripts/android-emulator-nvidia.sh` le charge automatiquement → boot en ~25 s.

Si le snapshot est absent, le premier boot dure 30+ min (compilation AOT de TrichromeLibrary/Chrome).
Dans ce cas, attendre que `dex2oat64` n'apparaisse plus dans logcat, puis recréer le snapshot
(`Emulator → Extended Controls → Snapshots → Take snapshot`, nom : `startup_ready`).

### Ports adb reverse

Configurés automatiquement par `scripts/android-dev-install.sh` et `scripts/workspace-mobile-start.sh` :

| Port | Service                                    |
| ---- | ------------------------------------------ |
| 8081 | Metro bundler                              |
| 3000 | App web Next.js (requis pour Google OAuth) |
| 3001 | Mock server E2E                            |

Vérification : `adb reverse --list`

---

## Flux `code .` (développement quotidien)

1. `dev.sh` démarre VS Code et lance `Scolive_GooglePlay_API33` (snapshot)
2. Tâche `mobile-emulator` : `android-emulator-nvidia.sh Scolive_GooglePlay_API33`
3. Tâche `mobile` : `workspace-mobile-start.sh`
   - Démarre Metro (`expo-start-raw.sh`)
   - Arrière-plan : `bootstrap_android_app`
     - Attend que l'émulateur réponde (`adb shell pm list packages`)
     - Configure `adb reverse` pour 8081, 3000, 3001
     - Attend Metro (`curl http://localhost:8081/status`)
     - Réveille l'écran (`KEYCODE_WAKEUP`)
     - Ouvre l'app native (`am start -n com.zoutigo.scoliveapp/.MainActivity`)
     - Vérifie `logcat | grep "ReactNativeJS: Running"`, réessaie 5 fois si nécessaire

Durée totale attendue : ~100 s pour avoir l'écran de login visible.

---

## Google Auth Android

### Flux complet

```
Bouton "Connexion Google" (app native)
  → WebBrowser.openAuthSessionAsync("http://localhost:3000/auth/mobile-sso-start?redirectUri=scolive://auth/callback")
  → Chrome Custom Tab (localhost:3000 joignable via adb reverse)
  → NextAuth démarre le flux OAuth Google
  → Redirection Google (sélecteur de compte forcé : prompt="select_account")
  → Callback NextAuth sur localhost:3000 (cookie state domain=localhost → cohérent)
  → Redirection vers scolive://auth/callback
  → Chrome Custom Tab fermé, deep link reçu par l'app
  → Session stockée, écran home affiché
```

### Fichiers clés

- `src/auth/google-auth.ts` :
  - `buildGoogleSsoStartUrl()` construit l'URL de départ
  - `normalizeWebBaseUrlForRuntime()` normalise l'URL sans remplacer `localhost` par `10.0.2.2`
    (adb reverse rend `localhost:3000` directement accessible)
  - Lève `GoogleAuthError("GOOGLE_AUTH_NATIVE_BUILD_REQUIRED")` si Expo Go détecté

- `scolive-web/apps/web/src/auth.ts` :
  - Google provider configuré avec `prompt: "select_account"`
  - `resolveAllowedRedirect` autorise `scolive://auth/callback` via `buildAllowedRedirectOrigins`

### Invariants à ne pas casser

- Ne pas réintroduire de remplacement `localhost → 10.0.2.2` dans `google-auth.ts`
  (casserait le domaine du cookie NextAuth)
- Ne pas désactiver `com.android.chrome` dans `android-dev-install.sh` (`apply_dev_tuning`)
- Ne pas utiliser `Expo Go` pour tester Google Auth (rejeté explicitement par le code)

---

## Scripts principaux

| Script                                | Rôle                                                              |
| ------------------------------------- | ----------------------------------------------------------------- |
| `scripts/android-emulator-nvidia.sh`  | Lance l'AVD avec le bon GPU et charge le snapshot si présent      |
| `scripts/workspace-mobile-start.sh`   | Démarre Metro + bootstrap Android en arrière-plan                 |
| `scripts/android-dev-install.sh`      | Installe l'APK, configure adb reverse, précompile l'app           |
| `scripts/expo-start-raw.sh`           | Lance Metro avec `REACT_NATIVE_DEVTOOLS=0`, `EXPO_NO_DEVTOOLS=1`  |
| `scripts/maestro-run-flow.sh`         | Lance un flow Maestro E2E avec mock server                        |
| `scripts/android-e2e-google-build.sh` | Build APK release avec mock URL baked in (`http://10.0.2.2:3001`) |

---

## React Native DevTools — Linux

Le binaire `chrome-sandbox` doit être owned root + setuid pour que l'Electron DevTools fonctionne.
Sans ça, Metro tente de passer `--no-sandbox` que `parseArgs` rejette.

Correction permanente (une seule fois par machine) :

```bash
SANDBOX="$HOME/.cache/dotslash/cb/$(ls ~/.cache/dotslash/cb/)/React Native DevTools-linux-x64/chrome-sandbox"
sudo chown root:root "$SANDBOX"
sudo chmod 4755 "$SANDBOX"
```

`REACT_NATIVE_DEVTOOLS=0` dans `expo-start-raw.sh` désactive DevTools comme protection temporaire.

---

## E2E Android (Maestro)

Architecture :

- `.maestro/flows/` — flows YAML par scénario
- `.maestro/mock-server/server.js` — simule l'API + SSO sur `http://10.0.2.2:3001`
  - `GET /auth/mobile-sso-start` → redirect vers `scolive://auth/callback` avec user mock
- APK release standard : `scripts/android-release-build.sh`
- APK Google E2E (mock URL baked in) : `scripts/android-e2e-google-build.sh`

Flows disponibles : `smoke`, `auth-email`, `auth-phone`, `auth-google-full`, `onboarding-email`,
`onboarding-phone`, `recovery-password`, `recovery-pin`

```bash
npm run e2e:test:auth-google    # flow auth-google avec mock (ne pas confondre avec vrai Google)
npm run e2e                     # rebuild APK + suite complète
```

---

## Avertissements connus (non bloquants)

- `WARN  Bridgeless mode is enabled but native module "RNCNetInfo" still uses legacy CatalystInstance`
  → dépendance interne, non bloquant
- `WARN  Inspector proxy has not received a "hello" message`
  → interne Expo, non bloquant
- `dex2oat64: Could not open dex files for location TrichromeLibrary.apk, fd=-1`
  → visible seulement sur premier boot sans snapshot, non bloquant après le snapshot
