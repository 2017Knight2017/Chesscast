# Technical Documentation: Chesscast Platform

## Table of Contents
1. [Architectural Overview](#1-architectural-overview)
2. [Project Structure](#2-project-structure)
3. [Backend API & WebSocket](#3-backend-api--websocket)
4. [Go Worker & Algorithms](#4-go-worker--algorithms)
5. [Frontend & State Management](#5-frontend--state-management)
6. [Data Schema (Drizzle ORM)](#6-data-schema-drizzle-orm)
7. [Deployment and Configuration](#7-deployment-and-configuration)

---

## 2. Project Structure

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
└── DOCUMENTATION.md        # Comprehensive technical documentation
```

---

## 3. Backend API & WebSocket

### 3.1 REST API Reference

#### Authentication (`/auth`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/auth/register` | POST | Registers a new user with email, username, and password. |
| `/auth/login` | POST | Validates credentials and returns a JWT. |
| `/auth/profile` | GET | Returns the current user's profile (Requires JWT). |

#### Match Management (`/matches`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/matches/create` | POST | Initiates a new broadcast. Accepts PGN, archetypes, and time control settings (Requires JWT). |
| `/matches/:id/report` | POST | Internal endpoint for Go worker to report simulation results (evaluations, times, notation). |
| `/matches/:id/start` | POST | Triggers the start of a match simulation. |
| `/matches/:id/state` | GET | Returns the current FEN, clocks, and move history of a match. |
| `/matches/:username/all` | GET | Lists all matches for a user, filtered by category (live, planned, finished) with pagination. |
| `/matches/:id` | DELETE | Deletes a match (Requires JWT, must be the owner). |
| `/matches/:id/follow` | POST | Follows a match (Requires JWT). |
| `/matches/:id/follow` | DELETE | Unfollows a match (Requires JWT). |
| `/matches/:id/follow/status` | GET | Returns follow status for the current user (Requires JWT). |
| `/matches/:userId/followed` | GET | Lists all broadcasts, followed by the user. |
| `/matches/live` | GET | Lists all currently active broadcasts. |
| `/matches/planned` | GET | Lists upcoming matches. |

#### Player Registry (`/players`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/players/search` | GET | Searches for players by name (minimum 2 characters). |

#### User Analysis (`/user-analysis`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/user-analysis/by-username/:username` | GET | Retrieves analysis sessions for a specific user by their username. |
| `/user-analysis/:matchId/:userId` | GET | Retrieves a specific analysis session by match and user ID. |
| `/user-analysis/save` | POST | Persistently saves a move tree branch created by a user (Requires JWT). |
| `/user-analysis/save-draft` | POST | Saves analysis state from Redis to the database (Requires JWT). |
| `/user-analysis/discard` | DELETE | Discards current analysis state from Redis (Requires JWT). |
| `/user-analysis/is-analyzing/:matchId/:userId` | GET | Checks if a user is currently analyzing a specific match. |

### 3.2 WebSocket Protocol (Socket.io)

The WebSocket gateway handles real-time bidirectional communication. Events use `snake_case` naming conventions.

#### Client-to-Server Events
*   `join_match`: Subscribes to a specific match ID. Payload: `{ matchId: string, username?: string, guestId?: string }`.
*   `sync_user_analysis`: Synchronizes a user's local move tree with the server. Payload: `{ matchId, userId, movesTree, currentPath }`.
*   `user_started_analysis`: Notifies that a user has entered analysis mode.
*   `broadcast_analysis_position`: Shares the current FEN of a user's analysis with followers.

#### Server-to-Client Events
*   `new_move`: Broadcasted when a move is played in a live match. Payload: `{ fen, move, evaluation, whiteTimeMs, blackTimeMs }`.
*   `viewer_count_update`: Updates the number of active viewers and analysts.
*   `analysis_update`: Synchronizes analysis state for users inspecting another player's board.
*   `match_finished`: Notifies that the simulation has reached its conclusion.

---

## 4. Go Worker & Algorithms

The Go Worker is responsible for transforming static PGN data into a dynamic real-time broadcast. Its core challenge is modeling "human-like" timing for moves.

### 4.1 Timing Simulation Logic
The worker uses a log-normal distribution to calculate the time taken for each move, influenced by several complexity factors derived from Stockfish analysis.

#### Complexity Formula
The move complexity $C$ is calculated as:
$$C = W_1 \cdot U + W_2 \cdot S + W_3 \cdot T$$
Where:
*   **$U$ (Uncertainty):** Derived from the evaluation delta between the top two engine moves ($1 - \tanh(K \cdot \Delta)$).
*   **$S$ (Sharpness):** Deviation of the top move from the average evaluation of the top three moves.
*   **$T$ (Tactics):** Ratio of captures and checks among all legal moves.

#### Move Time Calculation
The final time $T_{move}$ is determined by:
$$T_{move} = T_{base} \cdot C_{mult} \cdot P \cdot e^{(\mathcal{N}(0, \sigma))}$$
Where $P$ is the **Panic Factor**, which reduces move time when the clock is below 3 minutes and nearing a time control.

### 4.2 Archetypes Configuration
Archetypes define the "character" of a player. These parameters are stored in `archetypes.json`:
| Parameter | Description |
| :--- | :--- |
| `k` | Sensitivity to evaluation changes. |
| `weights` | $[W_1, W_2, W_3]$ weights for uncertainty, sharpness, and tactics. |
| `sigma` | Standard deviation for the log-normal jitter (randomness). |

### 4.3 UCI Engine Integration
The worker manages a long-lived Stockfish process using the UCI protocol. It utilizes `MultiPV 3` and a search depth of 16 to gather enough data for the complexity algorithms.

---

## 5. Frontend & State Management

### 5.1 Component Architecture
The frontend is built with a focus on reactivity and visual fidelity.

*   **Chessground Integration:** A highly optimized wrapper around the `chessground` library handles board rendering and move input.
*   **Live Broadcast Hook (`useBroadcast`):** Manages the subscription to match updates and synchronizes the local state with `new_move` events.
*   **Synchronized Clocks (`useChessClock`):** Implements a high-precision timer using `requestAnimationFrame` to interpolate clock time between server updates.

### 5.2 Analysis State & Move Tree
User analysis is managed through the `AnalysisProvider` using a recursive tree structure:

```typescript
interface MoveTreeNode {
    m: string;       // Move in SAN notation
    s?: MoveTreeNode[]; // Sub-variations (branches)
}
```

#### State Lifecycle:
1.  **Draft Mode:** Changes are saved to Redis every 30 seconds via `save-draft` action.
2.  **Real-time Sync:** Local changes are emitted via `syncUserAnalysis` to allow other users to "inspect" the analysis.
3.  **Persistence:** When the user clicks "Save", the tree is moved from Redis/Local state to the PostgreSQL `user_analysis` table.

---

## 6. Data Schema (Drizzle ORM)

### 6.1 Entity-Relationship Model
The schema is optimized for both transactional integrity and fast lookups for live matches.

*   **`users`**: Core user data and credentials.
*   **`players`**: Registry of historical chess players and their assigned archetypes.
*   **`analysis`**: Stores the "source of truth" for a match, including the original PGN and the full pre-calculated simulation data (evaluations, times).
*   **`matches`**: Represents the *live state* of a broadcast. References `analysis.id`.
*   **`user_analysis`**: Stores JSONB representations of move trees created by users.

### 6.2 Key Enumerations
*   `status`: `processing`, `waiting`, `in_progress`, `finished`.
*   `outcome`: `1/2-1/2`, `1-0`, `0-1`.

---

## 7. Deployment and Configuration

### 7.1 Containerization
The project is fully containerized using Docker.

*   **Backend:** Uses the `oven/bun` image for high-performance JS execution.
*   **Frontend:** Next.js application running in standalone mode.
*   **Worker:** Multi-stage build starting from `golang:alpine` and finishing with a `debian:slim` image that includes the `stockfish` binary.
*   **Nginx:** Acts as a reverse proxy, handling SSL termination (if configured) and routing `/api` and `/socket.io` traffic to the backend.

### 7.2 Environment Variables
| Variable | Service | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | Backend | PostgreSQL connection string. |
| `REDIS_URL` | Backend, Worker | Redis connection string. |
| `JWT_SECRET` | Backend | Secret key for signing authentication tokens. |
| `NEXT_PUBLIC_SOCKET_URL` | Frontend | Public URL for the Backend gateway. |
| `BACKEND_URL` | Worker | Internal URL for reporting simulation results. |

### 7.3 System Dependencies
*   **Bun:** Required for backend and frontend package management and execution.
*   **Stockfish 16+:** Must be available in the Worker's PATH.
*   **PostgreSQL 15+:** Supporting JSONB and Array types.
