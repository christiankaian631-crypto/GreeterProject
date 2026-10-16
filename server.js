// server.ts
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// types.ts
var AUTHORIZED_PIC = [
  // GLOBAL ACCESS
  { name: "CHRISTIAN KAIAN", pin: "011425", role: "Restaurant Manager" /* MANAGER */, title: "Restaurant Manager", allowedOutlet: "ALL" },
  // SH THE BARN
  { name: "AINI SULASTRI", pin: "1324", role: "Restaurant Captain" /* CAPTAIN */, title: "Restaurant Captain", allowedOutlet: "SH THE BARN" },
  { name: "RAJU MUHAMMAD", pin: "1233", role: "Restaurant Captain" /* CAPTAIN */, title: "Restaurant Captain", allowedOutlet: "SH THE BARN" },
  { name: "NIRMALA SARI", pin: "1245", role: "Greeter" /* GREETER */, title: "Senior Greeter", allowedOutlet: "SH THE BARN" },
  { name: "KESIA ANGGRAINI", pin: "1123", role: "Greeter" /* GREETER */, title: "Greeter", allowedOutlet: "SH THE BARN" },
  { name: "RUMHAYATI", pin: "1423", role: "Greeter" /* GREETER */, title: "Greeter", allowedOutlet: "SH THE BARN" },
  // SH BINTARO
  { name: "REYHAN ADITYA", pin: "4234", role: "Restaurant Captain" /* CAPTAIN */, title: "Restaurant Captain", allowedOutlet: "SH BINTARO" },
  { name: "TENDI HERMAWAN", pin: "4231", role: "Restaurant Captain" /* CAPTAIN */, title: "Restaurant Captain", allowedOutlet: "SH BINTARO" },
  { name: "ANGGUN PERMATA", pin: "4524", role: "Greeter" /* GREETER */, title: "Greeter", allowedOutlet: "SH BINTARO" },
  { name: "TALIA SYIFA", pin: "4325", role: "Greeter" /* GREETER */, title: "Greeter", allowedOutlet: "SH BINTARO" },
  // SH ALSUT
  { name: "DIAZ PRADANA", pin: "5432", role: "Restaurant Captain" /* CAPTAIN */, title: "Restaurant Captain", allowedOutlet: "SH ALSUT" },
  { name: "YOGA PRATAMA", pin: "5321", role: "Restaurant Captain" /* CAPTAIN */, title: "Restaurant Captain", allowedOutlet: "SH ALSUT" },
  { name: "ANARYAH", pin: "5123", role: "Greeter" /* GREETER */, title: "Greeter", allowedOutlet: "SH ALSUT" },
  { name: "SALSABILA", pin: "5234", role: "Greeter" /* GREETER */, title: "Greeter", allowedOutlet: "SH ALSUT" },
  // SH CIPETE
  { name: "RONY SETIAWAN", pin: "3112", role: "Restaurant Captain" /* CAPTAIN */, title: "Restaurant Captain", allowedOutlet: "SH CIPETE" },
  { name: "ANDRY LUKMAN", pin: "3521", role: "Restaurant Captain" /* CAPTAIN */, title: "Restaurant Captain", allowedOutlet: "SH CIPETE" },
  { name: "ANGGUN PRATIWI", pin: "3312", role: "Greeter" /* GREETER */, title: "Greeter", allowedOutlet: "SH CIPETE" },
  { name: "RESTA AMALIA", pin: "3422", role: "Greeter" /* GREETER */, title: "Greeter", allowedOutlet: "SH CIPETE" },
  // SH KEMANG
  { name: "RUDI TABUTI", pin: "6112", role: "Supervisor" /* SUPERVISOR */, title: "Restaurant Supervisor", allowedOutlet: "SH KEMANG" },
  { name: "NIKEN AYU", pin: "6214", role: "Restaurant Captain" /* CAPTAIN */, title: "Restaurant Captain", allowedOutlet: "SH KEMANG" },
  { name: "AMELIA CITRA", pin: "6221", role: "Greeter" /* GREETER */, title: "Greeter", allowedOutlet: "SH KEMANG" },
  { name: "RISA ADELIA", pin: "6321", role: "Greeter" /* GREETER */, title: "Greeter", allowedOutlet: "SH KEMANG" },
  // SH LB BULUS
  { name: "FINDY", pin: "7322", role: "Restaurant Captain" /* CAPTAIN */, title: "Restaurant Captain", allowedOutlet: "SH LB BULUS" },
  { name: "SELLY", pin: "7234", role: "Greeter" /* GREETER */, title: "Greeter", allowedOutlet: "SH LB BULUS" },
  { name: "MONIC", pin: "7122", role: "Greeter" /* GREETER */, title: "Greeter", allowedOutlet: "SH LB BULUS" },
  // SH PASKAL
  { name: "ARI H", pin: "3344", role: "Supervisor" /* SUPERVISOR */, title: "Restaurant Supervisor", allowedOutlet: "SH PASKAL" },
  { name: "M RAHIAN", pin: "4455", role: "Restaurant Captain" /* CAPTAIN */, title: "Restaurant Captain", allowedOutlet: "SH PASKAL" },
  { name: "RAHMA N", pin: "2342", role: "Restaurant Captain" /* CAPTAIN */, title: "Restaurant Captain", allowedOutlet: "SH PASKAL" },
  { name: "NISA S", pin: "1324", role: "Greeter" /* GREETER */, title: "Greeter", allowedOutlet: "SH PASKAL" },
  { name: "MUTIA", pin: "3312", role: "Greeter" /* GREETER */, title: "Greeter", allowedOutlet: "SH PASKAL" },
  // SH DAGO
  { name: "RINI", pin: "5656", role: "Greeter" /* GREETER */, title: "Greeter", allowedOutlet: "SH DAGO" },
  { name: "SYIFA", pin: "5151", role: "Greeter" /* GREETER */, title: "Greeter", allowedOutlet: "SH DAGO" },
  { name: "ABAH HENDRA", pin: "5252", role: "Restaurant Manager" /* MANAGER */, title: "Restaurant Manager", allowedOutlet: "SH DAGO" },
  { name: "ANDRI", pin: "5353", role: "Supervisor" /* SUPERVISOR */, title: "Restaurant Supervisor", allowedOutlet: "SH DAGO" },
  { name: "HAMDAN", pin: "5454", role: "Restaurant Captain" /* CAPTAIN */, title: "Restaurant Captain", allowedOutlet: "SH DAGO" },
  { name: "SINAR", pin: "5555", role: "Restaurant Captain" /* CAPTAIN */, title: "Restaurant Captain", allowedOutlet: "SH DAGO" },
  { name: "NATASYA", pin: "5757", role: "Restaurant Captain" /* CAPTAIN */, title: "Restaurant Captain", allowedOutlet: "SH DAGO" }
];
var OUTLETS_JAKARTA = [
  "SH THE BARN",
  "SH LB BULUS",
  "SH KEMANG",
  "SH CIPETE",
  "SH ALSUT",
  "SH BINTARO",
  "SH SMB SUMMARECON"
];
var OUTLETS_BANDUNG = [
  "SH DAGO",
  "SH CIWALK",
  "SH MIM",
  "SH FCL",
  "SH CIMANUK",
  "SH PASKAL",
  "SH PVJ",
  "SH BUBAT",
  "SH MIKO",
  "SH JAWA"
];
var ALL_OUTLETS = [...OUTLETS_JAKARTA, ...OUTLETS_BANDUNG];

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var DATA_FILE = path.join(__dirname, "data.json");
var BACKUP_DIR = path.join(__dirname, "backups");
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}
var state = {
  reservations: {},
  waitingList: {},
  history: {},
  settings: {},
  users: []
};
var activeUsers = [];
if (fs.existsSync(DATA_FILE)) {
  try {
    const saved = fs.readFileSync(DATA_FILE, "utf-8");
    state = JSON.parse(saved);
    if (!state.users || state.users.length === 0) {
      state.users = AUTHORIZED_PIC;
    }
  } catch (e) {
    console.error("Failed to load data.json", e);
  }
} else {
  state.users = AUTHORIZED_PIC;
}
var lastBackupTime = 0;
var BACKUP_INTERVAL = 5 * 60 * 1e3;
function saveState() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
    const now = Date.now();
    if (now - lastBackupTime > BACKUP_INTERVAL) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      const backupPath = path.join(BACKUP_DIR, `backup-global-${timestamp}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(state, null, 2));
      lastBackupTime = now;
      const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith("backup-")).map((f) => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() })).sort((a, b) => b.time - a.time);
      if (files.length > 50) {
        files.slice(50).forEach((f) => fs.unlinkSync(path.join(BACKUP_DIR, f.name)));
      }
    }
  } catch (e) {
    console.error("Failed to save data.json", e);
  }
}
async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3e3;
  app.use(express.json());
  app.get("/api/state/:outlet", (req, res) => {
    const { outlet } = req.params;
    res.json({
      reservations: state.reservations[outlet] || [],
      waitingList: state.waitingList[outlet] || [],
      settings: state.settings[outlet] || null
    });
  });
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("join-outlet", ({ outlet, user }) => {
      socket.join(outlet);
      console.log(`Socket ${socket.id} joined outlet: ${outlet} as ${user?.username}`);
      activeUsers = activeUsers.filter((u) => u.socketId !== socket.id);
      if (user) {
        activeUsers.push({
          socketId: socket.id,
          username: user.username,
          outlet,
          role: user.role
        });
      }
      const outletUsers = activeUsers.filter((u) => u.outlet === outlet);
      io.to(outlet).emit("presence-updated", outletUsers);
      socket.emit("init-state", {
        reservations: state.reservations[outlet] || [],
        waitingList: state.waitingList[outlet] || [],
        settings: state.settings[outlet] || null,
        users: state.users || []
      });
    });
    socket.on("update-reservations", ({ outlet, reservations }) => {
      state.reservations[outlet] = reservations;
      saveState();
      socket.to(outlet).emit("reservations-updated", reservations);
    });
    socket.on("update-waiting-list", ({ outlet, waitingList }) => {
      state.waitingList[outlet] = waitingList;
      saveState();
      socket.to(outlet).emit("waiting-list-updated", waitingList);
    });
    socket.on("update-settings", ({ outlet, settings }) => {
      state.settings[outlet] = settings;
      saveState();
      io.to(outlet).emit("settings-updated", settings);
    });
    socket.on("update-users", (users) => {
      state.users = users;
      saveState();
      io.emit("users-updated", users);
    });
    socket.on("mutate-crew", ({ name, newOutlet }) => {
      if (state.users) {
        state.users = state.users.map((u) => u.name === name ? { ...u, allowedOutlet: newOutlet } : u);
        saveState();
        io.emit("users-updated", state.users);
        console.log(`Crew ${name} mutated to ${newOutlet}`);
      }
    });
    socket.on("close-day", ({ outlet, date }) => {
      console.log(`Closing day ${date} for outlet ${outlet}`);
      const reservations = state.reservations[outlet] || [];
      const toArchive = reservations.filter((r) => r.reservationDate === date);
      const remaining = reservations.filter((r) => r.reservationDate !== date);
      if (toArchive.length > 0) {
        if (!state.history[outlet]) state.history[outlet] = [];
        state.history[outlet] = [...state.history[outlet], ...toArchive];
        state.reservations[outlet] = remaining;
        saveState();
        io.to(outlet).emit("reservations-updated", remaining);
        socket.emit("day-closed-success", { date, count: toArchive.length });
      }
    });
    socket.on("get-backups", (outlet) => {
      try {
        const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith(`backup-${outlet}-`) || f.startsWith("backup-global-")).map((f) => ({
          id: f,
          time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
          label: f.replace(/backup-(.*?)-/, "").replace(".json", "").replace(/-/g, ":"),
          outlet: f.includes("backup-global-") ? "GLOBAL" : outlet
        })).sort((a, b) => b.time - a.time);
        socket.emit("backups-list", files);
      } catch (e) {
        console.error("Failed to get backups", e);
      }
    });
    socket.on("create-backup", ({ outlet, label }) => {
      try {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
        const filename = `backup-${outlet}-${timestamp}.json`;
        const backupPath = path.join(BACKUP_DIR, filename);
        const outletData = {
          reservations: state.reservations[outlet] || [],
          waitingList: state.waitingList[outlet] || [],
          history: state.history[outlet] || [],
          settings: state.settings[outlet] || {},
          label: label || `Manual Backup ${outlet}`
        };
        fs.writeFileSync(backupPath, JSON.stringify(outletData, null, 2));
        console.log(`Created manual backup for ${outlet}: ${filename}`);
        const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith(`backup-${outlet}-`) || f.startsWith("backup-global-")).map((f) => ({
          id: f,
          time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
          label: f.replace(/backup-(.*?)-/, "").replace(".json", "").replace(/-/g, ":"),
          outlet: f.includes("backup-global-") ? "GLOBAL" : outlet
        })).sort((a, b) => b.time - a.time);
        socket.emit("backups-list", files);
      } catch (e) {
        console.error("Failed to create backup", e);
      }
    });
    socket.on("restore-backup", ({ outlet, backupId }) => {
      try {
        const backupPath = path.join(BACKUP_DIR, backupId);
        if (fs.existsSync(backupPath)) {
          const data = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
          if (backupId.includes("backup-global-")) {
            state = data;
          } else {
            state.reservations[outlet] = data.reservations || [];
            state.waitingList[outlet] = data.waitingList || [];
            state.history[outlet] = data.history || [];
            state.settings[outlet] = data.settings || {};
          }
          saveState();
          io.to(outlet).emit("init-state", {
            reservations: state.reservations[outlet],
            waitingList: state.waitingList[outlet],
            settings: state.settings[outlet],
            isRestore: true
          });
          console.log(`Restored backup ${backupId} for outlet ${outlet}`);
        }
      } catch (e) {
        console.error("Failed to restore backup", e);
      }
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      const user = activeUsers.find((u) => u.socketId === socket.id);
      if (user) {
        const outlet = user.outlet;
        activeUsers = activeUsers.filter((u) => u.socketId !== socket.id);
        const outletUsers = activeUsers.filter((u) => u.outlet === outlet);
        io.to(outlet).emit("presence-updated", outletUsers);
      }
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
