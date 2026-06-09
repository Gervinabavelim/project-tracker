import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();

  // Project 1: In Progress, due soon
  const dueIn3Days = new Date();
  dueIn3Days.setDate(dueIn3Days.getDate() + 3);

  const p1 = await prisma.project.create({
    data: {
      name: "Portfolio Redesign",
      description: "Complete overhaul of the personal portfolio site with new branding and projects showcase.",
      status: "In Progress",
      priority: "High",
      progress: 45,
      dueDate: dueIn3Days,
      tags: "personal,frontend",
      notes: "## Design Notes\n\n- Using **dark theme** with accent colors\n- Mobile-first approach\n- Include project case studies\n\n### Tech Stack\n- Next.js + Tailwind\n- Framer Motion for animations",
      tasks: {
        create: [
          { text: "Finalize color palette and typography", completed: true, order: 0 },
          { text: "Design hero section mockup", completed: true, order: 1 },
          { text: "Build responsive navigation", completed: false, order: 2 },
          { text: "Create projects grid component", completed: false, order: 3 },
          { text: "Add contact form with validation", completed: false, order: 4 },
          { text: "Deploy to production", completed: false, order: 5 },
        ],
      },
      activities: {
        create: [
          { action: "Project created", createdAt: new Date(Date.now() - 7 * 86400000) },
          { action: "Status changed from Planning to In Progress", createdAt: new Date(Date.now() - 5 * 86400000) },
          { action: 'Task completed: "Finalize color palette and typography"', createdAt: new Date(Date.now() - 3 * 86400000) },
          { action: 'Task completed: "Design hero section mockup"', createdAt: new Date(Date.now() - 1 * 86400000) },
          { action: "Progress updated from 20% to 45%", createdAt: new Date(Date.now() - 1 * 86400000) },
        ],
      },
    },
  });

  // Project 2: Blocked, overdue
  const overdue = new Date();
  overdue.setDate(overdue.getDate() - 2);

  const p2 = await prisma.project.create({
    data: {
      name: "TKFS API Integration",
      description: "Integrate the third-party TKFS service API for data syncing and reporting.",
      status: "Blocked",
      priority: "High",
      progress: 30,
      dueDate: overdue,
      tags: "TKFS,client work,backend",
      notes: "## Blockers\n\n- Waiting on API credentials from the TKFS team\n- Need clarification on rate limits\n\n## Completed\n- [x] API spec review\n- [x] Auth module skeleton",
      tasks: {
        create: [
          { text: "Review API documentation", completed: true, order: 0 },
          { text: "Implement OAuth2 authentication", completed: true, order: 1 },
          { text: "Build data sync endpoint", completed: false, order: 2 },
          { text: "Add error handling and retries", completed: false, order: 3 },
          { text: "Write integration tests", completed: false, order: 4 },
        ],
      },
      activities: {
        create: [
          { action: "Project created", createdAt: new Date(Date.now() - 14 * 86400000) },
          { action: "Status changed from Planning to In Progress", createdAt: new Date(Date.now() - 10 * 86400000) },
          { action: "Status changed from In Progress to Blocked", createdAt: new Date(Date.now() - 3 * 86400000) },
          { action: "Progress updated from 10% to 30%", createdAt: new Date(Date.now() - 4 * 86400000) },
        ],
      },
    },
  });

  // Project 3: Planning, no due date
  const p3 = await prisma.project.create({
    data: {
      name: "Habit Tracker Mobile App",
      description: "A React Native app for tracking daily habits with streaks and analytics.",
      status: "Planning",
      priority: "Medium",
      progress: 0,
      tags: "personal,mobile",
      notes: "## Ideas\n\n- Daily check-in with swipe gestures\n- Weekly/monthly streak view\n- Export data as CSV\n- Push notification reminders",
      tasks: {
        create: [
          { text: "Research React Native vs Flutter", completed: false, order: 0 },
          { text: "Wireframe main screens", completed: false, order: 1 },
          { text: "Set up project boilerplate", completed: false, order: 2 },
        ],
      },
      activities: {
        create: [
          { action: "Project created", createdAt: new Date(Date.now() - 2 * 86400000) },
        ],
      },
    },
  });

  console.log(`Seeded 3 projects: ${p1.name}, ${p2.name}, ${p3.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
