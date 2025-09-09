import { existsSync, readdirSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

function resolveSpritesheetBin() {
  try {
    return require.resolve('spritesheet-js/bin/spritesheet-js')
  } catch {
    return null
  }
}

function listPngs(dir) {
  if (!existsSync(dir)) return []
  try {
    return readdirSync(dir)
      .filter(f => f.toLowerCase().endsWith('.png'))
      .map(f => resolve(join(dir, f)))
  } catch {
    return []
  }
}

function pack(frames, outDir, name, padding) {
  if (!frames.length) return Promise.resolve('skipped')
  mkdirSync(outDir, { recursive: true })
  return new Promise((resolvePromise) => {
    const bin = resolveSpritesheetBin()
    if (!bin) {
      console.log('[pack] spritesheet-js nicht installiert – überspringe Packing. Installiere devDependencies, um zu packen.')
      resolvePromise('skipped')
      return
    }
    const args = [bin, ...frames, '-p', outDir, '-n', name, '-f', 'pixi.js', '--padding', String(padding)]
    const env = { ...process.env }
    // prepend local shims for legacy tools (identify.cmd -> magick identify)
    env.PATH = `${resolve('scripts/bin')};${env.PATH || ''}`
    const child = spawn(process.execPath, args, { stdio: 'inherit', env })
    child.on('close', (code) => {
      if (code === 0) resolvePromise('ok')
      else resolvePromise('failed')
    })
    child.on('error', () => resolvePromise('failed'))
  })
}

async function packWithFreeTexPacker(frames, outDir, name, padding) {
  if (!frames.length) return 'skipped'
  let ftp
  try {
    // lazy import to avoid hard dep at runtime if not installed
    ftp = (await import('free-tex-packer-core')).default
  } catch {
    console.log('[pack] fallback packer nicht installiert (free-tex-packer-core) – überspringe')
    return 'skipped'
  }
  mkdirSync(outDir, { recursive: true })
  const images = frames.map(f => ({ path: f, contents: readFileSync(f) }))
  const options = {
    textureName: name,
    width: 2048,
    height: 2048,
    padding: padding,
    allowRotation: false,
    detectIdentical: true,
    allowTrim: false,
    exporter: 'PixiJS',
    removeFileExtension: true,
    pretty: true,
    fixedSize: false,
    powerOfTwo: true,
    tinify: false,
    packer: 'OptimalPacker',
    scaleMode: 'NearestNeighbor'
  }
  return new Promise((resolvePromise) => {
    ftp(images, options, (files) => {
      files.forEach(file => {
        writeFileSync(join(outDir, file.name), Buffer.from(file.buffer))
      })
      console.log(`[pack] fallback: geschrieben → ${join(outDir, name)}.{png,json}`)
      resolvePromise('ok')
    })
  })
}

async function packKind(kind) {
  if (kind === 'player') {
    const framesDir = 'public/assets/player/frames'
    const frames = listPngs(framesDir)
    if (frames.length === 0) { console.log('[pack] player: keine Frames gefunden, überspringe') ; return }
    const outDir = 'public/assets/player'
    console.log('[pack] player: packe', frames.length, 'Frames…')
    let res = await pack(frames, outDir, 'player', 2)
    if (res === 'failed') {
      console.log('[pack] spritesheet-js fehlgeschlagen, versuche Fallback…')
      await packWithFreeTexPacker(frames, outDir, 'player', 2)
    }
    return
  }
  if (kind === 'terrain') {
    const framesDir = 'public/assets/tiles/frames'
    const frames = listPngs(framesDir)
    if (frames.length === 0) { console.log('[pack] terrain: keine Frames gefunden, überspringe') ; return }
    const outDir = 'public/assets/tiles'
    console.log('[pack] terrain: packe', frames.length, 'Frames…')
    let res = await pack(frames, outDir, 'terrain', 1)
    if (res === 'failed') {
      console.log('[pack] spritesheet-js fehlgeschlagen, versuche Fallback…')
      await packWithFreeTexPacker(frames, outDir, 'terrain', 1)
    }
    return
  }
}

async function main() {
  const arg = (process.argv[2] || 'all').toLowerCase()
  if (arg === 'all') {
    await packKind('terrain')
    await packKind('player')
  } else if (arg === 'player' || arg === 'terrain') {
    await packKind(arg)
  } else {
    console.log('[pack] unbekannte Option:', arg)
  }
}

main().catch(()=>{})
