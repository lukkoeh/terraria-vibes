import React, { useEffect, useRef } from 'react'
import { Game } from './engine/Game'
import { Hotbar } from './ui/Hotbar'
import { HUD } from './ui/HUD'
import { SettingsOverlay } from './ui/SettingsOverlay'
import { useRuntime } from './state/runtime'

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const menuOpen = useRuntime(s => s.menuOpen)
  const inventoryOpen = useRuntime(s => s.inventoryOpen)

  useEffect(() => {
    if (!canvasRef.current) return
    const game = new Game(canvasRef.current)
    game.start()
    return () => game.destroy()
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh'
        }}
      />
      <div className="overlay">
        <div className="hud-row" style={{ justifyContent:'space-between' }}>
          <HUD />
        </div>
        {!(menuOpen || inventoryOpen) && (
          <div className="hud-row" style={{justifyContent:'center', marginBottom: 12}}><Hotbar /></div>
        )}
      </div>
      <SettingsOverlay />
    </>
  )
}
