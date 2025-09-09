import React, { useEffect, useRef } from 'react'
import { Game } from './engine/Game'
import { Hotbar } from './ui/Hotbar'
import { HUD } from './ui/HUD'
import { WorldMenu } from './ui/WorldMenu'

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

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
          <WorldMenu />
        </div>
        <div className="hud-row" style={{justifyContent:'center', marginBottom: 12}}><Hotbar /></div>
      </div>
    </>
  )
}
