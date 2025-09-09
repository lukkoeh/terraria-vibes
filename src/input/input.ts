export class Input {
  left = false
  right = false
  jump = false
  jumpPressed = false
  mouseX = 0
  mouseY = 0
  leftDown = false
  rightDown = false
  wheelAccum = 0
  tool: 'none' | 'axe' | 'shovel' | 'pickaxe' = 'none'

  constructor(private canvas: HTMLCanvasElement, private screenToWorld: (sx:number,sy:number)=>{x:number,y:number}) {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    canvas.addEventListener('mousedown', this.onMouseDown)
    window.addEventListener('mouseup', this.onMouseUp)
    canvas.addEventListener('mousemove', this.onMouseMove)
    canvas.addEventListener('wheel', this.onWheel, { passive: true })
    canvas.addEventListener('contextmenu', (e)=>e.preventDefault())
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('mouseup', this.onMouseUp)
    this.canvas.removeEventListener('mousedown', this.onMouseDown)
    this.canvas.removeEventListener('mousemove', this.onMouseMove)
    this.canvas.removeEventListener('wheel', this.onWheel)
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (['ArrowLeft','KeyA'].includes(e.code)) this.left = true
    if (['ArrowRight','KeyD'].includes(e.code)) this.right = true
    if (['ArrowUp','KeyW','Space'].includes(e.code)) { 
      this.jump = true
      this.jumpPressed = true
    }
    if (e.code.startsWith('Digit')) {
      const idx = parseInt(e.code.replace('Digit',''), 10) - 1
      const ev = new CustomEvent('hotbar-select', { detail: { index: idx } })
      window.dispatchEvent(ev)
    }
    // Tool selection: Z=axe, X=shovel, C=pickaxe, V=none
    const prev = this.tool
    if (e.code === 'KeyZ') this.tool = 'axe'
    if (e.code === 'KeyX') this.tool = 'shovel'
    if (e.code === 'KeyC') this.tool = 'pickaxe'
    if (e.code === 'KeyV') this.tool = 'none'
    if (this.tool !== prev) {
      const ev2 = new CustomEvent('tool-select', { detail: { tool: this.tool } })
      window.dispatchEvent(ev2)
    }
  }
  private onKeyUp = (e: KeyboardEvent) => {
    if (['ArrowLeft','KeyA'].includes(e.code)) this.left = false
    if (['ArrowRight','KeyD'].includes(e.code)) this.right = false
    if (['ArrowUp','KeyW','Space'].includes(e.code)) { this.jump = false }
  }

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) this.leftDown = true
    if (e.button === 2) this.rightDown = true
  }
  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) this.leftDown = false
    if (e.button === 2) this.rightDown = false
  }
  private onMouseMove = (e: MouseEvent) => {
    const rect = (this.canvas as HTMLCanvasElement).getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const world = this.screenToWorld(sx, sy)
    this.mouseX = world.x
    this.mouseY = world.y
  }
  private onWheel = (e: WheelEvent) => {
    // Normalize per notch step to exactly ±1 per logical tick
    const mode = e.deltaMode // 0: pixels, 1: lines, 2: pages
    let delta = e.deltaY
    if (mode === 1) {
      // lines: assume 1 step per ±1 line (most mice report ±3 per notch)
      const steps = Math.sign(delta)
      const ev = new CustomEvent('hotbar-step', { detail: { step: steps } })
      window.dispatchEvent(ev)
      return
    }
    // pixel mode: accumulate and emit step when threshold crossed
    const threshold = 100 // typical notch ~100-120 on many systems
    this.wheelAccum += delta
    while (this.wheelAccum >= threshold) {
      const ev = new CustomEvent('hotbar-step', { detail: { step: 1 } })
      window.dispatchEvent(ev)
      this.wheelAccum -= threshold
    }
    while (this.wheelAccum <= -threshold) {
      const ev = new CustomEvent('hotbar-step', { detail: { step: -1 } })
      window.dispatchEvent(ev)
      this.wheelAccum += threshold
    }
  }

  postUpdate() {
    this.jumpPressed = false
  }
}
