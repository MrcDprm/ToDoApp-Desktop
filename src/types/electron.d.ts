interface SerializedTodo {
  id: string
  title: string
  dueDate: { seconds: number; nanoseconds: number } | null
  isCompleted: boolean
}

interface ElectronAPI {
  getPlatform: () => Promise<string>
  onCheckDueTasks: (callback: () => void) => void
  sendDueTasks: (todos: SerializedTodo[]) => void
  removeCheckDueTasksListener: () => void
}

declare interface Window {
  electronAPI?: ElectronAPI
}
