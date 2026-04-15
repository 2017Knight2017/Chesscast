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
- **Stockfish 16+** (for local worker development)
- **Bun** (for local backend/frontend development)

### Running with Docker

```bash
# Clone the repository
git clone <repository-url>
cd chess_tournaments

# Configure environment variables (see below)

# Start all services
docker compose up -d

# Access the application
# Frontend:  http://localhost
# Backend:   http://localhost/api
# Drizzle Studio: http://localhost:4983
```

### Running Locally (Development)

#### Backend

```bash
cd backend
bun install
bun run migrate          # Run database migrations
bun run start:dev        # Start development server
```

#### Frontend

```bash
cd frontend
bun install
bun run dev              # Start Next.js development server
```

#### Go Worker

```bash
cd worker_go
go run main.go worker.go  # Stockfish must be at /usr/games/stockfish
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

## 🔑 Environment Variables

### Backend

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_HOST` | Redis hostname |
| `PORT` | Backend port (default: 3000) |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `GEMINI_KEY` | Google AI API key for archetype mapping |

### Frontend

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SOCKET_URL` | Public URL for the WebSocket gateway |
| `NEST_API_URL` | URL of the backend API |
| `WATCHPACK_POLLING` | Enable file watching in Docker (`true`) |

### Go Worker

| Variable | Purpose |
|---|---|
| `BACKEND_URL` | Internal URL for reporting simulation results |
| `REDIS_URL` | Redis connection string |

## 📖 API Reference

### Authentication (`/auth`)

| Endpoint | Method | Description |
|---|---|---|
| `/auth/register` | POST | Register with email, username, password |
| `/auth/login` | POST | Validate credentials, return JWT |
| `/auth/profile` | GET | Get current user profile (requires JWT) |

### Match Management (`/matches`)

| Endpoint | Method | Description |
|---|---|---|
| `/matches/create` | POST | Create broadcast (accepts PGN, archetypes, time control) |
| `/matches/:id/start` | POST | Trigger match simulation start |
| `/matches/:id/state` | GET | Get current FEN, clocks, move history |
| `/matches/live` | GET | List all active broadcasts |
| `/matches/planned` | GET | List upcoming matches |

## 🧠 Timing Simulation Logic

The Go Worker uses a **log-normal distribution** to calculate move times based on position complexity:

```
C = W1 * U + W2 * S + W3 * T
```

Where:
- **U (Uncertainty)** — Derived from evaluation delta between top two engine moves
- **S (Sharpness)** — Deviation of the top move from the average evaluation of top three moves
- **T (Tactics)** — Ratio of captures and checks among all legal moves

Final move time:

```
T_move = T_base * C_mult * P * e^(N(0, σ))
```

Where **P** is the Panic Factor (reduces move time when clock is below 3 minutes).

## 📄 License

This project is proprietary and not licensed for public use.

## 📚 Additional Resources

- [DOCUMENTATION.md](./DOCUMENTATION.md) — Comprehensive technical documentation
- [Nginx Configuration](./nginx/default.conf) — Reverse proxy setup
