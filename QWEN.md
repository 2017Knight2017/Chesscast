# Chesscast Platform — Project Context

## Project Overview

**Chesscast** is a comprehensive platform for broadcasting and analyzing chess matches with "human-like" simulated move times based on player archetypes. The platform enables users to create live broadcasts from static PGN files, where moves are played out in real-time with realistic timing derived from Stockfish engine analysis and player-specific behavioral models.

The system is built as a microservices architecture with three main components:
- **Backend (NestJS)** — Central API, authentication, WebSocket gateway, and job coordination
- **Frontend (Next.js 16)** — Interactive UI for watching broadcasts and performing analysis
- **Go Worker** — High-performance chess engine analysis and move simulation service

Supporting infrastructure includes PostgreSQL (persistent storage), Redis (caching, queuing via BullMQ), Nginx (reverse proxy), and Stockfish (chess engine).

---

## Project Structure

```text
.
├── backend/                # NestJS + Bun (API and WebSocket Gateway)
│   ├── src/
│   │   ├── auth/           # JWT Authentication logic
│   │   ├── drizzle/        # Database provider and migrations
│   │   ├── matches/        # Match lifecycle, WebSockets, and BullMQ tasks
│   │   ├── players/        # Player registry and archetype management
│   │   ├── redis/          # Redis integration for transient state
│   │   ├── user_analysis/  # Logic for saving and sharing move trees
│   │   └── schema.ts       # Central Drizzle ORM schema definition
│   └── Dockerfile
├── frontend/               # Next.js 16 (React 19) Application
│   ├── actions/            # Server Actions for form submissions and data mutations
│   ├── app/                # App Router (Login, Watch, New Match, Profiles)
│   ├── components/         # Shared UI components (Chessboard, Live Cards)
│   ├── context/            # React Contexts (Socket.io, Analysis State)
│   ├── hooks/              # Custom hooks (Clocks, Broadcast syncing)
│   └── Dockerfile
├── worker_go/              # Golang Simulation Engine
│   ├── main.go             # Redis/BullMQ task consumer
│   ├── worker.go           # UCI Engine handler and Complexity algorithms
│   ├── archetypes.json     # Player simulation parameters
│   └── Dockerfile
├── nginx/                  # Reverse Proxy configuration
│   └── default.conf        # Routing for /api and /socket.io
└── DOCUMENTATION.md        # Comprehensive technical documentation
```

---

## Key Technologies

| Component | Technology |
|---|---|
| Backend Runtime | Bun (oven/bun:1-alpine) |
| Backend Framework | NestJS 11 (TypeScript) |
| Frontend Framework | Next.js 16 (React 19) |
| Frontend Styling | Tailwind CSS 4 |
| Database | PostgreSQL 15+ |
| ORM | Drizzle ORM |
| Cache / Queue | Redis + BullMQ |
| Real-time | Socket.IO |
| Worker Language | Go 1.25+ |
| Chess Engine | Stockfish 16+ (UCI protocol) |
| Chess Logic (Go) | github.com/notnil/chess |
| Chess UI | chessground |
| AI Archetype Mapping | Google Gemini (GenAI) |
| Authentication | Passport.js + JWT |

---

## Architecture & Workflow

### Match Lifecycle

1. **Match Creation** — User provides a PGN and player names via the frontend
2. **Archetype Mapping** — Backend uses Google Gemini to analyze players and assign archetypes (e.g., "Tactical Berserker", "Speed Demon", "Perfectionist")
3. **Queueing** — The match is added to a BullMQ queue in Redis
4. **Simulation** — Go Worker consumes the task, runs Stockfish analysis for each move, and calculates move durations based on position complexity and player archetypes
5. **Broadcasting** — Results are reported back to the backend and broadcasted to clients via Socket.IO

### Timing Simulation Logic

The Go Worker uses a log-normal distribution to calculate move times. The complexity formula:

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

