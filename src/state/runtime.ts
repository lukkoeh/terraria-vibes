import { create } from 'zustand'

export interface PlayerSnapshot {
  x: number
  y: number
  vx: number
  vy: number
  onGround: boolean
}

type Tool = 'none' | 'axe' | 'shovel' | 'pickaxe'

interface RuntimeState {
  player: PlayerSnapshot
  setPlayer: (p: Partial<PlayerSnapshot>) => void
  debugText: string
  setDebugText: (t: string) => void
  tool: Tool
  setTool: (t: Tool) => void
  // UI state
  paused: boolean
  setPaused: (v: boolean) => void
  menuOpen: boolean
  setMenuOpen: (v: boolean) => void
  inventoryOpen: boolean
  setInventoryOpen: (v: boolean) => void
  zoom: number
  setZoom: (z: number) => void
}

export const useRuntime = create<RuntimeState>()((set, get) => ({
  player: { x: 0, y: 0, vx: 0, vy: 0, onGround: false },
  setPlayer: (p) => set({ player: { ...get().player, ...p } }),
  debugText: '',
  setDebugText: (t) => set({ debugText: t }),
  tool: 'none',
  setTool: (t) => set({ tool: t }),
  paused: false,
  setPaused: (v) => set({ paused: v }),
  menuOpen: false,
  setMenuOpen: (v) => set({ menuOpen: v }),
  inventoryOpen: false,
  setInventoryOpen: (v) => set({ inventoryOpen: v }),
  zoom: 2,
  setZoom: (z) => set({ zoom: Math.max(1, Math.min(4, z)) }),
}))
