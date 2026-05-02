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

## TODO — Navigation enseignant par classe

Objectif produit :

- reproduire sur mobile la logique web de sous-menu par classe pour les enseignants
- faire de chaque classe un contexte de navigation autonome dans le drawer
- exposer sous chaque classe les modules :
  - `Fil de classe`
  - `Notes`
  - `Discipline`
  - `Emploi du temps`
  - `Homework`
- brancher en priorité les modules déjà existants côté mobile (`Notes`, `Emploi du temps`)
- harmoniser ensuite les headers, tabs et parcours des modules de classe

Ordre d'exécution obligatoire :

- ne pas commencer par refaire `Notes`
- commencer par la fondation navigation + données de classes enseignant
- seulement ensuite brancher les modules classe un par un

### Phase 1 — Source de données des classes enseignant

- [x] Recenser la source de données mobile la plus fiable pour lister les classes accessibles à l'enseignant
- [x] Vérifier si la source actuelle de `TimetableClassesScreen` ou `NotesClassesScreen` peut être réutilisée sans couplage fort au métier d'écran
- [x] Si nécessaire, créer une source canonique dédiée à la navigation enseignant (store léger, sélecteur ou helper)
- [x] Standardiser le payload minimal attendu pour le drawer :
  - `classId`
  - `className`
  - `schoolYearId`
  - `schoolYearLabel` si utile pour debug ou affichage
  - permissions/modules disponibles si nécessaires plus tard
- [x] Documenter clairement dans le code quelle source est désormais la référence pour les classes enseignant

Source canonique retenue :

- endpoint backend : `/schools/${schoolSlug}/student-grades/context`
- normalisation unique : `buildTimetableClassOptions(...)`
- API partagée de référence : `src/api/teacher-class-nav.api.ts`
- store neutre prêt pour le drawer : `src/store/teacher-class-nav.store.ts`
- `notesApi.getClassOptions(...)` et `timetableApi.getClassOptions(...)` doivent déléguer vers cette source au lieu de la réimplémenter

### Phase 2 — Modèle de navigation contextuelle par classe

- [x] Figer la structure de sous-menu enseignant par classe, alignée web :
  - `Fil de classe`
  - `Notes`
  - `Discipline`
  - `Emploi du temps`
  - `Homework`
- [x] Définir le mapping de routes mobile cible pour chaque entrée
- [x] Prévoir une structure stable de type `buildTeacherClassItems(classId)` dans `nav-config`
- [x] Prévoir dès cette étape le marquage actif par route courante pour chaque sous-item

Contrat de navigation retenu :

- helpers de routes :
  - `buildTeacherClassFeedTarget(classId)`
  - `buildTeacherClassNotesTarget(classId)`
  - `buildTeacherClassDisciplineTarget(classId)`
  - `buildTeacherClassTimetableTarget(classId)`
  - `buildTeacherClassHomeworkTarget(classId)`
- fabrique des items :
  - `buildTeacherClassItems(classId)`
- structure de sections prête pour le drawer :
  - `buildTeacherClassSections(classes)`
- routes mobiles cibles :
  - `/(home)/classes/[classId]/feed`
  - `/(home)/classes/[classId]/notes`
  - `/(home)/classes/[classId]/discipline`
  - `/(home)/classes/[classId]/timetable`
  - `/(home)/classes/[classId]/homework`

### Phase 3 — Extension de `nav-config`

- [x] Ajouter dans `src/components/navigation/nav-config.ts` une fabrique d'items de navigation par classe enseignant
- [x] Réutiliser autant que possible la logique de sections déjà existante côté parent/enfant
- [x] Conserver temporairement la navigation générale enseignant existante (`Mes classes`, `Cahier de notes`, etc.) pour éviter une régression brutale
- [x] Préparer la coexistence entre :
  - navigation générale enseignant
  - sections contextuelles par classe

Convention de coexistence retenue :

- la navigation générale continue d'être fournie par `getNavItems(user)`
- les sections contextuelles restent construites séparément :
  - `buildChildSections(children)` pour les parents
  - `buildTeacherClassSections(classes)` pour les enseignants
