import { Tile } from '../state/store'

export const TILE_SIZE = 16
export const WORLD_HEIGHT = 200
export const CHUNK_SIZE = 32

export type Layer = 'foreground' | 'background'

export function isSolid(tile: Tile) {
  return tile === Tile.Dirt || tile === Tile.Stone || tile === Tile.Wood || tile === (Tile as any).Grass
}
