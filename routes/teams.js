// routes/teams.js v3
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const crypto  = require('crypto');
const db      = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');
const emailSvc = require('../services/emailService');

const router = express.Router();
router.use(verifyToken);

const COLORS = [
  'linear-gradient(135deg,#4f8ef7,#38d9a9)',
  'linear-gradient(135deg,#f5c842,#ff8c42)',
  'linear-gradient(135deg,#b46fff,#4f8ef7)',
  'linear-gradient(135deg,#ff6b6b,#ffa07a)',
  'linear-gradient(135deg,#38d9a9,#4fc3f7)',
];

async function isMember(userId, teamId) {
  const [r] = await db.query('SELECT 1 FROM team_members WHERE user_id=? AND team_id=?', [userId, teamId]);
  return r.length > 0;
}

// GET /api/teams
router.get('/', async (req, res) => {
  try {
    const [teams] = await db.query(
      `SELECT t.*,tm.role AS member_role,
        (SELECT COUNT(*) FROM team_members WHERE team_id=t.id) AS member_count,
        (SELECT COUNT(*) FROM files WHERE team_id=t.id) AS file_count
       FROM teams t JOIN team_members tm ON t.id=tm.team_id
       WHERE tm.user_id=? ORDER BY tm.joined_at ASC`, [req.userId]
    );
    res.json({ success: true, teams });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/teams/:id/rename
router.put('/:id/rename', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'name required' });
  try {
    // Only admin or team creator can rename
    const [check] = await db.query(
      "SELECT role FROM team_members WHERE team_id=? AND user_id=?",
      [req.params.id, req.userId]
    );
    if (!check.length || check[0].role !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin only' });

    await db.query('UPDATE teams SET name=? WHERE id=?', [name.trim(), req.params.id]);
    res.json({ success: true, message: 'ប្ដូរឈ្មោះក្រុមជោគជ័យ' });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/teams/:id
router.delete('/:id', async (req, res) => {
  try {
    // Only admin can delete
    const [check] = await db.query(
      "SELECT role FROM team_members WHERE team_id=? AND user_id=?",
      [req.params.id, req.userId]
    );
    if (!check.length || check[0].role !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin only' });

    // Cannot delete if it's the user's only team
    const [allTeams] = await db.query(
      'SELECT COUNT(*) AS cnt FROM team_members WHERE user_id=?', [req.userId]
    );
    if (allTeams[0].cnt <= 1)
      return res.status(400).json({ success: false, message: 'មិនអាចលុបក្រុមតែមួយ — បង្កើតក្រុមថ្មីជាមុន' });

    // Delete team (CASCADE will clean team_members, files, folders, activity_log)
    await db.query('DELETE FROM teams WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'លុបក្រុមជោគជ័យ' });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/teams
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'ដាក់ឈ្មោះក្រុម' });
  try {
    const [all] = await db.query('SELECT COUNT(*) AS cnt FROM teams');
    const color  = COLORS[all[0].cnt % COLORS.length];
    const teamId = uuidv4();
    const code   = 'TEAM-' + Math.random().toString(36).substr(2,4).toUpperCase();
    await db.query('INSERT INTO teams (id,name,code,color,created_by) VALUES (?,?,?,?,?)',
      [teamId, name, code, color, req.userId]);
    await db.query('INSERT INTO team_members (team_id,user_id,role) VALUES (?,?,?)',
      [teamId, req.userId, 'admin']);
    const [rows] = await db.query('SELECT * FROM teams WHERE id=?', [teamId]);
    res.status(201).json({ success: true, team: { ...rows[0], member_count: 1, file_count: 0 } });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/teams/join  — join by code
router.post('/join', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'ដាក់លេខកូដក្រុម' });
  try {
    const [teams] = await db.query('SELECT * FROM teams WHERE code=?', [code.toUpperCase()]);
    if (!teams.length) return res.status(404).json({ success: false, message: 'រកមិនឃើញក្រុម' });
    await db.query('INSERT IGNORE INTO team_members (team_id,user_id,role) VALUES (?,?,?)',
      [teams[0].id, req.userId, 'member']);
    res.json({ success: true, team: teams[0] });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/teams/accept-invite/:token  — accept email invite
router.post('/accept-invite/:token', async (req, res) => {
  try {
    const [invites] = await db.query(
      'SELECT * FROM invitations WHERE token=? AND used=0 AND expires_at > NOW()',
      [req.params.token]
    );
    if (!invites.length)
      return res.status(400).json({ success: false, message: 'ការអញ្ជើញផុតកំណត់ ឬ មិនត្រឹមត្រូវ' });

    const inv = invites[0];

    // Check if user email matches invitation
    const [userRows] = await db.query('SELECT * FROM users WHERE id=?', [req.userId]);
    if (!userRows.length) return res.status(404).json({ success: false, message: 'User not found' });

    if (userRows[0].email.toLowerCase() !== inv.email.toLowerCase())
      return res.status(403).json({ success: false, message: 'ការអញ្ជើញនេះមិនមែនសម្រាប់អ្នកទេ' });

    await db.query('INSERT IGNORE INTO team_members (team_id,user_id,role) VALUES (?,?,?)',
      [inv.team_id, req.userId, inv.role]);
    await db.query('UPDATE invitations SET used=1 WHERE id=?', [inv.id]);

    const [teams] = await db.query('SELECT * FROM teams WHERE id=?', [inv.team_id]);
    res.json({ success: true, team: teams[0], message: 'ចូលក្រុមជោគជ័យ!' });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/teams/:id/members
router.get('/:id/members', async (req, res) => {
  try {
    const [members] = await db.query(
      `SELECT u.id,u.name,u.email,u.avatar_color,u.status,u.email_verified,
        tm.role,tm.joined_at
       FROM users u JOIN team_members tm ON u.id=tm.user_id
       WHERE tm.team_id=? ORDER BY tm.joined_at ASC`, [req.params.id]
    );
    res.json({ success: true, members });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/teams/:id/invite  — send email invitation
router.post('/:id/invite', async (req, res) => {
  const { email, role = 'member' } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'ដាក់ Email' });

  try {
    // Check if inviter is a member
    if (!(await isMember(req.userId, req.params.id)))
      return res.status(403).json({ success: false, message: 'Not a member' });

    const [teams] = await db.query('SELECT * FROM teams WHERE id=?', [req.params.id]);
    if (!teams.length) return res.status(404).json({ success: false, message: 'Team not found' });

    const [inviterRows] = await db.query('SELECT name FROM users WHERE id=?', [req.userId]);
    const inviterName = inviterRows[0]?.name || 'Someone';

    // Check if user already exists and is member
    const [existingUser] = await db.query('SELECT * FROM users WHERE email=?', [email]);
    if (existingUser.length) {
      const alreadyMember = await isMember(existingUser[0].id, req.params.id);
      if (alreadyMember)
        return res.status(409).json({ success: false, message: `${email} ជាសមាជិករួចហើយ` });

      // Add directly if user exists
      await db.query('INSERT IGNORE INTO team_members (team_id,user_id,role) VALUES (?,?,?)',
        [req.params.id, existingUser[0].id, role]);
      return res.json({ success: true, message: `${existingUser[0].name} ត្រូវបានបន្ថែម` });
    }

    // Create invitation token
    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 3600000); // 7 days
    const invId   = uuidv4();

    await db.query(
      'INSERT INTO invitations (id,team_id,email,role,token,invited_by,expires_at) VALUES (?,?,?,?,?,?,?)',
      [invId, req.params.id, email, role, token, req.userId, expires]
    );

    await emailSvc.sendInvitationEmail(email, inviterName, teams[0].name, token);

    res.json({ success: true, message: `ការអញ្ជើញបានផ្ញើទៅ ${email}` });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/teams/:id/members/:userId  — change role
router.put('/:id/members/:userId', async (req, res) => {
  const { role } = req.body;
  if (!['admin','editor','member'].includes(role))
    return res.status(400).json({ success: false, message: 'Invalid role' });
  try {
    // Only admin can change roles
    const [check] = await db.query(
      "SELECT role FROM team_members WHERE team_id=? AND user_id=?",
      [req.params.id, req.userId]
    );
    if (!check.length || check[0].role !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin only' });

    await db.query(
      'UPDATE team_members SET role=? WHERE team_id=? AND user_id=?',
      [role, req.params.id, req.params.userId]
    );
    // Also update the user's global role if promoting/demoting
    await db.query('UPDATE users SET role=? WHERE id=?', [role, req.params.userId]);
    res.json({ success: true, message: 'Role ត្រូវបានប្ដូរ → ' + role });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/teams/:id/members/:userId  — remove member
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    // Prevent removing yourself if you're the only admin
    const [admins] = await db.query(
      "SELECT user_id FROM team_members WHERE team_id=? AND role='admin'",
      [req.params.id]
    );
    if (admins.length === 1 && admins[0].user_id === req.params.userId)
      return res.status(400).json({ success: false, message: 'មិនអាចដក Admin តែមួយ' });

    await db.query(
      'DELETE FROM team_members WHERE team_id=? AND user_id=?',
      [req.params.id, req.params.userId]
    );
    res.json({ success: true, message: 'ដកចេញពីក្រុមជោគជ័យ' });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;