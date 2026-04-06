import { useEffect } from 'react'
import { useTodoStore } from '../store/todoStore'

export function useNotifications() {
  const todos = useTodoStore((s) => s.todos)

  useEffect(() => {
    if (!window.electronAPI) return

    window.electronAPI.onCheckDueTasks(() => {
      const serialized = todos.map((t) => ({
        id: t.id,
        title: t.title,
        isCompleted: t.isCompleted,
        dueDate: t.dueDate
          ? { seconds: t.dueDate.seconds, nanoseconds: t.dueDate.nanoseconds }
          : null,
      }))
      window.electronAPI?.sendDueTasks(serialized)
    })

    return () => {
      window.electronAPI?.removeCheckDueTasksListener()
    }
  }, [todos])
}
