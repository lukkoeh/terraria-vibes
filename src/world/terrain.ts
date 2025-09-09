import { WORLD_HEIGHT } from './types'
import { ValueNoise1D, fractal } from '../utils/noise'

export interface SurfaceProfile {
  height: number
}

// Centralized terrain sampling to keep parameters consistent across modules
export function sampleSurfaceHeight(noise: ValueNoise1D, gx: number): number {
  const base = Math.floor(WORLD_HEIGHT * 0.45)
  // Fractal value-noise for gentle rolling hills
  const h = Math.floor(base + fractal(noise, gx, 4, 0.02, 14))
  // Clamp to safe bounds for world ceiling/floor
  return Math.max(18, Math.min(WORLD_HEIGHT - 8, h))
}

