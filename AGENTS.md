# AGENTS.md — Conventions pour les agents IA sur scolive-mobile

Ce fichier liste les règles non-négociables à respecter lors de toute modification de ce projet.

## Comportement clavier Android — règle absolue

`android:windowSoftInputMode="adjustPan"` est configuré dans `android/app/src/main/AndroidManifest.xml`.

**Ne jamais ajouter de logique JavaScript de scroll au focus des champs de formulaire.**
Android pan nativement la fenêtre pour garder le champ focalisé visible. Tout code JavaScript
de scroll est superflu et entre en conflit avec Fabric (New Architecture).

Imports interdits dans les composants formulaire :

- `Keyboard` (pour `addListener("keyboardDidShow", ...)`)
- `useRef<ScrollView>` couplé à `scrollTo` sur `onFocus`
- `onLayout` pour mesurer des positions Y dans le but de scroller

Pattern correct :

```tsx
<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
  <ScrollView keyboardShouldPersistTaps="handled">
    {/* Les champs TextInput sont visibles nativement grâce à adjustPan */}
  </ScrollView>
</KeyboardAvoidingView>
```

## TypeScript strict

Le projet utilise `"strict": true`. Pas de `any` implicite, pas de `// @ts-ignore`.

## Tests E2E (Maestro)

- Les flows vivent dans `.maestro/flows/`
- Le mock server (`.maestro/mock-server/server.js`) remplace l'API réelle sur le port 3001
- Le script `scripts/maestro-run-flow.sh` orchestre un run local :
  - démarre le mock server avec le scénario attendu
  - installe l'APK release si nécessaire
  - réinitialise l'application Android
  - ouvre directement certains flows via deep link pour éviter une navigation parasite
  - exécute ensuite le flow Maestro ciblé
- Les flows actuels sont :
  - `smoke`
  - `auth-email`
  - `auth-phone`
  - `onboarding-email`
  - `onboarding-phone`
  - `recovery-password`
  - `recovery-pin`
- Les commandes locales principales sont :
  - `npm run maestro:install`
  - `npm run e2e:build`
  - `npm run e2e:test:smoke`
  - `npm run e2e:test:auth-email`
  - `npm run e2e:test:auth-phone`
  - `npm run e2e:test:onboarding-email`
  - `npm run e2e:test:onboarding-phone`
  - `npm run e2e:test:recovery-password`
  - `npm run e2e:test:recovery-pin`
  - `npm run e2e:test`
  - `npm run e2e`
- Séquence locale recommandée :
  - `npm run maestro:install`
  - `npm run android:emulator`
  - `npm run e2e:build`
  - `npm run e2e:test`
- L'AVD de dev quotidien pointé par `npm run android:emulator` est `Scolive_Dev_AOSP_API33_Fresh`
- `npm run e2e:test` rejoue toute la campagne sans rebâtir l'APK
- `npm run e2e` rebâtit l'APK release puis lance toute la campagne
- Le workflow `.github/workflows/publish-android.yml` publie l'APK release signe sur `main`
- Secrets GitHub attendus pour cette publication :
  - `ANDROID_KEYSTORE_BASE64`
  - `ANDROID_KEYSTORE_PASSWORD`
  - `ANDROID_KEY_ALIAS`
  - `ANDROID_KEY_PASSWORD`
  - `MOBILE_BUILD_UPLOAD_TOKEN`
- Variable GitHub optionnelle :
  - `MOBILE_BUILD_UPLOAD_URL`
- Les E2E Android du CI ne tournent plus sur chaque push/PR :
  - workflow dédié `.github/workflows/e2e-android.yml`
  - déclenchement nocturne en semaine
  - déclenchement manuel possible via `workflow_dispatch`

## Rebuild natif obligatoire

Après tout changement dans `android/` (AndroidManifest, build.gradle, fichiers Kotlin) :

```bash
npm run android:build
```

Un simple reload Metro (`r` dans le terminal Metro) ne suffit pas.

## API mobile

- Base URL : `http://10.0.2.2:3001/api` (émulateur Android → host machine)
- Client : `src/api/client.ts` — `apiFetch(path, options)`
- Tokens stockés via `expo-secure-store`
- Erreurs API : chaque écran a sa fonction `parseXxxApiError(err)` locale

## Structure des écrans

| Fichier                     | Route                | Description                          |
| --------------------------- | -------------------- | ------------------------------------ |
| `app/login.tsx`             | `/login`             | Login Téléphone / Email / SSO        |
| `app/onboarding.tsx`        | `/onboarding`        | Première connexion / activation      |
| `app/recovery/pin.tsx`      | `/recovery/pin`      | Récupération PIN (3 étapes)          |
| `app/recovery/password.tsx` | `/recovery/password` | Récupération mot de passe (4 étapes) |

## Workflow de première connexion

- Le mobile implémente le même onboarding que le web
- Branche email : mot de passe provisoire -> nouveau mot de passe -> profil -> questions de récupération
- Branche phone : email optionnel + `setupToken` -> profil -> nouveau PIN -> questions de récupération
- Le login redirige vers `/onboarding` sur `PASSWORD_CHANGE_REQUIRED` et `PROFILE_SETUP_REQUIRED`
- Les payloads passent par `src/api/auth.api.ts` :
  - `getOnboardingOptions({ email | setupToken })`
  - `completeOnboarding(...)`
- Les tests unitaires associés vivent dans `__tests__/auth/onboarding.test.tsx`
- Les scénarios E2E associés vivent dans `.maestro/flows/onboarding-email.yaml` et `.maestro/flows/onboarding-phone.yaml`
