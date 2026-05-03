# ProjectFlow 🚀

A full-stack team project management app built with Next.js 14, MongoDB, and JWT auth.

## Features

- 🔐 JWT auth with HTTP-only cookies (signup/login)
- 👥 Role-based access: **Admin** and **Member**
- 📁 Project management (create, delete, manage members)
- ✅ Task management with Kanban board (Todo / In Progress / Done)
- 📊 Dashboard with task stats
- 📱 Fully responsive sidebar layout

---

## Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Frontend   | Next.js 14 (App Router) + TypeScript |
| Styling    | Tailwind CSS                  |
| Backend    | Next.js API Routes            |
| Database   | MongoDB + Mongoose            |
| Auth       | JWT + bcrypt + HTTP-only cookies |
| Validation | Zod                           |
| Deployment | Railway                       |

---

## Local Setup

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd projectflow
npm install
```

### 2. Configure Environment

MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/projectflow
JWT_SECRET=your-super-long-random-secret-min-32-chars
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

> **MongoDB Atlas**: Create a free cluster at https://cloud.mongodb.com, then get your connection string.

### 3. Run Development Server

```bash
npm run dev
```

App runs at http://localhost:3000

---

## Folder Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/         # signup, login, logout, me
│   │   ├── projects/     # CRUD + members
│   │   ├── tasks/        # CRUD
│   │   └── users/        # list users
│   ├── auth/             # Login/Signup page
│   └── dashboard/        # Protected pages
│       ├── page.tsx      # Dashboard home
│       ├── projects/     # Projects list + detail
│       └── tasks/        # My tasks
├── components/
│   ├── layout/           # Sidebar
│   ├── providers/        # AuthProvider (context)
│   ├── projects/         # Project modals
│   └── tasks/            # Task card + modal
├── lib/
│   ├── db.ts             # MongoDB connection
│   ├── jwt.ts            # Token signing/verifying
│   └── auth.ts           # Auth middleware helpers
├── models/
│   ├── User.ts
│   ├── Project.ts
│   └── Task.ts
└── types/
    └── index.ts
```

---

## API Reference

### Auth
| Method | Endpoint          | Description      |
|--------|-------------------|------------------|
| POST   | /api/auth/signup  | Register user    |
| POST   | /api/auth/login   | Login user       |
| POST   | /api/auth/logout  | Logout user      |
| GET    | /api/auth/me      | Get current user |

### Projects
| Method | Endpoint                      | Description         |
|--------|-------------------------------|---------------------|
| GET    | /api/projects                 | List projects       |
| POST   | /api/projects                 | Create project      |
| GET    | /api/projects/:id             | Get project details |
| DELETE | /api/projects/:id             | Delete project      |
| POST   | /api/projects/:id/members     | Add member          |
| DELETE | /api/projects/:id/members     | Remove member       |

### Tasks
| Method | Endpoint       | Description       |
|--------|----------------|-------------------|
| GET    | /api/tasks     | List tasks        |
| POST   | /api/tasks     | Create task       |
| PATCH  | /api/tasks/:id | Update task       |
| DELETE | /api/tasks/:id | Delete task       |

---

## Role Guide

| Feature                | Admin | Member |
|------------------------|-------|--------|
| Create project         | ✅    | ❌     |
| Delete project         | ✅    | ❌     |
| Add/remove members     | ✅    | ❌     |
| Create tasks           | ✅    | ❌     |
| Assign tasks           | ✅    | ❌     |
| Update task status     | ✅    | ✅     |
| View assigned projects | ✅    | ✅     |

---

## License

MIT
