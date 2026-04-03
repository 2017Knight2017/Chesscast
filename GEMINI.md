# Chess Tournaments Platform

A comprehensive platform for broadcasting and analyzing chess matches with "human-like" simulated move times based on player archetypes.

## Project Overview

This project consists of three main services working together to provide a real-time chess broadcasting experience:
1.  **Backend (NestJS)**: The central API and coordinator.
2.  **Frontend (Next.js)**: The interactive user interface.
3.  **Go Worker (Golang)**: A high-performance engine analysis and move simulation service.

## Project Structure

The repository is organized into four main directories, separating concerns between the API, the real-time simulation engine, and the user interface.

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
```

### Backend (NestJS)
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with **Drizzle ORM**
- **Caching & Queuing**: **Redis** with **BullMQ** for background job processing
- **Real-time**: **Socket.IO** for live match updates
- **AI Integration**: **Google Gemini (GenAI)** used to dynamically map chess players to playing archetypes (e.g., "Speed Demon", "Perfectionist").
- **Authentication**: Passport.js with JWT

### Frontend (Next.js)
- **Framework**: Next.js (React 19)
- **Styling**: Tailwind CSS 4
- **Chess UI**: `chessground` for the interactive board
- **Real-time**: Socket.IO Client for receiving move updates and viewer counts

### Go Worker (Golang)
- **Language**: Go 1.25
- **Chess Logic**: `github.com/notnil/chess`
- **Engine**: **Stockfish** (integrated via UCI protocol)
- **Purpose**: Simulates chess games based on PGNs, calculating evaluations and "human-like" move durations by applying archetype-specific biases and complexity factors.

## Workflow

1.  **Match Creation**: A user provides a PGN and player names.
2.  **Archetype Mapping**: The backend uses Google Gemini to analyze the players and assign them archetypes (e.g., "Tactical Berserker").
3.  **Queueing**: The match is added to a BullMQ queue in Redis.
4.  **Simulation**: The Go Worker consumes the task, runs Stockfish analysis for each move, and calculates move durations based on the position's complexity and the players' archetypes.
5.  **Broadcasting**: Once the simulation is complete (or during the process), results are reported back to the backend and broadcasted to clients via Socket.IO.

## Development Commands

### Backend
```bash
cd backend
bun install
bun run start:dev      # Start development server
bun run migrate        # Run database migrations
bun run studio         # Open Drizzle Studio (DB viewer)
```

### Frontend
```bash
cd frontend
bun install
bun run dev            # Start Next.js development server
```

### Go Worker
```bash
cd worker_go
# Ensure Stockfish is installed at /usr/games/stockfish
go run main.go worker.go
```

## Infrastructure Requirements

- **PostgreSQL**: Primary database.
- **Redis**: Required for BullMQ and Socket.IO adapter.
- **Stockfish**: Must be installed on the machine running the Go Worker (expected path: `/usr/games/stockfish`).
- **Nginx**: Used in production to route `/api` to the backend and other requests to the frontend.

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string.
- `REDIS_HOST` / `REDIS_URL`: Redis connection details.
- `GEMINI_KEY`: Google AI API key for archetype mapping.
- `JWT_SECRET`: Secret for signing JWT tokens.

## Socket Name Style
- Backend always emits signals in **snake_case** (e.g. ```this.gateway.server.to(`is_processing:${id}`).emit("no_more_processing");```).
- Frontend always emits signals in **camelCase** (e.g. ```socket.emit('joinMatch', { matchId, username, guestId });```).

## you MUST always use 4-spaced tabs as an indentation.
