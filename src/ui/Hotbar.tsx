import React from 'react'
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

  return (
    <div className="hotbar">
      {slots.map((s, i) => (
        <div
          key={i}
          className={'slot ' + (i === selected ? 'selected' : '')}
          onClick={() => setSelected(i)}
          title={itemLabel(s.item)}
          style={{ display:'flex', alignItems:'center', justifyContent:'center' }}
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
