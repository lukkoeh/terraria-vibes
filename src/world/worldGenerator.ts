import { World } from './world'
import { Tile } from '../state/store'
import { CHUNK_SIZE, WORLD_HEIGHT } from './types'
import { ValueNoise1D, fractal } from '../utils/noise'
import { hash2i, mulberry32 } from '../utils/random'
import { sampleSurfaceHeight } from './terrain'
import { placeNaturalTree } from './trees'

// Chunk population: terrain + trees
export function populateChunk(world: World, chunkX: number, chunkY: number) {
  const { seed } = world
  const terrainNoise = world.noiseTerrain
  const forestNoise = world.noiseForest

  const soilDepth = 10

  const x0 = chunkX * CHUNK_SIZE
  const y0 = chunkY * CHUNK_SIZE
  const y1 = Math.min(y0 + CHUNK_SIZE, WORLD_HEIGHT)

  const ch = world._ensureChunkStorage(chunkX, chunkY)

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    const gx = x0 + lx // global tile x

    // Terrain height
    const h = sampleSurfaceHeight(terrainNoise, gx)

    // Column fill (FG & BG)
    for (let y = y0; y < y1; y++) {
      const ly = y - y0
      const existing = ch.get(lx, ly)
      if (y > h + soilDepth) {
        if (existing === Tile.Empty) ch.set(lx, ly, Tile.Stone)
        ch.setBg(lx, ly, Tile.Background)
      } else if (y > h) {
        // surface soil; top-most gets grass if available
        if (existing === Tile.Empty) ch.set(lx, ly, (y === h + 1 ? (Tile as any).Grass ?? Tile.Dirt : Tile.Dirt) as Tile)
        ch.setBg(lx, ly, Tile.Background)
      } else {
        // air region above surface: do not overwrite existing trunks/wood
        if (existing !== Tile.Wood && existing !== Tile.Trunk) ch.set(lx, ly, Tile.Empty)
        ch.setBg(lx, ly, y > h - 6 ? Tile.Background : Tile.Empty)
      }
    }

    // Trees: density from forest noise
    const density = fractal(forestNoise, gx, 4, 0.01, 1.0) // [-1..1]

    // Slightly prefer trees on local surface maxima for a natural placement
    const leftH = sampleSurfaceHeight(terrainNoise, gx - 1)
    const rightH = sampleSurfaceHeight(terrainNoise, gx + 1)
    const ridgeBoost = (h >= leftH && h >= rightH) ? 0.05 : 0.0

    const baseP = 0.02
    const p = baseP + 0.13 * ((density + 1) * 0.5) + ridgeBoost // ~0.02..~0.20

    // deterministic RNG per column
    const rseed = hash2i(seed ^ 0xA53A9A4B, gx)
    const rng = mulberry32(rseed)
    if (rng() < p) {
      placeNaturalTree(world, gx, h, rng, density)
    }
  }
}
