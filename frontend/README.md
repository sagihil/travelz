# TravelZ – Frontend

A React.js frontend for the TravelZ travel-exploration platform.
Built with Vite, React Router v6, and Axios.
Connects to an Express.js REST API backend.

---

## URLs

| Service  | URL                         |
|----------|-----------------------------|
| Frontend | http://localhost:5173       |
| Backend  | http://localhost:3000       |
| API base | http://localhost:3000/api   |

All frontend API calls use **http://localhost:3000/api** as the base URL.
This is configured in `src/services/api.js` via `axios.create({ baseURL: '...' })`.

---

## Installation & Running

### Prerequisites
- Node.js ≥ 18
- Backend must be running on port 3000 before opening the frontend

### Step 1 – Start the backend (from project root)
```bash
node backend/server.js
```

### Step 2 – Install and start the frontend
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Demo Accounts

Credentials are validated against the backend. Each account has an exact password.
Arbitrary passwords are **not** accepted.

These credentials are for testing only and are **not** displayed inside the
running application UI.

| Email                          | Password     | Role    |
|-------------------------------|--------------|---------|
| hila.sagi@travelz.com          | Admin@123    | admin   |
| chen.birnfeld@travelz.com      | Admin@789    | admin   |
| noa.levi@travelz.com           | Manager@1    | manager |
| maya.katz@travelz.com          | Manager@2    | manager |
| daniel.cohen@travelz.com       | Daniel@456   | user    |
| yossi.mizrahi@travelz.com      | User@456     | user    |
| omer.bendavid@travelz.com      | User@789     | user    |

---

## API Endpoints Used

All calls target `http://localhost:3000/api`.

| Method | Endpoint                  | Used by                              | Auth required |
|--------|---------------------------|--------------------------------------|---------------|
| POST   | /api/auth/login           | authService – login                  | No            |
| POST   | /api/auth/logout          | authService – logout                 | Yes (Bearer)  |
| GET    | /api/users/me             | authService – getCurrentUser         | Yes (Bearer)  |
| GET    | /api/users                | Dashboard – users table              | Yes (Bearer)  |
| POST   | /api/users                | Dashboard – create user (admin)      | Yes (Bearer)  |
| PUT    | /api/users/:id            | Dashboard – edit user (admin/manager)| Yes (Bearer)  |
| DELETE | /api/users/:id            | Dashboard – delete user (admin)      | Yes (Bearer)  |
| GET    | /api/attractions          | Dashboard – attractions table        | No            |
| POST   | /api/attractions          | Dashboard – create attraction        | Yes (Bearer)  |
| PUT    | /api/attractions/:id      | Dashboard – edit attraction          | Yes (Bearer)  |
| DELETE | /api/attractions/:id      | Dashboard – delete attraction        | Yes (Bearer)  |
| GET    | /api/settings             | settingsService – getSettings        | Yes (Bearer)  |
| PUT    | /api/settings             | settingsService – updateSettings     | Yes (Bearer)  |

### Authentication flow
1. `POST /api/auth/login` → backend returns `{ token, user }`
2. Frontend stores `token` in `localStorage` (`travelz_auth` key)
3. `src/services/api.js` interceptor reads the token before every request and adds:
   `Authorization: Bearer <token>`
4. Backend `authMiddleware` verifies the token on every protected route
5. `POST /api/auth/logout` → backend deletes the token from its in-memory session store

### Data persistence note
All data (users, attractions, sessions, settings) is stored **in memory only**.
Restarting the backend resets everything to the original hardcoded values.

---

## Project Structure

```
frontend/
├── index.html
├── vite.config.js              # Vite config, port 5173
├── package.json
│
└── src/
    ├── index.css               # CSS variables (light + dark theme), global reset
    ├── main.jsx                # createRoot entry point
    ├── App.jsx                 # Router, route definitions, theme init on load
    │
    ├── utils/
    │   └── permissions.js      # RBAC matrix – can(), getPermissions(), PERMISSION_LABELS
    │
    ├── services/               # All API communication lives here
    │   ├── api.js              # Axios instance – baseURL + Bearer token interceptor
    │   ├── authService.js      # login / logout / getCurrentUser / isAuthenticated
    │   ├── settingsService.js  # getSettings / updateSettings / applyTheme
    │   ├── attractionsService.js      # getAllAttractions / create / update / delete
    │   └── usersManagementService.js  # getAllUsers / create / update / delete
    │
    ├── routes/
    │   └── ProtectedRoute.jsx  # Redirects to /login when not authenticated
    │
    ├── components/
    │   ├── Navbar/             # Top nav – user name, role badge, logout button
    │   ├── Footer/             # Bottom footer – brand, team, slogan, year
    │   ├── Card/               # Generic card (stat variant + attraction variant)
    │   ├── DataTable/          # Dynamic table driven by columns + data props
    │   └── Modal/              # Generic dialog overlay for create/edit forms
    │
    └── pages/
        ├── Login/              # Public – email + exact-password login form
        ├── Dashboard/          # Protected – role-adaptive cards, tables, CRUD modals
        └── Settings/           # Protected – edit name, email, theme; saved via backend
```

