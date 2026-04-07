import { contextBridge, ipcRenderer } from 'electron'

export interface SerializedTodo {
  id: string
  title: string
  dueDate: { seconds: number; nanoseconds: number } | null
  isCompleted: boolean
}

contextBridge.exposeInMainWorld('electronAPI', {
  getPlatform: (): Promise<string> => ipcRenderer.invoke('get-platform'),

  onCheckDueTasks: (callback: () => void): void => {
    ipcRenderer.on('check-due-tasks', () => callback())
  },

  sendDueTasks: (todos: SerializedTodo[]): void => {
    ipcRenderer.send('due-tasks-response', todos)
  },

  removeCheckDueTasksListener: (): void => {
    ipcRenderer.removeAllListeners('check-due-tasks')
  },
})
