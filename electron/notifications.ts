import { Notification, BrowserWindow } from 'electron'

export interface SerializedTodo {
  id: string
  title: string
  dueDate: { seconds: number; nanoseconds: number } | null
  isCompleted: boolean
}

const THIRTY_MINUTES_MS = 30 * 60 * 1000

const notifiedIds = new Set<string>()
let dueDateCheckInterval: ReturnType<typeof setInterval> | null = null
let morningTimeout: ReturnType<typeof setTimeout> | null = null

export function scheduleNotifications(mainWindow: BrowserWindow | null): void {
  scheduleMorningNotification()
  startDueDateChecker(mainWindow)
}

function scheduleMorningNotification(): void {
  const now = new Date()
  const target = new Date()
  target.setHours(8, 30, 0, 0)

  if (now >= target) {
    target.setDate(target.getDate() + 1)
  }

  const msUntil = target.getTime() - now.getTime()

  morningTimeout = setTimeout(() => {
    sendNativeNotification(
      'Günaydın! Bugünkü görevleriniz hazır.',
      'ToDoApp görev listenize göz atın ve güne hazırlanın.'
    )
    morningTimeout = setTimeout(function reschedule() {
      scheduleMorningNotification()
    }, 100)
  }, msUntil)
}

function startDueDateChecker(mainWindow: BrowserWindow | null): void {
  dueDateCheckInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    mainWindow.webContents.send('check-due-tasks')
  }, 60 * 1000)
}

export function handleDueTasks(todos: SerializedTodo[]): void {
  const now = Date.now()

  todos.forEach((todo) => {
    if (todo.isCompleted || !todo.dueDate || notifiedIds.has(todo.id)) return

    const dueMs = todo.dueDate.seconds * 1000
    const diff = dueMs - now

    if (diff > 0 && diff <= THIRTY_MINUTES_MS) {
      const minutes = Math.round(diff / 60000)
      sendNativeNotification(
        `Görev yaklaşıyor: ${todo.title}`,
        `Bu görev ${minutes} dakika içinde sona eriyor.`
      )
      notifiedIds.add(todo.id)

      setTimeout(() => notifiedIds.delete(todo.id), THIRTY_MINUTES_MS + 60_000)
    }
  })
}

export function sendNativeNotification(title: string, body: string): void {
  if (!Notification.isSupported()) return
  new Notification({ title, body, silent: false }).show()
}

export function clearScheduledNotifications(): void {
  if (dueDateCheckInterval) {
    clearInterval(dueDateCheckInterval)
    dueDateCheckInterval = null
  }
  if (morningTimeout) {
    clearTimeout(morningTimeout)
    morningTimeout = null
  }
}
