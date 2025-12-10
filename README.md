# TypeRacer

A real-time multiplayer typing race game built with a microservices architecture. Race against friends to see who can type the fastest!

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Services](#services)
  - [Auth Service](#auth-service)
  - [Rooms Service](#rooms-service)
  - [Engine Service](#engine-service)
  - [Gateway Service](#gateway-service)
- [Clients](#clients)
  - [Web Client](#web-client)
  - [Terminal Client](#terminal-client)
  - [Mobile Client](#mobile-client)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [WebSocket Events](#websocket-events)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                    │
├──────────────────┬──────────────────┬───────────────────────────────┤
│   Web (React)    │ Terminal (Ink)   │     Mobile (Capacitor)        │
│   Port 5173      │                  │                               │
└────────┬─────────┴────────┬─────────┴───────────────┬───────────────┘
         │                  │                         │
         │ HTTP (Auth)      │ WebSocket               │ WebSocket
         ▼                  ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           SERVICES                                   │
├─────────────────┬─────────────────┬─────────────────┬───────────────┤
│  Gateway:3000   │   Auth:3001     │  Rooms:3002     │ Engine:3003   │
│  (API Proxy)    │   (REST API)    │  (WebSocket)    │ (WebSocket)   │
└─────────────────┴────────┬────────┴────────┬────────┴───────────────┘
                           │                 │
                           ▼                 ▼
                    ┌────────────┐    ┌────────────┐
                    │ PostgreSQL │    │  In-Memory │
                    │  (Prisma)  │    │   Storage  │
                    └────────────┘    └────────────┘
```

---

## Services

All backend services are located in the `/services` directory and can be run together using:

```bash
cd services
npm run dev
```

### Auth Service

**Port:** 3001  
**Type:** REST API  
**Location:** `/services/auth`

Handles user authentication and authorization.

#### Features

- User registration with password hashing (bcrypt)
- User login with credential validation
- JWT token generation for authenticated sessions

#### Tech Stack

- Express 5.x
- Prisma ORM with PostgreSQL
- JSON Web Tokens (JWT)
- bcrypt for password hashing

#### Database Schema

```prisma
model User {
  id       Int    @id @default(autoincrement())
  username String @unique
  password String
}
```

#### Endpoints

| Method | Endpoint           | Description       | Auth Required |
| ------ | ------------------ | ----------------- | ------------- |
| POST   | `/api/auth/signup` | Create new user   | No            |
| POST   | `/api/auth/login`  | Authenticate user | No            |

---

### Rooms Service

**Port:** 3002  
**Type:** WebSocket (Socket.IO)  
**Location:** `/services/rooms`

Manages game room lifecycle and player coordination.

#### Features

- Room creation with configurable max players
- Room joining/leaving with automatic host reassignment
- Race countdown and start coordination
- Real-time room state broadcasting
- Communication bridge to Engine service

#### Tech Stack

- Express + HTTP Server
- Socket.IO (server and client)
- JWT authentication middleware

#### Room States

| State         | Description                   |
| ------------- | ----------------------------- |
| `waiting`     | Room open for players to join |
| `countdown`   | Race countdown in progress    |
| `in-progress` | Race is active                |
| `finished`    | Race completed                |

---

### Engine Service

**Port:** 3003  
**Type:** WebSocket (Socket.IO)  
**Location:** `/services/engine`

Core game logic engine that manages race sessions.

#### Features

- Race session creation with random text selection
- Real-time player progress tracking
- WPM (Words Per Minute) and accuracy calculations
- Race completion detection
- Results calculation and ranking

#### Tech Stack

- Express + HTTP Server
- Socket.IO
- In-memory race session storage

#### Race Session Data

```typescript
interface RaceSession {
	roomId: string;
	text: string;
	startedAt: number;
	status: "waiting" | "active" | "finished";
	players: Map<
		userId,
		{
			userId: number;
			username: string;
			progress: number; // 0-100%
			wpm: number;
			accuracy: number; // 0-100%
			finished: boolean;
			finishedAt?: number;
		}
	>;
}
```

---

### Gateway Service

**Port:** 3000  
**Type:** HTTP Proxy  
**Location:** `/services/gateway`

API Gateway that routes requests to appropriate services.

#### Features

- Request proxying to backend services
- JWT-protected route handling
- Request logging (Morgan)
- Authorization header forwarding

#### Route Configuration

| Route              | Target Service | Protected |
| ------------------ | -------------- | --------- |
| `/api/auth/login`  | Auth (3001)    | No        |
| `/api/auth/signup` | Auth (3001)    | No        |

---

## Clients

### Web Client

**Location:** `/clients/typeracerWeb`  
**Dev Server:** Port 5173

The primary web interface for TypeRacer.

#### Features

- User authentication (login/signup)
- Real-time room listing and management
- Live typing race with visual feedback
- Color-coded character display (green=correct, red=error, gray=pending)
- Real-time WPM, accuracy, and progress tracking
- Player progress bars showing all racers
- Race results with rankings

#### Tech Stack

- React 19.x with TypeScript
- Vite 7.x (build tool)
- Tailwind CSS 4.x
- Socket.IO Client
- React Router DOM
- Axios (HTTP client)

#### State Management

- **AuthContext**: Manages user authentication state (token, user info)
- **GameContext**: Manages game state (sockets, rooms, race data)

#### Running the Web Client

```bash
cd clients/typeracerWeb
npm install
npm run dev
```

---

### Terminal Client

**Location:** `/clients/terminal`

A command-line interface for TypeRacer, perfect for terminal enthusiasts.

#### Features

- Menu-driven authentication
- Room browsing and creation
- Full typing race functionality
- Keyboard-based navigation

#### Tech Stack

- Ink (React for CLI)
- ink-text-input
- ink-gradient & ink-big-text (styling)
- Socket.IO Client

#### Running the Terminal Client

```bash
cd clients/terminal
npm install
npm run build
node dist/cli.js
```

#### Controls

| Screen    | Key     | Action                 |
| --------- | ------- | ---------------------- |
| Auth Menu | `1`     | Login                  |
| Auth Menu | `2`     | Sign Up                |
| Auth Menu | `q`     | Quit                   |
| Auth Form | `Tab`   | Switch between fields  |
| Auth Form | `Enter` | Submit                 |
| Auth Form | `Esc`   | Back to menu           |
| Room List | `↑↓`    | Navigate rooms         |
| Room List | `Enter` | Join/Create room       |
| Room List | `r`     | Refresh list           |
| Race      | `s`     | Start race (host only) |
| Race      | `Esc`   | Leave room             |

---

### Mobile Client

**Location:** `/clients/mobile`

Android mobile application built with Capacitor.

#### Features

- Native Android wrapper around the web client
- Same functionality as web client
- Optimized for touch input

#### Tech Stack

- Capacitor 8.x
- React 19.x (same as web client)
- Android SDK

#### Building for Android

```bash
cd clients/mobile
npm install
npm run build
npx cap sync android
npx cap open android
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Environment Setup

1. **Auth Service** (`/services/auth/.env`)

```env
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/typeracer"
JWT_SECRET="your-secret-key"
```

2. **Gateway Service** (`/services/gateway/.env`)

```env
PORT=3000
JWT_SECRET="your-secret-key"
```

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd Typeracer
```

2. Install service dependencies

```bash
cd services
npm install
cd auth && npm install && npx prisma generate && npx prisma migrate dev
cd ../rooms && npm install
cd ../engine && npm install
cd ../gateway && npm install
```

3. Install client dependencies

```bash
cd clients/typeracerWeb && npm install
```

4. Start all services

```bash
cd services
npm run dev
```

5. Start the web client (in a new terminal)

```bash
cd clients/typeracerWeb
npm run dev
```

6. Open http://localhost:5173 in your browser

---

## API Reference

### Authentication Endpoints

#### POST `/api/auth/signup`

Create a new user account.

**Request Body:**

```json
{
	"username": "string",
	"password": "string"
}
```

**Response:**

```json
{
	"token": "jwt-token-string"
}
```

#### POST `/api/auth/login`

Authenticate an existing user.

**Request Body:**

```json
{
	"username": "string",
	"password": "string"
}
```

**Response:**

```json
{
	"token": "jwt-token-string"
}
```

---

## WebSocket Events

### Rooms Service (Port 3002)

#### Client → Server

| Event            | Payload                   | Description              |
| ---------------- | ------------------------- | ------------------------ |
| `create_room`    | `{ maxPlayers?: number }` | Create a new room        |
| `join_room`      | `{ roomId: string }`      | Join an existing room    |
| `leave_room`     | `{ roomId: string }`      | Leave current room       |
| `start_race`     | `{ roomId: string }`      | Start the race (host)    |
| `get_rooms`      | -                         | Get available rooms list |
| `get_room_state` | `{ roomId: string }`      | Get specific room state  |

#### Server → Client

| Event             | Payload                               | Description                |
| ----------------- | ------------------------------------- | -------------------------- |
| `room_state`      | `{ id, status, players, maxPlayers }` | Room state update          |
| `player_joined`   | `{ userId, username, socketId }`      | Player joined notification |
| `player_left`     | `{ userId, username, socketId }`      | Player left notification   |
| `countdown_start` | `{ seconds: number }`                 | Race countdown started     |
| `countdown_tick`  | `{ secondsLeft: number }`             | Countdown tick             |
| `race_start`      | `{ startedAt: number }`               | Race has begun             |
| `race_text`       | `{ text: string }`                    | Text to type               |

### Engine Service (Port 3003)

#### Client → Server

| Event             | Payload                                       | Description            |
| ----------------- | --------------------------------------------- | ---------------------- |
| `join_race`       | `{ roomId: string }`                          | Join race session      |
| `update_progress` | `{ roomId, userId, progress, wpm, accuracy }` | Update player progress |
| `get_race_state`  | `{ roomId: string }`                          | Get current race state |
| `get_results`     | `{ roomId: string }`                          | Get race results       |

#### Server → Client

| Event             | Payload                                           | Description          |
| ----------------- | ------------------------------------------------- | -------------------- |
| `race_started`    | `{ roomId, text, startedAt }`                     | Race session created |
| `race_state`      | `{ roomId, status, players[] }`                   | Race state update    |
| `player_finished` | `{ userId, username, wpm, accuracy, finishedAt }` | Player finished race |
| `race_finished`   | `{ results[] }`                                   | All players finished |

---

## Game Flow

```
1. User Sign Up/Login
   └─► Auth Service issues JWT token

2. Connect to Rooms Service
   └─► JWT validated via middleware

3. Browse/Create/Join Room
   └─► Room state broadcasted to all members

4. Host Starts Race
   └─► Countdown begins (3 seconds default)
   └─► Rooms Service notifies Engine Service

5. Race Begins
   └─► Engine creates session with random text
   └─► Text sent to all players

6. Players Type
   └─► Progress updates sent to Engine
   └─► Real-time stats (WPM, accuracy) calculated
   └─► Progress broadcasted to all players

7. Race Ends
   └─► Player clicks "Finish Race" button
   └─► When all players finish, results calculated
   └─► Rankings displayed to all players
```

---

## License

ISC

## Author

Samson Kikoma
