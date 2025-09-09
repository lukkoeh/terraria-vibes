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
  moveSlot: (from: number, to: number) => void

}

const INVENTORY_SIZE = 81 // 9x9 grid
const EMPTY_SLOTS: Slot[] = Array.from({length:INVENTORY_SIZE}, () => ({item: null, count: 0}))

function isTool(item: ItemType | null): item is ToolItem {
  return item === 'axe' || item === 'shovel' || item === 'pickaxe'
}

export const useStore = create<StoreState>()(persist((set, get) => ({
  selectedSlot: 0,
  setSelectedSlot: (i) => set({ selectedSlot: Math.max(0, Math.min(9, i)) }), // hotbar 10 slots (0..9)
  incSelectedSlot: (delta) => set(({ selectedSlot }) => {
    const n = 10
    const nx = ((selectedSlot + delta) % n + n) % n
    return { selectedSlot: nx }
  }),

  slots: EMPTY_SLOTS,
  addItem: (item, count = 1) => {
    // Ensure we always have INVENTORY_SIZE slots
    const slots = [...get().slots]
    while (slots.length < INVENTORY_SIZE) slots.push({ item: null, count: 0 })
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
  moveSlot: (from, to) => {
    if (from === to) return
    const slots = [...get().slots]
    while (slots.length < INVENTORY_SIZE) slots.push({ item: null, count: 0 })
    if (from < 0 || from >= slots.length || to < 0 || to >= slots.length) return
    const a = { ...slots[from] }
    const b = { ...slots[to] }
    if (!a.item) return
    const sameStackable = !isTool(a.item) && b.item === a.item && !isTool(b.item as any)
    if (!b.item) {
      // move
      slots[to] = a
      slots[from] = { item: null, count: 0 }
    } else if (sameStackable) {
      // merge stacks up to 999
      const space = 999 - b.count
      const toAdd = Math.max(0, Math.min(space, a.count))
      b.count += toAdd
      a.count -= toAdd
      slots[to] = b
      if (a.count <= 0) {
        slots[from] = { item: null, count: 0 }
      } else {
        slots[from] = a
      }
    } else {
      // swap (tools included)
      slots[to] = a
      slots[from] = b
    }
    set({ slots })
  },

}), {
  name: 'terraria-lite',
  version: 2,
  // Pad inventory to new size on migration
  migrate: (persisted: any, version: number) => {
    if (!persisted) return persisted
    if (!Array.isArray(persisted.slots)) return persisted
    const slots = [...persisted.slots]
    while (slots.length < INVENTORY_SIZE) slots.push({ item: null, count: 0 })
    return { ...persisted, slots }
  },
  partialize: (s) => ({ selectedSlot: s.selectedSlot, slots: s.slots })
}))
