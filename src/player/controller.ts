import { Player } from './player'
import { Input } from '../input/input'

export class PlayerController {
  constructor(public player: Player, public input: Input) {}

  update(dt: number) {
    const p = this.player
    // Movement
    const accel = 0.6
    const maxSpeed = 2.3
    if (this.input.left) p.vx -= accel
    if (this.input.right) p.vx += accel
    p.vx *= 0.85
    p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx))

    // Jump
    const jumpVel = -6.0
    if (this.input.jumpPressed && p.onGround) {
      p.vy = jumpVel
      p.onGround = false
    }

    // Gravity
    p.vy += 0.35
    p.vy = Math.min(p.vy, 10)

    // Integrate
    p.collide(p.vx, 0)
    p.collide(0, p.vy)
  }
}