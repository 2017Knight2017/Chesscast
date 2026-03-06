# Этап 1: Сборка бинарного файла
FROM golang:1.26-alpine AS builder

# Устанавливаем необходимые инструменты сборки
RUN apk add --no-cache git


WORKDIR /app

# Копируем файлы зависимостей
COPY go.mod go.sum ./
RUN go mod download

# Копируем исходный код
COPY . .

# Собираем приложение (main.go и worker.go)
RUN CGO_ENABLED=0 GOOS=linux go build -o chess_worker .

# Этап 2: Финальный образ
FROM debian:bullseye-slim

# Устанавливаем stockfish и ca-certificates для HTTPS запросов к бэкенду
RUN apt-get update && apt-get install -y \
    stockfish \
    ca-certificates \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /root/

# Копируем бинарный файл из сборщика
COPY --from=builder /app/chess_worker .
# Копируем файл с архетипами (убедитесь, что он есть в корне проекта)
COPY --from=builder /app/archetypes.json .

# Права на выполнение
RUN chmod +x ./chess_worker

# Переменные окружения по умолчанию
ENV REDIS_URL=redis:6379
ENV BACKEND_URL=http://backend:3000

# Запуск приложения
CMD ["./chess_worker"]