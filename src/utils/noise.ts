export class ValueNoise1D {
  private cache: Map<number, number> = new Map()
  private seed: number
  constructor(seed: number) { this.seed = seed }
  private rnd(i: number) {
    // simple hash per integer lattice
    let t = (i ^ this.seed) >>> 0
    t += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296 * 2 - 1
  }
  private gradient(i: number) {
    if (!this.cache.has(i)) this.cache.set(i, this.rnd(i))
    return this.cache.get(i)!
  }
  sample(x: number) {
    const i0 = Math.floor(x)
    const i1 = i0 + 1
    const t = x - i0
    const s = t * t * (3 - 2 * t) // smoothstep
    const g0 = this.gradient(i0)
    const g1 = this.gradient(i1)
    return g0 * (1 - s) + g1 * s
  }
}

export function fractal(noise: ValueNoise1D, x: number, octaves: number, freq: number, amp: number) {
  let n = 0, a = 1, f = 1
  for (let o=0;o<octaves;o++) {
    n += noise.sample(x * freq * f) * a
    a *= 0.5
    f *= 2
  }
  return n * amp
}