import React, { useEffect, useRef, useState } from 'react'
import { useRuntime } from '../state/runtime'
import { useStore, Tile, ItemType } from '../state/store'
import { AxeIcon, ShovelIcon, PickaxeIcon } from './icons'
import { TileSwatch } from './TileSwatch'

function dispatch<K extends string>(name: K, detail: any = {}) {
  const ev = new CustomEvent(name, { detail })
  window.dispatchEvent(ev)
}

export const SettingsOverlay: React.FC = () => {
  const paused = useRuntime(s => s.paused)
  const setPaused = useRuntime(s => s.setPaused)
  const menuOpen = useRuntime(s => s.menuOpen)
  const setMenuOpen = useRuntime(s => s.setMenuOpen)
  const inventoryOpen = useRuntime(s => s.inventoryOpen)
  const setInventoryOpen = useRuntime(s => s.setInventoryOpen)
  const zoom = useRuntime(s => s.zoom)
  const setZoom = useRuntime(s => s.setZoom)

  const fileRef = useRef<HTMLInputElement|null>(null)

  const closeAll = () => { setMenuOpen(false); setInventoryOpen(false); }
  const resume = () => { setPaused(false); dispatch('set-pause', { paused: false }); closeAll() }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        const newPaused = !paused || !menuOpen
        setPaused(newPaused)
        dispatch('set-pause', { paused: newPaused })
        setMenuOpen(newPaused)
        if (newPaused) setInventoryOpen(false)
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault()
        const newOpen = !inventoryOpen
        setInventoryOpen(newOpen)
        const wantPause = newOpen
        setPaused(wantPause)
        dispatch('set-pause', { paused: wantPause })
        if (newOpen) setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paused, menuOpen, inventoryOpen])

  const onImportClick = () => fileRef.current?.click()
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const text = await f.text()
    try {
      const data = JSON.parse(text)
      const ev = new CustomEvent('world-import-request', { detail: { data } })
      window.dispatchEvent(ev)
      resume()
    } catch (err) {
      alert('Invalid file: ' + (err as any)?.message)
    } finally {
      e.target.value = ''
    }
  }

  const exportWorld = async () => {
    const ev = new CustomEvent('world-export-request')
    window.dispatchEvent(ev)
  }

  const onZoom = (v: number) => {
    setZoom(v)
    dispatch('set-zoom', { zoom: v })
  }

  return (
    <div className="ui-root">
      {/* Top-right menu button */}
      <div className="hud-row" style={{ justifyContent:'flex-end', pointerEvents:'auto' }}>
        <button className="btn" onClick={() => { const p=!menuOpen; setPaused(p); dispatch('set-pause', { paused: p }); setMenuOpen(p); if(p) setInventoryOpen(false) }}>
          ⚙️ Settings
        </button>
      </div>

      {(menuOpen || inventoryOpen) && (
        <div className="modal-backdrop" onClick={resume}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            {menuOpen && (
              <div className="panel settings">
                <div className="panel-header">Paused</div>
                <div className="panel-content">
                  <div className="form-row">
                    <label>Zoom</label>
                    <input type="range" min={1} max={4} step={0.25} value={zoom} onChange={(e)=>onZoom(parseFloat(e.target.value))} />
                    <div className="value">{zoom.toFixed(2)}x</div>
                  </div>
                  <div className="button-row">
                    <button className="btn-primary" onClick={()=>setInventoryOpen(true)}>Open Inventory (I)</button>
                    <button className="btn" onClick={exportWorld}>Export World</button>
                    <button className="btn" onClick={onImportClick}>Import World…</button>
                    <input ref={fileRef} type="file" accept="application/json,.json" style={{ display:'none' }} onChange={onFile} />
                  </div>
                </div>
                <div className="panel-footer">
                  <button className="btn-ghost" onClick={resume}>Resume (Esc)</button>
                </div>
              </div>
            )}

            {inventoryOpen && (
              <div className="panel inventory" style={{ minWidth: 580 }}>
                <div className="panel-header">Inventory</div>
                <div className="panel-content">
                  <InventoryGrid />
                </div>
                <div className="panel-footer">
                  <button className="btn-ghost" onClick={resume}>Resume (Esc)</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function itemLabel(t: ItemType | null) {
  if (t === Tile.Dirt) return 'Dirt'
  if (t === Tile.Stone) return 'Stone'
  if (t === Tile.Wood) return 'Wood'
  if (t === 'axe') return 'Axe'
  if (t === 'shovel') return 'Shovel'
  if (t === 'pickaxe') return 'Pickaxe'
  return '—'
}

const InventoryGrid: React.FC = () => {
  const slots = useStore(s => s.slots)
  const moveSlot = useStore(s => s.moveSlot)
  const [dragOver, setDragOver] = useState<number | null>(null)

  return (
    <div className="inventory-grid">
      {slots.map((s, i) => (
        <div
          key={i}
          className={'slot' + (dragOver===i ? ' drag' : '')}
          title={itemLabel(s.item)}
          draggable={!!s.item}
          onDragStart={(e) => {
            if (!s.item) { e.preventDefault(); return }
            e.dataTransfer.setData('text/plain', String(i))
            e.dataTransfer.effectAllowed = 'move'
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(i); e.dataTransfer.dropEffect = 'move' }}
          onDragLeave={() => setDragOver(prev => prev===i ? null : prev)}
          onDrop={(e) => {
            e.preventDefault()
            const from = parseInt(e.dataTransfer.getData('text/plain'), 10)
            if (!Number.isNaN(from)) {
              moveSlot(from, i)
            }
            setDragOver(null)
          }}
          style={{ display:'flex', alignItems:'center', justifyContent:'center' }}
        >
          {s.item===Tile.Dirt && <TileSwatch tile={Tile.Dirt} size={28} />}
          {s.item===Tile.Stone && <TileSwatch tile={Tile.Stone} size={28} />}
          {s.item===Tile.Wood && <TileSwatch tile={Tile.Wood} size={28} />}
          {s.item==='axe' && <AxeIcon />}
          {s.item==='shovel' && <ShovelIcon />}
          {s.item==='pickaxe' && <PickaxeIcon />}
          {!s.item && (
            <div style={{position:'absolute', inset:6, borderRadius:6, opacity:0.15, background:'#ffffff'}}/>
          )}
          <div className="count">{s.item && s.item!== 'axe' && s.item!=='shovel' && s.item!=='pickaxe' ? (s.count>0 ? s.count : '') : ''}</div>
        </div>
      ))}
    </div>
  )
}
