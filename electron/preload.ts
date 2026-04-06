import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  onNotification: (callback: (data: { title: string; body: string }) => void) => {
    ipcRenderer.on('show-notification', (_event, data) => callback(data))
  },
  removeNotificationListener: () => {
    ipcRenderer.removeAllListeners('show-notification')
  },
})
