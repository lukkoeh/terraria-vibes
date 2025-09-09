import { useStore, Tile, ItemType } from '../state/store'

export function pickup(tile: ItemType, count = 1) {
  useStore.getState().addItem(tile, count)
}