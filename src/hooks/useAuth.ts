import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../api/firebase'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types'

export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore()
        unsubscribeFirestore = null
      }

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid)
        const snapshot = await getDoc(userRef)

        if (snapshot.exists()) {
          setUser(snapshot.data() as User)
        } else {
          setUser(null)
        }

        unsubscribeFirestore = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setUser(snap.data() as User)
          }
        })
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeFirestore) unsubscribeFirestore()
    }
  }, [setUser, setLoading])

  return { user, loading }
}