- un agrégateur unique prépare désormais le modèle du drawer :
  - `buildDrawerNavigationConfig({ user, familyChildren, teacherClasses })`
- tant que la phase 4 n'est pas livrée, le drawer enseignant conserve son menu général existant
- l'intégration visible des sections enseignant dans `AppDrawer` sera faite uniquement en phase 4

### Phase 4 — Intégration des classes enseignant dans `AppDrawer`

- [x] Modifier `src/components/navigation/AppDrawer.tsx` pour afficher les classes de l'enseignant sous forme de sections dédiées
- [x] Faire apparaître une section par classe, par exemple `6eC`
- [x] Sous chaque classe, afficher les sous-modules contextuels
- [x] Rendre l'UX proche du web :
  - section classe identifiable immédiatement
  - ouverture/fermeture claire
  - item actif visuellement distingué
- [x] Veiller à ce que le drawer reste performant même avec plusieurs classes

Livraison phase 4 :

- `AppShell` charge désormais les classes enseignant via `useTeacherClassNavStore`
- `AppDrawer` accepte et rend `teacherClassSections`
- le drawer enseignant affiche maintenant :
  - une section `Menu enseignant`
  - une section par classe comme `6eC`
  - les sous-modules contextuels de chaque classe
- les routes dynamiques de classe sont prises en compte dans la détection d'item actif

### Phase 5 — Gestion d'état du drawer pour les sections classe

- [x] Ajouter l'état d'ouverture/fermeture des sections enseignant par classe
- [x] Définir la règle d'ouverture par défaut :
  - classe active ouverte automatiquement
  - autres classes fermées ou selon meilleur compromis UX
- [x] Gérer proprement le cas où aucune classe n'est disponible
- [x] Gérer proprement les états :
  - chargement
  - erreur
  - vide
- [x] Ajouter le calcul de l'item actif selon `pathname`

Comportement retenu :

- si la route active correspond à un sous-module de classe, la section de cette classe s'ouvre automatiquement
- sinon le drawer enseignant s'ouvre sur `Menu enseignant`
- les classes non actives restent repliées
- le drawer enseignant affiche désormais des états dédiés :
  - `drawer-teacher-classes-loading`
  - `drawer-teacher-classes-error`
  - `drawer-teacher-classes-empty`

### Phase 6 — Convention de routing contextuel par classe

- [x] Définir une convention cible de routes de classe cohérente
- [x] Recommandation à suivre autant que possible :
  - `/(home)/classes/[classId]/feed`
  - `/(home)/classes/[classId]/notes`
  - `/(home)/classes/[classId]/discipline`
  - `/(home)/classes/[classId]/timetable`
  - `/(home)/classes/[classId]/homework`
- [x] Décider quelles routes existantes peuvent être conservées comme alias internes ou points d'entrée transitoires
- [x] Éviter les duplications inutiles entre routes globales et routes contextuelles
- [x] S'assurer que le `classId` reste toujours le contexte principal

Décision de transition :

- `/(home)/classes/[classId]/notes` réutilise `ClassNotesManagerScreen`
- `/(home)/classes/[classId]/timetable` réutilise `ClassTimetableManagerScreen`
- les anciennes routes globales restent disponibles comme points d'entrée transitoires :
  - `/(home)/notes/class/[classId]`
  - `/(home)/timetable/class/[classId]`
- `feed`, `discipline` et `homework` disposent désormais de vraies routes contextuelles de classe, même si leur métier complet sera branché dans les phases dédiées

### Phase 7 — Branchement prioritaire des modules déjà existants

- [x] Brancher `Notes` depuis le sous-menu de classe vers son écran de classe mobile
- [x] Brancher `Emploi du temps` depuis le sous-menu de classe vers l'écran agenda/emploi du temps déjà existant
- [x] Vérifier que ces deux entrées n'obligent plus l'enseignant à repasser par un écran global de sélection de classe
- [x] Préserver temporairement les écrans globaux existants pour éviter les régressions de parcours

Livraison phase 7 :

