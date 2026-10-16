import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { AUTHORIZED_PIC } from './types';

const DATA_FILE = path.join(process.cwd(), 'data.json');
const BACKUP_DIR = path.join(process.cwd(), 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

interface ServerState {
  reservations: Record<string, any[]>;
  waitingList: Record<string, any[]>;
  history: Record<string, any[]>;
  settings: Record<string, any>;
  users?: any[];
}

interface ActiveUser {
  socketId: string;
  username: string;
  outlet: string;
  role: string;
}

let state: ServerState = {
  reservations: {},
  waitingList: {},
  history: {},
  settings: {},
  users: []
};

let activeUsers: ActiveUser[] = [];

// Load initial state
if (fs.existsSync(DATA_FILE)) {
  try {
    const saved = fs.readFileSync(DATA_FILE, 'utf-8');
    state = JSON.parse(saved);
    
    // Seed users if missing or empty
    if (!state.users || state.users.length === 0) {
      state.users = AUTHORIZED_PIC;
    }
  } catch (e) {
    console.error('Failed to load data.json', e);
  }
} else {
  // First time run
  state.users = AUTHORIZED_PIC;
}

let lastBackupTime = 0;
const BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

function saveState() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
    
    // Auto backup every 5 minutes if there are changes
    const now = Date.now();
    if (now - lastBackupTime > BACKUP_INTERVAL) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(BACKUP_DIR, `backup-global-${timestamp}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(state, null, 2));
      lastBackupTime = now;
      
      // Keep only last 50 backups
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('backup-'))
        .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);
      
      if (files.length > 50) {
        files.slice(50).forEach(f => fs.unlinkSync(path.join(BACKUP_DIR, f.name)));
      }
    }
  } catch (e) {
    console.error('Failed to save data.json', e);
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

  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API Routes
  app.get('/api/state/:outlet', (req, res) => {
    const { outlet } = req.params;
    res.json({
      reservations: state.reservations[outlet] || [],
      waitingList: state.waitingList[outlet] || [],
      settings: state.settings[outlet] || null
    });
  });

  // Socket.io logic
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-outlet', ({ outlet, user }) => {
      socket.join(outlet);
      console.log(`Socket ${socket.id} joined outlet: ${outlet} as ${user?.username}`);
      
      // Remove any existing entry for this socket
      activeUsers = activeUsers.filter(u => u.socketId !== socket.id);
      
      if (user) {
        activeUsers.push({
          socketId: socket.id,
          username: user.username,
          outlet: outlet,
          role: user.role
        });
      }

      // Broadcast active users in this outlet
      const outletUsers = activeUsers.filter(u => u.outlet === outlet);
      io.to(outlet).emit('presence-updated', outletUsers);
      
      // Send initial state for this outlet
      socket.emit('init-state', {
        reservations: state.reservations[outlet] || [],
        waitingList: state.waitingList[outlet] || [],
        settings: state.settings[outlet] || null,
        users: state.users || []
      });
    });

    socket.on('update-reservations', ({ outlet, reservations }) => {
      state.reservations[outlet] = reservations;
      saveState();
      socket.to(outlet).emit('reservations-updated', reservations);
    });

    socket.on('update-waiting-list', ({ outlet, waitingList }) => {
      state.waitingList[outlet] = waitingList;
      saveState();
      socket.to(outlet).emit('waiting-list-updated', waitingList);
    });

    socket.on('update-settings', ({ outlet, settings }) => {
      state.settings[outlet] = settings;
      saveState();
      io.to(outlet).emit('settings-updated', settings);
    });

    socket.on('update-users', (users) => {
      state.users = users;
      saveState();
      io.emit('users-updated', users);
    });

    socket.on('mutate-crew', ({ name, newOutlet }) => {
      if (state.users) {
        state.users = state.users.map(u => u.name === name ? { ...u, allowedOutlet: newOutlet } : u);
        saveState();
        io.emit('users-updated', state.users);
        console.log(`Crew ${name} mutated to ${newOutlet}`);
      }
    });

    socket.on('close-day', ({ outlet, date }) => {
      console.log(`Closing day ${date} for outlet ${outlet}`);
      
      const reservations = state.reservations[outlet] || [];
      const toArchive = reservations.filter(r => r.reservationDate === date);
      const remaining = reservations.filter(r => r.reservationDate !== date);
      
      if (toArchive.length > 0) {
        if (!state.history[outlet]) state.history[outlet] = [];
        state.history[outlet] = [...state.history[outlet], ...toArchive];
        state.reservations[outlet] = remaining;
        
        saveState();
        
        // Broadcast updates
        io.to(outlet).emit('reservations-updated', remaining);
        socket.emit('day-closed-success', { date, count: toArchive.length });
      }
    });

    socket.on('get-backups', (outlet) => {
      try {
        const files = fs.readdirSync(BACKUP_DIR)
          .filter(f => f.startsWith(`backup-${outlet}-`) || f.startsWith('backup-global-'))
          .map(f => ({ 
            id: f, 
            time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
            label: f.replace(/backup-(.*?)-/, '').replace('.json', '').replace(/-/g, ':'),
            outlet: f.includes('backup-global-') ? 'GLOBAL' : outlet
          }))
          .sort((a, b) => b.time - a.time);
        socket.emit('backups-list', files);
      } catch (e) {
        console.error('Failed to get backups', e);
      }
    });

    socket.on('create-backup', ({ outlet, label }) => {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
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
        
        // Refresh list
        const files = fs.readdirSync(BACKUP_DIR)
          .filter(f => f.startsWith(`backup-${outlet}-`) || f.startsWith('backup-global-'))
          .map(f => ({ 
            id: f, 
            time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
            label: f.replace(/backup-(.*?)-/, '').replace('.json', '').replace(/-/g, ':'),
            outlet: f.includes('backup-global-') ? 'GLOBAL' : outlet
          }))
          .sort((a, b) => b.time - a.time);
        socket.emit('backups-list', files);
      } catch (e) {
        console.error('Failed to create backup', e);
      }
    });

    socket.on('restore-backup', ({ outlet, backupId }) => {
      try {
        const backupPath = path.join(BACKUP_DIR, backupId);
        if (fs.existsSync(backupPath)) {
          const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
          
          if (backupId.includes('backup-global-')) {
            // Full state restore (legacy or global admin)
            state = data;
          } else {
            // Outlet-specific restore
            state.reservations[outlet] = data.reservations || [];
            state.waitingList[outlet] = data.waitingList || [];
            state.history[outlet] = data.history || [];
            state.settings[outlet] = data.settings || {};
          }
          
          saveState();
          
          // Broadcast to the specific outlet
          io.to(outlet).emit('init-state', {
            reservations: state.reservations[outlet],
            waitingList: state.waitingList[outlet],
            settings: state.settings[outlet],
            isRestore: true
          });
          
          console.log(`Restored backup ${backupId} for outlet ${outlet}`);
        }
      } catch (e) {
        console.error('Failed to restore backup', e);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      const user = activeUsers.find(u => u.socketId === socket.id);
      if (user) {
        const outlet = user.outlet;
        activeUsers = activeUsers.filter(u => u.socketId !== socket.id);
        const outletUsers = activeUsers.filter(u => u.outlet === outlet);
        io.to(outlet).emit('presence-updated', outletUsers);
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
