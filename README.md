# TravelZ — Full Stack Travel Planning Application

A full-stack trip planning app that lets users create trips, add attractions, plan day-by-day itineraries, and get AI-powered travel recommendations.

---

## Project Purpose

TravelZ is a travel planning platform where users can:
- Browse and manage tourist attractions
- Create personal trips and build itineraries
- Get real-time notifications when trips or attractions are updated
- Chat with an AI Travel Agent that recommends attractions and builds their itinerary automatically

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router, Axios, Socket.IO client |
| Backend | Node.js, Express.js |
| Database | MySQL 8 |
| ORM | Sequelize 6 |
| Real-time | Socket.IO 4 |
| AI | OpenAI / Google Gemini / Groq (configurable) |

---

## Project Structure

```
travelz/
├── frontend/
│   └── src/
│       ├── components/      React components
│       ├── pages/           Page-level components (Dashboard, Trips, etc.)
│       ├── services/        API clients (api.js, tripsService.js, aiService.js, socketService.js)
│       └── App.jsx
│
└── backend/
    ├── src/                 Node.js + Express source code
    │   ├── server.js        Entry point
    │   ├── socket.js        Socket.IO module (online user registry)
    │   ├── controllers/     Route handler logic
    │   ├── routes/          Express routers
    │   ├── middleware/       Auth (JWT) and logging middleware
    │   ├── config/          Database connection + Sequelize config
    │   ├── services/        AI provider abstraction (aiService.js)
    │   └── seeders/         Database seed scripts
    │
    ├── models/              Sequelize ORM model definitions
    │   ├── User.js
    │   ├── Admin.js
    │   ├── Trip.js
    │   ├── Attraction.js
    │   ├── Interest.js
    │   ├── TripAttraction.js    (junction: Trip ↔ Attraction)
    │   ├── UserInterest.js      (junction: User ↔ Interest)
    │   └── associations.js      Defines all ORM relationships
    │
    ├── migrations/          Sequelize migration files (schema history)
    ├── .env.example         Required environment variables template
    └── package.json
```

---

## Installation

### Prerequisites
- Node.js 18+
- MySQL 8 running locally

### 1. Clone / unzip the project

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Install frontend dependencies
```bash
cd frontend
npm install
```

---

## Database Setup

### 1. Create the database in MySQL
```sql
CREATE DATABASE travelz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Copy and fill in environment variables
```bash
cd backend
cp .env.example .env
# Edit .env — set DB_PASSWORD, JWT_SECRET, and AI_API_KEY
```

### 3. Run migrations (creates all tables)
```bash
cd backend
npm run db:migrate
```

### 4. Seed the database (optional — adds sample users, attractions, trips)
```bash
cd backend
npm run db:seed
```

---

## Environment Variables

Create `backend/.env` using `backend/.env.example` as the template.

| Variable | Required | Description |
|---|---|---|
| `DB_HOST` | Yes | MySQL host (default: `localhost`) |
| `DB_USER` | Yes | MySQL username (default: `root`) |
| `DB_PASSWORD` | Yes | MySQL password |
| `DB_NAME` | Yes | Database name (default: `travelz`) |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens |
| `AI_PROVIDER` | Yes | AI provider: `openai`, `gemini`, or `groq` |
| `AI_API_KEY` | Yes | API key for your chosen AI provider |
| `AI_MODEL` | No | Override the default model |

---

## ORM Setup — Sequelize

### Models

| Model | Table | Description |
|---|---|---|
| `User` | `users` | All users (role: user / manager / admin) |
| `Admin` | `users` | Filtered view of users where role = admin |
| `Trip` | `trips` | User travel plans |
| `Attraction` | `attractions` | Tourist attractions with location data |
| `Interest` | `interests` | Interest categories (e.g. History, Beach) |
| `TripAttraction` | `trip_attractions` | Junction: trips ↔ attractions (with day/order/notes) |
| `UserInterest` | `user_interests` | Junction: users ↔ interests |

### ORM Relationships

**One-to-Many:**
```
User → Trip   (one user has many trips)
```

**Many-to-Many:**
```
User ↔ Interest    through UserInterest
Trip ↔ Attraction  through TripAttraction
```

---

## Running the Application

### Start the backend
```bash
cd backend
npm start
# Runs on http://localhost:3000
```

### Start the frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

---

## API Endpoints

All responses follow the standard format:
```json
{ "success": true, "data": {}, "error": null }

