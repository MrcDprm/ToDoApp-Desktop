import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import {
  scheduleNotifications,
  handleDueTasks,
  clearScheduledNotifications,
  type SerializedTodo,
} from './notifications'

const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
    backgroundColor: '#0f172a',
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    clearScheduledNotifications()
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  if (mainWindow) {
    mainWindow.once('ready-to-show', () => {
      scheduleNotifications(mainWindow)
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  clearScheduledNotifications()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('get-platform', () => process.platform)

ipcMain.on('due-tasks-response', (_event, todos: SerializedTodo[]) => {
  handleDueTasks(todos)
})
