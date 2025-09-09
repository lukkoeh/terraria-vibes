import React, { useRef, useState } from 'react'

export const WorldMenu: React.FC = () => {
  const [open, setOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement|null>(null)

  const exportWorld = async () => {
    const ev = new CustomEvent('world-export-request')
    window.dispatchEvent(ev)
  }
  const onImportClick = () => fileRef.current?.click()
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const text = await f.text()
    try {
      const data = JSON.parse(text)
      const ev = new CustomEvent('world-import-request', { detail: { data } })
      window.dispatchEvent(ev)
    } catch (err) {
      alert('Invalid file: ' + (err as any)?.message)
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div style={{ position:'relative' }}>
      <button className="pill" style={{ cursor:'pointer' }} onClick={()=>setOpen(v=>!v)} title="World">
        🌍 World
      </button>
      {open && (
        <div style={{ position:'absolute', right:0, top:'110%', background:'rgba(15,16,20,0.9)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:8, minWidth:220, zIndex:10 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <button onClick={exportWorld}>Export World</button>
            <button onClick={onImportClick}>Import World...</button>
            <input ref={fileRef} type="file" accept="application/json,.json" style={{ display:'none' }} onChange={onFile} />
          </div>
        </div>
      )}
    </div>
  )
}

