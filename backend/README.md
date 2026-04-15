# Backend — NestJS API & WebSocket Gateway

The backend service is the central hub of the Chesscast platform. It handles authentication, match lifecycle management, WebSocket broadcasting, and job coordination via BullMQ queues.

## 🛠️ Tech Stack

- **Runtime:** Bun
- **Framework:** NestJS 11 (TypeScript)
- **Database ORM:** Drizzle ORM
- **Authentication:** Passport.js + JWT
- **Real-time:** Socket.IO
- **Queue:** BullMQ (via Redis)
- **AI Integration:** Google Gemini (GenAI)

## 📁 Project Structure

```text
backend/
├── src/
│   ├── auth/                          # JWT authentication logic
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── jwt-auth.guard.ts
│   │   └── jwt.strategy.ts
│   ├── drizzle/                       # Database provider and migrations
│   │   ├── drizzle.module.ts
│   │   └── drizzle.provider.ts
│   ├── matches/                       # Match lifecycle, WebSockets, and BullMQ tasks
│   │   ├── utils/
│   │   │   ├── archetype-generator.ts
│   │   │   └── format-time.ts
│   │   ├── archetype.service.ts
│   │   ├── cron.service.ts
│   │   ├── engine.service.ts
│   │   ├── follow.service.ts
│   │   ├── lifecycle.service.ts
│   │   ├── matches.controller.ts
│   │   ├── matches.gateway.ts         # Socket.IO event handlers
│   │   ├── matches.module.ts
│   │   ├── matches.processor.ts       # BullMQ job processing
│   │   ├── matches.service.ts
│   │   └── matches.types.ts
│   ├── players/                       # Player registry and archetype management
│   │   ├── players.controller.ts
│   │   ├── players.module.ts
│   │   └── players.service.ts
│   ├── redis/                         # Redis integration for transient state
│   │   ├── redis.module.ts
│   │   └── redis.service.ts
│   ├── user_analysis/                 # Logic for saving and sharing move trees
│   │   ├── user_analysis.controller.ts
│   │   ├── user_analysis.module.ts
│   │   └── user_analysis.service.ts
│   ├── app.controller.spec.ts         # App controller unit tests
│   ├── app.controller.ts
│   ├── app.module.ts                  # Root NestJS module
│   ├── app.service.ts
│   ├── main.ts                        # Application entry point
│   └── schema.ts                      # Central Drizzle ORM schema definition
├── drizzle.config.ts                  # Drizzle ORM configuration
├── drizzle.config.migrate.ts          # Migration-specific config
├── Dockerfile
├── Dockerfile.studio                  # Drizzle Studio Docker image
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- **Bun** (runtime and package manager)
- **PostgreSQL 17+**
- **Redis 7+**

### Installation

```bash
bun install
```

### Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
DATABASE_URL=postgresql://user:password@db:5432/chesscast
REDIS_HOST=redis
PORT=3000
JWT_SECRET=your-secret-key
GEMINI_KEY=your-google-gemini-api-key
```

### Database Migrations

```bash
# Generate a new migration (after schema changes)
bun run generate

# Run pending migrations
bun run migrate

# Open Drizzle Studio (database viewer on port 4983)
bun run studio
```

### Development

```bash
# Start development server (watch mode)
bun run start:dev

# Start with debug mode
bun run start:debug

# Build for production
bun run build

# Start production server
bun run start:prod
```

### Testing

```bash
# Run unit tests
bun run test

# Run e2e tests
bun run test:e2e

# Run tests with coverage
bun run test:cov

# Run tests in watch mode
bun run test:watch
```

### Code Quality

```bash
# Format code with Prettier
bun run format

# Run ESLint with auto-fix
bun run lint
```

## 📡 API Endpoints

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

## 🔌 WebSocket Events

The backend uses Socket.IO for real-time communication. Events follow a naming convention: **backend emits in `snake_case`**, frontend emits in `camelCase`.

### Client → Server

| Event | Description |
|---|---|
| `join_match` | Subscribe to a match |
| `sync_user_analysis` | Synchronize user's local move tree |
| `user_started_analysis` | Notify user entered analysis mode |

### Server → Client

| Event | Description |
|---|---|
| `new_move` | Broadcast a move being played |
| `viewer_count_update` | Update active viewer count |
| `analysis_update` | Sync analysis state for observers |
| `match_finished` | Simulation concluded |

## 🗃️ Database Schema

Key tables managed via Drizzle ORM:

| Table | Purpose |
|---|---|
| `users` | Core user data and credentials |
| `players` | Registry of historical chess players and their archetypes |
| `analysis` | Source of truth for a match (PGN, evaluations, times) |
| `matches` | Live state of a broadcast (references `analysis.id`) |
| `user_analysis` | JSONB representations of user-created move trees |

## 🐳 Docker

```bash
# Build the image
docker build -t chesscast-backend .

# Run the container
docker run -p 3000:3000 --env-file .env chesscast-backend
```

## 📚 Additional Resources

- [Root README](../README.md) — Project overview
- [DOCUMENTATION.md](../DOCUMENTATION.md) — Comprehensive technical documentation
- [NestJS Documentation](https://docs.nestjs.com/) — Official NestJS docs
- [Drizzle ORM](https://orm.drizzle.team/) — Drizzle ORM documentation
