import { WORLD_HEIGHT, CHUNK_SIZE } from './types'
import { World } from './world'
import { Tile } from '../state/store'

export type Rng = () => number

export type TreeSpecies = 'oak' | 'pine' | 'birch'

export interface TreeParams {
  trunkMin: number
  trunkMax: number
  trunkLeanMax: number // max horizontal lean in tiles over full height
  trunkWidth: 1 | 2
  branchCountMin: number
  branchCountMax: number
  branchLengthMin: number
  branchLengthMax: number
  canopyRadiusMin: number
  canopyRadiusMax: number
  leafDensity: number // 0..1 (packing probability inside canopy shape)
  // ensure some bare trunk above ground (no leaves)
  bareMin: number
  bareMax: number
}

function randRange(rng: Rng, a: number, b: number) {
  return a + rng() * (b - a)
}

function irandRange(rng: Rng, a: number, b: number) {
  return Math.floor(randRange(rng, a, b + 1))
}

export function pickSpecies(rng: Rng, density: number): TreeSpecies {
  // bias species by local forest density a bit
  const r = rng() * 1.05 + (density + 1) * 0.1
  if (r < 0.35) return 'birch'
  if (r < 0.60) return 'pine'
  return 'oak'
}

export function speciesParams(species: TreeSpecies, rng: Rng): TreeParams {
  switch (species) {
    case 'pine':
      return {
        trunkMin: 8,
        trunkMax: 16,
        trunkLeanMax: 1.0,
        trunkWidth: 1,
        branchCountMin: 3,
        branchCountMax: 6,
        branchLengthMin: 2,
        branchLengthMax: 4,
        canopyRadiusMin: 2,
        canopyRadiusMax: 3,
        leafDensity: 0.85,
        bareMin: 3,
        bareMax: 6,
      }
    case 'birch':
      return {
        trunkMin: 6,
        trunkMax: 12,
        trunkLeanMax: 1.5,
        trunkWidth: 1,
        branchCountMin: 2,
        branchCountMax: 4,
        branchLengthMin: 2,
        branchLengthMax: 3,
        canopyRadiusMin: 2,
        canopyRadiusMax: 3,
        leafDensity: 0.75,
        bareMin: 2,
        bareMax: 5,
      }
    case 'oak':
    default:
      return {
        trunkMin: 7,
        trunkMax: 14,
        trunkLeanMax: 2.0,
        trunkWidth: rng() < 0.2 ? 2 : 1,
        branchCountMin: 3,
        branchCountMax: 7,
        branchLengthMin: 2,
        branchLengthMax: 5,
        canopyRadiusMin: 3,
        canopyRadiusMax: 5,
        leafDensity: 0.9,
        bareMin: 3,
        bareMax: 6,
      }
  }
}

function setTileSafe(world: World, x: number, y: number, t: Tile) {
  if (y < 0 || y >= WORLD_HEIGHT) return
  const cx = Math.floor(x / CHUNK_SIZE)
  const cy = Math.floor(y / CHUNK_SIZE)
  const lx = x - cx * CHUNK_SIZE
  const ly = y - cy * CHUNK_SIZE
  const ch = world._ensureChunkStorage(cx, cy)
  if (!ch) return
  if (ch.get(lx, ly) === Tile.Empty) {
    ch.set(lx, ly, t)
    ch.dirty = true
  }
}

/**
 * Places a more natural looking tree at ground position (gx, surfaceY).
 * Uses gentle leaning, a few branches and an organic canopy shape per species.
 */
export function placeNaturalTree(world: World, gx: number, surfaceY: number, rng: Rng, density: number) {
  const species = pickSpecies(rng, density)
  const params = speciesParams(species, rng)

  const height = irandRange(rng, params.trunkMin, params.trunkMax)
  const trunkWidth = params.trunkWidth
  const lean = (rng() * 2 - 1) * params.trunkLeanMax // total horizontal offset across height

  // Decide how much of the trunk above ground stays free of leaves
  let bareTrunk = irandRange(rng, params.bareMin, params.bareMax)
  bareTrunk = Math.max(2, Math.min(bareTrunk, Math.max(2, height - 2)))

  // Draw trunk bottom-up with slight meander
  for (let i = 0; i < height; i++) {
    const t = i / Math.max(1, height - 1)
    const offset = Math.round(t * lean)
    const y = surfaceY - i
    if (y < 0) break
    for (let w = 0; w < trunkWidth; w++) {
      // widen towards bottom for width 2
      const side = trunkWidth === 2 ? (rng() < 0.5 ? -1 : 0) : 0
      setTileSafe(world, gx + offset + w + side, y, Tile.Trunk)
    }
  }

  // Branches
  const branchCount = irandRange(rng, params.branchCountMin, params.branchCountMax)
  const minBranchRel = Math.max(0.35, bareTrunk / Math.max(1, height) + 0.05)
  for (let b = 0; b < branchCount; b++) {
    const rel = 0.35 + 0.55 * (b / Math.max(1, branchCount - 1)) // spread along upper trunk
    if (rel < minBranchRel) continue
    const by = surfaceY - Math.floor(height * rel)
    const dir = rng() < 0.5 ? -1 : 1
    const len = irandRange(rng, params.branchLengthMin, params.branchLengthMax)
    for (let k = 0; k < len; k++) {
      const bx = gx + Math.round((rel * lean)) + dir * k
      const yy = by - Math.floor(k * 0.3)
      setTileSafe(world, bx, yy, Tile.Trunk)
    }
  }

  // Canopy around top
  const topY = surfaceY - (height - 1)
  const radius = irandRange(rng, params.canopyRadiusMin, params.canopyRadiusMax)
  const rx = radius + (species === 'pine' ? -0.2 : 0.4)
  const ry = species === 'pine' ? radius * 1.3 : radius * (species === 'birch' ? 0.9 : 1.0)
  const cx = gx + Math.round(lean)
  const leafMinY = surfaceY - bareTrunk // do not place leaves below this line
  for (let dy = -Math.ceil(ry) - 1; dy <= Math.ceil(ry) + 1; dy++) {
    for (let dx = -Math.ceil(rx) - 1; dx <= Math.ceil(rx) + 1; dx++) {
      const nx = dx / (rx + 0.0001)
      const ny = dy / (ry + 0.0001)
      // Soft ellipse; allow some randomness for ragged edge
      const inside = (nx * nx + ny * ny) <= (0.95 + rng() * 0.12)
      if (!inside) continue
      if (rng() > params.leafDensity) continue
      const yy = topY + dy
      if (yy > leafMinY) continue // keep bare trunk zone leaf-free
      setTileSafe(world, cx + dx, yy, Tile.Leaves)
    }
  }
}
