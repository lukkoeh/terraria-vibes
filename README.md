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
- **Rendering**: Pixi.js, Chunk‑Layer (BG/FG) als RenderTextures; nur sichtbare Chunks redraw; Sky‑Gradient, prozedurale Tile‑Texturen (Erde/Stein/Borke/Laub/Gras)
- **Loop**: Fester Timestep (60 FPS)

## Start
```bash
npm install
npm run dev
```

## Steuerung
A/D bzw. ←/→ laufen • W/↑/Space springen • LMB abbauen • RMB setzen • 1–0 Slots • Mausrad wechseln

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
