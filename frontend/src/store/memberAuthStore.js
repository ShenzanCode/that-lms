import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useMemberAuthStore = create(
  persist(
    (set, get) => ({
      student: null,
      token: null,
      isAuthenticated: false,
      
      login: (studentData, token) => {
        localStorage.setItem('studentToken', token)
        set({
          student: studentData,
          token,
          isAuthenticated: true,
        })
      },
      
      logout: () => {
        localStorage.removeItem('studentToken')
        set({
          student: null,
          token: null,
          isAuthenticated: false,
        })
      },
      
      updateStudent: (studentData) => {
        set({ student: studentData })
      },
      
      // Sync token from localStorage on hydration
      hydrate: () => {
        const token = localStorage.getItem('studentToken')
        const state = get()
        
        // If token exists in localStorage but not in state, update state
        if (token && !state.token) {
          set({ token, isAuthenticated: true })
        }
        // If token doesn't exist in localStorage but exists in state, clear state
        else if (!token && state.token) {
          set({ token: null, isAuthenticated: false, student: null })
        }
      },
    }),
    {
      name: 'student-auth-storage',
      // Sync state after rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrate()
        }
      },
    }
  )
)
