import React, { useEffect, useRef } from 'react'
import { Tile } from '../state/store'

interface Props { tile: Tile; size?: number }

export const TileSwatch: React.FC<Props> = ({ tile, size = 28 }) => {
  const ref = useRef<HTMLCanvasElement|null>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    c.width = size
    c.height = size
    const g = c.getContext('2d')!
    g.clearRect(0,0,size,size)

    const rect = (color: string) => { g.fillStyle = color; g.fillRect(0,0,size,size) }
    const line = (x1:number,y1:number,x2:number,y2:number,color:string,alpha=1) => {
      g.globalAlpha = alpha
      g.strokeStyle = color
      g.lineWidth = 1
      g.beginPath(); g.moveTo(x1+0.5,y1+0.5); g.lineTo(x2+0.5,y2+0.5); g.stroke(); g.globalAlpha = 1
    }
    const fill = (x:number,y:number,w:number,h:number,color:string,alpha=1)=>{ g.globalAlpha=alpha; g.fillStyle=color; g.fillRect(x,y,w,h); g.globalAlpha=1 }

    function speckle(n:number, color:string, alpha:number) {
      g.globalAlpha = alpha
      g.fillStyle = color
      for (let i=0;i<n;i++) {
        const x = Math.floor(Math.random()*size)
        const y = Math.floor(Math.random()*size)
        g.fillRect(x,y,1,1)
      }
      g.globalAlpha = 1
    }

    if (tile === Tile.Dirt) {
      rect('#8a5a44')
      fill(0,0,size,Math.max(2, Math.floor(size*0.18)),'#ffffff',0.08)
      fill(0,size-Math.max(2, Math.floor(size*0.15)),size,Math.max(2, Math.floor(size*0.15)),'#000000',0.10)
      speckle(14,'#3b2a22',0.18)
      speckle(10,'#c3a18b',0.10)
    } else if (tile === Tile.Stone) {
      rect('#6f6f7a')
      fill(0,0,size,Math.max(2, Math.floor(size*0.18)),'#ffffff',0.08)
      fill(0,size-Math.max(2, Math.floor(size*0.15)),size,Math.max(2, Math.floor(size*0.15)),'#000000',0.12)
      line(2, Math.floor(size*0.4), size-3, Math.floor(size*0.45), '#000000', 0.10)
      line(3, Math.floor(size*0.7), size-4, Math.floor(size*0.75), '#000000', 0.10)
    } else if (tile === Tile.Wood) {
      rect('#9c6b3d')
      fill(0,0,size,Math.max(2, Math.floor(size*0.18)),'#ffffff',0.06)
      fill(0,size-Math.max(2, Math.floor(size*0.15)),size,Math.max(2, Math.floor(size*0.15)),'#000000',0.10)
      line(0, Math.floor(size*0.35), size, Math.floor(size*0.38), '#6c4a28', 0.3)
      line(0, Math.floor(size*0.65), size, Math.floor(size*0.68), '#6c4a28', 0.3)
    } else if (tile === Tile.Grass) {
      rect('#356e34')
      fill(0,0,size,Math.max(3, Math.floor(size*0.22)),'#6adf72',0.30)
      fill(0,size-Math.max(2, Math.floor(size*0.15)),size,Math.max(2, Math.floor(size*0.15)),'#000000',0.10)
    } else {
      // fallback empty
      fill(0,0,size,size,'#ffffff',0.12)
    }
  }, [tile, size])

  return <canvas ref={ref} style={{ width:size, height:size, borderRadius:6 }} />
}

