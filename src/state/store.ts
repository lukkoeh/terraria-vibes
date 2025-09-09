import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export enum Tile {
  Empty = 0,
  Dirt = 1,
  Stone = 2,
  Wood = 3,
  Background = 4,
  Leaves = 5,
  Trunk = 6,
  Grass = 7
}

export type ToolItem = 'axe' | 'shovel' | 'pickaxe'
export type ItemType = Tile.Dirt | Tile.Stone | Tile.Wood | ToolItem

export interface Slot {
  item: ItemType | null
  count: number
}

interface StoreState {
  selectedSlot: number
  setSelectedSlot: (i: number) => void
  incSelectedSlot: (delta: number) => void

  slots: Slot[]
  addItem: (item: ItemType, count?: number) => void
  consumeSelected: (n?: number) => boolean

}

const EMPTY_SLOTS: Slot[] = Array.from({length:10}, () => ({item: null, count: 0}))

function isTool(item: ItemType | null): item is ToolItem {
  return item === 'axe' || item === 'shovel' || item === 'pickaxe'
}

export const useStore = create<StoreState>()(persist((set, get) => ({
  selectedSlot: 0,
  setSelectedSlot: (i) => set({ selectedSlot: Math.max(0, Math.min(9, i)) }),
  incSelectedSlot: (delta) => set(({ selectedSlot }) => {
    const n = 10
    const nx = ((selectedSlot + delta) % n + n) % n
    return { selectedSlot: nx }
  }),

  slots: EMPTY_SLOTS,
  addItem: (item, count = 1) => {
    const slots = [...get().slots]
    if (isTool(item)) {
      // Tools sind nicht stackbar; wenn bereits vorhanden → nichts tun
      const hasAlready = slots.some(s => s.item === item)
      if (hasAlready) { set({ slots }); return }
      // In ersten freien Slot legen
      for (let i=0;i<slots.length;i++) {
        if (slots[i].item === null) { slots[i] = { item, count: 1 }; break }
      }
      set({ slots })
      return
    } else {
      // Stack in vorhandene Slots
      for (let i=0;i<slots.length;i++) {
        const s = slots[i]
        if (s.item === item && s.count < 999) {
          const space = 999 - s.count
          const toAdd = Math.min(space, count)
          s.count += toAdd
          count -= toAdd
          if (count <= 0) break
        }
      }
      // Leere Slots füllen
      for (let i=0;i<slots.length && count>0;i++) {
        const s = slots[i]
        if (s.item === null) {
          const toAdd = Math.min(999, count)
          slots[i] = { item, count: toAdd }
          count -= toAdd
        }
      }
    }
    set({ slots })
  },
  consumeSelected: (n = 1) => {
    const { selectedSlot } = get()
    const slots = [...get().slots]
    const s = slots[selectedSlot]
    if (!s || !s.item) return false
    if (isTool(s.item)) return false
    if (s.count <= 0) return false
    s.count = Math.max(0, s.count - n)
    if (s.count === 0) s.item = null
    set({ slots })
    return true
  },

}), { 
  name: 'terraria-lite',
  partialize: (s) => ({ selectedSlot: s.selectedSlot, slots: s.slots })
}))
