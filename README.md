# CivicTrack — City Service Request Portal

A full-stack web application that allows citizens to submit and track municipal service requests, with real-time status notifications powered by an event-driven pub/sub architecture.

Built as a portfolio project targeting IBM Consulting's Application Developer role — demonstrating production-grade patterns used in Canadian government technology systems.

---

## Live Demo

🌐 **[https://civictrack-client.vercel.app](https://civictrack-client.vercel.app)**

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Admin   | admin@civictrack.ca    | admin123    |
| Citizen | sneha@civic.com        | Sneha@123   |

---

## Features

**Citizen**
- Register and log in securely
- Submit service requests by category (pothole, permit, noise, other)
- Track request status in real time
- Receive in-app notifications when an admin updates their request

**Admin**
- View all citizen requests with filters by status
- Update request status with optional notes
- Dashboard with summary statistics
- Role-protected routes — citizens cannot access admin actions

---

## Screenshots

### Login Page
![Login](docs/screenshots/screenshot-login.png)

### Citizen Dashboard
![Citizen Dashboard](docs/screenshots/screenshot-citizen.png)

### Submit a Request
![Submit Request](docs/screenshots/screenshot-submit.png)

### Admin Dashboard
![Admin Dashboard](docs/screenshots/screenshot-admin.png)

### Status Update
![Status Update](docs/screenshots/screenshot-modal.png)

---

## Architecture

```
React (TypeScript)
     ↓ HTTP + JWT
Express API (Node.js + TypeScript)
     ↓
PostgreSQL ←→ EventBus (pub/sub)
                  ↓
          Notification Listener
                  ↓
            notifications table
```

### Event-Driven Notification System

When an admin updates a request status, the route publishes a `status.updated` event via Node's `EventEmitter`. A separate listener subscribes to this event and writes a notification to the database — without the request route ever touching the notifications table directly.

This is **loose coupling** in practice. Adding a new side effect (email, SMS, audit log) means adding a new listener — the core route stays untouched.

In production this would use **Redis Pub/Sub** or **RabbitMQ** to support multiple server instances.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + TypeScript | IBM's required stack |
| Styling | CSS custom properties | No framework dependency |
| HTTP client | Axios | Interceptors for JWT injection |
| Backend | Node.js + Express + TypeScript | Industry standard |
| Auth | JWT + bcryptjs | Stateless, scalable |
| Database | PostgreSQL | Enterprise-grade, used on real government projects |
| Event system | Node EventEmitter (pub/sub) | Decoupled architecture |
| Testing | Jest + ts-jest | Unit tests for all core logic |
| CI/CD | GitHub Actions | Tests run on every push |

---

## Project Structure

```
civictrack/
├── server/
│   ├── src/
│   │   ├── routes/           # auth, requests, notifications, admin
│   │   ├── middleware/        # JWT authenticate, requireRole
│   │   ├── events/           # eventBus.ts, notificationListener.ts
│   │   ├── db/               # PostgreSQL pool + initDb
│   │   └── types/            # Shared TypeScript interfaces
│   └── __tests__/            # Jest unit tests
├── client/
│   └── src/
│       ├── pages/            # LoginPage, CitizenDashboard, AdminDashboard
│       ├── components/       # Navbar with notification bell
│       ├── context/          # AuthContext (JWT session management)
│       ├── hooks/            # useNotifications (polling)
│       ├── api/              # Axios instance + all API calls
│       └── types/            # Shared TypeScript types
└── .github/
    └── workflows/
        └── ci.yml            # GitHub Actions CI
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16+

### 1. Clone the repository
```bash
git clone https://github.com/SnehaGit-web/civictrack.git
cd civictrack
```

### 2. Set up the database
```bash
psql -U postgres
CREATE DATABASE civictrack;
\q
```

### 3. Configure environment variables
```bash
cd server
cp .env.example .env
```

Edit `.env` with your PostgreSQL password:
```
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-here
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/civictrack
CLIENT_URL=http://localhost:5173
```

### 4. Start the server
```bash
cd server
npm install
npm run dev
```

The server will automatically create all database tables on first run.

### 5. Start the frontend
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Running Tests

```bash
cd server
npm test
```

```
PASS __tests__/eventBus.test.ts
PASS __tests__/auth.test.ts
PASS __tests__/notificationListener.test.ts

Test Suites: 3 passed, 3 total
Tests:       14 passed, 14 total
```

Tests cover:
- Event bus publish/subscribe behaviour
- JWT token generation and middleware
- Notification listener with mocked database
- Role-based access control

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new citizen |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Auth | Get current user |

### Service Requests
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/requests` | Auth | Citizen: own requests. Admin: all |
| POST | `/api/requests` | Citizen | Submit new request |
| GET | `/api/requests/:id` | Auth | Get single request |
| PATCH | `/api/requests/:id/status` | Admin | Update status — triggers pub/sub |

### Notifications
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/notifications` | Citizen | Get all notifications |
| PATCH | `/api/notifications/read-all` | Citizen | Mark all as read |

### Admin
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/stats` | Admin | Dashboard statistics |
| GET | `/api/admin/users` | Admin | List all users |

---

## Key Technical Decisions

**Why JWT over sessions?**
JWT is stateless — no server-side session storage needed. This means the API scales horizontally without sticky sessions, which matters for government systems that run on multiple servers.

**Why EventEmitter over direct DB calls?**
The request route and notification system are fully decoupled. The route does not know or care that a notification will be created — it just fires an event. This makes the system easier to extend and test independently.

**Why PostgreSQL over MongoDB?**
Government data has clear relational structure — citizens own requests, requests have notifications. Relational integrity (foreign keys, constraints) prevents orphaned records. PostgreSQL also supports UUIDs natively and is the standard in IBM's government client engagements.

**Why separate app.ts from index.ts?**
`app.ts` exports the Express app without starting the server. This makes integration testing possible without binding to a port, and is a standard pattern in production Node.js applications.

---

## CI/CD

GitHub Actions runs the full test suite on every push to `main`:

- Spins up a real PostgreSQL 16 instance
- Installs dependencies
- Runs all 14 Jest tests
- Fails the build if any test fails

---

## Security Practices

- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens expire after 24 hours
- Role-based access enforced server-side — not just in the UI
- Environment variables never committed to Git
- SQL queries use parameterised statements — no string concatenation

---

## Author

Sneha — Full Stack Developer
GitHub: [SnehaGit-web](https://github.com/SnehaGit-web)
