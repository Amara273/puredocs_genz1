// routes/files.js  v3 — Cloudinary + local storage support
const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db       = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');
const storage  = require('../services/storageService');

const router = express.Router();
router.use((req, res, next) => {
  // skip auth for public file access
  if (req.path.startsWith('/public')) return next();
  verifyToken(req, res, next);
});

// ── Activity log helper ───────────────────────────────
async function log(teamId, userId, action, targetId, targetName, meta = null) {
  try {
    await db.query(
      'INSERT INTO activity_log (team_id,user_id,action,target_type,target_id,target_name,meta) VALUES (?,?,?,?,?,?,?)',
      [teamId, userId, action, 'file', targetId, targetName, meta ? JSON.stringify(meta) : null]
    );
  } catch(e) { console.error('Log error:', e.message); }
}

async function isMember(userId, teamId) {
  const [r] = await db.query('SELECT 1 FROM team_members WHERE user_id=? AND team_id=?', [userId, teamId]);
  return r.length > 0;
}

// ── GET /api/files?teamId=&folderId= ──────────────────
router.get('/', async (req, res) => {
  const { teamId, folderId = null, search, type, sort = 'newest' } = req.query;
  if (!teamId) return res.status(400).json({ success: false, message: 'teamId required' });
  if (!(await isMember(req.userId, teamId)))
    return res.status(403).json({ success: false, message: 'Not a member' });

  try {
    let sql = `
      SELECT fi.*, u.name AS uploader_name, u.avatar_color AS uploader_color,
        fo.name AS folder_name
      FROM files fi
      JOIN users u ON fi.uploader_id = u.id
      LEFT JOIN folders fo ON fi.folder_id = fo.id
      WHERE fi.team_id = ?
    `;
    const params = [teamId];

    if (folderId && folderId !== 'null') {
      sql += ' AND fi.folder_id = ?'; params.push(folderId);
    } else if (!folderId || folderId === 'null') {
      sql += ' AND fi.folder_id IS NULL';
    }

    if (search) { sql += ' AND fi.original_name LIKE ?'; params.push(`%${search}%`); }

    const extMap = {
      pdf: ['pdf'], doc: ['doc','docx','txt'],
      xls: ['xls','xlsx','csv'], img: ['jpg','jpeg','png','gif','webp'], zip: ['zip','rar'],
    };
    if (type && extMap[type]) {
      sql += ` AND (${extMap[type].map(() => 'fi.original_name LIKE ?').join(' OR ')})`;
      extMap[type].forEach(e => params.push(`%.${e}`));
    }

    const orderMap = {
      newest: 'fi.upload_date DESC', oldest: 'fi.upload_date ASC',
      name: 'fi.original_name ASC', size: 'fi.size DESC',
    };
    sql += ` ORDER BY ${orderMap[sort] || orderMap.newest}`;

    const [files] = await db.query(sql, params);
    res.json({ success: true, files });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── POST /api/files/upload ────────────────────────────
router.post('/upload',
  (req, res, next) => storage.upload.array('files', 20)(req, res, err => storage.handleUploadError(err, req, res, next)),
  async (req, res) => {
    const { teamId, folderId = null } = req.body;
    if (!teamId) return res.status(400).json({ success: false, message: 'teamId required' });
    if (!(await isMember(req.userId, teamId)))
      return res.status(403).json({ success: false, message: 'Not a member' });
    if (!req.files?.length) return res.status(400).json({ success: false, message: 'No files uploaded' });

    try {
      const inserted = [];
      for (const file of req.files) {
        const id = uuidv4();

        // filepath: Cloudinary → secure_url | local → disk path
        const filepath    = storage.mode === 'cloudinary' ? file.path : file.path;
        const storedName  = storage.mode === 'cloudinary' ? file.filename : file.filename;

        await db.query(
          'INSERT INTO files (id,original_name,stored_name,filepath,mimetype,size,team_id,folder_id,uploader_id) VALUES (?,?,?,?,?,?,?,?,?)',
          [id, file.originalname, storedName, filepath, file.mimetype, file.size, teamId, folderId || null, req.userId]
        );
        inserted.push({
          id, original_name: file.originalname,
          size: file.size, mimetype: file.mimetype,
          upload_date: new Date(), folder_id: folderId || null,
        });
        await log(teamId, req.userId, 'file_upload', id, file.originalname, { folder_id: folderId, size: file.size });
      }
      res.status(201).json({ success: true, files: inserted, count: inserted.length });
    } catch(err) { res.status(500).json({ success: false, message: err.message }); }
  }
);

// ── Helper: proxy a remote URL through our server ────
async function proxyStream(url, res, disposition, filename, mimetype) {
  const https  = require('https');
  const http   = require('http');
  const client = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    client.get(url, (remote) => {
      res.setHeader('Content-Type',        mimetype || remote.headers['content-type'] || 'application/octet-stream');
      res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(filename)}"`);
      if (remote.headers['content-length'])
        res.setHeader('Content-Length', remote.headers['content-length']);
      res.setHeader('Access-Control-Allow-Origin', '*');
      remote.pipe(res);
      remote.on('end', resolve);
      remote.on('error', reject);
    }).on('error', reject);
  });
}

