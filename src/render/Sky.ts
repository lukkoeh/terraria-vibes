import * as PIXI from 'pixi.js'

export class SkyBackground {
  app: PIXI.Application
  sprite: PIXI.Sprite
  container = new PIXI.Container()

  constructor(app: PIXI.Application) {
    this.app = app
    this.sprite = new PIXI.Sprite()
    this.container.addChild(this.sprite)
  }

  resize(width: number, height: number) {
    const rt = PIXI.RenderTexture.create({ width, height, resolution: 1 })
    const g = new PIXI.Graphics()
    // vertical gradient: dawn sky feel
    const stops = [
      { y: 0, color: 0x0a0e1a, a: 1.0 },
      { y: Math.floor(height * 0.35), color: 0x193056, a: 1.0 },
      { y: Math.floor(height * 0.7), color: 0x1c2432, a: 1.0 },
      { y: height, color: 0x10141c, a: 1.0 },
    ]
    // Draw gradient by lerping between stops with thin bands
    for (let i = 0; i < stops.length - 1; i++) {
      const s0 = stops[i]
      const s1 = stops[i + 1]
      const segH = Math.max(1, s1.y - s0.y)
      for (let j = 0; j < segH; j++) {
        const t = j / segH
        const c = lerpColor(s0.color, s1.color, t)
        g.beginFill(c, 1).drawRect(0, s0.y + j, width, 1).endFill()
      }
    }
    this.app.renderer.render(g, { renderTexture: rt, clear: true })
    g.destroy(true)
    this.sprite.texture = rt
  }
}

function lerpColor(c0: number, c1: number, t: number) {
  const r0 = (c0 >> 16) & 0xff, g0 = (c0 >> 8) & 0xff, b0 = c0 & 0xff
  const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff
  const r = Math.round(r0 + (r1 - r0) * t)
  const g = Math.round(g0 + (g1 - g0) * t)
  const b = Math.round(b0 + (b1 - b0) * t)
  return (r << 16) | (g << 8) | b
}

