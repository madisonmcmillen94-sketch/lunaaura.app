import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { subscribeAuth, getUserProfile, type UserProfile } from '../lib/auth'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  /** True once we have a real (non-anonymous) signed-in account. */
  isAccount: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  isAccount: false,
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(u: User | null) {
    if (u && !u.isAnonymous) {
      try {
        setProfile(await getUserProfile(u.uid))
      } catch (e) {
        console.error(e)
        setProfile(null)
      }
    } else {
      setProfile(null)
    }
  }

  useEffect(() => {
    const unsubscribe = subscribeAuth((u) => {
      setUser(u)
      loadProfile(u).finally(() => setLoading(false))
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAccount: !!user && !user.isAnonymous,
        refreshProfile: () => loadProfile(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
