import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../api/firebase'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types'

export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          setUser(userDoc.data() as User)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [setUser, setLoading])

  return { user, loading }
}
