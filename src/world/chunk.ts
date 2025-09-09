import { CHUNK_SIZE } from './types'
import { Tile } from '../state/store'

export class Chunk {
  cx: number; cy: number
  dirty = true
  generated = false
  tiles: Uint16Array
  bg: Uint16Array
  constructor(cx: number, cy: number) {
    this.cx = cx; this.cy = cy
    this.tiles = new Uint16Array(CHUNK_SIZE * CHUNK_SIZE)
    this.bg = new Uint16Array(CHUNK_SIZE * CHUNK_SIZE)
  }
  index(lx: number, ly: number) { return ly * CHUNK_SIZE + lx }
  get(lx: number, ly: number) { return this.tiles[this.index(lx,ly)] as Tile }
  set(lx: number, ly: number, t: Tile) { this.tiles[this.index(lx,ly)] = t }
  getBg(lx: number, ly: number) { return this.bg[this.index(lx,ly)] as Tile }
  setBg(lx: number, ly: number, t: Tile) { this.bg[this.index(lx,ly)] = t }
}
