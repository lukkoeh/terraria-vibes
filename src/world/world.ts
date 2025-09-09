import { CHUNK_SIZE, WORLD_HEIGHT } from './types'
import { Tile } from '../state/store'
import { Chunk } from './chunk'
import { ValueNoise1D } from '../utils/noise'
import { populateChunk } from './worldGenerator'

function key(cx: number, cy: number) { return `${cx},${cy}` }

export class World {
  height = WORLD_HEIGHT
  seed: number
  chunks = new Map<string, Chunk>()
  changedChunks = new Set<string>()
  noiseTerrain: ValueNoise1D
  noiseForest: ValueNoise1D

  constructor(seed: number) {
    this.seed = seed
    this.noiseTerrain = new ValueNoise1D(seed)
    this.noiseForest = new ValueNoise1D(seed ^ 0x9e3779b9)
  }

  // internal: ensure storage exists (without generation side-effects like marking dirty)
  _ensureChunkStorage(cx: number, cy: number) {
    if (cy < 0 || cy >= Math.ceil(this.height / CHUNK_SIZE)) return null
    const k = key(cx, cy)
    let ch = this.chunks.get(k)
    if (!ch) {
      ch = new Chunk(cx, cy)
      this.chunks.set(k, ch)
    }
    return ch
  }

  getOrCreateChunk(cx: number, cy: number): Chunk | null {
    const ch = this._ensureChunkStorage(cx, cy)
    if (!ch) return null
    // Populate once per chunk using an explicit flag instead of sampling memory
    if (!ch.generated) {
      populateChunk(this, cx, cy)
      ch.generated = true
      ch.dirty = true
      this.changedChunks.add(key(cx, cy))
    }
    return ch
  }

  get(x: number, y: number) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return Tile.Empty
    if (y < 0 || y >= this.height) return Tile.Empty
    const cx = Math.floor(x / CHUNK_SIZE)
    const cy = Math.floor(y / CHUNK_SIZE)
    const ch = this.getOrCreateChunk(cx, cy)
    if (!ch) return Tile.Empty
    const lx = x - cx * CHUNK_SIZE
    const ly = y - cy * CHUNK_SIZE
    return ch.get(lx, ly)
  }

  set(x: number, y: number, t: Tile) {
    if (y < 0 || y >= this.height) return
    const cx = Math.floor(x / CHUNK_SIZE)
    const cy = Math.floor(y / CHUNK_SIZE)
    const ch = this.getOrCreateChunk(cx, cy)
    if (!ch) return
    const lx = x - cx * CHUNK_SIZE
    const ly = y - cy * CHUNK_SIZE
    ch.set(lx, ly, t)
    ch.dirty = true
    this.changedChunks.add(key(cx, cy))
  }

  getBg(x: number, y: number) {
    if (y < 0 || y >= this.height) return Tile.Empty
    const cx = Math.floor(x / CHUNK_SIZE)
    const cy = Math.floor(y / CHUNK_SIZE)
    const ch = this.getOrCreateChunk(cx, cy)
    if (!ch) return Tile.Empty
    const lx = x - cx * CHUNK_SIZE
    const ly = y - cy * CHUNK_SIZE
    return ch.getBg(lx, ly)
  }

  setBg(x: number, y: number, t: Tile) {
    if (y < 0 || y >= this.height) return
    const cx = Math.floor(x / CHUNK_SIZE)
    const cy = Math.floor(y / CHUNK_SIZE)
    const ch = this.getOrCreateChunk(cx, cy)
    if (!ch) return
    const lx = x - cx * CHUNK_SIZE
    const ly = y - cy * CHUNK_SIZE
    ch.setBg(lx, ly, t)
    ch.dirty = true
    this.changedChunks.add(key(cx, cy))
  }

  markChunkDirtyAt(x: number, y: number) {
    const cx = Math.floor(x / CHUNK_SIZE)
    const cy = Math.floor(y / CHUNK_SIZE)
    const ch = this.getOrCreateChunk(cx, cy)
    if (ch) ch.dirty = true
  }

  getChunk(cx: number, cy: number) {
    return this.getOrCreateChunk(cx, cy)
  }
}
