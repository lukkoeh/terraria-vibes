import * as PIXI from 'pixi.js'
import { PlayerAnim, loadPlayerSpritesheet } from './assets'

export class PlayerSprite {
  app: PIXI.Application
  container = new PIXI.Container()
  sprite: PIXI.AnimatedSprite | null = null
  fallback: PIXI.Graphics | null = null
  facing: 1 | -1 = 1
  current: PlayerAnim = 'idle'
  targetW = 12
  targetH = 24

  constructor(app: PIXI.Application) {
    this.app = app
    this.container.sortableChildren = false
    this.init()
  }

  private async init() {
    const sheet = await loadPlayerSpritesheet()
    if (sheet) {
      const make = (frames: PIXI.Texture[], speed = 0.12) => {
        const a = new PIXI.AnimatedSprite(frames)
        a.animationSpeed = speed
        a.anchor.set(0, 0)
        a.loop = true
        return a
      }
      const idle = sheet.animations.idle.length ? make(sheet.animations.idle, 0.08) : null
      const run = sheet.animations.run.length ? make(sheet.animations.run, 0.2) : null
      const jump = sheet.animations.jump.length ? make(sheet.animations.jump, 0.15) : null
      const fall = sheet.animations.fall.length ? make(sheet.animations.fall, 0.15) : null

      // create one sprite instance and swap textures when state changes
      const inst = new PIXI.AnimatedSprite(idle?.textures || run?.textures || [PIXI.Texture.WHITE])
      inst.animationSpeed = 0.12
      inst.loop = true
      inst.play()
      this.sprite = inst
      this.container.addChild(inst)

      // store textures per state on instance for quick switch
      ;(inst as any).__anims = {
        idle: idle?.textures || [],
        run: run?.textures || [],
        jump: jump?.textures || [],
        fall: fall?.textures || []
      }
      // Apply initial sizing if requested
      this.applySize()
      return
    }

    // fallback: simple rectangle with accent color
    const g = new PIXI.Graphics()
    g.beginFill(0x4dd4b7).drawRect(0, 0, 12, 24).endFill()
    this.fallback = g
    this.container.addChild(g)
  }

  setFacing(dir: 1 | -1) {
    this.facing = dir
    const absX = Math.abs(this.container.scale.x) || 1
    this.container.scale.x = (this.facing < 0 ? -absX : absX)
  }

  setState(state: PlayerAnim) {
    this.current = state
    const s = this.sprite
    if (!s) return
    const bank = (s as any).__anims as Record<string, PIXI.Texture[]>
    const frames = bank[state]
    if (!frames || frames.length === 0) return
    const wasPlaying = s.playing
    s.textures = frames
    s.gotoAndPlay(0)
    s.loop = state !== 'jump' && state !== 'fall'
    if (!wasPlaying) s.play()
  }

  setPosition(x: number, y: number) {
    // When flipped, shift by target width to keep left edge alignment
    const shift = (this.facing < 0 ? this.targetW : 0)
    this.container.x = Math.floor(x + shift)
    this.container.y = Math.floor(y)
  }

  setSize(w: number, h: number) {
    this.targetW = w
    this.targetH = h
    this.applySize()
  }

  private applySize() {
    if (this.sprite) {
      // AnimatedSprite frames can be PIXI.Texture or { texture: PIXI.Texture }
      const first = (this.sprite.textures && this.sprite.textures.length > 0) ? (this.sprite.textures[0] as any) : null
      const tex: PIXI.Texture = (first && first.texture) ? first.texture as PIXI.Texture : ((first as PIXI.Texture) || this.sprite.texture)
      const tw = (tex && (tex as PIXI.Texture).width) ? (tex as PIXI.Texture).width : 1
      const th = (tex && (tex as PIXI.Texture).height) ? (tex as PIXI.Texture).height : 1
      const sx = this.targetW / tw
      const sy = this.targetH / th
      const sign = this.facing < 0 ? -1 : 1
      this.container.scale.set(Math.abs(sx) * sign, Math.abs(sy))
    } else if (this.fallback) {
      this.fallback.width = this.targetW
      this.fallback.height = this.targetH
    }
  }
}
