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
| `npm run build` | Fonts, production CSS, minified client, compiled server |
| `npm run build:fonts` | Copy self-hosted UI fonts out of `@fontsource` |
| `npm start` | Run production server (`dist/`) |
| `npm run typecheck` | TypeScript check |
| `npm run format` | Format with Biome |

## Fonts

The marketing and error pages are set in Bodoni Moda, Newsreader and Courier
Prime, self-hosted. `npm run build:fonts` copies the woff2 files out of the
`@fontsource` packages into `public/fonts/` and regenerates
`src/styles/fonts.generated.css` with the packages' own `unicode-range`
declarations, so a browser only fetches `latin-ext` when the page needs it.
Both outputs are generated — they are gitignored and rebuilt by `npm run build`.

The editor still loads its document font catalogue from Google Fonts. Those are
fonts the user picks for their PDF, not app chrome, and there are fourteen of
them; `@fontsource/{inter,roboto,open-sans,lora,playfair-display}` stay in
`dependencies` as the offline fallback used by `fontEmbed.ts` during export.

## Social card

`public/og.png` is the 1200×630 Open Graph image, rendered from the masthead.
It is committed and **not** part of `npm run build`. Regenerate it only when the
masthead design changes:

```bash
npm i -D puppeteer && node scripts/build-og.mjs && npm uninstall puppeteer
```

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
| `LOG_LEVEL` | `info` (prod) / `debug` (dev) | Pino log level |
| `AUDIT_LOGS_TOKEN` | unset | Protects `/audit-logs` (required in production if you want the page) |
| `AUDIT_LOG_CAPACITY` | `500` | In-memory audit ring buffer size |

Health check: `GET /health` → `{ "ok": true }`

Audit logs (ops): `GET /audit-logs` — in-memory Pino-backed event stream (exports, uploads, errors). Cleared on process restart. In production, set `AUDIT_LOGS_TOKEN` or the page returns 404.

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

## Tests

```bash
npm test
npm run test:coverage
```

Jest covers session validation, fonts, factories, smart guides, in-browser PDF import, and Google-font helpers.

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
