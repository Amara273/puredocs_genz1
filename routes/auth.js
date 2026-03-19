// routes/auth.js  v3 — with email verify, forgot/reset, admin approval
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db       = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');
const email    = require('../services/emailService');

const router = express.Router();

const COLORS = [
  'linear-gradient(135deg,#4f8ef7,#38d9a9)',
  'linear-gradient(135deg,#f5c842,#ff8c42)',
  'linear-gradient(135deg,#b46fff,#4f8ef7)',
  'linear-gradient(135deg,#ff6b6b,#ffa07a)',
  'linear-gradient(135deg,#38d9a9,#4fc3f7)',
  'linear-gradient(135deg,#f5c842,#e879a0)',
];

function makeToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function randomToken() { return crypto.randomBytes(48).toString('hex'); }

// ── GET /api/auth/status  — registration mode ─────────
router.get('/status', (req, res) => {
  res.json({
    success: true,
    mode: process.env.REGISTRATION_MODE || 'approval',
    appName: process.env.APP_NAME || 'TeamDocs KH',
  });
});

// ════════════════════════════════════════════════════════
// REGISTER
// ════════════════════════════════════════════════════════
router.post('/register', async (req, res) => {
  const { name, email: userEmail, password, teamCode } = req.body;
  if (!name || !userEmail || !password)
    return res.status(400).json({ success: false, message: 'សូមបំពេញព័ត៌មានទាំងអស់' });
  if (password.length < 6)
    return res.status(400).json({ success: false, message: 'ពាក្យសម្ងាត់យ៉ាងតិច 6 តួ' });

  const mode = process.env.REGISTRATION_MODE || 'approval';

  // invite_only mode — block self-register unless they have invite token
  if (mode === 'invite_only')
    return res.status(403).json({
      success: false,
      message: 'ការចុះឈ្មោះត្រូវការការអញ្ជើញ — សូមទំនាក់ទំនង Admin'
    });

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email=?', [userEmail]);
    if (existing.length)
      return res.status(409).json({ success: false, message: 'អ៊ីមែលនេះមានហើយ' });

    const [allUsers] = await db.query('SELECT COUNT(*) AS cnt FROM users');
    const colorIdx = allUsers[0].cnt % COLORS.length;
    const isFirst  = allUsers[0].cnt === 0; // first user becomes admin + auto-active

    const hashed      = await bcrypt.hash(password, 12);
    const userId      = uuidv4();
    const verifyToken = randomToken();
    const userRole    = isFirst ? 'admin' : 'member';
    // first user always active; approval mode = pending; open mode = active
    const userStatus  = isFirst ? 'active' : (mode === 'open' ? 'active' : 'pending');

    await db.query(
      'INSERT INTO users (id,name,email,password,role,status,avatar_color,verify_token,email_verified) VALUES (?,?,?,?,?,?,?,?,?)',
      [userId, name, userEmail, hashed, userRole, userStatus, COLORS[colorIdx], verifyToken, isFirst ? 1 : 0]
    );

    // Handle team
    let team = null;
    if (teamCode) {
      const [teams] = await db.query('SELECT * FROM teams WHERE code=?', [teamCode.toUpperCase()]);
      if (teams.length) {
        team = teams[0];
        await db.query('INSERT IGNORE INTO team_members (team_id,user_id,role) VALUES (?,?,?)', [team.id, userId, 'member']);
      }
    }
    if (!team) {
      const teamId   = uuidv4();
      const teamName = isFirst ? `${name}'s Team` : `ក្រុម ${name.split(' ')[0]}`;
      const code     = 'TEAM-' + Math.random().toString(36).substr(2,4).toUpperCase();
      await db.query('INSERT INTO teams (id,name,code,color,created_by) VALUES (?,?,?,?,?)',
        [teamId, teamName, code, COLORS[colorIdx], userId]);
      await db.query('INSERT INTO team_members (team_id,user_id,role) VALUES (?,?,?)', [teamId, userId, isFirst?'admin':'member']);
      const [tr] = await db.query('SELECT * FROM teams WHERE id=?', [teamId]);
      team = tr[0];
    }

    const user = { id: userId, name, email: userEmail, role: userRole, avatar_color: COLORS[colorIdx] };

    // Send emails
    if (!isFirst) {
      await email.sendVerificationEmail(user, verifyToken);

      if (mode === 'approval') {
        // Notify all admins
        const [admins] = await db.query("SELECT name,email FROM users WHERE role='admin' AND status='active'");
        for (const admin of admins) {
          await email.sendApprovalRequestEmail(admin.email, admin.name, user);
        }
        return res.status(201).json({
          success: true,
          pending: true,
          message: 'ចុះឈ្មោះជោគជ័យ! សូមរង់ចាំការអនុម័តពី Admin និងបញ្ជាក់អ៊ីមែលរបស់អ្នក។'
        });
      }
    }

    // open mode or first user — return token immediately
    const token = makeToken(user);
    res.status(201).json({ success: true, token, user, team });

  } catch(err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════
// VERIFY EMAIL
// ════════════════════════════════════════════════════════
router.get('/verify-email/:token', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE verify_token=?', [req.params.token]);
    if (!rows.length)
      return res.redirect((process.env.APP_URL||'')+'/login?error=invalid_token');

    await db.query('UPDATE users SET email_verified=1, verify_token=NULL WHERE id=?', [rows[0].id]);

    // Redirect to frontend with success message
    res.redirect((process.env.APP_URL||'')+'/login?verified=1');
  } catch(err) {
    res.redirect((process.env.APP_URL||'')+'/login?error=server');
  }
});

