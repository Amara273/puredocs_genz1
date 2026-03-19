// server.js v3
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/teams',   require('./routes/teams'));
app.use('/api/files',   require('./routes/files'));
app.use('/api/folders', require('./routes/folders'));

// Health
app.get('/api/health', (req, res) => res.json({
  success: true, message: 'TeamDocs KH API v3',
  time: new Date(), mode: process.env.REGISTRATION_MODE || 'approval'
}));

app.use('/api/*', (req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// All frontend routes → index.html (SPA)
app.get('*', (req, res) => {
  const p = path.join(__dirname, 'public', 'index.html');
  require('fs').existsSync(p)
    ? res.sendFile(p)
    : res.json({ message: 'Place index.html in /public folder' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled:', err);
  res.status(500).json({ success: false, message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 TeamDocs KH v3 → http://localhost:${PORT}`);
  console.log(`📧 Gmail: ${process.env.GMAIL_USER || 'NOT CONFIGURED'}`);
  console.log(`🔐 Mode:  ${process.env.REGISTRATION_MODE || 'approval'}`);
  console.log(`📋 Health: http://localhost:${PORT}/api/health\n`);
});