---

## Pages & Routes

| Route        | Access    | Description                                                        |
|--------------|-----------|--------------------------------------------------------------------|
| `/login`     | Public    | Login form with validation; exact credentials required             |
| `/dashboard` | Protected | Stat cards, Role Overview, management tables, featured attractions |
| `/settings`  | Protected | Edit first name, last name, email, theme; saved via backend        |
| `/`          | —         | Redirects to `/dashboard` (or `/login` if not authenticated)       |

---

## Role-Based UI

The Dashboard adapts its content to the logged-in user's role.

| Feature                    | Admin | Manager | User |
|----------------------------|-------|---------|------|
| Registered Users stat card | ✅    | ✅      | ❌   |
| Top Rated Attraction card  | ❌    | ❌      | ✅   |
| Users Management table     | ✅    | ✅      | ❌   |
| Create User button         | ✅    | ❌      | ❌   |
| Edit User button           | ✅    | ✅      | ❌   |
| Delete User button         | ✅    | ❌      | ❌   |
| Attractions table          | ✅    | ✅      | ✅   |
| Create Attraction button   | ✅    | ✅      | ✅   |
| Edit Attraction button     | ✅    | ✅      | ❌   |
| Delete Attraction button   | ✅    | ❌      | ❌   |

**Regular users** never see the users list — it is neither fetched from the backend
nor rendered in the UI.

**Overview section** always shows exactly 3 stat cards:
- Admin / Manager: Total Attractions · Countries Covered · Registered Users
- Regular user:    Total Attractions · Countries Covered · Top Rated Attraction

---

## Settings Page

All authenticated users can update their own profile:

| Field       | Validation                                              |
|-------------|--------------------------------------------------------|
| First Name  | Required. Letters, spaces, and hyphens only.           |
| Last Name   | Required. Letters, spaces, and hyphens only.           |
| Email       | Required. Must match `user@domain.tld` format.         |
| Theme       | Light or Dark. Applied instantly; saved to backend.    |

Validation runs on blur (when leaving a field) and again on submit.
The PUT request is only sent after all fields pass validation.

---

## Testing Instructions

1. Start the backend: `node backend/server.js` (from project root)
2. Start the frontend: `npm run dev` (inside `/frontend`)
3. Open http://localhost:5173

**Admin test** (`hila.sagi@travelz.com` / `Admin@123`):
4. Verify the Dashboard shows stat cards including "Registered Users"
5. Confirm the Users Management table is visible with Edit + Delete buttons
6. Confirm the Attractions table has Create, Edit, and Delete buttons
7. Create a new attraction via the modal form and confirm it appears in the table
8. Edit an existing user and confirm the table updates

**Manager test** (`noa.levi@travelz.com` / `Manager@1`):
9. Confirm the Users Management table is visible with Edit-only buttons (no Delete, no Create)
10. Confirm the Attractions table has Create and Edit buttons (no Delete)

**Regular user test** (`daniel.cohen@travelz.com` / `Daniel@456`):
11. Confirm the Users Management section is **not visible**
12. Confirm the "Registered Users" stat card is **not visible**
13. Confirm the "Top Rated Attraction" stat card **is visible**
14. Confirm the Attractions table is visible with a Create button only
15. Navigate to Settings – change your first name and click **Save Changes**
16. Confirm the Navbar shows the updated name immediately

**General tests**:
17. Click **Logout** – confirm redirect to `/login` on the first click (not the second)
18. Navigate directly to `/dashboard` while logged out – confirm redirect to `/login`
19. Try logging in with a wrong password – confirm "Invalid email or password" error
20. Confirm the Login page shows no demo account credentials

---

## Team

**Team TravelZ** – BGU University, Internet Development Environments Course
