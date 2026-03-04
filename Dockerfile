FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/api/package.json packages/api/
COPY packages/discovery/package.json packages/discovery/
COPY packages/spotify/package.json packages/spotify/
COPY packages/server/package.json packages/server/
COPY packages/web/package.json packages/web/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/api/package.json packages/api/
COPY packages/discovery/package.json packages/discovery/
COPY packages/spotify/package.json packages/spotify/
COPY packages/server/package.json packages/server/
COPY packages/web/package.json packages/web/
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /root/.local/share/pnpm/store /root/.local/share/pnpm/store
RUN pnpm install --frozen-lockfile --offline
COPY . .
RUN pnpm build

FROM base AS production
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/api/package.json packages/api/
COPY packages/discovery/package.json packages/discovery/
COPY packages/spotify/package.json packages/spotify/
COPY packages/server/package.json packages/server/
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/packages/core/dist packages/core/dist
COPY --from=build /app/packages/api/dist packages/api/dist
COPY --from=build /app/packages/discovery/dist packages/discovery/dist
COPY --from=build /app/packages/spotify/dist packages/spotify/dist
COPY --from=build /app/packages/server/dist packages/server/dist
COPY --from=build /app/packages/web/dist packages/web/dist

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DATA_DIR=/data

VOLUME /data
EXPOSE 3000

CMD ["node", "packages/server/dist/cli.js"]
