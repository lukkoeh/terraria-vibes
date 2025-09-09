import * as PIXI from 'pixi.js'
import { CHUNK_SIZE, TILE_SIZE, WORLD_HEIGHT } from '../world/types'
import { World } from '../world/world'
import { Tile } from '../state/store'
import { TileTextures } from './textures'

function key(cx: number, cy: number) { return `${cx},${cy}` }

export class ChunkRenderer {
  app: PIXI.Application
  world: World
  textures: TileTextures
  layerBg = new PIXI.Container()
  layerFg = new PIXI.Container()
  chunkSpritesBg = new Map<string, PIXI.Sprite>()
  chunkSpritesFg = new Map<string, PIXI.Sprite>()

  constructor(app: PIXI.Application, world: World, textures: TileTextures) {
    this.app = app
    this.world = world
    this.textures = textures

    this.layerBg.sortableChildren = false
    this.layerFg.sortableChildren = false
  }

  ensureChunkSprites(cx: number, cy: number) {
    const k = key(cx, cy)
    if (!this.chunkSpritesBg.has(k)) {
      const s = new PIXI.Sprite()
      s.x = cx * CHUNK_SIZE * TILE_SIZE
      s.y = cy * CHUNK_SIZE * TILE_SIZE
      this.layerBg.addChild(s)
      this.chunkSpritesBg.set(k, s)
    }
    if (!this.chunkSpritesFg.has(k)) {
      const s = new PIXI.Sprite()
      s.x = cx * CHUNK_SIZE * TILE_SIZE
      s.y = cy * CHUNK_SIZE * TILE_SIZE
      this.layerFg.addChild(s)
      this.chunkSpritesFg.set(k, s)
    }
  }

  renderDirtyChunks(visible: {cx0:number, cy0:number, cx1:number, cy1:number}) {
    // Budget the amount of chunk redraws per frame to avoid stutter
    let budget = 4
    for (let cy=visible.cy0; cy<=visible.cy1; cy++) {
      for (let cx=visible.cx0; cx<=visible.cx1; cx++) {
        if (budget <= 0) return
        const ch = this.world.getChunk(cx, cy)
        if (!ch) continue
        this.ensureChunkSprites(cx, cy)
        if (!ch.dirty) continue
        this.redrawChunk(cx, cy)
        ch.dirty = false
        budget--
      }
    }
  }

  redrawChunk(cx: number, cy: number) {
    const gBg = new PIXI.Graphics()
    const gFg = new PIXI.Graphics()

    const x0 = cx * CHUNK_SIZE
    const y0 = cy * CHUNK_SIZE
    const x1 = x0 + CHUNK_SIZE
    const y1 = Math.min(y0 + CHUNK_SIZE, WORLD_HEIGHT)

    const ch = this.world.getChunk(cx, cy)
    if (!ch) return

    for (let y=y0; y<y1; y++) {
      for (let x=x0; x<x1; x++) {
        const lx = x - x0
        const ly = y - y0
        const tbg = ch.getBg(lx, ly)
        const tf = ch.get(lx, ly)
        const px = lx * TILE_SIZE
        const py = ly * TILE_SIZE
        if (tbg !== Tile.Empty) {
          gBg.beginTextureFill({ texture: this.textures.get(tbg) }).drawRect(px, py, TILE_SIZE, TILE_SIZE).endFill()
        }
        if (tf !== Tile.Empty) {
          gFg.beginTextureFill({ texture: this.textures.get(tf) }).drawRect(px, py, TILE_SIZE, TILE_SIZE).endFill()
        }
      }
    }

    const k = key(cx, cy)
    const sBg = this.chunkSpritesBg.get(k)!
    const sFg = this.chunkSpritesFg.get(k)!

    const targetW = CHUNK_SIZE * TILE_SIZE
    const targetH = CHUNK_SIZE * TILE_SIZE

    // Reuse existing render textures when possible to avoid allocations
    const rtBg = (sBg.texture instanceof PIXI.RenderTexture && sBg.texture.width === targetW && sBg.texture.height === targetH)
      ? (sBg.texture as PIXI.RenderTexture)
      : PIXI.RenderTexture.create({ width: targetW, height: targetH, resolution: 1 })
    const rtFg = (sFg.texture instanceof PIXI.RenderTexture && sFg.texture.width === targetW && sFg.texture.height === targetH)
      ? (sFg.texture as PIXI.RenderTexture)
      : PIXI.RenderTexture.create({ width: targetW, height: targetH, resolution: 1 })

    this.app.renderer.render(gBg, { renderTexture: rtBg, clear: true })
    this.app.renderer.render(gFg, { renderTexture: rtFg, clear: true })
    gBg.destroy(true)
    gFg.destroy(true)

    sBg.texture = rtBg
    sFg.texture = rtFg
  }
}
