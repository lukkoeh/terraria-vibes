import { World } from '../world/world'
import { Tile } from '../state/store'

type Key = string

function key(x: number, y: number): Key { return `${x},${y}` }

export class LeafDecaySystem {
  // Pending leaves to check/decay
  // value: [elapsed, threshold]
  pending = new Map<Key, { x:number, y:number, elapsed:number, threshold:number }>()

  constructor(private checkRadius = 5) {}

  schedule(x: number, y: number) {
    const k = key(x,y)
    if (!this.pending.has(k)) {
      // random-ish threshold between 0.6..1.4s
      const r = ((x*1103515245 ^ y*12345) >>> 0) / 0xffffffff
      const threshold = 0.6 + r * 0.8
      this.pending.set(k, { x, y, elapsed: 0, threshold })
    }
  }

  scheduleNeighbors(world: World, x: number, y: number, radius = 2) {
    const x0 = x - radius, x1 = x + radius
    const y0 = y - radius, y1 = y + radius
    for (let ty=y0; ty<=y1; ty++) {
      for (let tx=x0; tx<=x1; tx++) {
        const t = world.get(tx, ty)
        if ((Tile as any).Leaves !== undefined && t === (Tile as any).Leaves) {
          this.schedule(tx, ty)
        }
      }
    }
  }

  private hasTrunkNearby(world: World, x: number, y: number): boolean {
    const r = this.checkRadius
    const x0 = x - r, x1 = x + r
    const y0 = y - r, y1 = y + r
    const Trunk = (Tile as any).Trunk
    for (let ty=y0; ty<=y1; ty++) {
      for (let tx=x0; tx<=x1; tx++) {
        if (world.get(tx, ty) === Trunk) return true
      }
    }
    return false
  }

  update(dt: number, world: World, budget = 64) {
    if (this.pending.size === 0) return
    // Process a subset per frame for performance
    const it = this.pending.values()
    for (let i=0; i<budget; i++) {
      const n = it.next()
      if (n.done) break
      const entry = n.value
      const k = key(entry.x, entry.y)
      // If tile no longer leaves, drop from pending
      if (world.get(entry.x, entry.y) !== (Tile as any).Leaves) {
        this.pending.delete(k)
        continue
      }
      if (this.hasTrunkNearby(world, entry.x, entry.y)) {
        // still supported by trunk; remove from pending for now
        this.pending.delete(k)
        continue
      }
      // advance decay timer
      entry.elapsed += dt
      if (entry.elapsed >= entry.threshold) {
        world.set(entry.x, entry.y, Tile.Empty)
        world.markChunkDirtyAt(entry.x, entry.y)
        // cascade to neighbors
        this.scheduleNeighbors(world, entry.x, entry.y, 2)
        this.pending.delete(k)
      }
    }
  }
}

