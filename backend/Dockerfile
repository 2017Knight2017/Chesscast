FROM oven/bun:1-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Копируем остальной код
COPY . .

# Собираем Nest.js (если используете TypeScript)
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start:prod"]