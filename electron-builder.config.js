module.exports = {
  appId: 'com.pixelmotion.app',
  productName: 'PixelMotion AI',
  directories: {
    output: 'release'
  },
  files: [
    'dist-electron/**/*',
    'dist/renderer/**/*'
  ],
  win: {
    target: 'nsis',
    icon: 'assets/icons/icon.ico'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true
  }
};
