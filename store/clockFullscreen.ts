import { create } from 'zustand'

export const useClockFullscreen = create<{
    active: boolean
    setActive: (active: boolean) => void
}>((set) => ({
    active: false,
    setActive: (active) => set({ active }),
}))