- `/(home)/classes/[classId]/notes` ouvre directement `ClassNotesManagerScreen`
- `/(home)/classes/[classId]/timetable` ouvre l'agenda enseignant contextualisé via `TeacherAgendaScreenInner`
- l'enseignant accède désormais à `Notes` et `Emploi du temps` depuis une classe sans repasser par un sélecteur global
- les anciens points d'entrée globaux restent disponibles comme parcours transitoires

### Phase 8 — Refonte du module `Notes` dans son contexte classe

- [x] Réutiliser le moteur existant du module `Notes`, sans le réécrire depuis zéro
- [x] Garantir que l'entrée `classe > Notes` donne directement accès au module `Notes` / `Evaluations` de la classe courante
- [x] Refondre le header avec `ModuleHeader`
- [x] Remplacer la navigation interne actuelle par de vrais top tabs visuellement alignés avec les autres modules mobiles
- [x] Revoir la hiérarchie visuelle du module :
  - liste des évaluations
  - création / édition
  - saisie des notes
  - conseil / appréciations
  - aide si elle reste pertinente
- [x] Améliorer les états :
  - chargement
  - vide
  - erreur
  - retour visuel métier
- [ ] Vérifier les écarts fonctionnels avec le web et les combler si nécessaire

Livraison phase 8 :

- le module `Notes` / `Evaluations` mobile enseignant a été amélioré dans son contexte classe sans réécriture du moteur métier
- l'entrée contextuelle d'une classe ouvre directement le cahier de notes de cette classe
- le module utilise `ModuleHeader`, des top tabs dédiés et les retours visuels globaux `success/error`
- il reste à vérifier les derniers écarts fonctionnels ou UX avec le web si de nouveaux cas produit apparaissent

### Phase 9 — Harmonisation du module `Emploi du temps`

- [x] Brancher l'entrée drawer `Emploi du temps` sur le bon écran de classe
- [x] Harmoniser le libellé mobile avec l'attendu produit web (`Emploi du temps`) tout en conservant une terminologie interne cohérente si l'écran parle encore d'agenda
- [x] Aligner le header de l'écran avec les autres modules de classe
- [ ] Vérifier la cohérence visuelle et ergonomique avec `Notes`
- [ ] Vérifier les permissions enseignant / établissement déjà en place

Livraison phase 9 :

- la sous-route `classe > Emploi du temps` ouvre toujours le moteur `Agenda` existant, mais expose désormais un libellé produit `Emploi du temps`
- le header et l'onglet verrouillé de la vue de classe utilisent maintenant ce libellé côté enseignant

### Phase 10 — Module `Fil de classe`

- [x] Réutiliser le moteur de `Fil de classe` déjà utilisé dans les parcours de classe existants
- [x] Raccorder ce moteur à la navigation contextuelle enseignant par classe
- [x] Garantir que le flux métier reste le même que celui vu dans la classe côté élève, avec adaptations d'actions selon le rôle
- [x] Prévoir un header cohérent, un contexte `classId` clair et les états standards
- [x] Garantir que l'ouverture depuis le drawer mène directement au fil de la bonne classe

Livraison phase 10 :

- `/(home)/classes/[classId]/feed` n'est plus un placeholder
- la route enseignant charge le même fil métier de classe (`viewScope: CLASS`, `classId` courant) que les autres parcours de classe
- la publication depuis cet écran est forcée sur la classe courante pour éviter tout décalage de contexte

### Phase 11 — Module `Discipline`

- [x] Vérifier l'existence réelle du module `Discipline` côté mobile
- [x] Si le module existe, le brancher à la navigation contextuelle par classe
- [x] Réutiliser les briques existantes `discipline` et `vie scolaire` au lieu de dupliquer le métier
- [x] Remplacer le placeholder par une vraie route contextuelle de classe avec `classId`
- [x] Prévoir la visibilité correcte selon rôle et permissions

Livraison phase 11 :

- `/(home)/classes/[classId]/discipline` ouvre maintenant un vrai écran enseignant contextualisé par classe
- l'écran expose deux tabs type messagerie :
  - `Événements`
  - `Carnets`
