const fs = require('node:fs');
const path = require('node:path');

const iconBasePath = path.resolve(__dirname, 'assets/icons/stembridge');
const macIconPath = `${iconBasePath}.icns`;
const windowsIconPath = `${iconBasePath}.ico`;
const linuxIconPath = `${iconBasePath}.png`;

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

const squirrelConfig = {
  name: 'StemBridge',
  setupExe: 'StemBridgeSetup.exe',
};

if (fs.existsSync(windowsIconPath)) {
  squirrelConfig.setupIcon = windowsIconPath;
}

const linuxOptions = {
  name: 'stembridge',
  productName: 'StemBridge',
  genericName: 'Music Collaboration',
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
