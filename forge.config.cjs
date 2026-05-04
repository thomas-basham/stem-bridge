const fs = require('node:fs');
const path = require('node:path');

const iconBasePath = path.resolve(__dirname, 'assets/icons/stembridge');
const macIconPath = `${iconBasePath}.icns`;
const windowsIconPath = `${iconBasePath}.ico`;
const linuxIconPath = `${iconBasePath}.png`;
const shouldSignMac =
  process.env.MAC_CODESIGN === 'true' ||
  Boolean(process.env.MAC_CODESIGN_IDENTITY) ||
  Boolean(process.env.APPLE_KEYCHAIN_PROFILE) ||
  Boolean(process.env.APPLE_ID && process.env.APPLE_APP_SPECIFIC_PASSWORD && process.env.APPLE_TEAM_ID) ||
  Boolean(process.env.APPLE_API_KEY && process.env.APPLE_API_KEY_ID && process.env.APPLE_API_ISSUER);

const hasAppleIdNotarization =
  Boolean(process.env.APPLE_ID) &&
  Boolean(process.env.APPLE_APP_SPECIFIC_PASSWORD) &&
  Boolean(process.env.APPLE_TEAM_ID);
const hasApiKeyNotarization =
  Boolean(process.env.APPLE_API_KEY) &&
  Boolean(process.env.APPLE_API_KEY_ID) &&
  Boolean(process.env.APPLE_API_ISSUER);

const packagerConfig = {
  asar: true,
  name: 'StemBridge',
  executableName: 'StemBridge',
  appBundleId: 'com.stembridge.desktop',
  appCategoryType: 'public.app-category.music',
  ignore: [
    /^\/\.env(?:\..*)?$/,
    /^\/\.git(?:\/|$)/,
    /^\/assets\/icons\/README\.md$/,
    /^\/dist(?:\/|$)/,
    /^\/src(?:\/|$)/,
    /^\/electron\.vite\.config\./,
    /^\/vitest\.config\./,
    /^\/eslint\.config\./,
    /^\/tsconfig(?:\..*)?\.json$/,
    /^\/README\.md$/,
  ],
};

if (fs.existsSync(macIconPath) || fs.existsSync(windowsIconPath)) {
  packagerConfig.icon = iconBasePath;
}

if (shouldSignMac) {
  packagerConfig.osxSign = {
    identity: process.env.MAC_CODESIGN_IDENTITY || undefined,
  };

  if (process.env.APPLE_KEYCHAIN_PROFILE) {
    packagerConfig.osxNotarize = {
      keychainProfile: process.env.APPLE_KEYCHAIN_PROFILE,
    };
  } else if (hasAppleIdNotarization) {
    packagerConfig.osxNotarize = {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    };
  } else if (hasApiKeyNotarization) {
    packagerConfig.osxNotarize = {
      appleApiKey: process.env.APPLE_API_KEY,
      appleApiKeyId: process.env.APPLE_API_KEY_ID,
      appleApiIssuer: process.env.APPLE_API_ISSUER,
    };
  }
}

const squirrelConfig = {
  name: 'StemBridge',
  authors: 'StemBridge',
  setupExe: 'StemBridgeSetup.exe',
};

if (fs.existsSync(windowsIconPath)) {
  squirrelConfig.setupIcon = windowsIconPath;
}

const linuxOptions = {
  name: 'stembridge',
  bin: 'StemBridge',
  productName: 'StemBridge',
  genericName: 'Music Collaboration',
  license: 'UNLICENSED',
  categories: ['AudioVideo', 'Audio'],
  maintainer: 'StemBridge',
};

if (fs.existsSync(linuxIconPath)) {
  linuxOptions.icon = linuxIconPath;
}

module.exports = {
  outDir: 'dist/forge',
  packagerConfig,
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: squirrelConfig,
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {
        options: linuxOptions,
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      platforms: ['linux'],
      config: {
        options: linuxOptions,
      },
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'thomas-basham',
          name: 'stem-bridge',
        },
        draft: true,
        prerelease: false,
      },
    },
  ],
};
