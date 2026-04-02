# Chess Tournaments Platform
**ALWAYS** read /DOCUMENTATION.md before making any changes.

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


## Socket Name Style
- Backend always emits signals in **snake_case** (e.g. ```this.gateway.server.to(`is_processing:${id}`).emit("no_more_processing");```).
- Frontend always emits signals in **camelCase** (e.g. ```socket.emit('joinMatch', { matchId, username, guestId });```).

## you MUST always use 4-spaced tabs as an indentation.
