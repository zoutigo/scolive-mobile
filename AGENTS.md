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

## Tests E2E (Detox)

- Les tests vivent dans `e2e/tests/`
- Le mock server (`e2e/mock-server/server.js`) remplace l'API réelle sur le port 3001
- Chaque champ critique (en bas d'écran, susceptible d'être masqué par le clavier) doit avoir
  un test de visibilité post-focus :
  ```typescript
  await element(by.id("input-answer-2")).tap();
  await waitFor(element(by.id("input-answer-2"))).toBeVisible().withTimeout(2000);
  ```
- `npm run e2e:build` → rebuild APK Detox (requis après changement natif)
- `npm run e2e:test` → lance les tests (émulateur + Metro doivent tourner)

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
| `app/recovery/pin.tsx`      | `/recovery/pin`      | Récupération PIN (3 étapes)          |
| `app/recovery/password.tsx` | `/recovery/password` | Récupération mot de passe (4 étapes) |
