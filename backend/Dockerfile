FROM oven/bun:1-alpine AS base
WORKDIR /app

# --- Этап зависимостей ---
FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- Этап сборки ---
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN bun run build

# --- Финальный этап (Production) ---
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/src ./src

EXPOSE 3000

CMD ["bun", "run", "start:prod"]
