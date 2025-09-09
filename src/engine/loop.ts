export class FixedStepLoop {
  private raf = 0
  private last = 0
  private acc = 0
  constructor(private stepMs: number, private update: (dt: number) => void, private render: () => void) {}

  start() {
    this.last = performance.now()
    const tick = () => {
      const now = performance.now()
      let delta = now - this.last
      if (delta > 100) delta = 100
      this.last = now
      this.acc += delta
      while (this.acc >= this.stepMs) {
        this.update(this.stepMs / 1000)
        this.acc -= this.stepMs
      }
      this.render()
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  stop() {
    cancelAnimationFrame(this.raf)
  }
}