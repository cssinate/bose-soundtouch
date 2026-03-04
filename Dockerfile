FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY --parents packages/*/package.json ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY --parents packages/*/package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /root/.local/share/pnpm/store /root/.local/share/pnpm/store
RUN pnpm install --frozen-lockfile --offline
COPY . .
RUN pnpm build

FROM base AS production
RUN apk add --no-cache python3 make g++

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY --parents packages/*/package.json ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=build --parents /app/packages/*/dist ./

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DATA_DIR=/data

VOLUME /data
EXPOSE 3000

CMD ["node", "packages/server/dist/cli.js"]
