# PDF Studio

Online PDF builder — design multi-page documents in the browser, then export a real PDF. No account required.

## Stack

- Express.js + TypeScript
- Handlebars + Tailwind CSS + Alpine.js
- pdf-lib (export / import)

## Local development

```bash
npm install
npm run build
npm run dev
```

Open [http://localhost:3847](http://localhost:3847).

| Script | Description |
|--------|-------------|
| `npm run dev` | Server + CSS + client watchers |
| `npm run build` | Production CSS, minified client, compiled server |
| `npm start` | Run production server (`dist/`) |
| `npm run typecheck` | TypeScript check |
| `npm run format` | Format with Biome |

## Production deploy

**Requirements:** Node.js 20+

### Build & run (any VPS / PaaS)

```bash
npm ci
npm run build
npm start
```

Environment variables (optional — see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3847` | HTTP port |
| `HOST` | `0.0.0.0` | Bind address |
| `NODE_ENV` | set by `npm start` | Use `production` in deploy |

Health check: `GET /health` → `{ "ok": true }`

### Docker

```bash
docker build -t pdf-studio .
docker run --rm -p 3847:3847 pdf-studio
```

Then open [http://localhost:3847](http://localhost:3847).

### Railway

1. Push this repo to GitHub (already connected if using `origin`).
2. Go to [railway.app/new](https://railway.app/new) → **Deploy from GitHub repo** → select `PDF-Studio`.
3. Railway will use the included `Dockerfile` + `railway.toml`.
4. After the first deploy, open **Settings → Networking → Generate Domain**.
5. Health check path is `/health` (configured in `railway.toml`).

No extra env vars are required (`PORT` is injected by Railway). Optional: set `NODE_ENV=production` (already the default in the Docker image).

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
