import type { Timestamp } from 'firebase/firestore'

export interface User {
  uid: string
  email: string
  displayName: string
  aiUsageCount: number
  lastAiUsageDate?: string
  createdAt: Timestamp
}

export interface Todo {
  id: string
  userId: string
  title: string
  description: string
  dueDate: Timestamp
  isCompleted: boolean
  createdAt: Timestamp
}

export interface TodoFormData {
  title: string
  description: string
  dueDate: string
}
