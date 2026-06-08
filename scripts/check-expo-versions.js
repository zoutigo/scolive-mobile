#!/usr/bin/env node
// Vérifie que les packages natifs Expo dans package.json sont alignés
// avec la version majeure attendue par bundledNativeModules.json.
// Un écart de version majeure provoque des erreurs de build Android/iOS
// (ex: @OptimizedRecord absent, TurboModule incompatible, etc.)

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const bundled = JSON.parse(
  fs.readFileSync(
    path.join(root, "node_modules/expo/bundledNativeModules.json"),
    "utf8",
  ),
);
const pkg = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);

const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

function extractMajor(range) {
  const match = range.replace(/^[~^>=<\s*]+/, "").match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : NaN;
}

let errors = 0;

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
    console.error(
      `  ✗ ${name}\n` +
        `      package.json : "${actualRange}"\n` +
        `      Expo SDK 55  : "${expectedRange}"`,
    );
    errors++;
  }
}

if (errors > 0) {
  console.error(
    `\n${errors} package(s) incompatible avec Expo SDK 55.\n` +
      `Corrige les versions dans package.json en te basant sur :\n` +
      `  node_modules/expo/bundledNativeModules.json\n`,
  );
  process.exit(1);
}

console.log("✓ Tous les packages natifs Expo sont compatibles avec SDK 55.");
