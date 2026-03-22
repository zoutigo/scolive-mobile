const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { FileStore } = require("metro-cache");

const config = getDefaultConfig(__dirname);

// Cache Metro persistant dans .metro-cache/ (survit aux npm install)
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, ".metro-cache") }),
];

// Réduire ce que Metro surveille pour accélérer la détection de changements
config.resolver.blockList = [
  /\.git\/.*/,
  /\.metro-cache\/.*/,
  /__tests__\/.*/,
  /node_modules\/.*\/node_modules\/react-native\/.*/,
];

module.exports = config;
