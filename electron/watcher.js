const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

const SCAN_INTERVAL = 30_000; // 30 seconds
let scanTimer = null;
let apiPort = 3000;

function postToApi(projectId, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: "localhost",
        port: apiPort,
        path: `/api/projects/${projectId}/scan`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve(body));
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function exec(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: "utf8", timeout: 5000 }).trim();
  } catch {
    return "";
  }
}

function isGitRepo(dir) {
  return fs.existsSync(path.join(dir, ".git"));
}

function scanGitRepo(dir, lastScanned) {
  const events = [];
  const sinceDate = lastScanned
    ? new Date(lastScanned).toISOString()
    : new Date(Date.now() - SCAN_INTERVAL * 2).toISOString();

  // New commits since last scan
  const log = exec(
    `git log --since="${sinceDate}" --pretty=format:"%h|%s|%an" --no-merges`,
    dir
  );
  if (log) {
    for (const line of log.split("\n")) {
      const [hash, message, author] = line.split("|");
      if (hash && message) {
        events.push({
          action: `Commit ${hash}: ${message}${author ? ` (${author})` : ""}`,
        });
      }
    }
  }

  // New branches since last scan
  const branches = exec("git branch --sort=-committerdate --format='%(refname:short)'", dir);
  const branchList = branches ? branches.split("\n").map((b) => b.trim()).filter(Boolean) : [];

  // Count TODOs/FIXMEs
  const todoCount = exec(
    'grep -rn "TODO\\|FIXME\\|HACK\\|XXX" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" --include="*.go" --include="*.rs" --include="*.css" --include="*.html" . 2>/dev/null | grep -v node_modules | grep -v .next | wc -l',
    dir
  );

  // Changed files (uncommitted)
  const status = exec("git status --porcelain", dir);
  const changedFiles = status ? status.split("\n").filter(Boolean).length : 0;

  // Total commits count for rough progress
  const totalCommits = parseInt(exec("git rev-list --count HEAD 2>/dev/null", dir)) || 0;

  return {
    events,
    todoCount: parseInt(todoCount) || 0,
    changedFiles,
    totalCommits,
    branches: branchList.length,
    currentBranch: exec("git rev-parse --abbrev-ref HEAD", dir),
  };
}

function scanFolder(dir, lastScanned) {
  const events = [];
  const sinceTime = lastScanned
    ? new Date(lastScanned).getTime()
    : Date.now() - SCAN_INTERVAL * 2;

  let newFiles = 0;
  let modifiedFiles = 0;
  let totalFiles = 0;

  function walk(folder, depth) {
    if (depth > 4) return;
    let entries;
    try {
      entries = fs.readdirSync(folder, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const name = entry.name;
      if (
        name.startsWith(".") ||
        name === "node_modules" ||
        name === ".next" ||
        name === "dist" ||
        name === "build" ||
        name === "__pycache__"
      )
        continue;

      const fullPath = path.join(folder, name);
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
      } else {
        totalFiles++;
        try {
          const stat = fs.statSync(fullPath);
          if (stat.mtimeMs > sinceTime) {
            modifiedFiles++;
          }
          if (stat.birthtimeMs > sinceTime) {
            newFiles++;
          }
        } catch {}
      }
    }
  }

  walk(dir, 0);

  if (newFiles > 0) {
    events.push({ action: `${newFiles} new file${newFiles > 1 ? "s" : ""} detected` });
  }
  if (modifiedFiles > 0) {
    events.push({
      action: `${modifiedFiles} file${modifiedFiles > 1 ? "s" : ""} modified`,
    });
  }

  return { events, totalFiles, newFiles, modifiedFiles };
}

async function scanProject(project) {
  const dir = project.directory;
  if (!dir || !fs.existsSync(dir)) return;

  const isGit = isGitRepo(dir);
  let events = [];
  let scanData = {};

  if (isGit) {
    const result = scanGitRepo(dir, project.lastScannedAt);
    events = result.events;
    scanData = result;
  } else {
    const result = scanFolder(dir, project.lastScannedAt);
    events = result.events;
    scanData = result;
  }

  if (events.length === 0) return;

  // Auto-detect status changes
  let status;
  if (isGit && scanData.changedFiles > 0) {
    if (project.status === "Planning") status = "In Progress";
  }

  try {
    await postToApi(project.id, { events, status });
  } catch (err) {
    console.error(`Watcher: failed to post scan for ${project.name}:`, err.message);
  }
}

async function runScan() {
  try {
    const res = await new Promise((resolve, reject) => {
      const req = http.get(
        `http://localhost:${apiPort}/api/projects`,
        (res) => {
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve([]);
            }
          });
        }
      );
      req.on("error", reject);
      req.setTimeout(5000, () => req.destroy());
    });

    const projects = Array.isArray(res) ? res : [];
    for (const project of projects) {
      if (project.directory && !project.archived) {
        await scanProject(project);
      }
    }
  } catch (err) {
    // Server not ready or unreachable — skip this cycle
  }
}

function start(port) {
  apiPort = port;
  console.log("Watcher: starting directory scanner");
  // First scan after a short delay
  setTimeout(runScan, 5000);
  scanTimer = setInterval(runScan, SCAN_INTERVAL);
}

function stop() {
  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = null;
  }
}

module.exports = { start, stop };
