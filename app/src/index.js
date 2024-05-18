const { app, BrowserWindow, globalShortcut} = require('electron');
const path = require('path');
const fs = require('fs')

let user_dir
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 876,
    height: 600,
    'minWidth': 875,
    show: false,
    // icon: './img/workbook',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true
    },
  });

  // and load the index.html of the app.
  if (!fs.existsSync(path.join(user_dir, 'settings.json')))
    fs.writeFileSync(path.join(user_dir, 'settings.json'), JSON.stringify({
    "user_type": null
  }))
  const user_type = JSON.parse(fs.readFileSync(path.join(user_dir, 'settings.json'), 'utf8')).user_type
  if (user_type === null)
    mainWindow.loadFile(path.join(__dirname, 'main_pages', 'splashscreen','splashscreen.html'));
  else
    mainWindow.loadFile(path.join(__dirname, 'main_pages', 'front_page','index.html'));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
  mainWindow.setMenuBarVisibility(false)
  mainWindow.maximize()
  mainWindow.show()
  globalShortcut.register('CommandOrControl+Shift+K', () => {
    mainWindow.webContents.toggleDevTools();
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  fs.writeFileSync(path.join(__dirname, 'user_dir.txt'), path.join(app.getPath('userData'), 'user_data'));
  user_dir = path.join(app.getPath('userData'), 'user_data')
  if (!fs.existsSync(user_dir)) {
    fs.mkdirSync(user_dir);
  }
  if (!fs.existsSync(path.join(user_dir, 'last.txt'))) {
    fs.writeFileSync(path.join(user_dir, 'last.txt'), '');
  }
  createWindow()
})
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

