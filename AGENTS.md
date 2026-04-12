# AGENTS.md — Conventions pour les agents IA sur scolive-mobile

Ce fichier liste les règles non-négociables à respecter lors de toute modification de ce projet.

## Git — commit et push

**Ne jamais créer de commit ni pousser sur le remote sans y avoir été explicitement invité.**
Préparer le code, faire tourner les vérifications (format, lint, typecheck, tests), puis attendre
l'instruction explicite de l'utilisateur avant tout `git commit` ou `git push`.

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

## Règles UI transverses

- Toute nouvelle UI de liste à chargement progressif doit utiliser le composant partagé `src/components/lists/InfiniteScrollList.tsx`
- Tout `POST` doit utiliser le toast global centré pour ses retours métier `success/error`, visible 7 secondes et fermable immédiatement par l'utilisateur

## Tests E2E (Maestro)

- Les flows vivent dans `.maestro/flows/`
- Le mock server (`.maestro/mock-server/server.js`) remplace l'API réelle sur le port 3001
- L'AVD de dev quotidien est `Scolive_GooglePlay_API33`
- L'AVD dédié aux E2E Google / Maestro est `Scolive_E2E_GooglePlay_API33`
- Ne jamais lancer les flows E2E sur l'émulateur de dev `Scolive_GooglePlay_API33`
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
  - `auth-google`
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
  - `npm run e2e:test:auth-google`
  - `npm run e2e:test:onboarding-email`
  - `npm run e2e:test:onboarding-phone`
  - `npm run e2e:test:recovery-password`
  - `npm run e2e:test:recovery-pin`
  - `npm run e2e:test`
  - `npm run e2e`
- Séquence locale recommandée :
  - `npm run maestro:install`
  - lancer l'AVD `Scolive_E2E_GooglePlay_API33`
  - `npm run e2e:build`
  - `npm run e2e:test`
- `auth-google` rejoue un callback SSO Google via deep link contrôlé puis vérifie l'arrivée sur l'écran authentifié
- Le runner Maestro détecte désormais API réelle vs mock server et installe l'APK Android la plus récente disponible
- L'AVD Google Play de dev pointé par `npm run android:emulator:google` est `Scolive_GooglePlay_API33`
- `npm run android:emulator` reste l'AVD AOSP de dev simple `Scolive_Dev_AOSP_API33`
- L'AVD dédié aux tests E2E Maestro est `Scolive_E2E_GooglePlay_API33`
- Ne pas lancer les flows E2E sur l'émulateur de dev
- Pour les E2E, couper l'émulateur Android actif puis lancer explicitement :

```bash
bash scripts/android-emulator-nvidia.sh Scolive_E2E_GooglePlay_API33
```

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
