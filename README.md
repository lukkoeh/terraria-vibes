# Terraria-Lite Infinite (Vertical Slice)

**Neu:** Natürlichere, prozedural generierte **Bäume** (Arten, Äste, Kronen) & **theoretisch unendliche** Welt (horizontal). Überarbeitetes **Look & Feel** (Sky‑Gradient, bessere Tile‑Texturen).
Technologie-Stack: **React + TypeScript + Vite + Pixi.js (WebGL)**, State mit **Zustand**.

## Features
- **Unendlich horizontal**: Chunks (32×32) werden lazy generiert (deterministisch per Seed)
- **Terrain**: 1D Fractal Value-Noise → Oberfläche, Dirt/Stone-Schichten
- **Bäume**: Natürlichere Bäume (Eiche/Kiefer/Birke) mit leichtem Stamm‑Neigen, Ästen und organischen Kronen; Platzierung per Forest‑Noise und leichter Ridge‑Bevorzugung
- **Tiles**: Erde, Stein, Holz, Hintergrund (+ Leer)
- **Spieler**: Rechteck-Avatar, L/R laufen, springen, Gravitation, Kollision
- **Interaktionen**: LMB abbauen, RMB setzen (Reichweite ~5 Tiles)
- **Inventar**: Hotbar 10 Slots (1–0, Mausrad)
- **Inventar**: 9×9 Inventory + Hotbar (10 Slots)
- **Rendering**: Pixi.js, Chunk‑Layer (BG/FG) als RenderTextures; nur sichtbare Chunks redraw; Sky‑Gradient, prozedurale Tile‑Texturen (Erde/Stein/Borke/Laub/Gras)
  - Optional: Externe **Spritesheets** für Terrain & Spieler (falls in `public/assets` vorhanden)
- **Loop**: Fester Timestep (60 FPS)

## Start
```bash
npm install
npm run dev
```

## Desktop (Electron)

- Entwicklung (Electron + Vite Dev Server):
```bash
npm start
```

- Produktion bauen und paketieren (Electron Builder):
```bash
npm run build:app
```
Das erzeugt eine lauffähige Desktop‑App (plattformabhängiges Artefakt) und lädt die gebaute Vite‑App aus `dist/`.

- Direkt testen (ohne Installation, aus `dist/` laden):
```bash
npm run preview:app
```

## Steuerung
A/D bzw. ←/→ laufen • W/↑/Space springen • LMB abbauen • RMB setzen • 1–0 Slots • Mausrad wechseln • Esc Pause/Settings • I Inventar

## Architektur
- **World (infinite)**: `Map<"cx,cy", Chunk>` statt statischem Array. `get()`/`set()` erzeugen Chunks on‑demand. Seed‑basierte Noise (Terrain & Forest).
- **Generator**: `populateChunk(world, cx, cy)` füllt Terrain + Bäume (nur Stamm).
- **Renderer**: `ChunkRenderer` hält Sprite‑Maps pro Chunk; redraw nur wenn `dirty`. Sichtfenster → Chunk‑Koordinaten, horizontal ohne Grenzen.
- **Physik**: Tile‑basierte AABB‑Kollision. Welt vertikal begrenzt (200 Tiles), horizontal offen.

## Hinweise
- Aktuell **keine LRU‑Eviction**: Generierte Chunks bleiben im Speicher. Für echtes Endlos‑Exploring später LRU/Region‑Unload + Persistenz.
- Bäume sind bewusst minimal (nur Stamm), da der aktuelle Tilesatz kein eigenes „Leaves“-Tile vorsieht.

## TODO (für später)
- LRU‑Cache für Chunks + IndexedDB‑Persist (inkl. Spieler‑Änderungen)
- Tag/Nacht‑Zyklus & sanftes Lighting
- Biome / Variation der Terrain‑Parameter
- Tools & Abbauzeiten

## Pixel-Assets & Spritesheets

Diese Codebasis unterstützt optional externe Pixel-Assets (Tiles & Spieler-Animationen) via Pixi-Spritesheets, mit Fallback auf die vorhandenen prozeduralen Texturen bzw. Rechteck-Spieler.

Empfohlene, frei nutzbare Asset-Bibliotheken:

- Kenney.nl – Platformer Pack Redux (Tiles, Deko) – CC0
- Kenney.nl – Platformer Characters (Character-Animationen) – CC0
- PixelFrog – Pixel Adventure 1/2 (Tiles + Charaktere mit Idle/Run/Jump/Fall) – frei nutzbar

Einsortierung (erwartete Pfade):

- Terrain-Spritesheet JSON: `public/assets/tiles/terrain.json` (Pixi/TexturePacker-Format)
  - Erwartete Frame-Namen (Keys): `background`, `dirt`, `stone`, `wood`, optional `trunk`, `leaves`, `grass`
- Player-Spritesheet JSON: `public/assets/player/player.json`
  - Erwartete Frame-Präfixe: `idle_0..n`, `run_0..n`, `jump_0..n` (mind. 1), `fall_0..n` (mind. 1)

Spritesheets erzeugen (frei, lokal):

- Einzel-Frames in `public/assets/player/frames/` bzw. `public/assets/tiles/frames/` ablegen
- Player packen: `npm run pack:player` (erzeugt `public/assets/player/player.{png,json}`)
- Terrain packen: `npm run pack:terrain` (erzeugt `public/assets/tiles/terrain.{png,json}`)

Automatisches Packing:

- Vor `dev`, `start`, `build`, `build:app` wird automatisch gepackt, sofern in `public/assets/**/frames/` PNG‑Frames liegen. Fehlt etwas, wird das Packing übersprungen (keine Fehler).

Hinweis: Falls keine externen Assets vorhanden sind, läuft alles mit den eingebauten prozeduralen Texturen weiter.
