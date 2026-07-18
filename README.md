# PDF Studio

Online PDF builder and editor — design multi-page documents in the browser, then export a real PDF.

## Stack

- **Express.js** + **TypeScript**
- **Handlebars** views
- **Tailwind CSS**
- **Alpine.js** editor UI
- **pdf-lib** for PDF export

## Features

- Multi-page documents (A4, US Letter, Square)
- Tools: select, text, rectangle, ellipse, line, image upload (PNG/JPEG)
- Drag, resize, snap-to-grid, align, lock
- Layer panel + bring forward / send back
- Undo / redo (60 steps)
- Templates: blank, invoice, letter, flyer
- Page duplicate / reorder
- Rotation, corner radius, opacity
- Debounced autosave to `localStorage`
- Export downloadable PDF via `/api/export`

## Setup

```bash
cd pdf-studio
npm install
npm run build:css
npm run build:client
npm run dev
```

Open [http://localhost:3847](http://localhost:3847).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Server + CSS + client watchers |
| `npm run build` | Production CSS, client bundle, and server compile |
| `npm start` | Run compiled server |

## Shortcuts

| Key | Action |
|-----|--------|
| `V` / `T` / `R` / `O` / `L` | Tools |
| `⌘/Ctrl+Z` | Undo |
| `⌘/Ctrl+Y` or `⇧⌘Z` | Redo |
| `⌘/Ctrl+D` | Duplicate |
| `⌘/Ctrl+E` | Export PDF |
| `Arrows` | Nudge (⇧ = 1px) |
| `Escape` | Deselect |
| `Delete` | Remove selection |
