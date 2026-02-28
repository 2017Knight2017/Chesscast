FROM oven/bun:1-alpine

WORKDIR /app

# Копируем только файлы с зависимостями
COPY package.json ./
RUN bun install

COPY . .

# Next.js требует сборки перед запуском
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "dev"]