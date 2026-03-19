// routes/folders.js
const express  = require('express');
const archiver = require('archiver');
const path     = require('path');
const fs       = require('fs');
const { v4: uuidv4 } = require('uuid');
const db       = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(verifyToken);

// ── Helper: log activity ─────────────────────────────────
async function log(teamId, userId, action, targetType, targetId, targetName, meta = null) {
  try {
    await db.query(
      'INSERT INTO activity_log (team_id,user_id,action,target_type,target_id,target_name,meta) VALUES (?,?,?,?,?,?,?)',
      [teamId, userId, action, targetType, targetId, targetName, meta ? JSON.stringify(meta) : null]
    );
  } catch(e) { console.error('log error:', e.message); }
}

// ── Helper: check team membership ────────────────────────
async function isMember(userId, teamId) {
  const [r] = await db.query('SELECT 1 FROM team_members WHERE user_id=? AND team_id=?', [userId, teamId]);
  return r.length > 0;
}

// ── GET /api/folders?teamId=&parentId= ───────────────────
// List folders + files in a location (parentId null = root)
router.get('/', async (req, res) => {
  const { teamId, parentId = null } = req.query;
  if (!teamId) return res.status(400).json({ success: false, message: 'teamId required' });
  if (!(await isMember(req.userId, teamId)))
    return res.status(403).json({ success: false, message: 'Not a member' });

  try {
    // Sub-folders
    const [folders] = await db.query(
      `SELECT f.*, u.name AS creator_name, u.avatar_color AS creator_color,
        (SELECT COUNT(*) FROM folders sf WHERE sf.parent_id = f.id) AS subfolder_count,
        (SELECT COUNT(*) FROM files fi WHERE fi.folder_id = f.id) AS file_count
       FROM folders f
       JOIN users u ON f.created_by = u.id
       WHERE f.team_id = ? AND ${parentId ? 'f.parent_id = ?' : 'f.parent_id IS NULL'}
       ORDER BY f.name ASC`,
      parentId ? [teamId, parentId] : [teamId]
    );

    // Files in this location
    const [files] = await db.query(
      `SELECT fi.*, u.name AS uploader_name, u.avatar_color AS uploader_color
       FROM files fi
       JOIN users u ON fi.uploader_id = u.id
       WHERE fi.team_id = ? AND ${parentId ? 'fi.folder_id = ?' : 'fi.folder_id IS NULL'}
       ORDER BY fi.upload_date DESC`,
      parentId ? [teamId, parentId] : [teamId]
    );

    // Breadcrumb path
    let breadcrumb = [];
    if (parentId) {
      let current = parentId;
      while (current) {
        const [rows] = await db.query('SELECT id, name, parent_id FROM folders WHERE id = ?', [current]);
        if (!rows.length) break;
        breadcrumb.unshift({ id: rows[0].id, name: rows[0].name });
        current = rows[0].parent_id;
      }
    }

    res.json({ success: true, folders, files, breadcrumb });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/folders ─────────────────────────────────────
router.post('/', async (req, res) => {
  const { teamId, name, parentId = null } = req.body;
  if (!teamId || !name) return res.status(400).json({ success: false, message: 'teamId and name required' });
  if (!(await isMember(req.userId, teamId)))
    return res.status(403).json({ success: false, message: 'Not a member' });

  try {
    const id = uuidv4();
    await db.query(
      'INSERT INTO folders (id,name,team_id,parent_id,created_by) VALUES (?,?,?,?,?)',
      [id, name.trim(), teamId, parentId || null, req.userId]
    );
    const [rows] = await db.query(
      `SELECT f.*, u.name AS creator_name FROM folders f JOIN users u ON f.created_by=u.id WHERE f.id=?`, [id]
    );
    await log(teamId, req.userId, 'folder_create', 'folder', id, name.trim(), { parentId });
    res.status(201).json({ success: true, folder: rows[0] });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/folders/:id  (rename) ────────────────────────
router.put('/:id', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'name required' });

  try {
    const [rows] = await db.query('SELECT * FROM folders WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Folder not found' });
    const folder = rows[0];
    if (!(await isMember(req.userId, folder.team_id)))
      return res.status(403).json({ success: false, message: 'Not a member' });

    const oldName = folder.name;
    await db.query('UPDATE folders SET name=? WHERE id=?', [name.trim(), folder.id]);
    await log(folder.team_id, req.userId, 'folder_rename', 'folder', folder.id, name.trim(), { old_name: oldName });
    res.json({ success: true, message: 'Folder renamed' });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/folders/:id ───────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM folders WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Folder not found' });
    const folder = rows[0];
    if (!(await isMember(req.userId, folder.team_id)))
      return res.status(403).json({ success: false, message: 'Not a member' });

    // Collect all files in this folder tree and delete from disk
    const allFiles = await getAllFilesInFolder(folder.id);
    for (const f of allFiles) {
      if (fs.existsSync(f.filepath)) fs.unlinkSync(f.filepath);
    }

    await db.query('DELETE FROM folders WHERE id=?', [folder.id]);
    await log(folder.team_id, req.userId, 'folder_delete', 'folder', folder.id, folder.name, { file_count: allFiles.length });
    res.json({ success: true, message: 'Folder deleted' });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/folders/:id/download  — ZIP ─────────────────
router.get('/:id/download', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM folders WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Folder not found' });
    const folder = rows[0];
    if (!(await isMember(req.userId, folder.team_id)))
      return res.status(403).json({ success: false, message: 'Not a member' });

    const allFiles = await getAllFilesInFolder(folder.id);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${folder.name}.zip"`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(res);

    for (const f of allFiles) {
      if (fs.existsSync(f.filepath)) {
        archive.file(f.filepath, { name: f.relative_path });
      }
    }

    archive.finalize();
    await log(folder.team_id, req.userId, 'folder_download', 'folder', folder.id, folder.name);
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Helper: recursively get all files in a folder tree ───
async function getAllFilesInFolder(folderId, basePath = '') {
  const [folder] = await db.query('SELECT name FROM folders WHERE id=?', [folderId]);
  const folderName = folder.length ? folder[0].name : '';
  const currentPath = basePath ? `${basePath}/${folderName}` : folderName;

  const [files] = await db.query('SELECT * FROM files WHERE folder_id=?', [folderId]);
  const result = files.map(f => ({ ...f, relative_path: `${currentPath}/${f.original_name}` }));

  const [subFolders] = await db.query('SELECT id FROM folders WHERE parent_id=?', [folderId]);
  for (const sf of subFolders) {
    const subFiles = await getAllFilesInFolder(sf.id, currentPath);
    result.push(...subFiles);
  }

  return result;
}

module.exports = router;