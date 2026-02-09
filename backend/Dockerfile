
#FROM oven/bun:1-alpine
#
#WORKDIR /app
#
## Копируем файлы зависимостей
#COPY package.json bun.lock ./
#RUN bun install --frozen-lockfile
#
## Копируем остальной код
#COPY . .
#
## Собираем Nest.js (если используете TypeScript)
#RUN bun run build
#
#EXPOSE 3000
#CMD ["bun", "run", "start:prod"]


# Стейдж 1: Сборка
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
# Генерируем клиент Prisma и собираем проект
RUN bun x prisma generate
RUN bun run build 

# Стейдж 2: Запуск
FROM oven/bun:1.1-slim
WORKDIR /app
# Копируем только то, что нужно для работы
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

CMD ["bun", "run", "start:prod"]