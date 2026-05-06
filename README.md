# EduHealth Nexus

MERN stack platform combining education (courses, assignments, quizzes, attendance, parent progress) and healthcare (appointments, health records) with JWT auth, role-based dashboards, notifications, Cloudinary-ready uploads, and Socket.io messaging.

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Quick start

1. **MongoDB** — start `mongod` or use Atlas and set `MONGODB_URI`.

2. **Server**

   ```bash
   cd server
   cp .env.example .env
   # edit .env — set JWT_SECRET and MONGODB_URI
   npm run seed
   npm run dev
   ```

   API: `http://localhost:5000` (health: `GET /api/health`).

3. **Client**

   ```bash
   cd client
   npm run dev
   ```

   Open `http://localhost:5173`. The Vite dev server proxies `/api` and `/socket.io` to port 5000.

## Demo accounts (after `npm run seed`)

| Email                 | Role    | Password     |
| --------------------- | ------- | ------------ |
| admin@eduhealth.test  | admin   | password123 |
| teacher@eduhealth.test | teacher | password123 |
| student@eduhealth.test | student | password123 |
| parent@eduhealth.test | parent  | password123 |
| doctor@eduhealth.test | doctor  | password123 |

## API overview

| Area        | Examples |
| ----------- | -------- |
| Auth        | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Users       | `GET /api/users/profile`, `PATCH /api/users/profile`, `GET /api/users/doctors` |
| Courses     | `GET /api/courses`, `GET /api/courses/discover`, `POST /api/courses`, `POST /api/courses/:id/enroll` |
| Assignments | `GET /api/assignments`, `POST /api/assignments`, `POST /api/assignments/:id/submit` |
| Quizzes     | `GET /api/quizzes`, `POST /api/quizzes`, `POST /api/quizzes/:id/attempt` |
| Parent      | `GET /api/parent/children`, `POST /api/parent/link-child`, `GET /api/parent/student-progress/:studentId` |
| Health      | `GET /api/health-records`, `POST /api/health-records` (doctor/admin) |
| Appointments | `GET /api/appointments`, `POST /api/appointments` |
| Dashboard   | `GET /api/dashboard/me` (role-specific payload) |
| Admin       | `GET /api/admin/stats` |
| Upload      | `POST /api/upload` (multipart `file`; requires Cloudinary env vars) |

## Optional: Cloudinary

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Without them, `POST /api/upload` returns a clear message; you can still paste media URLs when creating materials via API or future UI.

## Production

- Set `CLIENT_URL` to the deployed SPA origin for CORS and Socket.io.
- Build the client: `cd client && npm run build` and serve `client/dist` behind the same host or configure `VITE_API_URL` for a separate API domain.
