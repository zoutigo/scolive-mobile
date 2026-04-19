# AGENTS.md — Conventions pour les agents IA sur scolive-mobile

Ce fichier liste les règles non-négociables à respecter lors de toute modification de ce projet.

## Git — commit et push

**Ne jamais créer de commit ni pousser sur le remote sans y avoir été explicitement invité.**
Préparer le code, faire tourner les vérifications (format, lint, typecheck, tests), puis attendre
l'instruction explicite de l'utilisateur avant tout `git commit` ou `git push`.

## TODO — Module notes / évaluations mobile

- [x] Analyser le module `notes` / `evaluations` de `scolive-web` et aligner les contrats API/types mobile
- [x] Ajouter les types partagés mobile pour consultation élève et CRUD classe
- [x] Implémenter l'API mobile `notes/evaluations` et le store associé
- [x] Créer l'écran parent/enfant `Notes` avec vues `Evaluations`, `Moyennes`, `Graphiques`
- [x] Ajouter le détail d'évaluation et les états vides/erreur/chargement
- [x] Remplacer le placeholder `Notes` dans la navigation enfant par la vraie route
- [x] Implémenter l'écran classe `Cahier de notes` pour enseignant et rôles établissement
- [x] Implémenter création/édition d'évaluation, saisie des scores et appréciations de période
- [ ] Utiliser `ConfirmDialog` pour toute suppression
- [x] Utiliser le toast global pour les retours `success/error` des actions métier
- [x] Mettre à jour les menus et points d'entrée `teacher` / `school`
- [x] Ajouter les tests unitaires, API, store et intégration du module notes
- [x] Faire tourner les validations locales ciblées puis la vérification complète
- [x] Réaligner l'UI parent/enfant `Notes` sur la version web small-screen (`Eval`, `Moy`, `Graph`)

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
  - tolère un temps d'installation plus long sur l'AVD Google Play E2E
  - détecte automatiquement le bon `ANDROID_SERIAL` si un seul émulateur E2E cohérent est présent
  - réinitialise l'application Android
  - ouvre directement certains flows via deep link pour éviter une navigation parasite
  - préchauffe le driver Maestro Android avant le vrai flow
  - exécute ensuite le flow Maestro ciblé avec le driver déjà prêt
- Les flows actuels sont :
  - `smoke`
  - `auth-email`
  - `auth-phone`
  - `auth-google`
  - `notes-parent`
  - `notes-crud-teacher`
  - `onboarding-email`
  - `onboarding-phone`
  - `recovery-password`
  - `recovery-pin`
- Les commandes locales principales sont :
  - `npm run maestro:install`
  - `npm run e2e:build`
  - `npm run e2e:test:notes:parent`
  - `npm run e2e:test:notes:crud`
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
  - couper tout processus actif sur `3001`
  - lancer l'AVD `Scolive_E2E_GooglePlay_API33`
  - `npm run e2e:build`
  - `npm run e2e:test`
- `auth-google` rejoue un callback SSO Google via deep link contrôlé puis vérifie l'arrivée sur l'écran authentifié
- Le runner Maestro détecte désormais API réelle vs mock server et installe l'APK Android la plus récente disponible
- Pour éviter tout conflit, toujours libérer explicitement le port du mock avant un run Maestro :

```bash
lsof -ti :3001 | xargs -r kill
curl -sS --max-time 1 http://127.0.0.1:3001/api/health || true
```

- Si `curl` retourne encore une réponse, ne pas lancer Maestro tant que `3001` n'est pas libre
- Ne pas confondre les ports :
  - `3001` = mock server Scolive
  - `7001` = port interne du driver Maestro
- Un message d'erreur lié à `7001` n'indique pas un problème de mock server
- L'AVD Google Play de dev pointé par `npm run android:emulator:google` est `Scolive_GooglePlay_API33`
- `npm run android:emulator` reste l'AVD AOSP de dev simple `Scolive_Dev_AOSP_API33`
- L'AVD dédié aux tests E2E Maestro est `Scolive_E2E_GooglePlay_API33`
- Ne pas lancer les flows E2E sur l'émulateur de dev
- Pour les E2E, couper l'émulateur Android actif puis lancer explicitement :

```bash
bash scripts/android-emulator-nvidia.sh Scolive_E2E_GooglePlay_API33
```

- Le launcher peut réutiliser le snapshot `startup_ready` de `Scolive_E2E_GooglePlay_API33` s'il existe
- Ce snapshot est préférable à un cold boot systématique, car le cold boot Google Play rallonge fortement l'installation APK et le démarrage du driver Maestro

- Le binaire attendu par Maestro est l'APK `release`, pas l'APK `debug`
- Chemin attendu :

```bash
android/app/build/outputs/apk/release/app-release.apk
```

- Rebuild E2E local fiable :

```bash
cd /home/zoutigo/projets/scolive/scolive-mobile
lsof -ti :3001 | xargs -r kill
bash scripts/android-emulator-nvidia.sh Scolive_E2E_GooglePlay_API33
npm run android:build:release
ANDROID_SERIAL=emulator-5556 npm run e2e:test:notes:parent
ANDROID_SERIAL=emulator-5556 npm run e2e:test:notes:crud
```

- Ne pas supposer que le serial sera toujours `5556`
- Vérifier le mapping réel après le boot :

```bash
adb devices -l
adb -s emulator-5554 emu avd name || true
adb -s emulator-5556 emu avd name || true
```

- Si un run E2E échoue avant les premières assertions d'un flow, lancer d'abord un canari existant comme :

```bash
ANDROID_SERIAL=<detected-serial> npm run e2e:test:discipline
```

- Si ce canari échoue aussi, le problème est côté runner / driver Maestro / émulateur, pas dans le nouveau flow

- Couverture notes validée :
  - `notes-parent` couvre la consultation parent/enfant
  - `notes-crud-teacher` couvre création, mise à jour, saisie des notes et conseil de classe
- La suppression d'évaluation n'est pas encore couverte, car elle n'existe pas dans l'UI mobile actuelle

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