// ── GET /api/files/:id/download ───────────────────────
router.get('/:id/download', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM files WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'File not found' });
    const file = rows[0];
    if (!(await isMember(req.userId, file.team_id)))
      return res.status(403).json({ success: false, message: 'Permission denied' });

    await log(file.team_id, req.userId, 'file_download', file.id, file.original_name);

    if (storage.mode === 'cloudinary') {
      // Proxy the Cloudinary file through our server so browser saves with correct filename
      await proxyStream(file.filepath, res, 'attachment', file.original_name, file.mimetype);
    } else {
      if (!fs.existsSync(file.filepath))
        return res.status(404).json({ success: false, message: 'File missing on disk' });
      res.download(file.filepath, file.original_name);
    }
  } catch(err) {
    if (!res.headersSent)
      res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/files/:id/view ───────────────────────────
router.get('/:id/view', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM files WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'File not found' });
    const file = rows[0];
    if (!(await isMember(req.userId, file.team_id)))
      return res.status(403).json({ success: false, message: 'Permission denied' });

    if (storage.mode === 'cloudinary') {
      // Proxy inline so viewer can fetch with auth header
      await proxyStream(file.filepath, res, 'inline', file.original_name, file.mimetype);
    } else {
      if (!fs.existsSync(file.filepath))
        return res.status(404).json({ success: false, message: 'File missing' });
      res.setHeader('Content-Type',        file.mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_name)}"`);
      fs.createReadStream(file.filepath).pipe(res);
    }
  } catch(err) {
    if (!res.headersSent)
      res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/files/:id/move ───────────────────────────
router.put('/:id/move', async (req, res) => {
  const { folderId = null } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM files WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'File not found' });
    const file = rows[0];
    if (!(await isMember(req.userId, file.team_id)))
      return res.status(403).json({ success: false, message: 'Not a member' });

    await db.query('UPDATE files SET folder_id=? WHERE id=?', [folderId || null, file.id]);
    await log(file.team_id, req.userId, 'file_move', file.id, file.original_name, { from: file.folder_id, to: folderId });
    res.json({ success: true, message: 'File moved' });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PUT /api/files/:id/rename ─────────────────────────
router.put('/:id/rename', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim())
    return res.status(400).json({ success: false, message: 'name required' });

  try {
    const [rows] = await db.query('SELECT * FROM files WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'File not found' });
    const file = rows[0];
    if (!(await isMember(req.userId, file.team_id)))
      return res.status(403).json({ success: false, message: 'Not a member' });

    const newName = name.trim();

    // Check for duplicate in same folder
    const [dup] = await db.query(
      'SELECT id FROM files WHERE team_id=? AND folder_id<=>? AND original_name=? AND id!=?',
      [file.team_id, file.folder_id, newName, file.id]
    );
    if (dup.length)
      return res.status(409).json({ success: false, message: '"' + newName + '" មានហើយក្នុងថតនេះ' });

    const oldName = file.original_name;
    await db.query('UPDATE files SET original_name=? WHERE id=?', [newName, file.id]);
    await log(file.team_id, req.userId, 'file_rename', file.id, newName, { old_name: oldName });
    res.json({ success: true, message: 'ប្ដូរឈ្មោះជោគជ័យ', name: newName });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── POST /api/files/:id/share ─────────────────────────
router.post('/:id/share', async (req, res) => {
  const { platform } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM files WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'File not found' });
    const file = rows[0];
    if (!(await isMember(req.userId, file.team_id)))
      return res.status(403).json({ success: false, message: 'Permission denied' });

    let token = file.share_token;
    if (!token) {
      token = crypto.randomBytes(24).toString('hex');
      await db.query('UPDATE files SET is_shared=1, share_token=? WHERE id=?', [token, file.id]);
    } else {
      await db.query('UPDATE files SET is_shared=1 WHERE id=?', [file.id]);
    }

    if (platform) {
      await db.query('INSERT INTO share_logs (file_id,shared_by,platform) VALUES (?,?,?)', [file.id, req.userId, platform]);
      await log(file.team_id, req.userId, 'file_share', file.id, file.original_name, { platform });
    }

    const shareUrl = `${process.env.APP_URL || 'http://localhost:5000'}/api/files/public/${token}`;
    res.json({ success: true, shareUrl, token });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── DELETE /api/files/:id ─────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM files WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'File not found' });
    const file = rows[0];
    if (file.uploader_id !== req.userId && req.userRole !== 'admin')
      return res.status(403).json({ success: false, message: 'Permission denied' });

    // Delete from storage
    if (storage.mode === 'cloudinary') {
      await storage.deleteFile(file.stored_name, file.mimetype);
    } else {
      if (fs.existsSync(file.filepath)) fs.unlinkSync(file.filepath);
    }

    await db.query('DELETE FROM files WHERE id=?', [file.id]);
    await log(file.team_id, req.userId, 'file_delete', file.id, file.original_name);
    res.json({ success: true, message: 'File deleted' });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET /api/files/public/:token  — no auth ──────────
router.get('/public/:token', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM files WHERE share_token=? AND is_shared=1', [req.params.token]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Invalid link' });
    const file = rows[0];

    if (storage.mode === 'cloudinary') {
      // Proxy so recipient gets correct filename
      await proxyStream(file.filepath, res, 'attachment', file.original_name, file.mimetype);
    } else {
      if (!fs.existsSync(file.filepath))
        return res.status(404).json({ success: false, message: 'File deleted' });
      res.download(file.filepath, file.original_name);
    }
  } catch(err) {
    if (!res.headersSent)
      res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/files/activity ───────────────────────────
router.get('/activity', async (req, res) => {
  const { teamId, limit = 50 } = req.query;
  if (!teamId) return res.status(400).json({ success: false, message: 'teamId required' });
  if (!(await isMember(req.userId, teamId)))
    return res.status(403).json({ success: false, message: 'Not a member' });

  try {
    const [logs] = await db.query(
      `SELECT a.*, u.name AS user_name, u.avatar_color
       FROM activity_log a JOIN users u ON a.user_id = u.id
       WHERE a.team_id = ? ORDER BY a.created_at DESC LIMIT ?`,
      [teamId, parseInt(limit)]
    );
    res.json({ success: true, logs });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;