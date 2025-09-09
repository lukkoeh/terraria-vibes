import { isSolid, TILE_SIZE, WORLD_HEIGHT } from '../world/types'
import { World } from '../world/world'

export class Player {
  x = 0
  y = 0
  width = 12
  height = 24
  vx = 0
  vy = 0
  onGround = false

  constructor(public world: World) {}

  collide(dx: number, dy: number) {
    const w = this.width, h = this.height

    // Horizontal
    if (dx !== 0) {
      const dir = Math.sign(dx)
      let remaining = Math.abs(dx)
      while (remaining > 0) {
        const step = Math.min(1, remaining)
        const testX = this.x + dir * step
        const left = Math.floor(testX / TILE_SIZE)
        const right = Math.floor((testX + w - 1) / TILE_SIZE)
        const top = Math.floor(this.y / TILE_SIZE)
        const bottom = Math.floor((this.y + h - 1) / TILE_SIZE)
        let blocked = false
        for (let ty=top; ty<=bottom; ty++) {
          const tile = this.world.get(dir > 0 ? right : left, ty)
          if (isSolid(tile)) { blocked = true; break }
        }
        if (blocked) { this.vx = 0; break }
        this.x = testX
        remaining -= step
      }
    }

    // Vertical
    if (dy !== 0) {
      const dir = Math.sign(dy)
      let remaining = Math.abs(dy)
      while (remaining > 0) {
        const step = Math.min(1, remaining)
        const testY = this.y + dir * step
        const left = Math.floor(this.x / TILE_SIZE)
        const right = Math.floor((this.x + w - 1) / TILE_SIZE)
        const top = Math.floor(testY / TILE_SIZE)
        const bottom = Math.floor((testY + h - 1) / TILE_SIZE)
        let blocked = false
        for (let tx=left; tx<=right; tx++) {
          const tile = this.world.get(tx, dir > 0 ? bottom : top)
          if (isSolid(tile)) { blocked = true; break }
        }
        if (blocked) {
          if (dir > 0) this.onGround = true
          this.vy = 0; break
        }
        this.y = testY
        if (dir > 0) this.onGround = false
        remaining -= step
      }
    }

    // Weltgrenze oben/unten (horizontal unendlich)
    this.y = Math.max(0, Math.min(this.y, WORLD_HEIGHT * TILE_SIZE - this.height))
  }
}