const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix macOS /var vs /private/var symlink mismatch during EAS local builds.
// getDefaultConfig may resolve __dirname via fs.realpathSync internally,
// causing projectRoot to be /private/var/... while ENTRY_FILE uses /var/...
config.projectRoot = __dirname;

module.exports = config;
