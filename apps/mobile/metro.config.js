const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure Metro starts from the correct directory
config.watchFolders = [__dirname];
config.projectRoot = __dirname;

module.exports = config;
