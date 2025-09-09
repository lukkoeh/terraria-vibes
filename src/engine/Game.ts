import { FixedStepLoop } from './loop'
import { PixiRenderer } from '../render/PixiRenderer'
import { World } from '../world/world'
import { Player } from '../player/player'
import { PlayerController } from '../player/controller'
import { Input } from '../input/input'
import { TILE_SIZE, WORLD_HEIGHT } from '../world/types'
import { useStore, Tile } from '../state/store'
import { useRuntime } from '../state/runtime'
import { pickup } from '../systems/inventory'
import { MiningTimes } from './mining'
import { LeafDecaySystem } from '../systems/leafDecay'
import { SaveManager } from '../persist/saveManager'

export class Game {
  renderer: PixiRenderer
  world = new World(42)
  player = new Player(this.world)
  controller: PlayerController
  input: Input
  loop: FixedStepLoop
  mining: { tx: number, ty: number, tile: Tile, elapsed: number, required: number } | null = null
  leafDecay = new LeafDecaySystem()
  saveManager: SaveManager
  paused = false

  constructor(public canvas: HTMLCanvasElement) {
    this.renderer = new PixiRenderer(canvas, this.world)
    this.input = new Input(canvas, (sx,sy)=>this.screenToWorld(sx,sy))
    this.controller = new PlayerController(this.player, this.input)
    this.saveManager = new SaveManager(this.world, ()=>({x:this.player.x, y:this.player.y}), ()=>this.input.tool)

    this.loop = new FixedStepLoop(1000/60, (dt)=>this.update(dt), ()=>this.render())

    window.addEventListener('hotbar-select', (e: any) => {
      useStore.getState().setSelectedSlot(e.detail.index)
    })
    window.addEventListener('hotbar-step', (e: any) => {
      const s = useStore.getState()
      s.incSelectedSlot(e.detail.step)
    })
    // tool select from keyboard or UI → jump to slot that has the tool (if any)
    window.addEventListener('tool-select', (e: any) => {
      const tool = e.detail.tool as ('none'|'axe'|'shovel'|'pickaxe')
      const st = useStore.getState()
      const idx = st.slots.findIndex(s => s.item === tool)
      if (idx >= 0) st.setSelectedSlot(idx)
    })
    // init runtime tool
    useRuntime.getState().setTool(this.input.tool)

    // wire export/import
    window.addEventListener('world-export-request', async () => {
      await this.saveManager.flushChanged()
      await this.saveManager.saveMeta()
      const bundle = await this.saveManager.exportBundle()
      const blob = new Blob([JSON.stringify(bundle)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'terraria-world.json'
      document.body.appendChild(a)
      a.click()
      setTimeout(()=>{
        URL.revokeObjectURL(a.href)
        a.remove()
      }, 0)
    })
    window.addEventListener('world-import-request', async (e: any) => {
      const data = e.detail?.data
      if (!data || data.version !== 1) { alert('Unsupported world file'); return }
      await this.saveManager.importBundle(data)
    })
    window.addEventListener('player-load-position', (e: any) => {
      const {x, y} = e.detail
      this.player.x = x
      this.player.y = y
    })

    // Try restore saved world; if none, give starting items and default position
    this.saveManager.restoreFromDbIfAny().then((ok)=>{
      if (!ok) {
        const s = useStore.getState()
        // Give starter tools as items
        s.addItem('pickaxe' as any)
        s.addItem('axe' as any)
        s.addItem('shovel' as any)
        s.addItem(Tile.Dirt as any, 50)
        s.addItem(Tile.Wood as any, 20)
        this.player.x = 0
        this.player.y = 0
      }
    })
  }

  start() { this.loop.start() }
  destroy() {
    this.loop.stop()
    this.input.dispose()
    // save on destroy (best-effort)
    this.saveManager.flushChanged()
    this.saveManager.saveMeta()
  }

  update(dt: number) {
    if (this.paused) {
      // minimal housekeeping; no world updates while paused
      this.input.postUpdate()
      return
    }
    this.controller.update(dt)
    this.handleInteractions(dt)
    this.leafDecay.update(dt, this.world)
    // periodically flush changes
    if (Math.random() < 0.02) { this.saveManager.flushChanged(); this.saveManager.saveMeta() }
    useRuntime.getState().setPlayer({
      x: this.player.x,
      y: this.player.y,
      vx: this.player.vx,
      vy: this.player.vy,
      onGround: this.player.onGround
    })
    // derive held tool from selected hotbar slot
    {
      const st = useStore.getState()
      const cur = st.slots[st.selectedSlot]?.item ?? null
      const toolHeld = (cur === 'axe' || cur === 'shovel' || cur === 'pickaxe') ? cur : 'none'
      if (this.input.tool !== toolHeld) {
        this.input.tool = toolHeld
        useRuntime.getState().setTool(toolHeld)
      }
    }
    this.input.postUpdate()
  }

  handleInteractions(dt: number) {
    const p = this.player
    const reach = 5 * TILE_SIZE
    const mx = this.input.mouseX, my = this.input.mouseY
    const dx = (mx - (p.x + p.width/2))
    const dy = (my - (p.y + p.height/2))
    const inReach = (dx*dx + dy*dy) <= (reach*reach)

    const tx = Math.floor(mx / TILE_SIZE)
    const ty = Math.floor(my / TILE_SIZE)

    if (inReach && this.input.leftDown) {
      if (ty>=0 && ty<this.world.height) {
        const t = this.world.get(tx, ty)
        if (t !== Tile.Empty) {
          // Update mining state
          if (!this.mining || this.mining.tx !== tx || this.mining.ty !== ty || this.mining.tile !== t) {
            this.mining = { tx, ty, tile: t, elapsed: 0, required: this.getBreakTime(t) }
          } else {
            this.mining.elapsed += dt
            // allow live tool changes to affect speed
            const req = this.getBreakTime(t)
            if (Math.abs(req - this.mining.required) > 1e-6) {
              this.mining.required = req
            }
          }
          // Complete if time reached
          if (this.mining.elapsed >= this.mining.required) {
            this.world.set(tx, ty, Tile.Empty)
            if (t === Tile.Dirt || t === Tile.Stone || t === Tile.Wood) {
              pickup(t as any as number, 1)
            } else if ((Tile as any).Grass !== undefined && t === (Tile as any).Grass) {
              // Grass drops dirt
              pickup(Tile.Dirt as any as number, 1)
            } else if ((Tile as any).Trunk !== undefined && t === (Tile as any).Trunk) {
              pickup(Tile.Wood as any as number, 1)
              // trigger leaf decay around broken trunk
              this.leafDecay.scheduleNeighbors(this.world, tx, ty, 6)
            }
            this.mining = null
          }
        } else {
          this.mining = null
        }
      }
    } else if (inReach && this.input.rightDown) {
      const s = useStore.getState()
      const slot = s.slots[s.selectedSlot]
      if (slot && slot.item && slot.count > 0 && slot.item !== 'axe' && slot.item !== 'shovel' && slot.item !== 'pickaxe') {
        const rx = tx*TILE_SIZE, ry = ty*TILE_SIZE
        const overlap = !(rx + TILE_SIZE <= p.x || rx >= p.x + p.width || ry + TILE_SIZE <= p.y || ry >= p.y + p.height)
        if (!overlap) {
          if (ty>=0 && ty<this.world.height && this.world.get(tx,ty)===Tile.Empty) {
            this.world.set(tx, ty, slot.item as unknown as Tile)
            s.consumeSelected(1)
          }
        }
      }
      this.mining = null
    } else {
      this.mining = null
    }
  }

  getBreakTime(t: Tile) {
    const tool = this.input.tool
    const Trunk = (Tile as any).Trunk
    const Leaves = (Tile as any).Leaves
    if (t === Tile.Dirt) {
      return tool === 'shovel' ? MiningTimes.dirt.withTool : MiningTimes.dirt.withoutTool
    }
    if (t === Tile.Stone) {
      return tool === 'pickaxe' ? MiningTimes.stone.withTool : MiningTimes.stone.withoutTool
    }
    if (t === Tile.Wood || (Trunk !== undefined && t === Trunk)) {
      return tool === 'axe' ? MiningTimes.wood.withTool : MiningTimes.wood.withoutTool
    }
    if (Leaves !== undefined && t === Leaves) {
      return MiningTimes.leaves
    }
    return MiningTimes.fallback
  }

  screenToWorld(sx: number, sy: number) {
    const stage = this.renderer
    const scale = stage.camera.scale
    const wx = (sx - stage.worldContainer.x) / scale
    const wy = (sy - stage.worldContainer.y) / scale
    return { x: wx, y: wy }
  }

  render() {
    // draw mining indicator before render pass
    if (this.mining) {
      const prog = Math.max(0, Math.min(1, this.mining.elapsed / this.mining.required))
      this.renderer.drawMiningIndicator(this.mining.tx, this.mining.ty, prog)
    } else {
      this.renderer.drawMiningIndicator(0,0,null)
    // UI events
    window.addEventListener('set-pause', (e: any) => {
      const v = !!e.detail?.paused
      this.paused = v
      useRuntime.getState().setPaused(v)
    })
    window.addEventListener('set-zoom', (e: any) => {
      const z = Number(e.detail?.zoom)
      if (!Number.isFinite(z)) return
      const clamped = Math.max(1, Math.min(4, z))
      this.renderer.camera.scale = clamped
      useRuntime.getState().setZoom(clamped)
    })
    }
    this.renderer.drawPlayer(this.player.x, this.player.y, this.player.width, this.player.height, { vx: this.player.vx, vy: this.player.vy }, this.player.onGround)
    this.renderer.render(this.player)
  }
}