- `Événements` :
  - charge et agrège les événements de discipline de tous les élèves de la classe
  - trie du plus récent au plus ancien
  - propose un filtre élève via liste déroulante
  - conserve les actions `modifier/supprimer` selon permissions :
    - auteur
    - professeur référent
    - rôles puissants établissement
  - propose un FAB de création
- le formulaire enseignant utilise désormais `react-hook-form` + `zodResolver`
- le brouillon de création est persisté en Zustand par `classId`
- `Carnets` réutilise la vue synthèse vie scolaire de l'élève au lieu de la réécrire
- factorisations livrées :
  - `DisciplineSummaryOverview`
  - `UnderlineTabs`
  - `StudentSelectField`
  - extension de `DisciplineList` avec infinite scroll

### Phase 12 — Module `Homework`

- Prochaine étape produit maintenant que `Discipline` est livrée
- [ ] Vérifier l'existence réelle du module `Homework` côté mobile
- [ ] Si le module existe, le brancher à la navigation contextuelle par classe
- [ ] S'il n'existe pas encore, créer une route contextuelle propre et préparée pour l'implémentation future
- [ ] Prévoir un header homogène avec les autres modules de classe
- [ ] Prévoir les états standard même si le métier est livré plus tard

### Phase 13 — Harmonisation visuelle transversale des modules de classe

- [ ] Définir une grammaire UI commune à tous les modules de classe
- [ ] Standardiser :
  - `ModuleHeader`
  - sous-titre contextuel avec nom de classe
  - bouton menu
  - top tabs si sous-vues
  - pull-to-refresh
  - états vides / erreurs / chargement
  - testIDs cohérents
- [ ] Veiller à ce que `Notes`, `Emploi du temps`, `Fil de classe`, `Discipline` et `Homework` paraissent appartenir au même système

### Phase 14 — Tests unitaires

- [ ] Ajouter les tests unitaires de la logique de navigation par classe
- [ ] Couvrir :
  - fabrique `buildTeacherClassItems(...)`
  - mapping des routes
  - détection d'item actif
  - comportement des sections de classes
- [ ] Compléter si nécessaire les tests unitaires `notes` et `timetable` touchés par le refactor

### Phase 15 — Tests fonctionnels

- [ ] Ajouter les tests fonctionnels du drawer enseignant avec sections par classe
- [ ] Vérifier :
  - affichage des classes
  - ouverture d'une section classe
  - présence des sous-modules
  - navigation au clic
  - état actif visuel
- [ ] Ajouter les tests fonctionnels des écrans modules classe mis à jour :
  - `Notes`
  - `Emploi du temps`
  - `Fil de classe`
  - `Discipline`
  - `Homework` si applicable

### Phase 16 — Tests d'intégration

- [ ] Ajouter des tests d'intégration du parcours complet enseignant
- [ ] Couvrir les scénarios :
  - ouverture du drawer
  - sélection d'une classe
  - entrée dans un sous-module
  - propagation correcte du `classId`
  - chargement des bonnes données
- [ ] Ajouter une couverture d'intégration spécifique au parcours `classe > Notes`
- [ ] Ajouter une couverture d'intégration spécifique au parcours `classe > Emploi du temps`

### Phase 17 — Validation finale

- [ ] Exécuter les validations ciblées navigation / notes / timetable
- [ ] Exécuter ensuite la suite qualité complète :
  - `npm run format`
  - `npm run format:check`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
- [ ] Vérifier que les parcours parent/enfant et enseignant existants n'ont pas régressé

### Règle de reprise par un autre agent

- toujours reprendre depuis la première case non cochée
- ne pas commencer par `Notes` tant que la navigation par classe n'est pas en place
- brancher d'abord la structure de navigation, puis les modules déjà existants
- `Discipline` est désormais livrée
- prochaine brique produit à traiter : `Homework`
- après `Homework`, enchaîner sur harmonisation visuelle puis tests
- si le contexte est coupé, relire cette section avant toute modification

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
