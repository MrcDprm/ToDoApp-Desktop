import { useEffect } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../api/firebase'
import { useTodoStore } from '../store/todoStore'
import { useAuthStore } from '../store/authStore'
import type { TodoFormData } from '../types'

export function useTodos() {
  const { todos, loading, setTodos, setLoading } = useTodoStore()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!user) {
      setTodos([])
      return
    }

    setLoading(true)

    const q = query(
      collection(db, 'todos'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Parameters<typeof setTodos>[0]
      setTodos(items)
      setLoading(false)
    })

    return unsubscribe
  }, [user, setTodos, setLoading])

  async function createTodo(data: TodoFormData) {
    if (!user) return

    await addDoc(collection(db, 'todos'), {
      userId: user.uid,
      title: data.title.trim(),
      description: data.description.trim(),
      dueDate: data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : null,
      isCompleted: false,
      createdAt: Timestamp.now(),
    })
  }

  async function editTodo(id: string, data: TodoFormData) {
    const ref = doc(db, 'todos', id)
    const dueDate = data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : undefined
    const firestoreUpdates: Record<string, unknown> = {
      title: data.title.trim(),
      description: data.description.trim(),
      dueDate: dueDate ?? null,
    }
    await updateDoc(ref, firestoreUpdates)
  }

  async function toggleTodo(id: string, isCompleted: boolean) {
    const ref = doc(db, 'todos', id)
    await updateDoc(ref, { isCompleted })
  }

  async function deleteTodo(id: string) {
    await deleteDoc(doc(db, 'todos', id))
  }

  async function createManyTodos(titles: string[]) {
    if (!user) return
    await Promise.all(
      titles.map((title) =>
        addDoc(collection(db, 'todos'), {
          userId: user.uid,
          title: title.trim(),
          description: '',
          dueDate: null,
          isCompleted: false,
          createdAt: Timestamp.now(),
        }),
      ),
    )
  }

  return { todos, loading, createTodo, editTodo, toggleTodo, deleteTodo, createManyTodos }
}
