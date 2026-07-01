# SkillSwap

> A peer-to-peer student skill exchange platform with real-time chat.

Students list skills they have and skills they want, get matched with compatible peers, send exchange requests, and communicate in real time to coordinate learning sessions.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (React)                        │
│  React Router · TanStack Query · Zustand · Socket.IO client  │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST / WebSocket
┌───────────────────────────▼─────────────────────────────────┐
│                     Server (Express + TS)                     │
│                                                               │
│  Route → Controller → Service → Repository → Model           │
│                                                               │
│  Socket.IO ─────── Redis Adapter (horizontal scale)          │
└──────────┬───────────────────────────────────┬──────────────┘
           │                                   │
    ┌──────▼──────┐                    ┌───────▼──────┐
    │   MongoDB   │                    │    Redis     │
    │  (Mongoose) │                    │  Sessions    │
    │   Atlas     │                    │  Presence    │
    └─────────────┘                    │  Rate limit  │
                                       └──────────────┘
```

### Layered Backend
- **Route**: Express routers — maps HTTP verbs to controller methods
- **Controller**: HTTP-only — parse input, call service, set status/response
- **Service**: Business logic — matching rules, state machines, auth flows
- **Repository**: All Mongoose queries isolated here — zero DB calls in services
- **Model**: Mongoose schemas + indexes

### Key Patterns
| Pattern | Where | Why |
|---|---|---|
| Repository | All DB access | Unit-testable without DB; swap data layer in one file |
| Strategy | Matching algorithm | Swap SkillOverlap for ML ranking without touching controllers |
| Event-driven | Request accepted → create conversation | Decouples side effects |
| Centralized error handler | Single Express middleware | Consistent `{ success, error }` shape everywhere |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| State | TanStack Query + Zustand |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB (Mongoose) |
| Cache / Presence | Redis (ioredis) |
| Real-time | Socket.IO + Redis adapter |
| Auth | JWT (short-lived access + rotating refresh) + bcrypt |
| Validation | Zod (shared schemas) |
| Logging | Pino (structured JSON) |
| Testing | Vitest (unit/integration) + Playwright (E2E) |
| CI | GitHub Actions |

---

## Prerequisites

- Node.js 20+
- MongoDB 7 (local or Atlas)
- Redis 7 (local, Docker, or Upstash)

### Quick start with Docker (recommended for local Redis + Mongo)
```bash
docker run -d -p 27017:27017 --name mongo mongo:7
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

---

## Setup

### 1. Clone and navigate
```bash
git clone <repo-url>
cd skillswap
```

### 2. Server setup
```bash
cd server
cp .env.example .env
# Edit .env with your values (see Environment Variables below)
npm install
npm run dev
```

### 3. Client setup
```bash
cd client
npm install
npm run dev
```

### 4. E2E setup (optional)
```bash
cd e2e
npm install
npx playwright install chromium
```

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development` / `production` / `test` |
| `PORT` | Yes | Server port (default: 5000) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `REDIS_URL` | Yes | Redis connection URL |
| `JWT_ACCESS_SECRET` | Yes | ≥16 chars — sign access tokens |
| `JWT_REFRESH_SECRET` | Yes | ≥16 chars — sign refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | Yes | e.g. `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Yes | e.g. `7d` |
| `CLIENT_URL` | Yes | Frontend URL for CORS (e.g. `http://localhost:5173`) |
| `CLOUDINARY_CLOUD_NAME` | No | For avatar uploads (local disk fallback if omitted) |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window (default: 900000 = 15min) |
| `RATE_LIMIT_MAX` | No | Max requests per window (default: 100) |
| `AUTH_RATE_LIMIT_MAX` | No | Max auth requests per window (default: 10) |

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Running Tests

### Unit tests (server service-layer logic)
```bash
cd server
npm test
```

### Watch mode
```bash
npm run test:watch
```

### Coverage report
```bash
npm run test:coverage
```

### E2E tests (requires both server + client running)
```bash
cd e2e
npx playwright test
# Or with browser UI:
npx playwright test --headed
```

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |
| POST | `/api/auth/logout` | Bearer | Logout + revoke token |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/me` | Bearer | Get own profile |
| PUT | `/api/users/me` | Bearer | Update profile |
| POST | `/api/users/me/avatar` | Bearer | Upload avatar |
| GET | `/api/users/matches` | Bearer | Get match suggestions |
| GET | `/api/users/search?skill=` | Optional | Search by skill |
| GET | `/api/users/:id` | Optional | Public profile |

### Exchange Requests
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/requests` | Bearer | Send exchange request |
| GET | `/api/requests/incoming` | Bearer | Incoming requests |
| GET | `/api/requests/outgoing` | Bearer | Outgoing requests |
| PATCH | `/api/requests/:id/accept` | Bearer | Accept (recipient only) |
| PATCH | `/api/requests/:id/reject` | Bearer | Reject (recipient only) |

### Conversations
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/conversations` | Bearer | List conversations |
| GET | `/api/conversations/:id/messages` | Bearer | Paginated chat history |
| POST | `/api/conversations/:id/messages` | Bearer | Send message (REST fallback) |

### Health
```
GET /api/health
→ { status: "healthy"|"degraded", services: { database, redis } }
```

---

## Socket.IO Events

| Event | Direction | Payload |
|---|---|---|
| `join_conversation` | Client → Server | `{ conversationId }` |
| `send_message` | Client → Server | `{ conversationId, content, tempId }` |
| `receive_message` | Server → Client | Full message object + `tempId` |
| `typing` | Client → Server | `{ conversationId }` |
| `stop_typing` | Client → Server | `{ conversationId }` |
| `typing` | Server → Client | `{ userId }` |
| `stop_typing` | Server → Client | `{ userId }` |
| `mark_read` | Client → Server | `{ conversationId }` |
| `messages_read` | Server → Client | `{ userId, conversationId }` |
| `request_backfill` | Client → Server | `{ conversationId, lastSeenMessageId }` |
| `backfill_messages` | Server → Client | `{ conversationId, messages[] }` |
| `user_online` | Server → Client | `{ userId }` |
| `user_offline` | Server → Client | `{ userId }` |

---

## Deployment

### Frontend → Vercel
1. Connect GitHub repo
2. Set root directory to `client`
3. Add env var: `VITE_API_URL`, `VITE_SOCKET_URL`

### Backend → Render / Railway
1. Set root directory to `server`
2. Build command: `npm run build`
3. Start command: `node dist/index.js`
4. Add all env vars from the table above

### Database → MongoDB Atlas
- Free tier M0 works for development
- Use the Atlas connection string as `MONGODB_URI`

### Cache → Upstash Redis
- Free tier works for development
- Use the Upstash Redis URL as `REDIS_URL`

---

## Future Enhancements (Architecture Ready)

- **ML-based matching**: Swap `SkillOverlapStrategy` for an ML implementation of the `MatchingStrategy` interface — zero controller changes needed
- **Video conferencing**: Socket.IO rooms already exist; add WebRTC signalling events alongside chat events
- **Learning analytics**: Add a `Session` model + analytics events; the event-driven architecture makes it a listener addition

---

## License

MIT
