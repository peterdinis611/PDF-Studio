# syntax=docker/dockerfile:1

# PDF Studio — multi-stage production image
# Build:  docker build -t pdf-studio .
# Run:    docker compose up -d

ARG NODE_VERSION=24

# ── deps: install all deps once (cached by lockfile) ─────────────────────────
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# ── build: compile server + client assets ────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY tsconfig.server.json tsconfig.client.json ./
COPY postcss.config.js ./
COPY scripts ./scripts
COPY src ./src
COPY views ./views
COPY public ./public

# Build with full deps, then drop devDependencies for a lean runtime layer.
RUN npm run build \
 && npm prune --omit=dev \
 && npm cache clean --force \
 && rm -rf /tmp/* /root/.npm

# ── runtime: slim image, non-root, tini ──────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3847 \
    NPM_CONFIG_UPDATE_NOTIFIER=false

RUN apk add --no-cache tini \
 && mkdir -p /app/uploads \
 && chown -R node:node /app

COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/views ./views

USER node
EXPOSE 3847

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3847)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server/index.js"]
