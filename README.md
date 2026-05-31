# ♟️ Chesscast Platform

A comprehensive platform for broadcasting and analyzing chess matches with **human-like** simulated move times based on player archetypes. Create live broadcasts from static PGN files, where moves are played out in real-time with realistic timing derived from Stockfish engine analysis and player-specific behavioral models.

## ✨ Features

- **Live Match Broadcasting** — Upload a PGN and watch it play out in real-time with realistic move times
- **Player Archetypes** — AI-driven archetype assignment (e.g., "Tactical Berserker", "Speed Demon", "Perfectionist") using Google Gemini
- **Stockfish-Powered Analysis** — Deep engine analysis for position complexity and evaluation
- **Real-Time Updates** — WebSocket-based live move broadcasting to all connected viewers
- **User Analysis Mode** — Explore variations, save analysis branches, and share move trees
- **Time Control Support** — Simulate classical, rapid, and blitz time controls with increments and bonus time

## 🏗️ Architecture

The platform is built as a **microservices architecture** with the following components:

| Service | Technology | Description |
|---|---|---|
| **Backend** | NestJS 11 + Bun | Central API, JWT authentication, WebSocket gateway, and job coordination |
| **Frontend** | Next.js 16 (React 19) | Interactive UI for watching broadcasts and performing analysis |
| **Go Worker** | Go 1.25 + Stockfish | High-performance chess engine analysis and move simulation service |
| **Database** | PostgreSQL 17 | Persistent storage for users, matches, players, and analysis |
| **Cache / Queue** | Redis 7 | BullMQ queues, caching, and Socket.IO adapter |
| **Reverse Proxy** | Nginx | Routes `/api` to backend and `/` to frontend |

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose**
- **Bun** (for local backend/frontend development)
- **Go 1.25+** and **Stockfish 16+** (only if running worker locally)

---

### 🐳 Running with Docker (Easiest)

All environment variables, keys, and database configurations are already pre-configured inside `docker-compose.yml`.

```bash
# Clone the repository
git clone <repository-url>
cd chess_tournaments

# Start all services (Database, Redis, Backend, Frontend, Worker, Nginx)
docker compose up -d

# Access the application on http://localhost

```

---

### 💻 Running Locally (Development Mode)

If you want to develop services locally with hot-reload, you still need Docker to run the database and cache. Also you should rename all .env.example files into .env for them to be read as the environment variables.

#### 1. Start Infrastructure Dependencies

```bash
# Spin up only PostgreSQL and Redis in the background
docker compose up db redis -d

```

#### 2. Backend Setup

```bash
cd backend
bun install
bun run migrate          # Run Drizzle migrations
bun run seed.ts          # Hydrate database with player's names
bun run start:dev        # Start NestJS development server

```

#### 3. Frontend Setup

```bash
cd frontend
bun install
bun run dev              # Start Next.js development server on http://localhost:3000

```

#### 4. Go Worker Setup

Ensure Stockfish is installed on your machine (`brew install stockfish` or `sudo apt install stockfish`).

```bash
cd worker_go
# Don't forget to set your STOCKFISH_PATH in .env or docker-compose.yml
go run main.go worker.go

```

## 📁 Project Structure

```text
.
├── backend/           # NestJS + Bun (API and WebSocket Gateway)
├── frontend/          # Next.js 16 (React 19) Application
├── worker_go/         # Golang Simulation Engine
├── nginx/             # Reverse Proxy configuration
├── DOCUMENTATION.md   # Comprehensive technical documentation
├── QWEN.md            # Qwen Code project context and conventions
└── README.md          # This file
```

## 📄 Sources

Chessground and sound effects are made by [Lichess](https://github.com/lichess-org).
Gemini AI is made by [Google](https://ai.google.dev/gemini-api/docs).

## 📚 Additional Resources

- [DOCUMENTATION.md](./DOCUMENTATION.md) — Comprehensive technical documentation
- [Nginx Configuration](./nginx/default.conf) — Reverse proxy setup

## 📄 License

This project is licensed under **GNU Public License 3.0**.