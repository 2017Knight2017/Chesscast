# Go Worker — Chess Simulation Engine

The Go worker is a high-performance chess engine analysis and move simulation service. It consumes jobs from a BullMQ queue (via Redis), analyzes positions using Stockfish, and calculates realistic move times based on player archetypes and position complexity.

## 🛠️ Tech Stack

- **Language:** Go 1.25
- **Chess Engine:** Stockfish 16+ (UCI protocol)
- **Chess Logic:** github.com/notnil/chess
- **Queue Consumer:** BullMQ (via Redis)
- **HTTP Client:** Net/http (for reporting results to backend)

## 📁 Project Structure

```text
worker_go/
├── main.go              # Redis/BullMQ task consumer and job dispatcher
├── worker.go            # UCI engine handler, complexity algorithms, and game processing
├── worker_test.go       # Integration tests
├── archetypes.json      # Player simulation parameters (K, weights, sigma)
├── .env                 # Environment variables (not tracked by git)
├── .env.example         # Environment variables template
├── .gitignore
├── Dockerfile           # Multi-stage build with Stockfish
├── go.mod               # Go module definition
├── go.sum               # Dependency checksums
└── README.md            # This file
```

## 🧠 Simulation Logic

### Complexity Formula

The worker calculates move time complexity using three factors:

```
C = W1 * U + W2 * S + W3 * T
```

| Factor | Name | Description |
|---|---|---|
| **U** | Uncertainty | Derived from evaluation delta between top two engine moves |
| **S** | Sharpness | Deviation of the top move from the average of top three moves |
| **T** | Tactics | Ratio of captures and checks among all legal moves |

### Move Time Calculation

Final move time is computed as:

```
T_move = T_base * C_mult * P * e^(N(0, σ))
```

Where:
- **T_base** — Base time (derived from remaining clock and moves to control)
- **C_mult** — Complexity multiplier (computed from U, S, T)
- **P** — Panic Factor (reduces move time when clock < 3 min and nearing time control)
- **σ** — Sigma (archetype-specific standard deviation for log-normal distribution)

### Player Archetypes

Each archetype defines simulation parameters:

```json
{
  "archetype_name": {
    "k": 1.0,          // Scaling factor for uncertainty
    "weights": [1, 1, 1], // Weights for [U, S, T]
    "sigma": 0.5       // Standard deviation for log-normal distribution
  }
}
```

## 🚀 Getting Started

### Prerequisites

- **Go 1.25+**
- **Stockfish 16+** (expected at `/usr/games/stockfish`)
- **Redis** (for BullMQ queue)
- **Backend service** running (for job dispatch and result reporting)

### Installation

```bash
cd worker_go
go mod download
```

### Environment Variables

Create a `.env` file in the `worker_go/` directory:

```env
BACKEND_URL=http://backend:3000
REDIS_URL=redis://redis:6379
```

### Running the Worker

```bash
# Run the worker (Stockfish must be at /usr/games/stockfish)
go run main.go worker.go

# Run tests
go test -v
```

## 🐳 Docker

The worker uses a multi-stage Docker build that includes Stockfish:

```dockerfile
# Stage 1: Build the Go binary
FROM golang:1.25-alpine AS builder
# ...

# Stage 2: Runtime with Stockfish
FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y stockfish
# ...
```

### Build and Run

```bash
# Build the image
docker build -t chesscast-worker .

# Run the container
docker run --env-file .env chesscast-worker
```

## 📡 Communication with Backend

### Consuming Jobs

The worker polls a BullMQ wait queue in Redis:

```
bull:analysis:wait
```

When a job is available, it:
1. Fetches job data from Redis hash (`bull:analysis:<job_id>`)
2. Parses the job payload (match ID, PGN, time control, archetypes)
3. Processes the game move-by-move
4. Reports results to the backend via HTTP POST

### Reporting Results

After processing, the worker sends analysis results to:

```
POST {BACKEND_URL}/matches/{matchID}/report
```

Payload:

```json
{
  "evaluations": [10, 25, -5, ...],
  "timeRemaining": [600000, 598500, ...],
  "notation": ["e4", "e5", "Nf3", ...],
  "outcome": "1-0"
}
```

## 🧪 Testing

```bash
# Run integration tests (requires backend and Redis)
go test -v

# Run a single test
go test -v -run TestProcessGame
```

## 📚 Additional Resources

- [Root README](../README.md) — Project overview
- [DOCUMENTATION.md](../DOCUMENTATION.md) — Comprehensive technical documentation
- [notnil/chess](https://github.com/notnil/chess) — Go chess library
- [Stockfish](https://stockfishchess.org/) — Open-source chess engine
