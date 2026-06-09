# Project Tracker

A local-first project tracker & reminder dashboard. No cloud, no accounts, no vendor lock-in — you own everything.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- **SQLite** via Prisma (single file database, no cloud)
- **react-markdown** for notes rendering

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create the database and apply schema
npx prisma db push

# 3. Generate the Prisma client
npx prisma generate

# 4. Seed example projects (optional)
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Folder Structure

```
project-tracker/
├── prisma/
│   ├── schema.prisma      # Data model (Project, Task, ActivityLog)
│   ├── seed.ts             # Seed script with example projects
│   └── dev.db              # SQLite database file (gitignored)
├── src/
│   ├── app/
│   │   ├── api/projects/   # REST API routes (CRUD)
│   │   ├── project/[id]/   # Project detail page
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Dashboard (home page)
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   ├── CreateProjectModal.tsx
│   │   ├── Filters.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── RemindersPanel.tsx
│   │   └── SummaryStrip.tsx
│   ├── generated/prisma/   # Auto-generated Prisma client
│   └── lib/
│       ├── constants.ts    # Types, status/priority config
│       ├── db.ts           # Prisma client singleton
│       └── helpers.ts      # Date/tag/progress utilities
├── .gitattributes          # GitHub language override
├── prisma.config.ts        # Prisma v7 configuration
└── package.json
```

## Features

- **Dashboard** — Card grid with status badges, progress bars, priority indicators
- **Filters & Sort** — Filter by status, priority, tag; sort by due date, priority, or last updated
- **Summary Strip** — At-a-glance counts: total, in progress, blocked, due soon
- **Reminders Panel** — Overdue (red) and due-within-7-days (amber) warnings
- **Browser Notifications** — Notification API alerts for items due today
- **Project Detail** — Edit all fields, manage tasks, markdown notes with preview
- **Activity Log** — Tracks status changes, task completions, and progress updates
- **Auto-calc Progress** — Suggested % from completed tasks (manually overridable)

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:seed` | Seed database with example projects |
| `npm run db:reset` | Reset database and re-seed |

## Data

Your data lives in `prisma/dev.db` — a single SQLite file. Back it up, copy it, inspect it with any SQLite tool. No cloud involved.
