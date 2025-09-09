import * as PIXI from 'pixi.js'
import { Tile } from '../state/store'
import { TILE_SIZE } from '../world/types'

export class TileTextures {
  app: PIXI.Application
  map = new Map<Tile, PIXI.Texture>()
  constructor(app: PIXI.Application) {
    this.app = app
    this.map.set(Tile.Empty, PIXI.Texture.EMPTY)
    this.map.set(Tile.Background, this.makeBackground())
    this.map.set(Tile.Dirt, this.makeDirt())
    this.map.set(Tile.Stone, this.makeStone())
    this.map.set(Tile.Wood, this.makeWoodPlank())
    this.map.set(Tile.Trunk, this.makeBark())
    this.map.set(Tile.Leaves, this.makeLeaves())
    this.map.set(Tile.Grass, this.makeGrass())
  }
  get(t: Tile) { return this.map.get(t) || PIXI.Texture.EMPTY }

  private rtFrom(g: PIXI.Graphics) {
    const rt = PIXI.RenderTexture.create({ width: TILE_SIZE, height: TILE_SIZE, resolution: 1 })
    this.app.renderer.render(g, { renderTexture: rt })
    g.destroy()
    return rt
  }

  private makeBackground() {
    const g = new PIXI.Graphics()
    // Subtle bluish background stone
    g.beginFill(0x151926, 0.48).drawRect(0, 0, TILE_SIZE, TILE_SIZE).endFill()
    // faint grid bevel for depth
    g.lineStyle({ color: 0xffffff, alpha: 0.03, width: 1 })
    g.moveTo(0, 0).lineTo(TILE_SIZE, 0)
    g.lineStyle({ color: 0x000000, alpha: 0.06, width: 1 })
    g.moveTo(TILE_SIZE - 1, 0).lineTo(TILE_SIZE - 1, TILE_SIZE)
    return this.rtFrom(g)
  }

  private speckle(g: PIXI.Graphics, count: number, color: number, alpha: number) {
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * TILE_SIZE)
      const y = Math.floor(Math.random() * TILE_SIZE)
      g.beginFill(color, alpha).drawRect(x, y, 1, 1).endFill()
    }
  }

  private topHighlight(g: PIXI.Graphics, color: number, alpha: number, h = 3) {
    g.beginFill(color, alpha).drawRect(0, 0, TILE_SIZE, h).endFill()
  }

  private bottomShadow(g: PIXI.Graphics, color: number, alpha: number, h = 3) {
    g.beginFill(color, alpha).drawRect(0, TILE_SIZE - h, TILE_SIZE, h).endFill()
  }

  private makeDirt() {
    const g = new PIXI.Graphics()
    g.beginFill(0x8a5a44, 1).drawRect(0, 0, TILE_SIZE, TILE_SIZE).endFill()
    this.topHighlight(g, 0xffffff, 0.04)
    this.bottomShadow(g, 0x000000, 0.06)
    // stones/speckles
    this.speckle(g, 12, 0x3b2a22, 0.15)
    this.speckle(g, 8, 0xc3a18b, 0.08)
    return this.rtFrom(g)
  }

  private makeStone() {
    const g = new PIXI.Graphics()
    g.beginFill(0x6f6f7a, 1).drawRect(0, 0, TILE_SIZE, TILE_SIZE).endFill()
    this.topHighlight(g, 0xffffff, 0.05)
    this.bottomShadow(g, 0x000000, 0.08)
    // subtle cracks
    g.lineStyle({ color: 0x000000, alpha: 0.08, width: 1 })
    g.moveTo(2, 6).lineTo(TILE_SIZE - 3, 7)
    g.moveTo(4, 11).lineTo(TILE_SIZE - 5, 12)
    return this.rtFrom(g)
  }

  private makeWoodPlank() {
    const g = new PIXI.Graphics()
    g.beginFill(0x9c6b3d, 1).drawRect(0, 0, TILE_SIZE, TILE_SIZE).endFill()
    this.topHighlight(g, 0xffffff, 0.03)
    this.bottomShadow(g, 0x000000, 0.06)
    // grain lines
    g.lineStyle({ color: 0x6c4a28, alpha: 0.3, width: 1 })
    g.moveTo(0, 5).bezierCurveTo(4, 4, 8, 6, TILE_SIZE, 5)
    g.moveTo(0, 10).bezierCurveTo(5, 9, 9, 11, TILE_SIZE, 10)
    return this.rtFrom(g)
  }

  private makeBark() {
    const g = new PIXI.Graphics()
    g.beginFill(0x8f5f38, 1).drawRect(0, 0, TILE_SIZE, TILE_SIZE).endFill()
    this.topHighlight(g, 0xffffff, 0.02)
    this.bottomShadow(g, 0x000000, 0.08)
    // vertical bark ridges
    g.lineStyle({ color: 0x5f3f23, alpha: 0.35, width: 1 })
    for (let x = 2; x < TILE_SIZE; x += 3) {
      g.moveTo(x, 0).lineTo(x - 1, TILE_SIZE)
    }
    return this.rtFrom(g)
  }

  private makeLeaves() {
    const g = new PIXI.Graphics()
    // Full-bleed fill so adjacent tiles seamlessly connect
    g.beginFill(0x4fae4f, 0.98).drawRect(0, 0, TILE_SIZE, TILE_SIZE).endFill()
    // Soft vignette to avoid hard grid lines without creating visible gaps
    const edgeShade = new PIXI.Graphics()
    const shade = 0x2e6b2e
    edgeShade.beginFill(shade, 0.12).drawRect(0, 0, TILE_SIZE, 2).endFill()
    edgeShade.beginFill(shade, 0.12).drawRect(0, TILE_SIZE - 2, TILE_SIZE, 2).endFill()
    edgeShade.beginFill(shade, 0.12).drawRect(0, 0, 2, TILE_SIZE).endFill()
    edgeShade.beginFill(shade, 0.12).drawRect(TILE_SIZE - 2, 0, 2, TILE_SIZE).endFill()
    // subtle speckle
    this.speckle(g, 10, 0xffffff, 0.05)
    this.speckle(g, 10, 0x2e6b2e, 0.10)
    // Composite edgeShade on top
    const rt = PIXI.RenderTexture.create({ width: TILE_SIZE, height: TILE_SIZE, resolution: 1 })
    this.app.renderer.render(g, { renderTexture: rt, clear: true })
    this.app.renderer.render(edgeShade, { renderTexture: rt, clear: false })
    g.destroy()
    edgeShade.destroy()
    return rt
  }

  private makeGrass() {
    const g = new PIXI.Graphics()
    // darker base blended with green top
    g.beginFill(0x356e34, 1).drawRect(0, 0, TILE_SIZE, TILE_SIZE).endFill()
    this.topHighlight(g, 0x6adf72, 0.25, 5)
    this.bottomShadow(g, 0x000000, 0.06)
    // blades near top edge
    g.lineStyle({ color: 0x2b7a38, alpha: 0.9, width: 1 })
    for (let i = 0; i < 5; i++) {
      const x = 2 + i * 3
      g.moveTo(x, 3).lineTo(x + (i % 2 === 0 ? 1 : -1), 0)
    }
    return this.rtFrom(g)
  }
}
