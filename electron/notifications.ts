import { Notification, BrowserWindow } from 'electron'

interface Todo {
  id: string
  title: string
  dueDate: Date
  isCompleted: boolean
}

let notificationInterval: ReturnType<typeof setInterval> | null = null
let morningNotificationTimeout: ReturnType<typeof setTimeout> | null = null

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

  const msUntilMorning = target.getTime() - now.getTime()

  morningNotificationTimeout = setTimeout(() => {
    sendNativeNotification(
      'Günaydın! Bugünkü görevleriniz hazır.',
      'ToDoApp görev listenize göz atın ve güne hazırlanın.'
    )

    morningNotificationTimeout = setTimeout(() => {
      scheduleMorningNotification()
    }, 24 * 60 * 60 * 1000)
  }, msUntilMorning)
}

function startDueDateChecker(mainWindow: BrowserWindow | null): void {
  notificationInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    mainWindow.webContents.send('check-due-tasks')
  }, 60 * 1000)
}

export function checkAndNotifyDueTasks(todos: Todo[]): void {
  const now = new Date()
  const thirtyMinutes = 30 * 60 * 1000

  todos.forEach((todo) => {
    if (todo.isCompleted) return

    const dueTime = new Date(todo.dueDate).getTime()
    const diff = dueTime - now.getTime()

    if (diff > 0 && diff <= thirtyMinutes) {
      sendNativeNotification(
        `Görev yaklaşıyor: ${todo.title}`,
        `Bu görev 30 dakika içinde sona eriyor.`
      )
    }
  })
}

export function sendNativeNotification(title: string, body: string): void {
  if (!Notification.isSupported()) return

  const notification = new Notification({ title, body })
  notification.show()
}

export function clearScheduledNotifications(): void {
  if (notificationInterval) {
    clearInterval(notificationInterval)
    notificationInterval = null
  }
  if (morningNotificationTimeout) {
    clearTimeout(morningNotificationTimeout)
    morningNotificationTimeout = null
  }
}