// ════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════
router.post('/login', async (req, res) => {
  const { email: userEmail, password } = req.body;
  if (!userEmail || !password)
    return res.status(400).json({ success: false, message: 'សូមបំពេញ Email និង Password' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email=?', [userEmail]);
    if (!rows.length)
      return res.status(401).json({ success: false, message: 'អ៊ីមែល ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវ' });

    const user = rows[0];

    // Check password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, message: 'អ៊ីមែល ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវ' });

    // Check account status
    if (user.status === 'pending')
      return res.status(403).json({
        success: false, pending: true,
        message: 'គណនីរបស់អ្នកកំពុងរង់ចាំការអនុម័តពី Admin'
      });

    if (user.status === 'suspended')
      return res.status(403).json({
        success: false,
        message: 'គណនីរបស់អ្នកត្រូវបានផ្អាក — ទំនាក់ទំនង Admin'
      });

    const [teams] = await db.query(
      `SELECT t.*, tm.role AS member_role,
        (SELECT COUNT(*) FROM team_members WHERE team_id=t.id) AS member_count
       FROM teams t JOIN team_members tm ON t.id=tm.team_id
       WHERE tm.user_id=? ORDER BY tm.joined_at ASC`, [user.id]
    );

    const token = makeToken(user);
    delete user.password; delete user.reset_token; delete user.verify_token;
    res.json({ success: true, token, user, teams });

  } catch(err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ════════════════════════════════════════════════════════
router.post('/forgot-password', async (req, res) => {
  const { email: userEmail } = req.body;
  if (!userEmail)
    return res.status(400).json({ success: false, message: 'សូមបញ្ចូល Email' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email=?', [userEmail]);

    // Always return success (don't reveal if email exists)
    if (!rows.length)
      return res.json({ success: true, message: 'បើ Email នេះមាននៅក្នុងប្រព័ន្ធ — email reset នឹងត្រូវបានផ្ញើ' });

    const user       = rows[0];
    const resetToken = randomToken();
    const expires    = new Date(Date.now() + 3600000); // 1 hour

    await db.query('UPDATE users SET reset_token=?, reset_expires=? WHERE id=?',
      [resetToken, expires, user.id]);

    await email.sendPasswordResetEmail(user, resetToken);

    res.json({ success: true, message: 'បើ Email នេះមាននៅក្នុងប្រព័ន្ធ — email reset នឹងត្រូវបានផ្ញើ' });
  } catch(err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════
// VERIFY RESET TOKEN (check if valid before showing form)
// ════════════════════════════════════════════════════════
router.get('/reset-password/:token', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id,name,email FROM users WHERE reset_token=? AND reset_expires > NOW()',
      [req.params.token]
    );
    if (!rows.length)
      return res.status(400).json({ success: false, message: 'Token ផុតកំណត់ ឬ មិនត្រឹមត្រូវ' });
    res.json({ success: true, email: rows[0].email });
  } catch(err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════
// RESET PASSWORD
// ════════════════════════════════════════════════════════
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password)
    return res.status(400).json({ success: false, message: 'ព័ត៌មានមិនគ្រប់' });
  if (password.length < 6)
    return res.status(400).json({ success: false, message: 'ពាក្យសម្ងាត់យ៉ាងតិច 6 តួ' });

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE reset_token=? AND reset_expires > NOW()',
      [token]
    );
    if (!rows.length)
      return res.status(400).json({ success: false, message: 'Token ផុតកំណត់ ឬ មិនត្រឹមត្រូវ' });

    const user   = rows[0];
    const hashed = await bcrypt.hash(password, 12);

    await db.query(
      'UPDATE users SET password=?, reset_token=NULL, reset_expires=NULL WHERE id=?',
      [hashed, user.id]
    );

    await email.sendPasswordChangedEmail(user);

    res.json({ success: true, message: 'ពាក្យសម្ងាត់ត្រូវបានផ្លាស់ប្ដូរ ✅ — សូមចូលប្រើឡើងវិញ' });
  } catch(err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════
// ADMIN APPROVE / REJECT  (via email link or dashboard)
// ════════════════════════════════════════════════════════
router.get('/approve/:userId', async (req, res) => {
  const { action } = req.query; // approve | reject
  if (!['approve','reject'].includes(action))
    return res.status(400).send('Invalid action');

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id=?', [req.params.userId]);
    if (!rows.length) return res.status(404).send('User not found');

    const user = rows[0];
    if (action === 'approve') {
      await db.query("UPDATE users SET status='active' WHERE id=?", [user.id]);
      await email.sendAccountApprovedEmail(user);
      res.send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0f1e;color:#e8eeff">
        <h2>✅ អនុម័តជោគជ័យ!</h2>
        <p style="color:#9aacce">${user.name} (${user.email}) អាចចូលប្រើបានហើយ។</p>
        <a href="${process.env.APP_URL||''}" style="color:#4f8ef7">← ត្រឡប់ទៅ App</a>
        </body></html>`);
    } else {
      await db.query("UPDATE users SET status='suspended' WHERE id=?", [user.id]);
      await email.sendAccountRejectedEmail(user);
      res.send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0f1e;color:#e8eeff">
        <h2>❌ បដិសេធរួចហើយ</h2>
        <p style="color:#9aacce">${user.name} (${user.email}) ត្រូវបានបដិសេធ។</p>
        <a href="${process.env.APP_URL||''}" style="color:#4f8ef7">← ត្រឡប់ទៅ App</a>
        </body></html>`);
    }
  } catch(err) {
    res.status(500).send('Server error: ' + err.message);
  }
});

// Admin approve via API (from dashboard)
router.put('/approve/:userId', verifyToken, async (req, res) => {
  if (req.userRole !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin only' });

  const { action } = req.body; // approve | reject | suspend
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id=?', [req.params.userId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });

    const user = rows[0];
    const statusMap = { approve: 'active', reject: 'suspended', suspend: 'suspended' };
    const newStatus = statusMap[action];
    if (!newStatus) return res.status(400).json({ success: false, message: 'Invalid action' });

    await db.query('UPDATE users SET status=? WHERE id=?', [newStatus, user.id]);

    if (action === 'approve') await email.sendAccountApprovedEmail(user);
    if (action === 'reject')  await email.sendAccountRejectedEmail(user);

    res.json({ success: true, message: `User ${action}d` });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════
// GET PENDING USERS (admin dashboard)
// ════════════════════════════════════════════════════════
router.get('/pending', verifyToken, async (req, res) => {
  if (req.userRole !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin only' });
  try {
    const [users] = await db.query(
      "SELECT id,name,email,role,status,avatar_color,created_at FROM users WHERE status='pending' ORDER BY created_at DESC"
    );
    res.json({ success: true, users });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════
// GET ALL USERS (admin)
// ════════════════════════════════════════════════════════
router.get('/users', verifyToken, async (req, res) => {
  if (req.userRole !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin only' });
  try {
    const [users] = await db.query(
      'SELECT id,name,email,role,status,avatar_color,email_verified,created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, users });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════
// ME + PROFILE UPDATE
// ════════════════════════════════════════════════════════
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id,name,email,role,status,avatar_color,email_verified,created_at FROM users WHERE id=?',
      [req.userId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    const [teams] = await db.query(
      `SELECT t.*,(SELECT COUNT(*) FROM team_members WHERE team_id=t.id) AS member_count
       FROM teams t JOIN team_members tm ON t.id=tm.team_id WHERE tm.user_id=?`, [req.userId]
    );
    res.json({ success: true, user: rows[0], teams });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/profile', verifyToken, async (req, res) => {
  const { name, role } = req.body;
  try {
    await db.query('UPDATE users SET name=?,role=? WHERE id=?', [name, role, req.userId]);
    const [rows] = await db.query(
      'SELECT id,name,email,role,status,avatar_color FROM users WHERE id=?', [req.userId]
    );
    res.json({ success: true, user: rows[0] });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Change password (logged in)
router.put('/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ success: false, message: 'ព័ត៌មានមិនគ្រប់' });
  if (newPassword.length < 6)
    return res.status(400).json({ success: false, message: 'ពាក្យសម្ងាត់ថ្មីយ៉ាងតិច 6 តួ' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id=?', [req.userId]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(401).json({ success: false, message: 'ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវ' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password=? WHERE id=?', [hashed, req.userId]);
    await email.sendPasswordChangedEmail(rows[0]);
    res.json({ success: true, message: 'ពាក្យសម្ងាត់ត្រូវបានផ្លាស់ប្ដូរ ✅' });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;