import { create } from 'zustand'
import type { Todo } from '../types'

interface TodoState {
  todos: Todo[]
  loading: boolean
  setTodos: (todos: Todo[]) => void
  addTodo: (todo: Todo) => void
  updateTodo: (id: string, updates: Partial<Todo>) => void
  removeTodo: (id: string) => void
  setLoading: (loading: boolean) => void
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  loading: false,
  setTodos: (todos) => set({ todos }),
  addTodo: (todo) => set((state) => ({ todos: [todo, ...state.todos] })),
  updateTodo: (id, updates) =>
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTodo: (id) =>
    set((state) => ({ todos: state.todos.filter((t) => t.id !== id) })),
  setLoading: (loading) => set({ loading }),
}))
