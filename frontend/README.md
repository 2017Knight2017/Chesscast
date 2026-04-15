# Frontend — Next.js Application

The frontend is a modern, server-rendered React application built with Next.js 16 and React 19. It provides an interactive interface for watching live chess broadcasts, analyzing games, and managing user profiles.

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **Chess Rendering:** Chessground
- **Real-time:** Socket.IO Client
- **State Management:** React Context + Custom Hooks
- **Language:** TypeScript

## 📁 Project Structure

```text
frontend/
├── actions/                         # Server Actions for data mutations
│   ├── analysis_actions.ts
│   └── match_actions.ts
├── app/                             # Next.js App Router
│   ├── about/                       # About page
│   │   └── page.tsx
│   ├── all-matches/                 # List of all matches
│   │   └── page.tsx
│   ├── login/                       # Login page
│   │   └── page.tsx
│   ├── member/                      # User profile pages
│   │   └── [username]/
│   │       ├── matches/
│   │       │   ├── loading.tsx
│   │       │   └── page.tsx
│   │       ├── loading.tsx
│   │       └── page.tsx
│   ├── new/                         # Create new match
│   │   ├── archetype_dropdown.tsx
│   │   ├── match_button.tsx
│   │   ├── page.tsx
│   │   └── player_input.tsx
│   ├── register/                    # Registration page
│   │   └── page.tsx
│   ├── watch/                       # Watch live/planned matches
│   │   └── [id]/
│   │       ├── back_to_live_button.tsx
│   │       ├── chess_board.tsx
│   │       ├── mobile_bottom_panel.tsx
│   │       ├── move_list.tsx
│   │       ├── move_node.tsx
│   │       ├── move_sound_player.tsx
│   │       ├── page.tsx
│   │       ├── paraboard_list.tsx
│   │       ├── spectator_list.tsx
│   │       ├── user_analysis_board.tsx
│   │       └── watch_match_client.tsx
│   ├── layout.tsx                   # Root layout component
│   ├── page.tsx                     # Home page
│   ├── favicon.ico
│   └── globals.css                  # Global styles
├── components/                      # Shared React components
│   ├── burger_menu.tsx
│   ├── chess_preview.tsx
│   ├── eval_bar.tsx
│   ├── exit_button.tsx
│   ├── live_card.tsx
│   ├── live_matches_list.tsx
│   ├── login_form.tsx
│   ├── pagination.tsx
│   └── providers.tsx
├── context/                         # React Context providers
│   ├── analysis_context.tsx         # Analysis state context
│   └── socket_context.tsx           # Socket.IO connection context
├── hooks/                           # Custom React hooks
│   ├── use_analysis_sync.ts
│   ├── use_auth.tsx
│   ├── use_broadcast.ts
│   ├── use_chess_clocks.ts
│   ├── use_follow_match.ts
│   ├── use_guest_id.ts
│   ├── use_keyboard_navigation.ts
│   ├── use_processing.ts
│   └── use_viewer_counts.ts
├── types/                           # TypeScript type definitions
│   ├── chessjs-esm.d.ts
│   └── types.ts
├── public/                          # Static assets
├── .dockerignore
├── .gitignore
├── bun.lock
├── Dockerfile
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── proxy.ts
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- **Bun** (runtime and package manager)
- **Backend service** running (for API and WebSocket)

### Installation

```bash
bun install
```

### Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEST_API_URL=http://localhost:3001
WATCHPACK_POLLING=true
```

### Development

```bash
# Start development server with hot reload
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Run ESLint
bun run lint
```

## 📄 Pages

| Route | Description |
|---|---|
| `/` | Home page — landing page with featured matches |
| `/login` | User login form |
| `/register` | User registration form |
| `/new` | Create a new match (upload PGN, set time control) |
| `/watch/[id]` | Watch a live or planned match broadcast |
| `/all-matches` | Browse all matches (live, finished, planned) |
| `/member/[username]` | User profile page with match history |
| `/about` | About the platform |

## 🔌 Real-Time Communication

The frontend connects to the backend via **Socket.IO** for real-time updates:

```typescript
// Example: Connecting to a match
import { useSocket } from '@/context/socket';

const { socket } = useSocket();
socket.emit('join_match', matchId);

socket.on('new_move', (data) => {
  // Update board with new move
});
```

### WebSocket Events

The frontend emits events in **`camelCase`** (backend uses `snake_case`):

| Event (Client → Server) | Description |
|---|---|
| `joinMatch` | Subscribe to a match |
| `syncUserAnalysis` | Synchronize user's local move tree |
| `userStartedAnalysis` | Notify user entered analysis mode |

| Event (Server → Client) | Description |
|---|---|
| `newMove` | A move has been played |
| `viewerCountUpdate` | Active viewer count changed |
| `analysisUpdate` | Analysis state synced |
| `matchFinished` | Simulation completed |

## ♟️ Chess Components

- **Chessground** — Interactive chess board for displaying positions and making moves
- **chess.js** — Chess game logic for move validation and PGN parsing

## 🐳 Docker

```bash
# Build the image
docker build -t chesscast-frontend .

# Run the container
docker run -p 3000:3000 --env-file .env.local chesscast-frontend
```

## 📚 Additional Resources

- [Root README](../README.md) — Project overview
- [Next.js Documentation](https://nextjs.org/docs) — Official Next.js docs
- [React Documentation](https://react.dev/) — Official React docs
- [Chessground](https://github.com/ornicar/chessground) — Chess rendering library
