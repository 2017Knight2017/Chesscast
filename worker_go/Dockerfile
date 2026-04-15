FROM golang:1.26-alpine AS builder

RUN apk add --no-cache git


WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o chess_worker .

FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y \
    stockfish \
    ca-certificates \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /root/

COPY --from=builder /app/chess_worker .
COPY --from=builder /app/archetypes.json .

RUN chmod +x ./chess_worker

ENV REDIS_URL=redis:6379
ENV BACKEND_URL=http://backend:3000

CMD ["./chess_worker"]