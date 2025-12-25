import express from 'express';
import { ParseServer } from 'parse-server';
import ParseDashboard from 'parse-dashboard';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 1337;
const PARSE_MOUNT = '/parse';
const DASHBOARD_MOUNT = '/dashboard';

// MongoDB URI
const mongoUri = process.env.MONGODB_URI || 'mongodb://mongo:27017/parse';

// Parse Server Configuration
const parseServerConfig = {
  databaseURI: mongoUri,
  cloud: path.join(__dirname, 'cloud', 'main.js'),
  appId: process.env.APP_ID || 'parse-app-id-123456789',
  masterKey: process.env.MASTER_KEY || 'parse-master-key-123456789',
  serverURL: process.env.SERVER_URL || `http://localhost:${PORT}${PARSE_MOUNT}`,
  publicServerURL: process.env.PUBLIC_SERVER_URL || `http://localhost:${PORT}${PARSE_MOUNT}`,

  // Live Query Configuration
  liveQuery: {
    classNames: ['_Session', 'User', 'Post', 'Comment', 'Message'],
  },

  // File Adapter
  filesAdapter: 'parse-server-fs',

  // Class Level Permissions
  classLevelPermissions: {
    '*': {
      find: { '*': true },
      count: { '*': true },
      get: { '*': true },
      create: { '*': true },
      update: { '*': true },
      delete: { '*': true },
      addField: { '*': true },
    },
  },

  allowClientClassCreation: true,
  allowCustomObjectId: true,
  enforcePrivateUsers: false,
  revokeSessionOnPasswordChange: false,
};

// Initialize Parse Server
const parseServer = new ParseServer(parseServerConfig);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Parse-Application-Id, X-Parse-Master-Key, X-Parse-Session-Token');
  if (req.method === 'OPTIONS') res.sendStatus(200);
  else next();
});

// Mount Parse Server
await parseServer.start();
app.use(PARSE_MOUNT, parseServer.app);

// Parse Dashboard
const dashboardConfig = {
  apps: [
    {
      serverURL: parseServerConfig.serverURL,
      appId: parseServerConfig.appId,
      masterKey: parseServerConfig.masterKey,
      appName: 'Parse Server App',
      production: true,
    },
  ],
  users: [
    {
      user: process.env.DASHBOARD_USER || 'admin',
      pass: process.env.DASHBOARD_PASSWORD || 'admin123',
    },
  ],
  trustProxy: 1,
};

app.use(DASHBOARD_MOUNT, ParseDashboard(dashboardConfig, true));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    parseServer: 'running',
    liveQueries: 'enabled',
  });
});

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Parse Server running without Redis',
    parseAPI: `${parseServerConfig.serverURL}`,
    dashboard: DASHBOARD_MOUNT,
  });
});

// HTTP + WebSocket Server for Live Queries
const httpServer = http.createServer(app);
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  console.log('✅ WebSocket client connected');
  ws.on('close', () => console.log('❌ WebSocket client disconnected'));
  ws.on('error', (err) => console.error('WebSocket error:', err));
});

httpServer.listen(PORT, () => {
  console.log(`✅ Parse Server running on http://localhost:${PORT}`);
  console.log(`✅ Dashboard: http://localhost:${PORT}${DASHBOARD_MOUNT}`);
});
