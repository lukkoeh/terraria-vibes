import * as PIXI from 'pixi.js'
import { TILE_SIZE, WORLD_HEIGHT, CHUNK_SIZE } from '../world/types'
import { World } from '../world/world'
import { ChunkRenderer } from './ChunkRenderer'
import { TileTextures } from './textures'
import { SkyBackground } from './Sky'
import { PlayerSprite } from './PlayerSprite'

export class PixiRenderer {
  app: PIXI.Application
  world: World
  chunkRenderer: ChunkRenderer
  stage: PIXI.Container
  camera = { x: 0, y: 0, scale: 2 }
  sky: SkyBackground
  worldContainer = new PIXI.Container()
  playerContainer = new PIXI.Container()
  playerSprite: PlayerSprite
  miningGfx = new PIXI.Graphics()

  constructor(canvas: HTMLCanvasElement, world: World) {
    this.app = new PIXI.Application({
      view: canvas,
      antialias: false,
      autoDensity: true,
      resolution: 1,
      background: '#0a0e1a',
      width: canvas.clientWidth,
      height: canvas.clientHeight
    })

    const textures = new TileTextures(this.app)
    this.world = world
    this.chunkRenderer = new ChunkRenderer(this.app, world, textures)
    this.sky = new SkyBackground(this.app)

    this.stage = this.app.stage as PIXI.Container

    this.stage.addChild(this.sky.container)
    this.stage.addChild(this.worldContainer)
    this.worldContainer.addChild(this.chunkRenderer.layerBg)
    this.worldContainer.addChild(this.chunkRenderer.layerFg)

    this.stage.addChild(this.playerContainer)
    this.playerSprite = new PlayerSprite(this.app)
    this.playerContainer.addChild(this.playerSprite.container)
    this.playerContainer.addChild(this.miningGfx)

    // Stop Pixi's internal ticker; manual render
    // @ts-ignore
    this.app.ticker?.stop?.()

    const view = this.app.view as HTMLCanvasElement
    view.addEventListener('webglcontextlost', (e: Event) => { e.preventDefault(); console.warn('WebGL context lost') }, false)
    view.addEventListener('webglcontextrestored', () => { console.warn('WebGL context restored') }, false)

    window.addEventListener('resize', () => this.resize())
    this.resize()
  }

  resize() {
    const c = this.app.view as HTMLCanvasElement
    this.app.renderer.resize(c.clientWidth, c.clientHeight)
    this.sky.resize(this.app.renderer.width, this.app.renderer.height)
  }

  setCamera(x: number, y: number) {
    this.camera.x = x
    this.camera.y = y
  }

  drawPlayer(px: number, py: number, w: number, h: number, vel: {vx:number, vy:number}, onGround: boolean) {
    // Choose anim state based on velocity
    const speed = Math.abs(vel.vx)
    const moving = speed > 0.1
    const rising = vel.vy < -0.2
    const falling = vel.vy > 0.5 && !onGround

    if (rising) this.playerSprite.setState('jump')
    else if (falling) this.playerSprite.setState('fall')
    else if (moving) this.playerSprite.setState('run')
    else this.playerSprite.setState('idle')

    // size & facing
    this.playerSprite.setSize(w, h)
    if (vel.vx !== 0) this.playerSprite.setFacing((vel.vx >= 0 ? 1 : -1) as 1 | -1)

    this.playerSprite.setPosition(px, py)
  }

  drawMiningIndicator(tileX: number, tileY: number, progress: number | null) {
    this.miningGfx.clear()
    if (progress == null) return
    const px = tileX * TILE_SIZE
    const py = tileY * TILE_SIZE
    const w = TILE_SIZE
    const bh = 3
    const pad = 1
    const x = Math.floor(px)
    const y = Math.floor(py - (bh + 3))
    // background
    this.miningGfx.beginFill(0x000000, 0.6).drawRect(x, y, w, bh).endFill()
    // foreground
    const fw = Math.max(0, Math.min(w, Math.floor(w * progress)))
    if (fw > 0) {
      this.miningGfx.beginFill(0xffffff, 0.9).drawRect(x + pad, y + pad, Math.max(0, fw - 2*pad), Math.max(1, bh - 2*pad)).endFill()
    }
  }

  render(player: {x:number,y:number,width:number,height:number,vx?:number,vy?:number,onGround?:boolean}) {
    const viewW = this.app.renderer.width
    const viewH = this.app.renderer.height
    const scale = this.camera.scale

    // Unendlich horizontal: keine horizontale Klammer
    let camX = player.x + player.width/2 - (viewW/scale)/2
    // Vertikal clampen an Weltgrenzen
    const worldPxH = WORLD_HEIGHT * TILE_SIZE
    let camY = player.y + player.height/2 - (viewH/scale)/2
    camY = Math.max(0, Math.min(worldPxH - viewH/scale, camY))

    this.worldContainer.scale.set(scale)
    this.playerContainer.scale.set(scale)

    this.worldContainer.x = Math.floor(-camX * scale)
    this.worldContainer.y = Math.floor(-camY * scale)
    this.playerContainer.x = this.worldContainer.x
    this.playerContainer.y = this.worldContainer.y

    // sichtbare Chunks
    const x0 = Math.floor(camX / TILE_SIZE)
    const y0 = Math.floor(camY / TILE_SIZE)
    const x1 = Math.ceil((camX + viewW/scale) / TILE_SIZE)
    const y1 = Math.ceil((camY + viewH/scale) / TILE_SIZE)
    const cx0 = Math.floor(x0 / CHUNK_SIZE)
    const cy0 = Math.max(0, Math.floor(y0 / CHUNK_SIZE))
    const cx1 = Math.floor((x1 - 1) / CHUNK_SIZE)
    const cy1 = Math.min(Math.ceil(WORLD_HEIGHT/CHUNK_SIZE)-1, Math.floor((y1 - 1) / CHUNK_SIZE))

    this.chunkRenderer.renderDirtyChunks({cx0, cy0, cx1, cy1})

    this.app.renderer.render(this.stage)
  }
}
