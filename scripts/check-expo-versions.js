#!/usr/bin/env node
// Vérifie que les modules natifs Expo installés sont alignés avec la version
// attendue par bundledNativeModules.json (SDK courant), et qu'aucun d'eux
// n'existe en plusieurs versions différentes dans l'arbre de dépendances.
//
// Un écart de version (déclaré ou transitif) ou une duplication provoque des
// erreurs au runtime Android/iOS qui ne sont détectables ni par le typecheck,
// ni par un simple `npm install`, ni par un build Gradle qui se termine avec
// succès : le code natif compile mais plante au démarrage
// (ex: java.lang.NoSuchMethodError dans un module expo-* dont l'API Kotlin
// ne correspond plus à celle d'expo-modules-core réellement embarquée).
//
// Incident de référence : expo-font résolu en 57.0.1 à la racine de
// node_modules alors qu'expo-modules-core restait en 55.0.25 (SDK 55), à
// cause d'un hoisting npm incohérent sur une dépendance transitive
// (via @expo/vector-icons) jamais déclarée directement dans package.json.
// L'app crashait immédiatement au lancement, avant l'écran de login.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.join(__dirname, "..");

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), "utf8"));
}

function extractMajor(range) {
  const match = range.replace(/^[~^>=<\s*]+/, "").match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : NaN;
}

function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return { major: +match[1], minor: +match[2], patch: +match[3] };
}

/**
 * Vérifie qu'une version installée respecte un range Expo/npm simple
 * (exact, "~x.y.z" ou "^x.y.z" — les seules formes utilisées par
 * bundledNativeModules.json). Volontairement permissif sur tout le reste
 * (retourne true) : ce garde-fou cible les dérives de version, pas la
 * validation exhaustive de ranges npm.
 */
function satisfiesExpoRange(version, range) {
  const actual = parseVersion(version);
  if (!actual) return true;

  if (range.startsWith("~")) {
    const expected = parseVersion(range.slice(1));
    if (!expected) return true;
    return actual.major === expected.major && actual.minor === expected.minor;
  }

  if (range.startsWith("^")) {
    const expected = parseVersion(range.slice(1));
    if (!expected) return true;
    if (expected.major > 0) return actual.major === expected.major;
    if (expected.minor > 0)
      return actual.major === 0 && actual.minor === expected.minor;
    return (
      actual.major === 0 &&
      actual.minor === 0 &&
      actual.patch === expected.patch
    );
  }

  const expected = parseVersion(range);
  if (!expected) return true;
  return (
    actual.major === expected.major &&
    actual.minor === expected.minor &&
    actual.patch === expected.patch
  );
}

/** Collecte, pour chaque package rencontré dans l'arbre `npm ls`, l'ensemble
 * des versions distinctes réellement installées (racine + copies imbriquées). */
function collectInstalledVersions() {
  const versionsByPackage = new Map();

  let tree;
  try {
    const raw = execFileSync("npm", ["ls", "--all", "--json"], {
      cwd: root,
      maxBuffer: 1024 * 1024 * 64,
    }).toString("utf8");
    tree = JSON.parse(raw);
  } catch (err) {
    // `npm ls` sort en erreur (code != 0) dès qu'il détecte un conflit de
    // peer deps, mais imprime quand même le JSON complet sur stdout : on
    // le récupère depuis err.stdout plutôt que d'abandonner la vérification.
    if (err.stdout) {
      tree = JSON.parse(err.stdout.toString("utf8"));
    } else {
      throw err;
    }
  }

  function visit(node) {
    if (!node || typeof node !== "object" || !node.dependencies) return;
    for (const [name, dep] of Object.entries(node.dependencies)) {
      if (dep.version) {
        if (!versionsByPackage.has(name))
          versionsByPackage.set(name, new Set());
        versionsByPackage.get(name).add(dep.version);
      }
      visit(dep);
    }
  }
  visit(tree);

  return versionsByPackage;
}

function getTopLevelResolvedVersion(name) {
  try {
    return readJson(path.join("node_modules", name, "package.json")).version;
  } catch {
    return null;
  }
}

/**
 * Calcule les anomalies de versions de modules natifs Expo, sans rien
 * imprimer ni jamais appeler process.exit — utilisable aussi bien par le
 * script CLI que par un test automatisé (voir
 * __tests__/build/expo-native-module-versions.test.ts).
 *
 * Retourne un tableau de messages d'erreur (vide si tout est cohérent).
 */
function checkNativeModuleVersions() {
  const bundled = readJson("node_modules/expo/bundledNativeModules.json");
  const pkg = readJson("package.json");
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const installedVersions = collectInstalledVersions();

  const errors = [];

  // 1) Paquets natifs Expo déclarés dans package.json : version majeure
  //    alignée avec le SDK courant.
  for (const [name, expectedRange] of Object.entries(bundled)) {
    if (!allDeps[name]) continue;

    const actualRange = allDeps[name];
    const expectedMajor = extractMajor(expectedRange);
    const actualMajor = extractMajor(actualRange);

    if (
      !isNaN(expectedMajor) &&
      !isNaN(actualMajor) &&
      expectedMajor !== actualMajor
    ) {
      errors.push(
        `${name}\n` +
          `      package.json : "${actualRange}"\n` +
          `      Expo SDK courant : "${expectedRange}"`,
      );
    }
  }

  // 2) Tous les modules natifs Expo listés par le SDK, qu'ils soient
  //    déclarés directement ou tirés en transitif : la version RÉELLEMENT
  //    résolue à la racine de node_modules (celle que l'autolinking Android
  //    utilisera) doit correspondre au SDK courant.
  for (const [name, expectedRange] of Object.entries(bundled)) {
    if (!fs.existsSync(path.join(root, "node_modules", name))) continue;

    const resolved = getTopLevelResolvedVersion(name);
    if (!resolved) continue;

    if (!satisfiesExpoRange(resolved, expectedRange)) {
      errors.push(
        `${name} résolu en version incompatible\n` +
          `      node_modules/${name} : "${resolved}"\n` +
          `      attendu (SDK courant) : "${expectedRange}"`,
      );
    }
  }

  // 3) Aucun module natif Expo ne doit exister en plusieurs versions
  //    distinctes dans l'arbre : c'est exactement ce qui a provoqué le
  //    crash de référence (une copie compilée contre une API absente de
  //    l'autre copie effectivement embarquée dans l'APK).
  for (const name of Object.keys(bundled)) {
    const versions = installedVersions.get(name);
    if (!versions || versions.size < 2) continue;

    errors.push(
      `${name} installé en plusieurs versions distinctes : ${[...versions].join(", ")}\n` +
        `      Un build natif ne peut embarquer qu'une seule version d'un module natif.\n` +
        `      Déclare-le explicitement dans package.json (dependencies) pour forcer le hoisting,\n` +
        `      puis relance npm install.`,
    );
  }

  return errors;
}

function run() {
  const errors = checkNativeModuleVersions();

  for (const message of errors) {
    console.error(`  ✗ ${message}`);
  }

  if (errors.length > 0) {
    console.error(
      `\n${errors.length} anomalie(s) détectée(s) sur les modules natifs Expo.\n` +
        `Corrige les versions dans package.json en te basant sur :\n` +
        `  node_modules/expo/bundledNativeModules.json\n`,
    );
    process.exit(1);
  }

  console.log(
    "✓ Tous les modules natifs Expo sont cohérents avec le SDK courant.",
  );
}

if (require.main === module) {
  run();
}

module.exports = {
  run,
  checkNativeModuleVersions,
  collectInstalledVersions,
  getTopLevelResolvedVersion,
};
