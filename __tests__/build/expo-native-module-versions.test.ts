/**
 * Test de non-régression pour l'incident du 2026-08-08 : le dernier build
 * Android publié en prod ne démarrait plus (crash immédiat avant l'écran de
 * login) à cause d'un module natif Expo (`expo-font`) résolu en version
 * 57.0.1 à la racine de node_modules alors qu'`expo-modules-core` restait en
 * 55.0.25 (SDK 55) — dérive de hoisting npm sur une dépendance transitive
 * jamais déclarée directement dans package.json (tirée par
 * @expo/vector-icons).
 *
 * Le code natif compilait et le build Gradle réussissait quand même : seule
 * l'exécution sur device révélait le crash
 * (java.lang.NoSuchMethodError: ReturnTypeKt.getDirectConverter). Ni le
 * typecheck, ni le lint, ni `npm install`/`npm ci`, ni un build Gradle qui
 * se termine sans erreur ne détectent ce type d'anomalie : seule
 * l'inspection de l'arbre de dépendances réellement installé le fait.
 *
 * Ce test s'exécute dans `npm test`, donc dans le job "Unit tests" de
 * .github/workflows/ci.yml, sur chaque push/PR — avant tout build natif.
 */
import { checkNativeModuleVersions } from "../../scripts/check-expo-versions";

describe("modules natifs Expo — cohérence des versions installées", () => {
  it("ne détecte aucun module natif Expo dupliqué ou désaligné avec le SDK courant", () => {
    const errors = checkNativeModuleVersions();

    if (errors.length > 0) {
      throw new Error(
        `${errors.length} anomalie(s) détectée(s) sur les modules natifs Expo :\n\n` +
          errors.map((message) => `  ✗ ${message}`).join("\n\n") +
          `\n\nCorrige les versions dans package.json en te basant sur ` +
          `node_modules/expo/bundledNativeModules.json, puis relance npm install.`,
      );
    }
  });
});