Where **P** is the Panic Factor (reduces move time when clock is below 3 minutes and nearing a time control).

### WebSocket Protocol

**Naming Convention:** Backend emits signals in `snake_case`, frontend emits in `camelCase`.

| Direction | Event | Description |
|---|---|---|
| Client → Server | `join_match` | Subscribe to a match |
| Client → Server | `sync_user_analysis` | Synchronize user's local move tree |
| Client → Server | `user_started_analysis` | Notify user entered analysis mode |
| Server → Client | `new_move` | Broadcast a move being played |
| Server → Client | `viewer_count_update` | Update active viewer count |
| Server → Client | `analysis_update` | Sync analysis state for observers |
| Server → Client | `match_finished` | Simulation concluded |

---

## Development Commands

### Backend

```bash
cd backend
bun install                    # Install dependencies
bun run start:dev              # Start development server (watch mode)
bun run start:prod             # Start production server
bun run build                  # Build the project
bun run migrate                # Run database migrations
bun run studio                 # Open Drizzle Studio (DB viewer on port 4983)
bun run format                 # Format code with Prettier
bun run lint                   # Run ESLint with auto-fix
bun run test                   # Run unit tests
bun run test:e2e               # Run e2e tests
```

### Frontend

```bash
cd frontend
bun install                    # Install dependencies
bun run dev                    # Start Next.js development server
bun run build                  # Build for production
bun run start                  # Start production server
bun run lint                   # Run ESLint
```

### Go Worker

```bash
cd worker_go
go run main.go worker.go       # Run the worker (Stockfish must be at /usr/games/stockfish)
```

### Docker (Production)

All services are containerized. The backend uses a multi-stage Bun build, the frontend runs Next.js standalone, and the Go Worker uses a multi-stage build with Stockfish included.

---

## Environment Variables

| Variable | Service | Purpose |
|---|---|---|
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `REDIS_URL` | Backend, Worker | Redis connection string |
| `REDIS_HOST` | Frontend | Redis host (if used directly) |
| `GEMINI_KEY` | Backend | Google AI API key for archetype mapping |
| `JWT_SECRET` | Backend | Secret key for signing JWT tokens |
| `NEXT_PUBLIC_SOCKET_URL` | Frontend | Public URL for the Backend gateway |
| `BACKEND_URL` | Worker | Internal URL for reporting simulation results |

---

## Data Schema

Key tables managed via Drizzle ORM:

| Table | Purpose |
|---|---|
| `users` | Core user data and credentials |
| `players` | Registry of historical chess players and their archetypes |
| `analysis` | Source of truth for a match (PGN, evaluations, times) |
| `matches` | Live state of a broadcast (references `analysis.id`) |
| `user_analysis` | JSONB representations of user-created move trees |

Status enum: `processing`, `waiting`, `in_progress`, `finished`
Outcome enum: `1/2-1/2`, `1-0`, `0-1`

---

## Coding Conventions

- **Indentation:** 4 spaces (mandatory — do NOT use tabs)
- **Backend socket events:** `snake_case` naming
- **Frontend socket events:** `camelCase` naming
- **TypeScript:** Strict mode, with ESLint + Prettier enforcement
- **Go:** Standard formatting with `go mod` for dependencies
- **Frontend:** React 19 with Next.js App Router, Server Actions for mutations

---

## API Reference

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

### User Analysis (`/user-analysis`)

| Endpoint | Method | Description |
|---|---|---|
| `/user-analysis/save` | POST | Persistently save a move tree branch |
| `/user-analysis/:matchId/:userId` | GET | Retrieve a specific analysis session |

---

## System Dependencies

- **PostgreSQL 15+** — Must support JSONB and Array types
- **Redis** — Required for BullMQ and Socket.IO adapter
- **Stockfish 16+** — Must be available in the Worker's PATH (expected: `/usr/games/stockfish`)
- **Bun** — Required for backend and frontend package management and execution
