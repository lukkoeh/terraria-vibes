// Deterministic hash & RNG utilities
export function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export function hash2i(a: number, b: number) {
  // 32-bit mix of two ints (cx, x etc.)
  a = Math.imul(a ^ 0x9E3779B1, 0x85EBCA77) ^ b
  a = (a ^ (a >>> 16)) >>> 0
  return a
}