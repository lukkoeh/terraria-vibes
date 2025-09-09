import React, { useState } from 'react'
import { useStore, Tile, ItemType } from '../state/store'
import { AxeIcon, ShovelIcon, PickaxeIcon } from './icons'
import { TileSwatch } from './TileSwatch'

function itemLabel(t: ItemType | null) {
  if (t === Tile.Dirt) return 'Dirt'
  if (t === Tile.Stone) return 'Stone'
  if (t === Tile.Wood) return 'Wood'
  if (t === 'axe') return 'Axe'
  if (t === 'shovel') return 'Shovel'
  if (t === 'pickaxe') return 'Pickaxe'
  return '—'
}

export const Hotbar: React.FC = () => {
  const selected = useStore(s => s.selectedSlot)
  const setSelected = useStore(s => s.setSelectedSlot)
  const slots = useStore(s => s.slots)
  const moveSlot = useStore(s => s.moveSlot)
  const [dragOver, setDragOver] = useState<number | null>(null)

  return (
    <div className="hotbar">
      {slots.slice(0,10).map((s, i) => (
        <div
          key={i}
          className={'slot ' + (i === selected ? 'selected' : '')}
          onClick={() => setSelected(i)}
          title={itemLabel(s.item)}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', outline: dragOver===i ? '2px dashed rgba(255,255,255,0.25)' : undefined }}
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
              setSelected(i)
            }
            setDragOver(null)
          }}
        >
          <div className="label">{i+1}</div>
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
