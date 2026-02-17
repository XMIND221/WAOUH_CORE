import { create } from 'zustand'

interface AuthState {
    user: any
    companyId: string | null
    setUser: (user: any) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    companyId: null,

    setUser: (user) =>
        set({
            user,
            companyId: user?.user_metadata?.company_id ?? null,
        }),

    logout: () =>
        set({
            user: null,
            companyId: null,
        }),
}))