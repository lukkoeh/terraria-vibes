import React from 'react'
import { useStore } from '../state/store'
import { useRuntime } from '../state/runtime'

export const HUD: React.FC = () => {
  const player = useRuntime(s => s.player)
  const selected = useStore(s => s.selectedSlot)
  const slots = useStore(s => s.slots)
  const item = slots[selected]?.item ?? null
  return (
    <div className="hud pill">
      Pos: {Math.round(player.x)}, {Math.round(player.y)} &nbsp;|&nbsp; Speed: {player.vx.toFixed(2)}, {player.vy.toFixed(2)} &nbsp;|&nbsp; Slot: {selected+1} {item!==null ? `(Item ${item})` : '(leer)'}
    </div>
  )
}