{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login, returns JWT token |
| POST | `/api/auth/logout` | Logout |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users` | Admin | Get all users |
| GET | `/api/users/me` | Any | Get current user profile |
| POST | `/api/users` | Public | Register new user |
| PUT | `/api/users/:id` | Owner/Admin | Update user |
| DELETE | `/api/users/:id` | Admin | Delete user |

### Attractions
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/attractions` | Any | Get all attractions |
| GET | `/api/attractions/:id` | Any | Get attraction by ID |
| POST | `/api/attractions` | Auth | Create attraction |
| PUT | `/api/attractions/:id` | Manager/Admin | Update attraction |
| DELETE | `/api/attractions/:id` | Admin | Delete attraction |

### Trips
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/trips` | Auth | Get trips (own for user, all for manager/admin) |
| GET | `/api/trips/:id` | Auth | Get trip by ID |
| POST | `/api/trips` | Auth | Create trip |
| PUT | `/api/trips/:id` | Owner/Admin | Update trip |
| DELETE | `/api/trips/:id` | Owner/Admin | Delete trip |
| GET | `/api/trips/:id/attractions` | Auth | Get attractions in trip |
| POST | `/api/trips/:id/attractions` | Owner/Admin | Add attraction to trip |
| DELETE | `/api/trips/:id/attractions/:attrId` | Owner/Admin | Remove attraction from trip |

### Interests
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/interests` | Auth | Get all interests |
| GET | `/api/interests/me` | Auth | Get current user's interests |
| POST | `/api/interests/me` | Auth | Add an interest to current user |
| PUT | `/api/interests/me` | Auth | Replace all current user's interests |
| DELETE | `/api/interests/me/:interestId` | Auth | Remove an interest from current user |

### AI
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/travel-agent` | Auth | Chat with AI travel agent |

### Online Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/online-users` | Admin | Get currently online users |

---

## WebSocket Feature — Real-Time Notifications

### How It Works

The frontend connects to the backend via Socket.IO on page load. When a user logs in they announce their presence, and the server tracks who is online per tab.

### Custom Events (7 total — all beyond connect/disconnect)

| Event | Direction | Description |
|---|---|---|
| `user:join` | Client → Server | User announces their identity after connecting |
| `user:joined` | Server → All | Broadcast when any user connects |
| `user:left` | Server → All | Broadcast when any user disconnects |
| `onlineUsersUpdated` | Server → All | Sends updated online user count + list |
| `trip_created` | Server → All | Broadcast when a new trip is created |
| `trip_updated` | Server → All | Broadcast when a trip is updated |
| `attraction_added` | Server → All | Broadcast when an attraction is added to a trip |

### Multi-Client Demonstration

1. Open the app in two different browser tabs
2. Log in with different accounts in each tab
3. The Notifications panel (bell icon) in both tabs will show:
   - Who joined / left
   - How many users are online
   - Any trip or attraction changes made in either tab

### Online Users

Admins can see a live list of online users on the Dashboard. The count deduplicates users with multiple tabs — a user with 3 tabs open counts as 1.

---

## AI Feature — AI Travel Agent

### What It Does

The AI Travel Agent is a chat interface inside each trip's detail page. The user describes where they want to go and what they like, and the AI:
1. Recommends attractions from the real database (filtered by destination)
2. Automatically adds them to the trip with day assignments
3. Can remove or reschedule attractions on request
4. Personalizes recommendations based on the user's listed interests

### How It Works (Backend)

1. User sends a message via `POST /api/ai/travel-agent`
2. Backend loads the trip, user interests, and all DB attractions
3. Backend filters attractions to only those matching the trip's destinations
4. A structured prompt is sent to the AI with full context
5. The AI returns JSON with a message + list of actions (ADD/REMOVE/UPDATE)
6. Backend validates and applies each action to the database
7. Response is returned to the frontend

### API Key Security

The AI API key lives only in `backend/.env` and is never sent to the frontend. The frontend only calls `/api/ai/travel-agent` with a JWT — the backend makes the actual call to OpenAI/Gemini.

### Supported AI Providers

Set `AI_PROVIDER` in your `.env` file:
- `openai` — uses `gpt-4o-mini` by default
- `gemini` — uses `gemini-2.0-flash` by default
- `groq` — uses the Groq API (OpenAI-compatible)

---

## Known Limitations

- The decorative world map uses approximate city coordinates — not GPS-precise
- The AI agent requires a valid `AI_API_KEY` in `.env`; without it all AI requests return an error
- No email verification for new user registration
- Session is stored in browser `sessionStorage` — closing the tab logs you out

---

## Seeded Test Accounts

After running `npm run db:seed`:

| Email | Password | Role |
|---|---|---|
| hila.sagi@travelz.com | Admin@123 | admin |
| noa.levi@travelz.com | Manager@1 | manager |
| daniel.cohen@travelz.com | Daniel@456 | user |
| yossi.mizrahi@travelz.com | User@456 | user |
