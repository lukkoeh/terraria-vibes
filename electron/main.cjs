// CommonJS to avoid ESM friction with Electron main
const { app, BrowserWindow } = require('electron')
const path = require('path')

const isDev = process.env.ELECTRON_START_URL || process.env.VITE_DEV_SERVER_URL

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: '#0a0e1a',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  })

  win.once('ready-to-show', () => win.show())

  if (isDev) {
    const url = process.env.ELECTRON_START_URL || 'http://localhost:5173'
    win.loadURL(url)
    // Uncomment to open devtools by default
    // win.webContents.openDevTools({ mode: 'detach' })
  } else {
    const indexHtml = path.join(__dirname, '..', 'dist', 'index.html')
    win.loadFile(indexHtml)
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

