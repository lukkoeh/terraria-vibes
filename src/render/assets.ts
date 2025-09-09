import * as PIXI from 'pixi.js'

export type PlayerAnim = 'idle' | 'run' | 'jump' | 'fall'

export interface PlayerSpriteSheet {
  frames: Record<string, PIXI.Texture>
  animations: Record<PlayerAnim, PIXI.Texture[]>
}

// Attempts to load a Pixi spritesheet JSON at the given URL.
// Expected frame names: idle_0..n, run_0..n, jump_0, fall_0 (or fall_0..n)
export async function loadPlayerSpritesheet(url = 'assets/player/player.json'): Promise<PlayerSpriteSheet | null> {
  try {
    const sheet = await PIXI.Assets.load(url) as PIXI.Spritesheet
    const frames: Record<string, PIXI.Texture> = sheet.textures

    const anim = (prefix: string): PIXI.Texture[] => {
      const keys = Object.keys(frames).filter(k => k.startsWith(prefix + '_'))
        .sort((a, b) => {
          const na = parseInt(a.split('_').pop()!.replace(/\D/g, ''))
          const nb = parseInt(b.split('_').pop()!.replace(/\D/g, ''))
          return na - nb
        })
      return keys.length ? keys.map(k => frames[k]) : []
    }

    const idle = anim('idle')
    const run = anim('run')
    const jump = anim('jump')
    const fall = anim('fall')

    if (!idle.length && !run.length && !jump.length && !fall.length) {
      return null
    }

    return { frames, animations: { idle, run, jump: jump.length?jump:[idle[0] || PIXI.Texture.WHITE], fall: fall.length?fall:[idle[0] || PIXI.Texture.WHITE] } }
  } catch (err) {
    // Not found or invalid: fall back
    return null
  }
}

// Optional terrain sheet: expects separate frames named dirt, stone, wood, grass, trunk, leaves, background
export async function loadTerrainTextures(url = 'assets/tiles/terrain.json'): Promise<Record<string, PIXI.Texture> | null> {
  try {
    const sheet = await PIXI.Assets.load(url) as PIXI.Spritesheet
    const tex: Record<string, PIXI.Texture> = sheet.textures
    return tex
  } catch {
    return null
  }
}

