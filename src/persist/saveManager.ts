import { World } from '../world/world'
import { Chunk } from '../world/chunk'
import { rleEncode, rleDecode } from './codec'
import { ChunkRecord, MetaRecord, putChunks, putMeta, getAllChunks, getMeta, clearChunks } from './db'
import { useStore } from '../state/store'

export interface ExportBundleV1 {
  version: 1
  seed: number
  player: { x:number, y:number }
  tool?: 'none'|'axe'|'shovel'|'pickaxe'
  inventory: { selectedSlot: number, slots: { item: number|string|null, count: number }[] }
  chunks: { cx:number, cy:number, tiles:number[], bg:number[] }[]
}

export class SaveManager {
  constructor(public world: World, public getPlayer: ()=>{x:number,y:number}, public getTool: ()=>('none'|'axe'|'shovel'|'pickaxe')) {}

  async flushChanged() {
    const recs: ChunkRecord[] = []
    for (const k of this.world.changedChunks) {
      const ch = this.world.chunks.get(k)
      if (!ch) continue
      recs.push(this.toRecord(ch))
    }
    await putChunks(recs)
    this.world.changedChunks.clear()
  }

  toRecord(ch: Chunk): ChunkRecord {
    return {
      key: `${ch.cx},${ch.cy}`,
      cx: ch.cx,
      cy: ch.cy,
      tiles: rleEncode(ch.tiles),
      bg: rleEncode(ch.bg),
    }
  }

  async saveMeta() {
    const s = useStore.getState()
    const meta: MetaRecord = {
      key: 'main',
      seed: this.world.seed,
      player: this.getPlayer(),
      tool: this.getTool(),
      inventory: { selectedSlot: s.selectedSlot, slots: s.slots.map(x=>({item: x.item, count: x.count})) }
    }
    await putMeta(meta)
  }

  async exportBundle(): Promise<ExportBundleV1> {
    // include all chunks currently in memory for export
    const s = useStore.getState()
    const chunks: { cx:number, cy:number, tiles:number[], bg:number[] }[] = []
    for (const ch of this.world.chunks.values()) {
      chunks.push({ cx: ch.cx, cy: ch.cy, tiles: rleEncode(ch.tiles), bg: rleEncode(ch.bg) })
    }
    return {
      version: 1,
      seed: this.world.seed,
      player: this.getPlayer(),
      tool: this.getTool(),
      inventory: { selectedSlot: s.selectedSlot, slots: s.slots.map(x=>({item: x.item, count: x.count})) },
      chunks
    }
  }

  async importBundle(bundle: ExportBundleV1) {
    // wipe current chunk store
    await clearChunks()
    // reset world
    this.world.seed = bundle.seed
    this.world.chunks.clear()
    this.world.changedChunks.clear()
    // load chunks
    const toStore: ChunkRecord[] = []
    for (const c of bundle.chunks) {
      const ch = new Chunk(c.cx, c.cy)
      ch.tiles = rleDecode(c.tiles)
      ch.bg = rleDecode(c.bg)
      ch.generated = true
      ch.dirty = true
      const k = `${c.cx},${c.cy}`
      this.world.chunks.set(k, ch)
      toStore.push({ key: k, cx: c.cx, cy: c.cy, tiles: c.tiles, bg: c.bg })
    }
    await putChunks(toStore)
    // meta: inventory + player
    const s = useStore.getState()
    s.setSelectedSlot(bundle.inventory.selectedSlot)
    // replace slots deeply
    // zustand: we can set via addItem/separate, but here we assign by set function from store not exposed.
    // Workaround: mutate state via addItem semantics: rebuild slots
    const slots = bundle.inventory.slots.map(x=>({ item: x.item as any, count: x.count }))
    // @ts-ignore
    useStore.setState({ slots })
    await this.saveMeta()
    // Move player via event
    const ev = new CustomEvent('player-load-position', { detail: { x: bundle.player.x, y: bundle.player.y } })
    window.dispatchEvent(ev)
    if (bundle.tool) {
      const tev = new CustomEvent('tool-select', { detail: { tool: bundle.tool } })
      window.dispatchEvent(tev)
    }
  }

  async restoreFromDbIfAny() {
    const meta = await getMeta()
    const chunks = await getAllChunks()
    if (!meta || chunks.length === 0) return false
    this.world.seed = meta.seed
    this.world.chunks.clear()
    this.world.changedChunks.clear()
    for (const c of chunks) {
      const ch = new Chunk(c.cx, c.cy)
      ch.tiles = rleDecode(c.tiles)
      ch.bg = rleDecode(c.bg)
      ch.generated = true
      ch.dirty = true
      this.world.chunks.set(c.key, ch)
    }
    // restore inventory
    const slots = meta.inventory.slots.map(x=>({ item: x.item as any, count: x.count }))
    // @ts-ignore
    useStore.setState({ slots, selectedSlot: meta.inventory.selectedSlot })
    // restore player and tool via events
    const ev = new CustomEvent('player-load-position', { detail: { x: meta.player.x, y: meta.player.y } })
    window.dispatchEvent(ev)
    if (meta.tool) {
      const tev = new CustomEvent('tool-select', { detail: { tool: meta.tool } })
      window.dispatchEvent(tev)
    }
    return true
  }
}
