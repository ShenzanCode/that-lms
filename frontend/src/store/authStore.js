import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (userData, token) => {
        localStorage.setItem('token', token)
        set({
          user: userData,
          token,
          isAuthenticated: true,
        })
      },
      
      logout: () => {
        localStorage.removeItem('token')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },
      
      updateUser: (userData) => {
        set({ user: userData })
      },
      
      // Sync token from localStorage on hydration
      hydrate: () => {
        const token = localStorage.getItem('token')
        const state = get()
        
        // If token exists in localStorage but not in state, update state
        if (token && !state.token) {
          set({ token, isAuthenticated: true })
        }
        // If token doesn't exist in localStorage but exists in state, clear state
        else if (!token && state.token) {
          set({ token: null, isAuthenticated: false, user: null })
        }
      },
    }),
    {
      name: 'auth-storage',
      // Sync state after rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrate()
        }
      },
    }
  )
)
